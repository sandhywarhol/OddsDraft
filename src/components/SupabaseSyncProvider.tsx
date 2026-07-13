'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// Keys in localStorage that belong to a specific wallet (prefix-matched)
const LINEUP_PREFIX = 'txodds_user_lineup_';
const PACK_PREFIX = 'oddsdraft_pack_opened_';
const COLLECTION_KEY = 'oddsdraft_card_collection';

function applyRemoteData(
  walletAddress: string,
  remote: {
    card_collection: unknown | null;
    pack_opened: Record<string, unknown> | null;
    lineups: Record<string, unknown> | null;
    profile: Record<string, unknown> | null;
  }
) {
  // Supabase is always the source of truth — overwrite localStorage unconditionally.

  if (remote.card_collection != null) {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(remote.card_collection));
  }

  if (remote.pack_opened) {
    // Merge remote pack_opened keys into any existing local keys (union, never remove)
    for (const [key, val] of Object.entries(remote.pack_opened)) {
      if (val) localStorage.setItem(`${PACK_PREFIX}${key}`, '1');
    }
  }

  if (remote.lineups) {
    for (const [contestId, data] of Object.entries(remote.lineups)) {
      // Always overwrite — Supabase has the confirmed post-payment lineup
      localStorage.setItem(`${LINEUP_PREFIX}${contestId}`, JSON.stringify(data));
    }
  }

  if (remote.profile && Object.keys(remote.profile).length > 0) {
    // Always overwrite — profile page saves to Supabase on every update
    localStorage.setItem(`profile_${walletAddress}`, JSON.stringify(remote.profile));
  }
}

async function loadFromSupabase(walletAddress: string) {
  try {
    const res = await fetch(`/api/user/data?wallet=${walletAddress}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data) applyRemoteData(walletAddress, data);
  } catch {}
}

export default function SupabaseSyncProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, connected } = useWallet();
  const walletRef = useRef<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) {
      walletRef.current = null;
      return;
    }

    const wallet = publicKey.toString();
    if (walletRef.current === wallet) return; // already loaded for this wallet
    walletRef.current = wallet;

    // Pull fresh data from Supabase into localStorage on every wallet connect.
    // Supabase is the source of truth — this clears any stale cache.
    loadFromSupabase(wallet);
  }, [connected, publicKey]);

  return <>{children}</>;
}
