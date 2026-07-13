// Fantasy Points Engine — OddsDraft
// Calculates fantasy points based on TxLINE Soccer API events
// All scoring values are sourced from src/lib/scoring-bank.ts

import { getPositionScore, POSITION_SCORING } from './scoring-bank';
export { getPositionScore, POSITION_SCORING };

// Legacy flat map — kept only for callers that pass a pre-computed event without a position.
// Prefer getPositionScore(event, position) for all new code.
export const POINT_MAP: Record<string, number> = {
  yellow_card:             -2,
  red_card:                -5,
  own_goal:                -6,
  penalty_conceded:        -3,
  penalty_missed:          -3,
  penalty_missed_shootout: -3,
  assist:                   6,
  goalkeeper_save:          1,
  possession_bonus:         1,
  sub_appearance:           1,
  penalty_scored:           5,
  extra_time:               2,
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
  // TxLINE: dataSoccer.GoalType — 'Head' | 'Shot' | 'OwnGoal' | 'Other'
  goalType?: 'Head' | 'Shot' | 'OwnGoal' | 'Other';
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

export function calculateEventPoints(eventType: string, position: string = 'ATT'): number {
  // Display-only events — skip bank lookup for performance
  if (eventType === 'danger_attack' || eventType === 'corner_kick' ||
      eventType === 'var_review'    || eventType === 'substitution') return 0;

  // Delegate to the scoring bank (covers all known event types)
  const banked = getPositionScore(eventType, position as any);
  if (banked !== 0) return banked;

  // Fall through to legacy flat map for any event the bank doesn't define
  return POINT_MAP[eventType] ?? 0;
}

export function calculateFantasyPoints(
  events: PlayerEvent[],
  lineup: FantasyLineup
): FantasyResult {
  const playerSet = new Set(lineup.players.map((p) => p.id));
  const playerScores: Record<string, PlayerScore> = {};
  const appearedPlayers = new Set<string>(); // Keep track of implicit appearance

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

    const isExplicitAppearance =
      event.eventType === 'starting_xi' || event.eventType === 'sub_appearance';

    // Implicit appearance (+2) fires only when there is no explicit starting_xi/sub_appearance
    // event for this player. This prevents double-counting when both are present.
    if (!isExplicitAppearance && !appearedPlayers.has(event.playerId)) {
      appearedPlayers.add(event.playerId);
      playerScores[event.playerId].basePoints += 2;
      playerScores[event.playerId].events.push({
        eventType: 'appearance (implicit)',
        points: 2,
        minute: event.minute,
      });
    }

    // Mark as appeared so implicit never fires after an explicit appearance event
    appearedPlayers.add(event.playerId);

    const lineupPlayer = lineup.players.find(p => p.id === event.playerId);
    const rawPoints = calculateEventPoints(event.eventType, lineupPlayer?.position || 'ATT');
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

export const ENTRY_FEE_SOL = 0.1;

// Platform takes 10% of every contest prize pool.
// Single-participant entries are fully refunded (no fee — no contest happened).
export const PLATFORM_FEE_PCT = 0.10;

// Total gross pool = sum of all entry fees.
export function calculatePrizePool(participantCount: number, entryFeeSol = ENTRY_FEE_SOL): number {
  return Math.round(participantCount * entryFeeSol * 10000) / 10000;
}

// 10% of gross pool → treasury wallet.
// Returns 0 for single-participant (full refund, no fee charged).
export function calculatePlatformFee(participantCount: number, entryFeeSol = ENTRY_FEE_SOL): number {
  if (participantCount <= 1) return 0;
  const pool = calculatePrizePool(participantCount, entryFeeSol);
  return Math.round(pool * PLATFORM_FEE_PCT * 10000) / 10000;
}

// 90% of gross pool — what is actually distributed to winners.
// For single-participant: full pool (100%) is refunded, no platform cut.
export function calculateDistributablePool(participantCount: number, entryFeeSol = ENTRY_FEE_SOL): number {
  if (participantCount <= 1) return calculatePrizePool(participantCount, entryFeeSol);
  const pool = calculatePrizePool(participantCount, entryFeeSol);
  return Math.round(pool * (1 - PLATFORM_FEE_PCT) * 10000) / 10000;
}

// Returns the SOL prize for a given rank, contest type, and participant count.
// Prize percentages apply to the DISTRIBUTABLE pool (90% of gross).
// Rules:
//   top3  — 50% / 30% / 20% of distributable to ranks 1 / 2 / 3
//   5050  — equal split among top 50% of participants (min 1 winner)
//   wta   — 100% of distributable to rank 1
export function getPrizeForRank(rank: number, contestType: string, participantCount: number, entryFeeSol = ENTRY_FEE_SOL): number {
  if (rank < 1) return 0;

  // Single participant: full refund (no platform fee, no contest)
  if (participantCount <= 1) {
    const pool = calculatePrizePool(participantCount, entryFeeSol);
    return rank === 1 ? pool : 0;
  }

  const dist = calculateDistributablePool(participantCount, entryFeeSol);
  if (dist === 0) return 0;

  if (contestType === 'wta') {
    return rank === 1 ? dist : 0;
  }

  if (contestType === '5050') {
    const winnersCount = Math.max(1, Math.floor(participantCount / 2));
    return rank <= winnersCount ? Math.round((dist / winnersCount) * 10000) / 10000 : 0;
  }

  // top3 — 2 participants: 60/40 split of distributable pool
  if (participantCount === 2) {
    if (rank === 1) return Math.round(dist * 0.6 * 10000) / 10000;
    if (rank === 2) return Math.round(dist * 0.4 * 10000) / 10000;
    return 0;
  }

  // top3 standard (3+ participants): 50/30/20 of distributable pool
  if (rank === 1) return Math.round(dist * 0.5 * 10000) / 10000;
  if (rank === 2) return Math.round(dist * 0.3 * 10000) / 10000;
  if (rank === 3) return Math.round(dist * 0.2 * 10000) / 10000;
  return 0;
}

// Legacy — kept for callers that pass a pre-computed pool total.
// Caller is responsible for passing the distributable (post-fee) pool.
export function calculatePrizes(prizePool: number): { first: number; second: number; third: number } {
  return {
    first: Math.round(prizePool * 0.5 * 10000) / 10000,
    second: Math.round(prizePool * 0.3 * 10000) / 10000,
    third: Math.round(prizePool * 0.2 * 10000) / 10000,
  };
}
