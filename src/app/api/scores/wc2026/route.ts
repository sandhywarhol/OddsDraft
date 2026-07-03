import { NextResponse } from 'next/server';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ESPN_ALIASES: Record<string, string> = {
  'united states':                'usa',
  'us':                           'usa',
  'democratic republic of congo': 'congo dr',
  'dr congo':                     'congo dr',
  'republic of congo':            'congo dr',
  "cote d ivoire":                'ivory coast',
  'czechia':                      'czech republic',
  'republic of korea':            'south korea',
  'korea republic':               'south korea',
  'cape verde islands':           'cape verde',
};

function resolveESPN(name: string): string {
  const n = norm(name);
  return ESPN_ALIASES[n] ?? n;
}

function teamsMatch(ourTeam: string, espnTeam: string): boolean {
  const a = norm(ourTeam);
  const b = resolveESPN(espnTeam);
  return a === b || a.includes(b) || b.includes(a);
}

async function fetchESPNDay(dateStr: string, isRecent = false): Promise<any[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}&limit=30`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      // Recent dates (today / tomorrow) need fresh data for live scores
      ...(isRecent ? { cache: 'no-store' } : { next: { revalidate: 86400 } }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

export interface FixtureScore {
  home: number;
  away: number;
  espnId?: string; // ESPN event ID — used to fetch match details (scorers, cards)
}

// GET /api/scores/wc2026
// Returns { [txlineFixtureId]: { home, away, espnId } }
export async function GET() {
  const start = new Date('2026-06-13');
  const end = new Date();
  end.setUTCDate(end.getUTCDate() + 1);

  const todayUTC = new Date();
  const tomorrowUTC = new Date(todayUTC.getTime() + 86_400_000);
  const fmtUTC = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  const todayStr = fmtUTC(todayUTC);
  const tomorrowStr = fmtUTC(tomorrowUTC);

  const dates: string[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(fmtUTC(d));
  }

  const allEventArrays = await Promise.all(
    dates.map(d => fetchESPNDay(d, d === todayStr || d === tomorrowStr))
  );
  const allEvents = allEventArrays.flat();

  const results: Record<string, FixtureScore> = {};

  for (const event of allEvents) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    const isCompleted = comp.status?.type?.completed;
    const isLive = comp.status?.type?.state === 'in';
    if (!isCompleted && !isLive) continue;

    const homeComp = comp.competitors?.find((c: any) => c.homeAway === 'home');
    const awayComp = comp.competitors?.find((c: any) => c.homeAway === 'away');
    if (!homeComp || !awayComp) continue;

    const espnHome = homeComp.team?.displayName ?? homeComp.team?.name ?? '';
    const espnAway = awayComp.team?.displayName ?? awayComp.team?.name ?? '';
    const homeScore = Number(homeComp.score);
    const awayScore = Number(awayComp.score);

    if (isNaN(homeScore) || isNaN(awayScore)) continue;

    const fixture = WC2026_FIXTURES.find(f =>
      teamsMatch(f.homeTeam, espnHome) && teamsMatch(f.awayTeam, espnAway)
    );

    if (fixture) {
      results[fixture.fixtureId] = {
        home: homeScore,
        away: awayScore,
        espnId: String(event.id),
      };
    }
  }

  console.log(`[scores/wc2026] ${Object.keys(results).length}/${WC2026_FIXTURES.length} fixtures matched`);

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
