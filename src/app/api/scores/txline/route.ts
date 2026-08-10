import { NextResponse } from 'next/server';
import { fetchAllLeaguesFixtures } from '@/lib/espn';
import { LEAGUES } from '@/lib/leagues';

// GET /api/scores/txline
// Previously sourced from TxLINE snapshot. Now uses ESPN scoreboard.
// Returns { [espnEventId]: { home, away, completed } }
export async function GET() {
  try {
    const leagueSlugs = LEAGUES.map(l => l.espnSlug);
    const fixtures = await fetchAllLeaguesFixtures(leagueSlugs);

    const results: Record<string, { home: number; away: number; completed: boolean }> = {};

    for (const f of fixtures) {
      if (f.homeScore === null || f.awayScore === null) continue;
      results[f.espnId] = {
        home: f.homeScore,
        away: f.awayScore,
        completed: f.completed,
      };
    }

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30' },
    });
  } catch (err) {
    console.error('[scores/txline] ESPN fetch error:', err);
    return NextResponse.json({}, { status: 502 });
  }
}
