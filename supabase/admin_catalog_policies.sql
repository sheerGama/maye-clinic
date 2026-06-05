-- =============================================================================
-- PROTOTYPE ONLY — Maye Clinic admin catalog writes (anon key, no auth)
-- =============================================================================
-- WARNING: Allowing anonymous INSERT/UPDATE on services & products is suitable
-- ONLY for class projects / local demos. Replace with Supabase Auth + role-based
-- policies (e.g. authenticated admin only) before any production deployment.
--
-- Run AFTER supabase/schema.sql in the Supabase SQL Editor.
-- Re-run safe: policies are dropped by name first.
-- =============================================================================
-- Reads: Admin UI must list inactive (soft-deleted) rows. schema.sql only
-- allowed SELECT on active rows — these extra policies OR with the existing
-- ones so anon can SELECT all rows. Services.jsx / Shop.jsx still filter
-- is_active=true in application queries for public catalog.
-- =============================================================================

DROP POLICY IF EXISTS services_select_all_anon_catalog ON services;
CREATE POLICY services_select_all_anon_catalog ON services
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS products_select_all_anon_catalog ON products;
CREATE POLICY products_select_all_anon_catalog ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Services: allow anon/authenticated to insert and update (soft-delete uses UPDATE)
DROP POLICY IF EXISTS services_insert_anon_catalog ON services;
DROP POLICY IF EXISTS services_update_anon_catalog ON services;

CREATE POLICY services_insert_anon_catalog ON services
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY services_update_anon_catalog ON services
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Products: same
DROP POLICY IF EXISTS products_insert_anon_catalog ON products;
DROP POLICY IF EXISTS products_update_anon_catalog ON products;

CREATE POLICY products_insert_anon_catalog ON products
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY products_update_anon_catalog ON products
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- End of admin catalog policies
-- =============================================================================
