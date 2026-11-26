import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, name, avatar } = await req.json();

    if (!email) {
      return errorResponse('Email is required', 400);
    }

    const db = await getDatabase();
    let user = db.members.find(
      (m) => m.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      // Auto-provision as pending general member
      const currentYear = new Date().getFullYear();
      const count = db.members.length + 1;
      const memberId = `ENVIPS-${currentYear}-${String(count).padStart(3, '0')}`;
      const defaultDept = db.departments[0]?.id || 'digital-operations';

      user = {
        id: `mem-${Date.now()}`,
        memberId,
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        authProvider: 'google',
        approvalStatus: 'PENDING',
        membershipStatus: 'ACTIVE',
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
        collegeEnrollment: 'N/A',
        currentSemester: 1,
        academicYear: '1st Year',
        branch: 'General',
        yearOfJoining: currentYear,
        primaryDepartmentId: defaultDept,
        role: 'general_member',
        roleTitle: 'Applicant (Google Sign-In)',
        status: 'Active',
        createdAt: new Date().toISOString(),
      };

      db.members.push(user);

      // Notify HR
      const hrAdmins = db.members.filter((m) => m.role === 'hr_head' || m.role === 'president');
      for (const hr of hrAdmins) {
        db.notifications.push({
          id: `notif-${Date.now()}-${hr.id}`,
          recipientMemberId: hr.id,
          title: 'New Google Applicant',
          message: `${user.name} (${user.email}) signed up via Google and is awaiting HR verification.`,
          type: 'System',
          link: '/members',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      await saveDatabase(db, ['members', 'notifications']);

      const response = jsonResponse(
        {
          error: 'APPROVAL_PENDING',
          message: 'Your registration via Google is pending HR review.',
          user: { id: user.id, name: user.name, email: user.email, approvalStatus: user.approvalStatus },
        },
        403
      );

      response.cookies.set('enactus_session_user_id', user.id, {
        httpOnly: false,
        path: '/',
        maxAge: 86400 * 7,
        sameSite: 'lax',
      });

      return response;
    }

    // Gate 1: Check Approval Status
    if (user.approvalStatus === 'PENDING') {
      const response = jsonResponse(
        {
          error: 'APPROVAL_PENDING',
          message: 'Your registration is currently pending review by an HR Administrator.',
          user: { id: user.id, name: user.name, email: user.email, approvalStatus: user.approvalStatus },
        },
        403
      );
      response.cookies.set('enactus_session_user_id', user.id, {
        httpOnly: false,
        path: '/',
        maxAge: 86400 * 7,
        sameSite: 'lax',
      });
      return response;
    }

    if (user.approvalStatus === 'REJECTED') {
      return errorResponse('Your registration was reviewed and not approved by society administration.', 403);
    }

    // Gate 2: Check Membership Status
    if (user.membershipStatus === 'SUSPENDED') {
      return errorResponse(
        `Your account has been suspended: ${user.statusChangeReason || 'Contact HR administration.'}`,
        403
      );
    }

    if (user.membershipStatus === 'TERMINATED') {
      return errorResponse(
        `This membership account has been terminated: ${user.statusChangeReason || 'Access revoked.'}`,
        403
      );
    }

    const { passwordHash, ...safeUser } = user;
    const response = jsonResponse({
      success: true,
      message: 'Authentication successful',
      user: safeUser,
    });

    response.cookies.set('enactus_session_user_id', user.id, {
      httpOnly: false,
      path: '/',
      maxAge: 86400 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return errorResponse(err.message || 'Google authentication error', 500);
  }
}
