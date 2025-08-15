import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('login → dashboard access', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Verify we're on the login page by checking for login heading
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();

    // Fill in login credentials
    await page.getByLabel(/email/i).fill('admin@testgym.mx');
    await page.getByLabel(/contraseña|password/i).fill('TestPassword123!');

    // Submit login form
    await page.getByRole('button', { name: /iniciar sesión|login/i }).click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);

    // Verify we can see dashboard content (simplified check)
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('invalid login shows error', async ({ page }) => {
    await page.goto('/login');
    
    // Try invalid credentials
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/contraseña|password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar sesión|login/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid|inválido|error/i)).toBeVisible();
    
    // Should still be on login page
    await expect(page).toHaveURL(/login/);
  });

  test('public routes accessible without auth', async ({ page }) => {
    // Test homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Vigor/);
    
    // Test plans page
    await page.goto('/planes');
    await expect(page.getByRole('heading', { name: /elige tu plan/i })).toBeVisible();
    
    // Should not redirect to login
    await expect(page).not.toHaveURL(/login/);
  });

  test('protected routes redirect to login', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});
