'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect, useRef } from 'react';
import { User, Volume2, VolumeX, LogOut } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';

export default function MobileTabBar() {
  const pathname = usePathname();
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { isMuted, toggleMute } = useAudio();
  const [mounted, setMounted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const isSchedule = pathname === '/contests' || pathname === '/' || pathname?.startsWith('/lineup');
  const isCards = pathname === '/cards';
  const isLive = pathname?.startsWith('/live');

  const shortAddress = connected && publicKey
    ? publicKey.toString().slice(0, 4) + '...' + publicKey.toString().slice(-4)
    : null;

  return (
    <>
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
        onClick={(e) => {
          e.stopPropagation();
          if (connected) {
            setShowMenu(!showMenu);
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

      {/* Popup Menu */}
      {showMenu && connected && (
        <div 
          ref={menuRef}
          style={{
            position: 'fixed',
            bottom: '76px', // sits just above the tab bar
            right: '16px',
            width: '220px',
            background: '#151e2e',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 -4px 32px rgba(0,0,0,0.8)',
            overflow: 'hidden',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Link 
            href="/profile" 
            onClick={() => setShowMenu(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', color: '#fff', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            <User size={18} color="#ffd700" />
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Profile</span>
          </Link>
          
          <button 
            onClick={() => { toggleMute(); setShowMenu(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', color: '#fff', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', width: '100%', textAlign: 'left' }}
          >
            {isMuted ? <VolumeX size={18} color="#ffd700" /> : <Volume2 size={18} color="#ffd700" />}
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
          </button>
          
          <button
            onClick={() => { disconnect(); setShowMenu(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', color: '#ff4d6d', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
          >
            <LogOut size={18} color="#ff4d6d" />
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Logout</span>
          </button>
        </div>
      )}
    </>
  );
}
