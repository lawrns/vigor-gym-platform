import { NextRequest, NextResponse } from 'next/server';
const API_ORIGIN = process.env.API_ORIGIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4003';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const response = await fetch(`${API_ORIGIN}/v1/staff/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') || '',
        Cookie: request.headers.get('Cookie') || '',
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Staff get API error:', {
        status: response.status,
        data,
        staffId: id,
      });

      return NextResponse.json(
        {
          error: data?.error || data?.code || 'STAFF_GET_FAILED',
          message: data?.message || `Failed to get staff member (${response.status})`,
          proxyError: true,
          status: response.status,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Staff get proxy internal error:', {
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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

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
    const response = await fetch(`${API_ORIGIN}/v1/staff/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') || '',
        Cookie: request.headers.get('Cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Staff update API error:', {
        status: response.status,
        data,
        staffId: id,
      });

      return NextResponse.json(
        {
          error: data?.error || data?.code || 'STAFF_UPDATE_FAILED',
          message: data?.message || `Failed to update staff member (${response.status})`,
          proxyError: true,
          status: response.status,
        },
        { status: response.status }
      );
    }

    console.log('Staff updated successfully:', {
      staffId: id,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Staff update proxy internal error:', {
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Forward request to API
    const response = await fetch(`${API_ORIGIN}/v1/staff/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') || '',
        Cookie: request.headers.get('Cookie') || '',
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Staff delete API error:', {
        status: response.status,
        data,
        staffId: id,
      });

      return NextResponse.json(
        {
          error: data?.error || data?.code || 'STAFF_DELETE_FAILED',
          message: data?.message || `Failed to delete staff member (${response.status})`,
          proxyError: true,
          status: response.status,
        },
        { status: response.status }
      );
    }

    console.log('Staff deleted successfully:', {
      staffId: id,
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Staff delete proxy internal error:', {
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
