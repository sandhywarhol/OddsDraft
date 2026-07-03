'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { subscribeToFreeTier, activateApiAccess, fetchGuestToken, fetchLiveFixtures, fetchAllFixtures } from '@/lib/txline';

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
  const toggleAppMode = () => setAppMode(prev => prev === 'demo' ? 'live' : 'demo');

  const [apiToken, setApiToken] = useState<string | null>(null);
  const [guestJwt, setGuestJwt] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [liveFixtures, setLiveFixtures] = useState<any[]>([]);
  const [allFixtures, setAllFixtures] = useState<any[]>([]);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState(false);
  const [fixturesAvailable, setFixturesAvailable] = useState(true);

  const wallet = useWallet();
  const { connection } = useConnection();

  // On mount, restore tokens from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('txline_api_token');
    if (savedToken) setApiToken(savedToken);
    const savedJwt = localStorage.getItem('txline_guest_jwt');
    if (savedJwt) setGuestJwt(savedJwt);
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
        // TxLINE requires BOTH Authorization: Bearer <guestJwt> AND X-Api-Token
        const jwt = await ensureGuestJwt();
        const toArray = (d: any): any[] => {
          if (Array.isArray(d)) return d;
          if (d?.fixtures && Array.isArray(d.fixtures)) return d.fixtures;
          if (d?.data && Array.isArray(d.data)) return d.data;
          return [];
        };

        const [liveData, allData] = await Promise.all([
          fetchLiveFixtures(apiToken, jwt).catch(e => {
            if (e.response?.status === 401) throw e;
            console.log("[TxLINE] Error fetching live fixtures:", e.response?.status, e.message);
            return [];
          }),
          fetchAllFixtures(apiToken, jwt).catch(e => {
            if (e.response?.status === 401) throw e;
            // 404 = endpoint not available on devnet free tier (live-only)
            if (e.response?.status === 404) {
              console.log("[TxLINE] /fixtures endpoint not available on devnet (404) — live matches only");
              setFixturesAvailable(false);
              return null; // null = devnet live-only mode
            }
            console.log("[TxLINE] Error fetching all fixtures:", e.response?.status, e.message);
            return [];
          })
        ]);
        if (isMounted) {
          const live = toArray(liveData);
          // null = devnet live-only (404 on /fixtures) — don't overwrite allFixtures
          if (allData !== null) {
            const all = toArray(allData);
            console.log(`[TxLINE] Fixtures: ${all.length} total, ${live.length} live`);
            setAllFixtures(all);
          } else {
            console.log(`[TxLINE] Devnet live-only mode — ${live.length} live, schedule unavailable`);
          }
          setLiveFixtures(live);
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          // Guest JWT expired — clear it so ensureGuestJwt fetches a fresh one next cycle
          console.log('[TxLINE] Auth expired, refreshing guest JWT...');
          setGuestJwt(null);
          localStorage.removeItem('txline_guest_jwt');
        } else {
          console.log("Error fetching fixtures:", error.message);
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

  const setManualApiToken = (token: string) => setApiToken(token);

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
    } catch (error) {
      console.error('[TxLINE] Failed to subscribe & activate:', error);
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
