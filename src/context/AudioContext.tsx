'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface AudioContextProps {
  isMuted: boolean;
  toggleMute: () => void;
  playSFX: (sfxType: 'goal' | 'whistle' | 'end_game') => void;
}

const AudioContext = createContext<AudioContextProps | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(true); // Default to muted to comply with autoplay policy
  const pathname = usePathname();

  const platformBgmRef = useRef<HTMLAudioElement | null>(null);
  const watchLiveBgmRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio elements on mount in client side
  useEffect(() => {
    if (typeof window === 'undefined') return;

    platformBgmRef.current = new Audio('/Audio/background%20music%20paltform.MP3');
    platformBgmRef.current.loop = true;
    platformBgmRef.current.volume = 0.25;

    watchLiveBgmRef.current = new Audio('/Audio/background%20music%20watch%20live.mp3');
    watchLiveBgmRef.current.loop = true;
    watchLiveBgmRef.current.volume = 0.2;

    // Load saved mute setting
    const savedMute = localStorage.getItem('oddsdraft_muted');
    if (savedMute !== null) {
      setIsMuted(savedMute === 'true');
    } else {
      setIsMuted(false); // Default to unmuted on first visit
      
      // Attempt to play immediately (might work if browser allows it)
      const attemptPlay = () => {
        const isLive = window.location.pathname.startsWith('/live/') || window.location.pathname.startsWith('/replay/');
        const p = isLive ? watchLiveBgmRef.current?.play() : platformBgmRef.current?.play();
        if (p !== undefined) {
          p.catch(() => {
            // If blocked, wait for first interaction
            window.addEventListener('click', playOnInteract, { once: true });
          });
        }
      };

      const playOnInteract = () => {
        const isLive = window.location.pathname.startsWith('/live/') || window.location.pathname.startsWith('/replay/');
        if (isLive) {
          watchLiveBgmRef.current?.play().catch(() => {});
        } else {
          platformBgmRef.current?.play().catch(() => {});
        }
      };

      attemptPlay();
    }

    return () => {
      platformBgmRef.current?.pause();
      watchLiveBgmRef.current?.pause();
    };
  }, []);

  // Sync BGM with route and mute state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!platformBgmRef.current || !watchLiveBgmRef.current) return;

    const isWatchLiveRoute = pathname?.startsWith('/live/') || pathname?.startsWith('/replay/');

    if (isMuted) {
      platformBgmRef.current.pause();
      watchLiveBgmRef.current.pause();
    } else {
      if (isWatchLiveRoute) {
        platformBgmRef.current.pause();
        // Play watch-live BGM
        watchLiveBgmRef.current.play().catch(err => console.log('Autoplay blocked', err));
      } else {
        watchLiveBgmRef.current.pause();
        // Play platform BGM
        platformBgmRef.current.play().catch(err => console.log('Autoplay blocked', err));
      }
    }
  }, [pathname, isMuted]);

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('oddsdraft_muted', String(next));
      return next;
    });
  };

  const playSFX = (sfxType: 'goal' | 'whistle' | 'end_game') => {
    if (isMuted || typeof window === 'undefined') return;

    let path = '';
    if (sfxType === 'goal') path = '/Audio/goal.MP3';
    else if (sfxType === 'whistle') path = '/Audio/whistle%20refere.mp3';
    else if (sfxType === 'end_game') path = '/Audio/End%20game%20Whistle.MP3';

    if (path) {
      const sfx = new Audio(path);
      sfx.volume = 0.5;
      sfx.play().catch(err => console.log('SFX play blocked', err));
    }
  };

  return (
    <AudioContext.Provider value={{ isMuted, toggleMute, playSFX }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
