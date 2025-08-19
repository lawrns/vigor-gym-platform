import { test, expect, selectors } from '../framework/fixtures';

/**
 * AUTH-01: Login → redirect to dashboard with session chip
 * Tests the complete authentication flow with session persistence
 */

test.describe('Authentication Flow', () => {
  test('AUTH-01: Login → redirect to dashboard with session chip', async ({
    page,
    authSession,
    orgContext,
    performanceMonitor,
  }) => {
    console.log('🔐 Testing authentication flow...');

    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Step 1: Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveTitle(/Vigor/);

    // Step 2: Fill login form using data-testid selectors
    await page.fill(selectors.loginEmail, process.env.E2E_ADMIN_EMAIL || 'admin@testgym.mx');
    await page.fill(selectors.loginPassword, process.env.E2E_ADMIN_PASSWORD || 'TestPassword123!');

    // Step 3: Submit login
    const loginStartTime = Date.now();
    await page.click(selectors.loginSubmit);

    // Step 4: Verify redirect to dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    const loginTime = Date.now() - loginStartTime;
    console.log(`⏱️ Login time: ${loginTime}ms`);

    // Step 5: Verify session chip is visible
    await expect(page.locator(selectors.sessionChip)).toBeVisible();

    // Verify session chip contains user email
    const sessionChip = page.locator(selectors.sessionChip);
    await expect(sessionChip).toContainText(process.env.E2E_ADMIN_EMAIL || 'admin@testgym.mx');

    // Step 6: Verify authenticated API calls work
    const authToken = await authSession.getAuthToken();
    expect(authToken).toBeTruthy();

    // Test /auth/me endpoint
    const meResponse = await authSession.makeAuthenticatedRequest('/auth/me');
    expect(meResponse.status()).toBe(200);

    // Test /api/kpi/overview endpoint
    const kpiResponse = await authSession.makeAuthenticatedRequest('/v1/kpi/overview');
    expect(kpiResponse.status()).toBe(200);

    // Step 7: Verify no unexpected console errors (filter out expected 401s during auth flow)
    const unexpectedErrors = consoleErrors.filter(
      error =>
        !error.includes('401 (Unauthorized)') && !error.includes('Failed to fetch RSC payload')
    );
    expect(unexpectedErrors).toHaveLength(0);
    console.log('✅ No unexpected console errors during authentication');

    // Step 8: Verify session persistence across page reload
    await page.reload();
    await expect(page.locator(selectors.sessionChip)).toBeVisible();
    console.log('✅ Session persists across page reload');

    console.log('✅ AUTH-01: Authentication flow completed successfully');
  });

  test('AUTH-02: Invalid credentials show error message', async ({ page }) => {
    console.log('❌ Testing invalid credentials...');

    await page.goto('/login');

    // Try invalid credentials
    await page.fill(selectors.loginEmail, 'invalid@example.com');
    await page.fill(selectors.loginPassword, 'wrongpassword');
    await page.click(selectors.loginSubmit);

    // Should show error message
    await expect(page.locator('text=Email o contraseña inválidos')).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL(/login/);

    console.log('✅ AUTH-02: Invalid credentials handled correctly');
  });

  test('AUTH-03: Protected routes require authentication', async ({ page }) => {
    console.log('🔒 Testing protected route access...');

    const protectedRoutes = ['/dashboard', '/admin/members', '/admin/observability'];

    for (const route of protectedRoutes) {
      await page.goto(route);

      // Should redirect to login
      await expect(page).toHaveURL(/login/);
      console.log(`✅ ${route} properly protected`);
    }

    console.log('✅ AUTH-03: Protected routes require authentication');
  });

  test('AUTH-04: Logout clears session', async ({ page, authSession }) => {
    console.log('🚪 Testing logout flow...');

    // First login
    await authSession.login();
    await expect(page.locator(selectors.sessionChip)).toBeVisible();

    // Logout
    await authSession.logout();

    // Verify redirect to home page (as per logout implementation)
    await expect(page).toHaveURL(/^http:\/\/localhost:7777\/?$/);

    // Verify session is cleared
    const authToken = await authSession.getAuthToken();
    expect(authToken).toBeFalsy();

    console.log('✅ AUTH-04: Logout flow completed successfully');
  });
});
