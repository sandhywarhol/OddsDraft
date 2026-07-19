'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { COLLECTION_CHANGED_EVENT, REMOTE_SYNCED_EVENT } from '@/lib/card-collection';

// Keys in localStorage that belong to a specific wallet (prefix-matched)
const LINEUP_PREFIX = 'txodds_user_lineup_';
const PACK_PREFIX = 'oddsdraft_pack_opened_';
const COLLECTION_KEY = 'oddsdraft_card_collection';
const UPGRADE_COLLECTION_KEY = 'oddsdraft_upgrade_collection';
// These two are written directly by other pages (not synced to/from Supabase by this
// provider), but they're just as wallet-agnostic in storage and must be cleared on a
// wallet switch for the same reason — see clearSharedLocalCaches below.
const ENTERED_CONTESTS_PREFIX = 'txodds_entered_contests_';
const PENDING_SIG_PREFIX = 'txodds_pending_sig_';
const NEW_CARDS_KEY = 'oddsdraft_new_cards';
const SOLD_ACKED_KEY = 'oddsdraft_sold_acked';
// Tracks which wallet last used this browser/device, purely to detect a switch.
const LAST_WALLET_KEY = 'oddsdraft_last_wallet';

// None of the keys above are namespaced per wallet — they're a single shared cache on
// this device. Connecting a different wallet than last time must wipe them first, or
// the new wallet inherits the previous wallet's cards/entries/lineups until (if ever)
// Supabase happens to have data for a key to overwrite them with. An empty/no-data
// response from Supabase for a brand-new wallet does NOT clear stale local data on its
// own — applyRemoteData only overwrites keys it actually has a value for.
function clearSharedLocalCaches() {
  const exactKeys = [COLLECTION_KEY, UPGRADE_COLLECTION_KEY, NEW_CARDS_KEY, SOLD_ACKED_KEY];
  const prefixes = [PACK_PREFIX, LINEUP_PREFIX, ENTERED_CONTESTS_PREFIX, PENDING_SIG_PREFIX];
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (exactKeys.includes(key) || prefixes.some(p => key.startsWith(p))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

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

// keepalive lets the request finish even after the page begins tearing down, which is
// exactly what the pagehide/visibilitychange flush relies on — a plain fetch there gets
// cancelled mid-flight and the cards never reach Supabase (the cross-device bug).
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
      keepalive: true,
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
  // NOTE: write these keys directly (not via card-collection's saveCollection) so we
  // don't emit COLLECTION_CHANGED_EVENT and mark the just-loaded data "dirty".

  if (remote.card_collection != null) {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(remote.card_collection));
    // card_collection carries upgradeCards alongside skill cards; split it back out so
    // the upgrade inventory survives a fresh device too.
    const upgradeCards = (remote.card_collection as { upgradeCards?: unknown[] })?.upgradeCards;
    if (Array.isArray(upgradeCards)) {
      localStorage.setItem(UPGRADE_COLLECTION_KEY, JSON.stringify({ cards: upgradeCards }));
    }
  }

  if (remote.pack_opened) {
    // Merge remote pack_opened keys into any existing local keys (union, never remove)
    for (const [key, val] of Object.entries(remote.pack_opened)) {
      if (val) localStorage.setItem(`${PACK_PREFIX}${key}`, '1');
    }
    // Sync welcomeGiftClaimed into the key the cards page fast-path reads
    if (remote.pack_opened.welcomeGiftClaimed) {
      localStorage.setItem(`txodds_welcome_gift_claimed_${walletAddress}`, 'true');
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

// Returns true only when the pull actually succeeded (including a legitimate "no data
// yet" response). A network failure returns false so the caller keeps saves locked and
// never wipes Supabase with the freshly-cleared local cache.
async function loadFromSupabase(walletAddress: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/user/data?wallet=${walletAddress}`);
    if (!res.ok) return false;
    const data = await res.json();
    if (data) applyRemoteData(walletAddress, data);
    return true;
  } catch {
    return false;
  }
}

export default function SupabaseSyncProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, connected } = useWallet();
  const walletRef = useRef<string | null>(null);
  // Gate all pushes until the authoritative pull has landed for this wallet, so a
  // just-cleared local cache can never overwrite real Supabase data.
  const loadedRef = useRef(false);
  // Only push when there's an actual local change to save — avoids hammering Supabase
  // on every tab switch (visibilitychange fires constantly).
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced push — collapses a burst of mutations (e.g. combine → new card) into one.
  const requestSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (loadedRef.current && walletRef.current && dirtyRef.current) {
        dirtyRef.current = false;
        saveToSupabase(walletRef.current);
      }
    }, 1200);
  }, []);

  // Immediate push for page-exit — no debounce, keepalive carries it through teardown.
  const flushImmediate = useCallback(() => {
    if (loadedRef.current && walletRef.current && dirtyRef.current) {
      dirtyRef.current = false;
      saveToSupabase(walletRef.current);
    }
  }, []);

  useEffect(() => {
    if (!connected || !publicKey) {
      walletRef.current = null;
      loadedRef.current = false;
      return;
    }

    const wallet = publicKey.toString();
    if (walletRef.current === wallet) return; // already loaded for this wallet
    walletRef.current = wallet;
    loadedRef.current = false;

    // 0. The shared local caches are not namespaced per wallet, so they may belong to
    //    whichever wallet last touched this browser — including a wallet used before
    //    this reconciliation logic even existed, in which case there is no recorded
    //    LAST_WALLET_KEY to compare against. Relying on "recorded last wallet differs"
    //    silently skips clearing on that first run and leaks the old wallet's cards/
    //    lineups/entries into the new wallet. Always wipe first, then let Supabase (the
    //    authoritative source) repopulate whatever this wallet actually owns — a brand
    //    new wallet with nothing in Supabase yet ends up empty, not inheriting progress.
    try {
      clearSharedLocalCaches();
      localStorage.setItem(LAST_WALLET_KEY, wallet);
    } catch {}

    // 1. Pull fresh Supabase data into localStorage (Supabase always wins). Only unlock
    //    saves once this succeeds; if a mutation already marked us dirty while the pull
    //    was in flight, push it now that the authoritative data has been merged in.
    loadFromSupabase(wallet).then(ok => {
      if (walletRef.current === wallet && ok) {
        loadedRef.current = true;
        // Tell mounted collection views to re-read localStorage now the pull has landed.
        window.dispatchEvent(new Event(REMOTE_SYNCED_EVENT));
        if (dirtyRef.current) requestSave();
      }
    });
  }, [connected, publicKey, requestSave]);

  // 2. Push local card changes to Supabase as they happen — the moment a pack is opened,
  //    a card combined/upgraded, or a gift claimed — instead of only on tab close.
  useEffect(() => {
    const onChange = () => {
      dirtyRef.current = true;
      requestSave();
    };
    window.addEventListener(COLLECTION_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener(COLLECTION_CHANGED_EVENT, onChange);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [requestSave]);

  // 3. Reliable final flush. beforeunload alone drops saves on mobile; pagehide and
  //    visibilitychange(hidden) also cover app-switching and mobile backgrounding.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushImmediate();
    };
    window.addEventListener('pagehide', flushImmediate);
    window.addEventListener('beforeunload', flushImmediate);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flushImmediate);
      window.removeEventListener('beforeunload', flushImmediate);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [flushImmediate]);

  return <>{children}</>;
}
