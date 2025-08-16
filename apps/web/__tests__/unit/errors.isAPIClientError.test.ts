import { describe, it, expect } from '@jest/globals';
import { isAPIClientError, APIClientError, isUnauthorizedError, isNetworkError } from '../../lib/http/errors';

describe('Error Type Guards', () => {
  describe('isAPIClientError', () => {
    it('detects APIClientError instance', () => {
      const e = new APIClientError('test error', 401);
      expect(isAPIClientError(e)).toBe(true);
    });

    it('detects structural {status} object', () => {
      const e = { name: 'APIClientError', status: 403, message: 'Forbidden' } as any;
      expect(isAPIClientError(e)).toBe(true);
    });

    it('detects object with status number', () => {
      const e = { status: 500, message: 'Server Error' } as any;
      expect(isAPIClientError(e)).toBe(true);
    });

    it('rejects non-matching objects', () => {
      expect(isAPIClientError(new Error('regular error'))).toBe(false);
      expect(isAPIClientError({ message: 'no status' })).toBe(false);
      expect(isAPIClientError(null)).toBe(false);
      expect(isAPIClientError(undefined)).toBe(false);
      expect(isAPIClientError('string')).toBe(false);
      expect(isAPIClientError(42)).toBe(false);
    });
  });

  describe('isUnauthorizedError', () => {
    it('detects 401 APIClientError', () => {
      const e = new APIClientError('Unauthorized', 401);
      expect(isUnauthorizedError(e)).toBe(true);
    });

    it('detects 401 structural object', () => {
      const e = { status: 401, message: 'Unauthorized' } as any;
      expect(isUnauthorizedError(e)).toBe(true);
    });

    it('rejects non-401 errors', () => {
      const e403 = new APIClientError('Forbidden', 403);
      const e500 = new APIClientError('Server Error', 500);
      const regularError = new Error('Not an API error');

      expect(isUnauthorizedError(e403)).toBe(false);
      expect(isUnauthorizedError(e500)).toBe(false);
      expect(isUnauthorizedError(regularError)).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('detects network request failures', () => {
      const networkError = new Error('Network request failed');
      const fetchError = new Error('fetch failed');
      const connRefused = new Error('ECONNREFUSED');

      expect(isNetworkError(networkError)).toBe(true);
      expect(isNetworkError(fetchError)).toBe(true);
      expect(isNetworkError(connRefused)).toBe(true);
    });

    it('rejects non-network errors', () => {
      const regularError = new Error('Something else');
      const apiError = new APIClientError('Bad Request', 400);

      expect(isNetworkError(regularError)).toBe(false);
      expect(isNetworkError(apiError)).toBe(false);
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
    });
  });

  describe('APIClientError class', () => {
    it('creates error with all properties', () => {
      const error = new APIClientError('Test message', 404, 'NOT_FOUND', { extra: 'data' });

      expect(error.message).toBe('Test message');
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.data).toEqual({ extra: 'data' });
      expect(error.name).toBe('APIClientError');
      expect(error instanceof Error).toBe(true);
    });

    it('creates error with minimal properties', () => {
      const error = new APIClientError('Simple error', 500);

      expect(error.message).toBe('Simple error');
      expect(error.status).toBe(500);
      expect(error.code).toBeUndefined();
      expect(error.data).toBeUndefined();
      expect(error.name).toBe('APIClientError');
    });
  });
});
