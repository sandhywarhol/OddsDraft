import { calculateEventPoints, resolvePlayerDelta } from '@/lib/fantasy-engine';
import { matchPlayerName } from '@/lib/txline-bridge';

// Event types that can move a fantasy score — mirrors what /api/cron/match-events
// records as "significant" and what /api/prize/submit finalizes with.
export const SCORING_EVENTS = new Set([
  'goal', 'own_goal', 'red_card', 'yellow_card', 'penalty_save',
  'assist', 'penalty_won', 'penalty_missed', 'goalkeeper_save',
]);

export interface ScoringEvent {
  event_type: string;
  player_name: string | null;
  team_name: string | null;
  minute?: number;
}

export interface ContestLineup {
  captain?: string;
  confidence?: Record<string, number>;
  players?: { id: string; name?: string; position?: string }[];
}

// Same player-matching + point-resolution logic used to finalize real prize payouts
// in /api/prize/submit — kept here as the single source of truth so a live leaderboard
// preview and the authoritative payout computation can never silently drift apart.
export function computeParticipantPoints(lineup: ContestLineup | null | undefined, events: ScoringEvent[]): number {
  if (!lineup?.players?.length) return 0;

  let total = 0;
  for (const ev of events) {
    const resolvedId = matchPlayerName(ev.player_name ?? '', ev.team_name ?? '');
    let matched = resolvedId
      ? lineup.players.find((p) => p.id === resolvedId)
      : null;

    if (!matched && ev.player_name) {
      const parts = ev.player_name.toLowerCase().split(/\s+/).filter((p) => p.length >= 3);
      matched = lineup.players.find((p) =>
        parts.some((part) => (p.name ?? '').toLowerCase().includes(part))
      );
    }
    if (!matched) continue;

    const basePts = calculateEventPoints(ev.event_type, matched.position ?? 'ATT');
    if (basePts === 0) continue;

    const isCaptain = lineup.captain === matched.id;
    const stars = (lineup.confidence ?? {})[matched.id] ?? 3;
    total += resolvePlayerDelta(basePts, { isCaptain, confidenceStars: stars });
  }

  return Math.round(total * 100) / 100;
}
