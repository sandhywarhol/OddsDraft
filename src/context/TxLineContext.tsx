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

export const TxLineProvider = ({ children }: { children: ReactNode }) => {
  const [appMode, setAppMode] = useState<'demo' | 'live'>('demo');
  const toggleAppMode = () => setAppMode(prev => {
    const next = prev === 'demo' ? 'live' : 'demo';
    localStorage.setItem('txline_app_mode', next);
    return next;
  });

  const [apiToken, setApiToken] = useState<string | null>(null);
  const [guestJwt, setGuestJwt] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [liveFixtures, setLiveFixtures] = useState<any[]>([]);
  const [allFixtures, setAllFixtures] = useState<any[]>([]);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState(false);
  const [fixturesAvailable, setFixturesAvailable] = useState(true);

  const wallet = useWallet();
  const { connection } = useConnection();

  // On mount, restore tokens from localStorage — fall back to env var if empty.
  // NEXT_PUBLIC_TXODDS_API_TOKEN is set in Vercel env so users don't need to
  // subscribe again after deployment.
  useEffect(() => {
    const envToken = process.env.NEXT_PUBLIC_TXODDS_API_TOKEN ?? '';
    const savedToken = localStorage.getItem('txline_api_token') || envToken || null;
    if (savedToken) {
      setApiToken(savedToken);
      // Persist to localStorage so subsequent reads are instant
      localStorage.setItem('txline_api_token', savedToken);
    }
    const savedJwt = localStorage.getItem('txline_guest_jwt');
    if (savedJwt) setGuestJwt(savedJwt);
    // Auto-switch to live mode when a token is available (env token = always live)
    const savedMode = localStorage.getItem('txline_app_mode');
    if (savedToken && (savedMode === 'live' || envToken)) {
      setAppMode('live');
    }
  }, []);

  // Persist apiToken
  useEffect(() => {
    if (apiToken) {
      localStorage.setItem('txline_api_token', apiToken);
    }
  }, [apiToken]);

  // Persist guestJwt
  useEffect(() => {
    if (guestJwt) {
      localStorage.setItem('txline_guest_jwt', guestJwt);
    }
  }, [guestJwt]);

  // Get or refresh the guest JWT (needed alongside X-Api-Token for data requests)
  const ensureGuestJwt = async (): Promise<string> => {
    if (guestJwt) return guestJwt;
    console.log('[TxLINE] Fetching fresh guest JWT...');
    const jwt = await fetchGuestToken();
    setGuestJwt(jwt);
    localStorage.setItem('txline_guest_jwt', jwt);
    return jwt;
  };

  // Fetch live fixtures periodically if we have a token
  useEffect(() => {
    if (!apiToken) return;

    let isMounted = true;

    const fetchFixtures = async () => {
      try {
        setIsLoadingFixtures(true);
        const jwt = await ensureGuestJwt();

        // Single call to /api/fixtures/snapshot — then derive live subset client-side
        const raw = await fetchAllFixtures(apiToken, jwt);
        const all: any[] = Array.isArray(raw) ? raw : (raw?.fixtures ?? raw?.data ?? []);

        if (!isMounted) return;

        // Live states per TxLINE documentation
        const liveStates = ['firsthalf', 'secondhalf', 'halftime', 'extratimefirsthalf',
          'extratimehalftime', 'extratimesecondhalf', 'penalties', 'inprogress', 'live'];
        const live = all.filter((f: any) => {
          // String() prevents TypeError if GameState is an object or number
          const state = String(f.GameState ?? f.gameState ?? f.Status ?? f.status ?? '').toLowerCase();
          const stateMatch = liveStates.some(s => state.includes(s));
          // TxLINE devnet sometimes reports "scheduled" even when match is running — use Clock as fallback
          const clockRunning = f.Clock?.Running === true || f.clock?.running === true;
          return stateMatch || clockRunning;
        });

        console.log(`[TxLINE] Fixtures: ${all.length} total, ${live.length} live`);
        setAllFixtures(all);
        setLiveFixtures(live);
        setFixturesAvailable(true);
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('[TxLINE] Auth expired, refreshing guest JWT...');
          setGuestJwt(null);
          localStorage.removeItem('txline_guest_jwt');
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
    const pollRate = appMode === 'live' ? 10000 : 30000;
    const interval = setInterval(fetchFixtures, pollRate);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiToken, guestJwt, appMode]);

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
    localStorage.setItem('txline_api_token', token);
    setAppMode('live');
    localStorage.setItem('txline_app_mode', 'live');
  };

  const subscribeAndActivate = async () => {
    try {
      setIsSubscribing(true);

      // Check if there's a pending txSig from a previous failed activation
      let txSig = localStorage.getItem('txline_pending_txsig');

      if (!txSig) {
        console.log('[TxLINE] Subscribing on-chain...');
        txSig = await subscribeToFreeTier(wallet, connection);
        console.log('[TxLINE] Subscription tx:', txSig);
        localStorage.setItem('txline_pending_txsig', txSig);
      } else {
        console.log('[TxLINE] Reusing pending txSig from previous attempt:', txSig);
      }

      console.log('[TxLINE] Activating API access...');
      const { token, guestJwt: jwt } = await activateApiAccess(wallet, txSig);
      console.log('[TxLINE] Activated! Token:', `${token.substring(0, 20)}...`);

      setApiToken(token);
      setGuestJwt(jwt);
      localStorage.setItem('txline_guest_jwt', jwt);
      localStorage.removeItem('txline_pending_txsig');
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
