import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@testgym.mx');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard**');
  });

  test('Dashboard 2.0 - No critical accessibility violations', async ({ page }) => {
    await page.goto('/dashboard-v2');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // No critical or serious violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'critical' || violation.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);

    // Log all violations for review
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:', 
        JSON.stringify(accessibilityScanResults.violations, null, 2)
      );
    }
  });

  test('Login page - No critical accessibility violations', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'critical' || violation.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('Kiosk page - No critical accessibility violations', async ({ page }) => {
    await page.goto('/kiosk');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'critical' || violation.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('Registration page - No critical accessibility violations', async ({ page }) => {
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'critical' || violation.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });

  test('Keyboard navigation - Dashboard widgets', async ({ page }) => {
    await page.goto('/dashboard-v2');
    await page.waitForLoadState('networkidle');

    // Test keyboard navigation through interactive elements
    await page.keyboard.press('Tab');
    const firstFocusedElement = await page.locator(':focus').first();
    expect(firstFocusedElement).toBeVisible();

    // Continue tabbing through elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus').first();
      if (await focusedElement.isVisible()) {
        // Ensure focused elements have proper focus indicators
        const outline = await focusedElement.evaluate(el => 
          window.getComputedStyle(el).outline
        );
        const boxShadow = await focusedElement.evaluate(el => 
          window.getComputedStyle(el).boxShadow
        );
        
        // Should have some form of focus indicator
        expect(outline !== 'none' || boxShadow !== 'none').toBeTruthy();
      }
    }
  });

  test('Color contrast - Critical elements', async ({ page }) => {
    await page.goto('/dashboard-v2');
    await page.waitForLoadState('networkidle');

    // Test color contrast on key elements
    const criticalElements = [
      '[data-testid="active-visits-widget"]',
      '[data-testid="expiring-memberships-widget"]',
      '[data-testid="revenue-sparkline"]',
      'button',
      'a',
      'input'
    ];

    for (const selector of criticalElements) {
      const elements = await page.locator(selector).all();
      
      for (const element of elements.slice(0, 5)) { // Test first 5 of each type
        if (await element.isVisible()) {
          const styles = await element.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize
            };
          });

          // Basic contrast check (simplified)
          expect(styles.color).not.toBe(styles.backgroundColor);
        }
      }
    }
  });

  test('Screen reader compatibility - ARIA labels', async ({ page }) => {
    await page.goto('/dashboard-v2');
    await page.waitForLoadState('networkidle');

    // Check for proper ARIA labels on interactive elements
    const interactiveElements = await page.locator('button, a, input, [role="button"]').all();
    
    for (const element of interactiveElements.slice(0, 10)) {
      if (await element.isVisible()) {
        const ariaLabel = await element.getAttribute('aria-label');
        const ariaLabelledBy = await element.getAttribute('aria-labelledby');
        const textContent = await element.textContent();
        const title = await element.getAttribute('title');

        // Should have some form of accessible name
        const hasAccessibleName = ariaLabel || ariaLabelledBy || textContent?.trim() || title;
        expect(hasAccessibleName).toBeTruthy();
      }
    }
  });
});
