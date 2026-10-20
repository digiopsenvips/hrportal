import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { hashPassword } from '@/lib/crypto';
import { Member } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, departmentId, branch, phone, collegeEnrollment } = await req.json();

    if (!name || !email || !password) {
      return errorResponse('Name, email, and password are required', 400);
    }

    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters long', 400);
    }

    const db = getDatabase();

    // Check duplicate
    const exists = db.members.some((m) => m.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return errorResponse(`An account with email ${email} already exists`, 409);
    }

    const year = new Date().getFullYear();
    const count = db.members.length + 1;
    const memberId = `ENVIPS-${year}-${String(count).padStart(3, '0')}`;

    const newMember: Member = {
      id: `mem-${Date.now()}`,
      memberId,
      name,
      email,
      passwordHash: hashPassword(password),
      authProvider: 'email',
      approvalStatus: 'PENDING', // STRICT GATE: Starts as PENDING
      membershipStatus: 'ACTIVE',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      collegeEnrollment: collegeEnrollment || 'Pending Verification',
      currentSemester: 1,
      academicYear: '1st Year',
      branch: branch || 'BBA / Tech',
      yearOfJoining: year,
      primaryDepartmentId: departmentId || 'digital-operations',
      role: 'general_member',
      roleTitle: 'Applicant (Pending Approval)',
      status: 'Active',
      phone: phone || '',
      createdAt: new Date().toISOString(),
    };

    db.members.push(newMember);

    // Notify all HR Admins of pending signup
    const hrAdmins = db.members.filter((m) => m.role === 'hr_head' || m.role === 'president');
    for (const hr of hrAdmins) {
      db.notifications.push({
        id: `notif-${Date.now()}-${hr.id}`,
        recipientMemberId: hr.id,
        title: 'New Member Approval Request',
        message: `${name} has registered and is pending approval in the HR Queue.`,
        type: 'System',
        link: '/members',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    saveDatabase(db);

    return jsonResponse(
      {
        success: true,
        message: 'Registration submitted successfully. Awaiting HR Administrator approval.',
        user: {
          id: newMember.id,
          name: newMember.name,
          email: newMember.email,
          approvalStatus: newMember.approvalStatus,
        },
      },
      201
    );
  } catch (err: any) {
    return errorResponse(err.message || 'Registration error', 500);
  }
}
