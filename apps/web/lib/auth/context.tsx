'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient, isAPIError, setAuthToken } from '../api/client';
import {
  authMetrics,
  trackLoginStart,
  trackLoginSuccess,
  trackLoginFailure,
  trackRedirectStart,
  trackRedirectEnd,
} from '../monitoring/auth-metrics';
import { isAPIClientError, isUnauthorizedError, isNetworkError } from '../http/errors';
import { telemetry } from '../telemetry/client';

/* Deduped error logger */
const __authLogOnce = new Set<string>();
function logOnce(key: string, fn: () => void) {
  if (__authLogOnce.has(key)) return;
  __authLogOnce.add(key);
  fn();
}

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  firstName?: string;
  lastName?: string;
  company?: {
    id: string;
    name: string;
    rfc: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  status: 'loading' | 'authenticated' | 'guest' | 'error';
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  devLogin: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  hasMinimumRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleHierarchy = {
  member: 1,
  staff: 2,
  manager: 3,
  owner: 4,
  partner_admin: 2, // Same level as staff but different domain
};

import {
  AUTH_ROUTES,
  PROTECTED_PREFIXES,
  PUBLIC_ROUTES,
  isAuthRoute,
  isProtected,
  isPublic,
} from './types';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'guest' | 'error'>('loading');
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth state
  useEffect(() => {
    console.debug('[AUTH] Initializing auth state...');

    let cancelled = false;
    const run = async () => {
      // Small microtask delay allows Set-Cookie to flush after dev login redirect
      await Promise.resolve();

      try {
        console.debug('[AUTH] Checking authentication with server');
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (cancelled) return;

        if (res.status === 401) {
          console.debug('[AUTH] Server returned 401, clearing auth state');
          setUser(null);
          setAuthToken(null);
          setStatus('guest');
          setLoading(false);
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;

          setUser(data.user || data);
          setStatus('authenticated');

          // Set token for API client if provided
          if (data.accessToken) {
            setAuthToken(data.accessToken);
          }
          console.debug('[AUTH] Authentication initialized successfully');

          // Track successful auth
          if (data.user?.company?.id) {
            telemetry.org.contextSet(data.user.company.id);
          }
        } else {
          // Handle other HTTP errors
          const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
          console.debug('[AUTH] Authentication failed:', errorData.message);
          setUser(null);
          setAuthToken(null);
          setStatus('guest');
        }
      } catch (error) {
        if (cancelled) return;

        // Handle network errors with deduped logging
        if (error instanceof TypeError && error.message.includes('fetch')) {
          logOnce('initializeAuth-network', () => {
            console.error(
              '[AUTH] Network error during authentication. Please check your connection.'
            );
          });
          setStatus('error');
        } else {
          // Log other errors once to avoid spam
          logOnce('initializeAuth-non401', () => {
            console.error('[AUTH] Authentication initialization failed:', error);
          });
          setStatus('error');
        }

        // Clear any stale auth state
        setUser(null);
        setAuthToken(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Handle route protection - be conservative and only redirect when necessary
  useEffect(() => {
    // Don't make decisions during loading
    if (loading) return;

    if (!user) {
      // Only bounce on protected routes; never from public routes like /planes
      if (isProtected(pathname)) {
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/login?next=${returnUrl}`);
      }
      return;
    }

    // User is authenticated
    // Only bounce away from AUTH routes; allow public routes (e.g., /planes)
    if (isAuthRoute(pathname)) {
      router.push('/dashboard');
    }

    // IMPORTANT: Do NOT redirect authenticated users from public routes like /planes
    // This was the source of the bug - authenticated users should be able to access /planes
  }, [user, loading, pathname, router]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const startTime = trackLoginStart();

    try {
      authMetrics.trackLoginAttempt(email, startTime);
      const response = await apiClient.auth.login({ email, password });

      if (isAPIError(response)) {
        trackLoginFailure(email, response.message, startTime);
        return { success: false, error: response.message };
      }

      setUser(response.user);
      setAuthToken(response.accessToken);

      // Track successful login
      trackLoginSuccess(email, response.user.id, startTime);

      // Handle redirect after login - only redirect if we're on a login/auth page
      const currentPath = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      const nextUrl = urlParams.get('next');

      // Track redirect performance
      const redirectStart = trackRedirectStart();

      // Only redirect if we're currently on an auth route (login/register)
      if (isAuthRoute(currentPath)) {
        const destination = nextUrl ? decodeURIComponent(nextUrl) : '/dashboard';
        router.push(destination);
        trackRedirectEnd(currentPath, destination, redirectStart);
      }
      // If we're on a public route like /planes, stay there - don't redirect

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      trackLoginFailure(email, errorMessage, startTime);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const devLogin = async (payload: any) => {
    try {
      const response = await fetch('/api/dev/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Auto-reload to ensure proper cookie handling and auth state refresh
        window.location.reload();
      } else {
        console.error('[AUTH] Dev login failed:', response.status);
      }
    } catch (error) {
      console.error('[AUTH] Dev login error:', error);
    }
  };

  const logout = async () => {
    const sessionId = user?.id;

    // Set loading state to prevent UI issues during logout
    setLoading(true);

    try {
      // Call logout API to clear server-side cookies
      await apiClient.auth.logout();
      console.log('[AUTH] Logout API call successful');
    } catch (error) {
      console.error('[AUTH] Logout API error:', error);
      // Continue with logout even if API call fails
    }

    // Track session end
    if (sessionId) {
      authMetrics.trackSessionEnd(sessionId);
    }

    // Clear local state immediately
    setUser(null);
    setAuthToken(null);
    setStatus('guest');

    // Clear any local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }

    // Force a hard reload to ensure server-side state is refreshed
    // This ensures the ServerNavbar re-renders with the correct state
    console.log('[AUTH] Forcing page reload to refresh server state');
    window.location.href = '/';
  };

  const refreshAuth = async () => {
    try {
      const response = await apiClient.auth.refresh({});

      if (!isAPIError(response)) {
        setUser(response.user);
        setAuthToken(response.accessToken);
      } else {
        // Refresh failed, user needs to login again
        setUser(null);
        setAuthToken(null);
        router.push('/login');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      setUser(null);
      setAuthToken(null);
      router.push('/login');
    }
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const hasMinimumRole = (role: string): boolean => {
    if (!user) return false;
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 0;
    return userLevel >= requiredLevel;
  };

  // Global error handler for 401/419 responses
  useEffect(() => {
    const handleGlobalAuthError = (event: CustomEvent) => {
      if (event.detail.status === 401 || event.detail.status === 419) {
        setUser(null);
        setAuthToken(null);

        // Only redirect to login if we're on a protected route
        // Public routes (/, /planes, /checkout) should not redirect on auth errors
        if (isProtected(pathname)) {
          const returnUrl = encodeURIComponent(pathname);
          router.push(`/login?next=${returnUrl}`);
        }
        // For public routes, just clear auth state and stay on the current page
      }
    };

    window.addEventListener('auth-error' as any, handleGlobalAuthError);
    return () => {
      window.removeEventListener('auth-error' as any, handleGlobalAuthError);
    };
  }, [pathname, router]);

  const value: AuthContextType = {
    user,
    loading,
    status,
    login,
    devLogin,
    logout,
    refreshAuth,
    hasRole,
    hasMinimumRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for checking permissions
export function usePermissions() {
  const { user, hasRole, hasMinimumRole } = useAuth();

  return {
    isOwner: hasRole(['owner']),
    isManager: hasRole(['owner', 'manager']),
    isStaff: hasRole(['owner', 'manager', 'staff']),
    isPartnerAdmin: hasRole(['partner_admin']),
    canManageMembers: hasRole(['owner', 'manager', 'staff']),
    canManageCompany: hasRole(['owner', 'manager']),
    canViewReports: hasRole(['owner', 'manager']),
    hasMinimumRole,
    user,
  };
}

// Hook for org/tenant context readiness
export function useOrgContext() {
  const { user, status } = useAuth();
  const orgId = user?.company?.id ?? null;
  const ready = status === 'authenticated' && !!orgId;

  console.log('[useOrgContext] Debug:', {
    status,
    hasUser: !!user,
    userCompany: user?.company,
    orgId,
    ready
  });

  return { orgId, ready, status };
}
