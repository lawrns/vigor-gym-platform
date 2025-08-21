import { supabase } from '../supabase/client';
import { supabaseAdmin } from '../supabase/admin';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

// Normalize external roles to app roles
function normalizeRole(r?: string): string {
  if (!r) return 'owner';
  if (r === 'admin') return 'owner';
  return r;
}

/**
 * Authenticate user with email and password using Supabase Auth
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<AuthResult> {
  const { email, password } = credentials;

  console.log('Attempting to authenticate user with Supabase Auth:', email);

  // Use Supabase's built-in authentication
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Supabase auth error:', error);
    throw new Error('Invalid credentials');
  }

  if (!data.user || !data.session) {
    console.log('No user or session returned from Supabase auth');
    throw new Error('Authentication failed');
  }

  console.log('User authenticated successfully with Supabase:', email);

  // Extract user metadata or use defaults
  const userMetadata = data.user.user_metadata || {};

  const user: User = {
    id: data.user.id,
    email: data.user.email!,
    firstName: userMetadata.first_name || '',
    lastName: userMetadata.last_name || '',
    role: normalizeRole(userMetadata.role),
  };

  const tokens: AuthTokens = {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };

  return {
    user,
    tokens,
  };
}

/**
 * Verify Supabase session token
 */
export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    const userMetadata = data.user.user_metadata || {};

    return {
      id: data.user.id,
      email: data.user.email!,
      firstName: userMetadata.first_name || '',
      lastName: userMetadata.last_name || '',
      role: normalizeRole(userMetadata.role),
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Get user by ID using Supabase Auth
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error || !data.user) {
      return null;
    }

    const userMetadata = data.user.user_metadata || {};

    return {
      id: data.user.id,
      email: data.user.email!,
      firstName: userMetadata.first_name || '',
      lastName: userMetadata.last_name || '',
      role: normalizeRole(userMetadata.role),
    };
  } catch (error) {
    console.error('Get user by ID error:', error);
    return null;
  }
}

/**
 * Validate session from cookies using Supabase Auth
 */
export async function validateSession(
  accessToken?: string,
  refreshToken?: string
): Promise<User | null> {
  if (!accessToken) {
    return null;
  }

  try {
    // Verify the access token with Supabase
    const user = await verifyToken(accessToken);
    return user;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Create a new user with Supabase Auth
 */
export async function createUser(email: string, password: string, metadata?: any): Promise<User> {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata,
      email_confirm: true, // Auto-confirm for development
    });

    if (error || !data.user) {
      console.error('Create user error:', error);
      throw new Error('Failed to create user');
    }

    const userMetadata = data.user.user_metadata || {};

    return {
      id: data.user.id,
      email: data.user.email!,
      firstName: userMetadata.first_name || '',
      lastName: userMetadata.last_name || '',
      role: userMetadata.role || 'admin',
    };
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
}
