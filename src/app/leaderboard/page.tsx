'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useTxLine } from '@/context/TxLineContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const DEMO_LEADERBOARD = [
  { rank: 1, user: 'CryptoGoalkeeper', wallet: 'Cx98...4mN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoGoalkeeper', contests: 12, wins: 4, points: 1245.5, sol: 45.2 },
  { rank: 2, user: 'MbappeObsessed', wallet: '7kPx...2sQ', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MbappeObsessed', contests: 15, wins: 3, points: 1180.0, sol: 28.5 },
  { rank: 3, user: 'TacticalMaster', wallet: 'Rz33...9vT', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TacticalMaster', contests: 10, wins: 3, points: 1150.2, sol: 22.0 },
  { rank: 4, user: 'SolanaBaller', wallet: 'Lw8j...mX1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SolanaBaller', contests: 8, wins: 2, points: 980.5, sol: 15.0 },
  { rank: 5, user: 'FantasyKing', wallet: 'A1b2...c3D', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FantasyKing', contests: 20, wins: 1, points: 950.0, sol: 8.5 },
  { rank: 6, user: 'DiamondHandsFC', wallet: 'Dh88...xYz', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DiamondHandsFC', contests: 11, wins: 2, points: 430.0, sol: 4.8 },
  { rank: 7, user: 'DegenStriker', wallet: 'Str1...k3r', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DegenStriker', contests: 19, wins: 1, points: 420.5, sol: 4.5 },
  { rank: 9, user: 'WhaleWatcher', wallet: 'Wha1...34x', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WhaleWatcher', contests: 7, wins: 1, points: 410.0, sol: 4.2 },
  { rank: 10, user: 'NFTManager', wallet: 'NfT0...mNg', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NFTManager', contests: 14, wins: 1, points: 395.5, sol: 3.5 },
  { rank: 11, user: 'PeleReborn', wallet: 'Pel3...rBn', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PeleReborn', contests: 9, wins: 0, points: 380.0, sol: 2.0 },
  { rank: 12, user: 'Web3Winger', wallet: 'Web3...wIn', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Web3Winger', contests: 22, wins: 0, points: 375.5, sol: 1.5 },
  { rank: 13, user: 'DefiDefender', wallet: 'Def1...dFn', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DefiDefender', contests: 16, wins: 0, points: 360.0, sol: 1.0 },
  { rank: 14, user: 'BullMarketFC', wallet: 'Bul1...mKt', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BullMarketFC', contests: 8, wins: 0, points: 350.5, sol: 0.8 },
  { rank: 15, user: 'BearSlayer', wallet: 'BeaR...sLy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BearSlayer', contests: 12, wins: 0, points: 340.0, sol: 0.5 },
  { rank: 16, user: 'YieldFarmerXI', wallet: 'YieL...fRm', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=YieldFarmerXI', contests: 10, wins: 0, points: 330.5, sol: 0.2 },
  { rank: 17, user: 'MetaverseMessi', wallet: 'Met4...mEs', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MetaverseMessi', contests: 25, wins: 0, points: 320.0, sol: 0.1 },
  { rank: 18, user: 'CryptoRonaldo', wallet: 'CryP...r0n', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoRonaldo', contests: 13, wins: 0, points: 310.5, sol: 0.1 },
  { rank: 19, user: 'ApeFutebol', wallet: 'Ap3F...utE', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ApeFutebol', contests: 5, wins: 0, points: 300.0, sol: 0.0 },
  { rank: 20, user: 'MoonBoysUnited', wallet: 'M00n...b0y', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MoonBoysUnited', contests: 18, wins: 0, points: 290.5, sol: 0.0 },
];

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
    if (appMode !== 'live') return;

    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        // We query the users table and sort by total_earned_sol descending
        const { data, error } = await supabase
          .from('users')
          .select('wallet_address, username, avatar_url, total_contests, total_wins, total_earned_sol')
          .order('total_earned_sol', { ascending: false })
          .limit(20);

        if (error) throw error;
        
        if (data) {
          const mapped = data.map((u: any, index: number) => {
            const isUser = publicKey && u.wallet_address === publicKey.toString();
            // Shorten wallet address if username is not present
            const displayUser = u.username || `User_${u.wallet_address.substring(0, 4)}`;
            return {
              rank: index + 1,
              user: displayUser,
              wallet: `${u.wallet_address.substring(0, 4)}...${u.wallet_address.substring(u.wallet_address.length - 3)}`,
              rawWallet: u.wallet_address,
              avatar: u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.wallet_address}`,
              contests: u.total_contests || 0,
              wins: u.total_wins || 0,
              points: 0, // points are contest-specific, global is sol
              sol: u.total_earned_sol || 0,
              isUser
            };
          });
          setLiveLeaderboard(mapped);
        }
      } catch (err: any) {
        console.warn('[Leaderboard] Supabase not available, using demo data:', err);
        // Supabase not configured — show demo data silently
        setLiveLeaderboard(DEMO_LEADERBOARD);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [appMode, publicKey]);

  if (!mounted) return null;

  const isDemo = appMode === 'demo';
  const displayLeaderboard = isDemo ? DEMO_LEADERBOARD : liveLeaderboard;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      <main style={{ padding: '48px 0 80px' }}>
        <div className="container-sm">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 8 }}>
              Global Leaderboard
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {isDemo ? 'Simulated rankings — switch to Live Mode for real data.' : 'Real-time global rankings based on SOL earned.'}
            </p>
          </div>

          {/* DEMO banner */}
          {isDemo && (
            <div style={{ marginBottom: 20, padding: '10px 16px', background: 'rgba(255,170,0,0.07)', border: '1px solid rgba(255,170,0,0.25)', borderRadius: 8, fontSize: '0.78rem', color: 'rgba(255,170,0,0.85)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1rem' }}>🎮</span>
              <span>The data below is a <strong>simulation</strong>. Rankings do not reflect real players. Switch to Live Mode to see the real leaderboard.</span>
            </div>
          )}

          {/* Your Position card — only show for connected users */}
          {publicKey && (
            <div style={{
              marginBottom: 20, padding: '14px 20px',
              background: 'rgba(244,207,126,0.07)', border: '1px solid rgba(244,207,126,0.3)',
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <img src={userAvatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-surface)', flexShrink: 0 }} />
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
              ) : displayLeaderboard.length === 0 ? (
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
                    {displayLeaderboard.map((entry) => (
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
