import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';

const API_ORIGIN = process.env.API_ORIGIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export async function GET(request: NextRequest) {
  try {
    // Check authentication server-side
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Get auth token from cookies (prefer accessToken)
    const accessToken = request.cookies.get('accessToken')?.value;
    const legacyToken = request.cookies.get('auth-token')?.value;
    const authToken = accessToken || legacyToken;

    if (!authToken) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Forward request to API server
    const response = await fetch(`${API_ORIGIN}/v1/onboarding/status`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[ONBOARDING-STATUS-PROXY] Failed to proxy request:', error);

    return NextResponse.json(
      {
        message: 'Failed to fetch onboarding status',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
