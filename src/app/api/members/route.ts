import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { Member } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const db = getDatabase();
  return jsonResponse(db.members);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDatabase();

    // Validate required fields
    if (!body.name || !body.email || !body.primaryDepartmentId) {
      return errorResponse('Missing required fields (Name, Email, Primary Department)', 400);
    }

    // Check duplicate email or enrollment
    const emailExists = db.members.some((m) => m.email.toLowerCase() === body.email.toLowerCase());
    if (emailExists) {
      return errorResponse(`Member with email "${body.email}" already exists`, 409);
    }

    if (body.collegeEnrollment) {
      const enrollmentExists = db.members.some(
        (m) => m.collegeEnrollment === body.collegeEnrollment
      );
      if (enrollmentExists) {
        return errorResponse(`Member with enrollment "${body.collegeEnrollment}" already exists`, 409);
      }
    }

    // Generate unique memberId if not provided
    const year = body.yearOfJoining || new Date().getFullYear();
    const count = db.members.length + 1;
    const memberId = body.memberId || `ENVIPS-${year}-${String(count).padStart(3, '0')}`;

    const newMember: Member = {
      id: `mem-${Date.now()}`,
      memberId,
      name: body.name,
      email: body.email,
      avatar: body.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(body.name)}`,
      collegeEnrollment: body.collegeEnrollment || 'N/A',
      jeeRank: body.jeeRank ? Number(body.jeeRank) : null,
      currentSemester: Number(body.currentSemester) || 3,
      academicYear: body.academicYear || '2nd Year',
      branch: body.branch || 'General',
      yearOfJoining: Number(body.yearOfJoining) || new Date().getFullYear(),
      primaryDepartmentId: body.primaryDepartmentId,
      additionalDepartmentId: body.additionalDepartmentId || null,
      role: body.role || 'general_member',
      roleTitle: body.roleTitle || 'General Member',
      assignedDepartmentId: body.assignedDepartmentId || null,
      assignedSecondaryHrId: body.assignedSecondaryHrId || null,
      status: body.status || 'Active',
      phone: body.phone || '',
      bio: body.bio || '',
      createdAt: new Date().toISOString(),
    };

    db.members.push(newMember);

    // Also add an onboarding notification
    db.notifications.push({
      id: `notif-${Date.now()}`,
      recipientMemberId: newMember.id,
      title: 'Welcome to Enactus VIPS-TC',
      message: `Your society portal account has been provisioned. Department: ${newMember.primaryDepartmentId}.`,
      type: 'System',
      link: '/dashboard',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    saveDatabase(db);
    return jsonResponse(newMember, 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create member', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return errorResponse('Member ID required', 400);
    }

    const db = getDatabase();
    const index = db.members.findIndex((m) => m.id === body.id);
    if (index === -1) {
      return errorResponse('Member not found', 404);
    }

    const current = db.members[index];
    const updated: Member = {
      ...current,
      ...body,
      id: current.id, // prevent id modification
      updatedAt: new Date().toISOString(),
    };

    db.members[index] = updated;
    saveDatabase(db);
    return jsonResponse(updated);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update member', 500);
  }
}
