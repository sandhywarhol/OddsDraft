import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFixtureIdRemap, invalidateRemapCache } from '@/lib/fixture-remap';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/fixture-remap
// Returns { ourId: txlineId, ... } for all known fixtures.
// Used by the live page (client-side) to resolve our placeholder IDs to real TxLINE IDs.
export async function GET() {
  const remap = await getFixtureIdRemap();
  return NextResponse.json(remap, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
  });
}

// POST /api/fixture-remap  { ourId, txlineId }
// Upsert a mapping. Protected by CRON_SECRET so only admins can call it.
// After a successful upsert the server cache is invalidated so the next GET
// returns fresh data immediately.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const ourId: string = body.ourId;
  const txlineId: string = body.txlineId;

  if (!ourId || !txlineId) {
    return NextResponse.json({ error: 'ourId and txlineId are required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('fixture_id_remap')
    .upsert({ our_id: ourId, txline_id: txlineId }, { onConflict: 'our_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  invalidateRemapCache();
  return NextResponse.json({ ok: true, ourId, txlineId });
}
