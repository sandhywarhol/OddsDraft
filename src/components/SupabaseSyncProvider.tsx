'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// Keys in localStorage that belong to a specific wallet (prefix-matched)
const LINEUP_PREFIX = 'txodds_user_lineup_';
const PACK_PREFIX = 'oddsdraft_pack_opened_';
const COLLECTION_KEY = 'oddsdraft_card_collection';

function gatherLocalData(walletAddress: string) {
  const cardCollection = (() => {
    try {
      const s = localStorage.getItem(COLLECTION_KEY);
      return s ? JSON.parse(s) : { cards: [] };
    } catch { return { cards: [] }; }
  })();

  const packOpened: Record<string, boolean> = {};
  const lineups: Record<string, unknown> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    if (key.startsWith(PACK_PREFIX)) {
      const contestId = key.slice(PACK_PREFIX.length);
      packOpened[contestId] = true;
    } else if (key.startsWith(LINEUP_PREFIX)) {
      const contestId = key.slice(LINEUP_PREFIX.length);
      try {
        const val = localStorage.getItem(key);
        if (val) lineups[contestId] = JSON.parse(val);
      } catch {}
    }
  }

  const profile = (() => {
    try {
      const s = localStorage.getItem(`profile_${walletAddress}`);
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  })();

  return { cardCollection, packOpened, lineups, profile };
}

function applyRemoteData(
  walletAddress: string,
  remote: {
    card_collection: { cards: unknown[] } | null;
    pack_opened: Record<string, boolean> | null;
    lineups: Record<string, unknown> | null;
    profile: Record<string, unknown> | null;
  }
) {
  if (remote.card_collection?.cards?.length) {
    const local = (() => {
      try {
        const s = localStorage.getItem(COLLECTION_KEY);
        return s ? JSON.parse(s) : { cards: [] };
      } catch { return { cards: [] }; }
    })();
    // Merge: remote wins if local is empty, otherwise keep whichever has more cards
    const merged = (local.cards?.length ?? 0) >= (remote.card_collection.cards?.length ?? 0)
      ? local
      : remote.card_collection;
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(merged));
  }

  if (remote.pack_opened) {
    for (const [contestId, opened] of Object.entries(remote.pack_opened)) {
      if (opened) {
        localStorage.setItem(`${PACK_PREFIX}${contestId}`, '1');
      }
    }
  }

  if (remote.lineups) {
    for (const [contestId, data] of Object.entries(remote.lineups)) {
      const localKey = `${LINEUP_PREFIX}${contestId}`;
      if (!localStorage.getItem(localKey)) {
        localStorage.setItem(localKey, JSON.stringify(data));
      }
    }
  }

  if (remote.profile && Object.keys(remote.profile).length > 0) {
    const profileKey = `profile_${walletAddress}`;
    if (!localStorage.getItem(profileKey)) {
      localStorage.setItem(profileKey, JSON.stringify(remote.profile));
    }
  }
}

async function saveToSupabase(walletAddress: string) {
  const data = gatherLocalData(walletAddress);
  try {
    await fetch('/api/user/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: walletAddress,
        cardCollection: data.cardCollection,
        packOpened: data.packOpened,
        lineups: data.lineups,
        profile: data.profile,
      }),
    });
  } catch {}
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
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) {
      // Wallet disconnected — clear interval, forget wallet
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      walletRef.current = null;
      return;
    }

    const wallet = publicKey.toString();
    walletRef.current = wallet;

    // Load remote data into localStorage immediately on connect
    loadFromSupabase(wallet);

    // Save every 60 seconds while connected
    saveTimerRef.current = setInterval(() => {
      if (walletRef.current) saveToSupabase(walletRef.current);
    }, 60_000);

    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [connected, publicKey]);

  // Save before the tab closes
  useEffect(() => {
    const handleUnload = () => {
      if (walletRef.current) saveToSupabase(walletRef.current);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return <>{children}</>;
}
