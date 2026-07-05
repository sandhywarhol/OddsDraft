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

// TxLINE sets access-control-allow-origin: * so browser can call directly.
// Direct calls bypass Vercel's serverless IPs which TxLINE blocks with 403.
const TXLINE_API_BASE = IS_DEVNET ? 'https://txline-dev.txodds.com' : 'https://txline.txodds.com';

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

// GET /api/fixtures/snapshot — all fixtures (filter by status client-side for "live")
export async function fetchAllFixtures(apiToken: string, guestJwt?: string | null) {
  const res = await axios.get(`${TXLINE_API_BASE}/api/fixtures/snapshot`, {
    headers: txlineHeaders(apiToken, guestJwt),
    timeout: 15000,
  });
  return res.data;
}

// GET /api/fixtures/snapshot — kept as alias; filter by live status client-side
export async function fetchLiveFixtures(apiToken: string, guestJwt?: string | null) {
  const res = await axios.get(`${TXLINE_API_BASE}/api/fixtures/snapshot`, {
    headers: txlineHeaders(apiToken, guestJwt),
    timeout: 15000,
  });
  // Filter to only live fixtures by game state or status
  const all = Array.isArray(res.data) ? res.data : [];
  const liveStates = ['FirstHalf', 'SecondHalf', 'HalfTime', 'ExtraTimeFirstHalf',
    'ExtraTimeHalfTime', 'ExtraTimeSecondHalf', 'Penalties', 'InProgress', 'Live'];
  return all.filter((f: any) => {
    const state = String(f.GameState || f.gameState || f.Status || f.status || '').toLowerCase();
    const clockRunning = f.Clock?.Running === true || f.clock?.running === true;
    return liveStates.some(s => state.includes(s.toLowerCase())) || clockRunning;
  });
}

// GET /api/scores/updates/{fixtureId} — live score updates (SSE stream via proxy)
// Merges an array of TxLINE events into one state object for score/clock/gameState,
// AND preserves the full event list under _allEvents for the event feed.
function mergeEvents(events: any[]): Record<string, unknown> {
  if (events.length === 0) return {};
  const merged: Record<string, unknown> = { ...events[events.length - 1] };

  // Preserve all individual events so the live page can build a complete event feed
  merged._allEvents = events;

  // game_finalised / halftime_finalised are definitive — override Action + force clock stopped
  const finalEv = events.find(e => /^(game_finalised|halftime_finalised)$/i.test(e?.Action ?? ''));
  if (finalEv) {
    merged.Action = finalEv.Action;
    merged.GameState = finalEv.GameState;
    // Match is over — clock must not be running regardless of individual event state
    if (/game_finalised/i.test(String(finalEv.Action))) {
      merged.Clock = { Running: false, Seconds: 0 };
    }
  }

  // For non-finalised matches: highest Clock.Seconds = most accurate live time
  if (!finalEv || !/game_finalised/i.test(String(finalEv.Action))) {
    let maxSecs = -1;
    for (const ev of events) {
      const s = ev?.Clock?.Seconds;
      if (typeof s === 'number' && s > maxSecs) { maxSecs = s; merged.Clock = ev.Clock; }
    }
  }

  // Last event with Participant1/Participant2 score = most recent goal tally
  for (let i = events.length - 1; i >= 0; i--) {
    const sc = events[i]?.Score;
    if (sc?.Participant1 || sc?.Participant2) { merged.Score = sc; break; }
  }

  // PlayerStats from most recent event that has them
  for (let i = events.length - 1; i >= 0; i--) {
    const ev = events[i];
    if (ev?.PlayerStats || ev?.playerStats) {
      merged.PlayerStats = ev.PlayerStats ?? ev.playerStats;
      break;
    }
  }
  return merged;
}

// GET /api/scores/updates/{fixtureId} — live score updates (SSE stream, direct browser call)
export async function fetchLiveScoreUpdates(apiToken: string, fixtureId: string, guestJwt?: string | null) {
  try {
    const res = await axios.get(`${TXLINE_API_BASE}/api/scores/updates/${fixtureId}`, {
      headers: txlineHeaders(apiToken, guestJwt),
      timeout: 15000,
    });
    if (!Array.isArray(res.data) || res.data.length === 0) return res.data ?? null;
    return mergeEvents(res.data);
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

// GET /api/scores/snapshot/{fixtureId} — full score snapshot (use for initial load)
export async function fetchScoreSnapshot(apiToken: string, fixtureId: string, guestJwt?: string | null) {
  try {
    const res = await axios.get(`${TXLINE_API_BASE}/api/scores/snapshot/${fixtureId}`, {
      headers: txlineHeaders(apiToken, guestJwt),
      timeout: 10000,
    });
    if (!Array.isArray(res.data) || res.data.length === 0) return res.data ?? null;
    return mergeEvents(res.data);
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

// GET /api/scores/historical/{fixtureId} — completed match data (2 weeks to 6 hours ago)
export async function fetchHistoricalScores(apiToken: string, fixtureId: string, guestJwt?: string | null) {
  try {
    const res = await axios.get(`${TXLINE_API_BASE}/api/scores/historical/${fixtureId}`, {
      headers: txlineHeaders(apiToken, guestJwt),
      timeout: 10000,
    });
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

export async function fetchGuestToken(): Promise<string> {
  const res = await axios.post(`${TXLINE_API_BASE}/auth/guest/start`);
  return res.data.token;
}

// Lineups may or may not be available depending on tier/timing
export async function fetchFixtureLineups(apiToken: string, fixtureId: string, guestJwt?: string | null) {
  const res = await axios.get(
    `${TXLINE_API_BASE}/api/fixtures/lineups/${fixtureId}`,
    { headers: txlineHeaders(apiToken, guestJwt), timeout: 10000 }
  );
  return res.data;
}
