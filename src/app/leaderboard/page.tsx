import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function LeaderboardPage() {
  const leaderboard = [
    { rank: 1, user: 'CryptoGoalkeeper', wallet: 'Cx98...4mN', contests: 12, wins: 4, points: 1245.5, sol: 45.2 },
    { rank: 2, user: 'MbappeObsessed', wallet: '7kPx...2sQ', contests: 15, wins: 3, points: 1180.0, sol: 28.5 },
    { rank: 3, user: 'TacticalMaster', wallet: 'Rz33...9vT', contests: 10, wins: 3, points: 1150.2, sol: 22.0 },
    { rank: 4, user: 'SolanaBaller', wallet: 'Lw8j...mX1', contests: 8, wins: 2, points: 980.5, sol: 15.0 },
    { rank: 5, user: 'FantasyKing', wallet: 'A1b2...c3D', contests: 20, wins: 1, points: 950.0, sol: 8.5 },
    { rank: 6, user: 'You', wallet: 'YOUR WALLET', contests: 5, wins: 1, points: 450.2, sol: 5.0, isUser: true },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      <main style={{ padding: '48px 0 80px' }}>
        <div className="container-sm">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 8 }}>
              Global Leaderboard
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Top fantasy managers across all World Cup contests.</p>
          </div>

          <div className="ro-window">
            <div className="ro-window__header">
              <span>Global Rankings // Leaderboard</span>
              <span>🏆</span>
            </div>
            <div className="ro-window__body" style={{ padding: 0, overflowX: 'auto' }}>
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
                  {leaderboard.map((entry) => (
                    <tr key={entry.wallet} style={{ 
                      background: entry.isUser ? 'rgba(244, 207, 126, 0.12)' : 'transparent',
                      borderBottom: '1px solid var(--border-subtle)'
                    }}>
                      <td className="leaderboard__rank" style={{ textAlign: 'center', padding: '12px 16px' }}>
                        <span className={`leaderboard__rank--${entry.rank}`}>
                          {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: entry.isUser ? 800 : 500, color: entry.isUser ? 'var(--color-accent)' : 'var(--text-primary)' }}>
                          {entry.user} {entry.isUser && <span className="badge badge--primary" style={{ marginLeft: 8 }}>YOU</span>}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {entry.wallet}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '12px 16px' }}>{entry.contests}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '12px 16px' }}>{entry.wins}</td>
                      <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                        <span className="leaderboard__points" style={{ fontWeight: 700 }}>{entry.points.toFixed(1)}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 900, color: '#ffd700', padding: '12px 16px' }}>
                        {entry.sol.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
