import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const CORE_PAGES = [
  { path: '/', name: 'Home' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/kiosk', name: 'Kiosk' },
  { path: '/staff', name: 'Staff' },
  { path: '/registro', name: 'Registro' },
];

// Test each core page for accessibility violations
for (const page of CORE_PAGES) {
  test(`${page.name} page should have no serious accessibility violations`, async ({
    page: playwright,
  }) => {
    // Navigate to the page
    await playwright.goto(page.path);

    // Wait for page to be fully loaded
    await playwright.waitForLoadState('networkidle');

    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page: playwright })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .exclude('#__next-build-watcher') // Exclude Next.js dev tools
      .exclude('[data-nextjs-toast-wrapper]') // Exclude Next.js error toasts
      .exclude('nextjs-portal') // Exclude Next.js portals
      .analyze();

    // Check for serious and critical violations
    const seriousViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'serious' || violation.impact === 'critical'
    );

    // Log violations for debugging
    if (seriousViolations.length > 0) {
      console.log(`\n🚨 Accessibility violations found on ${page.name} (${page.path}):`);
      seriousViolations.forEach(violation => {
        console.log(`\n❌ ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.helpUrl}`);
        violation.nodes.forEach((node, index) => {
          console.log(`   Node ${index + 1}: ${node.target.join(', ')}`);
          if (node.failureSummary) {
            console.log(`   Issue: ${node.failureSummary}`);
          }
        });
      });
    }

    // Assert no serious or critical violations
    expect(seriousViolations).toHaveLength(0);

    // Log success
    console.log(`✅ ${page.name} page passed accessibility scan`);
  });
}

test('Kiosk device login should be accessible', async ({ page }) => {
  await page.goto('/kiosk');
  await page.waitForLoadState('networkidle');

  // Check that form elements have proper labels
  const deviceIdInput = page.getByTestId('device-id-input');
  const deviceSecretInput = page.getByTestId('device-secret-input');
  const submitButton = page.getByTestId('device-login-submit');

  // Verify form elements are accessible
  await expect(deviceIdInput).toHaveAttribute('aria-label');
  await expect(deviceSecretInput).toHaveAttribute('aria-label');
  await expect(submitButton).toBeVisible();

  // Test keyboard navigation
  await deviceIdInput.focus();
  await page.keyboard.press('Tab');
  await expect(deviceSecretInput).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(submitButton).toBeFocused();

  console.log('✅ Kiosk device login keyboard navigation works correctly');
});

test('Error messages should have proper ARIA attributes', async ({ page }) => {
  await page.goto('/kiosk');
  await page.waitForLoadState('networkidle');

  // Try to submit form without credentials to trigger error
  const submitButton = page.getByTestId('device-login-submit');
  await submitButton.click();

  // Wait for error message to appear
  await page.waitForSelector('[role="alert"], [aria-live="polite"]', { timeout: 5000 });

  // Check that error messages have proper ARIA attributes
  const errorElements = await page.locator('[role="alert"], [aria-live="polite"]').all();
  expect(errorElements.length).toBeGreaterThan(0);

  console.log('✅ Error messages have proper ARIA attributes');
});

test('Focus management should work correctly', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Test that focus is visible and logical
  await page.keyboard.press('Tab');

  // Check that focused element is visible
  const focusedElement = await page.locator(':focus').first();
  await expect(focusedElement).toBeVisible();

  // Verify focus outline is present (basic check)
  const focusedElementBox = await focusedElement.boundingBox();
  expect(focusedElementBox).toBeTruthy();

  console.log('✅ Focus management works correctly');
});

test('Color contrast should meet WCAG AA standards', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Run axe scan specifically for color contrast
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2aa'])
    .withRules(['color-contrast'])
    .analyze();

  const contrastViolations = accessibilityScanResults.violations.filter(
    violation => violation.id === 'color-contrast'
  );

  if (contrastViolations.length > 0) {
    console.log('\n🚨 Color contrast violations:');
    contrastViolations.forEach(violation => {
      violation.nodes.forEach((node, index) => {
        console.log(`   Element ${index + 1}: ${node.target.join(', ')}`);
        console.log(`   Issue: ${node.failureSummary}`);
      });
    });
  }

  expect(contrastViolations).toHaveLength(0);
  console.log('✅ Color contrast meets WCAG AA standards');
});

test('Images should have alt text', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Run axe scan for image alt text
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withRules(['image-alt'])
    .analyze();

  const imageAltViolations = accessibilityScanResults.violations.filter(
    violation => violation.id === 'image-alt'
  );

  expect(imageAltViolations).toHaveLength(0);
  console.log('✅ All images have appropriate alt text');
});

test('Headings should have proper hierarchy', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Run axe scan for heading order
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withRules(['heading-order'])
    .analyze();

  const headingViolations = accessibilityScanResults.violations.filter(
    violation => violation.id === 'heading-order'
  );

  expect(headingViolations).toHaveLength(0);
  console.log('✅ Heading hierarchy is correct');
});
