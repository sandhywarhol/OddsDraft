'use client';

import Navbar from '@/components/Navbar';
import { WC2026_PLAYERS } from '@/lib/wc2026-players-static';
import { useTxLine } from '@/context/TxLineContext';
import { useState, useEffect } from 'react';

interface TeamMeta {
  color: string;
  stage: string;
  form: string[];
  lastMatch: string;
  nextMatch: string;
}

const TEAM_METADATA: Record<string, TeamMeta> = {
  'Algeria': {
    color: '#008751',
    stage: 'Round of 32',
    form: ['-', 'L', 'L', 'W', 'W'],
    lastMatch: '🔴 0 - 2 SUI 🇨🇭',
    nextMatch: '-'
  },
  'Argentina': {
    color: '#74acdf',
    stage: 'Round of 16',
    form: ['-', 'W', 'W', 'W', 'W'],
    lastMatch: '🟢 3 - 2 CPV 🇨🇻',
    nextMatch: '07/07/26 v EGY 🇪🇬'
  },
  'Australia': {
    color: '#f8d117',
    stage: 'Round of 32',
    form: ['-', 'L', 'L', 'L', 'L'],
    lastMatch: '⚪ (2) 1 - 1 (4) EGY 🇪🇬',
    nextMatch: '-'
  },
  'Austria': {
    color: '#c60b1e',
    stage: 'Round of 32',
    form: ['-', 'L', 'L', 'L', 'W'],
    lastMatch: '🔴 0 - 3 ESP 🇪🇸',
    nextMatch: '-'
  },
  'Belgium': {
    color: '#8b0000',
    stage: 'Round of 16',
    form: ['-', 'W', 'L', 'W', 'W'],
    lastMatch: '🟢 2 - 1 SEN 🇸🇳',
    nextMatch: '07/07/26 v USA 🇺🇸'
  },
  'Bosnia & Herzegovina': {
    color: '#002f6c',
    stage: 'Round of 32',
    form: ['-', 'L', 'W', 'L', 'L'],
    lastMatch: '🔴 0 - 2 USA 🇺🇸',
    nextMatch: '-'
  },
  'Brazil': {
    color: '#fbbf24',
    stage: 'Round of 16',
    form: ['-', 'W', 'W', 'W', 'W'],
    lastMatch: '🟢 2 - 0 NOR 🇳🇴',
    nextMatch: '-'
  },
  'Cape Verde': {
    color: '#0a1172',
    stage: 'Round of 32',
    form: ['-', 'W', 'W', 'L', 'L'],
    lastMatch: '🔴 2 - 3 ARG 🇦🇷',
    nextMatch: '-'
  },
  'Germany': {
    color: '#111827',
    stage: 'Round of 16',
    form: ['-', 'W', 'W', 'L', 'W'],
    lastMatch: '🟢 2 - 1 JPN 🇯🇵',
    nextMatch: '08/07/26 v ESP 🇪🇸'
  },
  'Spain': {
    color: '#c2410c',
    stage: 'Round of 16',
    form: ['-', 'W', 'W', 'W', 'W'],
    lastMatch: '🟢 3 - 0 AUT 🇦🇹',
    nextMatch: '08/07/26 v GER 🇩🇪'
  },
  'France': {
    color: '#1d4ed8',
    stage: 'Round of 16',
    form: ['-', 'W', 'L', 'W', 'W'],
    lastMatch: '🟢 1 - 0 SWE 🇸🇪',
    nextMatch: '07/07/26 v PAR 🇵🇾'
  },
  'England': {
    color: '#3b82f6',
    stage: 'Round of 16',
    form: ['-', 'W', 'W', 'W', 'L'],
    lastMatch: '🔴 0 - 1 MEX 🇲🇽',
    nextMatch: '-'
  },
  'USA': {
    color: '#1e3a8a',
    stage: 'Round of 16',
    form: ['-', 'W', 'W', 'W', 'W'],
    lastMatch: '🟢 2 - 0 BIH 🇧🇦',
    nextMatch: '07/07/26 v BEL 🇧🇪'
  },
  'Netherlands': {
    color: '#f97316',
    stage: 'Round of 16',
    form: ['-', 'W', 'W', 'W', 'W'],
    lastMatch: '🟢 2 - 1 MAR 🇲🇦',
    nextMatch: '08/07/26 v COL 🇨🇴'
  },
  'Haiti': {
    color: '#3b82f6',
    stage: 'Group Stage',
    form: ['-', 'L', 'W', 'L'],
    lastMatch: '🔴 1 - 2 SCO 🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    nextMatch: '-'
  },
  'Scotland': {
    color: '#0f172a',
    stage: 'Group Stage',
    form: ['-', 'W', 'L', 'W'],
    lastMatch: '🟢 2 - 1 HAI 🇭🇹',
    nextMatch: '-'
  },
  'Turkey': {
    color: '#e11d48',
    stage: 'Group Stage',
    form: ['-', 'L', 'L', 'W'],
    lastMatch: '🟢 1 - 0 AUS 🇦🇺',
    nextMatch: '-'
  },
  'Curacao': {
    color: '#2563eb',
    stage: 'Group Stage',
    form: ['-', 'L', 'L', 'L'],
    lastMatch: '🔴 0 - 4 GER 🇩🇪',
    nextMatch: '-'
  },
  'Japan': {
    color: '#1e3a8a',
    stage: 'Group Stage',
    form: ['-', 'L', 'W', 'L'],
    lastMatch: '🔴 1 - 2 GER 🇩🇪',
    nextMatch: '-'
  },
  'Ivory Coast': {
    color: '#ea580c',
    stage: 'Group Stage',
    form: ['-', 'W', 'L', 'L'],
    lastMatch: '🔴 0 - 2 ECU 🇪🇨',
    nextMatch: '-'
  },
  'Ecuador': {
    color: '#eab308',
    stage: 'Group Stage',
    form: ['-', 'W', 'W', 'L'],
    lastMatch: '🔴 1 - 2 CIV 🇨🇮',
    nextMatch: '-'
  },
  'Sweden': {
    color: '#2563eb',
    stage: 'Group Stage',
    form: ['-', 'W', 'L', 'L'],
    lastMatch: '🔴 0 - 1 FRA 🇫🇷',
    nextMatch: '-'
  },
  'Tunisia': {
    color: '#dc2626',
    stage: 'Group Stage',
    form: ['-', 'L', 'L', 'L'],
    lastMatch: '🔴 0 - 2 ESP 🇪🇸',
    nextMatch: '-'
  },
  'Egypt': {
    color: '#7f1d1d',
    stage: 'Round of 16',
    form: ['-', 'W', 'W', 'W', 'W'],
    lastMatch: '🟢 (4) 1 - 1 (2) AUS 🇦🇺',
    nextMatch: '07/07/26 v ARG 🇦🇷'
  },
  'Saudi Arabia': {
    color: '#15803d',
    stage: 'Group Stage',
    form: ['-', 'L', 'W', 'L'],
    lastMatch: '🔴 0 - 2 URU 🇺🇾',
    nextMatch: '-'
  },
  'Uruguay': {
    color: '#0284c7',
    stage: 'Group Stage',
    form: ['-', 'W', 'L', 'W'],
    lastMatch: '🟢 2 - 0 KSA 🇸🇦',
    nextMatch: '-'
  },
  'Iran': {
    color: '#16a34a',
    stage: 'Group Stage',
    form: ['-', 'L', 'L', 'L'],
    lastMatch: '🔴 0 - 3 NZL 🇳🇿',
    nextMatch: '-'
  },
  'New Zealand': {
    color: '#0f172a',
    stage: 'Group Stage',
    form: ['-', 'W', 'L', 'L'],
    lastMatch: '🟢 3 - 0 IRN 🇮🇷',
    nextMatch: '-'
  },
  'Senegal': {
    color: '#15803d',
    stage: 'Round of 32',
    form: ['-', 'W', 'W', 'L', 'L'],
    lastMatch: '🔴 1 - 2 BEL 🇧🇪',
    nextMatch: '-'
  },
  'Iraq': {
    color: '#1e3a8a',
    stage: 'Group Stage',
    form: ['-', 'L', 'L', 'L'],
    lastMatch: '🔴 0 - 4 NOR 🇳🇴',
    nextMatch: '-'
  },
  'Norway': {
    color: '#dc2626',
    stage: 'Round of 32',
    form: ['-', 'W', 'W', 'W', 'L'],
    lastMatch: '🔴 0 - 2 BRA 🇧🇷',
    nextMatch: '-'
  },
  'Jordan': {
    color: '#047857',
    stage: 'Group Stage',
    form: ['-', 'L', 'L', 'L'],
    lastMatch: '🔴 0 - 3 POR 🇵🇹',
    nextMatch: '-'
  },
  'Portugal': {
    color: '#b91c1c',
    stage: 'Round of 16',
    form: ['-', 'W', 'W', 'W', 'W'],
    lastMatch: '🟢 3 - 0 COD 🇨🇩',
    nextMatch: '06/07/26 v ESP 🇪🇸'
  },
  'Congo DR': {
    color: '#0284c7',
    stage: 'Group Stage',
    form: ['-', 'L', 'W', 'L'],
    lastMatch: '🔴 0 - 3 POR 🇵🇹',
    nextMatch: '-'
  },
  'Croatia': {
    color: '#b91c1c',
    stage: 'Group Stage',
    form: ['-', 'L', 'L', 'W'],
    lastMatch: '🟢 2 - 1 GHA 🇬🇭',
    nextMatch: '-'
  },
  'Ghana': {
    color: '#eab308',
    stage: 'Group Stage',
    form: ['-', 'L', 'L', 'L'],
    lastMatch: '🔴 1 - 2 CRO 🇭🇷',
    nextMatch: '-'
  },
  'Panama': {
    color: '#1e40af',
    stage: 'Group Stage',
    form: ['-', 'L', 'L', 'L'],
    lastMatch: '🔴 0 - 2 UZB 🇺🇿',
    nextMatch: '-'
  },
  'Uzbekistan': {
    color: '#06b6d4',
    stage: 'Group Stage',
    form: ['-', 'W', 'L', 'L'],
    lastMatch: '🟢 2 - 0 PAN 🇵🇦',
    nextMatch: '-'
  },
  'Colombia': {
    color: '#eab308',
    stage: 'Round of 16',
    form: ['-', 'W', 'W', 'W', 'W'],
    lastMatch: '🟢 2 - 0 CZE 🇨🇿',
    nextMatch: '08/07/26 v NED 🇳🇱'
  },
  'Czech Republic': {
    color: '#1d4ed8',
    stage: 'Group Stage',
    form: ['-', 'W', 'L', 'L'],
    lastMatch: '🔴 0 - 2 COL 🇨🇴',
    nextMatch: '-'
  },
  'South Africa': {
    color: '#047857',
    stage: 'Group Stage',
    form: ['-', 'L', 'L', 'W'],
    lastMatch: '🟢 2 - 1 SUI 🇨🇭',
    nextMatch: '-'
  },
  'Switzerland': {
    color: '#dc2626',
    stage: 'Round of 16',
    form: ['-', 'W', 'W', 'W', 'W'],
    lastMatch: '🟢 2 - 0 RSA 🇿🇦',
    nextMatch: '07/07/26 v COL 🇨🇴'
  },
  'Canada': {
    color: '#dc2626',
    stage: 'Round of 16',
    form: ['-', 'W', 'W', 'W', 'W'],
    lastMatch: '🟢 2 - 1 QAT 🇶🇦',
    nextMatch: '04/07/26 v MAR 🇲🇦'
  },
  'Qatar': {
    color: '#881337',
    stage: 'Group Stage',
    form: ['-', 'L', 'L', 'L'],
    lastMatch: '🔴 1 - 2 CAN 🇨🇦',
    nextMatch: '-'
  },
  'Mexico': {
    color: '#15803d',
    stage: 'Round of 16',
    form: ['-', 'W', 'W', 'W', 'W'],
    lastMatch: '🟢 1 - 0 ENG 🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    nextMatch: '06/07/26 v ENG 🏴󠁧󠁢󠁥󠁮󠁧󠁿'
  },
  'South Korea': {
    color: '#dc2626',
    stage: 'Group Stage',
    form: ['-', 'L', 'W', 'L'],
    lastMatch: '🔴 0 - 2 USA 🇺🇸',
    nextMatch: '-'
  },
  'Morocco': {
    color: '#b91c1c',
    stage: 'Round of 16',
    form: ['-', 'W', 'W', 'W', 'L'],
    lastMatch: '⚫ 1 - 2 NED 🇳🇱',
    nextMatch: '04/07/26 v CAN 🇨🇦'
  },
  'Paraguay': {
    color: '#dc2626',
    stage: 'Round of 16',
    form: ['-', 'W', 'W', 'W', 'W'],
    lastMatch: '🟢 2 - 0 FRA 🇫🇷',
    nextMatch: '04/07/26 v FRA 🇫🇷'
  }
};

const getTeamMeta = (name: string): TeamMeta => {
  return TEAM_METADATA[name] || {
    color: '#1e293b',
    stage: 'Group Stage',
    form: ['-', 'W', 'L'],
    lastMatch: '-',
    nextMatch: '-'
  };
};

const getDisplayName = (name: string) => {
  if (name === 'Cape Verde') return 'Cabo Verde';
  if (name === 'Bosnia & Herzegovina') return 'Bosnia and Herzegovina';
  return name;
};

export default function TeamsPage() {
  const { appMode } = useTxLine();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);

  // Group players by team
  const teamsMap = WC2026_PLAYERS.reduce((acc, player) => {
    if (!acc[player.team]) {
      acc[player.team] = {
        name: player.team,
        flag: player.teamFlag,
        players: [],
      };
    }
    acc[player.team].players.push(player);
    return acc;
  }, {} as Record<string, { name: string; flag: string; players: typeof WC2026_PLAYERS }>);

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
                  Qualified
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 8, lineHeight: 1.1 }}>
                Qualified Teams
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                Click a team card below to view their squad lineup and player statistics.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
              {/* txLINE Synchronization status bar for Live Mode */}
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
                    {isSyncing ? 'SYNCHRONIZING SQUADS FEED...' : 'SQUAD DATA SYNCHRONIZED'}
                  </span>
                </div>
              )}
              <img 
                src="/fifa_world_cup_2026_logo.webp" 
                alt="FIFA World Cup 2026 Logo" 
                style={{ height: '120px', objectFit: 'contain', opacity: 0.95, margin: 0 }}
              />
            </div>
          </div>
        </div>

        {/* Loader or Content */}
        {isSyncing ? (
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
              Fetching official squads and OVR statistics from txLINE Soccer API...
            </span>
          </div>
        ) : (
          /* Cards Grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
            {teams.map(team => {
              const meta = getTeamMeta(team.name);
              return (
                <div 
                  key={team.name}
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
                    background: meta.color,
                    padding: '24px 20px',
                    position: 'relative',
                    height: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    {/* Large Flag Box */}
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: 6,
                      width: 48,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{team.flag}</span>
                    </div>

                    <h3 style={{ 
                      fontSize: '1.4rem', 
                      fontWeight: 800, 
                      color: '#000000', 
                      margin: 0,
                      lineHeight: 1.1,
                      textShadow: '0 1px 1px rgba(255,255,255,0.15)'
                    }}>
                      {getDisplayName(team.name)}
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
                    {/* Stage */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontWeight: 600 }}>Stage</span>
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>{meta.stage}</span>
                    </div>

                    {/* Tournament Form */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontWeight: 600 }}>Tournament Form</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {meta.form.map((f, i) => (
                          <span key={i} style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: f === 'W' ? '#22c55e' : f === 'L' ? '#ef4444' : f === 'D' ? '#94a3b8' : 'transparent',
                            border: f === '-' ? '1px solid #cbd5e1' : 'none'
                          }} />
                        ))}
                      </div>
                    </div>

                    {/* Last Match */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontWeight: 600 }}>Last Match</span>
                      <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8rem' }}>{meta.lastMatch}</span>
                    </div>

                    {/* Next Match */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontWeight: 600 }}>Next Match</span>
                      <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8rem' }}>{meta.nextMatch}</span>
                    </div>
                  </div>
                </div>
              );
            })}
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
                background: getTeamMeta(selectedTeam.name).color,
                padding: '24px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTopLeftRadius: 15,
                borderTopRightRadius: 15
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>{selectedTeam.flag}</span>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#000000', margin: 0 }}>
                      {getDisplayName(selectedTeam.name)}
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {selectedTeam.players.length} Players Squad
                    </span>
                  </div>
                </div>
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedTeam(null)}
                  style={{
                    background: 'rgba(0, 0, 0, 0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    color: '#000000',
                    fontWeight: 700,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.15)'}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 28, overflowY: 'auto' }}>
                {/* Starting XI */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, color: '#00e87a', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🛡️ Starting XI
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                    {selectedTeam.players.slice(0, 11).map((p: any) => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#ffffff' }}>
                          {p.position}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>{p.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>#{p.jerseyNumber}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.65rem', color: '#ffd700', fontWeight: 700, lineHeight: 1 }}>OVR</span>
                          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#00e5ff', lineHeight: 1, marginTop: 2 }}>{p.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Substitutes */}
                {selectedTeam.players.length > 11 && (
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, color: '#ff4d6d', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      🏃‍♂️ Substitutes
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                      {selectedTeam.players.slice(11).map((p: any) => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px', opacity: 0.85 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                            {p.position}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>{p.name}</div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>#{p.jerseyNumber}</div>
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
