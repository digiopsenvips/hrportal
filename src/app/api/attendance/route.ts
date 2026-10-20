import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { AttendanceRecord, AttendanceStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDatabase();
  return jsonResponse(db.attendance);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDatabase();

    // Support single record or bulk records
    // e.g. { meetingId, departmentId, markedById, records: [{ memberId, status, notes }] }
    if (Array.isArray(body.records)) {
      const { meetingId, departmentId, markedById, records } = body;
      if (!meetingId || !markedById) {
        return errorResponse('Meeting ID and Marker ID required for bulk attendance', 400);
      }

      const createdOrUpdated: AttendanceRecord[] = [];

      for (const item of records) {
        const existingIdx = db.attendance.findIndex(
          (a) => a.meetingId === meetingId && a.memberId === item.memberId
        );

        if (existingIdx !== -1) {
          // Update existing with audit log
          const old = db.attendance[existingIdx];
          const updated: AttendanceRecord = {
            ...old,
            status: item.status as AttendanceStatus,
            notes: item.notes || old.notes,
            auditTrail: [
              ...old.auditTrail,
              {
                timestamp: new Date().toISOString(),
                changedById: markedById,
                previousStatus: old.status,
                newStatus: item.status as AttendanceStatus,
                reason: item.reason || 'Bulk attendance update',
              },
            ],
          };
          db.attendance[existingIdx] = updated;
          createdOrUpdated.push(updated);
        } else {
          // Create new record
          const newRecord: AttendanceRecord = {
            id: `att-${Date.now()}-${item.memberId}`,
            meetingId,
            departmentId: departmentId || '',
            memberId: item.memberId,
            status: item.status as AttendanceStatus,
            markedById,
            markedAt: new Date().toISOString(),
            notes: item.notes || '',
            auditTrail: [],
          };
          db.attendance.push(newRecord);
          createdOrUpdated.push(newRecord);
        }
      }

      saveDatabase(db);
      return jsonResponse({ success: true, count: createdOrUpdated.length, records: createdOrUpdated });
    }

    // Single record entry
    const { meetingId, departmentId, memberId, status, markedById, notes } = body;
    if (!meetingId || !memberId || !status || !markedById) {
      return errorResponse('Missing required fields for attendance marking', 400);
    }

    const existingIdx = db.attendance.findIndex(
      (a) => a.meetingId === meetingId && a.memberId === memberId
    );

    if (existingIdx !== -1) {
      const old = db.attendance[existingIdx];
      const updated: AttendanceRecord = {
        ...old,
        status,
        notes: notes || old.notes,
        auditTrail: [
          ...old.auditTrail,
          {
            timestamp: new Date().toISOString(),
            changedById: markedById,
            previousStatus: old.status,
            newStatus: status,
            reason: body.reason || 'Updated via attendance sheet',
          },
        ],
      };
      db.attendance[existingIdx] = updated;
      saveDatabase(db);
      return jsonResponse(updated);
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      meetingId,
      departmentId: departmentId || '',
      memberId,
      status,
      markedById,
      markedAt: new Date().toISOString(),
      notes: notes || '',
      auditTrail: [],
    };

    db.attendance.push(newRecord);
    saveDatabase(db);
    return jsonResponse(newRecord, 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to record attendance', 500);
  }
}
