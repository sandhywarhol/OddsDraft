import { calculateEventPoints, resolvePlayerDelta } from '@/lib/fantasy-engine';
import { matchPlayerName } from '@/lib/txline-bridge';
import { WC2026_PLAYERS } from '@/lib/wc2026-players-static';

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
  players?: { id: string; name?: string; position?: string; team?: string }[];
}

// Team-level match context. When supplied, computeParticipantPoints also applies the
// TEAM-based scoring the live page shows the user — goals/penalties conceded and clean
// sheets — so the authoritative server score reflects lineup composition even when the
// (devnet) feed sends no player names to attribute individual goals to.
export interface MatchContext {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;  // authoritative home score (use max-seen to survive devnet loops)
  awayGoals: number;  // authoritative away score
  started: boolean;   // true once ANY event is recorded → award the appearance bonus
  final: boolean;     // true once the match is over → clean-sheet bonus becomes eligible
}

// Registry: internal player id → { team, position }. Lets us resolve a lineup player's
// team for conceding/clean-sheet math even when the lineup row omits it.
const PLAYER_REGISTRY = new Map(WC2026_PLAYERS.map(p => [p.id, p]));

// Same player-matching + point-resolution logic used to finalize real prize payouts
// in /api/prize/submit — kept here as the single source of truth so a live leaderboard
// preview and the authoritative payout computation can never silently drift apart.
//
// starterIds: when provided (fetched from TxLINE lineup), only players in this set receive
// the starting appearance bonus (+2). Players on the bench are correctly excluded.
// Pass null/undefined to fall back to awarding all players (e.g. when lineup data unavailable).
export function computeParticipantPoints(
  lineup: ContestLineup | null | undefined,
  events: ScoringEvent[],
  starterIds?: Set<string> | null,
  matchCtx?: MatchContext | null,
): number {
  if (!lineup?.players?.length) return 0;

  let total = 0;

  // Appearance bonus (+2 per player): the client-side engine awards this at kick_off,
  // so opponents on the live leaderboard must get it the moment the match STARTS — not
  // only once a scoring event (goal/card) happens. Early in a 0-0 match the DB holds only
  // danger_attack/corner rows (non-scoring), so gating on `events.length` (scoring events)
  // left every opponent stuck at 0 while the viewer's own client-side score already showed
  // appearance points. `matchCtx.started` (any event recorded → the match is live) fixes it.
  const matchStarted = events.length > 0 || !!matchCtx?.started;
  if (matchStarted) {
    for (const p of lineup.players) {
      // When TxLINE lineup data is available, only real starters get the bonus.
      // Bench players (not in starterIds) are skipped to match client-side behaviour.
      if (starterIds && !starterIds.has(p.id)) continue;
      const isCaptain = lineup.captain === p.id;
      const stars = (lineup.confidence ?? {})[p.id] ?? 3;
      total += resolvePlayerDelta(0, { isCaptain, confidenceStars: stars, appearanceBonus: 2 });
    }
  }

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

  // ── Team-level scoring (mirrors the live page) ────────────────────────────────
  // The individual-goal loop above attributes goals to their scorer — but the (devnet)
  // feed usually sends no player name, so nothing matches and everyone ties on the
  // appearance bonus alone. Here we add the TEAM-based points the live page already
  // shows the user, derived purely from the team names + final score (no per-player
  // attribution needed): goals conceded and penalties conceded hurt the conceding
  // team's GK/DEF, and a clean sheet rewards them. This is what makes lineups
  // differentiate on the devnet feed, and keeps the payout aligned with the live view.
  if (matchCtx && (matchCtx.homeTeam || matchCtx.awayTeam)) {
    // Penalties each team WON (a penalty a team concedes = one the opponent won).
    let homePenWon = 0, awayPenWon = 0;
    for (const ev of events) {
      if (ev.event_type !== 'penalty_won' || !ev.team_name) continue;
      if (ev.team_name === matchCtx.homeTeam) homePenWon++;
      else if (ev.team_name === matchCtx.awayTeam) awayPenWon++;
    }

    // Goals a team CONCEDED = goals the OTHER team scored: home concedes awayGoals.
    const concededBy = (team: string) => team === matchCtx.homeTeam ? matchCtx.awayGoals : matchCtx.homeGoals;
    // Penalties a team conceded = penalties the opponent WON: home concedes awayPenWon.
    const penaltiesConcededBy = (team: string) => team === matchCtx.homeTeam ? awayPenWon : homePenWon;

    for (const p of lineup.players) {
      const known = PLAYER_REGISTRY.get(p.id);
      const team = p.team ?? known?.team;
      const pos = p.position ?? known?.position ?? 'ATT';
      // Only players actually in this fixture participate in conceding/clean-sheet math.
      if (!team || (team !== matchCtx.homeTeam && team !== matchCtx.awayTeam)) continue;
      // Bench players don't concede — mirror the appearance-bonus starter gate.
      if (starterIds && !starterIds.has(p.id)) continue;

      const isCaptain = lineup.captain === p.id;
      const stars = (lineup.confidence ?? {})[p.id] ?? 3;

      const totalAgainst = Math.max(0, concededBy(team));
      const pensAgainst = Math.min(penaltiesConcededBy(team), totalAgainst);
      const nonPenAgainst = Math.max(0, totalAgainst - pensAgainst);

      // goal_conceded: GK/DEF −1 each, applied as one batch × non-penalty goals
      // (matches the live page's full-time retro batching so rounding can't drift).
      if (nonPenAgainst > 0) {
        const gcBase = calculateEventPoints('goal_conceded', pos);
        if (gcBase !== 0) total += resolvePlayerDelta(gcBase * nonPenAgainst, { isCaptain, confidenceStars: stars });
      }
      // penalty_conceded: GK/DEF −3 each, applied once per penalty (as the live page does).
      if (pensAgainst > 0) {
        const pcBase = calculateEventPoints('penalty_conceded', pos);
        if (pcBase !== 0) {
          for (let k = 0; k < pensAgainst; k++) total += resolvePlayerDelta(pcBase, { isCaptain, confidenceStars: stars });
        }
      }
      // clean_sheet: only once the match is over and the team conceded nothing.
      if (matchCtx.final && totalAgainst === 0) {
        const csBase = calculateEventPoints('clean_sheet', pos);
        if (csBase > 0) total += resolvePlayerDelta(csBase, { isCaptain, confidenceStars: stars });
      }
    }
  }

  return Math.round(total * 100) / 100;
}
