// ESPN Bridge — OddsDraft
// Resolves ESPN fixture IDs, maps player IDs, and converts ESPN keyEvents
// into the internal LiveEvent format used by the live page.
// Replaces the old TxLINE Bridge (txline-bridge.ts).

import { getPlayerById } from './players';
import { WC2026_PLAYERS } from './wc2026-players-static';
import { mapEspnEventType, type EspnMatchEvent, type EspnRosterPlayer } from './espn';

// ── Re-export types that cron + live page still import from here ──────────────
export type { EspnMatchEvent as TxLineRawEvent };

// ── TxLINE Bridge compatibility types (still consumed by live page) ───────────
export interface TxLineFixture {
  FixtureId: string | number;
  Participant1: string;
  Participant2: string;
  Participant1IsHome?: boolean;
  StartTime: string;
  CompetitionId?: number;
  CompetitionName?: string;
  Status?: string;
  GameState?: string;
}

export interface TxLineLineupPlayer {
  PlayerId: string | number;
  PlayerName: string;
  Participant?: number;
  TeamId?: number | string;
  Starter?: boolean;
  Position?: string;
  JerseyNumber?: number;
}

export interface TxLineScoreUpdate {
  seq?: number;
  ts?: number;
  fixtureId?: string;
  gameState?: string;
  score?: { home: number; away: number };
  events?: EspnMatchEvent[];
}

// ── Converted event shape (matches LIVE_EVENTS in live page) ─────────────────
export interface LiveEvent {
  id: string;
  minute: number;
  team: string;
  teamFlag: string;
  player: string;
  playerId: string;       // our internal ID (e.g. 'arg-messi')
  type: string;           // our internal event type
  points: number;
  description: string;
  goalType?: string;
  playerOut?: string;     // substitution: player going OFF
}

// ── Base points ───────────────────────────────────────────────────────────────
const BASE_POINTS: Record<string, number> = {
  goal: 10, own_goal: -6, assist: 6,
  goalkeeper_save: 1, penalty_save: 5,
  yellow_card: -2, red_card: -5,
  penalty_won: 8, penalty_conceded: -3,
  penalty_missed: -3, penalty_scored: 5,
  penalty_missed_shootout: -3,
  sub_appearance: 1, starting_xi: 2, extra_time: 2,
  goal_conceded: -2, substitution: 0, corner_kick: 0,
  var_review: 0, danger_attack: 0, possession_bonus: 1,
  shot: 0, shot_on_target: 0, free_kick: 0, offside: 0, injury: 0,
};

// ── Normalize for fuzzy matching ─────────────────────────────────────────────
export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Player name matching (unchanged from old txline-bridge) ───────────────────
export function matchPlayerName(espnName: string, teamName: string): string | null {
  const normEspn = norm(espnName);
  const candidates = WC2026_PLAYERS.filter(
    p => norm(p.team) === norm(teamName) || norm(p.team).includes(norm(teamName)) || norm(teamName).includes(norm(p.team))
  );

  // 1. Exact full name
  let hit = candidates.find(p => norm(p.name) === normEspn);
  if (hit) return hit.id;

  const espnParts = normEspn.split(' ');

  // 1b. Compound surname trim
  if (espnParts.length > 2) {
    for (let len = espnParts.length - 1; len >= 2; len--) {
      const shorter = espnParts.slice(0, len).join(' ');
      const shortHit = candidates.find(p => norm(p.name) === shorter);
      if (shortHit) return shortHit.id;
    }
  }

  // 2. Last name match
  const espnLast = espnParts[espnParts.length - 1] ?? normEspn;
  const espnFirstInitial = espnParts[0]?.replace(/\./g, '') ?? '';
  if (espnLast.length > 3) {
    const lastMatches = candidates.filter(p => {
      const ourLast = norm(p.name).split(' ').pop() ?? '';
      return ourLast === espnLast;
    });
    if (lastMatches.length === 1) return lastMatches[0].id;
    else if (lastMatches.length > 1 && espnFirstInitial.length >= 1) {
      const byInitial = lastMatches.find(p => {
        const ourFirst = norm(p.name).split(' ')[0] ?? '';
        return ourFirst.startsWith(espnFirstInitial[0]) || espnFirstInitial.startsWith(ourFirst[0]);
      });
      if (byInitial) return byInitial.id;
      return null;
    }
  }

  // 3. Token overlap
  const espnTokens = espnParts.filter(t => t.length > 3);
  const tokenMatches = candidates.filter(p => {
    const ourTokens = norm(p.name).split(' ');
    return espnTokens.some(t => ourTokens.includes(t));
  });
  if (tokenMatches.length === 1) return tokenMatches[0].id;
  return null;
}

// ── Build player ID map from ESPN rosters ─────────────────────────────────────
export function buildEspnPlayerIdMapFromRosters(
  rosters: EspnRosterPlayer[],
  homeTeam: string,
  awayTeam: string,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const player of rosters) {
    if (!player.athleteId || !player.displayName) continue;
    const teamName = player.homeAway === 'home' ? homeTeam : awayTeam;
    const ourId = matchPlayerName(player.displayName, teamName);
    if (ourId) map[player.athleteId] = ourId;
  }
  return map;
}

// ── Backward compat: buildPlayerIdMap (called by cron/live page) ──────────────
// Now delegates to ESPN summary roster instead of TxLINE lineup endpoint.
export async function buildPlayerIdMap(
  _apiToken: string,   // ignored — ESPN needs no auth
  espnEventId: string,
  homeTeam: string,
  awayTeam: string,
  leagueSlug = 'eng.1',
): Promise<Record<string, string>> {
  try {
    const { fetchEspnMatchSummary } = await import('./espn');
    const summary = await fetchEspnMatchSummary(leagueSlug, espnEventId);
    if (!summary) return {};
    return buildEspnPlayerIdMapFromRosters(summary.rosters, homeTeam, awayTeam);
  } catch {
    return {};
  }
}

// ── Backward compat: resolveTxLineFixtureId → resolveEspnFixtureId ────────────
export async function resolveTxLineFixtureId(
  _apiToken: string,
  homeTeam: string,
  awayTeam: string,
  leagueSlug = 'eng.1',
  kickoffISO?: string,
): Promise<string | null> {
  try {
    const { resolveEspnEventId } = await import('./espn');
    return resolveEspnEventId(leagueSlug, homeTeam, awayTeam, kickoffISO ?? new Date().toISOString());
  } catch {
    return null;
  }
}

// ── Event description generator ───────────────────────────────────────────────
function describeEvent(type: string, player: string, team: string, minute: number): string {
  const m = `${minute}'`;
  switch (type) {
    case 'goal':                    return `${m} GOAL! ${player} scores for ${team}!`;
    case 'own_goal':                return `${m} Own goal by ${player} (${team})`;
    case 'assist':                  return `${m} Assist from ${player} (${team})`;
    case 'goalkeeper_save':         return `${m} Save by ${player} (${team})!`;
    case 'penalty_save':            return `${m} PENALTY SAVED by ${player}!`;
    case 'yellow_card':             return `${m} Yellow card — ${player} (${team})`;
    case 'red_card':                return `${m} RED CARD — ${player} (${team})!`;
    case 'penalty_won':             return `${m} Penalty won by ${player} (${team})`;
    case 'penalty_missed':          return `${m} Penalty missed by ${player} (${team})`;
    case 'penalty_scored':          return `${m} ${player} scores in the shootout!`;
    case 'penalty_missed_shootout': return `${m} ${player} misses in the shootout!`;
    case 'substitution':            return `${m} Substitution — ${team}`;
    case 'sub_appearance':          return `${m} ${player} enters the pitch for ${team}`;
    case 'corner_kick':             return `${m} Corner kick for ${team}`;
    case 'var_review':              return `${m} VAR Review in progress`;
    case 'extra_time':              return `${m} Extra time begins!`;
    case 'goal_conceded':           return `${m} Goal conceded by ${player} (${team})`;
    case 'kick_off':                return `${m} Kick off!`;
    case 'half_time':               return `${m} Half time!`;
    case 'full_time':               return `${m} Full time!`;
    case 'starting_xi':             return `${player} starts for ${team}`;
    case 'shot':                    return player ? `${m} Shot by ${player} (${team})` : `${m} Shot — ${team}`;
    case 'free_kick':               return player ? `${m} Free kick — ${player} (${team})` : `${m} Free kick — ${team}`;
    case 'offside':                 return player ? `${m} Offside — ${player} (${team})` : `${m} Offside — ${team}`;
    case 'injury':                  return `${m} ${player} is down injured (${team})`;
    default:                        return `${m} ${player} — ${type} (${team})`;
  }
}

// ── Convert ESPN keyEvents → LiveEvent[] ──────────────────────────────────────
// homeTeamId / awayTeamId are ESPN team IDs used to determine which team an event belongs to.
export function convertEspnEvents(
  espnEvents: EspnMatchEvent[],
  playerIdMap: Record<string, string>,
  homeTeam: string,
  awayTeam: string,
  homeTeamId: string,
  awayTeamId: string,
  homeFlag: string,
  awayFlag: string,
  seenIds: Set<string>,
): LiveEvent[] {
  const result: LiveEvent[] = [];

  for (const ev of espnEvents) {
    if (seenIds.has(ev.id)) continue;
    seenIds.add(ev.id);

    const fantasyType = mapEspnEventType(ev.type, undefined, ev.shootout);
    if (!fantasyType) continue;

    // Determine team from ESPN teamId
    const isHome = ev.teamId === homeTeamId ||
      (ev.teamId === '' && ev.teamName === homeTeam) ||
      (ev.teamName === homeTeam);
    const team = isHome ? homeTeam : awayTeam;
    const teamFlag = isHome ? homeFlag : awayFlag;

    // Primary participant = scorer/player
    const primary = ev.participants[0];
    const secondParticipant = ev.participants[1]; // assist or player coming on

    const espnPlayerId = primary?.athleteId ?? '';
    const ourPlayerId  = playerIdMap[espnPlayerId] ?? '';
    const playerInfo   = ourPlayerId ? getPlayerById(ourPlayerId) : null;
    const player       = primary?.displayName
      || (playerInfo?.name ?? '')
      || '';

    const isTeamAction = ['corner_kick', 'var_review', 'kick_off', 'half_time', 'full_time',
      'substitution', 'free_kick', 'offside'].includes(fantasyType);
    const basePoints = BASE_POINTS[fantasyType] ?? 0;

    // Compute minute from clock seconds
    const minute = ev.period === 1
      ? Math.floor(ev.clockSeconds / 60)
      : ev.period === 2
        ? 45 + Math.floor(Math.max(0, ev.clockSeconds - 2700) / 60)
        : Math.floor(ev.clockSeconds / 60);

    const event: LiveEvent = {
      id: `espn-${ev.id}`,
      minute: Math.max(0, minute),
      team,
      teamFlag,
      player: player || (isTeamAction ? '' : ''),
      playerId: ourPlayerId,
      type: fantasyType,
      points: basePoints,
      description: describeEvent(fantasyType, player, team, Math.max(0, minute)),
    };
    result.push(event);

    // Synthesize assist event for goals
    if ((fantasyType === 'goal' || fantasyType === 'penalty_scored') && secondParticipant) {
      const aEspnId = secondParticipant.athleteId;
      const aOurId  = playerIdMap[aEspnId] ?? '';
      const aName   = secondParticipant.displayName || (aOurId ? (getPlayerById(aOurId)?.name ?? '') : '') || 'Unknown';
      result.push({
        id: `espn-assist-${ev.id}`,
        minute: event.minute,
        team, teamFlag,
        player: aName,
        playerId: aOurId,
        type: 'assist',
        points: BASE_POINTS['assist'],
        description: describeEvent('assist', aName, team, event.minute),
      });
    }

    // Synthesize goal_conceded for opposing team on regular goals
    if (fantasyType === 'goal') {
      const oppTeam = isHome ? awayTeam : homeTeam;
      const oppFlag = isHome ? awayFlag : homeFlag;
      result.push({
        id: `espn-concede-${ev.id}`,
        minute: event.minute,
        team: oppTeam, teamFlag: oppFlag,
        player: '', playerId: '',
        type: 'goal_conceded',
        points: BASE_POINTS['goal_conceded'],
        description: describeEvent('goal_conceded', 'Goalkeeper', oppTeam, event.minute),
      });
    }

    // Synthesize goal_conceded for own goals (the own-goal team concedes on the scoreboard)
    if (fantasyType === 'own_goal') {
      result.push({
        id: `espn-concede-og-${ev.id}`,
        minute: event.minute,
        team, teamFlag,
        player: '', playerId: '',
        type: 'goal_conceded',
        points: BASE_POINTS['goal_conceded'],
        description: describeEvent('goal_conceded', 'Goalkeeper', team, event.minute),
      });
    }

    // Handle substitution — participants[0]=playerIn, participants[1]=playerOut
    if (fantasyType === 'substitution' && secondParticipant) {
      event.playerOut = secondParticipant.displayName || 'Unknown';
      event.description = `${event.minute}' Substitution — ${team}`;
    }
  }

  return result;
}

// ── Backward compat: convertTxLineUpdates (live page still calls this) ─────────
// The live page will be updated to call convertEspnEvents directly, but during
// the transition period this stub prevents compile errors.
export function convertTxLineUpdates(
  _updates: TxLineScoreUpdate[],
  _playerIdMap: Record<string, string>,
  _homeTeam: string,
  _awayTeam: string,
  _homeFlag: string,
  _awayFlag: string,
  _seenSeqs: Set<number>,
  _txPlayerNames: Record<string, string> = {},
): LiveEvent[] {
  console.warn('[ESPN Bridge] convertTxLineUpdates called — migrate to convertEspnEvents');
  return [];
}
