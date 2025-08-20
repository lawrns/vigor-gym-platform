-- RLS Policies for direct company-scoped tables
-- These tables have a direct company_id column

-- Helper function to get current user's company_id from JWT
CREATE OR REPLACE FUNCTION auth.get_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'company_id')::uuid,
    (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
  );
$$;

-- Companies table - users can only see their own company
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (id = auth.get_user_company_id());

CREATE POLICY "Service role can access all companies"
  ON companies FOR ALL
  USING (auth.role() = 'service_role');

-- Members table - scoped to company
CREATE POLICY "Users can view members in their company"
  ON members FOR SELECT
  USING (company_id = auth.get_user_company_id());

CREATE POLICY "Users can insert members in their company"
  ON members FOR INSERT
  WITH CHECK (company_id = auth.get_user_company_id());

CREATE POLICY "Users can update members in their company"
  ON members FOR UPDATE
  USING (company_id = auth.get_user_company_id())
  WITH CHECK (company_id = auth.get_user_company_id());

CREATE POLICY "Service role can access all members"
  ON members FOR ALL
  USING (auth.role() = 'service_role');

-- Memberships table - scoped to company
CREATE POLICY "Users can view memberships in their company"
  ON memberships FOR SELECT
  USING (company_id = auth.get_user_company_id());

CREATE POLICY "Users can insert memberships in their company"
  ON memberships FOR INSERT
  WITH CHECK (company_id = auth.get_user_company_id());

CREATE POLICY "Users can update memberships in their company"
  ON memberships FOR UPDATE
  USING (company_id = auth.get_user_company_id())
  WITH CHECK (company_id = auth.get_user_company_id());

CREATE POLICY "Service role can access all memberships"
  ON memberships FOR ALL
  USING (auth.role() = 'service_role');

-- Invoices table - scoped to company
CREATE POLICY "Users can view invoices in their company"
  ON invoices FOR SELECT
  USING (company_id = auth.get_user_company_id());

CREATE POLICY "Users can insert invoices in their company"
  ON invoices FOR INSERT
  WITH CHECK (company_id = auth.get_user_company_id());

CREATE POLICY "Users can update invoices in their company"
  ON invoices FOR UPDATE
  USING (company_id = auth.get_user_company_id())
  WITH CHECK (company_id = auth.get_user_company_id());

CREATE POLICY "Service role can access all invoices"
  ON invoices FOR ALL
  USING (auth.role() = 'service_role');

-- Staff table - scoped to company
CREATE POLICY "Users can view staff in their company"
  ON staff FOR SELECT
  USING (company_id = auth.get_user_company_id());

CREATE POLICY "Users can insert staff in their company"
  ON staff FOR INSERT
  WITH CHECK (company_id = auth.get_user_company_id());

CREATE POLICY "Users can update staff in their company"
  ON staff FOR UPDATE
  USING (company_id = auth.get_user_company_id())
  WITH CHECK (company_id = auth.get_user_company_id());

CREATE POLICY "Service role can access all staff"
  ON staff FOR ALL
  USING (auth.role() = 'service_role');
