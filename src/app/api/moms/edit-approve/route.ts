import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase, appendAuditLog } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, status, reviewerComment, reviewerId } = body;

    if (!requestId || !status || !reviewerId) {
      return errorResponse('requestId, status, and reviewerId are required.', 400);
    }

    if (status !== 'Approved' && status !== 'Rejected') {
      return errorResponse('status must be either Approved or Rejected', 400);
    }

    const db = getDatabase();
    db.momEditRequests = db.momEditRequests || [];
    const requestIndex = db.momEditRequests.findIndex((r) => r.id === requestId);

    if (requestIndex === -1) {
      return errorResponse('Edit request not found', 404);
    }

    const request = db.momEditRequests[requestIndex];
    const reviewer = db.members.find((m) => m.id === reviewerId);
    const reviewerName = reviewer ? reviewer.name : 'Department Head';
    const reviewerRole = reviewer ? reviewer.role : 'dept_head';

    const momIndex = db.moms.findIndex((m) => m.id === request.momId);
    if (momIndex === -1) {
      return errorResponse('Associated MOM not found', 404);
    }

    const mom = db.moms[momIndex];

    request.status = status;
    request.reviewedById = reviewerId;
    request.reviewedByName = reviewerName;
    request.reviewedAt = new Date().toISOString();
    request.reviewerComment = reviewerComment || '';

    let unlockedUntil: string | undefined = undefined;

    if (status === 'Approved') {
      // 24-hour edit window from approval time
      const unlockExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      db.moms[momIndex].unlockedUntil = unlockExpiry;
      unlockedUntil = unlockExpiry;

      // Notify the requesting HR member
      db.notifications.push({
        id: `notif-edit-res-${Date.now()}`,
        recipientMemberId: request.requestedById,
        title: 'MOM Edit Request Approved',
        message: `Your request to edit "${mom.title}" was approved by ${reviewerName}. The document is unlocked for 24 hours.`,
        type: 'MOM',
        link: '/moms',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // Audit Log
      appendAuditLog({
        correlationId: request.id,
        userId: reviewerId,
        userName: reviewerName,
        userRole: reviewerRole,
        departmentId: mom.departmentId,
        action: 'MOM_EDIT_APPROVED',
        recordType: 'MOM',
        recordId: mom.id,
        reason: reviewerComment || 'Approved by Department Head',
        details: `MOM "${mom.title}" unlocked for 24 hours until ${unlockExpiry}.`,
      });
    } else {
      // Notify rejected
      db.notifications.push({
        id: `notif-edit-res-${Date.now()}`,
        recipientMemberId: request.requestedById,
        title: 'MOM Edit Request Rejected',
        message: `Your request to edit "${mom.title}" was rejected by ${reviewerName}. Note: ${reviewerComment || 'No comment provided.'}`,
        type: 'MOM',
        link: '/moms',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // Audit Log
      appendAuditLog({
        correlationId: request.id,
        userId: reviewerId,
        userName: reviewerName,
        userRole: reviewerRole,
        departmentId: mom.departmentId,
        action: 'MOM_EDIT_REJECTED',
        recordType: 'MOM',
        recordId: mom.id,
        reason: reviewerComment || 'Rejected by Department Head',
        details: `Edit request for MOM "${mom.title}" was rejected.`,
      });
    }

    saveDatabase(db);

    return jsonResponse({
      success: true,
      message: `Edit request ${status.toLowerCase()} successfully.`,
      request,
      unlockedUntil,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to process edit request', 500);
  }
}
