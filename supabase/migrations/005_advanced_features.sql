-- Advanced Features: Shop Hours, Reviews, Coupons, Gift Cards, Inventory
-- Migration: 005_advanced_features.sql

-- =========================================
-- 1. SHOP HOURS & CLOSURES
-- =========================================

-- Shop hours (regular weekly hours)
CREATE TABLE IF NOT EXISTS shop_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  open_time time,
  close_time time,
  is_closed boolean DEFAULT false,
  UNIQUE(shop_id, day_of_week)
);

CREATE INDEX idx_shop_hours_shop_id ON shop_hours(shop_id);

-- Shop closures (holidays, special closures)
CREATE TABLE IF NOT EXISTS shop_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  closure_date date NOT NULL,
  reason text,
  is_all_day boolean DEFAULT true,
  start_time time,
  end_time time,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_shop_closures_shop_id ON shop_closures(shop_id);
CREATE INDEX idx_shop_closures_date ON shop_closures(closure_date);

-- =========================================
-- 2. REVIEWS & RATINGS
-- =========================================

-- Shop reviews
CREATE TABLE IF NOT EXISTS shop_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  response text, -- Shop owner response
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, order_id) -- One review per order
);

CREATE INDEX idx_shop_reviews_shop_id ON shop_reviews(shop_id);
CREATE INDEX idx_shop_reviews_user_id ON shop_reviews(user_id);
CREATE INDEX idx_shop_reviews_rating ON shop_reviews(rating);
CREATE INDEX idx_shop_reviews_created_at ON shop_reviews(created_at DESC);

-- Add average rating to shops (denormalized for performance)
ALTER TABLE shops ADD COLUMN IF NOT EXISTS average_rating numeric(3,2);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- Function to update shop ratings
CREATE OR REPLACE FUNCTION update_shop_rating()
RETURNS trigger AS $$
BEGIN
  UPDATE shops
  SET 
    average_rating = (
      SELECT AVG(rating)::numeric(3,2)
      FROM shop_reviews
      WHERE shop_id = COALESCE(NEW.shop_id, OLD.shop_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM shop_reviews
      WHERE shop_id = COALESCE(NEW.shop_id, OLD.shop_id)
    )
  WHERE id = COALESCE(NEW.shop_id, OLD.shop_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ratings
DROP TRIGGER IF EXISTS shop_reviews_rating_update ON shop_reviews;
CREATE TRIGGER shop_reviews_rating_update
  AFTER INSERT OR UPDATE OR DELETE ON shop_reviews
  FOR EACH ROW EXECUTE FUNCTION update_shop_rating();

-- =========================================
-- 3. FAVORITES/BOOKMARKS
-- =========================================

-- User favorites (shops and menu items)
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (shop_id IS NOT NULL AND menu_item_id IS NULL) OR
    (shop_id IS NULL AND menu_item_id IS NOT NULL)
  ) -- Must favorite either shop or menu item, not both
);

CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_shop_id ON user_favorites(shop_id);
CREATE INDEX idx_user_favorites_menu_item_id ON user_favorites(menu_item_id);
CREATE UNIQUE INDEX idx_user_favorites_user_shop ON user_favorites(user_id, shop_id) WHERE shop_id IS NOT NULL;
CREATE UNIQUE INDEX idx_user_favorites_user_item ON user_favorites(user_id, menu_item_id) WHERE menu_item_id IS NOT NULL;

-- =========================================
-- 4. COUPONS & DISCOUNTS
-- =========================================

-- Promotional campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_item')),
  discount_value numeric(10,2) NOT NULL,
  min_purchase_amount numeric(10,2) DEFAULT 0,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  max_uses integer, -- NULL = unlimited
  uses_per_customer integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_campaigns_shop_id ON campaigns(shop_id);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_active ON campaigns(is_active) WHERE is_active = true;

-- Coupon codes
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value numeric(10,2) NOT NULL,
  min_purchase_amount numeric(10,2) DEFAULT 0,
  max_discount_amount numeric(10,2), -- Cap for percentage discounts
  usage_limit integer, -- NULL = unlimited
  usage_count integer DEFAULT 0,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_campaign_id ON coupons(campaign_id);
CREATE INDEX idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX idx_coupons_active ON coupons(is_active) WHERE is_active = true;

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  discount_amount numeric(10,2) NOT NULL,
  used_at timestamptz DEFAULT now()
);

CREATE INDEX idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX idx_coupon_usage_order_id ON coupon_usage(order_id);

-- =========================================
-- 5. GIFT CARDS
-- =========================================

CREATE TABLE IF NOT EXISTS gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  initial_balance numeric(10,2) NOT NULL,
  current_balance numeric(10,2) NOT NULL,
  purchased_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_email text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  redeemed_at timestamptz
);

CREATE INDEX idx_gift_cards_code ON gift_cards(code);
CREATE INDEX idx_gift_cards_purchased_by ON gift_cards(purchased_by);
CREATE INDEX idx_gift_cards_status ON gift_cards(status);

-- Gift card transactions
CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id uuid REFERENCES gift_cards(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL, -- Negative for redemptions
  balance_after numeric(10,2) NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'redemption', 'adjustment')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_gift_card_transactions_gift_card_id ON gift_card_transactions(gift_card_id);
CREATE INDEX idx_gift_card_transactions_order_id ON gift_card_transactions(order_id);

-- =========================================
-- 6. INVENTORY TRACKING
-- =========================================

CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL UNIQUE,
  track_inventory boolean DEFAULT false,
  current_stock integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 10,
  auto_disable_when_out boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_inventory_menu_item_id ON inventory(menu_item_id);
CREATE INDEX idx_inventory_low_stock ON inventory(current_stock) WHERE track_inventory = true AND current_stock <= low_stock_threshold;

-- Inventory transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
  quantity_change integer NOT NULL, -- Positive for additions, negative for sales
  stock_after integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('restock', 'sale', 'adjustment', 'waste')),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_inventory_transactions_menu_item_id ON inventory_transactions(menu_item_id);
CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions(created_at DESC);

-- =========================================
-- 7. ORDER SCHEDULING (ORDER AHEAD)
-- =========================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_scheduled boolean DEFAULT false;

CREATE INDEX idx_orders_scheduled_for ON orders(scheduled_for) WHERE is_scheduled = true;

-- =========================================
-- 8. DIETARY & ALLERGEN INFO
-- =========================================

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS dietary_tags text[] DEFAULT ARRAY[]::text[]; -- vegetarian, vegan, gluten-free, etc.
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergens text[] DEFAULT ARRAY[]::text[]; -- dairy, nuts, soy, etc.
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS calories integer;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS nutritional_info jsonb DEFAULT '{}'::jsonb;

CREATE INDEX idx_menu_items_dietary_tags ON menu_items USING GIN(dietary_tags);
CREATE INDEX idx_menu_items_allergens ON menu_items USING GIN(allergens);

-- =========================================
-- 9. USER ADDRESSES
-- =========================================

CREATE TABLE IF NOT EXISTS user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL, -- Home, Work, etc.
  street_address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  is_default boolean DEFAULT false,
  lat double precision,
  lng double precision,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_user_addresses_default ON user_addresses(user_id, is_default) WHERE is_default = true;

-- =========================================
-- 10. PUSH NOTIFICATION TOKENS
-- =========================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  device_type text NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now()
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);
CREATE UNIQUE INDEX idx_push_tokens_user_token ON push_tokens(user_id, token);

-- =========================================
-- COMPLETION
-- =========================================

DO $$
BEGIN
  RAISE NOTICE 'Advanced features migration completed successfully';
END $$;
