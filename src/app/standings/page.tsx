'use client';

import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { LEAGUES } from '@/lib/leagues';
import { useTxLine } from '@/context/TxLineContext';

export default function StandingsPage() {
  const { appMode } = useTxLine();
  const [selectedLeague, setSelectedLeague] = useState<string>('eng.1');
  const [standings, setStandings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync animation state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);

  useEffect(() => {
    async function fetchStandings() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/standings?league=${selectedLeague}`);
        const data = await res.json();
        setStandings(data.standings || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStandings();
  }, [selectedLeague]);

  useEffect(() => {
    if (appMode === 'live') {
      setIsSyncing(true);
      setSyncComplete(false);
      const timer = setTimeout(() => {
        setIsSyncing(false);
        setSyncComplete(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsSyncing(false);
      setSyncComplete(false);
    }
  }, [appMode]);

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      <main style={{ padding: '48px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Title Block */}
        <div 
          style={{ 
            marginBottom: 32,
            position: 'relative',
            padding: '54px 40px',
            border: '2px solid #ffd700',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
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
            background: 'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 60%)',
          }} />

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20, width: '100%' }}>
            <div>
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
                  Official Data
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 8, lineHeight: 1.1 }}>
                League Standings
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                View the official current standings, points, and goal differences from ESPN API.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
              {/* ESPN Synchronization status bar for Live Mode */}
              {appMode === 'live' && (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    background: 'rgba(0,0,0,0.6)', 
                    padding: '10px 16px', 
                    borderRadius: 8, 
                    border: `1px solid ${syncComplete ? 'rgba(0, 232, 122, 0.3)' : 'rgba(0, 229, 255, 0.3)'}`,
                    boxShadow: `0 0 15px ${syncComplete ? 'rgba(0, 232, 122, 0.05)' : 'rgba(0, 229, 255, 0.05)'}`
                  }}
                >
                  <span style={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    background: syncComplete ? '#00e87a' : '#00e5ff',
                    boxShadow: `0 0 8px ${syncComplete ? '#00e87a' : '#00e5ff'}`,
                    animation: isSyncing ? 'blink-text 1s infinite' : 'none'
                  }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: syncComplete ? '#00e87a' : '#00e5ff', fontFamily: 'monospace' }}>
                    {isSyncing ? 'SYNCHRONIZING ESPN FEEDS...' : 'ESPN DATA SYNCHRONIZED'}
                  </span>
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,215,0,0.3)' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffd700' }}>SELECT LEAGUE:</label>
                <select
                  value={selectedLeague}
                  onChange={(e) => setSelectedLeague(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    color: '#000000',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {LEAGUES.map(league => (
                    <option key={league.id} value={league.id} style={{ color: '#000' }}>
                      {league.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loader or Content */}
        {isLoading || isSyncing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: 16 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              border: '3px solid rgba(0, 229, 255, 0.1)', 
              borderTopColor: '#00e5ff',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontFamily: 'monospace' }}>
              Fetching official standings from ESPN API...
            </span>
          </div>
        ) : standings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            No standings data available for this league.
          </div>
        ) : (
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.9)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: 12,
            overflowX: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '2px solid #ffd700' }}>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, width: 60 }}>#</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>Club</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, width: 60 }}>MP</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, width: 60 }}>W</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, width: 60 }}>D</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, width: 60 }}>L</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, width: 60 }}>GF</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, width: 60 }}>GA</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, width: 60 }}>GD</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#ffd700', fontSize: '0.9rem', fontWeight: 800, width: 80 }}>Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, index) => (
                  <tr key={team.id} style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                  >
                    <td style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: index < 4 ? '#00e87a' : (index > standings.length - 4 ? '#ff4d6d' : '#e2e8f0') }}>
                      {team.rank}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {team.logo ? (
                          <div style={{ background: '#fff', borderRadius: '50%', padding: 4, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={team.logo} alt={team.teamName} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                          </div>
                        ) : (
                          <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🛡️</div>
                        )}
                        <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>{team.teamName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#e2e8f0' }}>{team.gamesPlayed}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#e2e8f0' }}>{team.wins}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#e2e8f0' }}>{team.draws}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#e2e8f0' }}>{team.losses}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>{team.goalsFor}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>{team.goalsAgainst}</td>
                    <td style={{ padding: '16px', textAlign: 'center', color: parseInt(team.goalDifference) > 0 ? '#00e87a' : (parseInt(team.goalDifference) < 0 ? '#ff4d6d' : '#e2e8f0'), fontWeight: 600 }}>
                      {parseInt(team.goalDifference) > 0 ? `+${team.goalDifference}` : team.goalDifference}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', color: '#ffd700', fontWeight: 800, fontSize: '1.05rem' }}>{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
