import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fixtureId = searchParams.get('fixtureId');
  const walletAddress = searchParams.get('walletAddress');
  const contestType = searchParams.get('contestType');

  if (!fixtureId || !walletAddress) {
    return NextResponse.json({ entered: false, contestTypes: [] });
  }

  // No contestType → return all contestTypes this wallet entered for this fixture
  if (!contestType) {
    const { data } = await supabase
      .from('contest_entries')
      .select('contest_type')
      .eq('fixture_id', fixtureId)
      .eq('wallet_address', walletAddress);
    const contestTypes = (data ?? []).map((r: { contest_type: string }) => r.contest_type);
    return NextResponse.json({ contestTypes });
  }

  const { data } = await supabase
    .from('contest_entries')
    .select('id')
    .eq('fixture_id', fixtureId)
    .eq('wallet_address', walletAddress)
    .eq('contest_type', contestType)
    .maybeSingle();

  return NextResponse.json({ entered: !!data });
}
