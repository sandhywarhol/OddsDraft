'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { subscribeToFreeTier, activateApiAccess, fetchGuestToken, fetchAllFixtures } from '@/lib/txline';

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
    const token = lsGet('txline_api_token') || ENV_TOKEN;
    // Auto-live when env token is present (production) or user previously activated
    const isLive = saved === 'live' || !!token;
    if (isLive) lsSet('txline_app_mode', 'live');
    return isLive ? 'live' : 'demo';
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

  // Get or refresh the guest JWT (needed alongside X-Api-Token for data requests)
  const ensureGuestJwt = async (): Promise<string> => {
    if (guestJwt) return guestJwt;
    console.log('[TxLINE] Fetching fresh guest JWT...');
    const jwt = await fetchGuestToken();
    setGuestJwt(jwt);
    lsSet('txline_guest_jwt', jwt);
    return jwt;
  };

  // Fetch live fixtures periodically if we have a token
  useEffect(() => {
    if (!apiToken) return;

    let isMounted = true;
    let consecutive403 = 0;

    const fetchFixtures = async () => {
      try {
        setIsLoadingFixtures(true);
        const jwt = await ensureGuestJwt();

        // Single call to /api/fixtures/snapshot — then derive live subset client-side
        const raw = await fetchAllFixtures(apiToken, jwt);
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
          // Also check kickoff time — if past kickoff and state=1 (scheduled), treat as potentially live
          const startMs = f.StartTime ?? 0;
          const kickoffPassed = startMs > 0 && Date.now() > startMs && Date.now() < startMs + 4.5 * 3600 * 1000;
          return stateMatch || clockRunning || kickoffPassed;
        });

        console.log(`[TxLINE] Fixtures: ${all.length} total, ${live.length} live`);
        setAllFixtures(all);
        setLiveFixtures(live);
        setFixturesAvailable(true);
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          consecutive403++;
          if (consecutive403 <= 2) {
            // Might be an expired JWT — refresh once and let next poll retry
            console.log(`[TxLINE] Auth error (${consecutive403}/2), refreshing guest JWT…`);
            setGuestJwt(null);
            localStorage.removeItem('txline_guest_jwt');
          } else {
            // Persistent 403 — this is a permissions issue, not an auth issue. Stop looping.
            console.warn('[TxLINE] Persistent 403 after JWT refresh — fixture likely not in free tier. Stopping refresh loop.');
          }
        } else if (error.response?.status === 404) {
          console.log('[TxLINE] /api/fixtures/snapshot returned 404');
          setFixturesAvailable(false);
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
  // guestJwt intentionally excluded — it's a credential, not a trigger to restart the poll loop.
  // Removing it from deps prevents an infinite refresh cycle when TxLINE returns 403.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiToken, appMode]);

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
