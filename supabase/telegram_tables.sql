-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS telegram_users (
  chat_id     BIGINT PRIMARY KEY,
  wallet_address TEXT,
  username    TEXT,
  first_name  TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telegram_subscriptions (
  chat_id     BIGINT,
  contest_id  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, contest_id)
);

-- Disable RLS for bot server access (hackathon — enable + add policies for production)
ALTER TABLE telegram_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_subscriptions DISABLE ROW LEVEL SECURITY;
