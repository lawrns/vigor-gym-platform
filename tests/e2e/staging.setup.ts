import { test as setup, expect } from '@playwright/test';
import { stagingConfig } from '../../playwright.staging.config';

/**
 * Staging environment setup and validation
 * Ensures the staging environment is ready for comprehensive E2E testing
 */

setup.describe('Staging Environment Setup', () => {
  setup('validate staging environment health', async ({ page, request }) => {
    console.log('🏥 Validating staging environment health...');

    // Test 1: Web application health
    console.log('📱 Testing web application...');
    await page.goto('/');
    await expect(page).toHaveTitle(/Vigor/);

    // Test 2: API health check
    console.log('🔌 Testing API health...');
    const apiHealth = await request.get(`${stagingConfig.API_BASE_URL}/health`);
    expect(apiHealth.ok()).toBeTruthy();

    const healthData = await apiHealth.json();
    expect(healthData.status).toBe('ok');

    // Test 3: Database connectivity (via API)
    console.log('🗄️ Testing database connectivity...');
    const metricsHealth = await request.get(`${stagingConfig.API_BASE_URL}/v1/metrics/health`);
    expect(metricsHealth.ok()).toBeTruthy();

    const metricsData = await metricsHealth.json();
    expect(metricsData.database).toBe('connected');

    console.log('✅ Staging environment health validated');
  });

  setup('validate test user authentication', async ({ page, request }) => {
    console.log('🔐 Validating test user authentication...');

    // Test login via API
    const loginResponse = await request.post(`${stagingConfig.API_BASE_URL}/auth/login`, {
      data: {
        email: stagingConfig.TEST_USER.email,
        password: stagingConfig.TEST_USER.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.user).toBeDefined();
    expect(loginData.user.email).toBe(stagingConfig.TEST_USER.email);

    // Test login via web interface
    await page.goto('/login');
    await page.fill('input[name="email"]', stagingConfig.TEST_USER.email);
    await page.fill('input[name="password"]', stagingConfig.TEST_USER.password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');

    console.log('✅ Test user authentication validated');
  });

  setup('validate core API endpoints', async ({ request }) => {
    console.log('🔗 Validating core API endpoints...');

    // First, authenticate to get session
    const loginResponse = await request.post(`${stagingConfig.API_BASE_URL}/auth/login`, {
      data: {
        email: stagingConfig.TEST_USER.email,
        password: stagingConfig.TEST_USER.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    // Extract cookies for authenticated requests
    const cookies = loginResponse.headers()['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';

    // Test KPI endpoint
    const kpiResponse = await request.get(`${stagingConfig.API_BASE_URL}/v1/kpi/overview`, {
      headers: { Cookie: cookieHeader },
    });
    expect(kpiResponse.ok()).toBeTruthy();

    // Test billing endpoints
    const paymentMethodsResponse = await request.get(
      `${stagingConfig.API_BASE_URL}/v1/billing/payment-methods`,
      {
        headers: { Cookie: cookieHeader },
      }
    );
    expect(paymentMethodsResponse.ok()).toBeTruthy();

    // Test metrics endpoints
    const authMetricsResponse = await request.get(`${stagingConfig.API_BASE_URL}/v1/metrics/auth`, {
      headers: { Cookie: cookieHeader },
    });
    expect(authMetricsResponse.ok()).toBeTruthy();

    console.log('✅ Core API endpoints validated');
  });

  setup('validate Stripe integration', async ({ page }) => {
    console.log('💳 Validating Stripe integration...');

    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', stagingConfig.TEST_USER.email);
    await page.fill('input[name="password"]', stagingConfig.TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);

    // Navigate to a member billing page (we'll use a test member)
    await page.goto('/admin/members');

    // Check if we can access billing functionality
    // This validates that Stripe is properly configured
    const billingElements = await page.locator('text=Facturación').count();
    expect(billingElements).toBeGreaterThan(0);

    console.log('✅ Stripe integration validated');
  });

  setup('validate observability features', async ({ page, request }) => {
    console.log('📊 Validating observability features...');

    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', stagingConfig.TEST_USER.email);
    await page.fill('input[name="password"]', stagingConfig.TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);

    // Test observability dashboard access
    await page.goto('/admin/observability');
    await expect(page.locator('h1')).toContainText('Observabilidad');

    // Verify metrics are loading
    await expect(page.locator('text=Estado del Sistema')).toBeVisible();
    await expect(page.locator('text=Autenticación')).toBeVisible();
    await expect(page.locator('text=Facturación')).toBeVisible();

    console.log('✅ Observability features validated');
  });

  setup('validate SSR dashboard performance', async ({ page }) => {
    console.log('⚡ Validating SSR dashboard performance...');

    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', stagingConfig.TEST_USER.email);
    await page.fill('input[name="password"]', stagingConfig.TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);

    // Measure dashboard load time
    const startTime = Date.now();
    await page.goto('/dashboard');

    // Wait for KPI cards to be visible (SSR should make this fast)
    await expect(page.locator('text=Miembros Activos')).toBeVisible();
    await expect(page.locator('text=Ingresos Mensuales')).toBeVisible();

    const loadTime = Date.now() - startTime;
    console.log(`📈 Dashboard load time: ${loadTime}ms`);

    // SSR should make this load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // Verify no loading states are visible (SSR should provide immediate data)
    const loadingElements = await page.locator('text=Cargando').count();
    expect(loadingElements).toBe(0);

    console.log('✅ SSR dashboard performance validated');
  });

  setup('validate webhook processing capability', async ({ request }) => {
    console.log('🔗 Validating webhook processing capability...');

    // Test webhook endpoint accessibility
    const webhookResponse = await request.post(
      `${stagingConfig.API_BASE_URL}/v1/billing/webhook/stripe`,
      {
        data: { test: 'ping' },
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': 'test_signature',
        },
      }
    );

    // Should return 400 for invalid signature (but endpoint should be accessible)
    expect(webhookResponse.status()).toBe(400);

    console.log('✅ Webhook processing capability validated');
  });

  setup('validate security headers', async ({ page }) => {
    console.log('🔒 Validating security headers...');

    const response = await page.goto('/');
    const headers = response?.headers() || {};

    // Check for important security headers
    expect(headers['x-frame-options'] || headers['X-Frame-Options']).toBeDefined();
    expect(headers['x-content-type-options'] || headers['X-Content-Type-Options']).toBe('nosniff');

    console.log('✅ Security headers validated');
  });
});

setup.describe('Test Data Preparation', () => {
  setup('prepare test data', async ({ request }) => {
    console.log('🗃️ Preparing test data...');

    // Authenticate first
    const loginResponse = await request.post(`${stagingConfig.API_BASE_URL}/auth/login`, {
      data: {
        email: stagingConfig.TEST_USER.email,
        password: stagingConfig.TEST_USER.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const cookies = loginResponse.headers()['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';

    // Verify we have access to test company data
    const companiesResponse = await request.get(`${stagingConfig.API_BASE_URL}/v1/companies`, {
      headers: { Cookie: cookieHeader },
    });

    expect(companiesResponse.ok()).toBeTruthy();

    console.log('✅ Test data preparation completed');
  });
});
