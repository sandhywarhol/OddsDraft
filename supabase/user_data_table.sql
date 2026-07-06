-- ============================================
-- OddsDraft — User Data Persistence
-- Run this in Supabase SQL Editor
-- ============================================

-- Stores all user-specific data keyed by wallet address.
-- Replaces device-local storage so data is accessible from any device.
CREATE TABLE IF NOT EXISTS user_data (
  wallet_address TEXT PRIMARY KEY,
  card_collection JSONB NOT NULL DEFAULT '{"cards": []}',
  pack_opened     JSONB NOT NULL DEFAULT '{}',
  lineups         JSONB NOT NULL DEFAULT '{}',
  profile         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep updated_at current on every write
CREATE OR REPLACE FUNCTION set_user_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_data_updated_at ON user_data;
CREATE TRIGGER trg_user_data_updated_at
  BEFORE UPDATE ON user_data
  FOR EACH ROW EXECUTE FUNCTION set_user_data_updated_at();

-- Allow public reads and writes (wallet_address acts as the auth token here)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read user_data"   ON user_data FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert user_data" ON user_data FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update user_data" ON user_data FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Service role full access user_data" ON user_data FOR ALL TO service_role USING (true);
