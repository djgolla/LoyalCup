-- Production Optimizations: Indexes, Full-Text Search, and Performance Enhancements
-- Migration: 004_production_optimizations.sql

-- =========================================
-- 1. COMPREHENSIVE INDEXING
-- =========================================

-- Profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Shops table
CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_city ON shops(city);
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);
CREATE INDEX IF NOT EXISTS idx_shops_featured ON shops(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_shops_created_at ON shops(created_at DESC);
-- Geospatial index for location-based queries
CREATE INDEX IF NOT EXISTS idx_shops_location ON shops USING GIST(ll_to_earth(lat, lng)) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Menu categories
CREATE INDEX IF NOT EXISTS idx_menu_categories_shop_id ON menu_categories(shop_id);
CREATE INDEX IF NOT EXISTS idx_menu_categories_display_order ON menu_categories(shop_id, display_order);

-- Menu items
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items(shop_id, is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_display_order ON menu_items(category_id, display_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_created_at ON menu_items(created_at DESC);

-- Customization templates
CREATE INDEX IF NOT EXISTS idx_customization_templates_shop_id ON customization_templates(shop_id);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shop_customer ON orders(shop_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_status_created ON orders(shop_id, status, created_at DESC);

-- Order items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

-- Loyalty balances
CREATE INDEX IF NOT EXISTS idx_loyalty_balances_user_id ON loyalty_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_balances_shop_id ON loyalty_balances(shop_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_balances_user_shop ON loyalty_balances(user_id, shop_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_balances_updated_at ON loyalty_balances(updated_at DESC);

-- Loyalty rewards
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_shop_id ON loyalty_rewards(shop_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_is_active ON loyalty_rewards(shop_id, is_active);

-- Loyalty transactions
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_shop_id ON loyalty_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order_id ON loyalty_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(type);

-- =========================================
-- 2. FULL-TEXT SEARCH INDEXES
-- =========================================

-- Add text search columns
ALTER TABLE shops ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create indexes for full-text search
CREATE INDEX IF NOT EXISTS idx_shops_search ON shops USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_menu_items_search ON menu_items USING GIN(search_vector);

-- Function to update shop search vector
CREATE OR REPLACE FUNCTION update_shops_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update menu item search vector
CREATE OR REPLACE FUNCTION update_menu_items_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update search vectors
DROP TRIGGER IF EXISTS shops_search_vector_update ON shops;
CREATE TRIGGER shops_search_vector_update
  BEFORE INSERT OR UPDATE OF name, description, city ON shops
  FOR EACH ROW EXECUTE FUNCTION update_shops_search_vector();

DROP TRIGGER IF EXISTS menu_items_search_vector_update ON menu_items;
CREATE TRIGGER menu_items_search_vector_update
  BEFORE INSERT OR UPDATE OF name, description ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_menu_items_search_vector();

-- Update existing rows with search vectors
UPDATE shops SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(city, '')), 'C')
WHERE search_vector IS NULL;

UPDATE menu_items SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B')
WHERE search_vector IS NULL;

-- =========================================
-- 3. MATERIALIZED VIEW FOR ANALYTICS
-- =========================================

-- Create materialized view for shop analytics (faster queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS shop_analytics AS
SELECT 
  s.id as shop_id,
  s.name as shop_name,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT o.customer_id) as total_customers,
  COALESCE(SUM(o.total), 0) as total_revenue,
  COALESCE(AVG(o.total), 0) as avg_order_value,
  COUNT(DISTINCT CASE WHEN o.created_at >= CURRENT_DATE THEN o.id END) as orders_today,
  COALESCE(SUM(CASE WHEN o.created_at >= CURRENT_DATE THEN o.total ELSE 0 END), 0) as revenue_today
FROM shops s
LEFT JOIN orders o ON s.id = o.shop_id AND o.status != 'cancelled'
GROUP BY s.id, s.name;

-- Index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_analytics_shop_id ON shop_analytics(shop_id);

-- Function to refresh analytics
CREATE OR REPLACE FUNCTION refresh_shop_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY shop_analytics;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 4. ADDITIONAL PERFORMANCE ENHANCEMENTS
-- =========================================

-- Enable UUID generation extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- Add constraints for data integrity
ALTER TABLE orders ADD CONSTRAINT check_order_total_positive CHECK (total >= 0);
ALTER TABLE order_items ADD CONSTRAINT check_quantity_positive CHECK (quantity > 0);
ALTER TABLE loyalty_balances ADD CONSTRAINT check_points_non_negative CHECK (points >= 0);
ALTER TABLE loyalty_rewards ADD CONSTRAINT check_points_required_positive CHECK (points_required > 0);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp triggers
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_loyalty_balances_updated_at ON loyalty_balances;
CREATE TRIGGER update_loyalty_balances_updated_at
  BEFORE UPDATE ON loyalty_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add order number generator sequence
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 5. ANALYTICS HELPER VIEWS
-- =========================================

-- View for popular menu items
CREATE OR REPLACE VIEW popular_menu_items AS
SELECT 
  mi.id,
  mi.shop_id,
  mi.name,
  mi.base_price,
  COUNT(oi.id) as order_count,
  SUM(oi.quantity) as total_quantity_sold,
  SUM(oi.total_price) as total_revenue
FROM menu_items mi
LEFT JOIN order_items oi ON mi.id = oi.menu_item_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
GROUP BY mi.id, mi.shop_id, mi.name, mi.base_price
ORDER BY order_count DESC;

-- View for customer loyalty summary
CREATE OR REPLACE VIEW customer_loyalty_summary AS
SELECT 
  p.id as customer_id,
  p.full_name,
  p.email,
  COUNT(DISTINCT o.shop_id) as shops_visited,
  COUNT(o.id) as total_orders,
  COALESCE(SUM(o.total), 0) as lifetime_spend,
  COALESCE(SUM(o.loyalty_points_earned), 0) as lifetime_points_earned
FROM profiles p
LEFT JOIN orders o ON p.id = o.customer_id AND o.status = 'completed'
WHERE p.role = 'customer'
GROUP BY p.id, p.full_name, p.email;

-- =========================================
-- COMPLETION
-- =========================================

-- Grant appropriate permissions (adjust based on your roles)
-- GRANT SELECT ON shop_analytics TO authenticated;
-- GRANT SELECT ON popular_menu_items TO authenticated;
-- GRANT SELECT ON customer_loyalty_summary TO authenticated;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Production optimizations migration completed successfully';
END $$;
