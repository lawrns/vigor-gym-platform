import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_ORIGIN } from '../../../../lib/api/origin';

export async function GET(req: Request) {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value || null;
  
  const orgIdFromToken = (() => {
    if (!accessToken) return null;
    try {
      const segments = accessToken.split('.');
      if (segments.length !== 3) return null;
      
      const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return payload.companyId || payload.orgId || null;
    } catch {
      return null;
    }
  })();
  
  return NextResponse.json({
    apiOrigin: API_ORIGIN,
    cookiePresent: Boolean(accessToken),
    orgIdFromToken,
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      API_ORIGIN: process.env.API_ORIGIN,
      DEV_COMPANY_ID: process.env.DEV_COMPANY_ID,
      NEXT_PUBLIC_FILTER_EXTENSION_NOISE: process.env.NEXT_PUBLIC_FILTER_EXTENSION_NOISE
    }
  });
}
