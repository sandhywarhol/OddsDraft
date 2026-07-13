'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// Keys in localStorage that belong to a specific wallet (prefix-matched)
const LINEUP_PREFIX = 'txodds_user_lineup_';
const PACK_PREFIX = 'oddsdraft_pack_opened_';
const COLLECTION_KEY = 'oddsdraft_card_collection';
const UPGRADE_COLLECTION_KEY = 'oddsdraft_upgrade_collection';

function gatherLocalData(walletAddress: string) {
  const cardCollection = (() => {
    try { const s = localStorage.getItem(COLLECTION_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  })();
  const upgradeCollection = (() => {
    try { const s = localStorage.getItem(UPGRADE_COLLECTION_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  })();

  const packOpened: Record<string, unknown> = {};
  const lineups: Record<string, unknown> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith(PACK_PREFIX)) {
      packOpened[key.slice(PACK_PREFIX.length)] = true;
    } else if (key.startsWith(LINEUP_PREFIX)) {
      try {
        const val = localStorage.getItem(key);
        if (val) lineups[key.slice(LINEUP_PREFIX.length)] = JSON.parse(val);
      } catch {}
    }
  }

  const profile = (() => {
    try { const s = localStorage.getItem(`profile_${walletAddress}`); return s ? JSON.parse(s) : null; } catch { return null; }
  })();

  return { cardCollection, upgradeCollection, packOpened, lineups, profile };
}

async function saveToSupabase(walletAddress: string) {
  const data = gatherLocalData(walletAddress);
  // Merge skill + upgrade cards into one payload for card_collection
  const cardCollection = data.cardCollection ?? { cards: [] };
  if (data.upgradeCollection?.cards?.length) {
    cardCollection.upgradeCards = data.upgradeCollection.cards;
  }
  try {
    await fetch('/api/user/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: walletAddress,
        cardCollection,
        packOpened: Object.keys(data.packOpened).length ? data.packOpened : undefined,
        lineups: Object.keys(data.lineups).length ? data.lineups : undefined,
        profile: data.profile ?? undefined,
      }),
    });
  } catch {}
}

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

    // 1. Pull fresh Supabase data into localStorage (Supabase always wins).
    //    This ensures any local cache is replaced with the authoritative source
    //    before the user does anything this session.
    loadFromSupabase(wallet);
  }, [connected, publicKey]);

  // 2. Save local changes (pack opens, card gains) to Supabase when tab closes.
  //    No timer — only on unload, so we never push data before the fresh load completes.
  useEffect(() => {
    const handleUnload = () => {
      if (walletRef.current) saveToSupabase(walletRef.current);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return <>{children}</>;
}
