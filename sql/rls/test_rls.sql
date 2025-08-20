-- Test script to verify RLS policies work correctly
-- This script tests both allowed and denied access patterns

-- Test 1: Service role should access all data
SET ROLE service_role;

-- Should return all companies
SELECT 'Service role companies count:' as test, COUNT(*) as count FROM companies;

-- Should return all members
SELECT 'Service role members count:' as test, COUNT(*) as count FROM members;

-- Should return all visits
SELECT 'Service role visits count:' as test, COUNT(*) as count FROM visits;

-- Test 2: Simulate authenticated user with company_id
-- Note: In real usage, this would come from the JWT token
-- For testing, we'll use a function that simulates the JWT

-- Create a test function to simulate JWT with specific company_id
CREATE OR REPLACE FUNCTION test_set_company_id(company_uuid uuid)
RETURNS void
LANGUAGE sql
AS $$
  -- This is a test helper - in production the company_id comes from JWT
  SELECT set_config('request.jwt.claims', json_build_object('company_id', company_uuid)::text, true);
$$;

-- Test with a specific company
DO $$
DECLARE
  test_company_id uuid;
BEGIN
  -- Get a real company ID from the database
  SELECT id INTO test_company_id FROM companies LIMIT 1;
  
  -- Set the test company context
  PERFORM test_set_company_id(test_company_id);
  
  -- Reset role to authenticated user
  SET ROLE authenticated;
  
  -- Test queries that should work
  RAISE NOTICE 'Testing with company_id: %', test_company_id;
  
  -- Should return only members from this company
  RAISE NOTICE 'Members in company: %', (SELECT COUNT(*) FROM members WHERE company_id = test_company_id);
  
  -- Should return only memberships from this company
  RAISE NOTICE 'Memberships in company: %', (SELECT COUNT(*) FROM memberships WHERE company_id = test_company_id);
  
  -- Should return only visits from this company (through memberships)
  RAISE NOTICE 'Visits in company: %', (
    SELECT COUNT(*) FROM visits v 
    JOIN memberships m ON v.membership_id = m.id 
    WHERE m.company_id = test_company_id
  );
END $$;

-- Test 3: Test cross-company access denial
DO $$
DECLARE
  company1_id uuid;
  company2_id uuid;
  member_count_company1 integer;
  member_count_company2 integer;
BEGIN
  -- Get two different company IDs
  SELECT id INTO company1_id FROM companies LIMIT 1;
  SELECT id INTO company2_id FROM companies WHERE id != company1_id LIMIT 1;
  
  -- Test with company 1
  PERFORM test_set_company_id(company1_id);
  SET ROLE authenticated;
  SELECT COUNT(*) INTO member_count_company1 FROM members;
  
  -- Test with company 2
  PERFORM test_set_company_id(company2_id);
  SET ROLE authenticated;
  SELECT COUNT(*) INTO member_count_company2 FROM members;
  
  -- The counts should be different (unless one company has no members)
  RAISE NOTICE 'Company 1 members: %, Company 2 members: %', member_count_company1, member_count_company2;
  
  IF member_count_company1 != member_count_company2 THEN
    RAISE NOTICE 'RLS is working - different companies see different data';
  ELSE
    RAISE NOTICE 'Warning: Both companies have same member count - check if RLS is working';
  END IF;
END $$;

-- Reset to service role for cleanup
SET ROLE service_role;

-- Clean up test function
DROP FUNCTION IF EXISTS test_set_company_id(uuid);

RAISE NOTICE 'RLS tests completed. Check the output above for results.';
