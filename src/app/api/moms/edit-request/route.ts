import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase, appendAuditLog } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { MOMEditRequest } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { momId, reason, proposedChanges, userId } = body;

    if (!momId || !reason || !userId) {
      return errorResponse('momId, reason, and userId are mandatory.', 400);
    }

    const db = getDatabase();
    const mom = db.moms.find((m) => m.id === momId);
    if (!mom) {
      return errorResponse('MOM not found', 404);
    }

    const user = db.members.find((m) => m.id === userId);
    const userName = user ? user.name : 'HR Representative';
    const userRole = user ? user.role : 'secondary_hr';

    const editRequestId = `edit-req-${Date.now()}`;
    const newRequest: MOMEditRequest = {
      id: editRequestId,
      momId,
      requestedById: userId,
      requestedByName: userName,
      requestedAt: new Date().toISOString(),
      reason,
      proposedChanges: proposedChanges || '',
      status: 'Pending',
    };

    if (!db.momEditRequests) {
      db.momEditRequests = [];
    }
    db.momEditRequests.unshift(newRequest);

    // Notify the HOD of the department
    const hod = db.members.find(
      (m) =>
        m.role === 'dept_head' &&
        (m.primaryDepartmentId === mom.departmentId || m.assignedDepartmentId === mom.departmentId)
    );

    if (hod) {
      db.notifications.push({
        id: `notif-edit-req-${Date.now()}`,
        recipientMemberId: hod.id,
        title: 'MOM Edit Request Pending Review',
        message: `${userName} requested an edit for published MOM "${mom.title}". Reason: ${reason}`,
        type: 'MOM',
        link: '/moms?tab=approvals',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    // Append to audit log
    appendAuditLog({
      correlationId: editRequestId,
      userId,
      userName,
      userRole,
      departmentId: mom.departmentId,
      action: 'MOM_EDIT_REQUEST',
      recordType: 'MOM',
      recordId: mom.id,
      reason,
      details: `HR requested edit permission on published MOM "${mom.title}". Changes: ${proposedChanges || 'N/A'}`,
    });

    saveDatabase(db);

    return jsonResponse({
      success: true,
      message: 'Edit request submitted to Department Head for 2-key approval.',
      request: newRequest,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to submit edit request', 500);
  }
}
