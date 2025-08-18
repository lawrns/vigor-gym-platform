import type {
  Member,
  Plan,
  Membership,
  PaymentMethod,
  Company,
  KPIOverview,
  PaginatedResponse,
  PlansResponse,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CreateMemberRequest,
  UpdateMemberRequest,
  CreateMembershipRequest,
  AuthResponse,
  LoginRequest,
  APIError,
  APIResponse
} from './types';

// Configuration - Use same-origin proxy in browser, direct API in server
const API_BASE_URL = typeof window !== 'undefined'
  ? '' // Use same-origin proxy for browser requests
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'; // Direct API for server requests

// Error classes
export class APIClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: APIError
  ) {
    super(message);
    this.name = 'APIClientError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Token management
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

// Core fetch wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Add auth token if available
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Include cookies for authentication
  };

  try {
    const response = await fetch(url, config);

    // Handle different response types
    if (!response.ok) {
      let errorData: APIError;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }

      // Handle specific status codes
      if (response.status === 401 || response.status === 419) {
        // Clear token and emit global auth error
        setAuthToken(null);
        if (typeof window !== 'undefined') {
          // Don't log 401 for expected guest endpoints
          const isExpectedGuestEndpoint = (
            endpoint.endsWith('/auth/me') ||
            endpoint.includes('/kpi/overview') ||
            endpoint.includes('/api/kpi/overview')
          ) && response.status === 401;

          if (!isExpectedGuestEndpoint) {
            console.warn(`[API] Authentication failed for ${endpoint}:`, errorData.message);
          } else {
            console.debug(`[API] Expected 401 for guest endpoint:`, endpoint);
          }

          // Emit custom event for auth context to handle
          window.dispatchEvent(new CustomEvent('auth-error', {
            detail: { status: response.status, endpoint, message: errorData.message }
          }));
        }
      } else if (response.status === 429) {
        // Rate limiting - show toast
        if (typeof window !== 'undefined') {
          console.warn(`Rate limit exceeded for ${endpoint}`);
          // Import PostHog dynamically to show toast
          import('posthog-js').then(({ default: posthog }) => {
            posthog.capture('api.rate_limit', { endpoint });
          });
        }
      }

      throw new APIClientError(
        errorData.message || `Request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    // Handle empty responses
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof APIClientError) {
      throw error;
    }

    // Network or parsing errors
    if (typeof window !== 'undefined') {
      console.error(`Network error for ${endpoint}:`, error);
      // Check if it's a connection refused error (API server not running)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`API server appears to be unreachable at ${API_BASE_URL}. Please ensure the API server is running.`);
      }
    }

    throw new NetworkError(
      `Network request failed for ${endpoint}. Please check if the API server is running.`,
      error as Error
    );
  }
}

// HTTP method helpers - Use these for one-off requests
// For standard endpoints, prefer the typed apiClient methods instead
export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>): Promise<T> => {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return apiRequest<T>(url, { method: 'GET' });
  },

  post: <T>(endpoint: string, data?: any): Promise<T> => {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  patch: <T>(endpoint: string, data?: any): Promise<T> => {
    return apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put: <T>(endpoint: string, data?: any): Promise<T> => {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete: <T>(endpoint: string): Promise<T> => {
    return apiRequest<T>(endpoint, { method: 'DELETE' });
  },
};

// TypeScript guardrail: Define strict types to prevent generic HTTP method usage
type MembersAPI = {
  list: (params?: { search?: string; page?: string; pageSize?: string; status?: string }) => Promise<{ members: any[]; pagination: any }>;
  get: (id: string) => Promise<{ member: any }>;
  create: (data: { email: string; firstName: string; lastName: string; status?: string }) => Promise<{ member: any }>;
  update: (id: string, data: Partial<{ email: string; firstName: string; lastName: string; status: string }>) => Promise<{ member: any }>;
  delete: (id: string) => Promise<{ message: string }>;
  import: (data: { members: any[] }) => Promise<{ message: string; members: any[]; count: number }>;
};

type AuthAPI = {
  login: (data: LoginRequest) => Promise<AuthResponse>;
  logout: () => Promise<{ message: string }>;
  refresh: (data: { refreshToken?: string }) => Promise<AuthResponse>;
  me: () => Promise<{ user: AuthResponse['user']; accessToken?: string }>;
};

type KPIAPI = {
  overview: (opts?: { orgId?: string }) => Promise<KPIOverview>;
};

type CompaniesAPI = {
  create: (data: CreateCompanyRequest) => Promise<{ company: Company }>;
  get: (id: string) => Promise<{ company: Company }>;
  update: (id: string, data: UpdateCompanyRequest) => Promise<{ company: Company }>;
  me: () => Promise<{ company: Company }>;
};

type PlansAPI = {
  list: () => Promise<PlansResponse>;
  listPublic: () => Promise<PlansResponse>;
};

type BillingAPI = {
  createCheckoutSession: (planId: string) => Promise<{ provider: string; url: string; sessionId: string }>;
  createSetupIntent: (memberId?: string) => Promise<{ clientSecret: string; setupIntentId: string }>;
  createSubscription: (data: { planId: string; paymentMethodId?: string; memberId?: string }) => Promise<{ subscriptionId: string; status: string; clientSecret?: string }>;
  getPaymentMethods: () => Promise<{ paymentMethods: PaymentMethod[] }>;
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<{ paymentMethod: PaymentMethod }>;
  updatePaymentMethod: (paymentMethodId: string, data: { memberId?: string }) => Promise<{ paymentMethod: PaymentMethod }>;
  deletePaymentMethod: (paymentMethodId: string) => Promise<{ success: boolean }>;
  createPortalSession: () => Promise<{ url: string }>;
  getSubscription: () => Promise<{ subscription: any }>;
  cancelSubscription: () => Promise<{ message: string }>;
  getInvoices: (params?: { limit?: number; offset?: number }) => Promise<{ invoices: any[]; total: number; limit: number; offset: number }>;
};

// Strict API client type - intentionally excludes generic HTTP methods
type ApiClient = {
  health: () => Promise<{ status: string }>;
  kpi: KPIAPI;
  billing: BillingAPI;
  members: MembersAPI;
  companies: CompaniesAPI;
  plans: PlansAPI;
  memberships: {
    create: (data: CreateMembershipRequest) => Promise<{ membership: Membership }>;
    list: (params?: { status?: string; limit?: number; offset?: number }) => Promise<PaginatedResponse<Membership>>;
    get: (id: string) => Promise<{ membership: Membership }>;
  };
  auth: AuthAPI;
  // NOTE: Intentionally NO get/post/patch/delete methods here to prevent misuse
};

// Typed API endpoints
export const apiClient: ApiClient = {
  // Health check
  health: () => api.get<{ status: string }>('/health'),

  // KPI
  kpi: {
    overview: (opts?: {
      orgId?: string;
      from?: string;
      to?: string;
      compareFrom?: string;
      compareTo?: string;
    }) => {
      const headers: Record<string, string> = {};
      if (opts?.orgId) {
        headers['X-Org-Id'] = opts.orgId;
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (opts?.from) params.set('from', opts.from);
      if (opts?.to) params.set('to', opts.to);
      if (opts?.compareFrom) params.set('compareFrom', opts.compareFrom);
      if (opts?.compareTo) params.set('compareTo', opts.compareTo);
      const queryString = params.toString();

      // Use proxy route to ensure cookies and tenant context are forwarded
      return apiRequest<KPIOverview>(`/api/kpi/overview${queryString ? `?${queryString}` : ''}`, {
        method: 'GET',
        headers,
      });
    },
  },

  // Billing
  billing: {
    createCheckoutSession: (planId: string) =>
      api.post<{ provider: string; url: string; sessionId: string }>('/v1/billing/checkout/session', { planId }),
    createSetupIntent: (memberId?: string) =>
      api.post<{ clientSecret: string; setupIntentId: string }>('/v1/billing/stripe/setup-intent', { memberId }),
    createSubscription: (data: { planId: string; paymentMethodId?: string; memberId?: string }) =>
      api.post<{ subscriptionId: string; status: string; clientSecret?: string }>('/v1/billing/subscription', data),
    getPaymentMethods: () =>
      api.get<{ paymentMethods: PaymentMethod[] }>('/v1/billing/payment-methods'),
    setDefaultPaymentMethod: (paymentMethodId: string) =>
      api.post<{ paymentMethod: PaymentMethod }>('/v1/billing/payment-methods/default', { paymentMethodId }),
    updatePaymentMethod: (paymentMethodId: string, data: { memberId?: string }) =>
      api.patch<{ paymentMethod: PaymentMethod }>(`/v1/billing/payment-methods/${paymentMethodId}`, data),
    deletePaymentMethod: (paymentMethodId: string) =>
      api.delete<{ success: boolean }>(`/v1/billing/payment-methods/${paymentMethodId}`),
    createPortalSession: () =>
      api.post<{ url: string }>('/v1/billing/stripe/portal', {}),
    getSubscription: () =>
      api.get<{ subscription: any }>('/v1/billing/subscription'),
    cancelSubscription: () =>
      api.post<{ message: string }>('/v1/billing/subscription/cancel', {}),
    getInvoices: (params?: { limit?: number; offset?: number }) => {
      const stringParams = params ? {
        ...(params.limit !== undefined && { limit: params.limit.toString() }),
        ...(params.offset !== undefined && { offset: params.offset.toString() })
      } : undefined;
      return api.get<{ invoices: any[]; total: number; limit: number; offset: number }>('/v1/billing/invoices', stringParams);
    },
  },

  // Members
  members: {
    list: (params?: { search?: string; page?: string; pageSize?: string; status?: string }) =>
      api.get<{ members: any[]; pagination: any }>('/v1/members', params),
    get: (id: string) =>
      api.get<{ member: any }>(`/v1/members/${id}`),
    create: (data: { email: string; firstName: string; lastName: string; status?: string }) =>
      api.post<{ member: any }>('/v1/members', data),
    update: (id: string, data: Partial<{ email: string; firstName: string; lastName: string; status: string }>) =>
      api.patch<{ member: any }>(`/v1/members/${id}`, data),
    delete: (id: string) =>
      api.delete<{ message: string }>(`/v1/members/${id}`),
    import: (data: { members: any[] }) =>
      api.post<{ message: string; members: any[]; count: number }>('/v1/members/import', data),
  },



  // Companies
  companies: {
    create: (data: CreateCompanyRequest) =>
      api.post<{ company: Company }>('/v1/companies', data),

    get: (id: string) =>
      api.get<{ company: Company }>(`/v1/companies/${id}`),

    update: (id: string, data: UpdateCompanyRequest) =>
      api.patch<{ company: Company }>(`/v1/companies/${id}`, data),

    me: () =>
      api.get<{ company: Company }>('/v1/companies/me'),
  },

  // Plans
  plans: {
    list: () => api.get<PlansResponse>('/v1/plans'),
    listPublic: () => api.get<PlansResponse>('/v1/plans/public'),
  },

  // Memberships
  memberships: {
    create: (data: CreateMembershipRequest) =>
      api.post<{ membership: Membership }>('/v1/memberships', data),

    list: (params?: { status?: string; limit?: number; offset?: number }) => {
      const stringParams = params ? {
        ...(params.status && { status: params.status }),
        ...(params.limit !== undefined && { limit: params.limit.toString() }),
        ...(params.offset !== undefined && { offset: params.offset.toString() })
      } : undefined;
      return api.get<PaginatedResponse<Membership>>('/v1/memberships', stringParams);
    },

    get: (id: string) =>
      api.get<{ membership: Membership }>(`/v1/memberships/${id}`),
  },

  // Auth endpoints
  auth: {
    login: (data: LoginRequest) =>
      api.post<AuthResponse>('/auth/login', data),

    logout: () =>
      api.post<{ message: string }>('/api/auth/logout'),

    refresh: (data: { refreshToken?: string }) =>
      api.post<AuthResponse>('/auth/refresh', data),

    me: () =>
      api.get<{ user: AuthResponse['user']; accessToken?: string }>('/auth/me'),
  },
};

// Utility function to check if response is an error
export function isAPIError(response: any): response is APIError {
  return response && typeof response.message === 'string';
}

// Export for convenience
export default apiClient;
