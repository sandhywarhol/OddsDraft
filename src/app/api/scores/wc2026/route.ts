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

// TxLINE slot IDs for knockout rounds in chronological order — same mapping as schedule API.
// When team names changed from pre-tournament predictions, we fall back to slot order.
const KNOCKOUT_SLOTS: Record<string, string[]> = {
  r16:   ['18185036','18188721','18187298','18192996','18198205','18193785','18202701','18202783'],
  qf:    ['18210001','18210002','18210003','18210004'],
  sf:    ['18220001','18220002'],
  third: ['18230001'],
  final: ['18240001'],
};

function espnRoundToStage(roundName: string): string {
  const r = roundName.toLowerCase();
  if (r.includes('round of 16') || r.includes('16') || r.includes('rd of 16')) return 'r16';
  if (r.includes('quarter')) return 'qf';
  if (r.includes('third') || r.includes('3rd') || r.includes('place')) return 'third';
  if (r.includes('semi')) return 'sf';
  if (r.includes('final')) return 'final';
  return '';
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
  completed?: boolean;
  /** Penalty shootout scores — only present when match went to penalties */
  penaltyHome?: number;
  penaltyAway?: number;
}

// GET /api/scores/wc2026
// Returns { [txlineFixtureId]: { home, away } }
export async function GET() {
  const start = new Date('2026-06-13');
  const end = new Date();
  end.setUTCDate(end.getUTCDate() + 1);

  const fmtUTC = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;

  // Treat the last 4 days + tomorrow as "recent" — no CDN/ISR cache so results are always fresh
  const recentDates = new Set<string>();
  for (let i = -3; i <= 1; i++) {
    const d = new Date(end.getTime() + i * 86_400_000);
    recentDates.add(fmtUTC(d));
  }

  const dates: string[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(fmtUTC(d));
  }

  const allEventArrays = await Promise.all(
    dates.map(d => fetchESPNDay(d, recentDates.has(d)))
  );
  const allEvents = allEventArrays.flat();

  const results: Record<string, FixtureScore> = {};

  // Sort events chronologically so slot-order fallback assigns IDs correctly
  allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Count how many unmatched events we've seen per knockout round (for slot assignment)
  const slotCounters: Record<string, number> = { r16: 0, qf: 0, sf: 0, third: 0, final: 0 };

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

    // Primary: match by team name (works for group/r32/r16 where teams were known)
    const fixture = WC2026_FIXTURES.find(f =>
      teamsMatch(f.homeTeam, espnHome) && teamsMatch(f.awayTeam, espnAway)
    );

    // Check if match went to penalties (ESPN description contains "Penalties")
    const description: string = comp.status?.type?.description ?? '';
    const isAfterPenalties = description.toLowerCase().includes('penalt');
    const penaltyHome = isAfterPenalties ? Number(homeComp.shootoutScore ?? NaN) : undefined;
    const penaltyAway = isAfterPenalties ? Number(awayComp.shootoutScore ?? NaN) : undefined;
    const penFields = (isAfterPenalties && !isNaN(penaltyHome!) && !isNaN(penaltyAway!))
      ? { penaltyHome, penaltyAway }
      : {};

    if (fixture) {
      results[fixture.fixtureId] = { home: homeScore, away: awayScore, completed: !!isCompleted, ...penFields };
      continue;
    }

    // Fallback: knockout match with changed teams — assign by slot order
    const roundName: string = event.season?.type?.name ?? '';
    const stage = espnRoundToStage(roundName);
    if (!stage || !(stage in KNOCKOUT_SLOTS)) continue;

    const slots = KNOCKOUT_SLOTS[stage];
    const idx = slotCounters[stage] ?? 0;
    slotCounters[stage] = idx + 1;

    if (idx < slots.length) {
      results[slots[idx]] = { home: homeScore, away: awayScore, completed: !!isCompleted, ...penFields };
    }
  }

  console.log(`[scores/wc2026] ${Object.keys(results).length}/${WC2026_FIXTURES.length} fixtures matched`);

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30' },
  });
}
