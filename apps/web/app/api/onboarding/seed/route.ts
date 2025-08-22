import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
const API_ORIGIN = process.env.API_ORIGIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export async function POST(request: NextRequest) {
  try {
    // Check authentication server-side
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Get auth token from cookies
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      return NextResponse.json({ message: 'Authentication token not found' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();

    // Forward request to API server
    const response = await fetch(`${API_ORIGIN}/v1/onboarding/seed`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[ONBOARDING-SEED-PROXY] Failed to proxy request:', error);

    return NextResponse.json(
      {
        message: 'Failed to complete onboarding seed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
