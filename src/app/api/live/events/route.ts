// GET /api/live/events?fixtureId=xxx
// Returns match events stored by the cron from server-side TxLINE polling.
// Clients use this as a fallback when browser-direct TxLINE calls are blocked.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';

// Events that cannot logically exist before kick off (stale simulate-match data guard)
const PRE_KICKOFF_BLOCKED = new Set(['goal', 'own_goal', 'half_time', 'full_time', 'extra_time']);

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  try {
    const fixtureId = new URL(req.url).searchParams.get('fixtureId');
    if (!fixtureId) return NextResponse.json([], { status: 200 });

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('live_match_events')
      .select('*')
      .eq('fixture_id', fixtureId)
      .order('minute', { ascending: true });

    if (error) {
      console.error('[live/events] Supabase error:', error.message);
      return NextResponse.json([], { status: 200 });
    }

    let rows = data ?? [];

    // For real WC2026 fixtures that haven't kicked off yet, strip out any scoring/completion
    // events — these are stale data (e.g. from simulate-match testing) and must not be
    // processed before the match starts.
    const wcFixture = WC2026_FIXTURES.find(f => f.fixtureId === fixtureId);
    if (wcFixture) {
      const kickoffMs = new Date(wcFixture.kickoffAt).getTime();
      if (Date.now() < kickoffMs) {
        rows = rows.filter(r => !PRE_KICKOFF_BLOCKED.has(r.event_type ?? r.type ?? ''));
      }
    }

    return NextResponse.json(rows, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err: any) {
    console.error('[live/events] unexpected error:', err?.message ?? err);
    return NextResponse.json([], { status: 200 });
  }
}
