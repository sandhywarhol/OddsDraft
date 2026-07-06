import { NextRequest, NextResponse } from 'next/server';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';
import { mergeEvents } from '@/lib/txline';
import {
  calculatePlayerPerformanceBonus,
  calculateTeamStats,
  applyStarMultiplier,
  type PlayerMatchStats,
} from '@/lib/fantasy-analytics';

// POST /api/fantasy/performance-bonus
// Calculate halftime/fulltime performance bonuses for all players in a fixture
// Request body: { fixtureId, timepoint: 'halftime' | 'fulltime', playerPositions: {playerId: position} }
// Returns: { playerId: totalBonus }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fixtureId, timepoint, playerPositions } = body;

    if (!fixtureId || !timepoint) {
      return NextResponse.json(
        { error: 'Missing fixtureId or timepoint' },
        { status: 400 }
      );
    }

    const fixture = WC2026_FIXTURES.find(f => f.fixtureId === fixtureId);
    if (!fixture) {
      return NextResponse.json(
        { error: 'Fixture not found' },
        { status: 404 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app';

    // Fetch latest TxLINE score update
    const scoreRes = await fetch(
      `${appUrl}/api/txline/api/scores/updates/${fixtureId}`,
      { cache: 'no-store' }
    );

    if (!scoreRes.ok) {
      return NextResponse.json({ bonuses: {} });
    }

    const scoreArr = await scoreRes.json();
    const raw = Array.isArray(scoreArr) && scoreArr.length > 0
      ? mergeEvents(scoreArr)
      : (scoreArr ?? {});

    // Extract PlayerStats
    const playerStats: Record<string, PlayerMatchStats> = {};
    const ps = (raw as any)?.PlayerStats ?? {};

    for (const part of ['Participant1', 'Participant2']) {
      const players = ps[part];
      if (!players || typeof players !== 'object') continue;

      for (const [playerId, stats] of Object.entries(players as Record<string, any>)) {
        playerStats[playerId] = {
          playerId,
          goals: Number(stats.goals ?? 0),
          assists: Number(stats.assists ?? 0),
          yellowCards: Number(stats.yellowCards ?? 0),
          redCards: Number(stats.redCards ?? 0),
          saves: Number(stats.saves ?? 0),
          ownGoals: Number(stats.ownGoals ?? 0),
          participant: part === 'Participant1' ? 1 : 2,
        };
      }
    }

    // Calculate team aggregates
    const homeTeamStats = calculateTeamStats(playerStats, 1, fixture.homeTeam);
    const awayTeamStats = calculateTeamStats(playerStats, 2, fixture.awayTeam);

    // Add goal data from match score
    const score = (raw as any)?.Score ?? {};
    homeTeamStats.goalsFor = score?.Participant1?.Total?.Goals ?? 0;
    awayTeamStats.goalsFor = score?.Participant2?.Total?.Goals ?? 0;

    // Calculate bonuses per player
    const bonuses: Record<string, number> = {};

    for (const [playerId, stats] of Object.entries(playerStats)) {
      const position = playerPositions?.[playerId] ?? 'MID';
      const bonus = calculatePlayerPerformanceBonus(
        playerId,
        stats,
        position,
        homeTeamStats,
        awayTeamStats
      );

      bonuses[playerId] = bonus.totalBonus;
    }

    return NextResponse.json({ bonuses, timepoint, calculatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[PerformanceBonus] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
