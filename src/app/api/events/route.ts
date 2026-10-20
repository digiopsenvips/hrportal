import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { SocietyEvent } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDatabase();
  return jsonResponse(db.events);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      organizingDepartmentId,
      supportingHrIds,
      organizerIds,
      venue,
      startDateTime,
      endDateTime,
      checklist,
    } = body;

    if (!title || !organizingDepartmentId || !venue || !startDateTime || !endDateTime) {
      return errorResponse('Missing required fields for event creation', 400);
    }

    const db = getDatabase();
    const newEvent: SocietyEvent = {
      id: `evt-${Date.now()}`,
      title,
      description: description || '',
      organizingDepartmentId,
      supportingHrIds: supportingHrIds || [],
      organizerIds: organizerIds || [],
      venue,
      startDateTime,
      endDateTime,
      checklist: (checklist || []).map((c: any, idx: number) => ({
        id: c.id || `chk-${Date.now()}-${idx}`,
        task: c.task,
        isCompleted: Boolean(c.isCompleted),
        assignedTo: c.assignedTo || undefined,
      })),
      isArchived: false,
      createdAt: new Date().toISOString(),
    };

    db.events.push(newEvent);

    // Notify organizers & supporting HRs
    const attendees = Array.from(new Set([...newEvent.organizerIds, ...newEvent.supportingHrIds]));
    for (const memberId of attendees) {
      db.notifications.push({
        id: `notif-${Date.now()}-${memberId}`,
        recipientMemberId: memberId,
        title: 'New Society Event Scheduled',
        message: `Event "${newEvent.title}" has been scheduled at ${newEvent.venue}.`,
        type: 'Announcement',
        link: '/events',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    saveDatabase(db);
    return jsonResponse(newEvent, 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create event', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return errorResponse('Event ID required', 400);
    }

    const db = getDatabase();
    const index = db.events.findIndex((e) => e.id === body.id);
    if (index === -1) {
      return errorResponse('Event not found', 404);
    }

    const updated: SocietyEvent = {
      ...db.events[index],
      ...body,
      id: db.events[index].id,
    };

    db.events[index] = updated;
    saveDatabase(db);
    return jsonResponse(updated);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update event', 500);
  }
}
