-- =============================================================================
-- PROTOTYPE ONLY — Maye Clinic: allow SELECT on orders / order_items for anon
-- =============================================================================
-- PostgREST returns inserted rows only if SELECT is permitted on those rows.
-- schema.sql did not add SELECT on orders/order_items for anon (bookings/orders
-- inserts only). This file adds permissive SELECT so .select() after INSERT works.
--
-- WARNING: Anyone with the anon key can read all orders and line items.
-- Replace with authenticated admin / row ownership policies before production.
-- Run in Supabase SQL Editor after schema.sql (and after any conflicting drops).
-- =============================================================================

DROP POLICY IF EXISTS orders_select_anon_prototype ON orders;
CREATE POLICY orders_select_anon_prototype ON orders
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS order_items_select_anon_prototype ON order_items;
CREATE POLICY order_items_select_anon_prototype ON order_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- =============================================================================
-- End of prototype order SELECT policies
-- =============================================================================
