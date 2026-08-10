// ESPN API Client — OddsDraft
// Full replacement for TxLINE. Uses the free, no-auth ESPN undocumented API.
// Endpoints:
//   Scoreboard : https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/scoreboard?dates=YYYYMMDD&limit=50
//   Summary    : https://site.web.api.espn.com/apis/site/v2/sports/soccer/{league}/summary?event={id}
//
// No API key required. Rate-limit respectfully — always cache responses.

import { matchPlayerName } from './espn-bridge';

// ── ESPN base URLs ────────────────────────────────────────────────────────────
export const ESPN_SCOREBOARD_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
export const ESPN_SUMMARY_BASE    = 'https://site.web.api.espn.com/apis/site/v2/sports/soccer';

const ESPN_HEADERS = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' };

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EspnFixture {
  espnId: string;           // ESPN event ID (e.g. "401879301")
  leagueId: string;         // Our internal league ID (e.g. "eng.1")
  homeTeam: string;
  awayTeam: string;
  homeTeamId: string;       // ESPN team ID
  awayTeamId: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  kickoffAt: string;        // ISO 8601
  statusState: 'pre' | 'in' | 'post'; // pre=scheduled, in=live, post=finished
  statusDescription: string;           // "Scheduled" | "In Progress" | "Full Time" etc.
  completed: boolean;
  clockDisplay: string;     // "45'" or "HT" or ""
  period: number;           // 1 or 2
}

export interface EspnMatchEvent {
  id: string;
  type: string;             // 'goal' | 'yellow-card' | 'red-card' | 'substitution' | etc.
  text: string;             // Full description
  shortText: string;
  period: number;
  clockSeconds: number;     // seconds into period
  clockDisplay: string;     // "22'"
  scoringPlay: boolean;
  teamId: string;
  teamName: string;
  participants: { athleteId: string; displayName: string }[];
  shootout: boolean;
}

export interface EspnRosterPlayer {
  athleteId: string;
  displayName: string;
  lastName: string;
  starter: boolean;
  jersey: string;
  homeAway: 'home' | 'away';
  teamName: string;
}

export interface EspnMatchStatus {
  completed: boolean;
  scoreHome: number;
  scoreAway: number;
}

export interface EspnBoxscoreTeam {
  teamId: string;
  possession: string;
  shots: string;
  shotsOnTarget: string;
  fouls: string;
  yellowCards: string;
  redCards: string;
  offsides: string;
  cornerKicks: string;
  saves: string;
}

export interface EspnOdds {
  provider: string;
  homeMoneyline: string;
  awayMoneyline: string;
  drawMoneyline: string;
  overUnder: string;
  overOdds: string;
  underOdds: string;
}

export interface EspnFormEvent {
  id: string;
  date: string;
  result: string; // 'W', 'L', 'D'
  score: string;
  opponentName: string;
  opponentLogo: string;
}

export interface EspnForm {
  teamId: string;
  events: EspnFormEvent[];
}

export interface EspnSummary {
  boxscore: { home: EspnBoxscoreTeam; away: EspnBoxscoreTeam } | null;
  odds: EspnOdds | null;
  form: { home: EspnForm; away: EspnForm } | null;
}

// ── Team name aliases: ESPN → our canonical name ──────────────────────────────
const ESPN_TEAM_ALIASES: Record<string, string> = {
  // World Cup
  "côte d'ivoire": 'Ivory Coast', "cote d'ivoire": 'Ivory Coast',
  'cote divoire': 'Ivory Coast', 'dem. rep. congo': 'Congo DR',
  'dr congo': 'Congo DR', 'democratic republic of congo': 'Congo DR',
  'republic of korea': 'South Korea', 'korea republic': 'South Korea',
  'united states': 'USA', 'czechia': 'Czech Republic',
  'cape verde islands': 'Cape Verde',
  'bosnia and herzegovina': 'Bosnia & Herzegovina',
  'bosnia & hercegovina': 'Bosnia & Herzegovina',
  // Club teams common variations
  'man city': 'Manchester City', 'manchester city': 'Manchester City',
  'man utd': 'Manchester United', 'manchester united': 'Manchester United',
  'man united': 'Manchester United',
  'spurs': 'Tottenham Hotspur', 'tottenham': 'Tottenham Hotspur',
  'inter': 'Internazionale', 'inter milan': 'Internazionale',
  'ac milan': 'AC Milan',
  'paris saint-germain': 'PSG', 'paris sg': 'PSG',
};

export function resolveTeamName(name: string): string {
  return ESPN_TEAM_ALIASES[name.toLowerCase().trim()] ?? name;
}

function normStr(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

function dateStr(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

// ── 1. Parse scoreboard event → EspnFixture ──────────────────────────────────
function parseScoreboardEvent(ev: any, leagueId: string): EspnFixture | null {
  const comp = ev.competitions?.[0];
  if (!comp) return null;

  const homeComp = comp.competitors?.find((c: any) => c.homeAway === 'home');
  const awayComp = comp.competitors?.find((c: any) => c.homeAway === 'away');
  if (!homeComp || !awayComp) return null;

  const status = comp.status?.type ?? {};
  const statusState: EspnFixture['statusState'] =
    status.state === 'in' ? 'in' : status.state === 'post' ? 'post' : 'pre';

  const sh = parseInt(homeComp.score ?? '', 10);
  const sa = parseInt(awayComp.score ?? '', 10);

  return {
    espnId: String(ev.id ?? ''),
    leagueId,
    homeTeam: resolveTeamName(homeComp.team?.displayName ?? ''),
    awayTeam: resolveTeamName(awayComp.team?.displayName ?? ''),
    homeTeamId: String(homeComp.team?.id ?? ''),
    awayTeamId: String(awayComp.team?.id ?? ''),
    homeLogo: homeComp.team?.logo ?? homeComp.team?.logos?.[0]?.href ?? '',
    awayLogo: awayComp.team?.logo ?? awayComp.team?.logos?.[0]?.href ?? '',
    homeScore: isNaN(sh) ? null : sh,
    awayScore: isNaN(sa) ? null : sa,
    kickoffAt: ev.date ?? comp.date ?? '',
    statusState,
    statusDescription: status.description ?? status.name ?? '',
    completed: !!status.completed,
    clockDisplay: comp.status?.displayClock ?? '',
    period: comp.status?.period ?? 0,
  };
}

// ── 2. Fetch all fixtures for a league on given dates ─────────────────────────
// dateRange: string like "20260804-20260904" (start-end) or "20260804"
export async function fetchEspnFixtures(
  leagueSlug: string,
  dateRange: string = '',
  leagueId?: string,
): Promise<EspnFixture[]> {
  const lid = leagueId ?? leagueSlug;
  const result: EspnFixture[] = [];
  const targetDates = dateRange || dateStr(Date.now());

  try {
    const url = `${ESPN_SCOREBOARD_BASE}/${leagueSlug}/scoreboard?dates=${targetDates}&limit=500`;
    const res = await fetch(url, { headers: ESPN_HEADERS, cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const events: any[] = data.events ?? [];
      for (const ev of events) {
        const fixture = parseScoreboardEvent(ev, lid);
        if (fixture) result.push(fixture);
      }
    }
  } catch (err) {
    console.warn(`[fetchEspnFixtures] Failed for ${leagueSlug}:`, err);
  }

  return result;
}

// ── 3. Fetch live fixtures for a league ───────────────────────────────────────
export async function fetchEspnLiveFixtures(leagueSlug: string, leagueId?: string): Promise<EspnFixture[]> {
  const all = await fetchEspnFixtures(leagueSlug, '', leagueId);
  return all.filter(f => f.statusState === 'in');
}

// ── 4. Fetch fixtures across all tracked leagues for today ────────────────────
export async function fetchAllLeaguesFixtures(
  leagueSlugs: string[],
  dateRange: string = '',
): Promise<EspnFixture[]> {
  const results = await Promise.allSettled(
    leagueSlugs.map(slug => fetchEspnFixtures(slug, dateRange, slug))
  );
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
}

// ── 5. Fetch match summary (events + rosters) for a specific event ────────────
export async function fetchEspnMatchSummary(leagueSlug: string, eventId: string): Promise<{
  events: EspnMatchEvent[];
  rosters: EspnRosterPlayer[];
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  completed: boolean;
  statusState: 'pre' | 'in' | 'post';
  clockDisplay: string;
  boxscore: { home: EspnBoxscoreTeam; away: EspnBoxscoreTeam } | null;
  odds: EspnOdds | null;
  form: { home: EspnForm; away: EspnForm } | null;
} | null> {
  if (!eventId) return null;
  try {
    const url = `${ESPN_SUMMARY_BASE}/${leagueSlug}/summary?event=${eventId}`;
    const res = await fetch(url, { headers: ESPN_HEADERS, cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();

    // ── Parse header for score + status ──
    const hdrComp = data.header?.competitions?.[0];
    const hdrHome = hdrComp?.competitors?.find((c: any) => c.homeAway === 'home');
    const hdrAway = hdrComp?.competitors?.find((c: any) => c.homeAway === 'away');
    const status = hdrComp?.status?.type ?? {};
    const sh = parseInt(hdrHome?.score ?? hdrHome?.team?.score ?? '', 10);
    const sa = parseInt(hdrAway?.score ?? hdrAway?.team?.score ?? '', 10);
    const statusState: 'pre' | 'in' | 'post' =
      status.state === 'in' ? 'in' : status.state === 'post' ? 'post' : 'pre';

    // ── Parse keyEvents ──
    const rawEvents: any[] = data.keyEvents ?? [];
    const events: EspnMatchEvent[] = rawEvents.map((ev: any) => ({
      id: String(ev.id ?? ''),
      type: ev.type?.type ?? '',
      text: ev.text ?? '',
      shortText: ev.shortText ?? '',
      period: ev.period?.number ?? 0,
      clockSeconds: typeof ev.clock?.value === 'number' ? ev.clock.value : 0,
      clockDisplay: ev.clock?.displayValue ?? '',
      scoringPlay: !!ev.scoringPlay,
      teamId: String(ev.team?.id ?? ''),
      teamName: resolveTeamName(ev.team?.displayName ?? ''),
      participants: (ev.participants ?? []).map((p: any) => ({
        athleteId: String(p.athlete?.id ?? ''),
        displayName: p.athlete?.displayName ?? '',
      })),
      shootout: !!ev.shootout,
    }));

    // ── Parse rosters ──
    const rosters: EspnRosterPlayer[] = [];
    for (const teamRoster of data.rosters ?? []) {
      const homeAway: 'home' | 'away' = teamRoster.homeAway === 'home' ? 'home' : 'away';
      const teamName = resolveTeamName(teamRoster.team?.displayName ?? '');
      for (const player of teamRoster.roster ?? []) {
        rosters.push({
          athleteId: String(player.athlete?.id ?? ''),
          displayName: player.athlete?.displayName ?? '',
          lastName: player.athlete?.lastName ?? '',
          starter: !!player.starter,
          jersey: player.jersey ?? '',
          homeAway,
          teamName,
        });
      }
    }

    // ── Parse Boxscore, Odds, Form ──
    let boxscore = null;
    if (data.boxscore?.teams?.length >= 2) {
      const parseTeamStats = (t: any): EspnBoxscoreTeam => {
        const getStat = (name: string) => t.statistics?.find((s: any) => s.name === name)?.displayValue || '0';
        return {
          teamId: String(t.team?.id ?? ''),
          possession: getStat('possessionPct'),
          shots: getStat('shotsSummary'),
          shotsOnTarget: getStat('shotsOnGoal'),
          fouls: getStat('foulsCommitted'),
          yellowCards: getStat('yellowCards'),
          redCards: getStat('redCards'),
          offsides: getStat('offsides'),
          cornerKicks: getStat('wonCorners'),
          saves: getStat('saves')
        };
      };
      
      const homeTeamStat = data.boxscore.teams.find((t: any) => t.homeAway === 'home') || data.boxscore.teams[0];
      const awayTeamStat = data.boxscore.teams.find((t: any) => t.homeAway === 'away') || data.boxscore.teams[1];
      boxscore = {
        home: parseTeamStats(homeTeamStat),
        away: parseTeamStats(awayTeamStat)
      };
    }

    let odds = null;
    if (data.odds && data.odds.length > 0) {
      const o = data.odds[0];
      odds = {
        provider: o.provider?.name || 'DraftKings',
        homeMoneyline: o.home?.close?.odds || o.home?.open?.odds || '',
        awayMoneyline: o.away?.close?.odds || o.away?.open?.odds || '',
        drawMoneyline: o.draw?.close?.odds || o.draw?.open?.odds || '',
        overUnder: o.total?.over?.close?.line || o.total?.over?.open?.line || '',
        overOdds: o.total?.over?.close?.odds || '',
        underOdds: o.total?.under?.close?.odds || ''
      };
    }

    let form = null;
    if (data.lastFiveGames?.length >= 2) {
      const parseForm = (f: any): EspnForm => ({
        teamId: String(f.team?.id ?? ''),
        events: (f.events || []).map((e: any) => ({
          id: String(e.id ?? ''),
          date: e.gameDate ?? '',
          result: e.gameResult ?? '',
          score: e.score ?? '',
          opponentName: e.opponent?.displayName ?? '',
          opponentLogo: e.opponent?.logo ?? e.opponent?.logos?.[0]?.href ?? ''
        }))
      });
      form = {
        home: parseForm(data.lastFiveGames[0]),
        away: parseForm(data.lastFiveGames[1])
      };
    }

    return {
      events,
      rosters,
      homeTeamId: String(hdrHome?.team?.id ?? hdrHome?.id ?? ''),
      awayTeamId: String(hdrAway?.team?.id ?? hdrAway?.id ?? ''),
      homeScore: isNaN(sh) ? null : sh,
      awayScore: isNaN(sa) ? null : sa,
      completed: !!status.completed,
      statusState,
      clockDisplay: hdrComp?.status?.displayClock ?? '',
      boxscore,
      odds,
      form,
    };
  } catch {
    return null;
  }
}

// ── 6. Map ESPN event typeevent type ─────────────────────
export function mapEspnEventType(espnType: string, gameState?: string, shootout?: boolean): string | null {
  const t = espnType.toLowerCase().replace(/\s+/g, '-');

  // Shootout penalties
  if (shootout && t === 'goal') return 'penalty_scored';
  if (shootout && (t === 'penalty---missed' || t === 'missed-penalty')) return 'penalty_missed_shootout';

  const map: Record<string, string> = {
    'goal':                'goal',
    'penalty---scored':    'goal',           // ESPN type for penalty goal
    'penalty-scored':      'goal',
    'own-goal':            'own_goal',
    'own_goal':            'own_goal',
    'yellow-card':         'yellow_card',
    'yellow_card':         'yellow_card',
    'red-card':            'red_card',
    'red_card':            'red_card',
    'substitution':        'substitution',
    'halftime':            'half_time',
    'half-time':           'half_time',
    'end-regular-time':    'full_time',
    'full-time':           'full_time',
    'kickoff':             'kick_off',
    'kick-off':            'kick_off',
    'start-2nd-half':      'kick_off',
    'second-half':         'kick_off',
    'penalty---missed':    'penalty_missed',
    'missed-penalty':      'penalty_missed',
    'penalty-save':        'penalty_save',
    'penalty---save':      'penalty_save',
    'var-review':          'var_review',
    'var':                 'var_review',
    'corner-kick':         'corner_kick',
    'corner':              'corner_kick',
    'offside':             'offside',
    'free-kick':           'free_kick',
    'injury':              'injury',
    'extra-time':          'extra_time',
    'extra_time':          'extra_time',
  };

  return map[t] ?? null;
}

// ── 7. Build ESPN athleteId → internal player ID map from rosters ─────────────
export function buildEspnPlayerIdMap(
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

// ── 8. Resolve ESPN event ID by team names + kickoff time ─────────────────────
// Used by discoverAndSync to find the ESPN event ID for a fixture we know only by teams.
export async function resolveEspnEventId(
  leagueSlug: string,
  homeTeam: string,
  awayTeam: string,
  kickoffISO: string,
  windowMs = 4 * 3_600_000,
): Promise<string | null> {
  try {
    const kickoffMs = new Date(kickoffISO).getTime();
    if (!kickoffMs) return null;

    // Check kickoff date and following day
    const dates = [dateStr(kickoffMs), dateStr(kickoffMs + 24 * 3_600_000)].join(',');
    const fixtures = await fetchEspnFixtures(leagueSlug, dates, leagueSlug);

    const normHome = normStr(resolveTeamName(homeTeam));
    const normAway = normStr(resolveTeamName(awayTeam));

    for (const f of fixtures) {
      const fHome = normStr(f.homeTeam);
      const fAway = normStr(f.awayTeam);
      const matchNormal  = fHome === normHome && fAway === normAway;
      const matchReversed = fHome === normAway && fAway === normHome;
      if (!matchNormal && !matchReversed) continue;

      const fKickoff = new Date(f.kickoffAt).getTime();
      if (Math.abs(fKickoff - kickoffMs) > windowMs) continue;

      return f.espnId;
    }

    return null;
  } catch {
    return null;
  }
}

// ── 9. Check match completion status (replacement for old checkEspnMatchStatus) ─
// Looks up by team names + kickoff; returns completed flag + scores.
export async function checkEspnMatchStatus(
  homeTeam: string,
  awayTeam: string,
  kickoffAt: string,
  leagueSlug = 'fifa.world',
): Promise<EspnMatchStatus | null> {
  const kickoffMs = new Date(kickoffAt).getTime();
  if (!kickoffMs) return null;

  const dates = [dateStr(kickoffMs), dateStr(kickoffMs + 24 * 3_600_000)];

  for (const d of dates) {
    try {
      const url = `${ESPN_SCOREBOARD_BASE}/${leagueSlug}/scoreboard?dates=${d}&limit=50`;
      const r = await fetch(url, { headers: ESPN_HEADERS, cache: 'no-store' });
      if (!r.ok) continue;
      const events: any[] = (await r.json()).events ?? [];

      for (const ev of events) {
        const comp = ev.competitions?.[0];
        const homeComp = comp?.competitors?.find((c: any) => c.homeAway === 'home');
        const awayComp = comp?.competitors?.find((c: any) => c.homeAway === 'away');
        if (!homeComp || !awayComp) continue;

        const espnHome = normStr(resolveTeamName(homeComp.team?.displayName ?? ''));
        const espnAway = normStr(resolveTeamName(awayComp.team?.displayName ?? ''));
        const ourHome  = normStr(resolveTeamName(homeTeam));
        const ourAway  = normStr(resolveTeamName(awayTeam));

        const matchNormal   = espnHome === ourHome && espnAway === ourAway;
        const matchReversed = espnHome === ourAway && espnAway === ourHome;
        if (!matchNormal && !matchReversed) continue;

        const evTime = new Date(ev.date ?? '').getTime();
        if (evTime && Math.abs(evTime - kickoffMs) > 4 * 3_600_000) continue;

        const completed = !!comp?.status?.type?.completed;
        const sh = parseInt(homeComp.score ?? '', 10);
        const sa = parseInt(awayComp.score ?? '', 10);
        if (isNaN(sh) || isNaN(sa)) return { completed, scoreHome: 0, scoreAway: 0 };

        return {
          completed,
          scoreHome: matchReversed ? sa : sh,
          scoreAway: matchReversed ? sh : sa,
        };
      }
    } catch { /* try next date */ }
  }

  return null;
}


// ── 10. Fetch match summary (Boxscore, Odds, Form) ────────────────────────────
export async function fetchEspnSummary(leagueSlug: string, eventId: string): Promise<EspnSummary | null> {
  if (!eventId) return null;
  try {
    const url = `${ESPN_SUMMARY_BASE}/${leagueSlug}/summary?event=${eventId}`;
    const r = await fetch(url, { headers: ESPN_HEADERS, cache: 'no-store' });
    if (!r.ok) return null;
    const data: any = await r.json();

    let boxscore = null;
    if (data.boxscore?.teams?.length >= 2) {
      const parseTeamStats = (t: any): EspnBoxscoreTeam => {
        const getStat = (name: string) => t.statistics?.find((s: any) => s.name === name)?.displayValue || '0';
        return {
          teamId: String(t.team?.id ?? ''),
          possession: getStat('possessionPct'),
          shots: getStat('shotsSummary'),
          shotsOnTarget: getStat('shotsOnGoal'),
          fouls: getStat('foulsCommitted'),
          yellowCards: getStat('yellowCards'),
          redCards: getStat('redCards'),
          offsides: getStat('offsides'),
          cornerKicks: getStat('wonCorners'),
          saves: getStat('saves')
        };
      };
      
      const homeTeamStat = data.boxscore.teams.find((t: any) => t.homeAway === 'home') || data.boxscore.teams[0];
      const awayTeamStat = data.boxscore.teams.find((t: any) => t.homeAway === 'away') || data.boxscore.teams[1];
      boxscore = {
        home: parseTeamStats(homeTeamStat),
        away: parseTeamStats(awayTeamStat)
      };
    }

    let odds = null;
    if (data.odds && data.odds.length > 0) {
      const o = data.odds[0];
      odds = {
        provider: o.provider?.name || 'DraftKings',
        homeMoneyline: o.home?.close?.odds || o.home?.open?.odds || '',
        awayMoneyline: o.away?.close?.odds || o.away?.open?.odds || '',
        drawMoneyline: o.draw?.close?.odds || o.draw?.open?.odds || '',
        overUnder: o.total?.over?.close?.line || o.total?.over?.open?.line || '',
        overOdds: o.total?.over?.close?.odds || '',
        underOdds: o.total?.under?.close?.odds || ''
      };
    }

    let form = null;
    if (data.lastFiveGames?.length >= 2) {
      const parseForm = (f: any): EspnForm => ({
        teamId: String(f.team?.id ?? ''),
        events: (f.events || []).map((e: any) => ({
          id: String(e.id ?? ''),
          date: e.gameDate ?? '',
          result: e.gameResult ?? '',
          score: e.score ?? '',
          opponentName: e.opponent?.displayName ?? '',
          opponentLogo: e.opponent?.logo ?? e.opponent?.logos?.[0]?.href ?? ''
        }))
      });
      // The summary API does not guarantee which one is home/away in lastFiveGames,
      // but usually index 0 is home, index 1 is away. Let's just pass them back,
      // we can match them via teamId later on the client if needed.
      form = {
        home: parseForm(data.lastFiveGames[0]),
        away: parseForm(data.lastFiveGames[1])
      };
    }

    return { boxscore, odds, form };
  } catch {
    return null;
  }
}
