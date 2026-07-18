import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SCORING_EVENTS, computeParticipantPoints } from '@/lib/contest-scoring';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
    .select('wallet_address, contest_type, created_at, lineup')
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

  // Live in-progress points — same scoring source (live_match_events, populated by the
  // server-side cron poller, independent of any single viewer's browser) and same pure
  // scoring function used for the final, money-authoritative /api/prize/submit pass. This
  // is a read-only preview: it never writes contest_results, so it can't affect payouts.
  const { data: dbEvents } = await supabase
    .from('live_match_events')
    .select('event_type, player_name, team_name, minute')
    .eq('fixture_id', fixtureId)
    .order('minute', { ascending: true });
  const events = (dbEvents ?? []).filter(e => SCORING_EVENTS.has(e.event_type));

  const participants = (data ?? []).map(entry => ({
    wallet_address: entry.wallet_address,
    contest_type: entry.contest_type,
    created_at: entry.created_at,
    points: computeParticipantPoints(entry.lineup, events),
  }));

  return NextResponse.json({ participants }, { headers: { 'Cache-Control': 'no-store' } });
}
