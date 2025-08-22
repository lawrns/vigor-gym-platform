import { NextRequest, NextResponse } from 'next/server';

const API_ORIGIN = process.env.API_ORIGIN || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

/**
 * POST /api/proxy/devices/validate
 * Validate device token and return device session info
 */
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
    if (!body || !body.deviceToken) {
      return NextResponse.json(
        {
          error: 'DEVICE_TOKEN_REQUIRED',
          message: 'deviceToken is required',
        },
        { status: 400 }
      );
    }

    // Forward request to API with device token in Authorization header
    const response = await fetch(`${API_ORIGIN}/v1/devices/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${body.deviceToken}`,
        Cookie: request.headers.get('Cookie') || '',
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Device token validation API error:', {
        status: response.status,
        data,
      });

      // Normalize error response format
      const errorResponse = {
        error: data?.code || data?.error || 'DEVICE_TOKEN_INVALID',
        message: data?.message || `Token validation failed (${response.status})`,
        code: data?.code || data?.error || 'DEVICE_TOKEN_INVALID',
      };

      return NextResponse.json(errorResponse, { status: response.status });
    }

    console.log('Device token validation success:', {
      deviceId: data.device?.id?.substring(0, 8) + '...',
      hasToken: !!data.deviceToken,
    });

    // Ensure response has the expected format
    const successResponse = {
      deviceToken: data.deviceToken || body.deviceToken, // Return original token if not refreshed
      device: {
        id: data.device?.id,
        name: data.device?.name,
        companyId: data.device?.companyId,
      },
      expiresIn: data.expiresIn,
      valid: true,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error: any) {
    console.error('Device token validation proxy internal error:', {
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
