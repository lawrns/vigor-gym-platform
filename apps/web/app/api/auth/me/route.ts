import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/auth/session';

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
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Return user data in the same format as the backend API
    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        firstName: session.email.split('@')[0], // Fallback if no firstName
        lastName: 'User', // Fallback if no lastName
        role: session.role,
        company: session.companyId ? {
          id: session.companyId,
          name: 'Company', // We don't have company name in session, would need to fetch
          rfc: 'RFC000000XXX' // Fallback
        } : null,
      }
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
