import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fixtureId = searchParams.get('fixtureId');
  const contestType = searchParams.get('contestType');
  const wallet = searchParams.get('wallet');

  if (!fixtureId || !contestType || !wallet) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  // Check contest result (prize amount)
  const { data: result } = await supabase
    .from('contest_results')
    .select('rank, points, prize_sol')
    .eq('fixture_id', fixtureId)
    .eq('contest_type', contestType)
    .eq('wallet_address', wallet)
    .maybeSingle();

  if (!result) {
    return NextResponse.json({ found: false });
  }

  // Check if already claimed
  const { data: claim } = await supabase
    .from('prize_claims')
    .select('tx_signature, claimed_at')
    .eq('fixture_id', fixtureId)
    .eq('contest_type', contestType)
    .eq('wallet_address', wallet)
    .maybeSingle();

  return NextResponse.json({
    found: true,
    rank: result.rank,
    points: result.points,
    prizeSol: result.prize_sol,
    claimed: !!claim,
    txSignature: claim?.tx_signature ?? null,
    claimedAt: claim?.claimed_at ?? null,
  });
}
