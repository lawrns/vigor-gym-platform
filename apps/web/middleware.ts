import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route classifications explicitly
const AUTH_ROUTES = ['/login', '/register'];
const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/partner'];
const PUBLIC_ROUTES = ['/', '/planes', '/checkout', '/checkout/success', '/demo', '/contacto'];

function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.includes(path);
}

function isProtected(path: string): boolean {
  return PROTECTED_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/'));
}

function isPublic(path: string): boolean {
  return PUBLIC_ROUTES.includes(path);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth tokens from cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // Check if user is authenticated (has either token)
  const hasSession = !!(accessToken || refreshToken);

  // Debug logging (uncomment for debugging)
  // console.log('[MW]', pathname, {
  //   hasSession,
  //   auth: isAuthRoute(pathname),
  //   protected: isProtected(pathname),
  //   public: isPublic(pathname)
  // });

  // If protected and no session → login
  if (isProtected(pathname) && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If auth route and has session → dashboard
  if (isAuthRoute(pathname) && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Public and everything else → pass through
  const response = NextResponse.next();

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Org-Id');
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
