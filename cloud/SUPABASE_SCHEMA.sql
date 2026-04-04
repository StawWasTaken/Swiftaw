-- Swiftaw Cloud Database Schema for Supabase
-- This schema manages users, profiles, subaccounts, and product connections

-- ============================================
-- USERS TABLE
-- ============================================
-- Stores core user information
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  access_level integer DEFAULT 1, -- 1: regular, 5: admin (for "staw" user)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  last_login timestamp with time zone,
  is_active boolean DEFAULT true
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (id = auth.uid() OR access_level = 5); -- Admin can read all

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- PROFILES TABLE
-- ============================================
-- Stores user profile information (display name, avatar, etc.)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name text,
  username text UNIQUE,
  avatar_url text,
  bio text,
  phone text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read any profile
CREATE POLICY "Profiles are public"
  ON profiles FOR SELECT
  USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- SUBACCOUNTS TABLE
-- ============================================
-- Stores product-specific subaccounts linked to a user
CREATE TABLE IF NOT EXISTS subaccounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_name text NOT NULL, -- "fortized", "cloud", etc.
  subaccount_id text UNIQUE NOT NULL,
  subaccount_name text,
  display_name text,
  email text,
  role text DEFAULT 'member', -- owner, admin, member
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  data jsonb DEFAULT '{}'::jsonb -- Product-specific data
);

-- Enable RLS on subaccounts table
ALTER TABLE subaccounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own subaccounts
CREATE POLICY "Users can read own subaccounts"
  ON subaccounts FOR SELECT
  USING (user_id = auth.uid() OR (SELECT access_level FROM users WHERE id = auth.uid()) = 5);

-- Policy: Users can insert new subaccounts
CREATE POLICY "Users can create subaccounts"
  ON subaccounts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own subaccounts
CREATE POLICY "Users can update own subaccounts"
  ON subaccounts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- LINKED_PRODUCTS TABLE
-- ============================================
-- Tracks which products are connected to a user's Cloud account
CREATE TABLE IF NOT EXISTS linked_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_name text NOT NULL, -- "fortized", etc.
  connected_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  last_accessed timestamp with time zone,
  is_primary boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on linked_products table
ALTER TABLE linked_products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their linked products
CREATE POLICY "Users can read linked products"
  ON linked_products FOR SELECT
  USING (user_id = auth.uid() OR (SELECT access_level FROM users WHERE id = auth.uid()) = 5);

-- ============================================
-- SESSION_LOGS TABLE
-- ============================================
-- Tracks user login sessions for security audit
CREATE TABLE IF NOT EXISTS session_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  login_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  logout_at timestamp with time zone,
  is_active boolean DEFAULT true
);

-- Enable RLS on session_logs table
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own sessions
CREATE POLICY "Users can read own sessions"
  ON session_logs FOR SELECT
  USING (user_id = auth.uid() OR (SELECT access_level FROM users WHERE id = auth.uid()) = 5);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_access_level ON users(access_level);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_subaccounts_user_id ON subaccounts(user_id);
CREATE INDEX IF NOT EXISTS idx_subaccounts_product ON subaccounts(product_name);
CREATE INDEX IF NOT EXISTS idx_linked_products_user_id ON linked_products(user_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_user_id ON session_logs(user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subaccounts_updated_at BEFORE UPDATE ON subaccounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (optional)
-- ============================================
-- Uncomment to add a test admin user
-- INSERT INTO users (email, password_hash, access_level) VALUES
--   ('staw@swiftaw.io', '$2a$10$...', 5);
