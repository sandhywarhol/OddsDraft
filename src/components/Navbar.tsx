'use client';

import { useTxLine } from '@/context/TxLineContext';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAudio } from '@/context/AudioContext';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { User, LogOut, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import SponsorsMarquee from '@/components/SponsorsMarquee';

export default function Navbar() {
  const { appMode, toggleAppMode, isAdmin } = useTxLine();
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [walletToast, setWalletToast] = useState<{ balance: number } | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const prevConnectedRef = useRef(false);
  const pathname = usePathname();
  const { isMuted, toggleMute } = useAudio();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show toast when wallet first connects
  useEffect(() => {
    if (connected && !prevConnectedRef.current && publicKey) {
      prevConnectedRef.current = true;
      connection.getBalance(publicKey).then(lamports => {
        setWalletToast({ balance: lamports / LAMPORTS_PER_SOL });
        setToastExiting(false);
        setTimeout(() => setToastExiting(true), 5000);
        setTimeout(() => setWalletToast(null), 5400);
      }).catch(() => {
        setWalletToast({ balance: 0 });
        setTimeout(() => setToastExiting(true), 5000);
        setTimeout(() => setWalletToast(null), 5400);
      });
    }
    if (!connected) {
      prevConnectedRef.current = false;
      setWalletToast(null);
    }
  }, [connected, publicKey, connection]);


  const isDevnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 'var(--z-sticky)' }}>


      <nav className="navbar" style={{ position: 'relative', zIndex: 'auto' }}>
      {/* Solid background and shiny effect container */}
      <div className="navbar__bg">
        <div className="navbar__shine" />
      </div>

      <div className="container navbar__inner">
        {/* Logo (Flex 1 to push nav to center) */}
        <Link href="/" className="navbar__logo" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <img src="/logo_oddsdraft.svg" alt="OddsDraft Logo" style={{ height: '48px', width: 'auto' }} />
        </Link>

        {/* Desktop Nav (Center) */}
        <div className="navbar__nav">
          <Link href="/contests" className={`navbar__link ${pathname === '/contests' || pathname?.startsWith('/lineup') ? 'navbar__link--active' : ''}`}>Match Schedule</Link>
          <Link href="/teams" className={`navbar__link ${pathname === '/teams' ? 'navbar__link--active' : ''}`}>Teams</Link>
          <Link href="/leaderboard" className={`navbar__link ${pathname === '/leaderboard' ? 'navbar__link--active' : ''}`}>Leaderboard</Link>
          <Link href="/cards" className={`navbar__link ${pathname === '/cards' ? 'navbar__link--active' : ''}`}>My Cards</Link>
          <Link href="/how-it-works" className={`navbar__link ${pathname === '/how-it-works' ? 'navbar__link--active' : ''}`}>How It Works</Link>
        </div>

        {/* Right Actions (Flex 1, align right) */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>

          {isAdmin ? (
            <button
              onClick={toggleAppMode}
              style={{
                height: '24px', borderRadius: '12px', padding: '0 8px', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.05em',
                background: (mounted && appMode === 'live') ? 'linear-gradient(145deg, #0d1b2a, #0a111a)' : 'linear-gradient(145deg, #2a0d1b, #1a0a11)',
                color: (mounted && appMode === 'live') ? '#00e5ff' : '#ff4d6d',
                border: `1px solid ${(mounted && appMode === 'live') ? 'rgba(0,229,255,0.4)' : 'rgba(255,77,109,0.4)'}`,
                display: 'flex', alignItems: 'center', gap: 4,
                boxShadow: (mounted && appMode === 'live') ? '0 0 6px rgba(0,229,255,0.2), inset 0 1px 1px rgba(255,255,255,0.05)' : '0 0 6px rgba(255,77,109,0.2), inset 0 1px 1px rgba(255,255,255,0.05)',
                cursor: 'pointer', transition: 'all 0.3s ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: (mounted && appMode === 'live') ? '#00e5ff' : '#ff4d6d', boxShadow: `0 0 4px ${(mounted && appMode === 'live') ? '#00e5ff' : '#ff4d6d'}` }} />
              {(mounted && appMode === 'live') ? (isDevnet ? 'LIVE: DEVNET' : 'LIVE') : 'DEMO'}
            </button>
          ) : (
            <a
              href="https://t.me/OddsDraftBot"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                height: '24px', borderRadius: '12px', padding: '0 10px', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.05em',
                background: 'linear-gradient(145deg, #0d2137, #07111f)',
                color: '#29b6f6',
                border: '1px solid rgba(41,182,246,0.45)',
                display: 'flex', alignItems: 'center', gap: 5,
                boxShadow: '0 0 6px rgba(41,182,246,0.2)',
                cursor: 'pointer', transition: 'all 0.2s ease', textDecoration: 'none',
              }}
              onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.05)'; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'; }}
            >
              {/* Telegram icon */}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
              </svg>
              NOTIFY ME
            </a>
          )}

          {mounted ? (
            <WalletDropdown 
              isMuted={isMuted} 
              toggleMute={toggleMute} 
            />
          ) : <div className="desktop-only" style={{width: 80, height: 24}}></div>}
          {/* Mobile menu toggle */}
          <button
            className="btn btn--ghost btn--sm navbar__toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
            id="mobile-menu-toggle"
            style={{ padding: '0 8px', height: '24px', fontSize: '1rem', lineHeight: '24px', display: 'inline-flex', alignItems: 'center' }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Wallet Connected Toast */}
      {walletToast && (
        <div style={{
          position: 'fixed',
          top: 72,
          right: 24,
          width: 320,
          background: '#090f1a',
          borderLeft: `5px solid ${walletToast.balance < 0.105 ? '#ffaa00' : '#00e87a'}`,
          borderRadius: 8,
          padding: '14px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          opacity: toastExiting ? 0 : 1,
          transform: toastExiting ? 'translateX(20px)' : 'translateX(0)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
          animation: 'toast-slide-in 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <style>{`@keyframes toast-slide-in { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.3rem' }}>👛</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#00e87a' }}>Wallet Connected</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
                Balance: <span style={{ color: walletToast.balance < 0.105 ? '#ffaa00' : '#00e87a' }}>
                  {walletToast.balance.toFixed(3)} SOL
                </span>
              </div>
            </div>
          </div>
          {walletToast.balance < 0.105 && (
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', paddingLeft: 2 }}>
              You need at least 0.1 SOL to play.{' '}
              {process.env.NEXT_PUBLIC_SOLANA_NETWORK !== 'mainnet-beta' && (
                <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer"
                  style={{ color: '#ffaa00', fontWeight: 700, textDecoration: 'underline' }}>
                  Get Devnet SOL →
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Nav */}
      {mobileOpen && (
        <div style={{
          position: 'absolute',
          top: 64,
          left: 0,
          right: 0,
          background: '#1a1008',
          borderBottom: '4px solid #ffd700',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 200,
          boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
        }}>
          {/* Mobile dropdown: only show mode toggle (admin) + wallet. Nav links are in the bottom tab bar. */}
          {connected && (
            <Link href="/profile" className="navbar__link" onClick={() => setMobileOpen(false)}>Profile</Link>
          )}

          {/* Mode toggle — admin only */}
          {isAdmin && (
            <button
              onClick={() => { toggleAppMode(); setMobileOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, padding: '10px 14px', cursor: 'pointer', color: '#fff', textAlign: 'left', width: '100%',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: (mounted && appMode === 'live') ? '#00e5ff' : '#ff4d6d',
                boxShadow: `0 0 6px ${(mounted && appMode === 'live') ? '#00e5ff' : '#ff4d6d'}`,
              }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {(mounted && appMode === 'live') ? 'Mode: LIVE — Switch to Demo' : 'Mode: DEMO — Switch to Live'}
              </span>
            </button>
          )}

          {/* Wallet button */}
          <div style={{ marginTop: 4 }}>
            {mounted && <WalletMultiButton style={{
              width: '100%', height: '40px', borderRadius: '8px',
              fontSize: '0.85rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)',
              color: '#1a1a1a', border: 'none', fontFamily: 'inherit',
            }} />}
          </div>
        </div>
      )}
      </nav>
      <SponsorsMarquee />
    </div>
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
    return (
      <div className="desktop-only">
        <WalletMultiButton style={{ 
          height: '24px', 
          borderRadius: '5px',
          fontSize: '0.75rem', 
          fontWeight: 700,
          padding: '0 10px', 
          background: 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)', 
          color: '#1a1a1a',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 1px 8px rgba(255, 215, 0, 0.2)',
          lineHeight: '24px',
          fontFamily: 'var(--font-bebas), cursive',
          fontStyle: 'italic',
          letterSpacing: '0.05em',
          transition: 'all 0.3s ease'
        }} />
      </div>
    );
  }

  return (
    <div className="wallet-dropdown desktop-only" ref={dropdownRef} style={{ position: 'relative' }}>
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
        {avatar ? (
          <img 
            src={avatar} 
            alt="Avatar" 
            style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', objectFit: 'cover' }} 
          />
        ) : (
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#475569' }} />
        )}
        <span style={{ fontSize: '0.58rem', fontWeight: 600, fontFamily: 'inherit' }}>
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
