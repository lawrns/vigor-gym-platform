/**
 * API Client Type Safety Tests
 *
 * These tests ensure that the apiClient object has the correct structure
 * and prevents accidental usage of generic HTTP methods.
 */

import { describe, it, expect } from '@jest/globals';
import { apiClient, api } from '../../lib/api/client';

describe('API Client Type Safety', () => {
  it('should have namespaced methods for members', () => {
    expect(apiClient.members).toBeDefined();
    expect(typeof apiClient.members.list).toBe('function');
    expect(typeof apiClient.members.get).toBe('function');
    expect(typeof apiClient.members.create).toBe('function');
    expect(typeof apiClient.members.update).toBe('function');
    expect(typeof apiClient.members.delete).toBe('function');
    expect(typeof apiClient.members.import).toBe('function');
  });

  it('should have namespaced methods for auth', () => {
    expect(apiClient.auth).toBeDefined();
    expect(typeof apiClient.auth.login).toBe('function');
    expect(typeof apiClient.auth.logout).toBe('function');
    expect(typeof apiClient.auth.refresh).toBe('function');
    expect(typeof apiClient.auth.me).toBe('function');
  });

  it('should have namespaced methods for other endpoints', () => {
    expect(apiClient.kpi).toBeDefined();
    expect(typeof apiClient.kpi.overview).toBe('function');

    expect(apiClient.companies).toBeDefined();
    expect(typeof apiClient.companies.create).toBe('function');

    expect(apiClient.plans).toBeDefined();
    expect(typeof apiClient.plans.list).toBe('function');

    expect(apiClient.billing).toBeDefined();
    expect(typeof apiClient.billing.createCheckoutSession).toBe('function');
  });

  it('should NOT have generic HTTP methods on apiClient', () => {
    // These should be undefined to prevent misuse
    expect((apiClient as any).get).toBeUndefined();
    expect((apiClient as any).post).toBeUndefined();
    expect((apiClient as any).patch).toBeUndefined();
    expect((apiClient as any).delete).toBeUndefined();
    expect((apiClient as any).put).toBeUndefined();
  });

  it('should have generic HTTP methods on api object', () => {
    // The generic methods should be available on the api object for one-off requests
    expect(typeof api.get).toBe('function');
    expect(typeof api.post).toBe('function');
    expect(typeof api.patch).toBe('function');
    expect(typeof api.delete).toBe('function');
    expect(typeof api.put).toBe('function');
  });

  it('should have health check method', () => {
    expect(typeof apiClient.health).toBe('function');
  });
});

// TypeScript compile-time tests
// These will fail compilation if the types are wrong

describe('TypeScript Compile-Time Safety', () => {
  it('should allow correct usage patterns', () => {
    // These should compile without errors
    const correctUsage = async () => {
      // ✅ Correct: Use namespaced methods
      await apiClient.members.list({ page: '1' });
      await apiClient.members.get('member-id');
      await apiClient.members.create({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });
      await apiClient.members.update('member-id', { firstName: 'Updated' });
      await apiClient.members.delete('member-id');
      await apiClient.members.import({ members: [] });

      await apiClient.auth.login({ email: 'test@example.com', password: 'password' });
      await apiClient.auth.me();

      await apiClient.kpi.overview();

      // ✅ Correct: Use api object for one-off requests
      await api.get('/custom/endpoint');
      await api.post('/custom/endpoint', { data: 'value' });
    };

    expect(correctUsage).toBeDefined();
  });

  // Note: The following would cause TypeScript compilation errors if uncommented:
  //
  // it('should prevent incorrect usage patterns', () => {
  //   const incorrectUsage = async () => {
  //     // ❌ These should cause TypeScript errors:
  //     // @ts-expect-error - apiClient.get does not exist by design
  //     await apiClient.get('/v1/members');
  //
  //     // @ts-expect-error - apiClient.post does not exist by design
  //     await apiClient.post('/v1/members', {});
  //
  //     // @ts-expect-error - apiClient.patch does not exist by design
  //     await apiClient.patch('/v1/members/123', {});
  //
  //     // @ts-expect-error - apiClient.delete does not exist by design
  //     await apiClient.delete('/v1/members/123');
  //   };
  // });
});
