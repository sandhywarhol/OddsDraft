'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';

export default function MobileTabBar() {
  const pathname = usePathname();
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isSchedule = pathname === '/contests' || pathname === '/' || pathname?.startsWith('/lineup');
  const isCards = pathname === '/cards';
  const isLive = pathname?.startsWith('/live');

  const shortAddress = connected && publicKey
    ? publicKey.toString().slice(0, 4) + '...' + publicKey.toString().slice(-4)
    : null;

  return (
    <nav className="mobile-tab-bar">
      <Link href="/contests" className={`mobile-tab-bar__tab${isSchedule ? ' active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>Schedule</span>
        {isLive && <div className="mobile-tab-bar__live-dot" />}
      </Link>

      <Link href="/cards" className={`mobile-tab-bar__tab${isCards ? ' active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
        <span>My Cards</span>
      </Link>

      <button
        className={`mobile-tab-bar__tab mobile-tab-bar__tab--wallet${connected ? ' active' : ''}`}
        onClick={() => {
          if (connected) {
            disconnect();
          } else {
            setVisible(true);
          }
        }}
      >
        {mounted ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="6" width="22" height="15" rx="2"/>
              <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            <span>{connected && shortAddress ? shortAddress : 'Wallet'}</span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="6" width="22" height="15" rx="2"/>
              <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            <span>Wallet</span>
          </>
        )}
      </button>
    </nav>
  );
}
