import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';
import { WC2026_PLAYERS } from '@/lib/wc2026-players-static';
import { ENTRY_FEE_SOL } from '@/lib/fantasy-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const REQUIRED_POSITIONS = ['GK', 'DEF', 'MID', 'SWG', 'ATT'] as const;
const VALID_CONTEST_TYPES = ['top3', '5050', 'wta'] as const;

function validateLineup(
  lineup: unknown,
  fixtureId: string
): { ok: true } | { ok: false; error: string } {
  if (!lineup || typeof lineup !== 'object') {
    return { ok: false, error: 'Invalid lineup format' };
  }

  const l = lineup as Record<string, unknown>;

  // ── players array ────────────────────────────────────────────────────
  if (!Array.isArray(l.players)) {
    return { ok: false, error: 'lineup.players must be an array' };
  }
  if (l.players.length !== 5) {
    return { ok: false, error: `Lineup must have exactly 5 players (got ${l.players.length})` };
  }

  // ── each player shape ────────────────────────────────────────────────
  for (const p of l.players) {
    if (!p || typeof p !== 'object') return { ok: false, error: 'Invalid player entry' };
    const player = p as Record<string, unknown>;
    if (typeof player.id !== 'string' || !player.id) return { ok: false, error: 'Each player must have a string id' };
    if (typeof player.position !== 'string') return { ok: false, error: 'Each player must have a position' };
    if (!REQUIRED_POSITIONS.includes(player.position as any)) {
      return { ok: false, error: `Invalid position "${player.position}". Must be one of: ${REQUIRED_POSITIONS.join(', ')}` };
    }
  }

  const players = l.players as { id: string; position: string; name?: string; team?: string }[];

  // ── no duplicate player IDs ──────────────────────────────────────────
  const ids = players.map(p => p.id);
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: 'Lineup contains duplicate players' };
  }

  // ── exactly one player per required position ─────────────────────────
  for (const pos of REQUIRED_POSITIONS) {
    const count = players.filter(p => p.position === pos).length;
    if (count !== 1) {
      return { ok: false, error: `Lineup must have exactly 1 ${pos} player (got ${count})` };
    }
  }

  // ── captain must be one of the 5 players ────────────────────────────
  if (typeof l.captain !== 'string' || !l.captain) {
    return { ok: false, error: 'A captain must be selected' };
  }
  if (!ids.includes(l.captain)) {
    return { ok: false, error: 'Captain must be one of the selected players' };
  }

  // ── players must belong to the fixture's two teams ───────────────────
  const fixture = WC2026_FIXTURES.find(f => f.fixtureId === fixtureId);
  if (fixture) {
    const allowedTeams = new Set([fixture.homeTeam, fixture.awayTeam]);

    // Build a lookup of known player IDs and their teams
    const playerRegistry = new Map(WC2026_PLAYERS.map(p => [p.id, p]));

    for (const p of players) {
      const known = playerRegistry.get(p.id);
      if (!known) {
        return { ok: false, error: `Unknown player id "${p.id}"` };
      }
      if (!allowedTeams.has(known.team)) {
        return {
          ok: false,
          error: `Player "${known.name}" (${known.team}) does not belong to this fixture (${fixture.homeTeam} vs ${fixture.awayTeam})`,
        };
      }
      // Also verify the client-sent position matches the canonical position
      if (known.position !== p.position) {
        return {
          ok: false,
          error: `Position mismatch for "${known.name}": server has ${known.position}, client sent ${p.position}`,
        };
      }
    }
  }

  return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fixtureId, walletAddress, contestType, lineup, entryTxSig } = body;

    // ── Basic field presence ─────────────────────────────────────────────
    if (!fixtureId || !walletAddress || !contestType || !lineup) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── Contest type ─────────────────────────────────────────────────────
    if (!VALID_CONTEST_TYPES.includes(contestType)) {
      return NextResponse.json(
        { error: `Invalid contestType "${contestType}". Must be one of: ${VALID_CONTEST_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // ── Lineup validation ────────────────────────────────────────────────
    const validation = validateLineup(lineup, fixtureId);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // ── On-chain entry payment verification ──────────────────────────────
    // When a real tx sig is provided, verify the transfer happened on-chain.
    // Null sig is allowed for demo mode (wallet not connected).
    if (entryTxSig) {
      const treasuryWallet = process.env.NEXT_PUBLIC_TREASURY_WALLET;
      if (!treasuryWallet) {
        return NextResponse.json({ error: 'Server configuration error: treasury not set' }, { status: 500 });
      }

      // Nonce check — reject reused signatures
      const { data: existingSig } = await supabase
        .from('contest_entries')
        .select('id')
        .eq('entry_tx_sig', entryTxSig)
        .maybeSingle();
      if (existingSig) {
        return NextResponse.json({ error: 'Transaction signature already used' }, { status: 409 });
      }

      try {
        const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';
        const connection = new Connection(rpc, 'confirmed');
        const txInfo = await connection.getParsedTransaction(entryTxSig, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });

        if (!txInfo) {
          return NextResponse.json({ error: 'Transaction not found or not yet confirmed' }, { status: 400 });
        }

        const ENTRY_FEE_LAMPORTS = Math.floor(ENTRY_FEE_SOL * LAMPORTS_PER_SOL);
        const instructions = txInfo.transaction?.message?.instructions ?? [];
        const verified = instructions.some((ix: any) => {
          if (ix.parsed?.type !== 'transfer') return false;
          const info = ix.parsed.info;
          return (
            info.destination === treasuryWallet &&
            info.source === walletAddress &&
            Number(info.lamports) >= ENTRY_FEE_LAMPORTS
          );
        });

        if (!verified) {
          return NextResponse.json(
            { error: 'Entry payment not verified: expected SOL transfer from your wallet to treasury' },
            { status: 400 }
          );
        }
      } catch (err: any) {
        return NextResponse.json({ error: `Transaction verification failed: ${err.message}` }, { status: 400 });
      }
    }

    // ── Save to Supabase ─────────────────────────────────────────────────
    const { data, error } = await supabase
      .from('contest_entries')
      .upsert(
        {
          fixture_id: fixtureId,
          wallet_address: walletAddress,
          contest_type: contestType,
          lineup,
          entry_tx_sig: entryTxSig ?? null,
        },
        { onConflict: 'fixture_id,wallet_address,contest_type', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (error) {
      console.error('[contest/enter]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Upsert user record
    await supabase
      .from('users')
      .upsert(
        { wallet_address: walletAddress, updated_at: new Date().toISOString() },
        { onConflict: 'wallet_address', ignoreDuplicates: true }
      );

    return NextResponse.json({ success: true, entryId: data?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
