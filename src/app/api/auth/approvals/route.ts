import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { action, memberId, adminId, reason } = await req.json();

    if (!action || !memberId || !adminId) {
      return errorResponse('Action, memberId, and adminId are required', 400);
    }

    const db = getDatabase();

    // Verify requesting user has HR Admin privileges
    const admin = db.members.find((m) => m.id === adminId);
    if (!admin || !['president', 'hr_head', 'secretary'].includes(admin.role)) {
      return errorResponse('Unauthorized: Only HR Administrators can manage approvals and member lifecycle', 403);
    }

    const targetIdx = db.members.findIndex((m) => m.id === memberId);
    if (targetIdx === -1) {
      return errorResponse('Target member not found', 404);
    }

    const target = db.members[targetIdx];

    if (action === 'APPROVE') {
      target.approvalStatus = 'APPROVED';
      target.membershipStatus = 'ACTIVE';
      target.roleTitle = 'Active Member';
      target.statusChangeReason = reason || `Approved by ${admin.name}`;
      target.statusChangedAt = new Date().toISOString();

      db.notifications.push({
        id: `notif-${Date.now()}-${target.id}`,
        recipientMemberId: target.id,
        title: 'Membership Approved!',
        message: 'Your registration has been approved by the HR team. Welcome to Enactus VIPS-TC!',
        type: 'System',
        link: '/dashboard',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } else if (action === 'REJECT') {
      target.approvalStatus = 'REJECTED';
      target.statusChangeReason = reason || `Application rejected by ${admin.name}`;
      target.statusChangedAt = new Date().toISOString();
    } else if (action === 'SUSPEND') {
      target.membershipStatus = 'SUSPENDED';
      target.statusChangeReason = reason || `Account suspended by ${admin.name}`;
      target.statusChangedAt = new Date().toISOString();
    } else if (action === 'REACTIVATE') {
      target.membershipStatus = 'ACTIVE';
      target.statusChangeReason = reason || `Account reactivated by ${admin.name}`;
      target.statusChangedAt = new Date().toISOString();
    } else if (action === 'TERMINATE') {
      target.membershipStatus = 'TERMINATED';
      target.statusChangeReason = reason || `Membership terminated by ${admin.name}`;
      target.statusChangedAt = new Date().toISOString();
    } else {
      return errorResponse('Invalid action specified', 400);
    }

    saveDatabase(db);
    return jsonResponse({ success: true, message: `Action ${action} completed successfully`, member: target });
  } catch (err: any) {
    return errorResponse(err.message || 'Lifecycle management error', 500);
  }
}
