import { NextRequest, NextResponse } from 'next/server';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';
import { createServiceClient } from '@/lib/supabase';

export interface MatchEvent {
  minute: string;
  type: 'goal' | 'own_goal' | 'penalty' | 'yellow_card' | 'red_card' | 'yellow_red_card' | 'sub';
  player: string;
  assist?: string;
  team: string;
  teamFlag?: string;
}

export interface PeriodStats {
  homeGoals: number;
  awayGoals: number;
  homeCorners: number;
  awayCorners: number;
  homeYellows: number;
  awayYellows: number;
  homeReds: number;
  awayReds: number;
  homeShots: number;
  awayShots: number;
  homeDangers: number;
  awayDangers: number;
}

export interface MatchStats {
  h1: PeriodStats;
  h2: PeriodStats;
  total: PeriodStats;
}

export interface MatchResult {
  events: MatchEvent[];
  venue?: string;
  attendance?: string;
  stats?: MatchStats;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

const ALIASES: Record<string, string> = {
  'united states': 'usa', 'us': 'usa',
  'democratic republic of congo': 'congo dr', 'dr congo': 'congo dr',
  "cote d ivoire": 'ivory coast', 'czechia': 'czech republic',
  'republic of korea': 'south korea', 'korea republic': 'south korea',
  'cape verde islands': 'cape verde',
};
const resolve = (n: string) => { const x = norm(n); return ALIASES[x] ?? x; };
const teamsMatch = (ours: string, theirs: string) => {
  const a = norm(ours); const b = resolve(theirs);
  return a === b || a.includes(b) || b.includes(a);
};

function eventType(text: string, scoringType?: string): MatchEvent['type'] {
  const t = (text ?? '').toLowerCase();
  const st = (scoringType ?? '').toLowerCase();
  if (st.includes('own goal') || t.includes('own goal')) return 'own_goal';
  if (st.includes('penalty') || t.includes('penalty')) return 'penalty';
  if (t.includes('goal')) return 'goal';
  if (t.includes('red card')) return 'red_card';
  if (t.includes('yellow-red') || t.includes('second yellow')) return 'yellow_red_card';
  if (t.includes('yellow card')) return 'yellow_card';
  if (t.includes('substitution') || t.includes('sub')) return 'sub';
  return 'goal';
}

function fmtUTC(d: Date) {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

function blankPeriod(): PeriodStats {
  return { homeGoals: 0, awayGoals: 0, homeCorners: 0, awayCorners: 0, homeYellows: 0, awayYellows: 0, homeReds: 0, awayReds: 0, homeShots: 0, awayShots: 0, homeDangers: 0, awayDangers: 0 };
}

// ── External stats helpers ───────────────────────────────────────────────────

async function fetchDayEvents(dateStr: string): Promise<any[]> {
  const cutoff = new Date(); cutoff.setUTCDate(cutoff.getUTCDate() - 3);
  const isRecent = new Date(`${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`).getTime() >= cutoff.getTime();
  try {
    const r = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}&limit=30`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, ...(isRecent ? { cache: 'no-store' } : { next: { revalidate: 86400 } }) }
    );
    if (!r.ok) return [];
    return (await r.json()).events ?? [];
  } catch { return []; }
}

async function fetchEventDetail(internalRef: string, isLive: boolean): Promise<any> {
  try {
    const r = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${internalRef}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, ...(isLive ? { cache: 'no-store' } : { next: { revalidate: 1800 } }) }
    );
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

// ── TxLINE period stats ───────────────────────────────────────────────────────

async function fetchTxLineStats(appUrl: string, fixtureId: string): Promise<MatchStats | null> {
  try {
    const res = await fetch(`${appUrl}/api/txline/api/fixtures/snapshot`, { cache: 'no-store' });
    if (!res.ok) return null;
    const raw = await res.json();
    const fixtures: any[] = Array.isArray(raw) ? raw : (raw?.fixtures ?? raw?.data ?? []);
    const tf = fixtures.find(f => String(f.FixtureId ?? f.fixtureId ?? '') === fixtureId);
    if (!tf?.Score) return null;

    // Respect Participant1IsHome so home stats map to the correct side
    const isP1Home = tf.Participant1IsHome !== false;
    const homeScore = isP1Home ? tf.Score.Participant1 : tf.Score.Participant2;
    const awayScore = isP1Home ? tf.Score.Participant2 : tf.Score.Participant1;

    const ext = (p: any): { goals: number; corners: number; yellows: number; reds: number } => ({
      goals:   Number(p?.Goals   ?? 0),
      corners: Number(p?.Corners ?? 0),
      yellows: Number(p?.YellowCards ?? 0),
      reds:    Number(p?.RedCards    ?? 0),
    });

    const h1H = ext(homeScore?.Period1);
    const h1A = ext(awayScore?.Period1);
    const h2H = ext(homeScore?.Period2);
    const h2A = ext(awayScore?.Period2);
    const totH = ext(homeScore?.Total ?? homeScore);
    const totA = ext(awayScore?.Total ?? awayScore);

    return {
      h1:    { ...blankPeriod(), homeGoals: h1H.goals,   awayGoals: h1A.goals,   homeCorners: h1H.corners,  awayCorners: h1A.corners,  homeYellows: h1H.yellows,  awayYellows: h1A.yellows,  homeReds: h1H.reds,  awayReds: h1A.reds  },
      h2:    { ...blankPeriod(), homeGoals: h2H.goals,   awayGoals: h2A.goals,   homeCorners: h2H.corners,  awayCorners: h2A.corners,  homeYellows: h2H.yellows,  awayYellows: h2A.yellows,  homeReds: h2H.reds,  awayReds: h2A.reds  },
      total: { ...blankPeriod(), homeGoals: totH.goals,  awayGoals: totA.goals,  homeCorners: totH.corners, awayCorners: totA.corners, homeYellows: totH.yellows, awayYellows: totA.yellows, homeReds: totH.reds, awayReds: totA.reds },
    };
  } catch { return null; }
}

// ── Supabase event counts (shots, dangers) ────────────────────────────────────

async function fetchSupabaseEventCounts(
  fixtureId: string,
  homeTeam: string,
): Promise<{ h1Home: Partial<PeriodStats>; h1Away: Partial<PeriodStats>; h2Home: Partial<PeriodStats>; h2Away: Partial<PeriodStats>; totHome: Partial<PeriodStats>; totAway: Partial<PeriodStats> } | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('live_match_events')
      .select('event_type, team_name, minute')
      .eq('fixture_id', fixtureId)
      .in('event_type', ['shot', 'danger_attack', 'corner_kick']);
    if (error || !data?.length) return null;

    const counts = {
      h1Home: { homeShots: 0, homeDangers: 0, homeCorners: 0 },
      h1Away: { awayShots: 0, awayDangers: 0, awayCorners: 0 },
      h2Home: { homeShots: 0, homeDangers: 0, homeCorners: 0 },
      h2Away: { awayShots: 0, awayDangers: 0, awayCorners: 0 },
      totHome: { homeShots: 0, homeDangers: 0, homeCorners: 0 },
      totAway: { awayShots: 0, awayDangers: 0, awayCorners: 0 },
    };

    for (const ev of data) {
      const isHome = teamsMatch(homeTeam, ev.team_name ?? '');
      const isH1 = (Number(ev.minute) || 0) <= 45;
      const half = isH1 ? (isHome ? counts.h1Home : counts.h1Away) : (isHome ? counts.h2Home : counts.h2Away);
      const tot = isHome ? counts.totHome : counts.totAway;
      if (ev.event_type === 'shot')          { (half as any)[isHome ? 'homeShots' : 'awayShots']++; (tot as any)[isHome ? 'homeShots' : 'awayShots']++; }
      if (ev.event_type === 'danger_attack') { (half as any)[isHome ? 'homeDangers' : 'awayDangers']++; (tot as any)[isHome ? 'homeDangers' : 'awayDangers']++; }
      if (ev.event_type === 'corner_kick')   { (half as any)[isHome ? 'homeCorners' : 'awayCorners']++; (tot as any)[isHome ? 'homeCorners' : 'awayCorners']++; }
    }
    return counts;
  } catch { return null; }
}

// ── Route ─────────────────────────────────────────────────────────────────────

// GET /api/match/result?fixtureId=18176123
// Returns goals, cards, venue, attendance and H1/H2/total statistics.
// External source provides the event timeline; TxLINE + Supabase provide period breakdowns.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const fixtureId = url.searchParams.get('fixtureId');
  if (!fixtureId) return NextResponse.json({ error: 'Missing fixtureId' }, { status: 400 });

  const staticFixture = WC2026_FIXTURES.find(f => f.fixtureId === fixtureId);
  if (!staticFixture) return NextResponse.json({ events: [] });

  const fixture = {
    ...staticFixture,
    homeTeam: url.searchParams.get('homeTeam') ?? staticFixture.homeTeam,
    awayTeam: url.searchParams.get('awayTeam') ?? staticFixture.awayTeam,
  };

  const kickoff = new Date(fixture.kickoffAt);
  const datesToTry = [-1, 0, 1].map(delta => {
    const d = new Date(kickoff.getTime() + delta * 86_400_000);
    return fmtUTC(d);
  });

  const now = Date.now();
  const koMs = kickoff.getTime();
  const isLive = koMs > 0 && now > koMs && now < koMs + 3 * 60 * 60 * 1000;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app';

  // Fetch external stats + TxLINE + Supabase in parallel
  const [allDayEventsResult, txlineResult, supabaseResult] = await Promise.allSettled([
    Promise.all(datesToTry.map(fetchDayEvents)).then(arrays => arrays.flat()),
    fetchTxLineStats(appUrl, fixtureId),
    fetchSupabaseEventCounts(fixtureId, fixture.homeTeam),
  ]);

  const allDayEvents = allDayEventsResult.status === 'fulfilled' ? allDayEventsResult.value : [];
  const txStats     = txlineResult.status     === 'fulfilled' ? txlineResult.value     : null;
  const evCounts    = supabaseResult.status   === 'fulfilled' ? supabaseResult.value   : null;

  // ── Event timeline ────────────────────────────────────────────────────────
  const findMatch = (evList: any[]) => evList.find(ev => {
    const comp = ev.competitions?.[0];
    if (!comp) return false;
    const home = comp.competitors?.find((c: any) => c.homeAway === 'home');
    const away = comp.competitors?.find((c: any) => c.homeAway === 'away');
    const h = home?.team?.displayName ?? home?.team?.name ?? '';
    const a = away?.team?.displayName ?? away?.team?.name ?? '';
    return teamsMatch(fixture.homeTeam, h) && teamsMatch(fixture.awayTeam, a);
  });

  const matchEvent = findMatch(allDayEvents);
  const detail = matchEvent?.id ? await fetchEventDetail(matchEvent.id, isLive) : null;

  const events: MatchEvent[] = [];
  const seenKeys = new Set<string>();
  // Normalize minute to a bare integer string ("90+3'" → "90", "23:24" → "23")
  // so the same event from scoringPlays vs keyEvents vs plays deduplicates correctly.
  const normMin = (m: string) => String(parseInt(m.replace(/[^0-9]/g, '').slice(0, 3)) || 0);
  const pushEvent = (ev: MatchEvent) => {
    const key = `${ev.type}-${normMin(ev.minute)}-${ev.player.replace(/\s+/g, '').toLowerCase().slice(0, 8)}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    events.push(ev);
  };

  const resolveTeam = (teamName: string) =>
    teamsMatch(fixture.homeTeam, teamName) ? fixture.homeTeam
    : teamsMatch(fixture.awayTeam, teamName) ? fixture.awayTeam
    : teamName;

  if (detail) {
    // Goals from scoringPlays
    for (const play of (detail.scoringPlays ?? [])) {
      const type = eventType(play.type?.text ?? '', play.scoringPlay?.scoringType ?? '');
      const text: string = play.text ?? '';
      const assistMatch = text.match(/\(([^)]+)\)/);
      const player = text.replace(/\s*\([^)]*\)/, '').trim();
      pushEvent({ minute: play.clock?.displayValue ?? '?', type, player, assist: assistMatch?.[1], team: resolveTeam(play.team?.displayName ?? play.team?.name ?? '') });
    }

    // Goals + cards from keyEvents (extra-time goals are often only here)
    for (const play of (detail.keyEvents ?? detail.keyPlays ?? [])) {
      const typeText = (play.type?.text ?? '').toLowerCase();
      const type = eventType(play.type?.text ?? '', play.scoringPlay?.scoringType ?? '');
      const isGoalEvent = typeText.includes('goal') || play.scoringPlay === true || play.isScoringPlay === true;
      const isCardEvent = typeText.includes('card');
      if (!isGoalEvent && !isCardEvent) continue;
      const text: string = play.text ?? '';
      const assistMatch = text.match(/\(([^)]+)\)/);
      const player = play.participants?.[0]?.athlete?.displayName ?? text.replace(/\s*\([^)]*\)/, '').trim();
      if (!player) continue;
      pushEvent({ minute: play.clock?.displayValue ?? '?', type, player, assist: assistMatch?.[1], team: resolveTeam(play.team?.displayName ?? play.team?.name ?? '') });
    }

    // Remaining plays (scoring plays not in scoringPlays)
    for (const play of (detail.plays ?? [])) {
      if (!play.scoringPlay && !play.isScoringPlay) continue;
      const type = eventType(play.type?.text ?? '', play.scoringPlay?.scoringType ?? '');
      const text: string = play.text ?? play.athletesInvolved?.[0]?.displayName ?? '';
      if (!text) continue;
      const assistMatch = text.match(/\(([^)]+)\)/);
      const player = play.participants?.[0]?.athlete?.displayName ?? play.athletesInvolved?.[0]?.displayName ?? text.replace(/\s*\([^)]*\)/, '').trim();
      if (!player) continue;
      pushEvent({ minute: play.clock?.displayValue ?? '?', type, player, assist: assistMatch?.[1], team: resolveTeam(play.team?.displayName ?? play.team?.name ?? '') });
    }

    events.sort((a, b) => (parseInt(a.minute) || 0) - (parseInt(b.minute) || 0));
  }

  const gameInfo = detail?.gameInfo ?? detail?.header?.competitions?.[0];
  const venue = gameInfo?.venue?.fullName ?? gameInfo?.venue?.name;
  const attendance = gameInfo?.attendance != null ? Number(gameInfo.attendance).toLocaleString() : undefined;

  // ── Build combined stats ─────────────────────────────────────────────────────
  // Strict priority so sources never double-count the same stat:
  //   H1/H2 goals, corners, cards → TxLINE Period1/Period2 (only source with per-half data)
  //   H1/H2 shots, dangers        → Supabase event counts (TxLINE has no shot schema)
  //   H1/H2 corners (fallback)    → Supabase if TxLINE has all-zero period breakdown
  //   Total goals, corners, cards → TxLINE Total → external boxscore (only if TxLINE = 0)
  //   Total shots                 → Supabase → external totalShots (only if Supabase = 0)
  //   Total dangers               → Supabase only
  // External stats NEVER overwrite a non-zero value from TxLINE or Supabase.

  // External stats fallback — totals only, used as last resort
  const backupHomeTeam = detail?.boxscore?.teams?.find((t: any) => t.homeAway === 'home');
  const backupAwayTeam = detail?.boxscore?.teams?.find((t: any) => t.homeAway === 'away');
  const backupStat = (side: any, name: string): number => {
    const s = (side?.statistics ?? []).find((x: any) => x.name === name);
    return s ? (parseInt(s.displayValue ?? '0', 10) || 0) : 0;
  };

  let stats: MatchStats | undefined;
  if (txStats || evCounts || backupHomeTeam) {
    const base: MatchStats = txStats ?? { h1: blankPeriod(), h2: blankPeriod(), total: blankPeriod() };

    // ── Supabase: shots and dangers (TxLINE has no shot data) ───────────────
    if (evCounts) {
      base.h1.homeShots   = evCounts.h1Home.homeShots   ?? 0;
      base.h1.awayShots   = evCounts.h1Away.awayShots   ?? 0;
      base.h1.homeDangers = evCounts.h1Home.homeDangers ?? 0;
      base.h1.awayDangers = evCounts.h1Away.awayDangers ?? 0;
      base.h2.homeShots   = evCounts.h2Home.homeShots   ?? 0;
      base.h2.awayShots   = evCounts.h2Away.awayShots   ?? 0;
      base.h2.homeDangers = evCounts.h2Home.homeDangers ?? 0;
      base.h2.awayDangers = evCounts.h2Away.awayDangers ?? 0;
      base.total.homeShots   = evCounts.totHome.homeShots   ?? 0;
      base.total.awayShots   = evCounts.totAway.awayShots   ?? 0;
      base.total.homeDangers = evCounts.totHome.homeDangers ?? 0;
      base.total.awayDangers = evCounts.totAway.awayDangers ?? 0;

      // Supabase corners: only if TxLINE gave all-zero per-period breakdown
      const txHasCorners =
        base.h1.homeCorners > 0 || base.h1.awayCorners > 0 ||
        base.h2.homeCorners > 0 || base.h2.awayCorners > 0;
      if (!txHasCorners) {
        base.h1.homeCorners    = evCounts.h1Home.homeCorners ?? 0;
        base.h1.awayCorners    = evCounts.h1Away.awayCorners ?? 0;
        base.h2.homeCorners    = evCounts.h2Home.homeCorners ?? 0;
        base.h2.awayCorners    = evCounts.h2Away.awayCorners ?? 0;
        base.total.homeCorners = evCounts.totHome.homeCorners ?? 0;
        base.total.awayCorners = evCounts.totAway.awayCorners ?? 0;
      }
    }

    // ── External stats: fill TOTAL fields that TxLINE + Supabase left at zero ─
    // External source only provides match totals (no H1/H2 split), so it never touches h1/h2.
    // Each assignment is guarded: only runs when the base value is still 0.
    if (backupHomeTeam) {
      if (base.total.homeShots   === 0) base.total.homeShots   = backupStat(backupHomeTeam, 'totalShots');
      if (base.total.awayShots   === 0) base.total.awayShots   = backupStat(backupAwayTeam, 'totalShots');
      if (base.total.homeCorners === 0) base.total.homeCorners = backupStat(backupHomeTeam, 'cornerKicks');
      if (base.total.awayCorners === 0) base.total.awayCorners = backupStat(backupAwayTeam, 'cornerKicks');
      if (base.total.homeYellows === 0) base.total.homeYellows = backupStat(backupHomeTeam, 'yellowCards');
      if (base.total.awayYellows === 0) base.total.awayYellows = backupStat(backupAwayTeam, 'yellowCards');
      if (base.total.homeReds    === 0) base.total.homeReds    = backupStat(backupHomeTeam, 'redCards');
      if (base.total.awayReds    === 0) base.total.awayReds    = backupStat(backupAwayTeam, 'redCards');
      // Goals intentionally not read from external source — inferred from score header by the client
    }

    stats = base;
  }

  const result: MatchResult = { events, venue, attendance, stats };
  return NextResponse.json(result, {
    headers: {
      'Cache-Control': isLive
        ? 'no-store'
        : 'public, s-maxage=1800, stale-while-revalidate=86400',
    },
  });
}
