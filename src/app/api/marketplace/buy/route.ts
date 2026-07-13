import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';
import { deriveListingPDA } from '@/lib/oddsdraft-anchor';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const isDevnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet';
const connection = new Connection(
  isDevnet ? 'https://api.devnet.solana.com' : (process.env.SERVER_SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com')
);

// Supabase may return card_collection as a parsed array (jsonb) or a JSON string (text column).
function toCardArray(v: unknown): any[] {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
}

// POST /api/marketplace/buy
// Body: { txSignature, buyerWallet, sellerWallet, cardId }
// Verifies the on-chain buy_card tx, transfers card ownership in Supabase.
export async function POST(req: NextRequest) {
  try {
    const { txSignature, buyerWallet, sellerWallet, instanceId, cardId } = await req.json();

    if (!txSignature || !buyerWallet || !sellerWallet || !cardId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the transaction landed on-chain
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
      return NextResponse.json({ error: 'Listing PDA still open — transaction may not have run buy_card' }, { status: 400 });
    }

    // Fetch the active listing from Supabase
    const { data: listing, error: fetchErr } = await supabase
      .from('card_listings')
      .select('*')
      .eq('listing_pda', listingPDA.toString())
      .eq('status', 'active')
      .maybeSingle();

    if (fetchErr || !listing) {
      return NextResponse.json({ error: 'Listing not found or already sold' }, { status: 404 });
    }

    // Transfer card: remove from seller's collection, add to buyer's

    const { data: sellerData } = await supabase
      .from('user_data')
      .select('card_collection')
      .eq('wallet_address', sellerWallet)
      .maybeSingle();

    const sellerCards: any[] = toCardArray(sellerData?.card_collection);
    // Prefer exact instance match; fall back to first matching cardId+type
    const cardIndex = instanceId
      ? sellerCards.findIndex((c: any) => c.instanceId === instanceId)
      : sellerCards.findIndex((c: any) => c.cardId === cardId && c.type === listing.card_type);

    if (cardIndex === -1) {
      // Card may have already been transferred or was never in collection — still mark sold
      console.warn('[marketplace/buy] card not found in seller collection', { sellerWallet, cardId });
    } else {
      // Remove one copy from seller
      const updatedSeller = [...sellerCards];
      updatedSeller.splice(cardIndex, 1);
      await supabase
        .from('user_data')
        .upsert({ wallet_address: sellerWallet, card_collection: updatedSeller }, { onConflict: 'wallet_address' });
    }

    // Add card to buyer's collection
    const { data: buyerData } = await supabase
      .from('user_data')
      .select('card_collection')
      .eq('wallet_address', buyerWallet)
      .maybeSingle();

    const buyerCards: any[] = toCardArray(buyerData?.card_collection);
    buyerCards.push({ type: listing.card_type, cardId, acquiredAt: new Date().toISOString() });
    await supabase
      .from('user_data')
      .upsert({ wallet_address: buyerWallet, card_collection: buyerCards }, { onConflict: 'wallet_address' });

    // Mark listing as sold
    await supabase
      .from('card_listings')
      .update({ status: 'sold', buyer_wallet: buyerWallet, sold_at: new Date().toISOString() })
      .eq('listing_pda', listingPDA.toString());

    return NextResponse.json({ success: true, cardId, cardType: listing.card_type });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}
