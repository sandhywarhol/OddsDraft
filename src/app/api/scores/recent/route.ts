import { NextResponse } from 'next/server';
import { fetchAllLeaguesFixtures, resolveTeamName } from '@/lib/espn';
import { LEAGUES } from '@/lib/leagues';
import { getTeamFlag } from '@/lib/fixtures';

export type RecentScore = {
  homeTeam: string; awayTeam: string;
  homeFlag: string; awayFlag: string;
  kickoffAt: string;
  scoreHome: number | null; scoreAway: number | null;
  leagueId: string;
  source: 'espn';
};

// GET /api/scores/recent
// Returns up to 5 recently finished or live matches from all leagues.
// Now sourced entirely from ESPN free API.
export async function GET() {
  const now = Date.now();
  const cutoff = now - 48 * 3_600_000; // last 48 hours

  const results: RecentScore[] = [];

  try {
    // Fetch from all leagues for the past 2 days
    const dateStr = (ms: number) => {
      const d = new Date(ms);
      return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
    };

    const dates = [
      dateStr(now - 2 * 86_400_000),
      dateStr(now - 86_400_000),
      dateStr(now),
    ].join(',');

    const leagueSlugs = LEAGUES.map(l => l.espnSlug);
    const fixtures = await fetchAllLeaguesFixtures(leagueSlugs, dates);

    for (const f of fixtures) {
      if (!f.kickoffAt) continue;
      const kickoffMs = new Date(f.kickoffAt).getTime();
      if (kickoffMs < cutoff || kickoffMs > now + 90 * 60_000) continue;
      // Must be finished or live
      if (f.statusState === 'pre' && f.homeScore === null) continue;
      if (f.homeScore === null && f.awayScore === null) continue;

      results.push({
        homeTeam: resolveTeamName(f.homeTeam),
        awayTeam: resolveTeamName(f.awayTeam),
        homeFlag: f.homeLogo || getTeamFlag(f.homeTeam),
        awayFlag: f.awayLogo || getTeamFlag(f.awayTeam),
        kickoffAt: f.kickoffAt,
        scoreHome: f.homeScore,
        scoreAway: f.awayScore,
        leagueId: f.leagueId,
        source: 'espn',
      });
    }
  } catch (err) {
    console.error('[scores/recent] ESPN fetch failed:', err);
  }

  const sorted = results
    .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime())
    .slice(0, 5);

  return NextResponse.json(sorted, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
