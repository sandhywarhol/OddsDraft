'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="container navbar__inner">
        {/* Logo */}
        <Link href="/" className="navbar__logo">
          <div style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, var(--color-primary), #00B4E8)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            border: '2px solid #ffffff',
            boxShadow: '0 0 0 1px #000000',
          }}>
            ⚽
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span className="navbar__logo-text" style={{ fontSize: '1.5rem' }}>OddsDraft</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.15em', fontWeight: 'bold' }}>FANTASY SPORTS</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar__nav">
          <Link href="/contests" className={`navbar__link ${pathname === '/contests' || pathname?.startsWith('/lineup') ? 'navbar__link--active' : ''}`}>Contests</Link>
          <Link href="/leaderboard" className={`navbar__link ${pathname === '/leaderboard' ? 'navbar__link--active' : ''}`}>Leaderboard</Link>
          <Link href="/how-it-works" className={`navbar__link ${pathname === '/how-it-works' ? 'navbar__link--active' : ''}`}>How It Works</Link>
        </div>

        {/* Wallet Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <WalletButton />
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

function WalletButton() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState('');

  const handleConnect = async () => {
    if (typeof window === 'undefined') return;
    
    // Check for Phantom wallet
    const phantom = (window as unknown as { solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey: { toString: () => string } }> } }).solana;
    if (!phantom?.isPhantom) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    try {
      const response = await phantom.connect();
      const addr = response.publicKey.toString();
      setAddress(addr);
      setConnected(true);
    } catch (err) {
      console.error('Wallet connection failed:', err);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setAddress('');
  };

  if (connected && address) {
    return (
      <button
        className="btn btn--secondary btn--sm"
        onClick={handleDisconnect}
        id="wallet-disconnect-btn"
        style={{ fontFamily: 'monospace' }}
      >
        <span style={{ 
          width: 8, height: 8, borderRadius: '50%', 
          background: 'var(--color-primary)',
          display: 'inline-block',
          boxShadow: '0 0 6px var(--color-primary)',
        }} />
        {address.slice(0, 4)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      className="btn btn--primary btn--sm"
      onClick={handleConnect}
      id="wallet-connect-btn"
    >
      Connect Wallet
    </button>
  );
}
