import { test, expect } from '@playwright/test';

test.describe('Simple Auth Test', () => {
  test('should login and see session chip', async ({ page }) => {
    console.log('🔐 Starting simple login test...');

    // Navigate to login page
    await page.goto('/login');
    console.log('📍 Navigated to login page');

    // Fill login form
    await page.fill('[data-testid="login-email"]', 'admin@testgym.mx');
    await page.fill('[data-testid="login-password"]', 'TestPassword123!');
    console.log('📝 Filled login form');

    // Submit login
    await page.click('[data-testid="login-submit"]');
    console.log('🚀 Submitted login form');

    // Wait for redirect
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    console.log('✅ Redirected to dashboard');

    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'debug-dashboard.png', fullPage: true });
    console.log('📸 Screenshot taken');

    // Check if session chip exists
    const sessionChip = page.locator('[data-testid="session-chip"]');
    const isVisible = await sessionChip.isVisible();
    console.log(`👁️ Session chip visible: ${isVisible}`);

    if (!isVisible) {
      // Let's see what's actually on the page
      const pageContent = await page.content();
      console.log('📄 Page content length:', pageContent.length);

      // Check if there are any elements with session-related text
      const sessionElements = await page.locator('text=admin@testgym.mx').count();
      console.log(`📧 Elements with admin email: ${sessionElements}`);

      // Check if there are any data-testid elements
      const testIdElements = await page.locator('[data-testid]').count();
      console.log(`🏷️ Elements with data-testid: ${testIdElements}`);
    }

    // Try to find the session chip
    await expect(sessionChip).toBeVisible({ timeout: 5000 });
  });
});
