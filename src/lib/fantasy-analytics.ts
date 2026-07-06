// Fantasy Analytics — Derive player performance metrics from TxLINE match data
// Used to award bonus points at halftime/fulltime based on stats, not just events

export interface PlayerMatchStats {
  playerId: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  ownGoals: number;
  participant: 1 | 2; // home or away
}

export interface TeamMatchStats {
  participant: 1 | 2;
  teamName: string;
  goalsFor: number;
  goalsAgainst: number;
  possession: number; // 0-100
  shotsTotal: number;
  shotsOnTarget: number;
  passes: number;
  passesCompleted: number;
  tackles: number;
  interceptions: number;
  fouls: number;
}

export interface PlayerPerformanceBonus {
  playerId: string;
  defensiveBonus: number;
  possessionBonus: number;
  threatBonus: number;
  totalBonus: number;
  reason: string[];
}

// Calculate team-level aggregate stats (requires enriched TxLINE data)
export function calculateTeamStats(
  playerStats: Record<string, PlayerMatchStats>,
  participant: 1 | 2,
  teamName: string
): TeamMatchStats {
  const players = Object.values(playerStats).filter(p => p.participant === participant);

  const goalsFor = players.reduce((sum, p) => sum + p.goals, 0);
  const goalsAgainst = players.reduce((sum, p) => sum + p.ownGoals, 0);
  const saves = players.reduce((sum, p) => sum + p.saves, 0);

  return {
    participant,
    teamName,
    goalsFor,
    goalsAgainst: goalsAgainst > 0 ? goalsAgainst : 0,
    possession: 0, // Will be filled from TxLINE match stats if available
    shotsTotal: 0,
    shotsOnTarget: 0,
    passes: 0,
    passesCompleted: 0,
    tackles: 0,
    interceptions: 0,
    fouls: 0,
  };
}

// Award performance bonuses per player based on match stats
export function calculatePlayerPerformanceBonus(
  playerId: string,
  stats: PlayerMatchStats,
  position: string, // 'GK' | 'DEF' | 'MID' | 'WIN' | 'ATT'
  homeTeamStats: TeamMatchStats,
  awayTeamStats: TeamMatchStats
): PlayerPerformanceBonus {
  const isHome = stats.participant === 1;
  const teamStats = isHome ? homeTeamStats : awayTeamStats;
  const oppStats = isHome ? awayTeamStats : homeTeamStats;

  let defensiveBonus = 0;
  let possessionBonus = 0;
  let threatBonus = 0;
  const reason: string[] = [];

  // ─── DEFENSIVE BONUSES ─────────────────────────────────────────────────
  if (['GK', 'DEF'].includes(position)) {
    // Clean sheet bonus (already in base points, but defensive performance adds)
    if (oppStats.goalsFor === 0) {
      defensiveBonus += 2; // Extra bonus for clean sheet
      reason.push('Clean sheet defense');
    }

    // Low shots conceded = good defense
    if (oppStats.shotsTotal > 0 && oppStats.shotsTotal <= 3) {
      defensiveBonus += 3;
      reason.push('Limited opponent shots');
    } else if (oppStats.shotsTotal > 3 && oppStats.shotsTotal <= 6) {
      defensiveBonus += 1;
      reason.push('Moderate defensive pressure');
    }

    // Saves bonus (especially for GK)
    if (position === 'GK' && stats.saves >= 3) {
      defensiveBonus += Math.min(stats.saves, 5); // +1 per save, max +5
      reason.push(`${stats.saves} saves made`);
    }
  }

  // ─── POSSESSION BONUSES ───────────────────────────────────────────────
  if (['MID', 'WIN'].includes(position)) {
    // High possession = midfielder/winger controlled tempo
    if (teamStats.possession >= 55) {
      possessionBonus += 4;
      reason.push('High possession contribution');
    } else if (teamStats.possession >= 50) {
      possessionBonus += 2;
      reason.push('Balanced possession');
    }

    // Possession efficiency (low possession but scored = clinical)
    if (teamStats.possession < 45 && teamStats.goalsFor > 0) {
      possessionBonus += 3;
      reason.push('Clinical efficiency');
    }
  }

  // ─── THREAT BONUSES ───────────────────────────────────────────────────
  if (['WIN', 'ATT', 'MID'].includes(position)) {
    // High assists = excellent threat creation
    if (stats.assists >= 1) {
      threatBonus += 3 * stats.assists;
      reason.push(`${stats.assists} assist(s)`);
    }

    // Contributor to attack (even without goal/assist)
    if (teamStats.shotsOnTarget > 0) {
      threatBonus += Math.min(teamStats.shotsOnTarget, 3); // Contribution bonus
      reason.push('Attack contribution');
    }
  }

  // ─── DISCIPLINE BONUSES ───────────────────────────────────────────────
  // Negative: 2+ yellow cards = reckless
  if (stats.yellowCards >= 2) {
    defensiveBonus -= 2;
    reason.push('Multiple yellow cards (reckless play)');
  }

  return {
    playerId,
    defensiveBonus: Math.max(0, defensiveBonus),
    possessionBonus: Math.max(0, possessionBonus),
    threatBonus: Math.max(0, threatBonus),
    totalBonus: Math.max(0, defensiveBonus + possessionBonus + threatBonus),
    reason,
  };
}

// Apply star rating multiplier (1-5 stars)
export function applyStarMultiplier(
  basePoints: number,
  starRating: number // 1-5
): number {
  const multipliers: Record<number, number> = {
    1: 1.0,
    2: 1.1,
    3: 1.2,
    4: 1.35,
    5: 1.5,
  };

  const multiplier = multipliers[Math.min(starRating, 5)] ?? 1.2;
  return Math.round(basePoints * multiplier * 10) / 10;
}
