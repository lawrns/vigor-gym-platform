"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient, isAPIError, setAuthToken } from '../api/client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'manager' | 'staff' | 'member' | 'partner_admin';
  company: {
    id: string;
    name: string;
    rfc: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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

// Define route classifications explicitly (matching middleware)
const AUTH_ROUTES = ['/login', '/register'];
const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/partner'];
const PUBLIC_ROUTES = ['/', '/planes', '/checkout', '/checkout/success'];

function isAuthRoute(path: string): boolean {
  return AUTH_ROUTES.includes(path);
}

function isProtected(path: string): boolean {
  return PROTECTED_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/'));
}

function isPublic(path: string): boolean {
  return PUBLIC_ROUTES.includes(path);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize auth state
  useEffect(() => {
    console.debug('[AUTH] Initializing auth state...');
    initializeAuth();
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

  const initializeAuth = async () => {
    try {
      // Try to get user info from server (will use httpOnly cookies)
      const response = await apiClient.auth.me();

      if (!isAPIError(response)) {
        setUser(response.user);
        // Set token for API client if provided
        if (response.accessToken) {
          setAuthToken(response.accessToken);
        }
        console.debug('[AUTH] Authentication initialized successfully');
      }
    } catch (error) {
      // This is expected when user is not logged in - don't spam console
      console.debug('[AUTH] No valid authentication found (expected for anonymous users)');

      // Clear any stale auth state
      setUser(null);
      setAuthToken(null);

      // If it's a network error, it might be API server issues
      if (error instanceof Error && error.message.includes('Network request failed')) {
        console.error('[AUTH] API server appears to be unreachable. Please check if the API server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiClient.auth.login({ email, password });
      
      if (isAPIError(response)) {
        return { success: false, error: response.message };
      }

      setUser(response.user);
      setAuthToken(response.accessToken);

      // Handle redirect after login - only redirect if we're on a login/auth page
      const currentPath = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      const nextUrl = urlParams.get('next');

      // Only redirect if we're currently on an auth route (login/register)
      if (isAuthRoute(currentPath)) {
        if (nextUrl) {
          router.push(decodeURIComponent(nextUrl));
        } else {
          router.push('/dashboard');
        }
      }
      // If we're on a public route like /planes, stay there - don't redirect

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await apiClient.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      setAuthToken(null);
      
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
      
      router.push('/login');
    }
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
    login,
    logout,
    refreshAuth,
    hasRole,
    hasMinimumRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
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
