import { test, expect } from '@playwright/test';

test.describe('User Flow Audit', () => {
  test('Flow 1: Complete Authentication Journey', async ({ page }) => {
    const startTime = Date.now();

    // Step 1: Access login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Verify login page elements
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();

    // Step 2: Perform login
    await page.fill('[data-testid="email-input"]', 'admin@testgym.mx');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');

    // Step 3: Verify successful redirect
    await page.waitForURL('/dashboard**');
    
    const authTime = Date.now() - startTime;
    
    // Authentication should complete within 3 seconds
    expect(authTime).toBeLessThan(3000);
    
    console.log(`Authentication flow completed in: ${authTime}ms`);
  });

  test('Flow 2: Dashboard 2.0 Operational Read', async ({ page }) => {
    // Authenticate first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@testgym.mx');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard**');

    const dashboardStartTime = Date.now();

    // Navigate to Dashboard 2.0
    await page.goto('/dashboard-v2');
    await page.waitForLoadState('networkidle');

    // Verify all expected widgets are present and populated
    const expectedWidgets = [
      'active-visits-widget',
      'expiring-memberships-widget',
      'revenue-sparkline',
      'live-activity-feed'
    ];

    for (const widgetTestId of expectedWidgets) {
      const widget = page.locator(`[data-testid="${widgetTestId}"]`);
      await expect(widget).toBeVisible();
      
      // Verify widget has content (not empty state)
      const hasContent = await widget.evaluate(el => {
        const text = el.textContent || '';
        return text.length > 10 && !text.includes('No data') && !text.includes('Loading');
      });
      
      expect(hasContent).toBeTruthy();
    }

    const dashboardLoadTime = Date.now() - dashboardStartTime;
    
    // Dashboard should load with data within 2.5 seconds
    expect(dashboardLoadTime).toBeLessThan(2500);
    
    console.log(`Dashboard loaded with data in: ${dashboardLoadTime}ms`);
  });

  test('Flow 3: Kiosk Device Interface', async ({ page }) => {
    const kioskStartTime = Date.now();

    // Access kiosk page
    await page.goto('/kiosk');
    await page.waitForLoadState('networkidle');

    // Verify kiosk interface elements
    await expect(page.locator('[data-testid="device-login-form"]')).toBeVisible();
    
    // Test device login form
    const deviceIdInput = page.locator('[data-testid="device-id-input"]');
    const deviceSecretInput = page.locator('[data-testid="device-secret-input"]');
    const deviceLoginButton = page.locator('[data-testid="device-login-button"]');

    if (await deviceIdInput.isVisible()) {
      await expect(deviceIdInput).toBeVisible();
      await expect(deviceSecretInput).toBeVisible();
      await expect(deviceLoginButton).toBeVisible();
    }

    const kioskLoadTime = Date.now() - kioskStartTime;
    
    // Kiosk should load within 2 seconds
    expect(kioskLoadTime).toBeLessThan(2000);
    
    console.log(`Kiosk interface loaded in: ${kioskLoadTime}ms`);
  });

  test('Flow 4: Registration/Onboarding Journey', async ({ page }) => {
    const onboardingStartTime = Date.now();

    // Access registration page
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');

    // Verify onboarding elements are present
    const companyForm = page.locator('[data-testid="company-form"]');
    const planSelector = page.locator('[data-testid="plan-selector"]');
    
    // Check if onboarding forms are visible
    const hasOnboardingElements = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      const inputs = document.querySelectorAll('input');
      return forms.length > 0 && inputs.length > 0;
    });

    expect(hasOnboardingElements).toBeTruthy();

    const onboardingLoadTime = Date.now() - onboardingStartTime;
    
    // Onboarding should load within 2 seconds
    expect(onboardingLoadTime).toBeLessThan(2000);
    
    console.log(`Onboarding page loaded in: ${onboardingLoadTime}ms`);
  });

  test('Flow 5: Real-time Updates Verification', async ({ page }) => {
    // Authenticate and go to dashboard
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@testgym.mx');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard**');

    await page.goto('/dashboard-v2');
    await page.waitForLoadState('networkidle');

    // Monitor for SSE connections
    const sseConnected = await page.waitForFunction(() => {
      // Check if EventSource is connected
      return window.performance.getEntriesByType('resource').some(entry => 
        entry.name.includes('/v1/events')
      );
    }, { timeout: 5000 });

    expect(sseConnected).toBeTruthy();

    // Verify live activity feed updates
    const activityFeed = page.locator('[data-testid="live-activity-feed"]');
    await expect(activityFeed).toBeVisible();

    // Check if activity feed has recent entries
    const hasRecentActivity = await activityFeed.evaluate(el => {
      const text = el.textContent || '';
      return text.includes('ago') || text.includes('minutes') || text.includes('seconds');
    });

    expect(hasRecentActivity).toBeTruthy();
    
    console.log('Real-time updates verified successfully');
  });

  test('Flow 6: Error Handling and Recovery', async ({ page }) => {
    // Test 404 handling
    await page.goto('/nonexistent-page');
    
    // Should either redirect or show proper 404
    const currentUrl = page.url();
    const pageContent = await page.textContent('body');
    
    const hasProperErrorHandling = currentUrl.includes('/login') || 
                                  currentUrl.includes('/404') || 
                                  pageContent?.includes('404') ||
                                  pageContent?.includes('Not Found');
    
    expect(hasProperErrorHandling).toBeTruthy();

    // Test unauthorized access
    await page.goto('/dashboard-v2');
    
    // Should redirect to login if not authenticated
    await page.waitForURL('/login**', { timeout: 5000 });
    
    console.log('Error handling verified successfully');
  });

  test('Flow 7: Mobile Responsiveness Check', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Test login page on mobile
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const loginForm = page.locator('form');
    await expect(loginForm).toBeVisible();

    // Verify form elements are accessible on mobile
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    
    if (await emailInput.isVisible()) {
      const emailBox = await emailInput.boundingBox();
      const passwordBox = await passwordInput.boundingBox();
      
      // Elements should be properly sized for mobile
      expect(emailBox?.width).toBeGreaterThan(200);
      expect(passwordBox?.width).toBeGreaterThan(200);
    }

    // Test dashboard on mobile
    await page.fill('[data-testid="email-input"]', 'admin@testgym.mx');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard**');

    await page.goto('/dashboard-v2');
    await page.waitForLoadState('networkidle');

    // Verify dashboard is usable on mobile
    const widgets = await page.locator('[data-testid*="widget"]').count();
    expect(widgets).toBeGreaterThan(0);

    console.log('Mobile responsiveness verified successfully');
  });
});
