import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import axios from 'axios';
import idl from './txline_idl.json';
import type { WalletContextState } from '@solana/wallet-adapter-react';

const IS_DEVNET = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet';

const TXLINE_PROGRAM_ID = new PublicKey(
  IS_DEVNET
    ? '6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J'
    : '9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA'
);
const TXL_TOKEN_MINT = new PublicKey(
  IS_DEVNET
    ? '4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG'
    : 'Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL'
);

// Browser calls go through our proxy to avoid CORS; server-side calls go direct
const TXLINE_API_BASE = typeof window !== 'undefined'
  ? '/api/txline'
  : IS_DEVNET ? 'https://txline-dev.txodds.com' : 'https://txline.txodds.com';

// Free tier ID differs per network: devnet=1, mainnet=12
export const SERVICE_LEVEL_ID = IS_DEVNET ? 1 : 12;
export const DURATION_WEEKS = 4;
export const SELECTED_LEAGUES: number[] = []; // empty for standard bundle

export async function subscribeToFreeTier(wallet: WalletContextState, connection: Connection) {
  if (!wallet.publicKey || !wallet.signTransaction) throw new Error("Wallet not connected");

  const provider = new anchor.AnchorProvider(connection, wallet as any, { commitment: 'confirmed' });
  // Override IDL address to match current network's program ID
  const idlWithAddress = { ...idl, address: TXLINE_PROGRAM_ID.toString() };
  const program = new anchor.Program(idlWithAddress as any, provider);

  const [tokenTreasuryPda] = PublicKey.findProgramAddressSync([Buffer.from("token_treasury_v2")], TXLINE_PROGRAM_ID);
  const tokenTreasuryVault = getAssociatedTokenAddressSync(TXL_TOKEN_MINT, tokenTreasuryPda, true, TOKEN_2022_PROGRAM_ID);
  const [pricingMatrixPda] = PublicKey.findProgramAddressSync([Buffer.from("pricing_matrix")], TXLINE_PROGRAM_ID);
  const userTokenAccount = getAssociatedTokenAddressSync(TXL_TOKEN_MINT, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID);

  const preInstructions: TransactionInstruction[] = [];
  const tokenAccountInfo = await connection.getAccountInfo(userTokenAccount);
  if (!tokenAccountInfo) {
    preInstructions.push(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        userTokenAccount,
        wallet.publicKey,
        TXL_TOKEN_MINT,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  const txSig = await program.methods
    .subscribe(SERVICE_LEVEL_ID, DURATION_WEEKS)
    .accounts({
      user: wallet.publicKey,
      pricingMatrix: pricingMatrixPda,
      tokenMint: TXL_TOKEN_MINT,
      userTokenAccount,
      tokenTreasuryVault,
      tokenTreasuryPda,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    })
    .preInstructions(preInstructions)
    .rpc();

  return txSig;
}

export async function activateApiAccess(wallet: WalletContextState, txSig: string) {
  if (!wallet.publicKey || !wallet.signMessage) throw new Error("Wallet not connected or does not support signMessage");

  // 1. Get Guest JWT
  const authResponse = await axios.post(`${TXLINE_API_BASE}/auth/guest/start`);
  const jwt = authResponse.data.token;

  // 2. Sign Message
  const messageString = `${txSig}:${SELECTED_LEAGUES.join(",")}:${jwt}`;
  const messageBytes = new TextEncoder().encode(messageString);
  
  const signatureBytes = await wallet.signMessage(messageBytes);
  const walletSignature = Buffer.from(signatureBytes).toString("base64");

  // 3. Activate Token
  const activationResponse = await axios.post(
    `${TXLINE_API_BASE}/api/token/activate`,
    {
      txSig,
      walletSignature,
      leagues: SELECTED_LEAGUES,
    },
    {
      headers: { Authorization: `Bearer ${jwt}` },
    }
  );

  // API may return a plain string token, or {token: "..."}, or {apiToken: "..."}
  const raw = activationResponse.data;
  const token = typeof raw === 'string' ? raw : (raw?.token ?? raw?.apiToken ?? null);
  if (!token) throw new Error(`Activation failed — unexpected response: ${JSON.stringify(raw)}`);
  return { token, guestJwt: jwt };
}

function txlineHeaders(apiToken: string, guestJwt?: string | null) {
  const h: Record<string, string> = { 'X-Api-Token': apiToken };
  if (guestJwt) h['Authorization'] = `Bearer ${guestJwt}`;
  return h;
}

export async function fetchLiveFixtures(apiToken: string, guestJwt?: string | null) {
  const res = await axios.get(`${TXLINE_API_BASE}/api/soccer/v2/fixtures/live`, {
    headers: txlineHeaders(apiToken, guestJwt),
  });
  return res.data;
}

export async function fetchAllFixtures(apiToken: string, guestJwt?: string | null) {
  const res = await axios.get(`${TXLINE_API_BASE}/api/soccer/v2/fixtures`, {
    headers: txlineHeaders(apiToken, guestJwt),
  });
  return res.data;
}

export async function fetchLiveScoreUpdates(apiToken: string, fixtureId: string, guestJwt?: string | null) {
  try {
    const res = await axios.get(`${TXLINE_API_BASE}/api/soccer/v2/scores`, {
      headers: txlineHeaders(apiToken, guestJwt),
      params: { FixtureId: fixtureId },
    });
    return res.data;
  } catch (err: any) {
    // 404 = fixture not live yet / historical data unavailable — expected on devnet
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

export async function fetchGuestToken(): Promise<string> {
  const res = await axios.post(`${TXLINE_API_BASE}/auth/guest/start`);
  return res.data.token;
}

export async function fetchFixtureLineups(apiToken: string, fixtureId: string, guestJwt?: string | null) {
  const res = await axios.get(
    `${TXLINE_API_BASE}/api/soccer/v2/lineups/${fixtureId}`,
    { headers: txlineHeaders(apiToken, guestJwt), timeout: 10000 }
  );
  return res.data;
}
