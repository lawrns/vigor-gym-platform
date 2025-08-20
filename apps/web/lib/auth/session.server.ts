/**
 * Server-only session and tenant context extraction
 * This module should only be imported in server-side code (API routes, server components)
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '../supabase/types';

/**
 * Server-side session context with tenant information
 */
export interface ServerSessionContext {
  user: {
    id: string;
    email: string;
    role?: string;
  };
  tenant: {
    companyId: string;
    companyName: string;
    permissions: string[];
  };
  supabase: ReturnType<typeof createServerClient<Database>>;
}

/**
 * Extract Supabase session from cookies (server-only)
 * Returns the authenticated user and Supabase client
 */
export async function getSupabaseSession() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Supabase session error:', error);
      return null;
    }

    if (!session?.user) {
      return null;
    }

    return {
      user: session.user,
      supabase,
      session,
    };
  } catch (error) {
    console.error('Failed to get Supabase session:', error);
    return null;
  }
}

/**
 * Get full server session context with tenant information
 * This includes user, company/tenant data, and permissions
 */
export async function getServerSessionContext(): Promise<ServerSessionContext | null> {
  try {
    const sessionData = await getSupabaseSession();
    if (!sessionData) {
      return null;
    }

    const { user, supabase } = sessionData;

    // Get user's company association
    // This query should be RLS-protected to only return companies the user has access to
    const { data: userCompanies, error: companyError } = await supabase
      .from('user_companies')
      .select(
        `
        company_id,
        role,
        permissions,
        companies (
          id,
          name
        )
      `
      )
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (companyError || !userCompanies) {
      console.warn('No company association found for user:', user.id);
      return null;
    }

    const company = userCompanies.companies;
    if (!company) {
      console.warn('Company data not found for user:', user.id);
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
        role: userCompanies.role,
      },
      tenant: {
        companyId: company.id,
        companyName: company.name,
        permissions: userCompanies.permissions || [],
      },
      supabase,
    };
  } catch (error) {
    console.error('Failed to get server session context:', error);
    return null;
  }
}

/**
 * Require authenticated session for API routes
 * Returns session context or throws 401 error
 */
export async function requireServerSession(): Promise<ServerSessionContext> {
  const context = await getServerSessionContext();

  if (!context) {
    throw new Error('Unauthorized: No valid session found');
  }

  return context;
}

/**
 * Get tenant-scoped Supabase client for API routes
 * This client will have RLS policies applied based on the user's tenant
 */
export async function getTenantSupabaseClient() {
  const context = await getServerSessionContext();

  if (!context) {
    return null;
  }

  // The Supabase client already has the user session attached
  // RLS policies will automatically filter based on the authenticated user
  return {
    supabase: context.supabase,
    companyId: context.tenant.companyId,
    userId: context.user.id,
  };
}

/**
 * Create API response headers with session context
 * Useful for debugging and logging
 */
export function createSessionHeaders(context: ServerSessionContext): Record<string, string> {
  return {
    'X-User-ID': context.user.id,
    'X-Company-ID': context.tenant.companyId,
    'X-User-Role': context.user.role || 'unknown',
  };
}

/**
 * Validate user has required permissions for an action
 */
export function hasPermission(context: ServerSessionContext, requiredPermission: string): boolean {
  return (
    context.tenant.permissions.includes(requiredPermission) ||
    context.tenant.permissions.includes('admin') || // Admin has all permissions
    context.user.role === 'owner'
  ); // Owner has all permissions
}

/**
 * Require specific permission for API routes
 */
export async function requirePermission(permission: string): Promise<ServerSessionContext> {
  const context = await requireServerSession();

  if (!hasPermission(context, permission)) {
    throw new Error(`Forbidden: Missing required permission: ${permission}`);
  }

  return context;
}

/**
 * Get company ID from session (for backward compatibility)
 */
export async function getCompanyIdFromSession(): Promise<string | null> {
  const context = await getServerSessionContext();
  return context?.tenant.companyId || null;
}

/**
 * Development bypass for testing (should be removed in production)
 * Only enabled when ENABLE_AUTH_BYPASS=true in development
 */
export async function getSessionWithDevBypass(): Promise<ServerSessionContext | null> {
  // Check if we're in development and bypass is enabled
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_AUTH_BYPASS === 'true') {
    console.warn('[DEV] Using auth bypass - this should not happen in production!');

    // Return a mock session for development
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    return {
      user: {
        id: 'dev-user-id',
        email: 'dev@testgym.mx',
        role: 'owner',
      },
      tenant: {
        companyId: '489ff883-138b-44a1-88db-83927b596e35', // Real company ID from Supabase
        companyName: 'Vigor Demo Co',
        permissions: ['admin'],
      },
      supabase,
    };
  }

  // In production or when bypass is disabled, use normal session
  return getServerSessionContext();
}
