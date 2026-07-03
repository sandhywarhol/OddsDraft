import { NextRequest, NextResponse } from 'next/server';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';

export interface MatchEvent {
  minute: string;
  type: 'goal' | 'own_goal' | 'penalty' | 'yellow_card' | 'red_card' | 'yellow_red_card' | 'sub';
  player: string;
  assist?: string;
  team: string;
  teamFlag?: string;
}

export interface MatchResult {
  events: MatchEvent[];
  venue?: string;
  attendance?: string;
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

async function fetchDayEvents(dateStr: string): Promise<any[]> {
  const now = Date.now();
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

async function fetchEventDetail(internalRef: string): Promise<any> {
  try {
    const r = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${internalRef}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 1800 } }
    );
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

// ── Route ─────────────────────────────────────────────────────────────────────

// GET /api/match/result?fixtureId=18176123
// Returns goals, cards, venue and attendance for a completed fixture.
// Data is sourced and normalised server-side; no third-party service is
// referenced in the public request or response.
export async function GET(req: NextRequest) {
  const fixtureId = new URL(req.url).searchParams.get('fixtureId');
  if (!fixtureId) return NextResponse.json({ error: 'Missing fixtureId' }, { status: 400 });

  // Look up fixture from our own schedule
  const fixture = WC2026_FIXTURES.find(f => f.fixtureId === fixtureId);
  if (!fixture) return NextResponse.json({ events: [] });

  // Find the matching event from the scoreboard for the fixture's date
  const kickoff = new Date(fixture.kickoffAt);
  const dateStr = fmtUTC(kickoff);
  const dayEvents = await fetchDayEvents(dateStr);

  const event = dayEvents.find(ev => {
    const comp = ev.competitions?.[0];
    if (!comp) return false;
    const home = comp.competitors?.find((c: any) => c.homeAway === 'home');
    const away = comp.competitors?.find((c: any) => c.homeAway === 'away');
    const h = home?.team?.displayName ?? home?.team?.name ?? '';
    const a = away?.team?.displayName ?? away?.team?.name ?? '';
    return teamsMatch(fixture.homeTeam, h) && teamsMatch(fixture.awayTeam, a);
  });

  if (!event?.id) return NextResponse.json({ events: [] });

  // Fetch full match detail using the internal reference
  const detail = await fetchEventDetail(event.id);
  if (!detail) return NextResponse.json({ events: [] });

  const events: MatchEvent[] = [];

  // Goals and scoring plays
  for (const play of (detail.scoringPlays ?? [])) {
    const type = eventType(play.type?.text ?? '', play.scoringPlay?.scoringType ?? '');
    const text: string = play.text ?? '';
    const assistMatch = text.match(/\(([^)]+)\)/);
    const player = text.replace(/\s*\([^)]*\)/, '').trim();
    const teamName: string = play.team?.displayName ?? play.team?.name ?? '';
    // Map scoreboard team name back to our fixture team name
    const team = teamsMatch(fixture.homeTeam, teamName) ? fixture.homeTeam
      : teamsMatch(fixture.awayTeam, teamName) ? fixture.awayTeam
      : teamName;
    events.push({ minute: play.clock?.displayValue ?? '?', type, player, assist: assistMatch?.[1], team });
  }

  // Cards from key events
  for (const play of (detail.keyEvents ?? detail.keyPlays ?? [])) {
    const typeText = play.type?.text ?? '';
    if (!typeText.toLowerCase().includes('card')) continue;
    const type = eventType(typeText);
    const teamName: string = play.team?.displayName ?? play.team?.name ?? '';
    const team = teamsMatch(fixture.homeTeam, teamName) ? fixture.homeTeam
      : teamsMatch(fixture.awayTeam, teamName) ? fixture.awayTeam
      : teamName;
    events.push({
      minute: play.clock?.displayValue ?? '?',
      type,
      player: play.participants?.[0]?.athlete?.displayName ?? play.text ?? '',
      team,
    });
  }

  events.sort((a, b) => (parseInt(a.minute) || 0) - (parseInt(b.minute) || 0));

  // Venue / attendance — strip third-party source names from values
  const gameInfo = detail.gameInfo ?? detail.header?.competitions?.[0];
  const venue = gameInfo?.venue?.fullName ?? gameInfo?.venue?.name;
  const attendance = gameInfo?.attendance != null ? Number(gameInfo.attendance).toLocaleString() : undefined;

  const result: MatchResult = { events, venue, attendance };
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400' },
  });
}
