// TxLINE Bridge — OddsDraft
// Resolves TxLINE fixture IDs, maps player IDs, and converts raw API events
// into the internal event format used by the live page.

import axios from 'axios';
import { getPlayerById } from './players';
import { WC2026_PLAYERS } from './wc2026-players-static';
import { mapEventToFantasyType } from './txodds';

const IS_PROD_TXLINE =
  process.env.NEXT_PUBLIC_TXLINE_ENV === 'production' ||
  process.env.NEXT_PUBLIC_SOLANA_NETWORK !== 'devnet';

// Browser calls go through our proxy to avoid CORS; server-side calls go direct
const TXLINE_API_BASE = typeof window !== 'undefined'
  ? '/api/txline'
  : IS_PROD_TXLINE ? 'https://txline.txodds.com' : 'https://txline-dev.txodds.com';

// ── TxLINE API types ─────────────────────────────────────────────────────────

export interface TxLineFixture {
  FixtureId: string | number;
  Participant1: string;
  Participant2: string;
  // For neutral venues (e.g. WC2026), this indicates feed home designation, not actual venue
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
  Participant?: number; // 1 = home, 2 = away
  TeamId?: number | string;
  Starter?: boolean;
  Position?: string;
  JerseyNumber?: number;
}

export interface TxLineRawEvent {
  type: string;
  minute: number;
  period: string;
  participant: number; // 1 = home, 2 = away
  playerId?: string | number;
  playerName?: string;
  assistPlayerId?: string | number;
  assistPlayerName?: string;
  goalType?: string; // 'Head' | 'Shot' | 'OwnGoal' | 'Other'
}

export interface TxLineScoreUpdate {
  seq?: number;
  ts?: number;
  fixtureId?: string;
  gameState?: string;  // 'FirstHalf' | 'SecondHalf' | 'HalfTime' | 'ExtraTime' | 'Penalties' | 'FullTime'
  score?: { home: number; away: number };
  events?: TxLineRawEvent[];
}

// ── Converted event (matches LIVE_EVENTS shape in live/replay pages) ─────────

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
  playerOut?: string;     // substitution: player going OFF (player = player coming ON)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Normalize for fuzzy matching: lowercase, remove accents and punctuation
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Base points by event type (mirrors POINT_MAP + calculateEventPoints defaults)
const BASE_POINTS: Record<string, number> = {
  goal: 10, own_goal: -6, assist: 6,
  goalkeeper_save: 1, penalty_save: 5,
  yellow_card: -2, red_card: -5,
  penalty_won: 3, penalty_conceded: -3,
  penalty_missed: -3, penalty_scored: 5,
  penalty_missed_shootout: -3,
  sub_appearance: 1, starting_xi: 2, extra_time: 2,
  goal_conceded: -2, substitution: 0, corner_kick: 0,
  var_review: 0, danger_attack: 0, possession_bonus: 1,
};

// ── 1. Fixture resolution ────────────────────────────────────────────────────

// Fetches the TxLINE fixture list and finds the one matching homeTeam/awayTeam.
// Returns the TxLINE FixtureId string, or null if not found / API error.
// Endpoint: GET /api/fixtures/snapshot
// Response: Array of { FixtureId, Participant1, Participant2, Participant1IsHome, StartTime }
export async function resolveTxLineFixtureId(
  apiToken: string,
  homeTeam: string,
  awayTeam: string,
  guestJwt?: string | null
): Promise<string | null> {
  const headers: Record<string, string> = { 'X-Api-Token': apiToken };
  if (guestJwt) headers['Authorization'] = `Bearer ${guestJwt}`;
  try {
    const res = await axios.get(`${TXLINE_API_BASE}/api/fixtures/snapshot`, {
      headers,
      timeout: 15000,
    });

    const fixtures: TxLineFixture[] = Array.isArray(res.data) ? res.data : (res.data?.fixtures ?? []);
    const normHome = norm(homeTeam);
    const normAway = norm(awayTeam);

    const match = fixtures.find(f => {
      // Participant1IsHome tells us which participant is designated home in the feed
      const isP1Home = f.Participant1IsHome !== false; // default true if not specified
      const feedHome = isP1Home ? f.Participant1 : f.Participant2;
      const feedAway = isP1Home ? f.Participant2 : f.Participant1;
      const p1 = norm(feedHome);
      const p2 = norm(feedAway);
      const homeMatch = p1.includes(normHome) || normHome.includes(p1) || p1.includes(normHome.split(' ')[0]);
      const awayMatch = p2.includes(normAway) || normAway.includes(p2) || p2.includes(normAway.split(' ')[0]);
      return homeMatch && awayMatch;
    });

    if (!match) {
      console.warn(`[TxLineBridge] No fixture found for ${homeTeam} vs ${awayTeam} in ${fixtures.length} fixtures`);
    }
    return match ? String(match.FixtureId) : null;
  } catch (err) {
    console.error('[TxLineBridge] resolveTxLineFixtureId error:', err);
    return null;
  }
}

// ── 2. Player ID mapping ─────────────────────────────────────────────────────

// Try to match a player name (TxLINE or ESPN) to one of our internal player IDs.
// Strategy: exact match → last-name match → substring match.
export function matchPlayerName(txlineName: string, teamName: string): string | null {
  const normTx = norm(txlineName);
  const candidates = WC2026_PLAYERS.filter(
    p => norm(p.team) === norm(teamName) || norm(p.team).includes(norm(teamName)) || norm(teamName).includes(norm(p.team))
  );

  // 1. Exact full name
  let hit = candidates.find(p => norm(p.name) === normTx);
  if (hit) return hit.id;

  // 2. Last name match (>3 chars to avoid false positives)
  // When multiple players share a last name, try first-initial to disambiguate.
  const txParts = normTx.split(' ');
  const txLast = txParts[txParts.length - 1] ?? normTx;
  const txFirstInitial = txParts[0]?.replace(/\./g, '') ?? '';
  if (txLast.length > 3) {
    const lastMatches = candidates.filter(p => {
      const ourLast = norm(p.name).split(' ').pop() ?? '';
      return ourLast === txLast;
    });
    if (lastMatches.length === 1) {
      return lastMatches[0].id;
    } else if (lastMatches.length > 1 && txFirstInitial.length >= 1) {
      // Disambiguate by first initial (handles "L. Martinez" vs "E. Martinez")
      const byInitial = lastMatches.find(p => {
        const ourFirst = norm(p.name).split(' ')[0] ?? '';
        return ourFirst.startsWith(txFirstInitial[0]) || txFirstInitial.startsWith(ourFirst[0]);
      });
      if (byInitial) return byInitial.id;
      // Ambiguous — don't guess, return null to avoid wrong mapping
      return null;
    }
  }

  // 3. Any token overlap (only for unambiguous matches)
  const txTokens = txParts.filter(t => t.length > 3);
  const tokenMatches = candidates.filter(p => {
    const ourTokens = norm(p.name).split(' ');
    return txTokens.some(t => ourTokens.includes(t));
  });
  if (tokenMatches.length === 1) return tokenMatches[0].id;
  return null;
}

// Fetch TxLINE lineups for a fixture and return txlinePlayerId → our internal ID.
// Tries /api/fixtures/lineups/{id} first; falls back to score snapshot for player names.
export async function buildPlayerIdMap(
  apiToken: string,
  txlineFixtureId: string,
  homeTeam: string,
  awayTeam: string,
  guestJwt?: string | null
): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'X-Api-Token': apiToken };
  if (guestJwt) headers['Authorization'] = `Bearer ${guestJwt}`;

  // Try lineups endpoint (may or may not exist depending on tier/timing)
  const lineupEndpoints = [
    `${TXLINE_API_BASE}/api/fixtures/lineups/${txlineFixtureId}`,
    `${TXLINE_API_BASE}/api/soccer/v2/lineups/${txlineFixtureId}`,
  ];

  for (const endpoint of lineupEndpoints) {
    try {
      const res = await axios.get(endpoint, { headers, timeout: 10000 });
      // TxLINE may return { lineups: [...] } or a flat array
      const players: TxLineLineupPlayer[] = Array.isArray(res.data)
        ? res.data
        : (res.data?.lineups ?? res.data?.players ?? []);

      if (players.length === 0) continue;

      const map: Record<string, string> = {};
      for (const p of players) {
        if (!p.PlayerId || !p.PlayerName) continue;
        const teamName = p.Participant === 1 ? homeTeam : awayTeam;
        const ourId = matchPlayerName(p.PlayerName, teamName);
        if (ourId) map[String(p.PlayerId)] = ourId;
      }
      if (Object.keys(map).length > 0) {
        console.log(`[TxLineBridge] buildPlayerIdMap: ${Object.keys(map).length} players from ${endpoint}`);
        return map;
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status !== 404 && status !== 403) {
        console.warn('[TxLineBridge] buildPlayerIdMap error at', endpoint, ':', status ?? err?.message);
      }
    }
  }

  // Lineup endpoints unavailable — build map from score snapshot
  try {
    const snapRes = await axios.get(`${TXLINE_API_BASE}/api/scores/snapshot/${txlineFixtureId}`, { headers, timeout: 10000 });
    const updates = Array.isArray(snapRes.data) ? snapRes.data : (snapRes.data ? [snapRes.data] : []);
    const map: Record<string, string> = {};

    for (const update of updates) {
      const action = (update.Action ?? update.action ?? '').toLowerCase();

      // ── TxLINE format: lineups action has Lineups[] with nested player arrays ──
      if (action === 'lineups') {
        const teamsArr: any[] = update.Lineups ?? update.lineups ?? [];
        teamsArr.forEach((teamData: any, idx: number) => {
          // Index 0 = Participant1 (home), 1 = Participant2 (away)
          const teamName = idx === 0 ? homeTeam : awayTeam;
          const playerArr: any[] = teamData.lineups ?? teamData.Lineups ?? [];
          for (const p of playerArr) {
            const fixturePlayerId = String(p.fixturePlayerId ?? '');
            const normativeId = String(p.player?.normativeId ?? '');
            // TxLINE name format: "LastName, FirstName" → convert to "FirstName LastName"
            const rawName: string = p.player?.preferredName ?? p.preferredName ?? '';
            const name = rawName.includes(',')
              ? rawName.split(',').map((s: string) => s.trim()).reverse().join(' ')
              : rawName;
            if (!name) continue;
            const ourId = matchPlayerName(name, teamName);
            if (ourId) {
              if (fixturePlayerId) map[fixturePlayerId] = ourId;
              if (normativeId && normativeId !== fixturePlayerId) map[normativeId] = ourId;
            }
          }
        });
        if (Object.keys(map).length > 0) {
          console.log(`[TxLineBridge] buildPlayerIdMap: ${Object.keys(map).length} players from snapshot lineups action`);
          return map;
        }
        continue;
      }

      // ── TxODDS legacy format: events/Events/Incidents array ──
      const events = update.events ?? update.Events ?? update.Incidents ?? update.incidents ?? [];
      for (const e of events) {
        const pid = String(e.playerId ?? e.PlayerId ?? '');
        const pName = e.playerName ?? e.PlayerName ?? '';
        const participant = e.participant ?? e.Participant ?? e.Team ?? e.team ?? 1;
        if (!pid || !pName || map[pid]) continue;
        const teamName = participant === 1 ? homeTeam : awayTeam;
        const ourId = matchPlayerName(pName, teamName);
        if (ourId) map[pid] = ourId;
      }

      // ── TxLINE format: PlayerId may be in Data field of goal/card events ──
      const data = update.Data?.New ?? update.Data ?? {};
      const participant = data.Participant ?? update.Participant ?? 1;
      const teamName = participant === 2 ? awayTeam : homeTeam;

      const pid = String(data.PlayerId ?? data.Player1Id ?? '');
      const pName = data.PlayerName ?? '';
      if (pid && pName && !map[pid]) {
        const ourId = matchPlayerName(pName, teamName);
        if (ourId) map[pid] = ourId;
      }

      // Substitution events use PlayerOut/PlayerIn (with or without "Id" suffix)
      const outId = String(data.PlayerOutId ?? data.PlayerOut ?? data.Player1Id ?? '');
      const outName = data.PlayerOutName ?? data.Player1Name ?? '';
      if (outId && outName && !map[outId]) {
        const ourId = matchPlayerName(outName, teamName);
        if (ourId) map[outId] = ourId;
      }
      const inId = String(data.PlayerInId ?? data.PlayerIn ?? data.Player2Id ?? '');
      const inName = data.PlayerInName ?? data.Player2Name ?? '';
      if (inId && inName && !map[inId]) {
        const ourId = matchPlayerName(inName, teamName);
        if (ourId) map[inId] = ourId;
      }
    }

    console.log(`[TxLineBridge] buildPlayerIdMap: ${Object.keys(map).length} players from score snapshot`);
    return map;
  } catch {
    return {};
  }
}

// ── 3. Event conversion ──────────────────────────────────────────────────────

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
    case 'substitution':            return player ? `${m} Substitution — ${team}` : `${m} Substitution — ${team}`;
    case 'sub_appearance':          return `${m} ${player} enters the pitch for ${team}`;
    case 'corner_kick':             return `${m} Corner kick for ${team}`;
    case 'var_review':              return `${m} VAR Review in progress`;
    case 'extra_time':              return `${m} Extra time begins!`;
    case 'goal_conceded':           return `${m} Goal conceded by ${player} (${team})`;
    case 'danger_attack':           return `${m} ${team} in the DANGER zone!`;
    case 'kick_off':                return `${m} Kick off!`;
    case 'half_time':               return `${m} Half time!`;
    case 'full_time':               return `${m} Full time!`;
    case 'starting_xi':             return `${player} starts for ${team}`;
    default:                        return `${m} ${player} — ${type} (${team})`;
  }
}

// Convert raw TxLINE score updates into LiveEvents.
// seenSeqs: Set of sequence numbers already processed — updated in-place to deduplicate.
export function convertTxLineUpdates(
  updates: TxLineScoreUpdate[],
  playerIdMap: Record<string, string>,
  homeTeam: string,
  awayTeam: string,
  homeFlag: string,
  awayFlag: string,
  seenSeqs: Set<number>
): LiveEvent[] {
  const result: LiveEvent[] = [];

  for (const update of updates) {
    // Deduplicate by sequence number
    if (update.seq !== undefined) {
      if (seenSeqs.has(update.seq)) continue;
      seenSeqs.add(update.seq);
    }

    const gameState = update.gameState;
    const rawEvents = update.events ?? [];

    // Synthesize gameState-level events (extra_time, etc.)
    if (gameState === 'ExtraTime') {
      result.push({
        id: `gs-et-${update.seq ?? Date.now()}`,
        minute: 90,
        team: '', teamFlag: '', player: '',
        playerId: '', type: 'extra_time', points: 2,
        description: "Extra time begins!",
      });
    }

    for (const raw of rawEvents) {
      // Map to our fantasy event type
      const fantasyType = mapEventToFantasyType(
        {
          type: raw.type,
          minute: raw.minute,
          period: raw.period,
          participant: raw.participant,
          playerId: String(raw.playerId ?? ''),
          playerName: raw.playerName,
          assistPlayerId: String(raw.assistPlayerId ?? ''),
          assistPlayerName: raw.assistPlayerName,
        },
        gameState
      );

      if (!fantasyType) continue;

      const txPlayerId = String(raw.playerId ?? '');
      const ourPlayerId = playerIdMap[txPlayerId] ?? '';
      const playerInfo = ourPlayerId ? getPlayerById(ourPlayerId) : null;

      // Determine team: TxLINE often omits Participant on goal/card events.
      // Fall back to player's known team from our database.
      const isHome = (() => {
        if (raw.participant === 1) return true;
        if (raw.participant === 2) return false;
        if (playerInfo?.team === homeTeam) return true;
        if (playerInfo?.team === awayTeam) return false;
        return true; // last-resort default
      })();
      const team = isHome ? homeTeam : awayTeam;
      const teamFlag = isHome ? homeFlag : awayFlag;

      // Events that don't need an individual player name — show empty string not 'Unknown'
      const isTeamAction = fantasyType === 'corner_kick' || fantasyType === 'var_review'
        || fantasyType === 'kick_off' || fantasyType === 'half_time' || fantasyType === 'full_time'
        || fantasyType === 'substitution' || fantasyType === 'sub_appearance';
      const player = raw.playerName
        || (playerInfo?.name ?? '')
        || (isTeamAction ? '' : 'Unknown');

      // Drop nameless 0-point events that ARE expected to have a player (e.g. unattributed goals).
      // Substitutions, corner kicks, and var reviews are valid even without a player name.
      const basePoints = BASE_POINTS[fantasyType] ?? 0;
      const isPlayerExpected = !isTeamAction;
      if (player === 'Unknown' && basePoints === 0 && isPlayerExpected) continue;

      const event: LiveEvent = {
        id: `live-${update.seq ?? Date.now()}-${raw.type}-${raw.minute}-${txPlayerId}`,
        minute: raw.minute,
        team,
        teamFlag,
        player,
        playerId: ourPlayerId,
        type: fantasyType,
        points: BASE_POINTS[fantasyType] ?? 0,
        description: describeEvent(fantasyType, player, team, raw.minute),
      };

      if (raw.goalType) event.goalType = raw.goalType;
      result.push(event);

      // Synthesize a separate assist event when goal has assistPlayerId
      if (
        (fantasyType === 'goal' || fantasyType === 'penalty_scored') &&
        raw.assistPlayerId
      ) {
        const aTxId = String(raw.assistPlayerId);
        const aOurId = playerIdMap[aTxId] ?? '';
        const aName = raw.assistPlayerName
          || (aOurId ? (getPlayerById(aOurId)?.name ?? '') : '')
          || 'Unknown';

        result.push({
          id: `live-assist-${update.seq ?? Date.now()}-${raw.minute}-${aTxId}`,
          minute: raw.minute,
          team,
          teamFlag,
          player: aName,
          playerId: aOurId,
          type: 'assist',
          points: BASE_POINTS['assist'],
          description: describeEvent('assist', aName, team, raw.minute),
        });
      }

      // Synthesize goal_conceded for the opposing goalkeeper
      if (fantasyType === 'goal') {
        const oppTeam = isHome ? awayTeam : homeTeam;
        const oppFlag = isHome ? awayFlag : homeFlag;
        result.push({
          id: `live-concede-${update.seq ?? Date.now()}-${raw.minute}`,
          minute: raw.minute,
          team: oppTeam,
          teamFlag: oppFlag,
          player: '',
          playerId: '',
          type: 'goal_conceded',
          points: BASE_POINTS['goal_conceded'],
          description: describeEvent('goal_conceded', 'Goalkeeper', oppTeam, raw.minute),
        });
      }
    }
  }

  // Merge sub_appearance events into their paired substitution event.
  // substitution.player = player going OUT → becomes playerOut
  // sub_appearance.player = player coming IN → becomes player on the substitution event
  const mergedSubIds = new Set<string>();
  for (const ev of result) {
    if (ev.type === 'substitution') {
      const subIn = result.find(
        e => e.type === 'sub_appearance' && e.minute === ev.minute && e.team === ev.team
      );
      if (subIn) {
        ev.playerOut = ev.player;     // who went OFF
        ev.player = subIn.player;     // who came ON
        ev.description = `${ev.minute}' Substitution — ${ev.team}`;
        mergedSubIds.add(subIn.id);
      }
    }
  }
  // Drop the now-merged sub_appearance events
  return result.filter(e => !mergedSubIds.has(e.id));
}
