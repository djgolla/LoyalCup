-- Initial LoyalCup schema (PostgreSQL)
-- Run this in Supabase SQL editor later or via migration - I wanted to start with this for now

-- Users are primarily stored in Supabase Auth; this is profile data.
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'customer', -- customer, shop_worker, shop_owner, admin
  created_at timestamptz DEFAULT now()
);

-- Shops
CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  logo_url text,
  banner_url text,
  address text,
  city text,
  state text,
  lat double precision,
  lng double precision,
  phone text,
  hours jsonb,
  loyalty_points_per_dollar integer DEFAULT 0,
  participates_in_global_loyalty boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Categories per shop
CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order integer DEFAULT 0
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE,
  category_id uuid REFERENCES menu_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  base_price numeric(9,2) NOT NULL DEFAULT 0.00,
  image_url text,
  is_available boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Shop-wide customization templates (JSON-based for simiplicity for now )
CREATE TABLE IF NOT EXISTS customization_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL, -- single_select | multi_select
  is_required boolean DEFAULT false,
  applies_to text DEFAULT 'all_items', -- could be used to scope templates
  options jsonb NOT NULL DEFAULT '[]'::jsonb -- [{ "name": "Small", "price": 0.00 }, ...]
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, accepted, preparing, ready, picked_up, completed, cancelled
  subtotal numeric(10,2) DEFAULT 0.00,
  tax numeric(10,2) DEFAULT 0.00,
  total numeric(10,2) DEFAULT 0.00,
  loyalty_points_earned integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(9,2) DEFAULT 0.00,
  total_price numeric(9,2) DEFAULT 0.00,
  customizations jsonb DEFAULT '[]'::jsonb
);

-- Loyalty (per shop or global when shop_id is NULL)
CREATE TABLE IF NOT EXISTS loyalty_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE,
  points integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  points_required integer NOT NULL,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  shop_id uuid REFERENCES shops(id),
  order_id uuid REFERENCES orders(id),
  points_change integer NOT NULL,
  type text NOT NULL, -- earned | redeemed | adjusted | expired
  created_at timestamptz DEFAULT now()
);

-- Indexes for common filters
CREATE INDEX IF NOT EXISTS idx_menu_items_shop ON menu_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_status ON orders(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
