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

  const { data: usdcData, error: usdcError } = await supabase
    .from('usdc_entries')
    .select('fixture_id, usdc_amount')
    .in('fixture_id', fixtureIds);

  if (error && usdcError) {
    return NextResponse.json({}, { status: 500 });
  }

  type FixtureCounts = {
    total: number; top3: number; '5050': number; wta: number; usdc_pool: number;
    prizePool: number; top3Pool: number; fiftyFiftyPool: number; wtaPool: number; usdcPool: number;
  };

  const counts: Record<string, FixtureCounts> = {};

  const initCounts = (fid: string) => {
    if (!counts[fid]) counts[fid] = { total: 0, top3: 0, '5050': 0, wta: 0, usdc_pool: 0, prizePool: 0, top3Pool: 0, fiftyFiftyPool: 0, wtaPool: 0, usdcPool: 0 };
  };

  for (const row of (data ?? [])) {
    const fid = row.fixture_id;
    initCounts(fid);
    counts[fid].total++;
    if (row.contest_type === 'top3') { counts[fid].top3++; counts[fid].top3Pool = parseFloat((counts[fid].top3 * 0.1).toFixed(4)); }
    if (row.contest_type === '5050') { counts[fid]['5050']++; counts[fid].fiftyFiftyPool = parseFloat((counts[fid]['5050'] * 0.1).toFixed(4)); }
    if (row.contest_type === 'wta')  { counts[fid].wta++;  counts[fid].wtaPool = parseFloat((counts[fid].wta * 0.1).toFixed(4)); }
    counts[fid].prizePool = parseFloat(( (counts[fid].total - counts[fid].usdc_pool) * 0.1).toFixed(4));
  }

  for (const row of (usdcData ?? [])) {
    const fid = row.fixture_id;
    initCounts(fid);
    counts[fid].total++;
    counts[fid].usdc_pool++;
    const microUsdc = Number(row.usdc_amount || 0);
    counts[fid].usdcPool += (microUsdc / 1000000);
  }

  return NextResponse.json(counts);
}
