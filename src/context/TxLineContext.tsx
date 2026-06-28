'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { subscribeToFreeTier, activateApiAccess, fetchLiveFixtures, fetchAllFixtures } from '@/lib/txline';

interface TxLineContextProps {
  appMode: 'demo' | 'live';
  toggleAppMode: () => void;

  apiToken: string | null;
  isSubscribing: boolean;
  subscribeAndActivate: () => Promise<void>;
  liveFixtures: any[];
  allFixtures: any[];
  isLoadingFixtures: boolean;
}

const TxLineContext = createContext<TxLineContextProps>({
  appMode: 'demo',
  toggleAppMode: () => {},

  apiToken: null,
  isSubscribing: false,
  subscribeAndActivate: async () => {},
  liveFixtures: [],
  allFixtures: [],
  isLoadingFixtures: false,
});

export const useTxLine = () => useContext(TxLineContext);

export const TxLineProvider = ({ children }: { children: ReactNode }) => {
  const [appMode, setAppMode] = useState<'demo' | 'live'>('demo');
  const toggleAppMode = () => setAppMode(prev => prev === 'demo' ? 'live' : 'demo');
  
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [liveFixtures, setLiveFixtures] = useState<any[]>([]);
  const [allFixtures, setAllFixtures] = useState<any[]>([]);
  const [isLoadingFixtures, setIsLoadingFixtures] = useState(false);
  
  const wallet = useWallet();
  const { connection } = useConnection();

  // On mount, load apiToken from localStorage if exists
  useEffect(() => {
    const savedToken = localStorage.getItem('txline_api_token');
    if (savedToken) {
      setApiToken(savedToken);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (apiToken) {
      localStorage.setItem('txline_api_token', apiToken);
    }
  }, [apiToken]);

  // Fetch live fixtures periodically if we have a token
  useEffect(() => {
    if (!apiToken) return;
    
    let isMounted = true;
    
    const fetchFixtures = async () => {
      try {
        setIsLoadingFixtures(true);
        const [liveData, allData] = await Promise.all([
          fetchLiveFixtures(apiToken).catch(e => {
            if (e.response?.status === 401) throw e;
            console.log("Error fetching live fixtures:", e.message);
            return [];
          }),
          fetchAllFixtures(apiToken).catch(e => {
            if (e.response?.status === 401) throw e;
            console.log("Error fetching all fixtures:", e.message);
            return [];
          })
        ]);
        if (isMounted) {
          if (Array.isArray(liveData)) setLiveFixtures(liveData);
          if (Array.isArray(allData)) setAllFixtures(allData);
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.log("txLINE token expired or invalid. Clearing token...");
          setApiToken(null);
          localStorage.removeItem('txline_api_token');
        } else {
          console.log("Error fetching fixtures:", error.message);
        }
      } finally {
        if (isMounted) setIsLoadingFixtures(false);
      }
    };
    
    fetchFixtures();
    const interval = setInterval(fetchFixtures, 30000); // 30 sec polling
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [apiToken]);

  const subscribeAndActivate = async () => {
    try {
      setIsSubscribing(true);
      
      // 1. Send subscription tx
      console.log("Subscribing on-chain...");
      const txSig = await subscribeToFreeTier(wallet, connection);
      console.log("Subscription tx:", txSig);
      
      // 2. Activate API token
      console.log("Activating API access...");
      const token = await activateApiAccess(wallet, txSig);
      console.log("Activated! Token:", token);
      
      setApiToken(token);
    } catch (error) {
      console.error("Failed to subscribe & activate:", error);
      throw error;
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <TxLineContext.Provider value={{ appMode, toggleAppMode, apiToken, isSubscribing, subscribeAndActivate, liveFixtures, allFixtures, isLoadingFixtures }}>
      {children}
    </TxLineContext.Provider>
  );
};
