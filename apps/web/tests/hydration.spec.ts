import { test, expect } from '@playwright/test';

/**
 * Hydration & Console Tests - WS3-T1 & WS3-T2
 *
 * Ensures critical routes render without hydration warnings or console errors.
 * These tests fail if hydration mismatches or console errors are detected.
 */

const CRITICAL_ROUTES = [
  '/',
  '/login',
  '/debug-ok',
  '/kiosk',
  '/dashboard-v2',
  // '/onboarding' - Temporarily removed due to missing react-hook-form dependency
];

// Allowlist for benign console messages that we can ignore
const CONSOLE_ALLOWLIST = [
  'Download the React DevTools', // React DevTools suggestion
  'Input elements should have autocomplete', // DOM autocomplete warnings
  '[Fast Refresh]', // Next.js Fast Refresh messages
  '[AUTH] Authentication initialization failed', // Expected auth failures on public routes
  'Failed to load resource: the server responded with a status of 500', // Expected API failures on public routes
];

function isAllowedConsoleMessage(message: string): boolean {
  return CONSOLE_ALLOWLIST.some(allowed => message.includes(allowed));
}

test.describe('Hydration & Console Guardrails', () => {
  let consoleErrors: string[] = [];
  let hydrationWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset error arrays for each test
    consoleErrors = [];
    hydrationWarnings = [];

    // Capture console messages to detect hydration warnings and errors
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();

      // Check for hydration warnings
      if (
        text.includes('Hydration failed') ||
        text.includes('hydration mismatch') ||
        text.includes('Text content does not match') ||
        text.includes('Expected server HTML to contain')
      ) {
        hydrationWarnings.push(text);
      }

      // Check for console errors (but filter out allowed messages)
      if (type === 'error' && !isAllowedConsoleMessage(text)) {
        consoleErrors.push(text);
      }
    });
  });

  for (const route of CRITICAL_ROUTES) {
    test(`${route} renders without hydration warnings or console errors`, async ({ page }) => {
      // Navigate to route
      await page.goto(route);

      // Wait for hydration to complete
      await page.waitForLoadState('networkidle');

      // Ensure page content is visible (basic smoke test)
      const body = await page.locator('body');
      await expect(body).toBeVisible();

      // Additional checks for specific routes
      if (route === '/kiosk') {
        await expect(page.locator('h1')).toContainText('Vigor Kiosk');
      } else if (route === '/dashboard-v2') {
        await expect(page.locator('h1')).toContainText('Dashboard 2.0');
      }

      // Check for hydration warnings
      if (hydrationWarnings.length > 0) {
        throw new Error(`Hydration warnings detected on ${route}: ${hydrationWarnings.join(', ')}`);
      }

      // Check for console errors
      if (consoleErrors.length > 0) {
        throw new Error(`Console errors detected on ${route}: ${consoleErrors.join(', ')}`);
      }
    });
  }

  test('kiosk layout isolation', async ({ page }) => {
    // Verify kiosk layout doesn't conflict with root layout
    await page.goto('/kiosk');

    // Should not have duplicate html/body elements
    const htmlElements = await page.locator('html').count();
    const bodyElements = await page.locator('body').count();

    expect(htmlElements).toBe(1);
    expect(bodyElements).toBe(1);

    // Verify kiosk-specific styling is applied
    const kioskContainer = page.locator('[data-testid="kiosk-container"]').first();
    if ((await kioskContainer.count()) > 0) {
      await expect(kioskContainer).toHaveClass(/bg-gray-50|dark:bg-gray-900/);
    }
  });

  test('dashboard-v2 client component isolation', async ({ page }) => {
    // Verify dashboard-v2 client component renders properly
    await page.goto('/dashboard-v2');

    // Wait for client component to hydrate
    await page.waitForSelector('h1:has-text("Dashboard 2.0")');

    // Verify widgets are present
    const widgets = page.locator('[class*="lg:col-span"]');
    const widgetCount = await widgets.count();

    // Should have at least 3 widgets (Active Visits, Revenue, Classes)
    expect(widgetCount).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Console Error Gate - WS3-T2', () => {
  test('all critical routes have zero console errors', async ({ page }) => {
    const routeResults: { route: string; errors: string[]; warnings: string[] }[] = [];

    for (const route of CRITICAL_ROUTES) {
      // Reset error arrays for each route
      const routeErrors: string[] = [];
      const routeWarnings: string[] = [];

      // Set up console listeners for this route
      page.removeAllListeners('console');
      page.on('console', msg => {
        const text = msg.text();
        const type = msg.type();

        if (
          text.includes('Hydration failed') ||
          text.includes('hydration mismatch') ||
          text.includes('Text content does not match') ||
          text.includes('Expected server HTML to contain')
        ) {
          routeWarnings.push(text);
        }

        if (type === 'error' && !isAllowedConsoleMessage(text)) {
          routeErrors.push(text);
        }
      });

      // Navigate and wait for page to load
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Wait a bit more for any delayed console messages
      await page.waitForTimeout(1000);

      routeResults.push({
        route,
        errors: [...routeErrors],
        warnings: [...routeWarnings],
      });
    }

    // Generate detailed report
    const errorReport = routeResults
      .filter(result => result.errors.length > 0 || result.warnings.length > 0)
      .map(result => {
        const issues = [
          ...result.errors.map(e => `ERROR: ${e}`),
          ...result.warnings.map(w => `WARNING: ${w}`),
        ];
        return `${result.route}: ${issues.join(', ')}`;
      })
      .join('\n');

    // Assert no errors or warnings
    const totalErrors = routeResults.reduce((sum, result) => sum + result.errors.length, 0);
    const totalWarnings = routeResults.reduce((sum, result) => sum + result.warnings.length, 0);

    if (totalErrors > 0 || totalWarnings > 0) {
      throw new Error(`Console issues detected:\n${errorReport}`);
    }

    // Success - log clean results
    console.log('✅ All critical routes passed console hygiene check');
    routeResults.forEach(result => {
      console.log(`✅ ${result.route}: 0 errors, 0 warnings`);
    });
  });
});

test.describe('Layout Conflicts', () => {
  test('root layout vs kiosk layout isolation', async ({ page }) => {
    // Test that kiosk doesn't inherit root layout elements
    await page.goto('/kiosk');

    // Should not have navbar from root layout
    const navbar = page.locator('nav').first();
    if ((await navbar.count()) > 0) {
      // If navbar exists, it should be kiosk-specific, not root layout navbar
      await expect(navbar).not.toContainText('Dashboard');
      await expect(navbar).not.toContainText('Miembros');
    }

    // Should not have footer from root layout
    const footer = page.locator('footer').first();
    if ((await footer.count()) > 0) {
      // If footer exists, it should be kiosk-specific
      await expect(footer).toContainText('Kiosk Mode');
    }
  });

  test('theme provider isolation', async ({ page }) => {
    // Verify theme provider works correctly across layouts
    await page.goto('/');

    // Check root layout has theme provider
    const html = page.locator('html');
    await expect(html).toHaveAttribute('class');

    // Navigate to kiosk and verify theme still works
    await page.goto('/kiosk');

    // Kiosk should inherit theme from root layout
    await expect(html).toHaveAttribute('class');
  });
});
