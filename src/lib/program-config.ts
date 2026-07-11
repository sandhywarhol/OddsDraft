/**
 * OddsDraft smart contract configuration.
 *
 * All Anchor program constants live here so the Next.js app has a single
 * source of truth when it's time to wire up the smart contract calls.
 *
 * Current status: SMART_CONTRACT_ENABLED=false in .env.local
 * The existing server-side SOL transfer (prize/claim route) remains active
 * until the feature flag is flipped and integration is completed.
 */

import { PublicKey } from '@solana/web3.js';

// ── Network ────────────────────────────────────────────────────────────────────

export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? 'mainnet-beta') as
  | 'mainnet-beta'
  | 'devnet'
  | 'localnet';

export const IS_DEVNET = SOLANA_NETWORK === 'devnet';

/** Feature flag — flip to true once program is deployed + integration is done */
export const SMART_CONTRACT_ENABLED =
  process.env.NEXT_PUBLIC_SMART_CONTRACT_ENABLED === 'true' ||
  process.env.SMART_CONTRACT_ENABLED === 'true';

// ── Program ────────────────────────────────────────────────────────────────────

/**
 * Program ID is the same on localnet and devnet — both use the keypair at
 * oddsdraft_program/target/deploy/oddsdraft_program-keypair.json.
 * Update this if the program is ever redeployed with a new keypair.
 */
export const ODDSDRAFT_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ODDSDRAFT_PROGRAM_ID ??
    'FW8MmmLJ99w5LxVBZAG5T3Lx5WU7vnh1XaSSS2vj8AGJ'
);

// ── PDA seeds (must match lib.rs) ─────────────────────────────────────────────

export const CONTEST_SEED = Buffer.from('contest');
export const PARTICIPANT_SEED = Buffer.from('participant');

/**
 * Derive the Contest PDA for a given contest ID string.
 * Mirrors: seeds = [b"contest", contest_id.as_bytes()]
 */
export function deriveContestPDA(contestId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [CONTEST_SEED, Buffer.from(contestId)],
    ODDSDRAFT_PROGRAM_ID
  );
}

/**
 * Derive the Participant PDA for a wallet + contest PDA pair.
 * Mirrors: seeds = [b"participant", contest.key().as_ref(), user.key().as_ref()]
 */
export function deriveParticipantPDA(
  contestPDA: PublicKey,
  userWallet: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PARTICIPANT_SEED, contestPDA.toBuffer(), userWallet.toBuffer()],
    ODDSDRAFT_PROGRAM_ID
  );
}

// ── On-chain account types (mirrors lib.rs structs) ───────────────────────────
// These are used to deserialize account data fetched from the RPC.
// Not yet used — uncomment when integration begins.

/*
export interface ContestAccount {
  admin: PublicKey;
  contestId: string;
  entryFee: bigint;    // u64 in lamports
  prizePool: bigint;   // u64 in lamports
  isResolved: boolean;
  bump: number;
}

export interface ParticipantAccount {
  user: PublicKey;
  contest: PublicKey;
  bump: number;
}
*/
