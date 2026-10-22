import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase, appendAuditLog } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { MOM, Task } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDatabase();
    const sessionUserId =
      req.cookies.get('enactus_session_user_id')?.value ||
      req.headers.get('x-user-id') ||
      req.nextUrl.searchParams.get('viewerId');

    let user = sessionUserId ? db.members.find((m) => m.id === sessionUserId) : null;
    let moms = db.moms || [];

    // If viewer is identified as a general member, strictly filter:
    // Only published MOMs belonging to their primary or assigned department
    if (user && user.role === 'general_member') {
      const userDept = user.primaryDepartmentId || user.assignedDepartmentId;
      moms = moms.filter(
        (m) =>
          (m.departmentId === userDept || m.departmentId === 'ALL') &&
          m.publicationStatus === 'Published'
      );
    } else if (user && user.role === 'dept_head') {
      // HOD sees all MOMs (Draft & Published) for their department
      const userDept = user.primaryDepartmentId || user.assignedDepartmentId;
      moms = moms.filter((m) => m.departmentId === userDept || m.departmentId === 'ALL');
    }

    return jsonResponse({
      moms,
      editRequests: db.momEditRequests || [],
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch MOMs', 500);
  }
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
      return errorResponse('Missing required fields for MOM (title, departmentId, preparedById)', 400);
    }

    const db = getDatabase();
    const momId = `mom-${Date.now()}`;
    const preparedBy = db.members.find((m) => m.id === preparedById);
    const preparedByName = preparedBy ? preparedBy.name : 'HR Team';
    const preparedByRole = preparedBy ? preparedBy.role : 'secondary_hr';

    // Process action items: automatically generate connected tasks in the task board!
    const generatedActionItems = (actionItems || []).map((item: any, idx: number) => {
      const taskId = `task-mom-${Date.now()}-${idx}`;
      const newTask: Task = {
        id: taskId,
        title: item.description || 'Action item from MOM',
        description: `Action item originating from MOM: "${title}" held on ${
          meetingDate || new Date().toISOString().split('T')[0]
        }.`,
        category: 'MOM Preparation',
        departmentId,
        assignedMemberId: item.assigneeId,
        createdById: preparedById,
        priority: 'High',
        status: (item.status === 'Completed' ? 'Completed' : 'To Do') as any,
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
        status: item.status || 'Not Started',
      };
    });

    const isPublished = publicationStatus === 'Published';

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
      isEditedAfterPublishing: false,
      revisionHistory: [
        {
          timestamp: new Date().toISOString(),
          editorId: preparedById,
          note: isPublished ? 'MOM created and published.' : 'Initial draft created.',
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

    // Append to audit log
    appendAuditLog({
      userId: preparedById,
      userName: preparedByName,
      userRole: preparedByRole,
      departmentId,
      action: isPublished ? 'MOM_PUBLISH' : 'MOM_CREATE',
      recordType: 'MOM',
      recordId: newMOM.id,
      details: `MOM "${newMOM.title}" created with status ${newMOM.publicationStatus}.`,
    });

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
    const editorId = body.editorId || body.reviewedById || current.preparedById;
    const editor = db.members.find((m) => m.id === editorId);
    const editorName = editor ? editor.name : 'Authorized Editor';
    const editorRole = editor ? editor.role : 'secondary_hr';

    // 2-Key Publication Safeguard:
    // If the MOM was already published, verify if it is unlocked via an approved edit request
    const isAlreadyPublished = current.publicationStatus === 'Published';
    const isNowPublishing = body.publicationStatus === 'Published' && !isAlreadyPublished;

    if (isAlreadyPublished && !isNowPublishing) {
      const isUnlocked = current.unlockedUntil && new Date(current.unlockedUntil) > new Date();
      // Allow President / VP / Developer bypass if needed, but HR must be unlocked
      const canBypassLock = editor?.role === 'president' || editor?.role === 'developer';
      if (!isUnlocked && !canBypassLock) {
        return errorResponse(
          'This published MOM is locked. HR must submit an Edit Request and obtain Department Head approval to make modifications.',
          403
        );
      }
    }

    const isEditedAfterPublishing =
      current.isEditedAfterPublishing || (isAlreadyPublished && !isNowPublishing);

    const revisionNote =
      body.editorNote ||
      (isNowPublishing
        ? 'MOM Approved & Published'
        : isEditedAfterPublishing
        ? 'MOM updated after approved edit request'
        : 'MOM updated');

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
      isEditedAfterPublishing,
      revisionHistory: updatedRevisions,
      updatedAt: new Date().toISOString(),
    };

    db.moms[index] = updated;

    // Audit log
    appendAuditLog({
      userId: editorId,
      userName: editorName,
      userRole: editorRole,
      departmentId: current.departmentId,
      action: isNowPublishing
        ? 'MOM_PUBLISH'
        : isEditedAfterPublishing
        ? 'MOM_EDIT_AFTER_PUBLISH'
        : 'MOM_UPDATE',
      recordType: 'MOM',
      recordId: current.id,
      reason: body.editorNote || (isNowPublishing ? 'Published official minutes' : 'Content update'),
      details: isEditedAfterPublishing
        ? `Published MOM "${current.title}" modified within approved 24hr window.`
        : `MOM "${current.title}" updated.`,
    });

    // If published, notify participants and leadership
    if (isNowPublishing) {
      const recipientIds = Array.from(
        new Set([
          ...updated.attendeeIds,
          ...db.members
            .filter((m) => ['president', 'vp_1', 'vp_2', 'vp_3', 'secretary', 'dept_head'].includes(m.role))
            .map((m) => m.id),
        ])
      );

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
