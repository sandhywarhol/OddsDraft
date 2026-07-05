// GET /api/live/events?fixtureId=xxx
// Returns match events stored by the cron from server-side TxLINE polling.
// Clients use this as a fallback when browser-direct TxLINE calls are blocked.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const fixtureId = req.nextUrl.searchParams.get('fixtureId');
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

  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 'no-store' },
  });
}
