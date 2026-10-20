import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { Announcement } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDatabase();
  return jsonResponse(db.announcements);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, authorId, departmentId, isPinned, priority } = body;

    if (!title || !content || !authorId) {
      return errorResponse('Missing required announcement fields', 400);
    }

    const db = getDatabase();
    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      authorId,
      departmentId: departmentId || 'ALL',
      isPinned: Boolean(isPinned),
      priority: priority || 'Normal',
      createdAt: new Date().toISOString(),
    };

    db.announcements.unshift(newAnnouncement);

    // Notify society members
    const targetMembers =
      newAnnouncement.departmentId === 'ALL'
        ? db.members
        : db.members.filter(
            (m) =>
              m.primaryDepartmentId === newAnnouncement.departmentId ||
              m.assignedDepartmentId === newAnnouncement.departmentId
          );

    for (const member of targetMembers) {
      db.notifications.push({
        id: `notif-${Date.now()}-${member.id}`,
        recipientMemberId: member.id,
        title: `Announcement: ${newAnnouncement.title}`,
        message: newAnnouncement.content.slice(0, 100) + '...',
        type: 'Announcement',
        link: '/announcements',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    saveDatabase(db);
    return jsonResponse(newAnnouncement, 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to post announcement', 500);
  }
}
