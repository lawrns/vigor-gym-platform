import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/login
 *
 * Authenticate user with Railway API backend.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Authenticate user with Railway API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vigor-gym-platform-production.up.railway.app';
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Authentication failed' }));
      return NextResponse.json({ error: errorData.message || 'Authentication failed' }, { status: response.status });
    }

    const authResult = await response.json();

    // Determine secure flag based on environment and proxy headers
    const isSecure =
      request.headers.get('x-forwarded-proto') === 'https' ||
      process.env.NODE_ENV === 'production';

    // Return shape expected by apiClient (top-level tokens)
    const nextResponse = NextResponse.json({
      user: authResult.user,
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
    });

    // Set HTTP-only cookies for tokens
    nextResponse.cookies.set('accessToken', authResult.accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    nextResponse.cookies.set('refreshToken', authResult.refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return nextResponse;
  } catch (error) {
    console.error('Login error:', error);

    // Return appropriate error message
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    const statusCode = errorMessage === 'Invalid credentials' ? 401 : 500;

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
