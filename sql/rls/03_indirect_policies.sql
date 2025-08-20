-- RLS Policies for tables with indirect company scoping
-- These tables are scoped to company through foreign key relationships

-- Visits table - scoped through memberships.company_id
CREATE POLICY "Users can view visits in their company"
  ON visits FOR SELECT
  USING (
    membership_id IN (
      SELECT id FROM memberships 
      WHERE company_id = auth.get_user_company_id()
    )
  );

CREATE POLICY "Users can insert visits in their company"
  ON visits FOR INSERT
  WITH CHECK (
    membership_id IN (
      SELECT id FROM memberships 
      WHERE company_id = auth.get_user_company_id()
    )
  );

CREATE POLICY "Users can update visits in their company"
  ON visits FOR UPDATE
  USING (
    membership_id IN (
      SELECT id FROM memberships 
      WHERE company_id = auth.get_user_company_id()
    )
  )
  WITH CHECK (
    membership_id IN (
      SELECT id FROM memberships 
      WHERE company_id = auth.get_user_company_id()
    )
  );

CREATE POLICY "Service role can access all visits"
  ON visits FOR ALL
  USING (auth.role() = 'service_role');

-- Payments table - scoped through invoices.company_id
CREATE POLICY "Users can view payments in their company"
  ON payments FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE company_id = auth.get_user_company_id()
    )
  );

CREATE POLICY "Users can insert payments in their company"
  ON payments FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE company_id = auth.get_user_company_id()
    )
  );

CREATE POLICY "Users can update payments in their company"
  ON payments FOR UPDATE
  USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE company_id = auth.get_user_company_id()
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE company_id = auth.get_user_company_id()
    )
  );

CREATE POLICY "Service role can access all payments"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');

-- Staff shifts table - scoped through staff.company_id
CREATE POLICY "Users can view staff shifts in their company"
  ON staff_shifts FOR SELECT
  USING (
    staff_id IN (
      SELECT id FROM staff 
      WHERE company_id = auth.get_user_company_id()
    )
  );

CREATE POLICY "Users can insert staff shifts in their company"
  ON staff_shifts FOR INSERT
  WITH CHECK (
    staff_id IN (
      SELECT id FROM staff 
      WHERE company_id = auth.get_user_company_id()
    )
  );

CREATE POLICY "Users can update staff shifts in their company"
  ON staff_shifts FOR UPDATE
  USING (
    staff_id IN (
      SELECT id FROM staff 
      WHERE company_id = auth.get_user_company_id()
    )
  )
  WITH CHECK (
    staff_id IN (
      SELECT id FROM staff 
      WHERE company_id = auth.get_user_company_id()
    )
  );

CREATE POLICY "Service role can access all staff shifts"
  ON staff_shifts FOR ALL
  USING (auth.role() = 'service_role');

-- Staff certifications table - scoped through staff.company_id
CREATE POLICY "Users can view staff certifications in their company"
  ON staff_certifications FOR SELECT
  USING (
    staff_id IN (
      SELECT id FROM staff 
      WHERE company_id = auth.get_user_company_id()
    )
  );

CREATE POLICY "Users can insert staff certifications in their company"
  ON staff_certifications FOR INSERT
  WITH CHECK (
    staff_id IN (
      SELECT id FROM staff 
      WHERE company_id = auth.get_user_company_id()
    )
  );

CREATE POLICY "Users can update staff certifications in their company"
  ON staff_certifications FOR UPDATE
  USING (
    staff_id IN (
      SELECT id FROM staff 
      WHERE company_id = auth.get_user_company_id()
    )
  )
  WITH CHECK (
    staff_id IN (
      SELECT id FROM staff 
      WHERE company_id = auth.get_user_company_id()
    )
  );

CREATE POLICY "Service role can access all staff certifications"
  ON staff_certifications FOR ALL
  USING (auth.role() = 'service_role');
