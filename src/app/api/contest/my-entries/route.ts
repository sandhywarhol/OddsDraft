import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/contest/my-entries?wallet=X
// Returns every contest_entries row for a wallet in ONE query — the authoritative,
// cross-device answer to "which contests has this wallet entered, with what lineup".
// Replaces (a) the N-per-fixture check-entry calls on the contests page and (b) the
// device-local localStorage scan the profile page used for its Match History.
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ entries: [] });
  }

  const { data, error } = await supabase
    .from('contest_entries')
    .select('fixture_id, contest_type, lineup, created_at')
    .eq('wallet_address', wallet)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[contest/my-entries]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}
