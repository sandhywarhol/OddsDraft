'use client';

import { useTxLine } from '@/context/TxLineContext';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAudio } from '@/context/AudioContext';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { User, Settings, LogOut, ChevronDown, Volume2, VolumeX } from 'lucide-react';

export default function Navbar() {
  const { appMode, toggleAppMode } = useTxLine();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { isMuted, toggleMute } = useAudio();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="navbar">
      {/* Solid background and shiny effect container */}
      <div className="navbar__bg">
        <div className="navbar__shine" />
      </div>

      <div className="container navbar__inner">
        {/* Logo (Flex 1 to push nav to center) */}
        <Link href="/" className="navbar__logo" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <img src="/Logo OddsDraft.svg" alt="OddsDraft Logo" style={{ height: '48px', width: 'auto', mixBlendMode: 'screen' }} />
        </Link>

        {/* Desktop Nav (Center) */}
        <div className="navbar__nav" style={{ display: 'flex', justifyContent: 'center' }}>
          <Link href="/contests" className={`navbar__link ${pathname === '/contests' || pathname?.startsWith('/lineup') ? 'navbar__link--active' : ''}`}>Match Schedule</Link>
          <Link href="/teams" className={`navbar__link ${pathname === '/teams' ? 'navbar__link--active' : ''}`}>Teams</Link>
          <Link href="/leaderboard" className={`navbar__link ${pathname === '/leaderboard' ? 'navbar__link--active' : ''}`}>Leaderboard</Link>
          <Link href="/how-it-works" className={`navbar__link ${pathname === '/how-it-works' ? 'navbar__link--active' : ''}`}>How It Works</Link>
        </div>

        {/* Right Actions (Flex 1, align right) */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          
          <button
            onClick={toggleAppMode}
            style={{ 
              height: '24px', 
              borderRadius: '12px',
              padding: '0 8px',
              fontSize: '0.58rem', 
              fontWeight: 700,
              letterSpacing: '0.05em',
              background: appMode === 'live' ? 'linear-gradient(145deg, #0d1b2a, #0a111a)' : 'linear-gradient(145deg, #2a0d1b, #1a0a11)',
              color: appMode === 'live' ? '#00e5ff' : '#ff4d6d',
              border: `1px solid ${appMode === 'live' ? 'rgba(0,229,255,0.4)' : 'rgba(255,77,109,0.4)'}`,
              display: 'flex', alignItems: 'center', gap: 4,
              boxShadow: appMode === 'live' ? '0 0 6px rgba(0,229,255,0.2), inset 0 1px 1px rgba(255,255,255,0.05)' : '0 0 6px rgba(255,77,109,0.2), inset 0 1px 1px rgba(255,255,255,0.05)',
              cursor: 'pointer', transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ 
              width: 4, height: 4, borderRadius: '50%', 
              background: appMode === 'live' ? '#00e5ff' : '#ff4d6d',
              boxShadow: `0 0 4px ${appMode === 'live' ? '#00e5ff' : '#ff4d6d'}`
            }} />
            {appMode === 'live' ? 'LIVE MODE' : 'DEMO MODE'}
          </button>

          {mounted ? (
            <WalletDropdown 
              isMuted={isMuted} 
              toggleMute={toggleMute} 
            />
          ) : <div style={{width: 80, height: 24}}></div>}
          {/* Mobile menu toggle */}
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ display: 'none' }}
            aria-label="Toggle mobile menu"
            id="mobile-menu-toggle"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div style={{
          position: 'absolute',
          top: 64,
          left: 0,
          right: 0,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          zIndex: 200,
        }}>
          <Link href="/contests" className={`navbar__link ${pathname === '/contests' || pathname?.startsWith('/lineup') ? 'navbar__link--active' : ''}`} onClick={() => setMobileOpen(false)}>Contests</Link>
          <Link href="/leaderboard" className={`navbar__link ${pathname === '/leaderboard' ? 'navbar__link--active' : ''}`} onClick={() => setMobileOpen(false)}>Leaderboard</Link>
          <Link href="/how-it-works" className={`navbar__link ${pathname === '/how-it-works' ? 'navbar__link--active' : ''}`} onClick={() => setMobileOpen(false)}>How It Works</Link>
        </div>
      )}
    </nav>
  );
}

function WalletDropdown({ isMuted, toggleMute }: { isMuted: boolean; toggleMute: () => void }) {
  const { connected, publicKey, disconnect } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [avatar, setAvatar] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (connected && publicKey) {
      const stored = localStorage.getItem(`profile_${publicKey.toString()}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAvatar(parsed.avatar);
        setUsername(parsed.username);
      } else {
        setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${publicKey.toString()}`);
        setUsername(`User_${publicKey.toString().substring(0, 4)}`);
      }
    }
  }, [connected, publicKey]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  if (!connected) {
    return <WalletMultiButton style={{ 
      height: '24px', 
      borderRadius: '5px',
      fontSize: '0.62rem', 
      fontWeight: 700,
      padding: '0 10px', 
      background: 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)', 
      color: '#1a1a1a',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: '0 1px 8px rgba(255, 215, 0, 0.2)',
      lineHeight: '24px',
      fontFamily: 'inherit',
      transition: 'all 0.3s ease'
    }} />;
  }

  return (
    <div className="wallet-dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: '24px',
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          border: '1px solid rgba(255, 215, 0, 0.4)',
          borderRadius: '12px',
          padding: '0 8px 0 4px',
          cursor: 'pointer',
          color: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
          transition: 'all 0.2s ease',
        }}
      >
        <img 
          src={avatar} 
          alt="Avatar" 
          style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff' }} 
        />
        <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>
          {username}
        </span>
        <ChevronDown size={12} color="#ffd700" />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          width: '200px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Link 
            href="/profile" 
            onClick={() => setIsOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text-primary)', textDecoration: 'none', borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <User size={16} />
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Profile</span>
          </Link>
          
          <button 
            onClick={() => { toggleMute(); setIsOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text-primary)', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
          </button>
          
          <button 
            onClick={() => { disconnect(); setIsOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--color-danger)', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={16} />
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
