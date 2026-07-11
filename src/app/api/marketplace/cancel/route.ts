import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';
import { deriveListingPDA } from '@/lib/oddsdraft-anchor';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const connection = new Connection(
  process.env.SERVER_SOLANA_RPC ?? 'https://api.devnet.solana.com'
);

// POST /api/marketplace/cancel
// Body: { txSignature, sellerWallet, cardId }
// Verifies the on-chain cancel_listing tx then marks the listing cancelled in Supabase.
export async function POST(req: NextRequest) {
  try {
    const { txSignature, sellerWallet, instanceId, cardId } = await req.json();

    if (!txSignature || !sellerWallet || !cardId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tx = await connection.getTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });
    if (!tx || tx.meta?.err) {
      return NextResponse.json({ error: 'Transaction not confirmed or failed' }, { status: 400 });
    }

    // PDA was keyed by instanceId (or cardId for old listings)
    const pdaKey = instanceId ?? cardId;
    const [listingPDA] = deriveListingPDA(new PublicKey(sellerWallet), pdaKey);
    let pdaInfo = await connection.getAccountInfo(listingPDA, 'confirmed');
    for (let attempt = 0; attempt < 3 && pdaInfo; attempt++) {
      await new Promise(r => setTimeout(r, 2000));
      pdaInfo = await connection.getAccountInfo(listingPDA, 'confirmed');
    }
    if (pdaInfo) {
      return NextResponse.json({ error: 'Listing PDA still open — cancel may not have run' }, { status: 400 });
    }

    await supabase
      .from('card_listings')
      .update({ status: 'cancelled' })
      .eq('listing_pda', listingPDA.toString())
      .eq('seller_wallet', sellerWallet)
      .eq('status', 'active');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}
