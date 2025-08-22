import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/auth/session';
import { getUserById } from '../../../../lib/auth/supabase-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 *
 * Returns the current user's authentication information.
 * This endpoint bridges the gap between client-side auth context
 * and server-side session validation using httpOnly cookies.
 */
export async function GET(request: NextRequest) {
  try {
    // Check if accessToken cookie is present
    const token = request.cookies.get('accessToken')?.value;
    console.debug('[auth/me] accessToken cookie present:', !!token);
    console.debug('[auth/me] accessToken length:', token ? token.length : 0);

    // Get session from httpOnly cookies (server-side only)
    const session = await getServerSession();
    console.debug('[auth/me] session returned:', !!session);
    console.debug('[auth/me] session details:', session ? {
      userId: session.userId,
      email: session.email,
      role: session.role,
      companyId: session.companyId
    } : null);

    if (!session) {
      console.warn('[auth/me] No session found, returning 401');
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // In development, if we have a session with companyId, return it directly (dev login)
    if (process.env.NODE_ENV === 'development' && session.companyId) {
      console.debug('[auth/me] Using dev JWT path');
      const normalizedRole = session.role === 'admin' ? 'owner' : session.role;
      console.debug('[auth/me] Role normalized from', session.role, 'to', normalizedRole);

      return NextResponse.json({
        user: {
          id: session.userId,
          email: session.email,
          firstName: 'Dev',
          lastName: 'User',
          role: normalizedRole,
          company: {
            id: session.companyId,
            name: 'Vigor Demo Co',
            rfc: 'DEMO010101XXX',
          },
        },
      });
    }

    // Get full user data from database (for Supabase auth)
    console.debug('[auth/me] Using Supabase path, fetching user by ID:', session.userId);
    const user = await getUserById(session.userId);

    if (!user) {
      console.warn('[auth/me] User not found in database for ID:', session.userId);
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    console.debug('[auth/me] User fetched from database:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Normalize role (admin -> owner)
    const normalizedRole = user.role === 'admin' ? 'owner' : user.role;
    console.debug('[auth/me] Role normalized from', user.role, 'to', normalizedRole);

    // Return user data in the same format as the backend API
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: normalizedRole,
        company: null, // TODO: Fetch company data if needed
      },
    });
  } catch (error) {
    console.error('[auth/me] Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
