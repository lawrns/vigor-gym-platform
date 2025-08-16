import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/login
 * 
 * Proxy login requests to the backend API server.
 * This ensures cookies are set properly in the browser.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to the backend API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    const response = await fetch(`${apiUrl}/auth/login`, {
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

    // Create response with user data
    const nextResponse = NextResponse.json(data);

    // Forward cookies from backend to browser
    const setCookieHeaders = response.headers.get('set-cookie');
    if (setCookieHeaders) {
      // Parse and set each cookie
      const cookies = setCookieHeaders.split(', ');
      cookies.forEach(cookie => {
        const [nameValue, ...attributes] = cookie.split('; ');
        const [name, value] = nameValue.split('=');
        
        // Set cookie with proper attributes
        nextResponse.cookies.set(name, value, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: name === 'accessToken' ? 15 * 60 : 7 * 24 * 60 * 60, // 15 min for access, 7 days for refresh
        });
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
