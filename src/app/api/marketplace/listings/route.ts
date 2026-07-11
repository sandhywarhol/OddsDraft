import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/marketplace/listings?seller=<wallet>
// Returns all active listings, optionally filtered by seller wallet.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const seller = searchParams.get('seller');

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
