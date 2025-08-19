import { test, expect, selectors } from '../framework/fixtures';

/**
 * VIS-01: Visit check-in flow works; Double check-in is prevented
 * Tests visit check-in functionality and double check-in prevention
 */

test.describe('Visits Management (VIS-01)', () => {
  test.beforeEach(async ({ authSession, page }) => {
    await authSession.login();

    // Reset visits state before each test to ensure isolation
    const token = await authSession.getAuthToken();
    await page.request.post('http://localhost:4001/v1/test/visits/reset', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-ID': '00000000-0000-0000-0000-000000000001',
      },
    });
  });

  test('VIS-01.1: Visit check-in flow works correctly', async ({ page, authSession }) => {
    console.log('🏃‍♂️ Testing visit check-in flow...');

    // First, we need to get a membership ID from the test data
    // Let's call the API directly to get memberships
    const response = await authSession.makeAuthenticatedRequest('/v1/memberships');

    expect(response.ok()).toBeTruthy();
    const membershipsData = await response.json();
    expect(membershipsData.data).toBeDefined();
    expect(membershipsData.data.length).toBeGreaterThan(0);

    // Use first membership for this test
    const testMembership = membershipsData.data[0];
    console.log(`📋 Using test membership: ${testMembership.id}`);

    // Get auth token for POST request
    const token = await authSession.getAuthToken();

    // Perform check-in via API
    const checkInResponse = await page.request.post('http://localhost:4001/v1/visits', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-ID': '00000000-0000-0000-0000-000000000001',
        'Content-Type': 'application/json',
      },
      data: {
        membershipId: testMembership.id,
      },
    });

    expect(checkInResponse.ok()).toBeTruthy();
    const visitResponse = await checkInResponse.json();

    // Verify visit response structure (now wrapped in visit object)
    expect(visitResponse.visit).toBeDefined();
    const visitData = visitResponse.visit;
    expect(visitData.id).toBeDefined();
    expect(visitData.membershipId).toBe(testMembership.id);
    expect(visitData.gymId).toBeDefined();
    expect(visitData.checkIn).toBeDefined();
    expect(visitData.status).toBe('in_progress');
    expect(visitData.member).toBeDefined();
    expect(visitData.gym).toBeDefined();

    console.log(`✅ Check-in successful: Visit ID ${visitData.id}`);
    console.log(`👤 Member: ${visitData.member.firstName} ${visitData.member.lastName}`);
    console.log(`🏢 Gym: ${visitData.gym.name}`);

    // Verify the visit appears in the visits list
    const visitsListResponse = await authSession.makeAuthenticatedRequest('/v1/visits');

    expect(visitsListResponse.ok()).toBeTruthy();
    const visitsListData = await visitsListResponse.json();

    const createdVisit = visitsListData.visits.find((v: any) => v.id === visitData.id);
    expect(createdVisit).toBeDefined();
    expect(createdVisit.checkOut).toBeNull(); // Should still be checked in
    console.log('✅ Visit appears in visits list');

    // Store visit ID for cleanup in other tests
    (global as any).testVisitId = visitData.id;
  });

  test('VIS-01.2: Double check-in is prevented', async ({ page, authSession }) => {
    console.log('🚫 Testing double check-in prevention...');

    // Get memberships
    const response = await authSession.makeAuthenticatedRequest('/v1/memberships');

    const membershipsData = await response.json();
    // Use second membership for this test to avoid conflicts
    const testMembership = membershipsData.data[1] || membershipsData.data[0];
    const token = await authSession.getAuthToken();

    // First check-in (should succeed)
    const firstCheckIn = await page.request.post('http://localhost:4001/v1/visits', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-ID': '00000000-0000-0000-0000-000000000001',
        'Content-Type': 'application/json',
      },
      data: {
        membershipId: testMembership.id,
      },
    });

    expect(firstCheckIn.ok()).toBeTruthy();
    const firstVisitResponse = await firstCheckIn.json();
    const firstVisitData = firstVisitResponse.visit;
    console.log(`✅ First check-in successful: ${firstVisitData.id}`);

    // Attempt second check-in (should fail with 409 Conflict)
    const secondCheckIn = await page.request.post('http://localhost:4001/v1/visits', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-ID': '00000000-0000-0000-0000-000000000001',
        'Content-Type': 'application/json',
      },
      data: {
        membershipId: testMembership.id,
      },
    });

    expect(secondCheckIn.status()).toBe(409); // Conflict
    const errorData = await secondCheckIn.json();
    expect(errorData.message).toContain('already checked in');
    expect(errorData.existingVisit).toBeDefined();
    expect(errorData.existingVisit.id).toBe(firstVisitData.id);

    console.log('✅ Double check-in prevented with 409 Conflict');
    console.log(`📋 Error message: ${errorData.message}`);

    // Store visit ID for cleanup
    (global as any).testVisitId = firstVisitData.id;
  });

  test('VIS-01.3: Visit check-out works correctly', async ({ page, authSession }) => {
    console.log('🚪 Testing visit check-out...');

    // Get memberships and create a visit first
    const response = await authSession.makeAuthenticatedRequest('/v1/memberships');

    const membershipsData = await response.json();
    // Use first membership again but this test creates its own visit
    const testMembership = membershipsData.data[0];
    const token = await authSession.getAuthToken();

    // Create a visit
    const checkInResponse = await page.request.post('http://localhost:4001/v1/visits', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-ID': '00000000-0000-0000-0000-000000000001',
        'Content-Type': 'application/json',
      },
      data: {
        membershipId: testMembership.id,
      },
    });

    const visitResponse = await checkInResponse.json();
    const visitData = visitResponse.visit;
    console.log(`📝 Created visit for check-out test: ${visitData.id}`);

    // Wait a moment to ensure different timestamps
    await page.waitForTimeout(1000);

    // Check out
    const checkOutResponse = await page.request.patch(
      `http://localhost:4001/v1/visits/${visitData.id}/checkout`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-ID': '00000000-0000-0000-0000-000000000001',
        },
      }
    );

    expect(checkOutResponse.ok()).toBeTruthy();
    const checkOutResponse_data = await checkOutResponse.json();
    const checkOutData = checkOutResponse_data.visit;

    // Verify check-out data
    expect(checkOutData.id).toBe(visitData.id);
    expect(checkOutData.checkIn).toBeDefined();
    expect(checkOutData.checkOut).toBeDefined();
    expect(checkOutData.durationMinutes).toBeGreaterThan(0);
    expect(checkOutData.status).toBe('completed');

    console.log(`✅ Check-out successful`);
    console.log(`⏱️ Visit duration: ${checkOutData.durationMinutes} minutes`);

    // Verify double check-out is prevented
    const doubleCheckOut = await page.request.patch(
      `http://localhost:4001/v1/visits/${visitData.id}/checkout`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-ID': '00000000-0000-0000-0000-000000000001',
        },
      }
    );

    expect(doubleCheckOut.status()).toBe(400); // Bad Request
    const doubleCheckOutError = await doubleCheckOut.json();
    expect(doubleCheckOutError.message).toContain('already checked out');
    console.log('✅ Double check-out prevented');
  });

  test('VIS-01.4: Visit filtering and pagination works', async ({ page, authSession }) => {
    console.log('📊 Testing visit filtering and pagination...');

    // Get visits list
    const visitsResponse = await authSession.makeAuthenticatedRequest('/v1/visits?limit=10&page=1');

    expect(visitsResponse.ok()).toBeTruthy();
    const visitsData = await visitsResponse.json();

    // Verify response structure
    expect(visitsData.visits).toBeDefined();
    expect(visitsData.pagination).toBeDefined();
    expect(visitsData.pagination.page).toBe(1);
    expect(visitsData.pagination.limit).toBe(10);
    expect(visitsData.pagination.total).toBeGreaterThanOrEqual(0);

    console.log(`📊 Found ${visitsData.visits.length} visits`);
    console.log(
      `📄 Pagination: Page ${visitsData.pagination.page} of ${Math.ceil(visitsData.pagination.total / visitsData.pagination.limit)}`
    );

    // Test date filtering
    const today = new Date().toISOString().split('T')[0];
    const filteredResponse = await authSession.makeAuthenticatedRequest(
      `/v1/visits?from=${today}T00:00:00.000Z&to=${today}T23:59:59.999Z`
    );

    expect(filteredResponse.ok()).toBeTruthy();
    const filteredData = await filteredResponse.json();

    console.log(`📅 Today's visits: ${filteredData.visits.length}`);

    // Verify all returned visits are from today
    filteredData.visits.forEach((visit: any) => {
      const visitDate = new Date(visit.checkIn).toISOString().split('T')[0];
      expect(visitDate).toBe(today);
    });

    console.log('✅ Date filtering works correctly');
  });

  test('VIS-01.5: Invalid membership check-in is rejected', async ({ page, authSession }) => {
    console.log('❌ Testing invalid membership check-in rejection...');

    const token = await authSession.getAuthToken();

    // Try to check in with invalid membership ID
    const invalidCheckIn = await page.request.post('http://localhost:4001/v1/visits', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-ID': '00000000-0000-0000-0000-000000000001',
        'Content-Type': 'application/json',
      },
      data: {
        membershipId: '00000000-0000-0000-0000-000000000999', // Invalid ID
      },
    });

    expect(invalidCheckIn.status()).toBe(404); // Not Found
    const errorData = await invalidCheckIn.json();
    expect(errorData.message).toContain('not found');
    console.log('✅ Invalid membership rejected with 404');

    // Try to check in without membership ID
    const missingMembershipCheckIn = await page.request.post('http://localhost:4001/v1/visits', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-ID': '00000000-0000-0000-0000-000000000001',
        'Content-Type': 'application/json',
      },
      data: {},
    });

    expect(missingMembershipCheckIn.status()).toBe(400); // Bad Request
    const missingError = await missingMembershipCheckIn.json();
    expect(missingError.message).toContain('membershipId is required');
    console.log('✅ Missing membership ID rejected with 400');
  });
});
