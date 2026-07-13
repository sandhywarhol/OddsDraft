import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { deriveListingPDA } from '@/lib/oddsdraft-anchor';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const connection = new Connection(
  process.env.SERVER_SOLANA_RPC ?? 'https://api.devnet.solana.com'
);

// POST /api/marketplace/list
// Body: { txSignature, sellerWallet, cardId, cardType, priceSol }
// Verifies the on-chain list_card tx then records the listing in Supabase.
export async function POST(req: NextRequest) {
  try {
    const { txSignature, sellerWallet, instanceId, cardId, cardType, priceSol, upgradeCredits } = await req.json();

    if (!txSignature || !sellerWallet || !cardId || !cardType || !priceSol) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Reject soulbound cards — look up seller's card_collection in Supabase
    const { data: userData } = await supabase
      .from('user_data')
      .select('card_collection')
      .eq('wallet_address', sellerWallet)
      .maybeSingle();

    if (userData?.card_collection) {
      let cards: any[] = [];
      try {
        cards = Array.isArray(userData.card_collection)
          ? userData.card_collection
          : JSON.parse(userData.card_collection as string);
      } catch {}
      const match = instanceId
        ? cards.find((c: any) => c.instanceId === instanceId)
        : cards.find((c: any) => c.cardId === cardId || c.upgradeCardId === cardId);
      if (match?.soulbound) {
        return NextResponse.json({ error: 'This card is soulbound and cannot be sold' }, { status: 403 });
      }
    }

    // Verify the transaction landed on-chain
    const tx = await connection.getTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });
    if (!tx || tx.meta?.err) {
      return NextResponse.json({ error: 'Transaction not confirmed or failed' }, { status: 400 });
    }

    // PDA was keyed by instanceId so each copy of the same card can be listed independently
    const seller = new PublicKey(sellerWallet);
    const pdaKey = instanceId ?? cardId;
    const [listingPDA] = deriveListingPDA(seller, pdaKey);
    // Poll for the PDA with up to 3 retries — devnet can lag between
    // "confirmed" tx and the account being visible via getAccountInfo.
    let pdaInfo = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      pdaInfo = await connection.getAccountInfo(listingPDA, 'confirmed');
      if (pdaInfo) break;
      await new Promise(r => setTimeout(r, 2000));
    }
    if (!pdaInfo) {
      return NextResponse.json({ error: 'Listing PDA not found on-chain' }, { status: 400 });
    }

    // Prevent duplicate listings for the same card
    const { data: existing } = await supabase
      .from('card_listings')
      .select('id')
      .eq('listing_pda', listingPDA.toString())
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Card is already listed' }, { status: 409 });
    }

    // Try insert with upgrade_credits; fall back without it if the column doesn't exist yet.
    let insertErr: any = null;
    ({ error: insertErr } = await supabase.from('card_listings').insert({
      listing_pda: listingPDA.toString(),
      seller_wallet: sellerWallet,
      instance_id: instanceId ?? null,
      card_id: cardId,
      card_type: cardType,
      price_sol: priceSol,
      upgrade_credits: upgradeCredits ?? 0,
      status: 'active',
    }));

    // Graceful fallback if optional columns don't exist yet
    if (insertErr?.message?.includes('instance_id') || insertErr?.message?.includes('upgrade_credits')) {
      ({ error: insertErr } = await supabase.from('card_listings').insert({
        listing_pda: listingPDA.toString(),
        seller_wallet: sellerWallet,
        card_id: cardId,
        card_type: cardType,
        price_sol: priceSol,
        status: 'active',
      }));
    }

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, listingPda: listingPDA.toString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}
