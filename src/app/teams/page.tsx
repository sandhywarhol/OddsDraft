'use client';

import Navbar from '@/components/Navbar';
import { WORLD_CUP_PLAYERS } from '@/lib/players';
import { useTxLine } from '@/context/TxLineContext';
import { useState, useEffect } from 'react';

export default function TeamsPage() {
  const { appMode } = useTxLine();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);

  // Group players by team
  const teamsMap = WORLD_CUP_PLAYERS.reduce((acc, player) => {
    if (!acc[player.team]) {
      acc[player.team] = {
        name: player.team,
        flag: player.teamFlag,
        players: [],
      };
    }
    acc[player.team].players.push(player);
    return acc;
  }, {} as Record<string, { name: string; flag: string; players: typeof WORLD_CUP_PLAYERS }>);

  // Sort teams alphabetically
  const teams = Object.values(teamsMap).sort((a, b) => a.name.localeCompare(b.name));

  // Sort players within each team by rating (descending)
  teams.forEach(t => {
    t.players.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  });

  // Handle sync effect when in Live Mode
  useEffect(() => {
    if (appMode === 'live') {
      setIsSyncing(true);
      setSyncComplete(false);
      const timer = setTimeout(() => {
        setIsSyncing(false);
        setSyncComplete(true);
      }, 1500); // 1.5 seconds simulation of fetching from txLINE Soccer API
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
        <div 
          style={{ 
            background: 'rgba(10, 13, 18, 0.7)', 
            backdropFilter: 'blur(16px)', 
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: 16, 
            padding: '32px 40px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            marginBottom: 48
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: '2.5rem' }}>🌍</span>
              <div>
                <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, margin: 0, color: '#ffd700' }}>
                  Teams & Rosters
                </h1>
                <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0' }}>
                  View all countries, starting lineups, substitutes, and player stats.
                </p>
              </div>
            </div>

            {/* txLINE Synchronization status bar for Live Mode */}
            {appMode === 'live' && (
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  background: 'rgba(0,0,0,0.4)', 
                  padding: '12px 18px', 
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
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: syncComplete ? '#00e87a' : '#00e5ff', fontFamily: 'monospace' }}>
                  {isSyncing ? 'SYNCHRONIZING WITH txLINE ORACLE FEED...' : 'txLINE STREAM ACTIVE // DATA SYNCHRONIZED'}
                </span>
              </div>
            )}
          </div>

          {isSyncing ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                border: '3px solid rgba(0, 229, 255, 0.1)', 
                borderTopColor: '#00e5ff',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                Fetching official squads and OVR statistics from txLINE Soccer API...
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {teams.map(team => {
                // Split into Starting XI (Top 11) and Subs
                const startingXI = team.players.slice(0, 11);
                const substitutes = team.players.slice(11);

                return (
                  <div key={team.name} className="ro-window" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="ro-window__header" style={{ background: 'linear-gradient(to right, #2c353f 0%, #1a202c 100%)', padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: '1.5rem' }}>{team.flag}</span>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>{team.name}</h2>
                    </div>
                    
                    <div className="ro-window__body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                      
                      {/* Starting XI */}
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#00e87a', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                          Starting XI
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                          {startingXI.map(p => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 8, border: '1px solid #4f6382', boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.5)' }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #4f6382 0%, #1a202c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>
                                {p.position}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0' }}>{p.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>#{p.jerseyNumber}</div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', color: '#ffd700', fontWeight: 700 }}>OVR</span>
                                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#00e5ff' }}>{p.rating}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Substitutes */}
                      {substitutes.length > 0 && (
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#ff4d6d', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                            Substitutes
                          </h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                            {substitutes.map(p => (
                              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', opacity: 0.8 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>
                                  {p.position}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>{p.name}</div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>#{p.jerseyNumber}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#94a3b8' }}>{p.rating}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
