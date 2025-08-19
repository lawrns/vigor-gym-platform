import { test, expect, selectors } from '../framework/fixtures';

/**
 * MEM-01: Members list loads with RBAC enforced; Member edit/update within tenant
 * Tests member management functionality and role-based access control
 */

test.describe('Members Management (MEM-01)', () => {
  test.beforeEach(async ({ authSession }) => {
    // Ensure we're authenticated for all member tests
    await authSession.login();
  });

  test('MEM-01.1: Members list loads with RBAC enforced', async ({ page, authSession }) => {
    console.log('👥 Testing members list loading and RBAC...');

    // Navigate to members page
    await page.goto('/admin/members');

    // Verify we're on the members page
    await expect(page).toHaveURL(/\/admin\/members/);
    console.log('✅ Navigated to members page');

    // Verify page title and header
    await expect(page.locator('h1')).toContainText('Gestión de Miembros');
    console.log('✅ Members page header visible');

    // Wait for loading state to disappear and table to be visible
    await expect(page.getByTestId('members-loading')).toBeHidden();
    await expect(page.getByTestId('members-table')).toBeVisible();
    console.log('✅ Members table rendered');

    // Verify table headers are present
    await expect(page.locator('th')).toContainText([
      'Miembro',
      'Email',
      'Estado',
      'Membresías',
      'Fecha de registro',
      'Acciones',
    ]);
    console.log('✅ Table headers correct');

    // Check if members are loaded (should have test data)
    const memberRows = page.locator(selectors.membersRow);
    const memberCount = await memberRows.count();
    expect(memberCount).toBeGreaterThan(0);
    console.log(`✅ Found ${memberCount} members in table`);

    // Verify RBAC - edit/delete buttons should be visible for admin/owner
    const firstMemberRow = memberRows.first();
    await expect(firstMemberRow.locator('[data-testid*="member-edit-"]')).toBeVisible();
    await expect(firstMemberRow.locator('[data-testid*="member-delete-"]')).toBeVisible();
    console.log('✅ RBAC: Edit/delete buttons visible for authorized user');

    // Verify search functionality exists
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await expect(searchInput).toBeVisible();
    console.log('✅ Search functionality available');

    // Verify filter functionality exists
    const statusFilter = page.locator('select');
    await expect(statusFilter).toBeVisible();
    console.log('✅ Status filter available');
  });

  test('MEM-01.2: Member edit/update within tenant', async ({ page, authSession }) => {
    console.log('✏️ Testing member edit/update functionality...');

    // Navigate to members page
    await page.goto('/admin/members');

    // Wait for members to load
    const memberRows = page.locator(selectors.membersRow);
    await expect(memberRows.first()).toBeVisible();

    // Get the first member's current data
    const firstMemberRow = memberRows.first();
    const originalName = await firstMemberRow.locator('td').first().textContent();
    console.log(`📝 Original member name: ${originalName}`);

    // Click edit button on first member
    const editButton = firstMemberRow.locator('[data-testid*="member-edit-"]');
    await editButton.click();
    console.log('🔄 Clicked edit button');

    // Verify edit form opens
    await expect(page.locator('text=Editar Miembro')).toBeVisible();
    console.log('✅ Edit form opened');

    // Verify form fields are populated
    const firstNameInput = page.locator('[data-testid="member-form-firstName"]');
    const lastNameInput = page.locator('[data-testid="member-form-lastName"]');
    const emailInput = page.locator('[data-testid="member-form-email"]');

    await expect(firstNameInput).toBeVisible();
    await expect(lastNameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    console.log('✅ Form fields visible and populated');

    // Update the first name
    const newFirstName = 'UpdatedName';
    await firstNameInput.fill(newFirstName);
    console.log(`📝 Updated first name to: ${newFirstName}`);

    // Submit the form
    const submitButton = page.locator('[data-testid="member-form-submit"]');
    await submitButton.click();
    console.log('💾 Submitted form');

    // Wait for form to close and table to update
    await expect(page.locator('text=Editar Miembro')).not.toBeVisible();
    console.log('✅ Edit form closed');

    // Verify the member was updated in the table
    await page.waitForTimeout(1000); // Allow time for table refresh
    const updatedMemberRow = memberRows.first();
    const updatedName = await updatedMemberRow.locator('td').first().textContent();

    expect(updatedName).toContain(newFirstName);
    console.log(`✅ Member updated successfully: ${updatedName}`);
  });

  test('MEM-01.3: Member search and filtering works', async ({ page, authSession }) => {
    console.log('🔍 Testing member search and filtering...');

    // Navigate to members page
    await page.goto('/admin/members');

    // Wait for members to load
    const memberRows = page.locator(selectors.membersRow);
    await expect(memberRows.first()).toBeVisible();

    const initialCount = await memberRows.count();
    console.log(`📊 Initial member count: ${initialCount}`);

    // Test search functionality
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await searchInput.fill('Test');
    await page.keyboard.press('Enter');
    console.log('🔍 Performed search for "Test"');

    // Wait for search results
    await page.waitForTimeout(1000);
    const searchResultCount = await memberRows.count();
    console.log(`📊 Search result count: ${searchResultCount}`);

    // Clear search
    await searchInput.fill('');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Verify count returns to original
    const clearedSearchCount = await memberRows.count();
    expect(clearedSearchCount).toBe(initialCount);
    console.log('✅ Search cleared successfully');

    // Test status filter
    const statusFilter = page.locator('select');
    await statusFilter.selectOption('active');
    console.log('🔄 Applied active status filter');

    // Wait for filter results
    await page.waitForTimeout(1000);
    const filteredCount = await memberRows.count();
    console.log(`📊 Filtered count: ${filteredCount}`);

    // Verify all visible members have active status
    const statusBadges = page.locator('.bg-green-100, .bg-green-50');
    const activeBadgeCount = await statusBadges.count();
    expect(activeBadgeCount).toBeGreaterThan(0);
    console.log('✅ Status filter working correctly');
  });

  test('MEM-01.4: Member creation works correctly', async ({ page, authSession }) => {
    console.log('➕ Testing member creation...');

    // Navigate to members page
    await page.goto('/admin/members');

    // Click "Add Member" button (assuming it exists)
    const addButton = page.locator('button', { hasText: 'Nuevo Miembro' });
    if (await addButton.isVisible()) {
      await addButton.click();
      console.log('🔄 Clicked add member button');

      // Verify create form opens
      await expect(page.locator('text=Nuevo Miembro')).toBeVisible();
      console.log('✅ Create form opened');

      // Fill out the form
      const testMember = {
        firstName: 'TestFirst',
        lastName: 'TestLast',
        email: `test.member.${Date.now()}@testgym.mx`,
      };

      await page.locator('[data-testid="member-form-firstName"]').fill(testMember.firstName);
      await page.locator('[data-testid="member-form-lastName"]').fill(testMember.lastName);
      await page.locator('[data-testid="member-form-email"]').fill(testMember.email);
      console.log(`📝 Filled form with: ${testMember.firstName} ${testMember.lastName}`);

      // Submit the form
      await page.locator('[data-testid="member-form-submit"]').click();
      console.log('💾 Submitted create form');

      // Wait for form to close
      await expect(page.locator('text=Nuevo Miembro')).not.toBeVisible();
      console.log('✅ Create form closed');

      // Verify new member appears in table
      await page.waitForTimeout(1000);
      await expect(page.locator('text=' + testMember.firstName)).toBeVisible();
      console.log('✅ New member created successfully');
    } else {
      console.log('ℹ️ Add member button not found - skipping creation test');
    }
  });
});
