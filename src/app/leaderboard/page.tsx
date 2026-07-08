'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useTxLine } from '@/context/TxLineContext';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';


export default function LeaderboardPage() {
  const { appMode } = useTxLine();
  const { publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [liveLeaderboard, setLiveLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userContestCount, setUserContestCount] = useState(0);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Count user's local match history and load profile
  useEffect(() => {
    if (!mounted) return;
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith('txodds_user_lineup_')) count++;
    }
    setUserContestCount(count);
    if (publicKey) {
      const stored = localStorage.getItem(`profile_${publicKey.toString()}`);
      if (stored) {
        const p = JSON.parse(stored);
        setUserDisplayName(p.username || `User_${publicKey.toString().substring(0, 4)}`);
        setUserAvatar(p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${publicKey.toString()}`);
      } else {
        setUserDisplayName(`User_${publicKey.toString().substring(0, 4)}`);
        setUserAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${publicKey.toString()}`);
      }
    }
  }, [mounted, publicKey]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/leaderboard', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any[] = await res.json();

        const mapped = data.map((u, index) => {
          const isUser = publicKey && u.wallet_address === publicKey.toString();
          const displayUser = u.username || `User_${u.wallet_address.substring(0, 4)}`;
          return {
            rank: index + 1,
            user: displayUser,
            wallet: `${u.wallet_address.substring(0, 4)}...${u.wallet_address.substring(u.wallet_address.length - 3)}`,
            rawWallet: u.wallet_address,
            avatar: u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.wallet_address}`,
            contests: u.total_contests || 0,
            wins: u.total_wins || 0,
            points: u.total_points || 0,
            sol: u.total_earned_sol || 0,
            isUser,
          };
        });
        setLiveLeaderboard(mapped);
      } catch (err: any) {
        console.warn('[Leaderboard] fetch failed:', err);
        setLiveLeaderboard([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [appMode, publicKey]);

  if (!mounted) return null;
  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      <main style={{ padding: '48px 0 80px' }}>
        <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Header */}
          <div style={{
            marginBottom: 40,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20,
            position: 'relative',
            padding: '54px 40px',
            border: '2px solid #ffd700',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            {/* Background Image without blur */}
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              backgroundImage: 'url("/leaderboard.webp")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 1,
              pointerEvents: 'none',
            }} />

            {/* Light gradient overlay to ensure text readability without being too dark */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
              background: 'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 60%)',
            }} />

            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{
                  background: '#ffd700',
                  color: '#000000',
                  padding: '3px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderRadius: 0
                }}>
                  Rankings
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 8, lineHeight: 1.1 }}>
                Global Leaderboard
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                Real-time global rankings based on SOL earned.
              </p>
            </div>
            <img 
              src="/fifa_world_cup_2026_logo.webp" 
              alt="FIFA World Cup 2026 Logo" 
              style={{ height: '120px', objectFit: 'contain', opacity: 0.95, margin: 0, position: 'relative', zIndex: 2 }}
            />
          </div>
        </div>

        <div className="container-sm" style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>

          {/* Your Position card — only show for connected users */}
          {publicKey && (
            <div style={{
              marginBottom: 20, padding: '14px 20px',
              background: 'rgba(244,207,126,0.07)', border: '1px solid rgba(244,207,126,0.3)',
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <img src={userAvatar || undefined} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-surface)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--color-accent)', marginBottom: 2 }}>
                  {userDisplayName} <span style={{ fontSize: '0.72rem', background: 'rgba(244,207,126,0.2)', border: '1px solid rgba(244,207,126,0.4)', padding: '1px 6px', borderRadius: 4, marginLeft: 6 }}>YOU</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {publicKey.toString().substring(0, 8)}...{publicKey.toString().slice(-4)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {userContestCount > 0 ? (
                  <>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem' }}>{userContestCount} contest{userContestCount > 1 ? 's' : ''}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Entered</div>
                  </>
                ) : (
                  <Link href="/contests" style={{ fontSize: '0.78rem', color: 'var(--color-accent)', fontWeight: 700, textDecoration: 'none' }}>
                    Join a contest →
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="ro-window">
            <div className="ro-window__header">
              <span>Global Rankings // Leaderboard</span>
              <span>🏆</span>
            </div>
            <div className="ro-window__body" style={{ padding: 0, overflowX: 'auto', minHeight: 200 }}>
              {isLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading real-time rankings...
                </div>
              ) : liveLeaderboard.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No players found yet. Be the first to join a contest!
                </div>
              ) : (
                <table className="leaderboard" style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '2px solid var(--border-medium)' }}>
                      <th style={{ textAlign: 'center', padding: '12px 16px' }}>Rank</th>
                      <th style={{ padding: '12px 16px' }}>Manager</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px' }}>Contests</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px' }}>Wins</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px' }}>Total Pts</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px' }}>Earned SOL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveLeaderboard.map((entry) => (
                      <tr key={entry.rawWallet || entry.wallet} style={{ 
                        background: entry.isUser ? 'rgba(244, 207, 126, 0.12)' : 'transparent',
                        borderBottom: '1px solid var(--border-subtle)'
                      }}>
                        <td className="leaderboard__rank" style={{ textAlign: 'center', padding: '12px 16px' }}>
                          <span className={`leaderboard__rank--${entry.rank}`}>
                            {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img 
                            src={entry.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.wallet}`} 
                            alt="avatar" 
                            style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-surface)' }} 
                          />
                          <div>
                            <div style={{ fontWeight: entry.isUser ? 800 : 500, color: entry.isUser ? 'var(--color-accent)' : 'var(--text-primary)' }}>
                              {entry.user} {entry.isUser && <span className="badge badge--primary" style={{ marginLeft: 8 }}>YOU</span>}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {entry.wallet}
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '12px 16px' }}>{entry.contests}</td>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '12px 16px' }}>{entry.wins}</td>
                        <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                          <span className="leaderboard__points" style={{ fontWeight: 700 }}>{entry.points.toFixed(1)}</span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 900, color: '#ffd700', padding: '12px 16px' }}>
                          {entry.sol.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/contests" className="btn btn--primary btn--lg">
              🏆 Join a Contest to Rank Up
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
