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
import nacl from 'tweetnacl';
import { buildResolveContestIx } from '@/lib/oddsdraft-anchor';

const SMART_CONTRACT_ENABLED =
  process.env.SMART_CONTRACT_ENABLED === 'true' ||
  process.env.NEXT_PUBLIC_SMART_CONTRACT_ENABLED === 'true';

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
    const { fixtureId, contestType, walletAddress, authSignature, authMessage } = await req.json();

    if (!fixtureId || !contestType || !walletAddress) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Verify caller owns the wallet — requires signing a message client-side
    if (!authSignature || !authMessage) {
      return NextResponse.json({ error: 'Wallet signature required to claim prize' }, { status: 401 });
    }
    try {
      const msgBytes = new TextEncoder().encode(authMessage as string);
      const sigBytes = bs58.decode(authSignature as string);
      const pubKeyBytes = new PublicKey(walletAddress).toBytes();
      if (!nacl.sign.detached.verify(msgBytes, sigBytes, pubKeyBytes)) {
        return NextResponse.json({ error: 'Wallet signature is invalid' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
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

    const rpc = process.env.SERVER_SOLANA_RPC || process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpc, 'confirmed');

    if (SMART_CONTRACT_ENABLED) {
      // Smart contract path: call resolve_contest for ALL winners in one tx.
      // This distributes from the Contest PDA to every winner simultaneously;
      // subsequent claim calls find their record already in prize_claims.

      // Fetch every winner in this contest (prize_sol > 0)
      const { data: allResults, error: allErr } = await supabase
        .from('contest_results')
        .select('wallet_address, rank, prize_sol')
        .eq('fixture_id', fixtureId)
        .eq('contest_type', contestType)
        .gt('prize_sol', 0);

      if (allErr || !allResults?.length) {
        return NextResponse.json({ error: 'No winners found for this contest.' }, { status: 404 });
      }

      const winners    = allResults.map(r => new PublicKey(r.wallet_address));
      const amounts    = allResults.map(r => BigInt(Math.round(r.prize_sol * LAMPORTS_PER_SOL)));

      const resolveIx = buildResolveContestIx(fixtureId, contestType, treasury.publicKey, winners, amounts);
      const tx = new Transaction().add(resolveIx);

      let txSignature: string;
      try {
        txSignature = await sendAndConfirmTransaction(connection, tx, [treasury], {
          commitment: 'confirmed',
        });
      } catch (err: any) {
        // Contest PDA may already be closed (race: another request resolved first).
        // Check if this wallet's claim was recorded by the winning request.
        const { data: raceCheck } = await supabase
          .from('prize_claims')
          .select('tx_signature')
          .eq('fixture_id', fixtureId)
          .eq('contest_type', contestType)
          .eq('wallet_address', walletAddress)
          .maybeSingle();
        if (raceCheck) {
          return NextResponse.json({ success: true, txSignature: raceCheck.tx_signature, prizeSol: result.prize_sol });
        }
        console.error('[prize/claim] resolve_contest failed:', err);
        return NextResponse.json({ error: `Smart contract distribution failed: ${err.message}` }, { status: 500 });
      }

      // Record all winners' claims in one batch insert
      const claimsToInsert = allResults.map(r => ({
        fixture_id: fixtureId,
        contest_type: contestType,
        wallet_address: r.wallet_address,
        rank: r.rank,
        prize_sol: r.prize_sol,
        tx_signature: txSignature,
      }));
      await supabase.from('prize_claims').upsert(claimsToInsert, {
        onConflict: 'fixture_id,contest_type,wallet_address',
        ignoreDuplicates: true,
      });

      return NextResponse.json({ success: true, txSignature, prizeSol: result.prize_sol });
    }

    // Legacy path: direct SOL transfer from treasury to this winner.
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

    const recipient = new PublicKey(walletAddress);
    const legacyTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasury.publicKey,
        toPubkey: recipient,
        lamports: lamportsToPay,
      })
    );

    const txSignature = await sendAndConfirmTransaction(connection, legacyTx, [treasury], {
      commitment: 'confirmed',
    });

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
