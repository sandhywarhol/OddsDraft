-- ============================================
-- OddsDraft — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  avatar_url TEXT,
  total_wins INT DEFAULT 0,
  total_contests INT DEFAULT 0,
  total_earned_sol DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTESTS (one per match)
-- ============================================
CREATE TABLE IF NOT EXISTS contests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fixture_id TEXT NOT NULL,
  match_name TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_flag TEXT,
  away_flag TEXT,
  kickoff_at TIMESTAMPTZ NOT NULL,
  lineup_lock_at TIMESTAMPTZ NOT NULL,
  entry_fee_sol DECIMAL(10, 4) DEFAULT 0.1,
  prize_pool_sol DECIMAL(10, 4) DEFAULT 0,
  participant_count INT DEFAULT 0,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'lineup_open', 'locked', 'live', 'finished')),
  winner_1_id UUID REFERENCES users(id),
  winner_2_id UUID REFERENCES users(id),
  winner_3_id UUID REFERENCES users(id),
  txodds_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LINEUPS
-- ============================================
CREATE TABLE IF NOT EXISTS lineups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  players JSONB NOT NULL DEFAULT '[]',
  -- format: [{id, name, position, team, team_flag, photo_url}]
  captain_player_id TEXT NOT NULL,
  confidence JSONB NOT NULL DEFAULT '{}',
  -- format: {"player_id": stars(1-5)}
  total_points DECIMAL(10, 2) DEFAULT 0,
  rank INT,
  locked_at TIMESTAMPTZ,
  entry_tx TEXT,
  prize_claimed BOOLEAN DEFAULT FALSE,
  prize_sol DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contest_id)
);

-- ============================================
-- SCORE EVENTS (individual player events)
-- ============================================
CREATE TABLE IF NOT EXISTS score_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  fixture_id TEXT NOT NULL,
  player_id TEXT,
  player_name TEXT,
  team TEXT,
  event_type TEXT NOT NULL,
  -- goal | assist | yellow_card | red_card | own_goal
  -- clean_sheet | goalkeeper_save | penalty_save | shot_on_target
  points DECIMAL(10, 2) NOT NULL,
  minute INT,
  period TEXT,
  raw_event JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEADERBOARD CACHE (updated by trigger/function)
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  lineup_id UUID NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username TEXT,
  wallet_address TEXT,
  total_points DECIMAL(10, 2) DEFAULT 0,
  rank INT,
  prize_sol DECIMAL(10, 4) DEFAULT 0,
  prize_claimed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contest_id, lineup_id)
);

-- ============================================
-- MATCH CACHE (TxODDS fixture cache)
-- ============================================
CREATE TABLE IF NOT EXISTS match_cache (
  fixture_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  game_phase TEXT DEFAULT 'NS',
  last_synced TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PLAYER REGISTRY (World Cup 2026 players)
-- ============================================
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  team_flag TEXT,
  position TEXT NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'ATT')),
  photo_url TEXT,
  nationality TEXT,
  jersey_number INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_lineups_contest ON lineups(contest_id);
CREATE INDEX IF NOT EXISTS idx_lineups_user ON lineups(user_id);
CREATE INDEX IF NOT EXISTS idx_score_events_contest ON score_events(contest_id);
CREATE INDEX IF NOT EXISTS idx_score_events_fixture ON score_events(fixture_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_contest ON leaderboard_cache(contest_id);
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_kickoff ON contests(kickoff_at);

-- ============================================
-- ENABLE REALTIME on leaderboard_cache
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard_cache;
ALTER PUBLICATION supabase_realtime ADD TABLE score_events;
ALTER PUBLICATION supabase_realtime ADD TABLE contests;

-- ============================================
-- FUNCTION: Update leaderboard after score event
-- ============================================
CREATE OR REPLACE FUNCTION update_leaderboard_after_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate total points for affected lineups in this contest
  UPDATE leaderboard_cache lc
  SET 
    total_points = (
      SELECT COALESCE(SUM(se.points), 0)
      FROM score_events se
      JOIN lineups l ON l.contest_id = se.contest_id
      WHERE l.id = lc.lineup_id
        AND se.contest_id = NEW.contest_id
    ),
    updated_at = NOW()
  WHERE lc.contest_id = NEW.contest_id;

  -- Re-rank
  WITH ranked AS (
    SELECT lineup_id, RANK() OVER (ORDER BY total_points DESC) as new_rank
    FROM leaderboard_cache
    WHERE contest_id = NEW.contest_id
  )
  UPDATE leaderboard_cache lc
  SET rank = r.new_rank
  FROM ranked r
  WHERE lc.lineup_id = r.lineup_id AND lc.contest_id = NEW.contest_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Public read for most tables
CREATE POLICY "Public read contests" ON contests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read leaderboard" ON leaderboard_cache FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read score_events" ON score_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read players" ON players FOR SELECT TO anon, authenticated USING (true);

-- Users can read/update their own profile
CREATE POLICY "Users read own profile" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own profile" ON users FOR UPDATE TO authenticated USING (true);

-- Users can manage their own lineups
CREATE POLICY "Users manage own lineups" ON lineups FOR ALL TO authenticated USING (true);

-- Service role has full access (for API routes)
CREATE POLICY "Service role full access users" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access lineups" ON lineups FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access contests" ON contests FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access leaderboard" ON leaderboard_cache FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access score_events" ON score_events FOR ALL TO service_role USING (true);
