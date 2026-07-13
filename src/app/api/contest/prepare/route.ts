/**
 * GET /api/contest/prepare?fixtureId=...&contestType=...
 *
 * Ensures the on-chain Contest PDA exists for a given fixture+contestType.
 * If it doesn't exist yet, the server (admin keypair) calls initialize_contest.
 * Returns the contest PDA address so the client can build a join_contest tx.
 *
 * Only active when SMART_CONTRACT_ENABLED=true.
 * Safe to call multiple times — idempotent.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import {
  deriveContestPDA,
  buildInitializeContestIx,
  ODDSDRAFT_PROGRAM_ID,
} from '@/lib/oddsdraft-anchor';

const SMART_CONTRACT_ENABLED =
  process.env.SMART_CONTRACT_ENABLED === 'true' ||
  process.env.NEXT_PUBLIC_SMART_CONTRACT_ENABLED === 'true';

function loadAdminKeypair(): Keypair {
  const raw = process.env.TREASURY_WALLET_SECRET_KEY;
  if (!raw) throw new Error('TREASURY_WALLET_SECRET_KEY not configured');
  if (raw.trim().startsWith('[')) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
  return Keypair.fromSecretKey(bs58.decode(raw));
}

export async function GET(req: NextRequest) {
  if (!SMART_CONTRACT_ENABLED) {
    return NextResponse.json({ error: 'Smart contract not enabled' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const fixtureId   = searchParams.get('fixtureId');
  const contestType = searchParams.get('contestType');

  if (!fixtureId || !contestType) {
    return NextResponse.json({ error: 'fixtureId and contestType required' }, { status: 400 });
  }

  const isDevnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet';
  const rpc = isDevnet ? 'https://api.devnet.solana.com' : (process.env.SERVER_SOLANA_RPC ?? 'https://api.mainnet-beta.solana.com');
  const connection = new Connection(rpc, 'confirmed');

  const [contestPDA] = deriveContestPDA(fixtureId, contestType);

  // Check if the Contest PDA already exists
  const existing = await connection.getAccountInfo(contestPDA);
  if (existing) {
    return NextResponse.json({
      contestPDA: contestPDA.toBase58(),
      programId:  ODDSDRAFT_PROGRAM_ID.toBase58(),
      initialized: true,
    });
  }

  // Initialize the contest on-chain using the admin keypair
  let admin: Keypair;
  try {
    admin = loadAdminKeypair();
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }

  try {
    const ix = buildInitializeContestIx(fixtureId, contestType, admin.publicKey);
    const tx = new Transaction().add(ix);
    const txSig = await sendAndConfirmTransaction(connection, tx, [admin], {
      commitment: 'confirmed',
    });

    console.log(`[contest/prepare] initialized ${fixtureId}_${contestType} → ${contestPDA.toBase58()} (${txSig})`);

    return NextResponse.json({
      contestPDA:  contestPDA.toBase58(),
      programId:   ODDSDRAFT_PROGRAM_ID.toBase58(),
      initialized: true,
      initTx:      txSig,
    });
  } catch (err: any) {
    // Race condition: another request initialized it first — still return the PDA
    if (err.message?.includes('already in use') || err.message?.includes('custom program error: 0x0')) {
      return NextResponse.json({
        contestPDA:  contestPDA.toBase58(),
        programId:   ODDSDRAFT_PROGRAM_ID.toBase58(),
        initialized: true,
      });
    }
    console.error('[contest/prepare]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
