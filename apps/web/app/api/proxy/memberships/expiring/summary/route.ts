import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies or headers
    const authHeader =
      request.headers.get('authorization') ||
      request.headers.get('cookie')?.match(/auth-token=([^;]+)/)?.[1];

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authHeader.startsWith('Bearer ')) {
      headers['Authorization'] = authHeader;
    } else {
      headers['Authorization'] = `Bearer ${authHeader}`;
    }

    const response = await fetch(`${API_BASE_URL}/v1/memberships/expiring/summary`, {
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
