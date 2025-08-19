export interface SessionUser {
  userId: string;
  email: string;
  role: 'owner' | 'manager' | 'staff' | 'trainer' | 'member' | 'partner_admin';
  companyId: string | null;
}

export interface SessionPayload extends SessionUser {
  iat: number;
  exp: number;
}

/**
 * Route classification helpers
 */
export const AUTH_ROUTES = ['/login', '/register'];
export const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/partner'];
export const PUBLIC_ROUTES = [
  '/',
  '/planes',
  '/checkout',
  '/checkout/success',
  '/demo',
  '/contacto',
  '/no-acceso',
];

export function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.includes(path);
}

export function isProtected(path: string): boolean {
  return PROTECTED_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/'));
}

export function isPublic(path: string): boolean {
  return PUBLIC_ROUTES.includes(path);
}
