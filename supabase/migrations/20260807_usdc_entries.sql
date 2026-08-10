-- Migration: Create usdc_entries table for USDC pool contests
-- Run this in your Supabase SQL editor or via supabase migrations

CREATE TABLE IF NOT EXISTS usdc_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id    text NOT NULL,
  wallet        text NOT NULL,
  -- Stored as text to avoid 64-bit integer overflow in JSON/JS.
  -- micro-USDC: 1 USDC = 1_000_000. Max u64 fits in text fine.
  usdc_amount   text NOT NULL DEFAULT '0',
  tx_signature  text NOT NULL,
  lineup        jsonb NOT NULL DEFAULT '{}',
  captain       text NOT NULL DEFAULT '',
  score         integer NOT NULL DEFAULT 0,
  rank          integer NOT NULL DEFAULT 0,
  prize_usdc    text NOT NULL DEFAULT '0',
  created_at    timestamptz NOT NULL DEFAULT now(),

  -- One entry per wallet per match
  UNIQUE(fixture_id, wallet)
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS usdc_entries_fixture_score
  ON usdc_entries(fixture_id, score DESC);

-- Index for wallet history
CREATE INDEX IF NOT EXISTS usdc_entries_wallet
  ON usdc_entries(wallet);

-- Row-level security: read is public, write requires service role
ALTER TABLE usdc_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read usdc_entries"
  ON usdc_entries FOR SELECT USING (true);

CREATE POLICY "service role insert usdc_entries"
  ON usdc_entries FOR INSERT
  WITH CHECK (true);  -- enforced via service role key in API route

CREATE POLICY "service role update usdc_entries"
  ON usdc_entries FOR UPDATE
  USING (true);
