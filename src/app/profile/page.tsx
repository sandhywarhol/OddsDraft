'use client';

import Navbar from '@/components/Navbar';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useState, useEffect, useRef } from 'react';
import { User, Shield, Camera, Save, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

// Compress an image File to a base64 JPEG ≤ ~20KB (200×200 max)
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 200;
      let w = img.width;
      let h = img.height;
      if (w > h) { h = Math.round((h * MAX) / w); w = MAX; }
      else        { w = Math.round((w * MAX) / h); h = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function saveProfileToSupabase(wallet: string, username: string, avatar: string) {
  try {
    await fetch('/api/user/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, profile: { username, avatar, updatedAt: new Date().toISOString() } }),
    });
  } catch {}
}

export default function ProfilePage() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [matchHistory, setMatchHistory] = useState<{ contestId: string; contestType?: string; players: string[]; captain: string; submittedAt: string }[]>([]);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBalance = async () => {
    if (!publicKey) return;
    setBalanceLoading(true);
    try {
      const lamports = await connection.getBalance(publicKey, 'confirmed');
      setSolBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      setSolBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!connected || !publicKey) return;

    // Load from localStorage first (fast)
    const stored = localStorage.getItem(`profile_${publicKey.toString()}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setUsername(parsed.username ?? `User_${publicKey.toString().substring(0, 4)}`);
      setAvatar(parsed.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${publicKey.toString()}`);
    } else {
      setUsername(`User_${publicKey.toString().substring(0, 4)}`);
      setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${publicKey.toString()}`);
    }

    // Try to load from Supabase (may have newer data from another device)
    fetch(`/api/user/data?wallet=${publicKey.toString()}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.profile && Object.keys(data.profile).length > 0) {
          const p = data.profile;
          if (p.username) setUsername(p.username);
          if (p.avatar)   setAvatar(p.avatar);
          // Sync back to localStorage
          localStorage.setItem(`profile_${publicKey.toString()}`, JSON.stringify(p));
        }
      })
      .catch(() => {});

    fetchBalance();
  }, [connected, publicKey]);

  // Load contest history from Supabase (contest_entries) — the authoritative per-wallet
  // source, so it's correct on any device. Previously this scanned localStorage lineups,
  // which are device-local and showed an empty history after logging in on a new device.
  useEffect(() => {
    if (!mounted || !connected || !publicKey) { setMatchHistory([]); return; }
    let cancelled = false;
    fetch(`/api/contest/my-entries?wallet=${publicKey.toString()}`)
      .then(r => r.ok ? r.json() : { entries: [] })
      .then(({ entries }: { entries?: { fixture_id: string; contest_type: string; lineup: any; created_at: string }[] }) => {
        if (cancelled) return;
        setMatchHistory(
          (entries ?? []).map(e => ({
            contestId: e.fixture_id,
            contestType: e.contest_type,
            players: (e.lineup?.players ?? []).map((p: any) => p.name ?? p.id),
            captain: e.lineup?.captain ?? '',
            submittedAt: e.created_at ?? '',
          }))
        );
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [mounted, connected, publicKey]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    if (!file.type.startsWith('image/')) {
      setUploadError('File must be an image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Max file size is 5MB.');
      return;
    }
    try {
      const compressed = await compressImage(file);
      setAvatar(compressed);
    } catch {
      setUploadError('Failed to process image. Try another file.');
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!publicKey) return;
    if (!username.trim()) return;

    setIsSaving(true);
    setSaveError('');

    const profileData = { username: username.trim(), avatar, updatedAt: new Date().toISOString() };

    // Save to localStorage immediately
    localStorage.setItem(`profile_${publicKey.toString()}`, JSON.stringify(profileData));
    window.dispatchEvent(new Event('storage'));

    // Save to Supabase
    await saveProfileToSupabase(publicKey.toString(), username.trim(), avatar);

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!mounted) return null;

  if (!connected) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
        <Navbar />
        <main style={{ padding: '100px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 24 }}>
          <User size={48} style={{ color: 'var(--text-secondary)' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>Connect your wallet</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 360, margin: 0 }}>Your profile, SOL balance, and match history will appear here once you connect a Solana wallet.</p>
          <WalletMultiButton />
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      <main style={{ padding: '100px 16px 100px' }}>
        <div className="container-sm" style={{ maxWidth: '600px', margin: '0 auto', padding: 0 }}>

          <div style={{ marginBottom: 32 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
          </div>

          <div style={{ textAlign: 'left', marginBottom: 40 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 8, color: '#fff' }}>
              Player Profile
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Customize your manager identity for the global leaderboard.
            </p>
          </div>

          {/* Stats Summary */}
          {connected && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Contests Entered', value: matchHistory.length, icon: '🏟️' },
                { label: 'SOL Spent', value: matchHistory.length > 0 ? `${(matchHistory.length * 0.1).toFixed(1)} SOL` : '–', icon: '◎' },
                { label: 'Lineups Saved', value: matchHistory.length, icon: '📋' },
              ].map(stat => (
                <div key={stat.label} style={{
                  padding: '16px', background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)', borderRadius: 8, textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{stat.icon}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="ro-window">
            <div className="ro-window__header">
              <span>Identity Settings</span>
              <SettingsIcon />
            </div>

            <div className="ro-window__body" style={{ padding: '32px' }}>
              {!connected ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Shield size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Wallet Not Connected</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                    Please connect your Solana wallet to view and edit your profile.
                  </p>
                  <WalletMultiButton style={{
                    height: '40px', borderRadius: '8px',
                    fontSize: '0.9rem', fontWeight: 700,
                    padding: '0 20px', margin: '0 auto',
                    background: 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)',
                    color: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 1px 8px rgba(255, 215, 0, 0.2)'
                  }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                  {/* Avatar Section */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '24px' }}>
                    {/* Avatar circle — click to upload */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      title="Click to upload avatar"
                      style={{
                        position: 'relative', flexShrink: 0,
                        width: '100px', height: '100px',
                        borderRadius: '50%',
                        background: 'var(--bg-elevated)',
                        border: '2px solid var(--border-medium)',
                        overflow: 'hidden', cursor: 'pointer', padding: 0,
                      }}
                    >
                      {avatar ? (
                        <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#fff' }} />
                      ) : (
                        <User size={40} color="var(--text-muted)" />
                      )}
                      {/* Hover overlay */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                        opacity: 0, transition: 'opacity 0.2s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                      >
                        <Camera size={20} color="#fff" />
                        <span style={{ fontSize: '0.6rem', color: '#fff', fontWeight: 700, textTransform: 'uppercase' }}>Upload</span>
                      </div>
                    </button>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarUpload}
                    />

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Profile Photo
                      </label>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
                        Click the circle to upload a photo. Auto-compressed to 200×200px. Max 5MB.
                      </p>
                      {uploadError && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-danger)', marginBottom: 8 }}>{uploadError}</p>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera size={13} style={{ marginRight: 4 }} />
                          Upload Photo
                        </button>
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`)}
                          style={{ fontSize: '0.75rem' }}
                        >
                          🎲 Random Avatar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

                  {/* Form Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Wallet Address
                      </label>
                      <div style={{
                        padding: '12px 16px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: 'var(--text-muted)',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-all'
                      }}>
                        {publicKey?.toString()}
                      </div>
                    </div>

                    {/* SOL Balance */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        SOL Balance
                      </label>
                      <div style={{
                        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                        padding: '12px 16px',
                        background: 'rgba(0,232,122,0.05)',
                        border: '1px solid rgba(0,232,122,0.2)',
                        borderRadius: '8px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '1.4rem' }}>◎</span>
                          <div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: solBalance !== null && solBalance < 0.105 ? '#ffaa00' : '#00e87a' }}>
                              {balanceLoading ? '...' : solBalance !== null ? `${solBalance.toFixed(4)} SOL` : 'Error'}
                            </div>
                            {solBalance !== null && solBalance < 0.105 && !balanceLoading && (
                              <div style={{ fontSize: '0.72rem', color: '#ffaa00', marginTop: 2 }}>
                                Requires min. 0.1 SOL to play
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <button
                            onClick={fetchBalance}
                            disabled={balanceLoading}
                            className="btn btn--secondary btn--sm"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', padding: '6px 12px' }}
                          >
                            <RefreshCw size={12} style={{ animation: balanceLoading ? 'spin 1s linear infinite' : 'none' }} />
                            Refresh
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Manager Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        maxLength={32}
                        placeholder="Enter your display name"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '1rem',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                          boxSizing: 'border-box',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-medium)'}
                      />
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
                        {username.length}/32
                      </div>
                    </div>
                  </div>

                  {saveError && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-danger)', margin: '0' }}>{saveError}</p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                      className={`btn ${savedSuccess ? 'btn--secondary' : 'btn--primary'}`}
                      onClick={handleSave}
                      disabled={isSaving || !username.trim()}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: isSaving ? 0.7 : 1 }}
                    >
                      <Save size={16} />
                      {isSaving ? 'Saving...' : savedSuccess ? '✓ Saved!' : 'Save Profile'}
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* Match History */}
          {connected && (
            <div className="ro-window" style={{ marginTop: 24 }}>
              <div className="ro-window__header">
                <span>Match History</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{matchHistory.length} entries</span>
              </div>
              <div className="ro-window__body" style={{ padding: matchHistory.length === 0 ? '32px' : '0' }}>
                {matchHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
                    <p style={{ fontSize: '0.9rem' }}>No lineups submitted yet.</p>
                    <Link href="/contests" className="btn btn--primary btn--sm" style={{ marginTop: 12, display: 'inline-block' }}>
                      Browse Contests →
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {matchHistory.map((entry, idx) => (
                      <div key={`${entry.contestId}_${entry.contestType ?? ''}`} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderBottom: idx < matchHistory.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        gap: 12,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: 2 }}>
                            Match #{entry.contestId.slice(-6)}
                            {entry.contestType && (
                              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                                {' · '}{entry.contestType === 'top3' ? 'Top 3' : entry.contestType === '5050' ? '50/50' : 'Winner Takes All'}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {entry.players.slice(0, 3).join(', ')}{entry.players.length > 3 ? ` +${entry.players.length - 3}` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.7rem', color: '#ffd700', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 4, padding: '2px 8px', fontWeight: 700 }}>
                            0.1 SOL
                          </span>
                          <Link href={`/live/${entry.contestId}${entry.contestType ? `?contestType=${entry.contestType}` : ''}`} style={{ fontSize: '0.72rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                            View →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}
