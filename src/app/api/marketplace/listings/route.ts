import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/marketplace/listings?seller=<wallet>&include_sold=true
// Returns active listings for the marketplace. When seller is provided with
// include_sold=true, also returns recently sold listings (last 30 days) so the
// seller can see the SOLD notification and acknowledge it.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const seller = searchParams.get('seller');
  const includeSold = searchParams.get('include_sold') === 'true';

  if (seller && includeSold) {
    // Return both active and recently sold listings for this seller
    const { data, error } = await supabase
      .from('card_listings')
      .select('*')
      .eq('seller_wallet', seller)
      .in('status', ['active', 'sold'])
      .gte('created_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ listings: data ?? [] });
  }

  let query = supabase
    .from('card_listings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (seller) {
    query = query.eq('seller_wallet', seller);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listings: data ?? [] });
}
