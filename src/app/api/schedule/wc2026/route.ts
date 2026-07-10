import { NextResponse } from 'next/server';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';
import type { WCFixture } from '@/lib/wc2026-fixtures';

// ESPN name → our canonical name
const ESPN_NAME_MAP: Record<string, string> = {
  'united states':                'USA',
  'us':                           'USA',
  'democratic republic of congo': 'Congo DR',
  'dr congo':                     'Congo DR',
  'republic of congo':            'Congo DR',
  "cote d'ivoire":                'Ivory Coast',
  "côte d'ivoire":                'Ivory Coast',
  'cote divoire':                 'Ivory Coast',
  'czechia':                      'Czech Republic',
  'republic of korea':            'South Korea',
  'korea republic':               'South Korea',
  'cape verde islands':           'Cape Verde',
  'bosnia and herzegovina':       'Bosnia & Herzegovina',
  'dem. rep. congo':              'Congo DR',
  'ivory coast':                  'Ivory Coast',
  'new caledonia':                'New Zealand', // unlikely but safe
};

// ESPN team abbreviation → flag emoji (fallback if name match fails)
const ABBR_FLAG: Record<string, string> = {
  HTI: '🇭🇹', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', AUS: '🇦🇺', TUR: '🇹🇷',
  GER: '🇩🇪', CUW: '🇨🇼', NED: '🇳🇱', JPN: '🇯🇵',
  CIV: '🇨🇮', ECU: '🇪🇨', SWE: '🇸🇪', TUN: '🇹🇳',
  ESP: '🇪🇸', CPV: '🇨🇻', BEL: '🇧🇪', EGY: '🇪🇬',
  KSA: '🇸🇦', URU: '🇺🇾', IRN: '🇮🇷', NZL: '🇳🇿',
  FRA: '🇫🇷', SEN: '🇸🇳', IRQ: '🇮🇶', NOR: '🇳🇴',
  ARG: '🇦🇷', ALG: '🇩🇿', AUT: '🇦🇹', JOR: '🇯🇴',
  POR: '🇵🇹', COD: '🇨🇩', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', CRO: '🇭🇷',
  GHA: '🇬🇭', PAN: '🇵🇦', UZB: '🇺🇿', COL: '🇨🇴',
  CZE: '🇨🇿', RSA: '🇿🇦', SUI: '🇨🇭',
  BIH: '🇧🇦', CAN: '🇨🇦', QAT: '🇶🇦',
  MEX: '🇲🇽', KOR: '🇰🇷', USA: '🇺🇸', MAR: '🇲🇦',
  BRA: '🇧🇷', PAR: '🇵🇾', SAU: '🇸🇦',
  MAG: '🇲🇦', // Morocco alternative
};

// Name lookup map from wc2026-fixtures (canonical name → flag)
const NAME_FLAG: Record<string, string> = {
  'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Australia': '🇦🇺', 'Turkey': '🇹🇷',
  'Germany': '🇩🇪', 'Curacao': '🇨🇼', 'Netherlands': '🇳🇱', 'Japan': '🇯🇵',
  'Ivory Coast': '🇨🇮', 'Ecuador': '🇪🇨', 'Sweden': '🇸🇪', 'Tunisia': '🇹🇳',
  'Spain': '🇪🇸', 'Cape Verde': '🇨🇻', 'Belgium': '🇧🇪', 'Egypt': '🇪🇬',
  'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾', 'Iran': '🇮🇷', 'New Zealand': '🇳🇿',
  'France': '🇫🇷', 'Senegal': '🇸🇳', 'Iraq': '🇮🇶', 'Norway': '🇳🇴',
  'Argentina': '🇦🇷', 'Algeria': '🇩🇿', 'Austria': '🇦🇹', 'Jordan': '🇯🇴',
  'Portugal': '🇵🇹', 'Congo DR': '🇨🇩', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷',
  'Ghana': '🇬🇭', 'Panama': '🇵🇦', 'Uzbekistan': '🇺🇿', 'Colombia': '🇨🇴',
  'Czech Republic': '🇨🇿', 'South Africa': '🇿🇦', 'Switzerland': '🇨🇭',
  'Bosnia & Herzegovina': '🇧🇦', 'Canada': '🇨🇦', 'Qatar': '🇶🇦',
  'Mexico': '🇲🇽', 'South Korea': '🇰🇷', 'USA': '🇺🇸', 'Morocco': '🇲🇦',
  'Brazil': '🇧🇷', 'Paraguay': '🇵🇾',
};

// TxLINE slot IDs for each knockout round, ordered by scheduled kickoff time
// These IDs identify the SLOT in TxLINE — teams get filled in as tournament progresses
const TXLINE_SLOTS: Record<string, string[]> = {
  r32:   ['18167317','18172489','18175983','18172260','18175397','18175981','18179759','18179764','18179550','18172379','18179551','18179763','18179552','18176123','18175918','18179549'],
  r16:   ['18185036','18188721','18187298','18192996','18198205','18193785','18202701','18202783'],
  qf:    ['18210001','18210002','18210003','18210004'],
  sf:    ['18220001','18220002'],
  third: ['18230001'],
  final: ['18240001'],
};

function resolveESPNName(espnName: string): string {
  const lower = espnName.toLowerCase().trim();
  return ESPN_NAME_MAP[lower] ?? espnName;
}

function getFlag(canonicalName: string, abbr?: string): string {
  return NAME_FLAG[canonicalName]
    ?? (abbr ? ABBR_FLAG[abbr.toUpperCase()] : undefined)
    ?? '🏳️';
}

function normalizeTeam(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function espnRoundToStage(roundName: string): WCFixture['stage'] {
  const r = roundName.toLowerCase();
  if (r.includes('group') || r.includes('matchday')) return 'group';
  if (r.includes('round of 32') || r.includes('32')) return 'r32';
  if (r.includes('round of 16') || r.includes('16') || r.includes('rd of 16')) return 'r16';
  if (r.includes('quarter')) return 'qf';
  if (r.includes('semi')) return 'sf';
  if (r.includes('third') || r.includes('3rd') || r.includes('place')) return 'final';
  if (r.includes('final')) return 'final';
  return 'group';
}

async function fetchESPNDay(dateStr: string): Promise<any[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}&limit=20`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      // Recent dates need fresh data; older dates can be cached longer
      next: { revalidate: 300 }, // 5 min cache
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

function buildDates(): string[] {
  const dates: string[] = [];
  const start = new Date('2026-06-11');
  const end = new Date('2026-07-20');
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dy = String(d.getUTCDate()).padStart(2, '0');
    dates.push(`${y}${mo}${dy}`);
  }
  return dates;
}

// GET /api/schedule/wc2026
// Returns WCFixture[] with ESPN data (correct teams) + TxLINE slot IDs
export async function GET() {
  const dates = buildDates();

  // Fetch all days in parallel (chunked to avoid overwhelming ESPN)
  const chunkSize = 10;
  const allEventArrays: any[][] = [];
  for (let i = 0; i < dates.length; i += chunkSize) {
    const chunk = dates.slice(i, i + chunkSize);
    const results = await Promise.all(chunk.map(d => fetchESPNDay(d)));
    allEventArrays.push(...results);
  }

  // Deduplicate ESPN events by event ID
  const seen = new Set<string>();
  const allEvents: any[] = [];
  for (const arr of allEventArrays) {
    for (const ev of arr) {
      if (!seen.has(ev.id)) {
        seen.add(ev.id);
        allEvents.push(ev);
      }
    }
  }

  // Sort by kickoff time
  allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (allEvents.length === 0) {
    // ESPN unreachable — fall back to static list
    return NextResponse.json(WC2026_FIXTURES, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  }

  // Build lookup from canonical team names → TxLINE fixture (for group/r32/r16)
  const staticByTeams = new Map<string, WCFixture>();
  for (const f of WC2026_FIXTURES) {
    const key = `${normalizeTeam(f.homeTeam)}__${normalizeTeam(f.awayTeam)}`;
    const keyRev = `${normalizeTeam(f.awayTeam)}__${normalizeTeam(f.homeTeam)}`;
    staticByTeams.set(key, f);
    staticByTeams.set(keyRev, f);
  }

  // Track which slot IDs have been used per round
  const slotCounters: Record<string, number> = { r32: 0, r16: 0, qf: 0, sf: 0, third: 0, final: 0 };

  const fixtures: WCFixture[] = [];

  for (const ev of allEvents) {
    const comp = ev.competitions?.[0];
    if (!comp) continue;

    const comps: any[] = comp.competitors ?? [];
    const homeComp = comps.find((c: any) => c.homeAway === 'home') ?? {};
    const awayComp = comps.find((c: any) => c.homeAway === 'away') ?? {};

    const espnHome = homeComp.team?.displayName ?? '';
    const espnAway = awayComp.team?.displayName ?? '';
    const homeAbbr: string = homeComp.team?.abbreviation ?? '';
    const awayAbbr: string = awayComp.team?.abbreviation ?? '';

    if (!espnHome || !espnAway) continue;

    const canonHome = resolveESPNName(espnHome);
    const canonAway = resolveESPNName(espnAway);

    const kickoffAt = ev.date as string;
    const roundName: string = ev.season?.type?.name ?? 'Group';
    const stage = espnRoundToStage(roundName);

    const homeFlag = getFlag(canonHome, homeAbbr);
    const awayFlag = getFlag(canonAway, awayAbbr);

    // Try to find matching TxLINE fixture by team names first
    const key = `${normalizeTeam(canonHome)}__${normalizeTeam(canonAway)}`;
    const keyRev = `${normalizeTeam(canonAway)}__${normalizeTeam(canonHome)}`;
    const staticMatch = staticByTeams.get(key) ?? staticByTeams.get(keyRev);

    let fixtureId: string;

    if (staticMatch) {
      // Exact team name match — use the known TxLINE ID
      fixtureId = staticMatch.fixtureId;
    } else {
      // No name match — knockout with changed teams: assign by slot order
      const slotKey = stage === 'final' && roundName.toLowerCase().includes('third') ? 'third' : stage;
      const slots = TXLINE_SLOTS[slotKey] ?? [];
      const idx = slotCounters[slotKey] ?? 0;
      fixtureId = slots[idx] ?? `espn_${ev.id}`;
      slotCounters[slotKey] = idx + 1;
    }

    fixtures.push({
      fixtureId,
      homeTeam: canonHome,
      awayTeam: canonAway,
      homeFlag,
      awayFlag,
      kickoffAt,
      stage,
    });
  }

  return NextResponse.json(fixtures, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
