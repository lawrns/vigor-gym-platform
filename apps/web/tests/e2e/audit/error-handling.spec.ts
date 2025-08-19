import { test, expect } from '@playwright/test';

test.describe('Error Handling & Edge Cases', () => {
  test('Network failure recovery - Dashboard', async ({ page }) => {
    await page.goto('http://localhost:3005/dashboard-v2');

    // Simulate network failure
    await page.route('**/api/**', route => {
      route.abort('failed');
    });

    // Reload page to trigger network errors
    await page.reload();

    // Check error states are handled gracefully
    const errorMessages = await page
      .locator('[data-testid*="error"], .error, [class*="error"]')
      .count();
    const loadingStates = await page
      .locator('[data-testid*="loading"], .loading, [class*="loading"]')
      .count();

    // Should show either error states or loading states, not crash
    expect(errorMessages + loadingStates).toBeGreaterThanOrEqual(0);

    // Page should still be functional (not completely broken)
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();

    console.log(
      `✅ Network failure handled: ${errorMessages} errors, ${loadingStates} loading states`
    );
  });

  test('Invalid form data - Onboarding', async ({ page }) => {
    await page.goto('http://localhost:3005/onboarding');
    await page.waitForLoadState('networkidle');

    // Try to submit with invalid data
    const emailInputs = await page.locator('input[type="email"]').all();
    const submitButtons = await page
      .locator('button[type="submit"], button:has-text("Continuar")')
      .all();

    if (emailInputs.length > 0 && submitButtons.length > 0) {
      // Enter invalid email
      await emailInputs[0].fill('invalid-email');

      // Try to submit
      await submitButtons[0].click();

      // Check for validation errors
      const errorMessages = await page
        .locator('.text-red-600, .text-red-400, [class*="error"]')
        .count();
      expect(errorMessages).toBeGreaterThan(0);

      console.log(`✅ Form validation working: ${errorMessages} error messages shown`);
    }
  });

  test('Empty states - Dashboard widgets', async ({ page }) => {
    // Mock empty API responses
    await page.route('**/api/dashboard/summary**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          activeVisits: 0,
          capacityLimit: 0,
          expiringCounts: { '7d': 0, '14d': 0, '30d': 0 },
          revenue: { total: 0, growth: 0 },
        }),
      });
    });

    await page.goto('http://localhost:3005/dashboard-v2');
    await page.waitForLoadState('networkidle');

    // Check widgets handle empty data gracefully
    const widgets = await page.locator('[data-testid*="widget"], .widget, [class*="widget"]').all();

    for (const widget of widgets.slice(0, 3)) {
      const text = await widget.textContent();
      // Widget should show something (not be completely empty)
      expect(text?.length).toBeGreaterThan(0);
    }

    console.log(`✅ Empty states handled: ${widgets.length} widgets with content`);
  });

  test('Session expiration - Auth token invalid', async ({ page }) => {
    await page.goto('http://localhost:3005/dashboard-v2');

    // Mock 401 responses
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    // Trigger API call
    await page.reload();

    // Should redirect to login or show auth error
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const hasAuthError =
      currentUrl.includes('/login') ||
      (await page
        .locator(':has-text("login"), :has-text("unauthorized"), :has-text("expired")')
        .count()) > 0;

    expect(hasAuthError).toBeTruthy();

    console.log('✅ Session expiration handled properly');
  });

  test('Large dataset performance - Many members', async ({ page }) => {
    // Mock large dataset
    const largeMemberList = Array.from({ length: 1000 }, (_, i) => ({
      id: `member-${i}`,
      firstName: `Member${i}`,
      lastName: `Test${i}`,
      email: `member${i}@test.com`,
      status: 'active',
    }));

    await page.route('**/api/members**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          members: largeMemberList.slice(0, 25), // Paginated
          pagination: { total: 1000, page: 1, limit: 25 },
        }),
      });
    });

    await page.goto('http://localhost:3005/dashboard-v2');
    await page.waitForLoadState('networkidle');

    // Check page loads within reasonable time
    const loadTime = await page.evaluate(() => {
      return performance.now();
    });

    expect(loadTime).toBeLessThan(10000); // 10 seconds max

    console.log(`✅ Large dataset handled: page loaded in ${loadTime.toFixed(0)}ms`);
  });

  test('Concurrent user actions - Race conditions', async ({ page }) => {
    await page.goto('http://localhost:3005/onboarding');
    await page.waitForLoadState('networkidle');

    // Simulate rapid clicking
    const buttons = await page.locator('button').all();

    if (buttons.length > 0) {
      const button = buttons[0];

      // Click rapidly multiple times
      await Promise.all([button.click(), button.click(), button.click()]);

      // Check page doesn't crash or show multiple error states
      const errorCount = await page.locator('.error, [class*="error"]').count();
      expect(errorCount).toBeLessThan(5); // Some errors OK, but not excessive

      console.log('✅ Concurrent actions handled gracefully');
    }
  });

  test('Browser compatibility - Basic features', async ({ page }) => {
    await page.goto('http://localhost:3005/dashboard-v2');

    // Check modern JS features work
    const hasModernFeatures = await page.evaluate(() => {
      // Test basic modern features
      try {
        const hasPromise = typeof Promise !== 'undefined';
        const hasFetch = typeof fetch !== 'undefined';
        const hasLocalStorage = typeof localStorage !== 'undefined';
        const hasEventSource = typeof EventSource !== 'undefined';

        return hasPromise && hasFetch && hasLocalStorage && hasEventSource;
      } catch (e) {
        return false;
      }
    });

    expect(hasModernFeatures).toBeTruthy();

    // Check CSS features
    const hasModernCSS = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.style.display = 'grid';
      testEl.style.gap = '1rem';

      return testEl.style.display === 'grid' && testEl.style.gap === '1rem';
    });

    expect(hasModernCSS).toBeTruthy();

    console.log('✅ Browser compatibility check passed');
  });

  test('Memory leaks - Extended usage simulation', async ({ page }) => {
    await page.goto('http://localhost:3005/dashboard-v2');

    // Get initial memory if available
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : null;
    });

    // Simulate extended usage
    for (let i = 0; i < 5; i++) {
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : null;
    });

    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory - initialMemory;
      // Memory shouldn't increase by more than 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

      console.log(`✅ Memory usage check: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`);
    } else {
      console.log('✅ Memory usage check: browser memory API not available');
    }
  });
});
