import { test, expect, selectors, budgets } from '../framework/fixtures';

/**
 * DASH-01: Dashboard SSR KPIs render; filter bar drives query & trends
 * Tests server-side rendering performance and filter functionality
 */

test.describe('Dashboard SSR & Performance', () => {
  test.beforeEach(async ({ authSession }) => {
    // Ensure we're authenticated for all dashboard tests
    await authSession.login();
  });

  test('DASH-01: Dashboard SSR KPIs render; filter bar drives query & trends', async ({
    page,
    performanceMonitor,
    authSession
  }) => {
    console.log('📊 Testing dashboard SSR and performance...');

    // Track network requests for KPI calls
    const kpiRequests: any[] = [];
    page.on('response', response => {
      if (response.url().includes('/api/v1/kpi/overview')) {
        kpiRequests.push({
          url: response.url(),
          status: response.status(),
          timing: response.timing(),
        });
      }
    });

    // Step 1: Navigate to dashboard and measure performance
    const startTime = Date.now();
    await page.goto('/dashboard');

    // Step 2: Verify filter bar is visible
    await expect(page.locator(selectors.filterBar)).toBeVisible();
    console.log('✅ Filter bar visible');

    // Step 3: Verify KPI cards are rendered (SSR should make this immediate)
    const kpiCards = page.locator(selectors.kpiCard);
    await expect(kpiCards).toHaveCount(4, { timeout: 3000 });

    const loadTime = Date.now() - startTime;
    console.log(`⏱️ Dashboard load time: ${loadTime}ms`);

    // Step 4: Verify specific KPI cards are present
    await expect(page.locator('text=Miembros Activos')).toBeVisible();
    await expect(page.locator('text=Ingresos Mensuales')).toBeVisible();
    await expect(page.locator('text=Visitas Totales')).toBeVisible();
    await expect(page.locator('text=Tiempo Promedio')).toBeVisible();
    console.log('✅ All KPI cards rendered');

    // Step 5: Test filter bar interaction
    const initialRequestCount = kpiRequests.length;

    // Click on 30-day filter
    await page.click('[data-testid="range-30d"]');

    // Wait for API response
    await page.waitForResponse(response =>
      response.url().includes('/api/v1/kpi/overview') &&
      response.url().includes('from=')
    );

    // Verify new request was made
    expect(kpiRequests.length).toBeGreaterThan(initialRequestCount);
    console.log('✅ Filter bar triggers API request');

    // Step 6: Performance validation
    await performanceMonitor.validatePerformanceBudgets({
      lcp: loadTime,
    });

    console.log('✅ DASH-01: Dashboard SSR and performance test completed');
  });
});
