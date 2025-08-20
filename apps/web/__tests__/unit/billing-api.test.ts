import { apiClient } from '../../lib/api/client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('Billing API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Mock successful response by default
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      headers: new Headers(),
    });
  });

  describe('createSetupIntent', () => {
    it('should create setup intent without member ID', async () => {
      const mockResponse = {
        clientSecret: 'seti_test_client_secret',
        setupIntentId: 'seti_test_123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      const result = await apiClient.billing.createSetupIntent();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/billing/stripe/setup-intent'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ memberId: undefined }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should create setup intent with member ID', async () => {
      const memberId = 'member_123';
      const mockResponse = {
        clientSecret: 'seti_test_client_secret',
        setupIntentId: 'seti_test_123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      const result = await apiClient.billing.createSetupIntent(memberId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/billing/stripe/setup-intent'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ memberId }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        message: 'Failed to create SetupIntent',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => errorResponse,
        headers: new Headers(),
      });

      await expect(apiClient.billing.createSetupIntent()).rejects.toMatchObject({
        message: 'Failed to create SetupIntent',
        status: 500,
      });
    });
  });

  describe('getPaymentMethods', () => {
    it('should fetch payment methods', async () => {
      const mockPaymentMethods = [
        {
          id: 'pm_test_1',
          companyId: 'company_1',
          memberId: 'member_1',
          type: 'card',
          brand: 'visa',
          last4: '4242',
          stripePaymentMethodId: 'pm_stripe_1',
          isDefault: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: null,
          member: {
            id: 'member_1',
            firstName: 'Test',
            lastName: 'Member',
            email: 'test@example.com',
          },
        },
      ];

      const mockResponse = { paymentMethods: mockPaymentMethods };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      const result = await apiClient.billing.getPaymentMethods();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/billing/payment-methods'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle empty payment methods', async () => {
      const mockResponse = { paymentMethods: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      const result = await apiClient.billing.getPaymentMethods();

      expect(result).toEqual(mockResponse);
      expect(result.paymentMethods).toHaveLength(0);
    });
  });

  describe('setDefaultPaymentMethod', () => {
    it('should set default payment method', async () => {
      const paymentMethodId = 'pm_test_123';
      const mockResponse = {
        paymentMethod: {
          id: paymentMethodId,
          isDefault: true,
          type: 'card',
          brand: 'visa',
          last4: '4242',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      const result = await apiClient.billing.setDefaultPaymentMethod(paymentMethodId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/billing/payment-methods/default'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ paymentMethodId }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle invalid payment method ID', async () => {
      const paymentMethodId = 'invalid_id';
      const errorResponse = {
        message: 'Payment method not found',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
        headers: new Headers(),
      });

      await expect(
        apiClient.billing.setDefaultPaymentMethod(paymentMethodId)
      ).rejects.toMatchObject({
        message: 'Payment method not found',
        status: 404,
      });
    });
  });

  describe('createPortalSession', () => {
    it('should create portal session', async () => {
      const mockResponse = {
        url: 'https://billing.stripe.com/session/test_session_id',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      const result = await apiClient.billing.createPortalSession();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/billing/stripe/portal'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({}),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle portal creation errors', async () => {
      const errorResponse = {
        message: 'No Stripe customer found for this company',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
        headers: new Headers(),
      });

      await expect(apiClient.billing.createPortalSession()).rejects.toMatchObject({
        message: 'No Stripe customer found for this company',
        status: 400,
      });
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session', async () => {
      const planId = 'plan_test_123';
      const mockResponse = {
        provider: 'stripe',
        url: 'https://checkout.stripe.com/session/test_session_id',
        sessionId: 'cs_test_123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      const result = await apiClient.billing.createCheckoutSession(planId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/billing/checkout/session'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ planId }),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Network Error Handling', () => {
    it('should handle network failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.billing.getPaymentMethods()).rejects.toMatchObject({
        message: expect.stringContaining('Network request failed'),
      });
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(apiClient.billing.createSetupIntent()).rejects.toMatchObject({
        message: expect.stringContaining('Network request failed'),
      });
    });
  });
});
