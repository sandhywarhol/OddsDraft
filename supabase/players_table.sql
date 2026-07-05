-- Run this in Supabase Dashboard → SQL Editor
-- Creates the players table for dynamic WC2026 squad data

CREATE TABLE IF NOT EXISTS players (
  id              TEXT PRIMARY KEY,          -- e.g. bra-alisson
  name            TEXT NOT NULL,
  team            TEXT NOT NULL,
  team_flag       TEXT,
  position        TEXT NOT NULL,             -- GK | DEF | MID | ATT
  jersey_number   INT,
  rating          INT DEFAULT 78,
  synced_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS players_team_idx ON players (team);
CREATE INDEX IF NOT EXISTS players_position_idx ON players (position);

ALTER TABLE players DISABLE ROW LEVEL SECURITY;
