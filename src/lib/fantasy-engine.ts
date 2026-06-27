// Fantasy Points Engine — OddsDraft
// Calculates fantasy points based on TxODDS soccer events

export const POINT_MAP: Record<string, number> = {
  goal:             10,
  assist:            6,
  shot_on_target:    2,
  pass_accuracy:     1,   // per 10% above 70%
  clean_sheet:       5,   // GK/DEF only
  penalty_save:      8,
  goalkeeper_save:   1,
  yellow_card:      -2,
  red_card:         -5,
  own_goal:         -6,
};

// Confidence multiplier: 1★ to 5★
// Positive points get a bonus; negative points get amplified penalty
const CONFIDENCE_BONUS: Record<number, number> = {
  1: 1.0,
  2: 1.1,
  3: 1.2,
  4: 1.35,
  5: 1.5,
};

const CONFIDENCE_PENALTY: Record<number, number> = {
  1: 1.0,
  2: 1.1,
  3: 1.2,
  4: 1.35,
  5: 1.5,
};

export interface PlayerEvent {
  playerId: string;
  playerName: string;
  eventType: string;
  minute?: number;
  period?: string;
  team?: string;
}

export interface LineupPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
}

export interface FantasyLineup {
  players: LineupPlayer[];
  captainPlayerId: string;
  confidence: Record<string, number>; // playerId -> stars(1-5)
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  basePoints: number;
  captainBonus: number;
  confidenceMultiplier: number;
  finalPoints: number;
  events: { eventType: string; points: number; minute?: number }[];
}

export interface FantasyResult {
  totalPoints: number;
  playerScores: Record<string, PlayerScore>;
  breakdown: {
    base: number;
    captainBonus: number;
    confidenceBonus: number;
  };
}

export function calculateEventPoints(eventType: string): number {
  return POINT_MAP[eventType] ?? 0;
}

export function calculateFantasyPoints(
  events: PlayerEvent[],
  lineup: FantasyLineup
): FantasyResult {
  const playerSet = new Set(lineup.players.map((p) => p.id));
  const playerScores: Record<string, PlayerScore> = {};

  // Init scores for all lineup players
  for (const player of lineup.players) {
    playerScores[player.id] = {
      playerId: player.id,
      playerName: player.name,
      basePoints: 0,
      captainBonus: 0,
      confidenceMultiplier: 1,
      finalPoints: 0,
      events: [],
    };
  }

  // Process events
  for (const event of events) {
    if (!playerSet.has(event.playerId)) continue;

    const rawPoints = calculateEventPoints(event.eventType);
    playerScores[event.playerId].basePoints += rawPoints;
    playerScores[event.playerId].events.push({
      eventType: event.eventType,
      points: rawPoints,
      minute: event.minute,
    });
  }

  let totalBase = 0;
  let totalCaptainBonus = 0;
  let totalConfidenceBonus = 0;

  // Apply captain and confidence multipliers
  for (const player of lineup.players) {
    const score = playerScores[player.id];
    const isCaptain = player.id === lineup.captainPlayerId;
    const stars = lineup.confidence[player.id] ?? 3;
    const basePoints = score.basePoints;

    // Captain: 2x total points
    const afterCaptain = isCaptain ? basePoints * 2 : basePoints;
    const captainBonus = afterCaptain - basePoints;

    // Confidence: applies to the after-captain total
    let confidenceMultiplier: number;
    if (afterCaptain >= 0) {
      confidenceMultiplier = CONFIDENCE_BONUS[stars] ?? 1;
    } else {
      confidenceMultiplier = CONFIDENCE_PENALTY[stars] ?? 1;
    }

    const finalPoints = afterCaptain * confidenceMultiplier;
    const confidenceBonus = finalPoints - afterCaptain;

    score.captainBonus = captainBonus;
    score.confidenceMultiplier = confidenceMultiplier;
    score.finalPoints = Math.round(finalPoints * 100) / 100;

    totalBase += basePoints;
    totalCaptainBonus += captainBonus;
    totalConfidenceBonus += confidenceBonus;
  }

  const totalPoints = Object.values(playerScores).reduce(
    (sum, s) => sum + s.finalPoints,
    0
  );

  return {
    totalPoints: Math.round(totalPoints * 100) / 100,
    playerScores,
    breakdown: {
      base: Math.round(totalBase * 100) / 100,
      captainBonus: Math.round(totalCaptainBonus * 100) / 100,
      confidenceBonus: Math.round(totalConfidenceBonus * 100) / 100,
    },
  };
}

// Calculate prize distribution
export function calculatePrizes(prizePool: number): { first: number; second: number; third: number } {
  return {
    first: Math.round(prizePool * 0.5 * 10000) / 10000,
    second: Math.round(prizePool * 0.3 * 10000) / 10000,
    third: Math.round(prizePool * 0.2 * 10000) / 10000,
  };
}
