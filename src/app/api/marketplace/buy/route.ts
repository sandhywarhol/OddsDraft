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

// Supabase stores card_collection as { cards: OwnedCard[], upgradeCards?: OwnedUpgradeCard[] }
// but older code may have written a flat array. Handle both.
function toCardArray(v: unknown): any[] {
  const parse = (x: unknown): unknown => typeof x === 'string' ? JSON.parse(x) : x;
  try {
    const obj = parse(v);
    if (Array.isArray(obj)) return obj;
    if (obj && typeof obj === 'object' && Array.isArray((obj as any).cards)) return (obj as any).cards;
  } catch {}
  return [];
}

function toUpgradeCardArray(v: unknown): any[] {
  const parse = (x: unknown): unknown => typeof x === 'string' ? JSON.parse(x) : x;
  try {
    const obj = parse(v);
    if (obj && typeof obj === 'object' && Array.isArray((obj as any).upgradeCards)) return (obj as any).upgradeCards;
  } catch {}
  return [];
}

function makeInstanceId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// POST /api/marketplace/buy
// Body: { txSignature, buyerWallet, sellerWallet, cardId, listingId? }
// Verifies the on-chain SOL transfer tx, transfers card ownership in Supabase.
export async function POST(req: NextRequest) {
  try {
    const { txSignature, buyerWallet, sellerWallet, instanceId, cardId, listingId } = await req.json();

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

    // Fetch the active listing from Supabase.
    // Prefer lookup by listingId (direct, no PDA derivation needed for direct-transfer flow).
    // Fall back to PDA-based lookup for legacy buy_card paths.
    let listing: any = null;
    let fetchErr: any = null;

    if (listingId) {
      ({ data: listing, error: fetchErr } = await supabase
        .from('card_listings')
        .select('*')
        .eq('id', listingId)
        .eq('status', 'active')
        .maybeSingle());
    } else {
      const pdaKey = instanceId ?? cardId;
      const [listingPDA] = deriveListingPDA(new PublicKey(sellerWallet), pdaKey);
      ({ data: listing, error: fetchErr } = await supabase
        .from('card_listings')
        .select('*')
        .eq('listing_pda', listingPDA.toString())
        .eq('status', 'active')
        .maybeSingle());
    }

    if (fetchErr || !listing) {
      return NextResponse.json({ error: 'Listing not found or already sold' }, { status: 404 });
    }

    // Transfer card: remove from seller's collection, add to buyer's.
    // card_collection in Supabase is { cards: OwnedCard[], upgradeCards?: OwnedUpgradeCard[] }.
    const isUpgrade = listing.card_type === 'upgrade';

    const { data: sellerData } = await supabase
      .from('user_data')
      .select('card_collection')
      .eq('wallet_address', listing.seller_wallet)
      .maybeSingle();

    const raw = sellerData?.card_collection as any;
    const sellerSkillCards: any[] = toCardArray(raw);
    const sellerUpgradeCards: any[] = toUpgradeCardArray(raw);

    if (isUpgrade) {
      const idx = instanceId
        ? sellerUpgradeCards.findIndex((c: any) => c.instanceId === instanceId)
        : sellerUpgradeCards.findIndex((c: any) => c.upgradeCardId === cardId);
      if (idx !== -1) sellerUpgradeCards.splice(idx, 1);
      else console.warn('[marketplace/buy] upgrade card not found in seller collection', { sellerWallet: listing.seller_wallet, cardId });
    } else {
      const idx = instanceId
        ? sellerSkillCards.findIndex((c: any) => c.instanceId === instanceId)
        : sellerSkillCards.findIndex((c: any) => c.cardId === cardId);
      if (idx !== -1) sellerSkillCards.splice(idx, 1);
      else console.warn('[marketplace/buy] skill card not found in seller collection', { sellerWallet: listing.seller_wallet, cardId });
    }

    const updatedSellerCollection = { cards: sellerSkillCards, upgradeCards: sellerUpgradeCards };
    await supabase
      .from('user_data')
      .upsert({ wallet_address: listing.seller_wallet, card_collection: updatedSellerCollection }, { onConflict: 'wallet_address' });

    // Add card to buyer's collection with correct schema
    const { data: buyerData } = await supabase
      .from('user_data')
      .select('card_collection')
      .eq('wallet_address', buyerWallet)
      .maybeSingle();

    const buyerRaw = buyerData?.card_collection as any;
    const buyerSkillCards: any[] = toCardArray(buyerRaw);
    const buyerUpgradeCards: any[] = toUpgradeCardArray(buyerRaw);
    const now = new Date().toISOString();

    if (isUpgrade) {
      buyerUpgradeCards.push({ instanceId: makeInstanceId(), upgradeCardId: cardId, obtainedAt: now });
    } else {
      buyerSkillCards.push({ instanceId: makeInstanceId(), cardId, obtainedAt: now, upgradeCredits: listing.upgrade_credits ?? 0 });
    }

    const updatedBuyerCollection = { cards: buyerSkillCards, upgradeCards: buyerUpgradeCards };
    await supabase
      .from('user_data')
      .upsert({ wallet_address: buyerWallet, card_collection: updatedBuyerCollection }, { onConflict: 'wallet_address' });

    // Mark listing as sold
    await supabase
      .from('card_listings')
      .update({ status: 'sold', buyer_wallet: buyerWallet, sold_at: new Date().toISOString() })
      .eq('id', listing.id);

    return NextResponse.json({ success: true, cardId, cardType: listing.card_type });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}
