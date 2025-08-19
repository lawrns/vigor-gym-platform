/**
 * SSE Events Proxy Route
 *
 * Proxies SSE requests to the API server with proper auth forwarding
 */

import { NextRequest } from 'next/server';
const API_BASE = process.env.API_BASE_URL || 'http://localhost:4002';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId') || '';
  const locationId = searchParams.get('locationId') || '';

  if (!orgId) {
    return new Response(JSON.stringify({ code: 'ORG_REQUIRED', hint: 'Pass ?orgId' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    });
  }

  const qs = new URLSearchParams({ orgId });
  if (locationId) qs.set('locationId', locationId);

  const upstream = `${API_BASE}/v1/events?${qs.toString()}`;

  const headerAuth = req.headers.get('authorization');
  const cookieToken =
    req.cookies.get('accessToken')?.value || req.cookies.get('auth-token')?.value || '';
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
