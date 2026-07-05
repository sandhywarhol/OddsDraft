-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS contest_results (
  fixture_id    TEXT,
  contest_type  TEXT,
  wallet_address TEXT,
  rank          INT,
  points        NUMERIC,
  prize_sol     NUMERIC DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (fixture_id, contest_type, wallet_address)
);

CREATE TABLE IF NOT EXISTS prize_claims (
  fixture_id    TEXT,
  contest_type  TEXT,
  wallet_address TEXT,
  rank          INT,
  prize_sol     NUMERIC,
  tx_signature  TEXT,
  claimed_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (fixture_id, contest_type, wallet_address)
);

-- Disable RLS so server-side API can read/write without auth token
ALTER TABLE contest_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE prize_claims DISABLE ROW LEVEL SECURITY;
