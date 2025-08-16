import { test, expect } from '@playwright/test';
import { stagingConfig } from '../../playwright.staging.config';

/**
 * Comprehensive E2E tests for SSR dashboard improvements
 * Tests server-side rendering, performance, and client hydration
 */

test.describe('SSR Dashboard - Staging', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test credentials
    await page.goto('/login');
    await page.fill('input[name="email"]', stagingConfig.TEST_USER.email);
    await page.fill('input[name="password"]', stagingConfig.TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should render KPIs server-side without loading flash', async ({ page }) => {
    console.log('⚡ Testing SSR KPI rendering...');
    
    // Navigate to dashboard and measure initial render
    const startTime = Date.now();
    await page.goto('/dashboard');
    
    // KPI cards should be immediately visible (SSR)
    await expect(page.locator('text=Miembros Activos')).toBeVisible({ timeout: 1000 });
    await expect(page.locator('text=Ingresos Mensuales')).toBeVisible({ timeout: 1000 });
    await expect(page.locator('text=Visitas Totales')).toBeVisible({ timeout: 1000 });
    await expect(page.locator('text=Tiempo Promedio')).toBeVisible({ timeout: 1000 });
    
    const renderTime = Date.now() - startTime;
    console.log(`📈 Initial KPI render time: ${renderTime}ms`);
    
    // Should render very quickly with SSR
    expect(renderTime).toBeLessThan(2000);
    
    // Should not show loading states for SSR data
    const loadingElements = await page.locator('text=Cargando').count();
    expect(loadingElements).toBe(0);
    
    // Should not show skeleton loaders
    const skeletonElements = await page.locator('.animate-pulse').count();
    expect(skeletonElements).toBe(0);
    
    console.log('✅ SSR KPI rendering validated');
  });

  test('should handle date range filtering with URL parameters', async ({ page }) => {
    console.log('📅 Testing date range filtering...');
    
    // Navigate to dashboard with date range parameters
    const fromDate = '2024-01-01';
    const toDate = '2024-01-31';
    await page.goto(`/dashboard?from=${fromDate}&to=${toDate}`);
    
    // KPIs should still render quickly with custom date range
    await expect(page.locator('text=Miembros Activos')).toBeVisible({ timeout: 2000 });
    
    // Verify URL parameters are preserved
    expect(page.url()).toContain(`from=${fromDate}`);
    expect(page.url()).toContain(`to=${toDate}`);
    
    // Test filter bar interaction
    const filterBar = page.locator('[data-testid="dashboard-filter-bar"]');
    if (await filterBar.isVisible()) {
      // Change date range
      await page.click('button:has-text("Último mes")');
      
      // URL should update
      await page.waitForURL(/dashboard\?/);
      
      // KPIs should update without full page reload
      await expect(page.locator('text=Miembros Activos')).toBeVisible();
    }
    
    console.log('✅ Date range filtering validated');
  });

  test('should prevent unnecessary client-side refetches', async ({ page }) => {
    console.log('🚫 Testing prevention of unnecessary refetches...');
    
    // Monitor network requests
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/v1/kpi/overview')) {
        apiRequests.push(request.url());
      }
    });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page.locator('text=Miembros Activos')).toBeVisible();
    
    // Wait a bit to see if any unnecessary requests are made
    await page.waitForTimeout(3000);
    
    // Should have minimal API requests (ideally none for SSR data)
    console.log(`📊 KPI API requests made: ${apiRequests.length}`);
    expect(apiRequests.length).toBeLessThanOrEqual(1); // Allow one for hydration if needed
    
    console.log('✅ Unnecessary refetches prevented');
  });

  test('should handle guest users without 401 noise', async ({ page }) => {
    console.log('👤 Testing guest user handling...');
    
    // Logout first
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Cerrar Sesión');
    
    // Navigate to dashboard as guest
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
    
    // Check console for 401 errors (should be minimal/silent)
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('401')) {
        consoleErrors.push(msg.text());
      }
    });
    
    // Try to access dashboard again
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    // Should have minimal 401 console noise
    console.log(`🔇 Console 401 errors: ${consoleErrors.length}`);
    expect(consoleErrors.length).toBeLessThanOrEqual(1); // Allow some expected auth checks
    
    console.log('✅ Guest user handling validated');
  });

  test('should maintain performance under load', async ({ page }) => {
    console.log('🏋️ Testing dashboard performance under load...');
    
    // Simulate multiple rapid navigations
    const navigationTimes: number[] = [];
    
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      await page.goto('/dashboard');
      await expect(page.locator('text=Miembros Activos')).toBeVisible();
      const loadTime = Date.now() - startTime;
      navigationTimes.push(loadTime);
      
      // Navigate away and back
      await page.goto('/admin/members');
      await page.waitForLoadState('networkidle');
    }
    
    const avgLoadTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
    console.log(`📈 Average dashboard load time: ${avgLoadTime}ms`);
    console.log(`📊 Load times: ${navigationTimes.join(', ')}ms`);
    
    // Performance should remain consistent
    expect(avgLoadTime).toBeLessThan(3000);
    
    // No load time should be excessively slow
    const maxLoadTime = Math.max(...navigationTimes);
    expect(maxLoadTime).toBeLessThan(5000);
    
    console.log('✅ Performance under load validated');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    console.log('🌐 Testing network error handling...');
    
    // Navigate to dashboard first
    await page.goto('/dashboard');
    await expect(page.locator('text=Miembros Activos')).toBeVisible();
    
    // Simulate network failure for KPI requests
    await page.route('**/api/v1/kpi/overview', route => route.abort('failed'));
    
    // Try to refresh or change date range
    const filterButton = page.locator('button:has-text("Última semana")');
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      // Should show error state gracefully
      await expect(page.locator('text=Error')).toBeVisible({ timeout: 10000 });
    }
    
    console.log('✅ Network error handling validated');
  });

  test('should validate cookie forwarding for SSR', async ({ page }) => {
    console.log('🍪 Testing cookie forwarding for SSR...');
    
    // Check that authentication cookies are properly forwarded
    const response = await page.goto('/dashboard');
    
    // Should get successful response (not redirect)
    expect(response?.status()).toBe(200);
    
    // Should have session data in the page
    await expect(page.locator('[data-testid="session-chip"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-chip"]')).toContainText(stagingConfig.TEST_USER.email);
    
    // KPIs should be rendered server-side
    await expect(page.locator('text=Miembros Activos')).toBeVisible({ timeout: 1000 });
    
    console.log('✅ Cookie forwarding validated');
  });

  test('should validate data freshness and caching', async ({ page }) => {
    console.log('🔄 Testing data freshness and caching...');
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page.locator('text=Miembros Activos')).toBeVisible();
    
    // Get initial KPI values
    const initialActiveMembers = await page.locator('[data-testid="active-members-value"]').textContent();
    
    // Navigate away and back
    await page.goto('/admin/members');
    await page.goto('/dashboard');
    
    // Values should be consistent (cached appropriately)
    const cachedActiveMembers = await page.locator('[data-testid="active-members-value"]').textContent();
    
    // For staging, we expect consistent values (proper caching)
    if (initialActiveMembers && cachedActiveMembers) {
      expect(cachedActiveMembers).toBe(initialActiveMembers);
    }
    
    console.log('✅ Data freshness and caching validated');
  });

  test('should validate responsive design on mobile', async ({ page }) => {
    console.log('📱 Testing responsive design...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page.locator('text=Miembros Activos')).toBeVisible();
    
    // KPI cards should stack vertically on mobile
    const kpiCards = page.locator('[data-testid="kpi-card"]');
    const cardCount = await kpiCards.count();
    
    if (cardCount > 0) {
      // Check that cards are stacked (grid should be single column)
      const firstCard = kpiCards.first();
      const secondCard = kpiCards.nth(1);
      
      if (await secondCard.isVisible()) {
        const firstCardBox = await firstCard.boundingBox();
        const secondCardBox = await secondCard.boundingBox();
        
        if (firstCardBox && secondCardBox) {
          // Second card should be below first card (not side by side)
          expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height - 50);
        }
      }
    }
    
    console.log('✅ Responsive design validated');
  });

  test('should validate accessibility features', async ({ page }) => {
    console.log('♿ Testing accessibility features...');
    
    await page.goto('/dashboard');
    await expect(page.locator('text=Miembros Activos')).toBeVisible();
    
    // Check for proper heading structure
    const h1Elements = await page.locator('h1').count();
    expect(h1Elements).toBeGreaterThanOrEqual(1);
    
    // Check for proper ARIA labels
    const ariaLabels = await page.locator('[aria-label]').count();
    expect(ariaLabels).toBeGreaterThan(0);
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').count();
    expect(focusedElement).toBeGreaterThan(0);
    
    console.log('✅ Accessibility features validated');
  });
});
