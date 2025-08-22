import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 *
 * Returns the current user's authentication information by calling Railway API.
 */
export async function GET(request: NextRequest) {
  try {
    // Check if accessToken cookie is present
    const token = request.cookies.get('accessToken')?.value;
    console.debug('[auth/me] accessToken cookie present:', !!token);

    if (!token) {
      console.warn('[auth/me] No access token found, returning 401');
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Call Railway API to get user info
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vigor-gym-platform-production.up.railway.app';
    const response = await fetch(`${apiUrl}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[auth/me] Railway API returned:', response.status);
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const userData = await response.json();
    console.debug('[auth/me] User data from Railway API:', userData);

    return NextResponse.json(userData);

  } catch (error) {
    console.error('[auth/me] Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
