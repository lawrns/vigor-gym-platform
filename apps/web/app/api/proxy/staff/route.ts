import { NextRequest, NextResponse } from 'next/server';
import { API_ORIGIN } from '../../../lib/api/origin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const response = await fetch(
      `${API_ORIGIN}/v1/staff${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: request.headers.get('Authorization') || '',
          Cookie: request.headers.get('Cookie') || '',
        },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Staff API error:', {
        status: response.status,
        data,
      });

      return NextResponse.json(
        {
          error: data?.error || data?.code || 'STAFF_FETCH_FAILED',
          message: data?.message || `Failed to fetch staff (${response.status})`,
          proxyError: true,
          status: response.status,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Staff proxy internal error:', {
      error: error?.message,
      stack: error?.stack,
    });

    return NextResponse.json(
      {
        error: 'PROXY_INTERNAL_ERROR',
        message: 'Internal proxy error occurred',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate content type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        {
          error: 'CONTENT_TYPE_JSON_REQUIRED',
          message: 'Content-Type must be application/json',
        },
        { status: 415 }
      );
    }

    // Parse and validate request body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        {
          error: 'INVALID_JSON',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    // Forward request to API
    const response = await fetch(`${API_ORIGIN}/v1/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') || '',
        Cookie: request.headers.get('Cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Staff create API error:', {
        status: response.status,
        data,
      });

      return NextResponse.json(
        {
          error: data?.error || data?.code || 'STAFF_CREATE_FAILED',
          message: data?.message || `Failed to create staff member (${response.status})`,
          proxyError: true,
          status: response.status,
        },
        { status: response.status }
      );
    }

    console.log('Staff created successfully:', {
      staffId: data.staff?.id,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Staff create proxy internal error:', {
      error: error?.message,
      stack: error?.stack,
    });

    return NextResponse.json(
      {
        error: 'PROXY_INTERNAL_ERROR',
        message: 'Internal proxy error occurred',
      },
      { status: 500 }
    );
  }
}
