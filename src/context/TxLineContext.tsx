'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { subscribeToFreeTier, activateApiAccess, fetchGuestToken } from '@/lib/txline';

interface TxLineContextProps {
  appMode: 'demo' | 'live';
  toggleAppMode: () => void;

  apiToken: string | null;
  guestJwt: string | null;
  isSubscribing: boolean;
  subscribeAndActivate: () => Promise<void>;
  getGuestToken: () => Promise<void>;
  setManualApiToken: (token: string) => void;
  liveFixtures: any[];
  allFixtures: any[];
  isLoadingFixtures: boolean;
  /** false when devnet /fixtures returns 404 (live-only mode) */
  fixturesAvailable: boolean;
}

const TxLineContext = createContext<TxLineContextProps>({
  appMode: 'demo',
  toggleAppMode: () => {},

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

export const useTxLine = () => useContext(TxLineContext);

// Read localStorage safely (SSR guard)
function lsGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

export const TxLineProvider = ({ children }: { children: ReactNode }) => {
  const ENV_TOKEN = process.env.NEXT_PUBLIC_TXODDS_API_TOKEN ?? '';

  // Initialise synchronously so render #1 already has the token — no async gap.
  const [apiToken, setApiToken] = useState<string | null>(() => {
    const saved = lsGet('txline_api_token') || ENV_TOKEN || null;
    if (saved) lsSet('txline_api_token', saved);
    return saved;
  });

  const [appMode, setAppMode] = useState<'demo' | 'live'>(() => {
    const saved = lsGet('txline_app_mode');
    // Default to live — proxy handles auth server-side, no client token needed
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
  const [liveFixtures, setLiveFixtures] = useState<any[]>([]);
  const [allFixtures, setAllFixtures] = useState<any[]>([]);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState(false);
  const [fixturesAvailable, setFixturesAvailable] = useState(true);

  const wallet = useWallet();
  const { connection } = useConnection();

  // Persist apiToken changes (e.g. after subscription activation)
  useEffect(() => {
    if (apiToken) lsSet('txline_api_token', apiToken);
  }, [apiToken]);

  // Persist guestJwt changes
  useEffect(() => {
    if (guestJwt) lsSet('txline_guest_jwt', guestJwt);
  }, [guestJwt]);

  // Fetch live fixtures periodically — always runs, proxy handles auth server-side
  useEffect(() => {
    let isMounted = true;
    let consecutive403 = 0;

    const fetchFixtures = async () => {
      try {
        setIsLoadingFixtures(true);

        // Use proxy so no client-side token is needed
        const proxyRes = await fetch('/api/txline/fixtures/snapshot', { cache: 'no-store' });
        if (!proxyRes.ok) throw Object.assign(new Error('fixtures fetch failed'), { response: { status: proxyRes.status } });
        const raw = await proxyRes.json();
        const all: any[] = Array.isArray(raw) ? raw : (raw?.fixtures ?? raw?.data ?? []);

        consecutive403 = 0; // reset on success
        if (!isMounted) return;

        // Live states per TxLINE documentation (string names from score updates)
        const liveStateStrings = ['firsthalf', 'secondhalf', 'halftime', 'extratimefirsthalf',
          'extratimehalftime', 'extratimesecondhalf', 'penalties', 'inprogress', 'live'];
        // TxLINE fixture snapshot uses integer GameState codes (2=FirstHalf, 3=HalfTime, 4=SecondHalf, etc.)
        const liveStateInts = new Set([2, 3, 4, 5, 6, 7, 8]);
        const live = all.filter((f: any) => {
          const rawState = f.GameState ?? f.gameState ?? f.Status ?? f.status;
          const intState = typeof rawState === 'number' ? rawState : null;
          const strState = typeof rawState === 'string' ? rawState.toLowerCase() : '';
          const stateMatch = (intState !== null && liveStateInts.has(intState))
            || liveStateStrings.some(s => strState.includes(s));
          // TxLINE sometimes reports "scheduled" even when match is running — use Clock as fallback
          const clockRunning = f.Clock?.Running === true || f.clock?.running === true;
          // Do NOT use kickoff time as a live signal — a delayed match will still have
          // past StartTime but TxLINE correctly keeps it as "Scheduled".
          return stateMatch || clockRunning;
        });

        console.log(`[TxLINE] Fixtures: ${all.length} total, ${live.length} live`);
        setAllFixtures(all);
        setLiveFixtures(live);
        setFixturesAvailable(true);
      } catch (error: any) {
        const status = error.response?.status ?? 0;
        if (status === 404) {
          setFixturesAvailable(false);
        } else if (status >= 400) {
          consecutive403++;
          if (consecutive403 > 3) {
            console.warn('[TxLINE] Repeated fixture errors, backing off');
          }
        } else {
          console.log('[TxLINE] Error fetching fixtures:', error.message);
        }
      } finally {
        if (isMounted) setIsLoadingFixtures(false);
      }
    };

    fetchFixtures();
    const pollRate = appMode === 'live' ? 30000 : 60000;
    const interval = setInterval(fetchFixtures, pollRate);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [appMode]);

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

      // Check if there's a pending txSig from a previous failed activation
      let txSig = lsGet('txline_pending_txsig');

      if (!txSig) {
        console.log('[TxLINE] Subscribing on-chain...');
        txSig = await subscribeToFreeTier(wallet, connection);
        console.log('[TxLINE] Subscription tx:', txSig);
        lsSet('txline_pending_txsig', txSig);
      } else {
        console.log('[TxLINE] Reusing pending txSig from previous attempt:', txSig);
      }

      console.log('[TxLINE] Activating API access...');
      const { token, guestJwt: jwt } = await activateApiAccess(wallet, txSig);
      console.log('[TxLINE] Activated! Token:', `${token.substring(0, 20)}...`);

      setApiToken(token);
      setGuestJwt(jwt);
      lsSet('txline_guest_jwt', jwt);
      try { localStorage.removeItem('txline_pending_txsig'); } catch { /* ignore */ }
    } catch (error: any) {
      // Log full details so we can diagnose the exact failure in browser DevTools
      console.error('[TxLINE] Failed to subscribe & activate:', error);
      if (error?.logs?.length) console.error('[TxLINE] TX logs:', error.logs.join('\n'));
      if (error?.message) console.error('[TxLINE] message:', error.message);
      if (error?.code) console.error('[TxLINE] code:', error.code);
      throw error;
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <TxLineContext.Provider value={{ appMode, toggleAppMode, apiToken, guestJwt, isSubscribing, subscribeAndActivate, getGuestToken, setManualApiToken, liveFixtures, allFixtures, isLoadingFixtures, fixturesAvailable }}>
      {children}
    </TxLineContext.Provider>
  );
};
