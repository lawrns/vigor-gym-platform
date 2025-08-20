import { NextRequest, NextResponse } from 'next/server';
import { API_ORIGIN } from '../../../../lib/api/origin';

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

    // Normalize field names - frontend sends deviceSecret, backend expects deviceSecret
    const deviceId = body.deviceId || body.id;
    const deviceSecret = body.deviceSecret || body.secret;

    if (!deviceId || !deviceSecret) {
      return NextResponse.json(
        {
          error: 'DEVICE_CREDENTIALS_REQUIRED',
          message: 'deviceId and deviceSecret are required',
        },
        { status: 400 }
      );
    }

    // Forward request to API with normalized payload
    const response = await fetch(`${API_ORIGIN}/v1/devices/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') || '',
        Cookie: request.headers.get('Cookie') || '',
      },
      body: JSON.stringify({ deviceId, deviceSecret }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Device auth API error:', {
        status: response.status,
        data,
        deviceId: deviceId?.substring(0, 8) + '...', // Log partial ID for debugging
      });

      // Normalize error response format
      const errorResponse = {
        error: data?.code || data?.error || 'DEVICE_AUTH_FAILED',
        message: data?.message || `Authentication failed (${response.status})`,
        code: data?.code || data?.error || 'DEVICE_AUTH_FAILED',
      };

      return NextResponse.json(errorResponse, { status: response.status });
    }

    console.log('Device auth success:', {
      deviceId: deviceId?.substring(0, 8) + '...',
      hasToken: !!data.deviceToken,
    });

    // Ensure response has the expected format
    const successResponse = {
      deviceToken: data.deviceToken,
      device: {
        id: data.device?.id,
        name: data.device?.name,
        companyId: data.device?.companyId,
      },
      expiresIn: data.expiresIn,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error: any) {
    console.error('Device auth proxy internal error:', {
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
