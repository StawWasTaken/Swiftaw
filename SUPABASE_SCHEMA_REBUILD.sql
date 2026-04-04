-- ═══════════════════════════════════════════════════════════════════════════════
-- SWIFTAW CLOUD - SUPABASE SCHEMA REBUILD
-- Run this in Supabase SQL Editor to fix the schema issues
-- ═══════════════════════════════════════════════════════════════════════════════

-- STEP 1: DROP EXISTING TABLES (if they cause issues, just skip these)
-- DROP TABLE IF EXISTS migration_logs CASCADE;
-- DROP TABLE IF EXISTS session_logs CASCADE;
-- DROP TABLE IF EXISTS product_links CASCADE;
-- DROP TABLE IF EXISTS subaccounts CASCADE;
-- DROP TABLE IF EXISTS cloud_users CASCADE;

-- ═══ CREATE CLOUD USERS TABLE ═══
CREATE TABLE IF NOT EXISTS cloud_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- ═══ CREATE SUBACCOUNTS TABLE ═══
CREATE TABLE IF NOT EXISTS subaccounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cloud_user_id UUID NOT NULL REFERENCES cloud_users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(cloud_user_id, product_id)
);

-- ═══ CREATE PRODUCT LINKS TABLE ═══
CREATE TABLE IF NOT EXISTS product_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cloud_user_id UUID NOT NULL REFERENCES cloud_users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_synced TIMESTAMP WITH TIME ZONE,
  UNIQUE(cloud_user_id, product_id)
);

-- ═══ CREATE SESSION LOGS TABLE ═══
CREATE TABLE IF NOT EXISTS session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cloud_user_id UUID NOT NULL REFERENCES cloud_users(id) ON DELETE CASCADE,
  subaccount_id UUID REFERENCES subaccounts(id) ON DELETE SET NULL,
  product_id TEXT,
  login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  logout_at TIMESTAMP WITH TIME ZONE,
  is_successful BOOLEAN DEFAULT true
);

-- ═══ CREATE MIGRATION LOGS TABLE ═══
CREATE TABLE IF NOT EXISTS migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_fortized_user_id TEXT,
  new_cloud_user_id UUID REFERENCES cloud_users(id) ON DELETE SET NULL,
  new_subaccount_id UUID REFERENCES subaccounts(id) ON DELETE SET NULL,
  migrated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  migration_status TEXT DEFAULT 'pending',
  error_message TEXT
);

-- ═══ CREATE INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_cloud_users_username ON cloud_users(username);
CREATE INDEX IF NOT EXISTS idx_cloud_users_email ON cloud_users(email);
CREATE INDEX IF NOT EXISTS idx_subaccounts_cloud_user ON subaccounts(cloud_user_id);
CREATE INDEX IF NOT EXISTS idx_subaccounts_product ON subaccounts(product_id);
CREATE INDEX IF NOT EXISTS idx_product_links_cloud_user ON product_links(cloud_user_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_cloud_user ON session_logs(cloud_user_id);
CREATE INDEX IF NOT EXISTS idx_migration_logs_cloud_user ON migration_logs(new_cloud_user_id);

-- ═══ CREATE TRIGGER FUNCTION ═══
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══ CREATE TRIGGERS ═══
DROP TRIGGER IF EXISTS cloud_users_updated_at ON cloud_users;
CREATE TRIGGER cloud_users_updated_at
  BEFORE UPDATE ON cloud_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS subaccounts_updated_at ON subaccounts;
CREATE TRIGGER subaccounts_updated_at
  BEFORE UPDATE ON subaccounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES - Run these to verify everything works
-- ═══════════════════════════════════════════════════════════════════════════════

-- Check if tables exist:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check cloud_users columns:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'cloud_users'
ORDER BY ordinal_position;

-- Check subaccounts columns (this should show cloud_user_id):
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subaccounts'
ORDER BY ordinal_position;
