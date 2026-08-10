import { NextRequest, NextResponse } from 'next/server';
import { fetchEspnFixtures, resolveTeamName } from '@/lib/espn';
import { LEAGUES } from '@/lib/leagues';
import type { Fixture } from '@/lib/fixtures';

// ── Emoji flags for national teams ────────────────────────────────────────────
const NATIONAL_FLAGS: Record<string, string> = {
  'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Australia': '🇦🇺', 'Turkey': '🇹🇷',
  'Germany': '🇩🇪', 'Netherlands': '🇳🇱', 'Japan': '🇯🇵', 'Spain': '🇪🇸',
  'France': '🇫🇷', 'Argentina': '🇦🇷', 'Portugal': '🇵🇹', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Brazil': '🇧🇷', 'Belgium': '🇧🇪', 'Italy': '🇮🇹', 'Croatia': '🇭🇷',
  'Morocco': '🇲🇦', 'USA': '🇺🇸', 'Mexico': '🇲🇽', 'Canada': '🇨🇦',
  'Switzerland': '🇨🇭', 'Denmark': '🇩🇰', 'Poland': '🇵🇱', 'Norway': '🇳🇴',
  'Sweden': '🇸🇪', 'Serbia': '🇷🇸', 'Ukraine': '🇺🇦', 'Albania': '🇦🇱',
  'Austria': '🇦🇹', 'Colombia': '🇨🇴', 'Uruguay': '🇺🇾', 'Chile': '🇨🇱',
  'Ecuador': '🇪🇨', 'Peru': '🇵🇪', 'Senegal': '🇸🇳', 'Nigeria': '🇳🇬',
  'Ghana': '🇬🇭', 'Cameroon': '🇨🇲', 'Egypt': '🇪🇬', 'Algeria': '🇩🇿',
  'Tunisia': '🇹🇳', 'Mali': '🇲🇱', 'South Africa': '🇿🇦', 'Congo DR': '🇨🇩',
  'Ivory Coast': '🇨🇮', 'Saudi Arabia': '🇸🇦', 'Iran': '🇮🇷', 'South Korea': '🇰🇷',
  'Qatar': '🇶🇦', 'United Arab Emirates': '🇦🇪',
};

function getTeamFlag(teamName: string): string {
  return NATIONAL_FLAGS[teamName] ?? '⚽';
}

function dateStr(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

// GET /api/schedule/[leagueId]
// Returns Fixture[] for the requested league, sourced directly from ESPN.
// leagueId = our internal ID (e.g. 'eng.1', 'esp.1') OR 'all' for every league.
// Query params:
//   dates=YYYYMMDD,YYYYMMDD,...  (optional; defaults to today + next 7 days)
//   range=7 (optional; number of days from today)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
  const { searchParams } = new URL(req.url);
  const datesParam = searchParams.get('dates');
  // Fetch up to 30 days ahead by default so users see upcoming matches even before seasons start
  const rangeParam = parseInt(searchParams.get('range') ?? '30', 10);

  // Build date range string
  let dateRangeStr: string;
  if (datesParam) {
    dateRangeStr = datesParam; // Assume it's already formatted properly, e.g. YYYYMMDD-YYYYMMDD
  } else {
    const now = Date.now();
    // Past 2 days to next N days
    const startDate = dateStr(now - 2 * 86_400_000);
    const endDate = dateStr(now + rangeParam * 86_400_000);
    dateRangeStr = `${startDate}-${endDate}`;
  }

  // Determine which league slugs to query
  let slugs: { slug: string; id: string }[];
  if (leagueId === 'all') {
    slugs = LEAGUES.map(l => ({ slug: l.espnSlug, id: l.id }));
  } else {
    const league = LEAGUES.find(l => l.id === leagueId || l.espnSlug === leagueId);
    if (!league) {
      return NextResponse.json({ error: `Unknown league: ${leagueId}` }, { status: 404 });
    }
    slugs = [{ slug: league.espnSlug, id: league.id }];
  }

  const allFixtures: Fixture[] = [];

  await Promise.allSettled(
    slugs.map(async ({ slug, id }) => {
      try {
        const espnFixtures = await fetchEspnFixtures(slug, dateRangeStr, id);
        for (const ef of espnFixtures) {
          allFixtures.push({
            fixtureId: ef.espnId,
            leagueId: ef.leagueId,
            homeTeam: resolveTeamName(ef.homeTeam),
            awayTeam: resolveTeamName(ef.awayTeam),
            homeTeamId: ef.homeTeamId,
            awayTeamId: ef.awayTeamId,
            homeFlag: ef.homeLogo || getTeamFlag(ef.homeTeam),
            awayFlag: ef.awayLogo || getTeamFlag(ef.awayTeam),
            kickoffAt: ef.kickoffAt,
            stage: 'regular',
            homeScore: ef.homeScore ?? undefined,
            awayScore: ef.awayScore ?? undefined,
            completed: ef.completed,
          });
        }
      } catch (err) {
        console.warn(`[schedule/${id}] ESPN fetch failed:`, err);
      }
    })
  );

  // Sort by kickoff
  allFixtures.sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());

  return NextResponse.json(allFixtures, {
    headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
  });
}
