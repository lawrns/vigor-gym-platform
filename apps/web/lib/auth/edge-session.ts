/**
 * Edge Runtime compatible session verification
 *
 * This module contains ONLY Edge Runtime compatible code for use in middleware.
 * DO NOT import Node.js specific modules here (like 'jsonwebtoken', 'next/headers', etc.)
 *
 * For server-side session verification, use lib/auth/session.ts instead.
 */

import { AUTH_ROUTES, PROTECTED_PREFIXES, PUBLIC_ROUTES } from './types';

/**
 * JWT token validation for Edge Runtime
 * Validates both Supabase and dev tokens (format and expiration)
 */
export function isValidToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode payload to check expiration and issuer
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);

    // Check if token is expired
    if (payload.exp && payload.exp < now) {
      return false;
    }

    // Check for user ID (Supabase uses 'sub', dev tokens use 'userId')
    const hasUserId = payload.sub || payload.userId;
    if (!hasUserId) {
      return false;
    }

    // Accept both Supabase tokens and dev tokens
    const isSupabaseToken = payload.iss && payload.iss.includes('supabase');
    const isDevToken = payload.iss === 'gogym-web' && payload.aud === 'gogym-api';

    if (!isSupabaseToken && !isDevToken) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use isValidToken instead
 */
export function isValidSupabaseToken(token: string): boolean {
  return isValidToken(token);
}

/**
 * Check if user has valid session based on cookies
 * Edge Runtime compatible version - supports both Supabase and dev tokens
 */
export function hasValidSession(accessToken?: string, refreshToken?: string): boolean {
  // Primarily rely on the access token (works for both Supabase and dev tokens)
  if (accessToken && isValidToken(accessToken)) {
    return true;
  }

  // Fallback to refresh token if access token is invalid/expired
  if (refreshToken && isValidToken(refreshToken)) {
    return true;
  }

  return false;
}

/**
 * Route classification helpers (re-exported for middleware use)
 */
export function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.includes(path);
}

export function isProtected(path: string): boolean {
  return PROTECTED_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/'));
}

export function isPublic(path: string): boolean {
  return PUBLIC_ROUTES.includes(path);
}

/**
 * Determine redirect action for middleware
 */
export function getRedirectAction(
  pathname: string,
  hasSession: boolean,
  req?: Request
): { shouldRedirect: boolean; destination?: string } {
  // If protected and no session → login
  if (isProtected(pathname) && !hasSession) {
    // Use request origin if available, fallback to localhost:3005 for dev
    const origin =
      (req as any)?.headers?.get?.('origin') ||
      (globalThis as any)?.location?.origin ||
      'http://localhost:3005';
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('next', pathname);
    return { shouldRedirect: true, destination: loginUrl.pathname + loginUrl.search };
  }

  // If auth route and has session → dashboard
  if (isAuthRoute(pathname) && hasSession) {
    return { shouldRedirect: true, destination: '/dashboard' };
  }

  return { shouldRedirect: false };
}
