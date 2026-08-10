/**
 * USDC Utilities — OddsDraft
 * Devnet USDC mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
 * Mainnet USDC mint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
 *
 * USDC uses 6 decimal places. All amounts stored/passed on-chain are micro-USDC.
 * 1 USDC = 1_000_000 micro-USDC
 */

import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

// ── Constants ──────────────────────────────────────────────────────────────────

export const USDC_MINT_DEVNET  = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
export const USDC_MINT_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

export const USDC_DECIMALS = 6;
export const USDC_PLATFORM_FEE_BPS = 500; // 5% in basis points

/** Get the active USDC mint based on environment */
export function getUsdcMint(): PublicKey {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? 'devnet';
  return network === 'mainnet-beta' ? USDC_MINT_MAINNET : USDC_MINT_DEVNET;
}

// ── Formatting helpers ─────────────────────────────────────────────────────────

/** Convert human-readable USDC amount to micro-USDC (bigint) */
export function toMicroUsdc(usdc: number): bigint {
  return BigInt(Math.round(usdc * 10 ** USDC_DECIMALS));
}

/** Convert micro-USDC (bigint or number) to human-readable USDC */
export function fromMicroUsdc(micro: bigint | number): number {
  return Number(micro) / 10 ** USDC_DECIMALS;
}

/** Format micro-USDC as a display string e.g. "$12.50 USDC" */
export function formatUsdc(micro: bigint | number, symbol = true): string {
  const val = fromMicroUsdc(micro);
  const fmt = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return symbol ? `${fmt} USDC` : fmt;
}

// ── Prize pool computation ─────────────────────────────────────────────────────

export interface UsdcEntry {
  wallet: string;
  usdcStaked: bigint;   // micro-USDC
  score: number;        // fantasy score (higher = more prize)
}

export interface UsdcPrize {
  wallet: string;
  prizeUsdc: bigint;    // micro-USDC to receive
  rank: number;
  sharePercent: number; // 0-100
}

/**
 * Compute proportional USDC prizes.
 *
 * Distribution is purely score-based (NOT stake-based):
 *   prize_i = (score_i / Σscore) * distributablePool
 *
 * Platform fee = totalPool * 0.05 (5%)
 * distributablePool = totalPool * 0.95
 *
 * If all scores are 0 (e.g. no match played yet), distribute equally.
 */
export function computeProportionalPrizes(entries: UsdcEntry[]): UsdcPrize[] {
  if (entries.length === 0) return [];

  const totalPool = entries.reduce((s, e) => s + e.usdcStaked, BigInt(0));
  const platformFee = (totalPool * BigInt(USDC_PLATFORM_FEE_BPS)) / BigInt(10000);
  const distributable = totalPool - platformFee;

  const totalScore = entries.reduce((s, e) => s + e.score, 0);

  // Sort descending by score to assign ranks
  const sorted = [...entries].sort((a, b) => b.score - a.score);

  const prizes: UsdcPrize[] = sorted.map((entry, idx) => {
    const rank = idx + 1;
    let prizeUsdc: bigint;
    let sharePercent: number;

    if (totalScore === 0) {
      // Equal distribution when no scores exist
      prizeUsdc = distributable / BigInt(entries.length);
      sharePercent = 100 / entries.length;
    } else {
      const fraction = entry.score / totalScore;
      prizeUsdc = BigInt(Math.floor(Number(distributable) * fraction));
      sharePercent = fraction * 100;
    }

    return { wallet: entry.wallet, prizeUsdc, rank, sharePercent };
  });

  // Correct any rounding dust: give leftover to rank 1
  const distributed = prizes.reduce((s, p) => s + p.prizeUsdc, BigInt(0));
  if (distributed < distributable && prizes.length > 0) {
    prizes[0].prizeUsdc += distributable - distributed;
  }

  return prizes;
}

// ── ATA helpers ───────────────────────────────────────────────────────────────

/** Get the Associated Token Account (ATA) address for a wallet + USDC mint */
export function getUserUsdcAta(wallet: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(getUsdcMint(), wallet, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
}

/**
 * Build a plain SPL token transfer instruction (user → destination).
 * Used as a fallback if the on-chain program CPI isn't available yet.
 */
export function buildUsdcTransferIx(
  from: PublicKey,       // user's USDC ATA
  to: PublicKey,         // destination ATA (vault or treasury)
  authority: PublicKey,  // user wallet (must sign)
  microUsdc: bigint,
): TransactionInstruction {
  return createTransferInstruction(from, to, authority, microUsdc, [], TOKEN_PROGRAM_ID);
}
