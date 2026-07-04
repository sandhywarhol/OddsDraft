import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import bs58 from 'bs58';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function loadTreasuryKeypair(): Keypair {
  const raw = process.env.TREASURY_WALLET_SECRET_KEY;
  if (!raw) throw new Error('TREASURY_WALLET_SECRET_KEY is not set');
  // Accept JSON array [1,2,...,64] or base58 string
  if (raw.trim().startsWith('[')) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
  }
  return Keypair.fromSecretKey(bs58.decode(raw));
}

export async function POST(req: NextRequest) {
  try {
    const { fixtureId, contestType, walletAddress } = await req.json();

    if (!fixtureId || !contestType || !walletAddress) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Validate treasury keypair is configured
    let treasury: Keypair;
    try {
      treasury = loadTreasuryKeypair();
    } catch {
      return NextResponse.json(
        { error: 'Prize distribution is not configured yet. Contact support.' },
        { status: 503 }
      );
    }

    // Look up contest result for this wallet
    const { data: result, error: resultErr } = await supabase
      .from('contest_results')
      .select('rank, prize_sol')
      .eq('fixture_id', fixtureId)
      .eq('contest_type', contestType)
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (resultErr || !result) {
      return NextResponse.json(
        { error: 'No contest result found for this wallet. Results may not have been submitted yet.' },
        { status: 404 }
      );
    }

    if (!result.prize_sol || result.prize_sol <= 0) {
      return NextResponse.json({ error: 'No prize for your rank in this contest.' }, { status: 400 });
    }

    // Prevent double-claim
    const { data: existingClaim } = await supabase
      .from('prize_claims')
      .select('tx_signature')
      .eq('fixture_id', fixtureId)
      .eq('contest_type', contestType)
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (existingClaim) {
      return NextResponse.json(
        { error: 'Already claimed', txSignature: existingClaim.tx_signature },
        { status: 409 }
      );
    }

    // Check treasury balance
    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpc, 'confirmed');

    const treasuryBalance = await connection.getBalance(treasury.publicKey);
    const lamportsToPay = Math.round(result.prize_sol * LAMPORTS_PER_SOL);

    // Keep 0.002 SOL in treasury for rent + fees
    const minReserve = 0.002 * LAMPORTS_PER_SOL;
    if (treasuryBalance < lamportsToPay + minReserve) {
      return NextResponse.json(
        { error: 'Treasury has insufficient funds. Please contact support.' },
        { status: 503 }
      );
    }

    // Send SOL from treasury to winner
    const recipient = new PublicKey(walletAddress);
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasury.publicKey,
        toPubkey: recipient,
        lamports: lamportsToPay,
      })
    );

    const txSignature = await sendAndConfirmTransaction(connection, tx, [treasury], {
      commitment: 'confirmed',
    });

    // Record the claim
    await supabase.from('prize_claims').insert({
      fixture_id: fixtureId,
      contest_type: contestType,
      wallet_address: walletAddress,
      rank: result.rank,
      prize_sol: result.prize_sol,
      tx_signature: txSignature,
    });

    return NextResponse.json({ success: true, txSignature, prizeSol: result.prize_sol });
  } catch (err: any) {
    console.error('[prize/claim]', err);
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}
