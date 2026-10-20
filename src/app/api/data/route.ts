import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDatabase();
    return jsonResponse({
      departments: db.departments,
      members: db.members,
      meetings: db.meetings,
      moms: db.moms,
      attendance: db.attendance,
      correctionRequests: db.correctionRequests,
      tasks: db.tasks,
      events: db.events,
      announcements: db.announcements,
      notifications: db.notifications,
      settings: db.settings,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch society data', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDatabase();

    // Reset to defaults if requested
    if (body.action === 'RESET_DATABASE') {
      const {
        INITIAL_DEPARTMENTS,
        INITIAL_SETTINGS,
        INITIAL_MEMBERS,
        INITIAL_MEETINGS,
        INITIAL_MOMS,
        INITIAL_ATTENDANCE,
        INITIAL_CORRECTION_REQUESTS,
        INITIAL_TASKS,
        INITIAL_EVENTS,
        INITIAL_ANNOUNCEMENTS,
        INITIAL_NOTIFICATIONS,
      } = await import('@/lib/seed-data');

      const resetDb = {
        departments: INITIAL_DEPARTMENTS,
        members: INITIAL_MEMBERS,
        meetings: INITIAL_MEETINGS,
        moms: INITIAL_MOMS,
        attendance: INITIAL_ATTENDANCE,
        correctionRequests: INITIAL_CORRECTION_REQUESTS,
        tasks: INITIAL_TASKS,
        events: INITIAL_EVENTS,
        announcements: INITIAL_ANNOUNCEMENTS,
        notifications: INITIAL_NOTIFICATIONS,
        settings: INITIAL_SETTINGS,
      };
      saveDatabase(resetDb);
      return jsonResponse({ success: true, message: 'Database reset to initial seed data', data: resetDb });
    }

    return errorResponse('Invalid action', 400);
  } catch (err: any) {
    return errorResponse(err.message || 'Error processing request', 500);
  }
}
