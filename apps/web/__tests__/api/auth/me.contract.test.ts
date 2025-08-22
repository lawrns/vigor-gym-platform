/**
 * Contract Tests for /api/auth/me
 *
 * These tests ensure:
 * - 200 on first render post-login
 * - No guest flicker (proper auth state handling)
 * - ≥1 nav item visible (role normalization works)
 *
 * Contract: The /api/auth/me endpoint must provide consistent authentication
 * state that prevents UI flicker and ensures proper navigation rendering.
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock dependencies
jest.mock('../../../lib/auth/session');
jest.mock('../../../lib/auth/supabase-auth');

import { getServerSession } from '../../../lib/auth/session';
import { getUserById } from '../../../lib/auth/supabase-auth';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>;

// Mock NextRequest for testing
class MockNextRequest {
  public cookies: Map<string, { value: string }>;
  public url: string;

  constructor(url: string, options: { headers?: { cookie?: string } } = {}) {
    this.url = url;
    this.cookies = new Map();

    if (options.headers?.cookie) {
      // Parse cookie string
      const cookiePairs = options.headers.cookie.split(';');
      for (const pair of cookiePairs) {
        const [name, value] = pair.split('=').map(s => s.trim());
        if (name && value !== undefined) {
          this.cookies.set(name, { value }) as any;
        }
      }
    }
  }

  get(name: string) {
    return this.cookies.get(name);
  }
}

// Import the GET function dynamically to avoid module loading issues
let GET: any;

describe('/api/auth/me Contract Tests', () => {
  beforeAll(async () => {
    // Dynamically import the route handler
    const routeModule = await import('../../../app/api/auth/me/route');
    GET = routeModule.GET;
  }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    delete process.env.NODE_ENV;
  }) as any;

  afterEach(() => {
    jest.restoreAllMocks();
  }) as any;

  describe('Contract: 200 on first render post-login', () => {
    it('should return 200 with valid user data immediately after login (dev mode)', async () => {
      // Arrange: Simulate development environment with JWT session
      process.env.NODE_ENV = 'development';

      const mockRequest = new MockNextRequest('http://localhost:7777/api/auth/me', {
        headers: {
          cookie: 'accessToken=valid-jwt-token'
        }
      }) as any;

      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'admin@testgym.mx',
        role: 'admin',
        companyId: 'company-456'
      }) as any;

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert: Contract requirements
      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('admin@testgym.mx');
      expect(data.user.role).toBe('owner'); // Role normalization
      expect(data.user.company).toBeDefined();
      expect(data.user.company.id).toBe('company-456');
    }) as any;

    it('should return 200 with valid user data immediately after login (production mode)', async () => {
      // Arrange: Simulate production environment with Supabase auth
      process.env.NODE_ENV = 'production';

      const mockRequest = new MockNextRequest('http://localhost:7777/api/auth/me', {
        headers: {
          cookie: 'accessToken=valid-supabase-token'
        }
      }) as any;

      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'admin@testgym.mx',
        role: 'admin'
      }) as any;

      mockGetUserById.mockResolvedValue({
        id: 'user-123',
        email: 'admin@testgym.mx',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      }) as any;

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert: Contract requirements
      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('admin@testgym.mx');
      expect(data.user.role).toBe('owner'); // Role normalization
      expect(data.user.firstName).toBe('Admin');
      expect(data.user.lastName).toBe('User');
    }) as any;
  }) as any;

  describe('Contract: No guest flicker (proper 401 handling)', () => {
    it('should return 401 immediately when no accessToken cookie is present', async () => {
      // Arrange: Request without auth cookie
      const mockRequest = new MockNextRequest('http://localhost:7777/api/auth/me') as any;

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert: Should fail fast to prevent guest flicker
      expect(response.status).toBe(401);
      expect(data.message).toBe('Authentication required');

      // Verify no session lookup was attempted (fast failure)
      expect(mockGetServerSession).not.toHaveBeenCalled();
      expect(mockGetUserById).not.toHaveBeenCalled();
    }) as any;

    it('should return 401 immediately when accessToken cookie is empty', async () => {
      // Arrange: Request with empty auth cookie
      const mockRequest = new MockNextRequest('http://localhost:7777/api/auth/me', {
        headers: {
          cookie: 'accessToken='
        }
      }) as any;

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert: Should fail fast to prevent guest flicker
      expect(response.status).toBe(401);
      expect(data.message).toBe('Authentication required');

      // Verify no session lookup was attempted (fast failure)
      expect(mockGetServerSession).not.toHaveBeenCalled();
      expect(mockGetUserById).not.toHaveBeenCalled();
    }) as any;

    it('should return 401 when session validation fails', async () => {
      // Arrange: Invalid token that fails session validation
      const mockRequest = new MockNextRequest('http://localhost:7777/api/auth/me', {
        headers: {
          cookie: 'accessToken=invalid-token'
        }
      }) as any;

      mockGetServerSession.mockResolvedValue(null);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert: Should return 401 for invalid session
      expect(response.status).toBe(401);
      expect(data.message).toBe('Authentication required');
      expect(mockGetServerSession).toHaveBeenCalledWith('invalid-token');
    }) as any;
  }) as any;

  describe('Contract: Role normalization ensures ≥1 nav item visible', () => {
    it('should normalize admin role to owner for consistent navigation', async () => {
      // Arrange: User with admin role (should be normalized to owner)
      process.env.NODE_ENV = 'development';
      
      const mockRequest = new MockNextRequest('http://localhost:7777/api/auth/me', {
        headers: {
          cookie: 'accessToken=valid-jwt-token'
        }
      }) as any;

      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'admin@testgym.mx',
        role: 'admin', // Input: admin role
        companyId: 'company-456'
      }) as any;

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert: Role normalization contract
      expect(response.status).toBe(200);
      expect(data.user.role).toBe('owner'); // Output: normalized to owner
      
      // This ensures navigation will show ≥1 nav item since 'owner' role
      // has full access to all navigation items in the HeaderBar component
    }) as any;

    it('should preserve non-admin roles without normalization', async () => {
      // Arrange: User with member role (should not be normalized)
      process.env.NODE_ENV = 'production';
      
      const mockRequest = new MockNextRequest('http://localhost:7777/api/auth/me', {
        headers: {
          cookie: 'accessToken=valid-supabase-token'
        }
      }) as any;

      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'member@testgym.mx',
        role: 'member'
      }) as any;

      mockGetUserById.mockResolvedValue({
        id: 'user-123',
        email: 'member@testgym.mx',
        firstName: 'Member',
        lastName: 'User',
        role: 'member' // Input: member role
      }) as any;

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert: No normalization for non-admin roles
      expect(response.status).toBe(200);
      expect(data.user.role).toBe('member'); // Output: unchanged
    }) as any;
  }) as any;

  describe('Contract: Error handling maintains consistency', () => {
    it('should return 404 when user not found in database', async () => {
      // Arrange: Valid session but user not in database
      process.env.NODE_ENV = 'production';
      
      const mockRequest = new MockNextRequest('http://localhost:7777/api/auth/me', {
        headers: {
          cookie: 'accessToken=valid-token'
        }
      }) as any;

      mockGetServerSession.mockResolvedValue({
        userId: 'nonexistent-user',
        email: 'ghost@testgym.mx',
        role: 'admin'
      }) as any;

      mockGetUserById.mockResolvedValue(null);

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert: Proper error handling
      expect(response.status).toBe(404);
      expect(data.message).toBe('User not found');
    }) as any;

    it('should return 500 when unexpected error occurs', async () => {
      // Arrange: Simulate database error
      const mockRequest = new MockNextRequest('http://localhost:7777/api/auth/me', {
        headers: {
          cookie: 'accessToken=valid-token'
        }
      }) as any;

      mockGetServerSession.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert: Graceful error handling
      expect(response.status).toBe(500);
      expect(data.message).toBe('Internal server error');
    }) as any;
  }) as any;

  describe('Contract: Response format consistency', () => {
    it('should always return user object with required fields', async () => {
      // Arrange: Standard successful request
      process.env.NODE_ENV = 'development';
      
      const mockRequest = new MockNextRequest('http://localhost:7777/api/auth/me', {
        headers: {
          cookie: 'accessToken=valid-jwt-token'
        }
      }) as any;

      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'admin@testgym.mx',
        role: 'admin',
        companyId: 'company-456'
      }) as any;

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert: Response format contract
      expect(data).toHaveProperty('user');
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('email');
      expect(data.user).toHaveProperty('firstName');
      expect(data.user).toHaveProperty('lastName');
      expect(data.user).toHaveProperty('role');
      expect(data.user).toHaveProperty('company');
      
      // Ensure all required fields are present for UI consumption
      expect(typeof data.user.id).toBe('string');
      expect(typeof data.user.email).toBe('string');
      expect(typeof data.user.role).toBe('string');
    }) as any;
  }) as any;
}) as any;
