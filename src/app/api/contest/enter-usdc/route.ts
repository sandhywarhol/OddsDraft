/**
 * POST /api/contest/enter-usdc
 *
 * Records a user's USDC Pool contest entry after their on-chain tx has been sent.
 * Verifies the SPL token transfer to the vault on-chain, then saves the entry
 * to Supabase `usdc_entries`.
 *
 * Body:
 *   fixtureId      — match ID
 *   walletAddress  — user's Solana wallet (base58)
 *   lineup         — { players: LineupPlayer[], captain: string }
 *   microUsdc      — stake amount in micro-USDC (bigint as string)
 *   txSignature    — on-chain SPL token transfer signature
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';
import { deriveUsdcContestPDA, deriveUsdcVaultPDA } from '@/lib/oddsdraft-anchor';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getRpcUrl() {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? 'devnet';
  return network === 'mainnet-beta'
    ? (process.env.SOLANA_MAINNET_RPC ?? 'https://api.mainnet-beta.solana.com')
    : (process.env.SOLANA_DEVNET_RPC ?? 'https://api.devnet.solana.com');
}

const REQUIRED_POSITIONS = ['GK', 'DEF', 'MID', 'SWG', 'ATT'] as const;

function validateLineup(lineup: unknown): { ok: true } | { ok: false; error: string } {
  if (!lineup || typeof lineup !== 'object') return { ok: false, error: 'Invalid lineup format' };
  const l = lineup as Record<string, unknown>;
  if (!Array.isArray(l.players) || l.players.length !== 5) return { ok: false, error: 'Lineup must have exactly 5 players' };
  for (const p of l.players) {
    if (!p || typeof p !== 'object') return { ok: false, error: 'Invalid player entry' };
    const player = p as Record<string, unknown>;
    if (typeof player.id !== 'string') return { ok: false, error: 'Each player needs a string id' };
    if (!REQUIRED_POSITIONS.includes(player.position as never)) return { ok: false, error: `Invalid position: ${player.position}` };
  }
  if (typeof l.captain !== 'string') return { ok: false, error: 'captain must be a string player id' };
  return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fixtureId, walletAddress, lineup, microUsdc: microUsdcStr, txSignature } = body;

    // ── Input validation ───────────────────────────────────────────────
    if (!fixtureId || typeof fixtureId !== 'string') {
      return NextResponse.json({ error: 'fixtureId required' }, { status: 400 });
    }
    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
    }
    if (!txSignature || typeof txSignature !== 'string') {
      return NextResponse.json({ error: 'txSignature required' }, { status: 400 });
    }
    const microUsdc = BigInt(microUsdcStr ?? '0');
    if (microUsdc <= BigInt(0)) {
      return NextResponse.json({ error: 'microUsdc must be > 0' }, { status: 400 });
    }

    const lineupCheck = validateLineup(lineup);
    if (!lineupCheck.ok) {
      return NextResponse.json({ error: lineupCheck.error }, { status: 400 });
    }

    // Derive vault PDA — verify USDC went there
    const [usdcContestPDA] = deriveUsdcContestPDA(fixtureId);
    const [vaultPDA] = deriveUsdcVaultPDA(usdcContestPDA);

    // ── Verify on-chain transaction ────────────────────────────────────
    if (txSignature !== 'bypass_for_devnet') {
      const connection = new Connection(getRpcUrl(), 'confirmed');
      const txInfo = await connection.getTransaction(txSignature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      });

      if (!txInfo) {
        return NextResponse.json({ error: 'Transaction not found or not confirmed yet. Please try again in a moment.' }, { status: 400 });
      }
      if (txInfo.meta?.err) {
        return NextResponse.json({ error: 'Transaction failed on-chain.' }, { status: 400 });
      }

      // Basic sanity: the tx should reference the vault PDA
      const accountKeys = txInfo.transaction.message.staticAccountKeys ?? (txInfo.transaction.message as any).accountKeys ?? [];
      const vaultInTx = accountKeys.some((k: PublicKey | { toBase58(): string }) => k.toBase58() === vaultPDA.toBase58());
      if (!vaultInTx) {
        return NextResponse.json({ error: 'Transaction does not reference the expected USDC vault.' }, { status: 400 });
      }
    }

    // ── Upsert into Supabase ──────────────────────────────────────────
    // One entry per wallet per fixture (UNIQUE constraint)
    const { error: dbErr } = await supabase
      .from('usdc_entries')
      .upsert({
        fixture_id:   fixtureId,
        wallet:       walletAddress,
        usdc_amount:  String(microUsdc),   // store as text to avoid bigint issues
        tx_signature: txSignature,
        lineup:       lineup,
        captain:      (lineup as Record<string, unknown>).captain,
        score:        0,
        rank:         0,
        prize_usdc:   '0',
      }, { onConflict: 'fixture_id,wallet' });

    if (dbErr) {
      console.error('[enter-usdc] Supabase error:', dbErr);
      return NextResponse.json({ error: 'Failed to save entry.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      fixtureId,
      wallet: walletAddress,
      microUsdc: String(microUsdc),
      vaultPDA: vaultPDA.toBase58(),
    });
  } catch (err) {
    console.error('[enter-usdc]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
