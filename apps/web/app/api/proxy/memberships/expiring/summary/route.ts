import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_ORIGIN } from '@/lib/api/origin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies (prefer accessToken) or headers
    const authHeader = request.headers.get('authorization');
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    // Soft fallback for legacy cookie name during transition
    const legacyToken = !accessToken ? cookieStore.get('auth-token')?.value : '';
    const token = accessToken || legacyToken;

    if (!authHeader && !token) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    } else if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_ORIGIN}/v1/memberships/expiring/summary`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Expiring memberships summary proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
