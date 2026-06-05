-- =============================================================================
-- PROTOTYPE ONLY — Admin dashboard: read/update bookings & orders, read order_items
-- =============================================================================
-- WARNING: Open SELECT/UPDATE for anon allows anyone with the public anon key to
-- read and change all bookings and orders. Use only for class projects.
-- Replace with Supabase Auth + role checks before production.
--
-- Run in Supabase SQL Editor after schema.sql (and after booking/order insert policies).
-- Re-run safe: DROP IF EXISTS before CREATE.
-- =============================================================================

-- Bookings
DROP POLICY IF EXISTS bookings_select_anon_admin ON bookings;
DROP POLICY IF EXISTS bookings_update_anon_admin ON bookings;

CREATE POLICY bookings_select_anon_admin ON bookings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY bookings_update_anon_admin ON bookings
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Orders
DROP POLICY IF EXISTS orders_select_anon_admin ON orders;
DROP POLICY IF EXISTS orders_update_anon_admin ON orders;

CREATE POLICY orders_select_anon_admin ON orders
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY orders_update_anon_admin ON orders
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- order_items: SELECT only (status updates do not touch line items)
DROP POLICY IF EXISTS order_items_select_anon_admin ON order_items;

CREATE POLICY order_items_select_anon_admin ON order_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- =============================================================================
-- End of admin orders/bookings prototype policies
-- =============================================================================
