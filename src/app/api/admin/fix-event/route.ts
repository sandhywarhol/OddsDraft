import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/admin/fix-event  { fixtureId, eventId, playerName }
// One-off correction for a live_match_events row whose player_name failed to resolve
// at record time (e.g. the cron's player-ID map missed a squad player) and is now
// permanently stuck — the cron never reprocesses an event once it's in notified_events.
// Protected by CRON_SECRET, same as /api/fixture-remap.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { fixtureId, eventId, playerName } = body as { fixtureId: string; eventId: string; playerName: string };
  if (!fixtureId || !eventId || !playerName) {
    return NextResponse.json({ error: 'fixtureId, eventId and playerName are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('live_match_events')
    .update({ player_name: playerName })
    .eq('fixture_id', fixtureId)
    .eq('event_id', eventId)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, updated: data });
}
