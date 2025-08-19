import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '../../../../lib/auth/supabase-auth';

/**
 * POST /api/auth/login
 *
 * Authenticate user directly with Supabase database.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Authenticate user with Supabase
    const authResult = await authenticateUser({ email, password });

    // Create response with user data
    const responseData = {
      user: authResult.user,
      tokens: authResult.tokens,
    };

    const nextResponse = NextResponse.json(responseData);

    // Set HTTP-only cookies for tokens
    nextResponse.cookies.set('accessToken', authResult.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    nextResponse.cookies.set('refreshToken', authResult.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
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
