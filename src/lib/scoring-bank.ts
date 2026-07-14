// ============================================================
// OddsDraft Scoring Bank — Single Source of Truth
// All fantasy point values live here; no hardcoded numbers elsewhere.
// ============================================================

export type Position = 'GK' | 'DEF' | 'MID' | 'SWG' | 'ATT';
export type PositionRow = Record<Position, number>;

// ── Direct player events ─────────────────────────────────────────────────────
// Goals are worth more for unlikely scorers (GK > DEF > MID > SWG > ATT).
// Negative events carry the same penalty regardless of position.

export const POSITION_SCORING: Record<string, PositionRow> = {
  // Scoring
  goal:                      { GK: 20, DEF: 15, MID: 12, SWG: 11, ATT: 10 },
  assist:                    { GK:  6, DEF:  6, MID:  6, SWG:  6, ATT:  6 },
  penalty_scored:            { GK:  5, DEF:  5, MID:  5, SWG:  5, ATT:  5 },

  // Discipline
  yellow_card:               { GK: -2, DEF: -2, MID: -2, SWG: -2, ATT: -2 },
  red_card:                  { GK: -5, DEF: -5, MID: -5, SWG: -5, ATT: -5 },
  own_goal:                  { GK: -6, DEF: -6, MID: -6, SWG: -6, ATT: -6 },

  // Penalties
  // TxLINE doesn't send a goal event for in-play penalty conversions, so penalty_won
  // is treated as the scoring event — points reflect both winning and likely converting.
  penalty_won:               { GK:  8, DEF:  8, MID:  8, SWG:  8, ATT:  8 },
  penalty_missed:            { GK: -3, DEF: -3, MID: -3, SWG: -3, ATT: -3 },
  penalty_conceded:          { GK: -3, DEF: -3, MID:  0, SWG:  0, ATT:  0 },
  penalty_missed_shootout:   { GK: -3, DEF: -3, MID: -3, SWG: -3, ATT: -3 },

  // Goalkeeper
  goalkeeper_save:           { GK:  1, DEF:  0, MID:  0, SWG:  0, ATT:  0 },
  penalty_save:              { GK:  5, DEF:  0, MID:  0, SWG:  0, ATT:  0 },

  // Appearance
  starting_xi:               { GK:  2, DEF:  2, MID:  2, SWG:  2, ATT:  2 },
  sub_appearance:            { GK:  1, DEF:  1, MID:  1, SWG:  1, ATT:  1 },
  extra_time:                { GK:  2, DEF:  2, MID:  2, SWG:  2, ATT:  2 },

  // Team events (applied to all eligible players on the team)
  goal_conceded:             { GK: -1, DEF: -1, MID:  0, SWG:  0, ATT:  0 },
  clean_sheet:               { GK:  5, DEF:  5, MID:  1, SWG:  1, ATT:  0 },

  // Indirect contribution (scorer not in lineup — MID/SWG from scoring team)
  team_contribution:         { GK:  0, DEF:  0, MID:  1, SWG:  1, ATT:  0 },

  // ── Stats-based bonuses (awarded at half-time and full-time) ─────────────
  // Possession dominance — team held ≥55% possession in the half
  possession_dominant:       { GK:  1, DEF:  1, MID:  2, SWG:  1, ATT:  1 },
  // Slight possession edge — team held 50–54% possession
  possession_slight:         { GK:  0, DEF:  0, MID:  1, SWG:  0, ATT:  0 },
  // Existing per-player possession_bonus (backward-compat with individual events)
  possession_bonus:          { GK:  0, DEF:  0, MID:  1, SWG:  0, ATT:  0 },

  // Attack activity — team generated ≥5 danger attacks in the half
  danger_attack_bonus:       { GK:  0, DEF:  0, MID:  1, SWG:  1, ATT:  1 },

  // Defensive solidity — opponent generated ≤2 danger attacks in the half
  defensive_solid:           { GK:  2, DEF:  1, MID:  0, SWG:  0, ATT:  0 },

  // Corner activity — team earned ≥4 corners in the half (threat created)
  corner_active:             { GK:  0, DEF:  0, MID:  0, SWG:  1, ATT:  0 },

  // Scored this half — flat bonus for forward line if team netted ≥1 goal
  half_scored:               { GK:  0, DEF:  0, MID:  0, SWG:  1, ATT:  1 },

  // Clean half — no goals conceded in this half
  half_clean:                { GK:  1, DEF:  1, MID:  0, SWG:  0, ATT:  0 },
};

// ── Thresholds for stats-based bonuses ──────────────────────────────────────
export const STATS_THRESHOLDS = {
  possessionDominant: 55,  // team possession % for dominant bonus
  possessionSlight:   50,  // team possession % for slight bonus
  dangerAttackBonus:   5,  // minimum team danger attacks per half
  defensiveSolid:      2,  // maximum opponent danger attacks per half
  cornerActive:        4,  // minimum team corners per half
};

// ── Core lookup ──────────────────────────────────────────────────────────────
export function getPositionScore(
  eventType: string,
  position: Position | string
): number {
  const row = POSITION_SCORING[eventType];
  if (!row) return 0;
  return (row as any)[position] ?? 0;
}

// ── Half-time / full-time stats input ────────────────────────────────────────
export interface HalfStats {
  homeGoals:    number;
  awayGoals:    number;
  homeDangers:  number;
  awayDangers:  number;
  homeCorners:  number;
  awayCorners:  number;
  homePossessionPct: number; // 0–100
  awayPossessionPct: number; // 0–100
}

export interface StatBonus {
  eventType: string;
  forTeam: 'home' | 'away';
}

// Returns the list of team-wide stat bonuses that should fire for this half.
export function evaluateHalfStats(stats: HalfStats): StatBonus[] {
  const bonuses: StatBonus[] = [];
  const { homePossessionPct: hp, awayPossessionPct: ap } = stats;

  // Possession
  if (hp >= STATS_THRESHOLDS.possessionDominant) {
    bonuses.push({ eventType: 'possession_dominant', forTeam: 'home' });
  } else if (hp >= STATS_THRESHOLDS.possessionSlight) {
    bonuses.push({ eventType: 'possession_slight',   forTeam: 'home' });
  }
  if (ap >= STATS_THRESHOLDS.possessionDominant) {
    bonuses.push({ eventType: 'possession_dominant', forTeam: 'away' });
  } else if (ap >= STATS_THRESHOLDS.possessionSlight) {
    bonuses.push({ eventType: 'possession_slight',   forTeam: 'away' });
  }

  // Danger attacks
  if (stats.homeDangers >= STATS_THRESHOLDS.dangerAttackBonus) {
    bonuses.push({ eventType: 'danger_attack_bonus', forTeam: 'home' });
  }
  if (stats.awayDangers >= STATS_THRESHOLDS.dangerAttackBonus) {
    bonuses.push({ eventType: 'danger_attack_bonus', forTeam: 'away' });
  }

  // Defensive solidity (opponent had few danger attacks)
  if (stats.awayDangers <= STATS_THRESHOLDS.defensiveSolid) {
    bonuses.push({ eventType: 'defensive_solid', forTeam: 'home' });
  }
  if (stats.homeDangers <= STATS_THRESHOLDS.defensiveSolid) {
    bonuses.push({ eventType: 'defensive_solid', forTeam: 'away' });
  }

  // Corner activity
  if (stats.homeCorners >= STATS_THRESHOLDS.cornerActive) {
    bonuses.push({ eventType: 'corner_active', forTeam: 'home' });
  }
  if (stats.awayCorners >= STATS_THRESHOLDS.cornerActive) {
    bonuses.push({ eventType: 'corner_active', forTeam: 'away' });
  }

  // Scored in this half
  if (stats.homeGoals > 0) bonuses.push({ eventType: 'half_scored', forTeam: 'home' });
  if (stats.awayGoals > 0) bonuses.push({ eventType: 'half_scored', forTeam: 'away' });

  // Clean half
  if (stats.awayGoals === 0) bonuses.push({ eventType: 'half_clean', forTeam: 'home' });
  if (stats.homeGoals === 0) bonuses.push({ eventType: 'half_clean', forTeam: 'away' });

  return bonuses;
}

// Human-readable labels for stat bonus event types (for toast / history display)
export const STAT_BONUS_LABELS: Record<string, string> = {
  possession_dominant:  'Possession Dominant',
  possession_slight:    'Possession Edge',
  danger_attack_bonus:  'Attack Pressure',
  defensive_solid:      'Defensive Solid',
  corner_active:        'Corner Threat',
  half_scored:          'Team Goal Bonus',
  half_clean:           'Clean Half',
};
