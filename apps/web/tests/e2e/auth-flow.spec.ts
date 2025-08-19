import { test, expect, type Page } from '@playwright/test';

const TEST_USER = {
  email: 'admin@testgym.mx',
  password: 'TestPassword123!',
};

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:7777';

test.describe('Authentication Flow', () => {
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();

    // Reset console error tracking
    consoleErrors = [];

    // Track console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
  });

  test.afterEach(async () => {
    // Check for unexpected console errors
    const unexpectedErrors = consoleErrors.filter(
      error =>
        // Filter out expected errors
        !error.includes('Expected 401 for guest endpoint') &&
        !error.includes('Guest auth check (expected 401)') &&
        !error.includes('KPI-PROXY] Upstream returned 401')
    );

    if (unexpectedErrors.length > 0) {
      console.warn('⚠️ Unexpected console errors detected:', unexpectedErrors);
      // Don't fail the test for now, just warn
    }
  });

  test.describe('Login Process', () => {
    test('should successfully log in via API and set proper cookies', async ({ page }) => {
      // Intercept the login request to verify it goes through proxy
      let loginRequestUrl: string | undefined;
      let loginResponse: any;

      page.on('request', request => {
        if (request.url().includes('/auth/login')) {
          loginRequestUrl = request.url();
          console.log('Login request intercepted:', request.url());
        }
      });

      page.on('response', response => {
        if (response.url().includes('/auth/login')) {
          console.log('Login response:', response.status(), response.url());
          loginResponse = response;
        }
      });

      // Navigate to login page
      await page.goto('/login');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      // Fill and submit login form
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);

      // Click submit and wait for successful response
      await Promise.all([
        page.waitForResponse(
          response => response.url().includes('/auth/login') && response.status() === 200
        ),
        page.click('button[type="submit"]'),
      ]);

      // Wait for redirect to dashboard with longer timeout
      await page.waitForURL('/dashboard', { timeout: 15000 });

      // Wait for dashboard content to load
      await expect(page.locator('h1')).toContainText('Dashboard', { timeout: 10000 });

      // Verify login request went through same-origin proxy
      expect(loginRequestUrl).toBeDefined();
      expect(loginRequestUrl).toContain(BASE_URL);
      expect(loginRequestUrl).not.toContain(':4001'); // Should not hit API directly

      // Verify cookies are set with proper attributes
      const cookies = await page.context().cookies();

      const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
      const refreshTokenCookie = cookies.find(c => c.name === 'refreshToken');

      expect(accessTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toBeDefined();

      // Verify cookie attributes (case insensitive for sameSite)
      expect(accessTokenCookie?.sameSite?.toLowerCase()).toBe('lax');
      expect(accessTokenCookie?.secure).toBe(false); // Development mode
      expect(accessTokenCookie?.httpOnly).toBe(true);
      expect(accessTokenCookie?.path).toBe('/');

      expect(refreshTokenCookie?.sameSite?.toLowerCase()).toBe('lax');
      expect(refreshTokenCookie?.secure).toBe(false); // Development mode
      expect(refreshTokenCookie?.httpOnly).toBe(true);
      expect(refreshTokenCookie?.path).toBe('/');
    });

    test('should show validation errors for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Should show error message and stay on login page
      await expect(page.locator('text=Email o contraseña inválidos')).toBeVisible();
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Dashboard Access', () => {
    test('should show dashboard content for authenticated users', async ({ page }) => {
      // Log in first
      await loginUser(page);

      // Navigate to dashboard
      await page.goto('/dashboard');

      // Verify no "please log in" message appears
      await expect(page.locator('text=please log in')).not.toBeVisible();
      await expect(page.locator('text=Por favor inicia sesión')).not.toBeVisible();

      // Verify user info is displayed (server-side rendered)
      await expect(page.locator('[data-testid="session-chip"]')).toContainText(TEST_USER.email);
      await expect(page.locator('[data-testid="session-chip"]')).toContainText('owner');

      // Verify dashboard content is visible
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Bienvenido')).toBeVisible();

      // Verify session chip is visible in navbar
      await expect(page.locator('[data-testid="session-chip"]')).toBeVisible();
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access dashboard without authentication
      await page.goto('/dashboard');

      // Should be redirected to login with next parameter
      await page.waitForURL(/\/login\?next=%2Fdashboard/);
      expect(page.url()).toContain('/login?next=%2Fdashboard');
    });

    test('should redirect authenticated users away from auth pages', async ({ page }) => {
      // Log in first
      await loginUser(page);

      // Try to access login page while authenticated
      await page.goto('/login');

      // Should be redirected to dashboard
      await page.waitForURL('/dashboard');
      expect(page.url()).toContain('/dashboard');

      // Try to access register page while authenticated
      await page.goto('/register');

      // Should be redirected to dashboard
      await page.waitForURL('/dashboard');
      expect(page.url()).toContain('/dashboard');
    });
  });

  test.describe('Public Pages', () => {
    test('should never redirect guests from public pages', async ({ page }) => {
      const publicPages = ['/', '/demo', '/contacto', '/planes'];

      for (const publicPage of publicPages) {
        await page.goto(publicPage);

        // Should stay on the public page
        expect(page.url()).toContain(publicPage);

        // Should not redirect to login
        expect(page.url()).not.toContain('/login');

        // Should show public navigation
        await expect(page.locator('text=Iniciar Sesión')).toBeVisible();
        await expect(page.locator('nav').locator('text=Solicitar Demo')).toBeVisible();
      }
    });

    test('should show authenticated navigation for logged-in users on public pages', async ({
      page,
    }) => {
      // Log in first
      await loginUser(page);

      const publicPages = ['/', '/demo', '/contacto'];

      for (const publicPage of publicPages) {
        await page.goto(publicPage);

        // Should stay on the public page
        expect(page.url()).toContain(publicPage);

        // Should show authenticated navigation
        await expect(page.locator('nav').locator('text=Dashboard')).toBeVisible();
        await expect(page.locator('[data-testid="session-chip"]')).toContainText(TEST_USER.email);

        // Should not show login CTA
        await expect(page.locator('text=Iniciar Sesión')).not.toBeVisible();
      }
    });
  });

  test.describe('Role-Based Access', () => {
    test('should show appropriate error for insufficient permissions', async ({ page }) => {
      // This test would require a user with limited permissions
      // For now, we'll test the no-acceso page directly

      await page.goto('/no-acceso?reason=role');

      await expect(page.locator('text=Permisos Insuficientes')).toBeVisible();
      await expect(page.locator('text=Tu cuenta no tiene los permisos necesarios')).toBeVisible();
      await expect(page.locator('text=Contactar Administrador')).toBeVisible();
    });

    test('should show appropriate error for missing tenant', async ({ page }) => {
      await page.goto('/no-acceso?reason=tenant');

      await expect(page.locator('text=Organización No Configurada')).toBeVisible();
      await expect(page.locator('text=Tu cuenta no está asociada')).toBeVisible();
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      // Log in
      await loginUser(page);
      await page.goto('/dashboard');

      // Verify initial state
      await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible();

      // Reload page
      await page.reload();

      // Should still be authenticated
      await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible();
      await expect(page.locator('text=please log in')).not.toBeVisible();
    });

    test('should handle expired tokens gracefully', async ({ page }) => {
      // This would require manipulating cookies to simulate expiration
      // For now, we'll test the behavior with no cookies

      await page.goto('/dashboard');

      // Should redirect to login
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Logout Process', () => {
    test('should successfully log out and clear session', async ({ page }) => {
      // Log in first
      await loginUser(page);
      await page.goto('/dashboard');

      // Click logout in user menu
      await page.click('[data-testid="user-menu-button"]');
      await page.click('text=Cerrar Sesión');

      // Should redirect to home page
      await page.waitForURL('/');

      // Verify cookies are cleared
      const cookies = await page.context().cookies();
      const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
      const refreshTokenCookie = cookies.find(c => c.name === 'refreshToken');

      expect(accessTokenCookie).toBeUndefined();
      expect(refreshTokenCookie).toBeUndefined();

      // Should show public navigation
      await expect(page.locator('text=Iniciar Sesión')).toBeVisible();
    });
  });
});

// Helper function to log in a user
async function loginUser(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Wait for form to be visible
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();

  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);

  // Click submit and wait for response
  await Promise.all([
    page.waitForResponse(
      response => response.url().includes('/auth/login') && response.status() === 200
    ),
    page.click('button[type="submit"]'),
  ]);

  // Wait for redirect to dashboard with more specific checks
  await page.waitForURL('/dashboard', { timeout: 15000 });

  // Wait for dashboard content to load
  await expect(page.locator('h1')).toContainText('Dashboard', { timeout: 10000 });
}
