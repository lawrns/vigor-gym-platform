/**
 * SSE Events Proxy Route
 *
 * Proxies SSE requests to the API server with proper auth forwarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_ORIGIN } from '../../../lib/api/origin';

function decodeJwtOrgId(jwt: string): string | null {
  try {
    const segments = jwt.split('.');
    if (segments.length !== 3) return null;

    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.companyId || payload.orgId || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get('locationId') || '';

  // Get orgId from query, header, or JWT token
  let orgId = searchParams.get('orgId') || req.headers.get('x-org-id') || '';

  // If no orgId provided, try to extract from cookie JWT
  if (!orgId) {
    const cookieStore = cookies();
    const cookieAuth = cookieStore.get('accessToken')?.value || cookieStore.get('auth-token')?.value;
    if (cookieAuth) {
      orgId = decodeJwtOrgId(cookieAuth) || '';
    }
  }

  // Validate orgId is a proper UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orgId);
  if (!isUuid) {
    return NextResponse.json({ error: 'INVALID_ORG_ID', hint: 'orgId must be a valid UUID' }, { status: 422 });
  }

  const qs = new URLSearchParams({ orgId });
  if (locationId) qs.set('locationId', locationId);

  const upstream = `${API_ORIGIN}/v1/events?${qs.toString()}`;

  const headerAuth = req.headers.get('authorization');
  const cookieStore = cookies();
  const cookieToken = cookieStore.get('accessToken')?.value || cookieStore.get('auth-token')?.value || '';
  const auth = headerAuth || (cookieToken ? `Bearer ${cookieToken}` : '');

  const res = await fetch(upstream, {
    method: 'GET',
    headers: { accept: 'text/event-stream', ...(auth ? { authorization: auth } : {}) },
    // @ts-ignore (Node stream)
    duplex: 'half',
  });

  if (!res.ok && !res.body) {
    const body = await res.text().catch(() => '');
    return new Response(body || JSON.stringify({ error: 'upstream_error' }), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
    });
  }

  const headers = new Headers(res.headers);
  headers.set('content-type', 'text/event-stream');
  headers.set('cache-control', 'no-cache');
  headers.set('connection', 'keep-alive');
  return new Response(res.body, { status: res.status, headers });
}
