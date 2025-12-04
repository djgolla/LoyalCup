-- Admin Dashboard Features
-- Adds audit_log table, shop status and featured fields

-- Audit log for admin actions
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Add status and featured fields to shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- Add status field to profiles for suspending users
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shops_status ON shops(status);
CREATE INDEX IF NOT EXISTS idx_shops_featured ON shops(featured);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Add comments for clarity
COMMENT ON TABLE audit_log IS 'Logs all admin actions for security and auditing';
COMMENT ON COLUMN shops.status IS 'Shop approval status: pending, active, suspended';
COMMENT ON COLUMN shops.featured IS 'Whether shop is featured on platform';
COMMENT ON COLUMN profiles.status IS 'User account status: active, suspended';
