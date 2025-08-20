import { NextRequest, NextResponse } from 'next/server';
import { API_ORIGIN } from '../../../lib/api/origin';

/**
 * POST /api/auth/logout
 *
 * Handles user logout by clearing authentication cookies.
 */
export async function POST(request: NextRequest) {
  try {
    // Forward the request to the backend API if needed

    try {
      const backendResponse = await fetch(`${API_ORIGIN}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') || '',
        },
      });

      if (!backendResponse.ok) {
        console.warn('Backend logout returned non-200 status:', backendResponse.status);
      }
    } catch (error) {
      // Backend logout failed, but we'll still clear cookies locally
      console.warn('Backend logout failed:', error);
    }

    // Create response
    const response = NextResponse.json({
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
    });

    // Clear authentication cookies with multiple approaches to ensure they're removed
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    // Clear all possible cookie names
    const cookieNames = ['accessToken', 'refreshToken', 'access_token', 'auth-token'];

    for (const name of cookieNames) {
      // Method 1: Set with maxAge 0
      response.cookies.set(name, '', {
        ...cookieOptions,
        maxAge: 0,
      });

      // Method 2: Set with past expiration date
      response.cookies.set(name, '', {
        ...cookieOptions,
        expires: new Date(0),
      });

      // Method 3: Delete cookies explicitly
      response.cookies.delete(name);
    }

    console.log('[LOGOUT] Cookies cleared successfully');
    return response;
  } catch (error) {
    console.error('Logout error:', error);

    // Even if there's an error, try to clear cookies
    const response = NextResponse.json(
      { message: 'Logout completed with errors' },
      { status: 200 } // Return 200 so client-side logout continues
    );

    // Still attempt to clear all cookies
    const cookieNames = ['accessToken', 'refreshToken', 'access_token', 'auth-token'];
    for (const name of cookieNames) {
      response.cookies.delete(name);
    }

    return response;
  }
}
