-- Database Safety Rails for Vigor Gym Platform
-- Run once to add foreign key constraints and indexes for tenant isolation

-- Ensure users.company_id → companies.id foreign key
-- This prevents orphaned users and ensures data integrity
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_company_fk' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_company_fk
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;
        
        RAISE NOTICE 'Added foreign key constraint: users_company_fk';
    ELSE
        RAISE NOTICE 'Foreign key constraint users_company_fk already exists';
    END IF;
END $$;

-- Add indexes for tenant isolation queries
-- These improve performance for company-scoped queries

-- Index for visits by company (via membership -> member -> company)
CREATE INDEX IF NOT EXISTS idx_visits_company_lookup 
ON visits(membership_id);

-- Index for members by company
CREATE INDEX IF NOT EXISTS idx_members_company 
ON members(company_id);

-- Index for memberships by company  
CREATE INDEX IF NOT EXISTS idx_memberships_company
ON memberships(company_id);

-- Index for staff by company
CREATE INDEX IF NOT EXISTS idx_staff_company
ON staff(company_id) WHERE company_id IS NOT NULL;

-- Index for user authentication lookups
CREATE INDEX IF NOT EXISTS idx_users_email_active
ON users(email) WHERE is_active = true;

-- Index for company lookups
CREATE INDEX IF NOT EXISTS idx_companies_active
ON companies(id) WHERE created_at IS NOT NULL;

-- Row Level Security policies (if using Supabase RLS)
-- These enforce tenant isolation at the database level

-- Enable RLS on key tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy for users
-- Users can only see users from their own company
DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
FOR ALL
USING (
    company_id = COALESCE(
        current_setting('request.jwt.claims', true)::jsonb->>'company_id',
        current_setting('app.current_company_id', true)
    )::uuid
);

-- Tenant isolation policy for members
DROP POLICY IF EXISTS tenant_isolation_members ON members;
CREATE POLICY tenant_isolation_members ON members
FOR ALL  
USING (
    company_id = COALESCE(
        current_setting('request.jwt.claims', true)::jsonb->>'company_id',
        current_setting('app.current_company_id', true)
    )::uuid
);

-- Tenant isolation policy for memberships
DROP POLICY IF EXISTS tenant_isolation_memberships ON memberships;
CREATE POLICY tenant_isolation_memberships ON memberships
FOR ALL
USING (
    company_id = COALESCE(
        current_setting('request.jwt.claims', true)::jsonb->>'company_id', 
        current_setting('app.current_company_id', true)
    )::uuid
);

-- Tenant isolation policy for visits (via membership -> company)
DROP POLICY IF EXISTS tenant_isolation_visits ON visits;
CREATE POLICY tenant_isolation_visits ON visits
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM memberships m 
        WHERE m.id = visits.membership_id 
        AND m.company_id = COALESCE(
            current_setting('request.jwt.claims', true)::jsonb->>'company_id',
            current_setting('app.current_company_id', true)
        )::uuid
    )
);

-- Grant necessary permissions for application user
-- Adjust role name as needed for your setup
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vigor_app') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vigor_app;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vigor_app;
        RAISE NOTICE 'Granted permissions to vigor_app role';
    ELSE
        RAISE NOTICE 'vigor_app role does not exist, skipping permission grants';
    END IF;
END $$;

-- Verification queries
-- Run these to verify the safety rails are working

-- Check foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('users', 'members', 'memberships', 'visits');

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('users', 'members', 'memberships', 'visits', 'companies')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('users', 'members', 'memberships', 'visits')
ORDER BY tablename, policyname;
