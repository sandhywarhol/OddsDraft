import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';
import { mergeEvents } from '@/lib/txline';
import {
  calculatePlayerPerformanceBonus,
  calculateTeamStats,
  calculateTotalFantasyPoints,
  type PlayerMatchStats,
} from '@/lib/fantasy-analytics';
import { applySkillModifier } from '@/lib/card-collection';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/fantasy/performance-bonus
// Calculate halftime/fulltime performance bonuses + skill card info for all players
// Request body: { fixtureId, timepoint: 'halftime' | 'fulltime', contestId, walletAddress, playerPositions: {playerId: position} }
// Returns: { playerId: { performanceBonus, skillCardId?, skillCardName? } }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fixtureId, timepoint, contestId, walletAddress, playerPositions } = body;

    if (!fixtureId || !timepoint) {
      return NextResponse.json(
        { error: 'Missing fixtureId or timepoint' },
        { status: 400 }
      );
    }

    // Fetch user's lineup with equipped cards if provided
    let equippedCards: Record<string, { instanceId: string; cardId: string }> = {};
    if (contestId && walletAddress) {
      const { data: entry } = await supabase
        .from('contest_entries')
        .select('lineup')
        .eq('fixture_id', fixtureId)
        .eq('wallet_address', walletAddress)
        .single();

      if (entry?.lineup?.equippedCards) {
        equippedCards = entry.lineup.equippedCards;
      }
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

    // Calculate bonuses per player + include equipped skill card info
    const bonuses: Record<string, { performanceBonus: number; skillCard?: { cardId: string; instanceId: string } }> = {};

    for (const [playerId, stats] of Object.entries(playerStats)) {
      const position = playerPositions?.[playerId] ?? 'MID';
      const performanceBonus = calculatePlayerPerformanceBonus(
        playerId,
        stats,
        position,
        homeTeamStats,
        awayTeamStats
      );

      bonuses[playerId] = {
        performanceBonus: performanceBonus.totalBonus,
      };

      // Include equipped skill card if available
      if (equippedCards[playerId]) {
        bonuses[playerId].skillCard = {
          cardId: equippedCards[playerId].cardId,
          instanceId: equippedCards[playerId].instanceId,
        };
      }
    }

    // Store in Supabase for persistence
    if (walletAddress) {
      const rowsToInsert = Object.entries(bonuses).map(([playerId, data]: [string, any]) => ({
        fixture_id: fixtureId,
        wallet_address: walletAddress,
        player_id: playerId,
        performance_bonus: data.performanceBonus ?? 0,
        skill_card_bonus: data.skillCard ? 0 : 0, // Will be calculated on frontend
        timepoint,
        calculated_at: new Date().toISOString(),
      }));

      // Upsert to avoid duplicates (same player in same fixture at same timepoint)
      if (rowsToInsert.length > 0) {
        try {
          await supabase
            .from('match_performance_bonuses')
            .upsert(rowsToInsert, {
              onConflict: 'fixture_id,wallet_address,player_id,timepoint',
            });
        } catch (err) {
          console.warn('[PerformanceBonus] Supabase upsert failed:', err);
        }
      }
    }

    return NextResponse.json({
      bonuses,
      timepoint,
      calculatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[PerformanceBonus] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
