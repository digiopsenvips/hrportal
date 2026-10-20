import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { Meeting } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDatabase();
  return jsonResponse(db.meetings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      departmentId,
      date,
      startTime,
      endTime,
      mode,
      location,
      meetingLink,
      agenda,
      objectives,
      organizerId,
      attendeeMemberIds,
    } = body;

    if (!title || !departmentId || !date || !startTime || !endTime || !organizerId) {
      return errorResponse('Missing required fields for scheduling a meeting', 400);
    }

    const db = getDatabase();

    // Conflict detection:
    // Check if any existing active scheduled meeting on the same date overlaps in time and shares the same offline venue or has overlapping participants
    const conflicts = db.meetings.filter((m) => {
      if (m.date !== date || m.status === 'Cancelled') return false;

      // Overlap condition: start1 < end2 && end1 > start2
      const overlapsInTime = startTime < m.endTime && endTime > m.startTime;
      if (!overlapsInTime) return false;

      // Check venue conflict for offline/hybrid
      if (
        (mode === 'Offline' || mode === 'Hybrid') &&
        (m.mode === 'Offline' || m.mode === 'Hybrid') &&
        location.trim().toLowerCase() === m.location.trim().toLowerCase()
      ) {
        return true;
      }

      // Check participant conflict
      const commonAttendees = (attendeeMemberIds || []).filter((id: string) =>
        m.attendeeMemberIds.includes(id)
      );
      if (commonAttendees.length > 0 && commonAttendees.includes(organizerId)) {
        return true;
      }

      return false;
    });

    if (conflicts.length > 0 && !body.ignoreConflict) {
      return jsonResponse(
        {
          error: 'MEETING_CONFLICT',
          message: `Conflict detected with existing meeting "${conflicts[0].title}" (${conflicts[0].startTime} - ${conflicts[0].endTime} at ${conflicts[0].location}). Set ignoreConflict: true to override.`,
          conflicts,
        },
        409
      );
    }

    const newMeeting: Meeting = {
      id: `meet-${Date.now()}`,
      title,
      departmentId,
      date,
      startTime,
      endTime,
      mode: mode || 'Online',
      location: location || 'Online Meeting',
      meetingLink: meetingLink || '',
      agenda: agenda || '',
      objectives: objectives || '',
      organizerId,
      attendeeMemberIds: attendeeMemberIds || [],
      status: 'Scheduled',
      hasMom: false,
      createdAt: new Date().toISOString(),
    };

    db.meetings.push(newMeeting);

    // Notify all invited attendees
    for (const attendeeId of newMeeting.attendeeMemberIds) {
      db.notifications.push({
        id: `notif-${Date.now()}-${attendeeId}`,
        recipientMemberId: attendeeId,
        title: 'New Meeting Scheduled',
        message: `You are invited to "${newMeeting.title}" on ${newMeeting.date} at ${newMeeting.startTime}.`,
        type: 'Meeting',
        link: '/calendar',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    saveDatabase(db);
    return jsonResponse(newMeeting, 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create meeting', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return errorResponse('Meeting ID required', 400);
    }

    const db = getDatabase();
    const index = db.meetings.findIndex((m) => m.id === body.id);
    if (index === -1) {
      return errorResponse('Meeting not found', 404);
    }

    const current = db.meetings[index];
    const isCancelled = body.status === 'Cancelled' && current.status !== 'Cancelled';
    const isRescheduled =
      (body.date && body.date !== current.date) ||
      (body.startTime && body.startTime !== current.startTime);

    const updated: Meeting = {
      ...current,
      ...body,
      id: current.id,
    };

    db.meetings[index] = updated;

    // Send notifications if cancelled or rescheduled
    if (isCancelled || isRescheduled) {
      for (const attendeeId of updated.attendeeMemberIds) {
        db.notifications.push({
          id: `notif-${Date.now()}-${attendeeId}`,
          recipientMemberId: attendeeId,
          title: isCancelled ? 'Meeting Cancelled' : 'Meeting Rescheduled',
          message: isCancelled
            ? `Meeting "${updated.title}" scheduled for ${updated.date} has been cancelled.`
            : `Meeting "${updated.title}" has been rescheduled to ${updated.date} at ${updated.startTime}.`,
          type: 'Meeting',
          link: '/calendar',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    saveDatabase(db);
    return jsonResponse(updated);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update meeting', 500);
  }
}
