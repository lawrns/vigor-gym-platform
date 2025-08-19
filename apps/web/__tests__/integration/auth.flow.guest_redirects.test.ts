import { describe, it, expect } from '@jest/globals';
import { isAPIClientError, isUnauthorizedError, isNetworkError } from '../../lib/http/errors';

describe('Auth Flow - Error Handling Integration', () => {
  describe('Error Type Guards Integration', () => {
    it('should handle auth initialization errors gracefully', () => {
      // Test that our error handling works with different error types
      const unauthorizedError = { status: 401, message: 'Unauthorized' };
      const networkError = new Error('Network request failed');
      const genericError = new Error('Something went wrong');

      expect(isUnauthorizedError(unauthorizedError)).toBe(true);
      expect(isNetworkError(networkError)).toBe(true);
      expect(isAPIClientError(unauthorizedError)).toBe(true);
      expect(isAPIClientError(genericError)).toBe(false);
    });

    it('should identify unauthorized errors', () => {
      const error = { status: 401 };
      expect(isUnauthorizedError(error)).toBe(true);
    });

    it('should identify network errors', () => {
      const fetchError = new Error('fetch failed');
      const connError = new Error('ECONNREFUSED');
      expect(isNetworkError(fetchError)).toBe(true);
      expect(isNetworkError(connError)).toBe(true);
    });

    it('should identify API client errors', () => {
      const error = { status: 500 };
      expect(isAPIClientError(error)).toBe(true);
      expect(isUnauthorizedError(error)).toBe(false);
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown');
      expect(isAPIClientError(error)).toBe(false);
      expect(isUnauthorizedError(error)).toBe(false);
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe('Auth Context Integration', () => {
    it('should import auth context without ReferenceError', async () => {
      // This test ensures that the auth context can be imported without
      // the ReferenceError: APIClientError is not defined
      expect(() => {
        require('../../lib/auth/context');
      }).not.toThrow();
    });

    it('should import error utilities without issues', () => {
      // Test that all error utilities are properly exported and importable
      expect(typeof isAPIClientError).toBe('function');
      expect(typeof isUnauthorizedError).toBe('function');
      expect(typeof isNetworkError).toBe('function');
    });
  });
});
