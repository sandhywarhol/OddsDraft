import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPrizeForRank } from '@/lib/fantasy-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface LeaderboardEntry {
  walletAddress: string;
  rank: number;
  points: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fixtureId, contestType, leaderboard, participantCount } = body as {
      fixtureId: string;
      contestType: string;
      leaderboard: LeaderboardEntry[];
      participantCount: number;
    };

    if (!fixtureId || !contestType || !Array.isArray(leaderboard) || leaderboard.length === 0) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const rows = leaderboard
      .filter(e => e.walletAddress && e.walletAddress !== 'YOUR WALLET')
      .map(e => ({
        fixture_id: fixtureId,
        contest_type: contestType,
        wallet_address: e.walletAddress,
        rank: e.rank,
        points: e.points,
        prize_sol: getPrizeForRank(e.rank, contestType, participantCount),
      }));

    if (rows.length === 0) {
      return NextResponse.json({ success: true, inserted: 0 });
    }

    const { error, count } = await supabase
      .from('contest_results')
      .upsert(rows, { onConflict: 'fixture_id,contest_type,wallet_address', ignoreDuplicates: true });

    if (error) {
      console.error('[prize/submit]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, inserted: rows.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
