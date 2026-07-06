-- Store halftime/fulltime performance bonus calculations
-- Used to persist bonus points across page refreshes

CREATE TABLE IF NOT EXISTS match_performance_bonuses (
  id BIGSERIAL PRIMARY KEY,
  fixture_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  player_id TEXT NOT NULL,
  base_points NUMERIC DEFAULT 0,
  performance_bonus NUMERIC DEFAULT 0,
  skill_card_bonus NUMERIC DEFAULT 0,
  star_rating INT DEFAULT 3,
  total_points NUMERIC DEFAULT 0,
  timepoint TEXT NOT NULL, -- 'halftime' | 'fulltime'
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(fixture_id, wallet_address, player_id, timepoint),
  CONSTRAINT fk_wallet FOREIGN KEY(wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

CREATE INDEX idx_match_perf_fixture ON match_performance_bonuses(fixture_id);
CREATE INDEX idx_match_perf_wallet ON match_performance_bonuses(wallet_address);
CREATE INDEX idx_match_perf_fixture_wallet ON match_performance_bonuses(fixture_id, wallet_address);
