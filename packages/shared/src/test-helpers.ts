/**
 * Shared test helpers and utilities
 * Provides type-safe test doubles and factory functions
 */

import type { Member, Staff, Visit, Plan, APIResponse } from './types/domain';

// Test factory functions for domain objects
export const createMockMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'member-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  companyId: 'company-123',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockStaff = (overrides: Partial<Staff> = {}): Staff => ({
  id: 'staff-123',
  email: 'staff@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '+1234567890',
  role: 'admin',
  companyId: 'company-123',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockVisit = (overrides: Partial<Visit> = {}): Visit => ({
  id: 'visit-123',
  memberId: 'member-123',
  companyId: 'company-123',
  checkInTime: new Date().toISOString(),
  visitType: 'checkin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockPlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 'plan-123',
  name: 'Basic Plan',
  description: 'Basic gym membership',
  price: 29.99,
  currency: 'USD',
  billingCycle: 'monthly',
  duration: 30,
  companyId: 'company-123',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// API Response helpers
export const createMockAPIResponse = <T>(
  data: T,
  overrides: Partial<APIResponse<T>> = {}
): APIResponse<T> => ({
  success: true,
  data,
  ...overrides,
});

export const createMockAPIError = (
  message: string,
  code?: string,
  statusCode?: number
): APIResponse<never> => ({
  success: false,
  error: {
    message,
    code,
    details: { statusCode },
  },
});

// Mock fetch helper for API tests
export const createMockFetch = (response: unknown, status = 200) => {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
    headers: new Headers(),
  });
};

// Error test helpers
export const expectToThrowAsync = async (
  fn: () => Promise<unknown>,
  expectedError?: string | RegExp
) => {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect((error as Error).message).toContain(expectedError);
      } else {
        expect((error as Error).message).toMatch(expectedError);
      }
    }
    return error;
  }
};

// Test data constants
export const TEST_CONSTANTS = {
  COMPANY_ID: 'test-company-123',
  MEMBER_ID: 'test-member-123',
  STAFF_ID: 'test-staff-123',
  VISIT_ID: 'test-visit-123',
  PLAN_ID: 'test-plan-123',
  EMAIL: 'test@testgym.mx',
  PASSWORD: 'TestPassword123!',
} as const;

// Type guards for tests
export const isError = (value: unknown): value is Error => {
  return value instanceof Error;
};

export const hasProperty = <T extends Record<string, unknown>>(
  obj: unknown,
  key: keyof T
): obj is T => {
  return typeof obj === 'object' && obj !== null && key in obj;
};

// Jest setup helpers
export const setupTestEnvironment = () => {
  // Mock console methods to reduce noise in tests
  const originalConsole = { ...console };

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    Object.assign(console, originalConsole);
  });
};

// Async test utilities
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const start = Date.now();

  while (!condition() && Date.now() - start < timeout) {
    await waitFor(interval);
  }

  if (!condition()) {
    throw new Error(`Condition not met within ${timeout}ms`);
  }
};
