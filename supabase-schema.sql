-- Run this in Supabase SQL Editor

-- ── contest_entries ────────────────────────────────────────────────────────────
create table if not exists contest_entries (
  id              uuid primary key default gen_random_uuid(),
  fixture_id      text not null,          -- TxLINE FixtureId (e.g. '18179551')
  wallet_address  text not null,          -- Solana wallet pubkey
  contest_type    text not null           -- 'top3' | '5050' | 'wta'
                  check (contest_type in ('top3', '5050', 'wta')),
  lineup          jsonb not null,         -- { players: [...], captain: '...', confidence: {...} }
  entry_tx_sig    text,                   -- Solana tx sig of 0.01 SOL payment (null = demo)
  total_points    numeric default 0,      -- updated live as match progresses
  final_rank      int,                    -- set after match ends
  prize_earned    numeric default 0,      -- SOL earned
  created_at      timestamptz default now()
);

-- Index for fast lookups by fixture
create index if not exists idx_contest_entries_fixture on contest_entries(fixture_id);
-- Index for fast lookups by wallet
create index if not exists idx_contest_entries_wallet on contest_entries(wallet_address);
-- Prevent same wallet entering same fixture+contestType twice
create unique index if not exists idx_contest_entries_unique
  on contest_entries(fixture_id, wallet_address, contest_type);

-- ── users (if not exists) ──────────────────────────────────────────────────────
create table if not exists users (
  id                  uuid primary key default gen_random_uuid(),
  wallet_address      text unique not null,
  username            text,
  avatar_url          text,
  total_contests      int default 0,
  total_wins          int default 0,
  total_earned_sol    numeric default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists idx_users_wallet on users(wallet_address);

-- ── RLS: open read, wallet-restricted write ────────────────────────────────────
alter table contest_entries enable row level security;
alter table users enable row level security;

-- Anyone can read (for leaderboard & participant counts)
create policy "public read contest_entries"
  on contest_entries for select using (true);

create policy "public read users"
  on users for select using (true);

-- Only the owner wallet can insert their own entry
-- (wallet_address must match the JWT claim or we do server-side inserts)
-- For hackathon: allow all inserts via anon key
create policy "anon insert contest_entries"
  on contest_entries for insert with check (true);

create policy "anon upsert users"
  on users for all using (true) with check (true);
