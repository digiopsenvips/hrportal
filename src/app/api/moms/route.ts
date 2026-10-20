import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { MOM, Task } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDatabase();
  return jsonResponse(db.moms);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      meetingId,
      departmentId,
      title,
      meetingDate,
      startTime,
      endTime,
      meetingType,
      location,
      agenda,
      objectives,
      attendeeIds,
      absenteeIds,
      discussionPoints,
      decisionsMade,
      actionItems,
      preparedById,
      publicationStatus,
    } = body;

    if (!title || !departmentId || !preparedById) {
      return errorResponse('Missing required fields for MOM', 400);
    }

    const db = getDatabase();
    const momId = `mom-${Date.now()}`;

    // Process action items: automatically generate connected tasks in the task board!
    const generatedActionItems = (actionItems || []).map((item: any, idx: number) => {
      const taskId = `task-mom-${Date.now()}-${idx}`;
      const newTask: Task = {
        id: taskId,
        title: item.description || 'Action item from MOM',
        description: `Action item originating from MOM: "${title}" held on ${meetingDate || new Date().toISOString().split('T')[0]}.`,
        category: 'MOM Preparation',
        departmentId,
        assignedMemberId: item.assigneeId,
        createdById: preparedById,
        priority: 'High',
        status: 'To Do',
        deadline: item.deadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        estimatedEffortHours: 4,
        actualEffortHours: 0,
        isVerified: false,
        momId,
        createdAt: new Date().toISOString(),
      };
      db.tasks.push(newTask);

      // Notify assignee of the new action item task
      if (item.assigneeId) {
        db.notifications.push({
          id: `notif-task-${Date.now()}-${item.assigneeId}`,
          recipientMemberId: item.assigneeId,
          title: 'New Action Item Assigned from MOM',
          message: `You were assigned: "${item.description}" from meeting "${title}".`,
          type: 'Task',
          link: '/tasks',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      return {
        id: item.id || `act-${Date.now()}-${idx}`,
        description: item.description,
        assigneeId: item.assigneeId,
        deadline: item.deadline,
        taskId,
      };
    });

    const newMOM: MOM = {
      id: momId,
      meetingId: meetingId || '',
      departmentId,
      title,
      meetingDate: meetingDate || new Date().toISOString().split('T')[0],
      startTime: startTime || '15:00',
      endTime: endTime || '16:00',
      meetingType: meetingType || 'Online',
      location: location || '',
      agenda: agenda || '',
      objectives: objectives || '',
      attendeeIds: attendeeIds || [],
      absenteeIds: absenteeIds || [],
      discussionPoints: discussionPoints || [],
      decisionsMade: decisionsMade || [],
      actionItems: generatedActionItems,
      preparedById,
      publicationStatus: publicationStatus || 'Draft',
      revisionHistory: [
        {
          timestamp: new Date().toISOString(),
          editorId: preparedById,
          note: 'MOM drafted.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.moms.push(newMOM);

    // Update associated meeting status and hasMom flag
    if (meetingId) {
      const meetIdx = db.meetings.findIndex((m) => m.id === meetingId);
      if (meetIdx !== -1) {
        db.meetings[meetIdx].hasMom = true;
        db.meetings[meetIdx].status = 'Completed';
      }
    }

    saveDatabase(db);
    return jsonResponse(newMOM, 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create MOM', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return errorResponse('MOM ID required', 400);
    }

    const db = getDatabase();
    const index = db.moms.findIndex((m) => m.id === body.id);
    if (index === -1) {
      return errorResponse('MOM not found', 404);
    }

    const current = db.moms[index];
    const isNowPublished =
      body.publicationStatus === 'Published' && current.publicationStatus !== 'Published';

    const revisionNote = body.editorNote || (isNowPublished ? 'MOM Approved & Published' : 'MOM updated');
    const editorId = body.editorId || body.reviewedById || current.preparedById;

    const updatedRevisions = [
      ...current.revisionHistory,
      {
        timestamp: new Date().toISOString(),
        editorId,
        note: revisionNote,
      },
    ];

    const updated: MOM = {
      ...current,
      ...body,
      id: current.id,
      revisionHistory: updatedRevisions,
      updatedAt: new Date().toISOString(),
    };

    db.moms[index] = updated;

    // If published, notify participants and leadership
    if (isNowPublished) {
      const recipientIds = Array.from(new Set([
        ...updated.attendeeIds,
        ...db.members
          .filter((m) => ['president', 'vp_1', 'vp_2', 'vp_3', 'secretary'].includes(m.role))
          .map((m) => m.id),
      ]));

      for (const recId of recipientIds) {
        db.notifications.push({
          id: `notif-${Date.now()}-${recId}`,
          recipientMemberId: recId,
          title: 'MOM Published',
          message: `Meeting Minutes for "${updated.title}" have been officially published.`,
          type: 'MOM',
          link: '/moms',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    saveDatabase(db);
    return jsonResponse(updated);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update MOM', 500);
  }
}
