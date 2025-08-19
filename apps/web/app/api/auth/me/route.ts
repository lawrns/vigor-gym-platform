import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/auth/session';
import { getUserById } from '../../../../lib/auth/supabase-auth';

/**
 * GET /api/auth/me
 *
 * Returns the current user's authentication information.
 * This endpoint bridges the gap between client-side auth context
 * and server-side session validation using httpOnly cookies.
 */
export async function GET(request: NextRequest) {
  try {
    // Get session from httpOnly cookies (server-side only)
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Get full user data from database
    const user = await getUserById(session.userId);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Return user data in the same format as the backend API
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.companyId
          ? {
              id: user.companyId,
              name: 'Company', // TODO: Fetch company name from database
              rfc: 'RFC000000XXX', // TODO: Fetch company RFC from database
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
