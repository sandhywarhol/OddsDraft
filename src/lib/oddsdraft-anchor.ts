/**
 * OddsDraft Anchor program — raw instruction builders.
 *
 * We construct instructions manually instead of using the Anchor TS client so
 * there are no version-compatibility concerns between anchor-lang 1.1.1 (Rust)
 * and @coral-xyz/anchor (npm). Discriminators are precomputed from
 * sha256("global:<instruction_name>")[0:8].
 *
 * Works on both server (Node.js) and client (browser / Next.js).
 */

import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { ENTRY_FEE_SOL } from './fantasy-engine';

// ── Constants ──────────────────────────────────────────────────────────────────

export const ODDSDRAFT_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_ODDSDRAFT_PROGRAM_ID ??
    'FW8MmmLJ99w5LxVBZAG5T3Lx5WU7vnh1XaSSS2vj8AGJ'
);

export const ENTRY_FEE_LAMPORTS = BigInt(Math.round(ENTRY_FEE_SOL * LAMPORTS_PER_SOL));

// Precomputed: sha256("global:<name>")[0:8]
const DISC_INIT_CONTEST    = Uint8Array.from([8, 124, 233, 229, 42, 156, 92, 3]);
const DISC_JOIN_CONTEST    = Uint8Array.from([247, 243, 77, 111, 247, 254, 100, 133]);
const DISC_RESOLVE_CONTEST = Uint8Array.from([250, 181, 233, 153, 74, 161, 231, 115]);
const DISC_LIST_CARD       = Uint8Array.from([113, 226, 80, 193, 197, 19, 75, 161]);
const DISC_BUY_CARD        = Uint8Array.from([113, 142, 149, 246, 22, 115, 156, 154]);
const DISC_CANCEL_LISTING  = Uint8Array.from([41, 183, 50, 232, 230, 233, 157, 70]);

export const TREASURY_PUBKEY = new PublicKey(
  process.env.NEXT_PUBLIC_TREASURY_WALLET ?? '71qSknUx1ZRTcAiVJtwFPdGkuXFaHjNMpRyrt7EFvErd'
);

// ── PDA derivation ─────────────────────────────────────────────────────────────

/**
 * Seed key for a contest: "{fixtureId}_{contestType}" e.g. "18210002_top3"
 * Mirrors: seeds = [b"contest", contest_id.as_bytes()]
 */
export function contestSeedId(fixtureId: string, contestType: string): string {
  return `${fixtureId}_${contestType}`;
}

export function deriveContestPDA(fixtureId: string, contestType: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('contest'), Buffer.from(contestSeedId(fixtureId, contestType))],
    ODDSDRAFT_PROGRAM_ID
  );
}

export function deriveParticipantPDA(
  contestPDA: PublicKey,
  userWallet: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('participant'), contestPDA.toBuffer(), userWallet.toBuffer()],
    ODDSDRAFT_PROGRAM_ID
  );
}

// ── Borsh serialisation helpers ────────────────────────────────────────────────

function borshString(s: string): Uint8Array {
  const bytes = Buffer.from(s, 'utf8');
  const len   = Buffer.allocUnsafe(4);
  len.writeUInt32LE(bytes.length, 0);
  return Buffer.concat([len, bytes]);
}

function borshU64(n: bigint): Uint8Array {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, n, true); // little-endian
  return b;
}

function borshVecU64(arr: bigint[]): Uint8Array {
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32LE(arr.length, 0);
  return Buffer.concat([len, ...arr.map(borshU64)]);
}

// ── Instruction builders ───────────────────────────────────────────────────────

/**
 * initialize_contest — called once by admin before any user can join.
 * Seeds the Contest PDA with the entry fee and contest ID.
 */
export function buildInitializeContestIx(
  fixtureId: string,
  contestType: string,
  admin: PublicKey
): TransactionInstruction {
  const seedId = contestSeedId(fixtureId, contestType);
  const [contestPDA] = deriveContestPDA(fixtureId, contestType);

  const data = Buffer.concat([
    DISC_INIT_CONTEST,
    borshString(seedId),
    borshU64(ENTRY_FEE_LAMPORTS),
  ]);

  return new TransactionInstruction({
    programId: ODDSDRAFT_PROGRAM_ID,
    keys: [
      { pubkey: contestPDA,               isSigner: false, isWritable: true  },
      { pubkey: admin,                    isSigner: true,  isWritable: true  },
      { pubkey: SystemProgram.programId,  isSigner: false, isWritable: false },
    ],
    data,
  });
}

/**
 * join_contest — called client-side by each participant.
 * Transfers entry_fee lamports from user to the Contest PDA and creates a
 * Participant account that prevents double-entry.
 */
export function buildJoinContestIx(
  fixtureId: string,
  contestType: string,
  user: PublicKey
): TransactionInstruction {
  const [contestPDA]     = deriveContestPDA(fixtureId, contestType);
  const [participantPDA] = deriveParticipantPDA(contestPDA, user);

  return new TransactionInstruction({
    programId: ODDSDRAFT_PROGRAM_ID,
    keys: [
      { pubkey: contestPDA,               isSigner: false, isWritable: true  },
      { pubkey: participantPDA,           isSigner: false, isWritable: true  },
      { pubkey: user,                     isSigner: true,  isWritable: true  },
      { pubkey: SystemProgram.programId,  isSigner: false, isWritable: false },
    ],
    data: Buffer.from(DISC_JOIN_CONTEST),
  });
}

// ── Marketplace PDA ────────────────────────────────────────────────────────────

/**
 * Derives the listing PDA for a seller + card combination.
 * Mirrors: seeds = [b"listing", seller.key().as_ref(), card_id.as_bytes()]
 *
 * UUID instanceIds have dashes stripped before use as a seed because Solana
 * limits each individual seed to 32 bytes — a UUID with dashes is 36 bytes.
 * Without dashes it is exactly 32 hex chars = 32 bytes.
 */
export function pdaSeedKey(cardId: string): string {
  const stripped = cardId.replace(/-/g, '');
  // Solana limits each PDA seed to 32 bytes. instanceIds can be longer than 32
  // chars (e.g. "combine-clean_sheet_shield-1720000000000"). Keep the LAST 32
  // chars so the timestamp/random suffix — the most unique part — is preserved.
  return stripped.length > 32 ? stripped.slice(-32) : stripped;
}

export function deriveListingPDA(seller: PublicKey, cardId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('listing'), seller.toBuffer(), Buffer.from(pdaSeedKey(cardId))],
    ODDSDRAFT_PROGRAM_ID
  );
}

// ── Marketplace instruction builders ──────────────────────────────────────────

/**
 * list_card — seller creates an on-chain listing PDA.
 * cardType must be "skill" or "upgrade".
 */
export function buildListCardIx(
  seller: PublicKey,
  cardId: string,
  cardType: string,
  priceLamports: bigint
): TransactionInstruction {
  const key = pdaSeedKey(cardId); // strip UUID dashes — Rust uses this for PDA seed
  const [listingPDA] = deriveListingPDA(seller, key);

  const data = Buffer.concat([
    DISC_LIST_CARD,
    borshString(key),
    borshString(cardType),
    borshU64(priceLamports),
  ]);

  return new TransactionInstruction({
    programId: ODDSDRAFT_PROGRAM_ID,
    keys: [
      { pubkey: listingPDA,               isSigner: false, isWritable: true  },
      { pubkey: seller,                   isSigner: true,  isWritable: true  },
      { pubkey: SystemProgram.programId,  isSigner: false, isWritable: false },
    ],
    data,
  });
}

/**
 * buy_card — buyer pays seller (95%) + treasury (5%), listing PDA closes.
 * seller pubkey must match the listing's stored seller.
 */
export function buildBuyCardIx(
  buyer: PublicKey,
  seller: PublicKey,
  cardId: string
): TransactionInstruction {
  const key = pdaSeedKey(cardId);
  const [listingPDA] = deriveListingPDA(seller, key);

  const data = Buffer.concat([
    DISC_BUY_CARD,
    borshString(key),
  ]);

  return new TransactionInstruction({
    programId: ODDSDRAFT_PROGRAM_ID,
    keys: [
      { pubkey: listingPDA,               isSigner: false, isWritable: true  },
      { pubkey: seller,                   isSigner: false, isWritable: true  },
      { pubkey: buyer,                    isSigner: true,  isWritable: true  },
      { pubkey: TREASURY_PUBKEY,          isSigner: false, isWritable: true  },
      { pubkey: SystemProgram.programId,  isSigner: false, isWritable: false },
    ],
    data,
  });
}

/**
 * cancel_listing — seller closes their own listing PDA and reclaims rent.
 */
export function buildCancelListingIx(
  seller: PublicKey,
  cardId: string
): TransactionInstruction {
  const key = pdaSeedKey(cardId);
  const [listingPDA] = deriveListingPDA(seller, key);

  const data = Buffer.concat([
    DISC_CANCEL_LISTING,
    borshString(key),
  ]);

  return new TransactionInstruction({
    programId: ODDSDRAFT_PROGRAM_ID,
    keys: [
      { pubkey: listingPDA,               isSigner: false, isWritable: true  },
      { pubkey: seller,                   isSigner: true,  isWritable: true  },
      { pubkey: SystemProgram.programId,  isSigner: false, isWritable: false },
    ],
    data,
  });
}

/**
 * resolve_contest — called server-side by admin once the match is over.
 * Distributes lamports from the Contest PDA to each winner.
 * Winners are passed as remaining_accounts in the same order as amountsLamports.
 */
export function buildResolveContestIx(
  fixtureId: string,
  contestType: string,
  admin: PublicKey,
  winners: PublicKey[],
  amountsLamports: bigint[]
): TransactionInstruction {
  const [contestPDA] = deriveContestPDA(fixtureId, contestType);

  const data = Buffer.concat([
    DISC_RESOLVE_CONTEST,
    borshVecU64(amountsLamports),
  ]);

  return new TransactionInstruction({
    programId: ODDSDRAFT_PROGRAM_ID,
    keys: [
      { pubkey: contestPDA,              isSigner: false, isWritable: true },
      { pubkey: admin,                   isSigner: true,  isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ...winners.map(w => ({ pubkey: w, isSigner: false, isWritable: true })),
    ],
    data,
  });
}

// ── USDC Pool Contest Instruction Builders ─────────────────────────────────────
//
// Discriminators: sha256("global:<name>")[0:8]
// Precomputed offline; verified against anchor-lang 1.1.1 discriminator logic.
//
// init_usdc_contest    → sha256("global:init_usdc_contest")[0:8]
// join_usdc_contest    → sha256("global:join_usdc_contest")[0:8]
// resolve_usdc_contest → sha256("global:resolve_usdc_contest")[0:8]

import { createHash } from 'crypto';

function anchorDiscriminator(name: string): Buffer {
  return Buffer.from(createHash('sha256').update(`global:${name}`).digest()).subarray(0, 8);
}

const DISC_INIT_USDC_CONTEST    = anchorDiscriminator('init_usdc_contest');
const DISC_JOIN_USDC_CONTEST    = anchorDiscriminator('join_usdc_contest');
const DISC_RESOLVE_USDC_CONTEST = anchorDiscriminator('resolve_usdc_contest');

// Devnet USDC mint (Circle USDC devnet faucet)
export const USDC_MINT_DEVNET  = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
export const USDC_MINT_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

export function getUsdcMint(): PublicKey {
  return process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta'
    ? USDC_MINT_MAINNET : USDC_MINT_DEVNET;
}

// seeds = [b"usdc_contest", contest_id.as_bytes()]
export function deriveUsdcContestPDA(fixtureId: string): [PublicKey, number] {
  const seedId = `${fixtureId}_usdc_pool`;
  return PublicKey.findProgramAddressSync(
    [Buffer.from('usdc_contest'), Buffer.from(seedId)],
    ODDSDRAFT_PROGRAM_ID
  );
}

// seeds = [b"usdc_vault", usdc_contest.key().as_ref()]
export function deriveUsdcVaultPDA(usdcContestPDA: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('usdc_vault'), usdcContestPDA.toBuffer()],
    ODDSDRAFT_PROGRAM_ID
  );
}

// seeds = [b"usdc_participant", usdc_contest.key(), user.key()]
export function deriveUsdcParticipantPDA(usdcContestPDA: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('usdc_participant'), usdcContestPDA.toBuffer(), user.toBuffer()],
    ODDSDRAFT_PROGRAM_ID
  );
}

/**
 * init_usdc_contest — admin creates USDC contest + vault token account.
 * Must be called once per fixture before any user can join.
 */
export function buildInitUsdcContestIx(
  fixtureId: string,
  admin: PublicKey,
  tokenProgram: PublicKey,
  systemProgram: PublicKey,
  rentSysvar: PublicKey,
): TransactionInstruction {
  const seedId = `${fixtureId}_usdc_pool`;
  const [usdcContestPDA] = deriveUsdcContestPDA(fixtureId);
  const [vaultPDA] = deriveUsdcVaultPDA(usdcContestPDA);
  const usdcMint = getUsdcMint();

  const data = Buffer.concat([
    DISC_INIT_USDC_CONTEST,
    borshString(seedId),
  ]);

  return new TransactionInstruction({
    programId: ODDSDRAFT_PROGRAM_ID,
    keys: [
      { pubkey: usdcContestPDA, isSigner: false, isWritable: true  },
      { pubkey: vaultPDA,       isSigner: false, isWritable: true  },
      { pubkey: usdcMint,       isSigner: false, isWritable: false },
      { pubkey: admin,          isSigner: true,  isWritable: true  },
      { pubkey: tokenProgram,   isSigner: false, isWritable: false },
      { pubkey: systemProgram,  isSigner: false, isWritable: false },
      { pubkey: rentSysvar,     isSigner: false, isWritable: false },
    ],
    data,
  });
}

/**
 * join_usdc_contest — user stakes USDC into the vault.
 * @param userTokenAccount — user's USDC Associated Token Account
 * @param microUsdc — stake amount in micro-USDC (6 decimals), e.g. 5_000_000 = 5 USDC
 */
export function buildJoinUsdcContestIx(
  fixtureId: string,
  user: PublicKey,
  userTokenAccount: PublicKey,
  microUsdc: bigint,
  tokenProgram: PublicKey,
  systemProgram: PublicKey,
): TransactionInstruction {
  const [usdcContestPDA] = deriveUsdcContestPDA(fixtureId);
  const [vaultPDA] = deriveUsdcVaultPDA(usdcContestPDA);
  const [participantPDA] = deriveUsdcParticipantPDA(usdcContestPDA, user);

  const data = Buffer.concat([
    DISC_JOIN_USDC_CONTEST,
    borshU64(microUsdc),
  ]);

  return new TransactionInstruction({
    programId: ODDSDRAFT_PROGRAM_ID,
    keys: [
      { pubkey: usdcContestPDA,    isSigner: false, isWritable: true  },
      { pubkey: vaultPDA,          isSigner: false, isWritable: true  },
      { pubkey: participantPDA,    isSigner: false, isWritable: true  },
      { pubkey: userTokenAccount,  isSigner: false, isWritable: true  },
      { pubkey: user,              isSigner: true,  isWritable: true  },
      { pubkey: tokenProgram,      isSigner: false, isWritable: false },
      { pubkey: systemProgram,     isSigner: false, isWritable: false },
    ],
    data,
  });
}

/**
 * resolve_usdc_contest — admin distributes prizes after the match.
 * @param treasuryTokenAccount — admin's USDC ATA (receives 5% fee)
 * @param winners — array of winner wallet PublicKeys (their ATAs)
 * @param amounts — micro-USDC prize per winner (in same order as winners)
 */
export function buildResolveUsdcContestIx(
  fixtureId: string,
  admin: PublicKey,
  treasuryTokenAccount: PublicKey,
  winners: PublicKey[],
  amounts: bigint[],
  tokenProgram: PublicKey,
): TransactionInstruction {
  const [usdcContestPDA] = deriveUsdcContestPDA(fixtureId);
  const [vaultPDA] = deriveUsdcVaultPDA(usdcContestPDA);

  const data = Buffer.concat([
    DISC_RESOLVE_USDC_CONTEST,
    borshVecU64(amounts),
  ]);

  return new TransactionInstruction({
    programId: ODDSDRAFT_PROGRAM_ID,
    keys: [
      { pubkey: usdcContestPDA,          isSigner: false, isWritable: true  },
      { pubkey: vaultPDA,                isSigner: false, isWritable: true  },
      { pubkey: treasuryTokenAccount,    isSigner: false, isWritable: true  },
      { pubkey: admin,                   isSigner: true,  isWritable: true  },
      { pubkey: tokenProgram,            isSigner: false, isWritable: false },
      ...winners.map(w => ({ pubkey: w, isSigner: false, isWritable: true })),
    ],
    data,
  });
}
