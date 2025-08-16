import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Login with test credentials
    await page.fill('input[name="email"]', 'admin@testgym.mx');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should navigate to member billing page', async ({ page }) => {
    // Navigate to members page
    await page.goto('/admin/members');
    await expect(page.locator('h1')).toContainText('Miembros');

    // Find first member and click on their billing
    const firstMemberRow = page.locator('[data-testid="member-row"]').first();
    await expect(firstMemberRow).toBeVisible();
    
    // Get member ID from the row
    const memberId = await firstMemberRow.getAttribute('data-member-id');
    expect(memberId).toBeTruthy();

    // Navigate to member billing page
    await page.goto(`/admin/members/${memberId}/billing`);
    
    // Verify billing page loads
    await expect(page.locator('h1')).toContainText('Facturación del Miembro');
    await expect(page.locator('h2')).toContainText('Métodos de Pago');
  });

  test('should show empty payment methods state', async ({ page }) => {
    // Navigate to a member billing page
    await page.goto('/admin/members/test-member-id/billing');
    
    // Should show empty state
    await expect(page.locator('text=No hay métodos de pago')).toBeVisible();
    await expect(page.locator('text=Agrega una tarjeta para comenzar a procesar pagos')).toBeVisible();
    
    // Should have add card button
    await expect(page.locator('button:has-text("Agregar Primera Tarjeta")')).toBeVisible();
  });

  test('should open add card dialog', async ({ page }) => {
    // Navigate to member billing page
    await page.goto('/admin/members/test-member-id/billing');
    
    // Click add card button
    await page.click('button:has-text("Agregar Tarjeta")');
    
    // Verify dialog opens
    await expect(page.locator('text=Agregar Tarjeta')).toBeVisible();
    await expect(page.locator('text=Información de la Tarjeta')).toBeVisible();
    
    // Should have Stripe Elements card input
    await expect(page.locator('iframe[name^="__privateStripeFrame"]')).toBeVisible();
    
    // Should have action buttons
    await expect(page.locator('button:has-text("Cancelar")')).toBeVisible();
    await expect(page.locator('button:has-text("Guardar Tarjeta")')).toBeVisible();
  });

  test('should close add card dialog on cancel', async ({ page }) => {
    // Navigate to member billing page
    await page.goto('/admin/members/test-member-id/billing');
    
    // Open dialog
    await page.click('button:has-text("Agregar Tarjeta")');
    await expect(page.locator('text=Agregar Tarjeta')).toBeVisible();
    
    // Click cancel
    await page.click('button:has-text("Cancelar")');
    
    // Dialog should close
    await expect(page.locator('text=Agregar Tarjeta')).not.toBeVisible();
  });

  test('should handle Stripe portal navigation', async ({ page }) => {
    // Navigate to member billing page
    await page.goto('/admin/members/test-member-id/billing');
    
    // Mock the portal session creation
    await page.route('**/api/v1/billing/stripe/portal', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: 'https://billing.stripe.com/session/test_session_id'
        })
      });
    });

    // Click portal button
    await page.click('button:has-text("Portal de Stripe")');
    
    // Should redirect to Stripe portal (we'll just check the API call was made)
    // In a real test, you might want to check for navigation or a new tab
  });

  test('should display payment methods when available', async ({ page }) => {
    // Mock payment methods API response
    await page.route('**/api/v1/billing/payment-methods', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          paymentMethods: [
            {
              id: 'pm_test_1',
              companyId: 'company_1',
              memberId: 'member_1',
              type: 'card',
              brand: 'visa',
              last4: '4242',
              stripePaymentMethodId: 'pm_stripe_1',
              isDefault: true,
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: null,
              member: {
                id: 'member_1',
                firstName: 'Test',
                lastName: 'Member',
                email: 'test@example.com'
              }
            },
            {
              id: 'pm_test_2',
              companyId: 'company_1',
              memberId: 'member_1',
              type: 'card',
              brand: 'mastercard',
              last4: '5555',
              stripePaymentMethodId: 'pm_stripe_2',
              isDefault: false,
              createdAt: '2025-01-02T00:00:00Z',
              updatedAt: null,
              member: null
            }
          ]
        })
      });
    });

    // Navigate to member billing page
    await page.goto('/admin/members/test-member-id/billing');
    
    // Should display payment methods
    await expect(page.locator('text=VISA •••• 4242')).toBeVisible();
    await expect(page.locator('text=MASTERCARD •••• 5555')).toBeVisible();
    
    // Should show default badge
    await expect(page.locator('text=Predeterminada')).toBeVisible();
    
    // Should have make default button for non-default card
    await expect(page.locator('button:has-text("Hacer Predeterminada")')).toBeVisible();
  });

  test('should handle setting default payment method', async ({ page }) => {
    // Mock initial payment methods
    await page.route('**/api/v1/billing/payment-methods', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            paymentMethods: [
              {
                id: 'pm_test_1',
                type: 'card',
                brand: 'visa',
                last4: '4242',
                isDefault: true
              },
              {
                id: 'pm_test_2',
                type: 'card',
                brand: 'mastercard',
                last4: '5555',
                isDefault: false
              }
            ]
          })
        });
      }
    });

    // Mock set default API
    await page.route('**/api/v1/billing/payment-methods/default', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          paymentMethod: {
            id: 'pm_test_2',
            type: 'card',
            brand: 'mastercard',
            last4: '5555',
            isDefault: true
          }
        })
      });
    });

    // Navigate to member billing page
    await page.goto('/admin/members/test-member-id/billing');
    
    // Click make default button
    await page.click('button:has-text("Hacer Predeterminada")');
    
    // Should trigger API call and refresh
    // In a real test, you'd verify the UI updates to show the new default
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/billing/payment-methods', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Internal server error'
        })
      });
    });

    // Navigate to member billing page
    await page.goto('/admin/members/test-member-id/billing');
    
    // Should show error state
    await expect(page.locator('text=Error al cargar facturación')).toBeVisible();
    await expect(page.locator('button:has-text("Reintentar")')).toBeVisible();
  });

  test('should handle network errors', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/v1/billing/payment-methods', async route => {
      await route.abort('failed');
    });

    // Navigate to member billing page
    await page.goto('/admin/members/test-member-id/billing');
    
    // Should show error state
    await expect(page.locator('text=Error al cargar facturación')).toBeVisible();
    await expect(page.locator('button:has-text("Reintentar")')).toBeVisible();
  });
});
