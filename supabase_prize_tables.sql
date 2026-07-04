-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/dujogvasvyvayhekyrdr/sql

-- Stores final leaderboard results after each match
CREATE TABLE IF NOT EXISTS contest_results (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id  text NOT NULL,
  contest_type text NOT NULL,
  wallet_address text NOT NULL,
  rank        integer NOT NULL,
  points      numeric NOT NULL DEFAULT 0,
  prize_sol   numeric NOT NULL DEFAULT 0,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(fixture_id, contest_type, wallet_address)
);

-- Tracks who has claimed their prize (prevents double-claim)
CREATE TABLE IF NOT EXISTS prize_claims (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fixture_id  text NOT NULL,
  contest_type text NOT NULL,
  wallet_address text NOT NULL,
  rank        integer NOT NULL,
  prize_sol   numeric NOT NULL,
  tx_signature text NOT NULL,
  claimed_at  timestamptz DEFAULT now(),
  UNIQUE(fixture_id, contest_type, wallet_address)
);

-- Allow public reads (anon key), restrict writes to service role
ALTER TABLE contest_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read contest_results" ON contest_results FOR SELECT USING (true);
CREATE POLICY "Service write contest_results" ON contest_results FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read prize_claims" ON prize_claims FOR SELECT USING (true);
CREATE POLICY "Service write prize_claims" ON prize_claims FOR INSERT WITH CHECK (true);
