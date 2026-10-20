import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDatabase();
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get('memberId');

  if (memberId) {
    const userNotifs = db.notifications.filter((n) => n.recipientMemberId === memberId);
    return jsonResponse(userNotifs);
  }

  return jsonResponse(db.notifications);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDatabase();

    // Mark single notification read or mark all for a member
    if (body.markAll && body.memberId) {
      db.notifications.forEach((n) => {
        if (n.recipientMemberId === body.memberId) {
          n.isRead = true;
        }
      });
      saveDatabase(db);
      return jsonResponse({ success: true, message: 'All marked as read' });
    }

    if (body.id) {
      const notif = db.notifications.find((n) => n.id === body.id);
      if (notif) {
        notif.isRead = true;
        saveDatabase(db);
        return jsonResponse(notif);
      }
    }

    return errorResponse('Notification not found', 404);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update notification', 500);
  }
}
