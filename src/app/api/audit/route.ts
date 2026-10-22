import { NextRequest } from 'next/server';
import { getDatabase, appendAuditLog } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionUserId = req.cookies.get('enactus_session_user_id')?.value || req.headers.get('x-user-id') || req.nextUrl.searchParams.get('viewerId');

    if (!sessionUserId) {
      return errorResponse('Unauthorized: Please log in to view audit logs.', 401);
    }

    const db = getDatabase();
    const user = db.members.find((m) => m.id === sessionUserId);

    if (!user) {
      return errorResponse('Unauthorized: User record not found.', 401);
    }

    // Role-based permission enforcement:
    // Developer & President: access to all audit logs
    // HOD (dept_head): access strictly to audit logs of their own department
    // HR & General Member: strictly forbidden
    const isDeveloper = user.role === 'developer' || user.role === 'president';
    const isHOD = user.role === 'dept_head';

    if (!isDeveloper && !isHOD) {
      return errorResponse('Forbidden: HR and general members are not permitted to access audit logs.', 403);
    }

    let logs = db.auditLogs || [];

    // If HOD, strictly filter to their department
    if (isHOD && !isDeveloper) {
      const userDept = user.primaryDepartmentId || user.assignedDepartmentId;
      logs = logs.filter((log) => log.departmentId === userDept);
    }

    // Apply optional URL filters
    const searchParams = req.nextUrl.searchParams;
    const filterDept = searchParams.get('departmentId');
    const filterAction = searchParams.get('action');
    const filterRecordType = searchParams.get('recordType');
    const filterUser = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (filterDept && filterDept !== 'ALL') {
      logs = logs.filter((l) => l.departmentId === filterDept);
    }
    if (filterAction && filterAction !== 'ALL') {
      logs = logs.filter((l) => l.action.toLowerCase() === filterAction.toLowerCase());
    }
    if (filterRecordType && filterRecordType !== 'ALL') {
      logs = logs.filter((l) => l.recordType.toLowerCase() === filterRecordType.toLowerCase());
    }
    if (filterUser && filterUser !== 'ALL') {
      logs = logs.filter((l) => l.userId === filterUser);
    }
    if (startDate) {
      logs = logs.filter((l) => new Date(l.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      logs = logs.filter((l) => new Date(l.timestamp) <= new Date(endDate));
    }

    return jsonResponse({
      success: true,
      logs,
      viewerRole: user.role,
      isDeveloper,
      isHOD,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Error retrieving audit logs', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      userName,
      userRole,
      departmentId,
      action,
      recordType,
      recordId,
      changedFields,
      reason,
      details,
      correlationId,
    } = body;

    if (!action || !recordType) {
      return errorResponse('action and recordType are required fields', 400);
    }

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';

    const entry = appendAuditLog({
      correlationId,
      userId: userId || 'system',
      userName: userName || 'System User',
      userRole: userRole || 'system',
      departmentId,
      action,
      recordType,
      recordId,
      changedFields,
      reason,
      details,
      ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '127.0.0.1',
    });

    return jsonResponse({
      success: true,
      entry,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Error recording audit log entry', 500);
  }
}
