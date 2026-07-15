import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

// GET /api/live/finished
// Returns { [fixtureId]: { home, away } } for every fixture that has a
// game_finalised row in live_match_events — the authoritative "match is over"
// signal our own cron/ESPN fallback writes. The contests/schedule list page
// otherwise only trusts ESPN's public completed flag or wall-clock time, which
// don't know about matches that finished on TxLINE's own (e.g. devnet) timeline
// decoupled from our static schedule, leaving them stuck under "Upcoming".
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('live_match_events')
      .select('fixture_id, home_score, away_score')
      .eq('event_type', 'game_finalised');

    if (error) {
      console.error('[live/finished] Supabase error:', error.message);
      return NextResponse.json({}, { status: 200 });
    }

    const result: Record<string, { home: number; away: number }> = {};
    for (const row of data ?? []) {
      result[row.fixture_id] = { home: row.home_score ?? 0, away: row.away_score ?? 0 };
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (err: any) {
    console.error('[live/finished] unexpected error:', err?.message ?? err);
    return NextResponse.json({}, { status: 200 });
  }
}
