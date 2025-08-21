/**
 * Development-only login endpoint
 * Creates authenticated sessions for testing dashboard functionality
 */

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const DEV = process.env.NODE_ENV !== 'production';
const SECRET = process.env.JWT_SECRET || 'dev-shared-secret';
const ISSUER = process.env.JWT_ISSUER || 'gogym-web';
const AUDIENCE = process.env.JWT_AUDIENCE || 'gogym-api';

const DEFAULT_COMPANY_ID = process.env.DEV_COMPANY_ID || '489ff883-138b-44a1-88db-83927b596e35';
const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  if (!DEV) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const userId = body.userId ?? '7519a35e-21f8-48ca-bc26-7ec90f216274';
  const email = body.email ?? 'admin@testgym.mx';
  const requestedCompanyId = body.companyId ?? DEFAULT_COMPANY_ID;

  // Ensure companyId is a valid UUID for SSE compatibility
  const companyId = (requestedCompanyId && UUID_RX.test(requestedCompanyId)) ? requestedCompanyId : DEFAULT_COMPANY_ID;
  const company = body.company ?? { id: companyId, name: 'Vigor Demo Co', rfc: 'DEMO010101XXX' };
  const role = body.role ?? 'owner';

  const token = jwt.sign({ userId, email, companyId, company, role }, SECRET, {
    algorithm: 'HS256',
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: '7d',
  });

  const res = NextResponse.json({ ok: true, userId, companyId, role });

  // Set accessToken with consistent flags
  res.cookies.set('accessToken', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // Max-Age keeps session across HMR reloads
    maxAge: 60 * 60 * 8, // 8 hours
  });

  // Clear legacy cookie names to avoid confusion
  ['auth-token', 'access_token'].forEach(name => {
    res.cookies.set(name, '', { maxAge: 0, path: '/' });
  });

  return res;
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    message: 'Development login endpoint',
    usage: 'POST with optional { userId, email, companyId, role } body',
    defaults: {
      userId: '7519a35e-21f8-48ca-bc26-7ec90f216274',
      email: 'admin@testgym.mx',
      companyId: DEFAULT_COMPANY_ID,
      role: 'owner',
    },
  });
}

export async function DELETE() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true, message: 'Dev cookies cleared' });
  const cookieNames = ['accessToken', 'access_token', 'auth-token', 'refreshToken'];
  for (const name of cookieNames) {
    res.cookies.set(name, '', { maxAge: 0, path: '/' });
  }
  return res;
}
