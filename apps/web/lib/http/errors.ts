/**
 * HTTP Error Classes and Type Guards
 *
 * Provides resilient error handling across different runtime contexts.
 * Uses structural typing to avoid instanceof pitfalls across bundles.
 */

export class APIClientError extends Error {
  status: number;
  code?: string;
  data?: unknown;

  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message);
    this.name = 'APIClientError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

/**
 * Resilient type guard for API client errors
 *
 * Uses structural typing instead of instanceof to avoid issues with:
 * - Multiple class identities across bundles
 * - Tree-shaking complications
 * - Edge/Node runtime differences
 */
export function isAPIClientError(e: unknown): e is APIClientError {
  const x = e as Record<string, unknown>;
  return !!(
    x &&
    typeof x === 'object' &&
    (x.name === 'APIClientError' || typeof x.status === 'number')
  );
}

/**
 * Check if error is a 401 Unauthorized
 */
export function isUnauthorizedError(e: unknown): boolean {
  return isAPIClientError(e) && e.status === 401;
}

/**
 * Check if error is a network/connectivity issue
 */
export function isNetworkError(e: unknown): boolean {
  if (e instanceof Error) {
    return (
      e.message.includes('Network request failed') ||
      e.message.includes('fetch') ||
      e.message.includes('ECONNREFUSED')
    );
  }
  return false;
}
