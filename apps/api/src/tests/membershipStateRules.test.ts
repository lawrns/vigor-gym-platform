import { describe, it, expect } from 'vitest';

// Mock membership data for testing
interface MockMembership {
  id: string;
  status: 'active' | 'past_due' | 'frozen' | 'expired' | 'canceled';
  endsAt: Date | null;
}

/**
 * Evaluate membership state and determine access rules
 * (Copied from checkins.ts for testing)
 */
function evaluateMembershipState(membership: MockMembership): {
  allowed: boolean;
  denied: boolean;
  warning: boolean;
  state: 'OK' | 'PAST_DUE' | 'DENIED';
  code?: string;
  message: string;
} {
  const now = new Date();

  // Check if membership has expired by date
  if (membership.endsAt && membership.endsAt < now) {
    return {
      allowed: false,
      denied: true,
      warning: false,
      state: 'DENIED',
      code: 'MEMBERSHIP_EXPIRED',
      message: 'Membership has expired',
    };
  }

  // Business rules based on membership status
  switch (membership.status) {
    case 'active':
      return {
        allowed: true,
        denied: false,
        warning: false,
        state: 'OK',
        message: 'Access granted',
      };

    case 'past_due':
      // Allow access but show warning
      return {
        allowed: true,
        denied: false,
        warning: true,
        state: 'PAST_DUE',
        code: 'PAST_DUE',
        message: 'Access granted - membership payment overdue',
      };

    case 'frozen':
      // Deny access unless override flag (future implementation)
      return {
        allowed: false,
        denied: true,
        warning: false,
        state: 'DENIED',
        code: 'MEMBERSHIP_FROZEN',
        message: 'Membership is frozen',
      };

    case 'expired':
    case 'canceled':
      return {
        allowed: false,
        denied: true,
        warning: false,
        state: 'DENIED',
        code: 'NO_ACTIVE_MEMBERSHIP',
        message: 'No active membership found',
      };

    default:
      return {
        allowed: false,
        denied: true,
        warning: false,
        state: 'DENIED',
        code: 'INVALID_MEMBERSHIP_STATUS',
        message: 'Invalid membership status',
      };
  }
}

describe('Membership State Rules', () => {
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  describe('ACTIVE membership', () => {
    it('should allow access for active membership with no end date', () => {
      const membership: MockMembership = {
        id: '1',
        status: 'active',
        endsAt: null,
      };

      const result = evaluateMembershipState(membership);

      expect(result.allowed).toBe(true);
      expect(result.denied).toBe(false);
      expect(result.warning).toBe(false);
      expect(result.state).toBe('OK');
      expect(result.message).toBe('Access granted');
    });

    it('should allow access for active membership with future end date', () => {
      const membership: MockMembership = {
        id: '2',
        status: 'active',
        endsAt: futureDate,
      };

      const result = evaluateMembershipState(membership);

      expect(result.allowed).toBe(true);
      expect(result.denied).toBe(false);
      expect(result.warning).toBe(false);
      expect(result.state).toBe('OK');
    });

    it('should deny access for active membership with past end date', () => {
      const membership: MockMembership = {
        id: '3',
        status: 'active',
        endsAt: pastDate,
      };

      const result = evaluateMembershipState(membership);

      expect(result.allowed).toBe(false);
      expect(result.denied).toBe(true);
      expect(result.state).toBe('DENIED');
      expect(result.code).toBe('MEMBERSHIP_EXPIRED');
    });
  });

  describe('PAST_DUE membership', () => {
    it('should allow access with warning for past due membership', () => {
      const membership: MockMembership = {
        id: '4',
        status: 'past_due',
        endsAt: futureDate,
      };

      const result = evaluateMembershipState(membership);

      expect(result.allowed).toBe(true);
      expect(result.denied).toBe(false);
      expect(result.warning).toBe(true);
      expect(result.state).toBe('PAST_DUE');
      expect(result.code).toBe('PAST_DUE');
      expect(result.message).toBe('Access granted - membership payment overdue');
    });

    it('should deny access for past due membership with expired end date', () => {
      const membership: MockMembership = {
        id: '5',
        status: 'past_due',
        endsAt: pastDate,
      };

      const result = evaluateMembershipState(membership);

      expect(result.allowed).toBe(false);
      expect(result.denied).toBe(true);
      expect(result.state).toBe('DENIED');
      expect(result.code).toBe('MEMBERSHIP_EXPIRED');
    });
  });

  describe('FROZEN membership', () => {
    it('should deny access for frozen membership', () => {
      const membership: MockMembership = {
        id: '6',
        status: 'frozen',
        endsAt: futureDate,
      };

      const result = evaluateMembershipState(membership);

      expect(result.allowed).toBe(false);
      expect(result.denied).toBe(true);
      expect(result.warning).toBe(false);
      expect(result.state).toBe('DENIED');
      expect(result.code).toBe('MEMBERSHIP_FROZEN');
      expect(result.message).toBe('Membership is frozen');
    });
  });

  describe('EXPIRED membership', () => {
    it('should deny access for expired membership', () => {
      const membership: MockMembership = {
        id: '7',
        status: 'expired',
        endsAt: pastDate,
      };

      const result = evaluateMembershipState(membership);

      expect(result.allowed).toBe(false);
      expect(result.denied).toBe(true);
      expect(result.state).toBe('DENIED');
      expect(result.code).toBe('NO_ACTIVE_MEMBERSHIP');
      expect(result.message).toBe('No active membership found');
    });
  });

  describe('CANCELED membership', () => {
    it('should deny access for canceled membership', () => {
      const membership: MockMembership = {
        id: '8',
        status: 'canceled',
        endsAt: null,
      };

      const result = evaluateMembershipState(membership);

      expect(result.allowed).toBe(false);
      expect(result.denied).toBe(true);
      expect(result.state).toBe('DENIED');
      expect(result.code).toBe('NO_ACTIVE_MEMBERSHIP');
      expect(result.message).toBe('No active membership found');
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid membership status', () => {
      const membership = {
        id: '9',
        status: 'invalid_status' as any,
        endsAt: null,
      };

      const result = evaluateMembershipState(membership);

      expect(result.allowed).toBe(false);
      expect(result.denied).toBe(true);
      expect(result.state).toBe('DENIED');
      expect(result.code).toBe('INVALID_MEMBERSHIP_STATUS');
      expect(result.message).toBe('Invalid membership status');
    });

    it('should prioritize date expiration over status', () => {
      // Even if status is active, expired date should deny access
      const membership: MockMembership = {
        id: '10',
        status: 'active',
        endsAt: pastDate,
      };

      const result = evaluateMembershipState(membership);

      expect(result.denied).toBe(true);
      expect(result.code).toBe('MEMBERSHIP_EXPIRED');
    });
  });

  describe('Table-driven test cases', () => {
    const testCases = [
      {
        name: 'Active with no end date',
        membership: { id: '1', status: 'active' as const, endsAt: null },
        expected: { allowed: true, state: 'OK' },
      },
      {
        name: 'Active with future end date',
        membership: { id: '2', status: 'active' as const, endsAt: futureDate },
        expected: { allowed: true, state: 'OK' },
      },
      {
        name: 'Active with past end date',
        membership: { id: '3', status: 'active' as const, endsAt: pastDate },
        expected: { allowed: false, state: 'DENIED', code: 'MEMBERSHIP_EXPIRED' },
      },
      {
        name: 'Past due with future end date',
        membership: { id: '4', status: 'past_due' as const, endsAt: futureDate },
        expected: { allowed: true, state: 'PAST_DUE', warning: true },
      },
      {
        name: 'Past due with past end date',
        membership: { id: '5', status: 'past_due' as const, endsAt: pastDate },
        expected: { allowed: false, state: 'DENIED', code: 'MEMBERSHIP_EXPIRED' },
      },
      {
        name: 'Frozen membership',
        membership: { id: '6', status: 'frozen' as const, endsAt: futureDate },
        expected: { allowed: false, state: 'DENIED', code: 'MEMBERSHIP_FROZEN' },
      },
      {
        name: 'Expired membership',
        membership: { id: '7', status: 'expired' as const, endsAt: pastDate },
        expected: { allowed: false, state: 'DENIED', code: 'NO_ACTIVE_MEMBERSHIP' },
      },
      {
        name: 'Canceled membership',
        membership: { id: '8', status: 'canceled' as const, endsAt: null },
        expected: { allowed: false, state: 'DENIED', code: 'NO_ACTIVE_MEMBERSHIP' },
      },
    ];

    testCases.forEach(({ name, membership, expected }) => {
      it(`should handle ${name}`, () => {
        const result = evaluateMembershipState(membership);

        expect(result.allowed).toBe(expected.allowed);
        expect(result.state).toBe(expected.state);

        if (expected.code) {
          expect(result.code).toBe(expected.code);
        }

        if (expected.warning !== undefined) {
          expect(result.warning).toBe(expected.warning);
        }
      });
    });
  });
});
