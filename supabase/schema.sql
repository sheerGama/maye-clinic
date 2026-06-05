-- =============================================================================
-- Maye Clinic — database schema for Supabase (Postgres)
-- Safe to run in Supabase SQL Editor (idempotent-ish: IF NOT EXISTS + policy drops).
-- =============================================================================
-- Sections: extensions → tables → indexes → RLS → policies
-- Prototype RLS: public read on active catalog rows; public insert on bookings/orders.
-- No admin/auth policies yet — tighten before production.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions (gen_random_uuid — available via pgcrypto on Supabase)
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  category text NOT NULL CHECK (category IN ('skin', 'laser')),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- "date" and "time" are reserved words — quoted identifiers match app-facing names.
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  service_id uuid REFERENCES services (id) ON DELETE SET NULL,
  service_name text NOT NULL,
  service_type text NOT NULL,
  "date" date NOT NULL,
  "time" time NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'جديد',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  notes text,
  total numeric(10, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'جديد',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  item_id text,
  item_type text,
  name text NOT NULL,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  line_subtotal numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Indexes (query helpers)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_services_category ON services (category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services (is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings ("date");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Policies: drop if re-running script (Postgres has no CREATE POLICY IF NOT EXISTS)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS services_select_active ON services;
DROP POLICY IF EXISTS products_select_active ON products;
DROP POLICY IF EXISTS bookings_insert_anon ON bookings;
DROP POLICY IF EXISTS orders_insert_anon ON orders;
DROP POLICY IF EXISTS order_items_insert_anon ON order_items;

-- Active catalog: readable by anon + authenticated (browser anon key)
CREATE POLICY services_select_active ON services
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY products_select_active ON products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Client-submitted bookings / orders (prototype: open insert)
CREATE POLICY bookings_insert_anon ON bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY orders_insert_anon ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY order_items_insert_anon ON order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- =============================================================================
-- End of schema
-- =============================================================================
