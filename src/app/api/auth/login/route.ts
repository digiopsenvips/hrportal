import { NextRequest } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/storage';
import { jsonResponse, errorResponse } from '@/lib/api-response';
import { verifyPassword } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    const db = getDatabase();
    const user = db.members.find(
      (m) => m.email.toLowerCase() === email.toLowerCase() || m.memberId.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return errorResponse('Invalid email or password credentials', 401);
    }

    // Verify password if hash exists
    if (user.passwordHash) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return errorResponse('Invalid email or password credentials', 401);
      }
    }

    // Gate 1: Check Approval Status
    if (user.approvalStatus === 'PENDING') {
      return jsonResponse(
        {
          error: 'APPROVAL_PENDING',
          message: 'Your registration is currently pending review by an HR Administrator.',
          user: { id: user.id, name: user.name, email: user.email, approvalStatus: user.approvalStatus },
        },
        403
      );
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

    // Return sanitized authenticated member
    const { passwordHash, ...safeUser } = user;
    const response = jsonResponse({
      success: true,
      message: 'Authentication successful',
      user: safeUser,
    });

    // Set secure session cookie
    response.cookies.set('enactus_session_user_id', user.id, {
      httpOnly: false, // Accessible to client context
      path: '/',
      maxAge: 86400 * 7, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return errorResponse(err.message || 'Authentication error', 500);
  }
}
