import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fixtureId = searchParams.get('fixture');
  const contestType = searchParams.get('contestType');

  if (!fixtureId) {
    return NextResponse.json({ error: 'Missing fixture' }, { status: 400 });
  }

  let query = supabase
    .from('contest_entries')
    .select('wallet_address, contest_type, created_at')
    .eq('fixture_id', fixtureId)
    .order('created_at', { ascending: true });

  if (contestType) {
    query = query.eq('contest_type', contestType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[contest/leaderboard]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ participants: data ?? [] });
}
