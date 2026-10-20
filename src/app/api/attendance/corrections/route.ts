import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { AttendanceCorrectionRequest } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDatabase();
  return jsonResponse(db.correctionRequests);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attendanceId, meetingId, memberId, currentStatus, requestedStatus, reason, proofUrl } = body;

    if (!attendanceId || !meetingId || !memberId || !requestedStatus || !reason) {
      return errorResponse('Missing required fields for attendance correction request', 400);
    }

    const db = getDatabase();

    const newRequest: AttendanceCorrectionRequest = {
      id: `cor-${Date.now()}`,
      attendanceId,
      meetingId,
      memberId,
      currentStatus: currentStatus || 'Absent',
      requestedStatus,
      reason,
      proofUrl: proofUrl || '',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    db.correctionRequests.push(newRequest);

    // Notify HR Head & Secondary HR
    const hrHeads = db.members.filter((m) => m.role === 'hr_head');
    for (const hr of hrHeads) {
      db.notifications.push({
        id: `notif-${Date.now()}-${hr.id}`,
        recipientMemberId: hr.id,
        title: 'Attendance Correction Request',
        message: `Member has submitted a correction request for meeting #${meetingId}.`,
        type: 'Attendance',
        link: '/attendance',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    saveDatabase(db);
    return jsonResponse(newRequest, 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to submit correction request', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, reviewedById } = body; // action: 'Approved' | 'Rejected'

    if (!id || !action || !reviewedById) {
      return errorResponse('Missing request ID, action, or reviewer ID', 400);
    }

    const db = getDatabase();
    const reqIndex = db.correctionRequests.findIndex((r) => r.id === id);
    if (reqIndex === -1) {
      return errorResponse('Correction request not found', 404);
    }

    const request = db.correctionRequests[reqIndex];
    request.status = action;
    request.reviewedById = reviewedById;
    request.reviewedAt = new Date().toISOString();

    // If approved, update the official attendance record!
    if (action === 'Approved') {
      const attIdx = db.attendance.findIndex((a) => a.id === request.attendanceId);
      if (attIdx !== -1) {
        const oldAtt = db.attendance[attIdx];
        db.attendance[attIdx] = {
          ...oldAtt,
          status: request.requestedStatus,
          auditTrail: [
            ...oldAtt.auditTrail,
            {
              timestamp: new Date().toISOString(),
              changedById: reviewedById,
              previousStatus: oldAtt.status,
              newStatus: request.requestedStatus,
              reason: `Approved attendance correction request: ${request.reason}`,
            },
          ],
        };
      }
    }

    // Notify member of decision
    db.notifications.push({
      id: `notif-${Date.now()}-${request.memberId}`,
      recipientMemberId: request.memberId,
      title: `Attendance Correction ${action}`,
      message: `Your attendance correction request has been ${action.toLowerCase()} by leadership.`,
      type: 'Attendance',
      link: '/attendance',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    saveDatabase(db);
    return jsonResponse({ success: true, request });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to review correction request', 500);
  }
}
