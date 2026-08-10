'use client';

// MatchContext — replaces the old TxLineContext
// All live fixture data now comes from the ESPN free API (no auth needed).
// The context interface is intentionally backward-compatible so existing consumers
// (live page, page.tsx) continue to work with minimal changes.

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
// NOTE: subscribeToFreeTier / activateApiAccess are Solana on-chain subscription
// functions that remain unchanged — they have nothing to do with the data API.
import { subscribeToFreeTier, activateApiAccess, fetchGuestToken } from '@/lib/txline';
import type { EspnFixture } from '@/lib/espn';
import { LEAGUES } from '@/lib/leagues';

interface MatchContextProps {
  appMode: 'demo' | 'live';
  toggleAppMode: () => void;
  isAdmin: boolean;

  // Kept for backward compat — no longer meaningful with ESPN (no token needed)
  apiToken: string | null;
  guestJwt: string | null;
  isSubscribing: boolean;
  subscribeAndActivate: () => Promise<void>;
  getGuestToken: () => Promise<void>;
  setManualApiToken: (token: string) => void;

  // ESPN-sourced fixture state
  liveFixtures: EspnFixture[];   // Currently live matches
  allFixtures: EspnFixture[];    // All matches for today
  isLoadingFixtures: boolean;
  fixturesAvailable: boolean;
}

const MatchContext = createContext<MatchContextProps>({
  appMode: 'demo',
  toggleAppMode: () => {},
  isAdmin: false,

  apiToken: null,
  guestJwt: null,
  isSubscribing: false,
  subscribeAndActivate: async () => {},
  getGuestToken: async () => {},
  setManualApiToken: () => {},

  liveFixtures: [],
  allFixtures: [],
  isLoadingFixtures: false,
  fixturesAvailable: true,
});

export const useTxLine = () => useContext(MatchContext);

// Read localStorage safely (SSR guard)
function lsGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET ?? 'FwHtKFZY6jRqhtczE7Nkwq7pkR7fb3vWq6YqYSYtGcMv';

export const TxLineProvider = ({ children }: { children: ReactNode }) => {
  // Token kept for Solana subscription flow (not for ESPN — ESPN needs no auth)
  const ENV_TOKEN = process.env.NEXT_PUBLIC_TXODDS_API_TOKEN ?? '';

  const [apiToken, setApiToken] = useState<string | null>(() => {
    const saved = lsGet('txline_api_token') || ENV_TOKEN || null;
    if (saved) lsSet('txline_api_token', saved);
    return saved;
  });

  const [appMode, setAppMode] = useState<'demo' | 'live'>(() => {
    const saved = lsGet('txline_app_mode');
    const isDemo = saved === 'demo';
    if (!isDemo) lsSet('txline_app_mode', 'live');
    return isDemo ? 'demo' : 'live';
  });

  const toggleAppMode = () => setAppMode(prev => {
    const next = prev === 'demo' ? 'live' : 'demo';
    lsSet('txline_app_mode', next);
    return next;
  });

  const [guestJwt, setGuestJwt] = useState<string | null>(() => lsGet('txline_guest_jwt'));
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [liveFixtures, setLiveFixtures] = useState<EspnFixture[]>([]);
  const [allFixtures, setAllFixtures] = useState<EspnFixture[]>([]);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState(false);
  const [fixturesAvailable, setFixturesAvailable] = useState(true);

  const wallet = useWallet();
  const { connection } = useConnection();
  const isAdmin = !!(wallet.publicKey && wallet.publicKey.toString() === ADMIN_WALLET);

  // Force non-admin users out of demo mode
  useEffect(() => {
    if (!isAdmin && appMode === 'demo') {
      setAppMode('live');
      lsSet('txline_app_mode', 'live');
    }
  }, [isAdmin, appMode]);

  useEffect(() => {
    if (apiToken) lsSet('txline_api_token', apiToken);
  }, [apiToken]);

  useEffect(() => {
    if (guestJwt) lsSet('txline_guest_jwt', guestJwt);
  }, [guestJwt]);

  // ── Fetch live fixtures from ESPN periodically ─────────────────────────────
  // ESPN is polled via the schedule API (server-side) so we don't expose raw
  // ESPN requests from the client browser.
  useEffect(() => {
    let isMounted = true;

    const fetchFixtures = async () => {
      try {
        setIsLoadingFixtures(true);

        // Fetch from our multi-league schedule endpoint
        // We pass 'all' to get every league, defaulting to today + next 30 days
        const res = await fetch('/api/schedule/all', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Schedule fetch failed: ${res.status}`);

        const data: any[] = await res.json();
        if (!isMounted) return;

        const all: EspnFixture[] = data.map((f: any): EspnFixture => ({
          espnId: f.fixtureId,
          leagueId: f.leagueId,
          homeTeam: f.homeTeam,
          awayTeam: f.awayTeam,
          homeTeamId: f.homeTeamId ?? '',
          awayTeamId: f.awayTeamId ?? '',
          homeLogo: f.homeFlag?.startsWith('http') ? f.homeFlag : '',
          awayLogo: f.awayFlag?.startsWith('http') ? f.awayFlag : '',
          homeScore: f.homeScore ?? null,
          awayScore: f.awayScore ?? null,
          kickoffAt: f.kickoffAt,
          statusState: f.completed ? 'post' : (f.statusState ?? 'pre'),
          statusDescription: f.statusDescription ?? '',
          completed: !!f.completed,
          clockDisplay: f.clockDisplay ?? '',
          period: f.period ?? 0,
        }));

        const live = all.filter(f => f.statusState === 'in');

        console.log(`[ESPN] Fixtures: ${all.length} total, ${live.length} live`);
        setAllFixtures(all);
        setLiveFixtures(live);
        setFixturesAvailable(true);
      } catch (error: any) {
        if (!isMounted) return;
        console.error('[ESPN] Error fetching fixtures:', error.message);
        setFixturesAvailable(false);
      } finally {
        if (isMounted) setIsLoadingFixtures(false);
      }
    };

    fetchFixtures();
    // Poll every 60s in live mode, every 5min in demo
    const pollRate = appMode === 'live' ? 60_000 : 5 * 60_000;
    const interval = setInterval(fetchFixtures, pollRate);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [appMode]);

  // ── Solana subscription (unchanged — not ESPN related) ────────────────────
  const getGuestToken = async () => {
    try {
      setIsSubscribing(true);
      const token = await fetchGuestToken();
      if (token) setApiToken(token);
    } catch (error) {
      console.error('Failed to get guest token:', error);
      throw error;
    } finally {
      setIsSubscribing(false);
    }
  };

  const setManualApiToken = (token: string) => {
    setApiToken(token);
    lsSet('txline_api_token', token);
    setAppMode('live');
    lsSet('txline_app_mode', 'live');
  };

  const subscribeAndActivate = async () => {
    try {
      setIsSubscribing(true);
      let txSig = lsGet('txline_pending_txsig');
      if (!txSig) {
        txSig = await subscribeToFreeTier(wallet, connection);
        lsSet('txline_pending_txsig', txSig);
      }
      const { token, guestJwt: jwt } = await activateApiAccess(wallet, txSig);
      setApiToken(token);
      setGuestJwt(jwt);
      lsSet('txline_guest_jwt', jwt);
      try { localStorage.removeItem('txline_pending_txsig'); } catch { /* ignore */ }
    } catch (error: any) {
      console.error('[TxLine Subscription] Failed:', error);
      if (error?.logs?.length) console.error('TX logs:', error.logs.join('\n'));
      throw error;
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <MatchContext.Provider value={{
      appMode, toggleAppMode, isAdmin,
      apiToken, guestJwt, isSubscribing,
      subscribeAndActivate, getGuestToken, setManualApiToken,
      liveFixtures, allFixtures, isLoadingFixtures, fixturesAvailable,
    }}>
      {children}
    </MatchContext.Provider>
  );
};

// ── MatchContext export (new name) ─────────────────────────────────────────────
export const useMatch = () => useContext(MatchContext);
export const MatchProvider = TxLineProvider; // alias
