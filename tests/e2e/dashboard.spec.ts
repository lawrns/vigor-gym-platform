import { test, expect } from '@playwright/test';

test.describe('Dashboard and Members Management', () => {
  // Helper function to login
  async function login(page: any) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@testgym.mx');
    await page.getByLabel(/contraseña|password/i).fill('TestPassword123!');

    // Wait for the login button to be clickable and click it
    const loginButton = page.getByRole('button', { name: /iniciar sesión|login/i });
    await expect(loginButton).toBeEnabled();
    await loginButton.click();

    // Wait for navigation to dashboard with longer timeout
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // Wait for dashboard content to load
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  }

  test('dashboard loads without errors', async ({ page }) => {
    await login(page);
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Check for network errors
    const networkErrors: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    
    // Check for basic dashboard elements
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Check for KPI cards
    await expect(page.getByText(/miembros activos|active members/i)).toBeVisible();
    await expect(page.getByText(/ingresos mensuales|monthly revenue/i)).toBeVisible();
    await expect(page.getByText(/visitas totales|total visits/i)).toBeVisible();
    
    // Report any errors found
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
    if (networkErrors.length > 0) {
      console.log('Network errors found:', networkErrors);
    }
    
    // Fail test if critical errors found
    expect(errors.filter(e => !e.includes('Warning')).length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('navigation works correctly', async ({ page }) => {
    await login(page);
    
    // Test navigation to members page
    await page.getByRole('link', { name: /miembros|members/i }).click();
    await expect(page).toHaveURL(/members/);
    await expect(page.getByRole('heading', { name: /miembros|members/i })).toBeVisible();
    
    // Test navigation back to dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('members page loads and displays data', async ({ page }) => {
    await login(page);

    // Navigate to members page
    await page.goto('/admin/members');

    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Wait for the page heading to be visible first
    await expect(page.getByRole('heading', { name: /gestión de miembros|members management/i })).toBeVisible();

    // Check for action buttons first (they should load before the table)
    await expect(page.getByRole('button', { name: /nuevo miembro|new member/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /importar|import/i })).toBeVisible();

    // Wait for members table to load (with longer timeout)
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check for table headers
    await expect(page.getByText(/miembro|member/i)).toBeVisible();
    await expect(page.getByText(/email/i)).toBeVisible();
    await expect(page.getByText(/estado|status/i)).toBeVisible();

    // Report any errors found
    if (errors.length > 0) {
      console.log('Console errors on members page:', errors);
    }

    // Fail test if critical errors found
    expect(errors.filter(e => !e.includes('Warning')).length).toBe(0);
  });

  test('member creation form works', async ({ page }) => {
    await login(page);
    await page.goto('/admin/members');
    
    // Click new member button
    await page.getByRole('button', { name: /nuevo miembro|new member/i }).click();
    
    // Check if modal opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/nuevo miembro|new member/i)).toBeVisible();
    
    // Fill form
    await page.getByLabel(/nombre|first.*name/i).fill('Test');
    await page.getByLabel(/apellido|last.*name/i).fill('User');
    await page.getByLabel(/email/i).fill('test.playwright@example.com');
    
    // Submit form
    await page.getByRole('button', { name: /crear|create/i }).click();
    
    // Wait for success and modal to close
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // Verify member appears in table
    await expect(page.getByText('test.playwright@example.com')).toBeVisible();
  });

  test('member search functionality works', async ({ page }) => {
    await login(page);
    await page.goto('/admin/members');
    
    // Wait for table to load
    await page.waitForSelector('table');
    
    // Use search
    const searchInput = page.getByPlaceholder(/buscar|search/i);
    await searchInput.fill('import');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check that results are filtered
    await expect(page.getByText(/import/i)).toBeVisible();
  });

  test('member status filter works', async ({ page }) => {
    await login(page);
    await page.goto('/admin/members');
    
    // Wait for table to load
    await page.waitForSelector('table');
    
    // Use status filter
    const statusFilter = page.getByRole('combobox', { name: /estado|status/i });
    await statusFilter.selectOption('invited');
    
    // Wait for filter results
    await page.waitForTimeout(1000);
    
    // Check that only invited members are shown
    const statusBadges = page.locator('[class*="bg-blue"]'); // Invited status color
    await expect(statusBadges.first()).toBeVisible();
  });

  test('CSV import dialog opens', async ({ page }) => {
    await login(page);
    await page.goto('/admin/members');
    
    // Click import button
    await page.getByRole('button', { name: /importar|import/i }).click();
    
    // Check if import dialog opens
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/importar.*csv/i)).toBeVisible();
    
    // Check for upload area
    await expect(page.getByText(/arrastra.*archivo|drag.*file/i)).toBeVisible();
    
    // Close dialog
    await page.getByRole('button', { name: /cancelar|cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await login(page);
    
    // Check dashboard is responsive
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Navigate to members
    await page.goto('/admin/members');
    
    // Check table is responsive (should be scrollable)
    await expect(page.getByRole('table')).toBeVisible();
    
    // Check action buttons are accessible
    await expect(page.getByRole('button', { name: /nuevo|new/i })).toBeVisible();
  });

  test('logout functionality works', async ({ page }) => {
    await login(page);
    
    // Find and click logout button
    await page.getByRole('button', { name: /cerrar sesión|logout/i }).click();
    
    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
    
    // Try to access dashboard again - should redirect to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });
});
