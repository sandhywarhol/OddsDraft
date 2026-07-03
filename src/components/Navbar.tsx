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

export default function Navbar() {
  const { appMode, toggleAppMode, apiToken, isSubscribing, subscribeAndActivate, setManualApiToken } = useTxLine();
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [walletToast, setWalletToast] = useState<{ balance: number } | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [manualInputError, setManualInputError] = useState('');
  const prevConnectedRef = useRef(false);
  const pendingLiveRef = useRef(false);
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

  // After on-chain subscription completes, auto-switch to live
  useEffect(() => {
    if (apiToken && pendingLiveRef.current && appMode === 'demo') {
      pendingLiveRef.current = false;
      toggleAppMode();
    }
  }, [apiToken]);

  const handleModeToggle = async () => {
    if (appMode === 'live') {
      toggleAppMode();
      return;
    }
    if (apiToken) {
      toggleAppMode();
      return;
    }
    if (!connected) {
      setErrorMsg('Connect wallet first');
      setTokenError(true);
      setTimeout(() => setTokenError(false), 3000);
      return;
    }
    // On-chain subscription — SERVICE_LEVEL_ID=12 (free tier, no TxL tokens needed)
    pendingLiveRef.current = true;
    setTokenError(false);
    try {
      await subscribeAndActivate();
      // useEffect above will call toggleAppMode once apiToken is set
    } catch (e: any) {
      pendingLiveRef.current = false;
      // Show manual token modal as fallback instead of just an error badge
      setShowTokenModal(true);
    }
  };

  const handleManualActivate = () => {
    const token = manualInput.trim();
    if (!token) {
      setManualInputError('Paste your TxLINE API token first');
      return;
    }
    setManualApiToken(token);
    setManualInput('');
    setManualInputError('');
    setShowTokenModal(false);
    // pendingLiveRef ensures toggleAppMode fires once apiToken is set
    pendingLiveRef.current = true;
  };

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
        <div className="navbar__nav">
          <Link href="/contests" className={`navbar__link ${pathname === '/contests' || pathname?.startsWith('/lineup') ? 'navbar__link--active' : ''}`}>Match Schedule</Link>
          <Link href="/teams" className={`navbar__link ${pathname === '/teams' ? 'navbar__link--active' : ''}`}>Teams</Link>
          <Link href="/leaderboard" className={`navbar__link ${pathname === '/leaderboard' ? 'navbar__link--active' : ''}`}>Leaderboard</Link>
          <Link href="/cards" className={`navbar__link ${pathname === '/cards' ? 'navbar__link--active' : ''}`}>My Cards</Link>
          <Link href="/how-it-works" className={`navbar__link ${pathname === '/how-it-works' ? 'navbar__link--active' : ''}`}>How It Works</Link>
        </div>

        {/* Right Actions (Flex 1, align right) */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          
          <button
            onClick={handleModeToggle}
            disabled={isSubscribing}
            style={{
              height: '24px',
              borderRadius: '12px',
              padding: '0 8px',
              fontSize: '0.58rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              background: tokenError
                ? 'linear-gradient(145deg, #2a0d0d, #1a0808)'
                : appMode === 'live'
                  ? 'linear-gradient(145deg, #0d1b2a, #0a111a)'
                  : 'linear-gradient(145deg, #2a0d1b, #1a0a11)',
              color: tokenError ? '#ff6b6b' : appMode === 'live' ? '#00e5ff' : '#ff4d6d',
              border: `1px solid ${tokenError ? 'rgba(255,107,107,0.4)' : appMode === 'live' ? 'rgba(0,229,255,0.4)' : 'rgba(255,77,109,0.4)'}`,
              display: 'flex', alignItems: 'center', gap: 4,
              boxShadow: appMode === 'live' ? '0 0 6px rgba(0,229,255,0.2), inset 0 1px 1px rgba(255,255,255,0.05)' : '0 0 6px rgba(255,77,109,0.2), inset 0 1px 1px rgba(255,255,255,0.05)',
              cursor: isSubscribing ? 'wait' : 'pointer', transition: 'all 0.3s ease',
              opacity: isSubscribing ? 0.7 : 1,
            }}
            onMouseOver={(e) => { if (!isSubscribing) e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{
              width: 4, height: 4, borderRadius: '50%',
              background: tokenError ? '#ff6b6b' : appMode === 'live' ? '#00e5ff' : '#ff4d6d',
              boxShadow: `0 0 4px ${tokenError ? '#ff6b6b' : appMode === 'live' ? '#00e5ff' : '#ff4d6d'}`,
              animation: isSubscribing ? 'pulse 1s infinite' : 'none',
            }} />
            {isSubscribing ? '...' : tokenError ? (errorMsg || 'ERROR') : appMode === 'live' ? 'LIVE' : 'DEMO'}
          </button>

          {mounted ? (
            <WalletDropdown 
              isMuted={isMuted} 
              toggleMute={toggleMute} 
            />
          ) : <div style={{width: 80, height: 24}}></div>}
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
              <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer"
                style={{ color: '#ffaa00', fontWeight: 700, textDecoration: 'underline' }}>
                Get Devnet SOL →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Manual API Token Modal */}
      {showTokenModal && (
        <div
          onClick={() => setShowTokenModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0d1420', border: '1px solid rgba(0,229,255,0.25)',
              borderRadius: 12, padding: '28px 24px', width: '100%', maxWidth: 420,
              boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                Activate Live Mode
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                On-chain subscription gagal. Paste TxLINE API token kamu di bawah untuk langsung aktifkan Live Mode.
              </div>
            </div>

            <input
              autoFocus
              type="text"
              placeholder="Paste TxLINE API token..."
              value={manualInput}
              onChange={e => { setManualInput(e.target.value); setManualInputError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleManualActivate(); }}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: `1px solid ${manualInputError ? '#ff4d4d' : 'rgba(255,255,255,0.15)'}`,
                color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace',
                outline: 'none', boxSizing: 'border-box', marginBottom: manualInputError ? 6 : 16,
              }}
            />
            {manualInputError && (
              <div style={{ fontSize: '0.72rem', color: '#ff6b6b', marginBottom: 12 }}>{manualInputError}</div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleManualActivate}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #00b4d8, #0077b6)',
                  color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Activate
              </button>
              <button
                onClick={() => { setShowTokenModal(false); setManualInput(''); setManualInputError(''); }}
                style={{
                  padding: '10px 18px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>

            <div style={{ marginTop: 14, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
              Token bisa didapat dari TxLINE dashboard atau tim hackathon TxODDS.
            </div>
          </div>
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
          <Link href="/contests" className={`navbar__link ${pathname === '/contests' || pathname?.startsWith('/lineup') ? 'navbar__link--active' : ''}`} onClick={() => setMobileOpen(false)}>Match Schedule</Link>
          <Link href="/teams" className={`navbar__link ${pathname === '/teams' ? 'navbar__link--active' : ''}`} onClick={() => setMobileOpen(false)}>Teams</Link>
          <Link href="/leaderboard" className={`navbar__link ${pathname === '/leaderboard' ? 'navbar__link--active' : ''}`} onClick={() => setMobileOpen(false)}>Leaderboard</Link>
          <Link href="/cards" className={`navbar__link ${pathname === '/cards' ? 'navbar__link--active' : ''}`} onClick={() => setMobileOpen(false)}>My Cards</Link>
          <Link href="/how-it-works" className={`navbar__link ${pathname === '/how-it-works' ? 'navbar__link--active' : ''}`} onClick={() => setMobileOpen(false)}>How It Works</Link>
          {connected && (
            <Link href="/profile" className="navbar__link" onClick={() => setMobileOpen(false)}>Profile</Link>
          )}

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />

          {/* Mode toggle */}
          <button
            onClick={() => { handleModeToggle(); setMobileOpen(false); }}
            disabled={isSubscribing}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '10px 14px', cursor: 'pointer', color: '#fff', textAlign: 'left', width: '100%',
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: tokenError ? '#ff6b6b' : appMode === 'live' ? '#00e5ff' : '#ff4d6d',
              boxShadow: `0 0 6px ${tokenError ? '#ff6b6b' : appMode === 'live' ? '#00e5ff' : '#ff4d6d'}`,
            }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              {isSubscribing ? 'Connecting...' : appMode === 'live' ? 'Mode: LIVE — Switch ke Demo' : 'Mode: DEMO — Switch ke Live'}
            </span>
          </button>

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
        {avatar ? (
          <img 
            src={avatar} 
            alt="Avatar" 
            style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', objectFit: 'cover' }} 
          />
        ) : (
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#475569' }} />
        )}
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
