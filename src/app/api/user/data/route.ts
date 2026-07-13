import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('user_data')
    .select('card_collection, pack_opened, lineups, profile, updated_at')
    .eq('wallet_address', wallet)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? null, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    wallet: string;
    cardCollection?: unknown;
    packOpened?: unknown;
    lineups?: unknown;
    profile?: unknown;
  };

  const { wallet, cardCollection, packOpened, lineups, profile } = body;
  if (!wallet) {
    return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Merge pack_opened with existing value so partial updates (e.g. tutorialSeen)
  // don't overwrite other fields (e.g. welcomeGiftClaimed).
  let mergedPackOpened = packOpened;
  if (packOpened !== undefined) {
    const { data: existing } = await supabase
      .from('user_data')
      .select('pack_opened')
      .eq('wallet_address', wallet)
      .maybeSingle();
    const prev = (existing?.pack_opened && typeof existing.pack_opened === 'object')
      ? existing.pack_opened as Record<string, unknown>
      : {};
    mergedPackOpened = { ...prev, ...(packOpened as Record<string, unknown>) };
  }

  const { error } = await supabase
    .from('user_data')
    .upsert(
      {
        wallet_address: wallet,
        ...(cardCollection !== undefined && { card_collection: cardCollection }),
        ...(mergedPackOpened !== undefined && { pack_opened: mergedPackOpened }),
        ...(lineups !== undefined && { lineups }),
        ...(profile !== undefined && { profile }),
      },
      { onConflict: 'wallet_address' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Keep the users table in sync so the leaderboard picks up the latest display name
  if (profile && typeof profile === 'object') {
    const p = profile as Record<string, unknown>;
    if (p.username) {
      await supabase.from('users').upsert(
        {
          wallet_address: wallet,
          username: p.username as string,
          ...(p.avatar ? { avatar_url: p.avatar as string } : {}),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'wallet_address' }
      );
    }
  }

  return NextResponse.json({ success: true });
}
