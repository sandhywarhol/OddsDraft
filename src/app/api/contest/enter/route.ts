import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fixtureId, walletAddress, contestType, lineup, entryTxSig } = body;

    if (!fixtureId || !walletAddress || !contestType || !lineup) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('contest_entries')
      .upsert(
        {
          fixture_id: fixtureId,
          wallet_address: walletAddress,
          contest_type: contestType,
          lineup,
          entry_tx_sig: entryTxSig ?? null,
        },
        { onConflict: 'fixture_id,wallet_address,contest_type', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (error) {
      console.error('[contest/enter]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Upsert user record
    await supabase
      .from('users')
      .upsert(
        { wallet_address: walletAddress, updated_at: new Date().toISOString() },
        { onConflict: 'wallet_address', ignoreDuplicates: true }
      );

    return NextResponse.json({ success: true, entryId: data?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
