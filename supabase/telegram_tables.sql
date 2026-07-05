-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS telegram_users (
  chat_id       BIGINT PRIMARY KEY,
  wallet_address TEXT,
  username      TEXT,
  first_name    TEXT,
  tz_offset     SMALLINT DEFAULT 0,  -- UTC offset in hours, e.g. 7 = WIB, -4 = EDT
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table already exists, add the column:
ALTER TABLE telegram_users ADD COLUMN IF NOT EXISTS tz_offset SMALLINT DEFAULT 0;

CREATE TABLE IF NOT EXISTS telegram_subscriptions (
  chat_id     BIGINT,
  contest_id  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, contest_id)
);

CREATE TABLE IF NOT EXISTS notified_events (
  fixture_id  TEXT,
  event_id    TEXT,
  notified_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (fixture_id, event_id)
);

-- Disable RLS for bot server access (hackathon — enable + add policies for production)
ALTER TABLE telegram_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE notified_events DISABLE ROW LEVEL SECURITY;
