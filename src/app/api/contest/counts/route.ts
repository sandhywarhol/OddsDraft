import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/contest/counts?fixtures=id1,id2,id3
// Returns { [fixtureId]: { total: N, top3: N, '5050': N, wta: N, prizePool: X } }
export async function GET(req: NextRequest) {
  const fixtureParam = req.nextUrl.searchParams.get('fixtures');
  if (!fixtureParam) {
    return NextResponse.json({});
  }

  const fixtureIds = fixtureParam.split(',').filter(Boolean);

  const { data, error } = await supabase
    .from('contest_entries')
    .select('fixture_id, contest_type')
    .in('fixture_id', fixtureIds);

  if (error) {
    return NextResponse.json({}, { status: 500 });
  }

  type FixtureCounts = {
    total: number; top3: number; '5050': number; wta: number;
    prizePool: number; top3Pool: number; fiftyFiftyPool: number; wtaPool: number;
  };
  // Aggregate counts and prize pools per fixture per contest type.
  // Prize pool = participants × 0.1 SOL — 100% returned to winners, no platform cut.
  const counts: Record<string, FixtureCounts> = {};

  for (const row of (data ?? [])) {
    const fid = row.fixture_id;
    if (!counts[fid]) counts[fid] = { total: 0, top3: 0, '5050': 0, wta: 0, prizePool: 0, top3Pool: 0, fiftyFiftyPool: 0, wtaPool: 0 };
    counts[fid].total++;
    if (row.contest_type === 'top3') { counts[fid].top3++; counts[fid].top3Pool = parseFloat((counts[fid].top3 * 0.1).toFixed(4)); }
    if (row.contest_type === '5050') { counts[fid]['5050']++; counts[fid].fiftyFiftyPool = parseFloat((counts[fid]['5050'] * 0.1).toFixed(4)); }
    if (row.contest_type === 'wta')  { counts[fid].wta++;  counts[fid].wtaPool = parseFloat((counts[fid].wta * 0.1).toFixed(4)); }
    counts[fid].prizePool = parseFloat((counts[fid].total * 0.1).toFixed(4));
  }

  return NextResponse.json(counts);
}
