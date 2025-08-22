import { NextRequest, NextResponse } from 'next/server';
const API_ORIGIN = process.env.API_ORIGIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

/**
 * POST /api/auth/register-company
 *
 * Proxy company registration requests to the backend API server.
 * This ensures cookies are set properly in the browser.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward the request to the backend API
    const response = await fetch(`${API_ORIGIN}/auth/register-company`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Create response with auth token cookie
    const nextResponse = NextResponse.json(
      {
        user: data.user,
        message: 'Registration successful',
      },
      { status: 201 }
    );

    // Set HTTP-only cookie for the access token
    if (data.accessToken) {
      nextResponse.cookies.set('auth-token', data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Registration proxy error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
