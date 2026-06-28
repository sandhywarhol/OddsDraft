import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import axios from 'axios';
import idl from './txline_idl.json';
import type { WalletContextState } from '@solana/wallet-adapter-react';

const TXLINE_PROGRAM_ID = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");
const TXL_TOKEN_MINT = new PublicKey("Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL");

const TXLINE_API_BASE = "https://txline.txodds.com"; // Mainnet

export const SERVICE_LEVEL_ID = 12; // Real-time Free Tier
export const DURATION_WEEKS = 4;
export const SELECTED_LEAGUES: number[] = []; // empty for standard bundle

export async function subscribeToFreeTier(wallet: WalletContextState, connection: Connection) {
  if (!wallet.publicKey || !wallet.signTransaction) throw new Error("Wallet not connected");

  // We cast wallet to any because AnchorProvider expects a NodeWallet, but WalletContextState has signTransaction/signAllTransactions
  const provider = new anchor.AnchorProvider(connection, wallet as any, { commitment: 'confirmed' });
  const program = new anchor.Program(idl as any, provider);

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

  return activationResponse.data.token || activationResponse.data;
}

export async function fetchLiveFixtures(apiToken: string) {
  // We'll call the txLINE Soccer Feed for live events.
  const res = await axios.get(`${TXLINE_API_BASE}/api/soccer/v2/fixtures/live`, {
    headers: { Authorization: `Bearer ${apiToken}` }
  });
  return res.data;
}

export async function fetchAllFixtures(apiToken: string) {
  // Call the txLINE Soccer Feed for all fixtures (including upcoming)
  const res = await axios.get(`${TXLINE_API_BASE}/api/soccer/v2/fixtures`, {
    headers: { Authorization: `Bearer ${apiToken}` }
  });
  return res.data;
}
