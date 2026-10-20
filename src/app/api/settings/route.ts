import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDatabase();
  return jsonResponse(db.settings);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDatabase();

    db.settings = {
      ...db.settings,
      ...body,
      leaderboardWeights: {
        ...db.settings.leaderboardWeights,
        ...(body.leaderboardWeights || {}),
      },
      attendanceFormula: {
        ...db.settings.attendanceFormula,
        ...(body.attendanceFormula || {}),
      },
      directoryPrivacy: {
        ...db.settings.directoryPrivacy,
        ...(body.directoryPrivacy || {}),
      },
    };

    saveDatabase(db);
    return jsonResponse(db.settings);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update settings', 500);
  }
}
