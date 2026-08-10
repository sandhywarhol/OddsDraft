'use client';

import Navbar from '@/components/Navbar';
import { useTxLine } from '@/context/TxLineContext';
import { useState, useEffect } from 'react';
import { LEAGUES } from '@/lib/leagues';

export default function TeamsPage() {
  const { appMode } = useTxLine();
  
  const [selectedLeague, setSelectedLeague] = useState<string>('eng.1');
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);

  // Sync animation state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);

  useEffect(() => {
    async function fetchTeams() {
      setIsLoadingTeams(true);
      try {
        const res = await fetch(`/api/teams?league=${selectedLeague}`);
        const data = await res.json();
        setTeams(data.teams || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingTeams(false);
      }
    }
    fetchTeams();
  }, [selectedLeague]);

  useEffect(() => {
    async function fetchRoster() {
      if (!selectedTeam) return;
      setIsLoadingRoster(true);
      try {
        const res = await fetch(`/api/teams/${selectedTeam.id}/roster?league=${selectedLeague}`);
        const data = await res.json();
        setRoster(data.players || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingRoster(false);
      }
    }
    fetchRoster();
  }, [selectedTeam, selectedLeague]);

  // Handle sync effect when in Live Mode
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
            backgroundImage: 'url("/team.webp")',
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
                League Teams
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                Select a league and click a team card below to view their official ESPN squad lineup.
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
        {isLoadingTeams || isSyncing ? (
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
              Fetching official teams from ESPN API...
            </span>
          </div>
        ) : (
          /* Cards Grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
            {teams.map(team => (
              <div 
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className="team-card"
                style={{
                  background: '#ffffff',
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                {/* Card Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  padding: '24px 20px',
                  position: 'relative',
                  height: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  borderBottom: '2px solid #ffd700'
                }}>
                  {/* Large Flag/Logo Box */}
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 8,
                    width: 52,
                    height: 52,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                  }}>
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                    )}
                  </div>

                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 800, 
                    color: '#ffffff', 
                    margin: 0,
                    lineHeight: 1.2,
                    paddingRight: '56px',
                    wordBreak: 'break-word',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                  }}>
                    {team.name}
                  </h3>
                </div>

                {/* Card Body */}
                <div style={{
                  padding: '16px 20px',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Abbreviation</span>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{team.abbreviation || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>Data Source</span>
                    <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8rem' }}>ESPN API</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Overlay */}
        {selectedTeam && (
          <div 
            onClick={() => setSelectedTeam(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 20
            }}
          >
            {/* Modal Box */}
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 16,
                width: '100%',
                maxWidth: 800,
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Modal Header */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                padding: '24px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTopLeftRadius: 15,
                borderTopRightRadius: 15
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {selectedTeam.logo && (
                    <div style={{ background: '#fff', borderRadius: '50%', padding: 4, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={selectedTeam.logo} alt={selectedTeam.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    </div>
                  )}
                  <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                      {selectedTeam.name}
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textShadow: '0 1px 1px rgba(0,0,0,0.6)' }}>
                      ESPN Squad Roster
                    </span>
                  </div>
                </div>
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedTeam(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: '#ffffff',
                    fontWeight: 700,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28, overflowY: 'auto' }}>
                {isLoadingRoster ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                     <div style={{ 
                        width: 30, 
                        height: 30, 
                        borderRadius: '50%', 
                        border: '3px solid rgba(0, 229, 255, 0.1)', 
                        borderTopColor: '#00e5ff',
                        animation: 'spin 1s linear infinite'
                      }} />
                  </div>
                ) : roster.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
                    No roster data available for this team.
                  </div>
                ) : (
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, color: '#00e87a', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      🛡️ Players Roster
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                      {roster.map((p: any) => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#ffffff' }}>
                            {p.positionAbbr}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>{p.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>#{p.jersey}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.65rem', color: '#ffd700', fontWeight: 700, lineHeight: 1 }}>AGE</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#00e5ff', lineHeight: 1, marginTop: 2 }}>{p.age || '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .team-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.25) !important;
        }
      `}</style>
    </div>
  );
}
