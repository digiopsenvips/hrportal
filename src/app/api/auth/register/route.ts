import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { hashPassword } from '@/lib/crypto';
import { Member } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      branch,
      designation,
      collegeEnrollment,
      yearInSociety,
      departmentId,
      password,
    } = body;

    // 1. Server-side validation of all required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return errorResponse('Full name is required', 400);
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return errorResponse('Email address is required', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return errorResponse('Invalid email address format', 400);
    }

    if (!branch || typeof branch !== 'string' || !branch.trim()) {
      return errorResponse('Academic branch is required', 400);
    }

    if (!designation || typeof designation !== 'string' || !designation.trim()) {
      return errorResponse('Society designation is required', 400);
    }

    if (!collegeEnrollment || String(collegeEnrollment).trim().length < 3) {
      return errorResponse('Valid college enrollment number is required', 400);
    }

    if (!yearInSociety || typeof yearInSociety !== 'string' || !yearInSociety.trim()) {
      return errorResponse('Year in society is required', 400);
    }

    if (!departmentId || typeof departmentId !== 'string' || !departmentId.trim()) {
      return errorResponse('Department selection is required', 400);
    }

    const db = getDatabase();

    // 2. Prevent duplicate registrations: Check email
    const trimmedEmail = email.trim().toLowerCase();
    const emailExists = db.members.some((m) => m.email.toLowerCase() === trimmedEmail);
    if (emailExists) {
      return errorResponse(`An account with email "${email.trim()}" is already registered.`, 409);
    }

    // 3. Prevent duplicate registrations: Check enrollment number
    const trimmedEnroll = String(collegeEnrollment).trim().toLowerCase();
    const enrollExists = db.members.some(
      (m) => m.collegeEnrollment && m.collegeEnrollment.toLowerCase() === trimmedEnroll
    );
    if (enrollExists) {
      return errorResponse(
        `A member with enrollment number "${String(collegeEnrollment).trim()}" is already registered.`,
        409
      );
    }

    // 4. Calculate semester and joining year based on Year in Society
    const currentYear = new Date().getFullYear();
    let currentSemester = 1;
    let yearOfJoining = currentYear;

    if (yearInSociety.includes('2nd') || yearInSociety.includes('2')) {
      currentSemester = 3;
      yearOfJoining = currentYear - 1;
    } else if (yearInSociety.includes('3rd') || yearInSociety.includes('3')) {
      currentSemester = 5;
      yearOfJoining = currentYear - 2;
    } else if (yearInSociety.includes('4th') || yearInSociety.includes('4')) {
      currentSemester = 7;
      yearOfJoining = currentYear - 3;
    }

    const count = db.members.length + 1;
    const memberId = `ENVIPS-${currentYear}-${String(count).padStart(3, '0')}`;

    // 5. SECURITY & ROLE INTEGRITY:
    // Public registrants are ALWAYS forced to role: 'general_member' and approvalStatus: 'PENDING'
    // Never allow a user to assign themselves an administrative role through an open form field.
    const newMember: Member = {
      id: `mem-${Date.now()}`,
      memberId,
      name: name.trim(),
      email: trimmedEmail,
      passwordHash: hashPassword(password || 'Admin@123'),
      authProvider: 'email',
      approvalStatus: 'PENDING', // STRICT GATE: Starts as PENDING
      membershipStatus: 'ACTIVE',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
      collegeEnrollment: String(collegeEnrollment).trim(),
      currentSemester,
      academicYear: yearInSociety.trim(),
      branch: branch.trim(),
      yearOfJoining,
      primaryDepartmentId: departmentId.trim(),
      role: 'general_member', // Restricted role
      roleTitle: designation.trim(), // Member designation e.g. "Active Member"
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    db.members.push(newMember);

    // 6. Notify all HR Admins and President of pending signup
    const hrAdmins = db.members.filter((m) => m.role === 'hr_head' || m.role === 'president');
    for (const hr of hrAdmins) {
      db.notifications.push({
        id: `notif-${Date.now()}-${hr.id}`,
        recipientMemberId: hr.id,
        title: 'New Member Application',
        message: `${newMember.name} has registered for ${designation} in ${newMember.primaryDepartmentId} and is awaiting HR verification.`,
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
          memberId: newMember.memberId,
          name: newMember.name,
          email: newMember.email,
          branch: newMember.branch,
          designation: newMember.roleTitle,
          collegeEnrollment: newMember.collegeEnrollment,
          yearInSociety: newMember.academicYear,
          departmentId: newMember.primaryDepartmentId,
          approvalStatus: newMember.approvalStatus,
        },
      },
      201
    );
  } catch (err: any) {
    return errorResponse(err.message || 'Registration error', 500);
  }
}
