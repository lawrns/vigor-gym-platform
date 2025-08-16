import { describe, it, expect } from '@jest/globals';
import { 
  AUTH_ROUTES, 
  PROTECTED_PREFIXES, 
  PUBLIC_ROUTES, 
  isAuthRoute, 
  isProtected, 
  isPublic 
} from '../../lib/auth/types';
import { hasValidSession, getRedirectAction } from '../../lib/auth/edge-session';

describe('Route Classification', () => {
  describe('isAuthRoute', () => {
    it('should correctly identify auth routes', () => {
      AUTH_ROUTES.forEach(route => {
        expect(isAuthRoute(route)).toBe(true);
      });
    });

    it('should return false for non-auth routes', () => {
      const nonAuthRoutes = ['/', '/dashboard', '/demo', '/contacto'];
      nonAuthRoutes.forEach(route => {
        expect(isAuthRoute(route)).toBe(false);
      });
    });
  });

  describe('isProtected', () => {
    it('should correctly identify protected routes', () => {
      const protectedRoutes = [
        '/dashboard',
        '/dashboard/kpi',
        '/dashboard/miembros',
        '/admin',
        '/admin/users',
        '/partner',
        '/partner/dashboard'
      ];
      
      protectedRoutes.forEach(route => {
        expect(isProtected(route)).toBe(true);
      });
    });

    it('should return false for non-protected routes', () => {
      const nonProtectedRoutes = ['/', '/login', '/register', '/demo', '/contacto'];
      nonProtectedRoutes.forEach(route => {
        expect(isProtected(route)).toBe(false);
      });
    });
  });

  describe('isPublic', () => {
    it('should correctly identify public routes', () => {
      PUBLIC_ROUTES.forEach(route => {
        expect(isPublic(route)).toBe(true);
      });
    });

    it('should return false for non-public routes', () => {
      const nonPublicRoutes = ['/dashboard', '/admin', '/login', '/register'];
      nonPublicRoutes.forEach(route => {
        expect(isPublic(route)).toBe(false);
      });
    });
  });
});

describe('JWT Token Validation', () => {
  describe('hasValidSession', () => {
    it('should return false for undefined tokens', () => {
      expect(hasValidSession()).toBe(false);
      expect(hasValidSession(undefined, undefined)).toBe(false);
    });

    it('should return false for invalid token format', () => {
      expect(hasValidSession('invalid-token')).toBe(false);
      expect(hasValidSession('invalid.token')).toBe(false);
      expect(hasValidSession('invalid.token.format.extra')).toBe(false);
    });

    it('should return false for expired tokens', () => {
      // Create an expired token (exp in the past)
      const expiredPayload = {
        userId: 'test-user',
        email: 'test@example.com',
        role: 'owner',
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;
      
      expect(hasValidSession(expiredToken)).toBe(false);
    });

    it('should return true for valid non-expired tokens', () => {
      // Create a valid token (exp in the future)
      const validPayload = {
        userId: 'test-user',
        email: 'test@example.com',
        role: 'owner',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
      const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;
      
      expect(hasValidSession(validToken)).toBe(true);
    });

    it('should prioritize access token over refresh token', () => {
      const validPayload = {
        userId: 'test-user',
        email: 'test@example.com',
        role: 'owner',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const validAccessToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;
      const validRefreshToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;
      
      expect(hasValidSession(validAccessToken, validRefreshToken)).toBe(true);
      expect(hasValidSession(undefined, validRefreshToken)).toBe(true);
    });
  });
});

describe('Middleware Redirect Logic', () => {
  describe('getRedirectAction', () => {
    it('should redirect unauthenticated users from protected routes to login', () => {
      const protectedPaths = ['/dashboard', '/dashboard/kpi', '/admin', '/partner'];
      
      protectedPaths.forEach(path => {
        const result = getRedirectAction(path, false);
        expect(result.shouldRedirect).toBe(true);
        expect(result.destination).toContain('/login');
        expect(result.destination).toContain(`next=${encodeURIComponent(path)}`);
      });
    });

    it('should redirect authenticated users from auth routes to dashboard', () => {
      AUTH_ROUTES.forEach(route => {
        const result = getRedirectAction(route, true);
        expect(result.shouldRedirect).toBe(true);
        expect(result.destination).toBe('/dashboard');
      });
    });

    it('should not redirect for public routes', () => {
      PUBLIC_ROUTES.forEach(route => {
        // Test both authenticated and unauthenticated users
        expect(getRedirectAction(route, true).shouldRedirect).toBe(false);
        expect(getRedirectAction(route, false).shouldRedirect).toBe(false);
      });
    });

    it('should not redirect authenticated users from protected routes', () => {
      const protectedPaths = ['/dashboard', '/dashboard/kpi', '/admin', '/partner'];
      
      protectedPaths.forEach(path => {
        const result = getRedirectAction(path, true);
        expect(result.shouldRedirect).toBe(false);
      });
    });

    it('should not redirect unauthenticated users from auth routes', () => {
      AUTH_ROUTES.forEach(route => {
        const result = getRedirectAction(route, false);
        expect(result.shouldRedirect).toBe(false);
      });
    });
  });
});

describe('Route Constants Completeness', () => {
  it('should have no overlapping routes between categories', () => {
    const allRoutes = [...AUTH_ROUTES, ...PUBLIC_ROUTES];
    const uniqueRoutes = new Set(allRoutes);
    
    expect(allRoutes.length).toBe(uniqueRoutes.size);
  });

  it('should cover all expected application routes', () => {
    const expectedRoutes = [
      '/', '/login', '/register', '/dashboard', '/demo', '/contacto', 
      '/planes', '/checkout', '/checkout/success', '/no-acceso'
    ];
    
    expectedRoutes.forEach(route => {
      const isClassified = isAuthRoute(route) || isProtected(route) || isPublic(route);
      expect(isClassified).toBe(true);
    });
  });

  it('should have consistent prefix matching for protected routes', () => {
    PROTECTED_PREFIXES.forEach(prefix => {
      // Test exact match
      expect(isProtected(prefix)).toBe(true);
      
      // Test sub-routes
      expect(isProtected(`${prefix}/sub-route`)).toBe(true);
      expect(isProtected(`${prefix}/sub/nested/route`)).toBe(true);
    });
  });
});
