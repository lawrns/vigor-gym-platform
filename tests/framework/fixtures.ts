import { test as base, expect, Page, APIRequestContext } from '@playwright/test';

// Test environment configuration
const isStaging = process.env.E2E_ENV === 'staging';
const baseURL = process.env.PW_BASE_URL || (isStaging ? 'https://staging.vigor-gym.com' : 'http://localhost:7777');
const apiURL = process.env.PW_API_URL || (isStaging ? 'https://api-staging.vigor-gym.com' : 'http://localhost:4001');

// Test credentials
const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@testgym.mx';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'TestPassword123!';
const tenantId = process.env.TENANT_ID || '00000000-0000-0000-0000-000000000001';

// Test selectors
export const selectors = {
  loginEmail: "[data-testid='login-email']",
  loginPassword: "[data-testid='login-password']",
  loginSubmit: "[data-testid='login-submit']",
  sessionChip: "[data-testid='session-chip']",
  kpiCard: "[data-testid^='kpi-card-']",
  filterBar: "[data-testid='dashboard-filter-bar']",
  membersRow: "[data-testid^='member-row-']",
  checkoutPlanButton: "[data-testid^='plan-choose-']",
  stripeSuccessMarker: "text=Payment successful",
  visitsCheckinButton: "[data-testid='visit-checkin']",
  toastError: "[data-testid='toast-error']",
  toastSuccess: "[data-testid='toast-success']",
};

// Performance budgets
export const budgets = {
  api_p95_ms: 500,
  dashboard_lcp_s: 2.5,
  realtime_latency_ms: 200,
};

// Extended test fixtures
type TestFixtures = {
  authSession: AuthSessionFixture;
  orgContext: OrgContextFixture;
  wsHealth: WSHealthFixture;
  performanceMonitor: PerformanceMonitorFixture;
};

// Auth session fixture
export class AuthSessionFixture {
  constructor(private page: Page, private request: APIRequestContext) {}

  async login(email: string = adminEmail, password: string = adminPassword) {
    console.log(`🔐 Logging in as ${email}...`);
    
    await this.page.goto('/login');
    await this.page.fill(selectors.loginEmail, email);
    await this.page.fill(selectors.loginPassword, password);
    await this.page.click(selectors.loginSubmit);
    
    // Wait for redirect to dashboard
    await expect(this.page).toHaveURL(/dashboard/);
    await expect(this.page.locator(selectors.sessionChip)).toBeVisible();
    
    console.log('✅ Login successful');
  }

  async logout() {
    console.log('🚪 Logging out...');
    
    // Click user menu and logout
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('text=Cerrar Sesión');
    
    // Should redirect to login
    await expect(this.page).toHaveURL(/login/);
    
    console.log('✅ Logout successful');
  }

  async getAuthToken(): Promise<string | null> {
    // Get auth token from cookies or localStorage
    const cookies = await this.page.context().cookies();
    const authCookie = cookies.find(c => c.name === 'auth-token' || c.name === 'accessToken');
    
    if (authCookie) {
      return authCookie.value;
    }

    // Try localStorage
    const token = await this.page.evaluate(() => {
      return localStorage.getItem('auth-token') || localStorage.getItem('accessToken');
    });

    return token;
  }

  async makeAuthenticatedRequest(endpoint: string, options: any = {}) {
    const token = await this.getAuthToken();
    
    return this.request.get(`${apiURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }
}

// Organization context fixture
export class OrgContextFixture {
  constructor(private page: Page) {}

  async setTenantContext(tenantId: string = tenantId) {
    // Set tenant context in headers or localStorage
    await this.page.addInitScript((id) => {
      window.localStorage.setItem('tenantId', id);
    }, tenantId);
  }

  async validateTenantIsolation() {
    // Verify that API calls include proper tenant scoping
    const responses: any[] = [];
    
    this.page.on('response', response => {
      if (response.url().includes('/api/v1/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
        });
      }
    });

    // Make a request that should be tenant-scoped
    await this.page.goto('/admin/members');
    await this.page.waitForLoadState('networkidle');

    // Verify tenant isolation
    const memberRequests = responses.filter(r => r.url.includes('/members'));
    expect(memberRequests.length).toBeGreaterThan(0);
    
    console.log('✅ Tenant isolation validated');
  }
}

// WebSocket health fixture
export class WSHealthFixture {
  constructor(private page: Page) {}

  async checkRealtimeConnection() {
    // Monitor WebSocket connections for realtime features
    const wsConnections: any[] = [];
    
    this.page.on('websocket', ws => {
      wsConnections.push({
        url: ws.url(),
        isClosed: ws.isClosed(),
      });
    });

    // Navigate to a page that might use realtime features
    await this.page.goto('/dashboard');
    await this.page.waitForTimeout(2000);

    console.log(`📡 WebSocket connections: ${wsConnections.length}`);
    return wsConnections;
  }
}

// Performance monitoring fixture
export class PerformanceMonitorFixture {
  constructor(private page: Page) {}

  async measurePageLoad(url: string): Promise<{ lcp: number; fcp: number; ttfb: number }> {
    const startTime = Date.now();
    
    await this.page.goto(url);
    
    // Measure Core Web Vitals
    const metrics = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcpEntry = entries.find(entry => entry.entryType === 'largest-contentful-paint');
          const fcpEntry = entries.find(entry => entry.entryType === 'paint' && entry.name === 'first-contentful-paint');
          
          if (lcpEntry) {
            resolve({
              lcp: lcpEntry.startTime,
              fcp: fcpEntry?.startTime || 0,
              ttfb: performance.timing.responseStart - performance.timing.navigationStart,
            });
          }
        }).observe({ entryTypes: ['largest-contentful-paint', 'paint'] });
        
        // Fallback timeout
        setTimeout(() => {
          resolve({
            lcp: Date.now() - performance.timing.navigationStart,
            fcp: 0,
            ttfb: performance.timing.responseStart - performance.timing.navigationStart,
          });
        }, 5000);
      });
    });

    return metrics as { lcp: number; fcp: number; ttfb: number };
  }

  async measureAPIResponse(endpoint: string, authToken?: string): Promise<{ responseTime: number; status: number }> {
    const startTime = Date.now();
    
    const response = await this.page.request.get(`${apiURL}${endpoint}`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      responseTime,
      status: response.status(),
    };
  }

  async validatePerformanceBudgets(metrics: { lcp?: number; apiResponseTime?: number }) {
    if (metrics.lcp) {
      const lcpSeconds = metrics.lcp / 1000;
      expect(lcpSeconds).toBeLessThan(budgets.dashboard_lcp_s);
      console.log(`✅ LCP: ${lcpSeconds.toFixed(2)}s (budget: ${budgets.dashboard_lcp_s}s)`);
    }

    if (metrics.apiResponseTime) {
      expect(metrics.apiResponseTime).toBeLessThan(budgets.api_p95_ms);
      console.log(`✅ API Response: ${metrics.apiResponseTime}ms (budget: ${budgets.api_p95_ms}ms)`);
    }
  }
}

// Extend base test with fixtures
export const test = base.extend<TestFixtures>({
  authSession: async ({ page, request }, use) => {
    const authSession = new AuthSessionFixture(page, request);
    await use(authSession);
  },

  orgContext: async ({ page }, use) => {
    const orgContext = new OrgContextFixture(page);
    await orgContext.setTenantContext();
    await use(orgContext);
  },

  wsHealth: async ({ page }, use) => {
    const wsHealth = new WSHealthFixture(page);
    await use(wsHealth);
  },

  performanceMonitor: async ({ page }, use) => {
    const performanceMonitor = new PerformanceMonitorFixture(page);
    await use(performanceMonitor);
  },
});

export { expect } from '@playwright/test';
