import type {
  Member,
  Plan,
  Membership,
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

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

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
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
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
          console.warn(`Authentication failed for ${endpoint}:`, errorData.message);
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

// HTTP method helpers
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

// Typed API endpoints
export const apiClient = {
  // Health check
  health: () => api.get<{ status: string }>('/health'),

  // KPI
  kpi: {
    overview: (opts?: { orgId?: string }) => {
      const headers: Record<string, string> = {};
      if (opts?.orgId) {
        headers['X-Org-Id'] = opts.orgId;
      }
      return apiRequest<KPIOverview>('/v1/kpi/overview', {
        method: 'GET',
        headers,
      });
    },
  },

  // Billing
  billing: {
    createCheckoutSession: (planId: string) =>
      api.post<{ provider: string; url: string; sessionId: string }>('/v1/billing/checkout/session', { planId }),
    getSubscription: () =>
      api.get<{ subscription: any }>('/v1/billing/subscription'),
    cancelSubscription: () =>
      api.post<{ message: string }>('/v1/billing/subscription/cancel', {}),
    getInvoices: (params?: { limit?: number; offset?: number }) =>
      api.get<{ invoices: any[]; total: number; limit: number; offset: number }>('/v1/billing/invoices', params),
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

    list: (params?: { status?: string; limit?: number; offset?: number }) =>
      api.get<PaginatedResponse<Membership>>('/v1/memberships', params),

    get: (id: string) =>
      api.get<{ membership: Membership }>(`/v1/memberships/${id}`),
  },

  // Memberships
  memberships: {
    create: (data: CreateMembershipRequest) =>
      api.post<Membership>('/v1/memberships', data),
  },

  // Auth endpoints
  auth: {
    login: (data: LoginRequest) =>
      api.post<AuthResponse>('/auth/login', data),

    logout: () =>
      api.post<{ message: string }>('/auth/logout'),

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
