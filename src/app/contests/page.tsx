'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { DEMO_FIXTURES, type DemoFixture } from '@/lib/players';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { useTxLine } from '@/context/TxLineContext';
import { useEffect, useState } from 'react';

export default function ContestsPage() {
  const { appMode, allFixtures, liveFixtures } = useTxLine();
  const [mounted, setMounted] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<DemoFixture | null>(null);
  
  useEffect(() => setMounted(true), []);

  const isDemo = appMode === 'demo';

  const mappedFixtures: DemoFixture[] = isDemo ? DEMO_FIXTURES : (allFixtures || []).map((f: any) => {
    const isTxLineLive = liveFixtures?.some(lf => 
      lf.homeTeam?.name === (f.homeTeam?.name || f.home_team?.name || f.homeTeam) || 
      lf.awayTeam?.name === (f.awayTeam?.name || f.away_team?.name || f.awayTeam)
    );
    
    const kickoffTime = new Date(f.kickoff_time || f.date || f.kickoffAt || new Date().toISOString());
    const isPastKickoff = Date.now() > kickoffTime.getTime();

    let dynamicStatus = f.status || 'upcoming';
    if (isTxLineLive) {
      dynamicStatus = 'live';
    } else if (isPastKickoff && dynamicStatus !== 'finished') {
      dynamicStatus = 'finished'; 
    }

    let homeScore = f.score?.home ?? f.homeScore ?? null;
    let awayScore = f.score?.away ?? f.awayScore ?? null;
    if (isTxLineLive) {
      const txMatch = liveFixtures?.find(lf => 
        lf.homeTeam?.name === (f.homeTeam?.name || f.home_team?.name || f.homeTeam) || 
        lf.awayTeam?.name === (f.awayTeam?.name || f.away_team?.name || f.awayTeam)
      );
      if (txMatch && txMatch.score) {
        homeScore = txMatch.score.home;
        awayScore = txMatch.score.away;
      }
    }

    return {
      fixtureId: f.id || f.fixtureId || f._id || Math.random().toString(),
      kickoffAt: f.kickoff_time || f.date || f.kickoffAt || new Date().toISOString(),
      homeTeam: f.homeTeam?.name || f.home_team?.name || f.homeTeam || 'Home',
      homeFlag: f.homeTeam?.code ? '🏳️' : '🏳️',
      awayTeam: f.awayTeam?.name || f.away_team?.name || f.awayTeam || 'Away',
      awayFlag: f.awayTeam?.code ? '🏳️' : '🏳️',
      status: dynamicStatus,
      homeScore,
      awayScore,
    };
  });

  const upcoming = mappedFixtures.filter((f) => f.status === 'upcoming');
  const live = mappedFixtures.filter((f) => f.status === 'live');
  const finished = mappedFixtures.filter((f) => f.status === 'finished');

  if (!mounted) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      <main style={{ padding: '48px 0 80px' }}>
        <div className="container">
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span className="badge badge--primary">2026 World Cup</span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 8 }}>
              Match Schedule
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Pick a match, build your lineup, and compete for SOL prizes.
            </p>
          </div>

          {/* Entry Fee Info */}
          <div className="card card--glass" style={{ marginBottom: 32, padding: 'var(--space-4) var(--space-6)' }}>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Entry Fee', value: '0.1 SOL (Devnet)', icon: '💰' },
                { label: 'Prize Modes', value: 'Top 3, 50/50, WTA', icon: '🏆' },
                { label: 'Network', value: 'Solana Devnet', icon: '🔗' },
                { label: 'Data', value: 'TxODDS Live', icon: '⚡' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LIVE Contests */}
          {live.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Live Now</h2>
                <span className="badge badge--live">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                  {live.length} match{live.length > 1 ? 'es' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
                
                {/* 1. Live Matches Cards (Left) */}
                <div style={{ flex: '1 1 35%', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {live.map((fixture) => (
                    <ContestCard key={fixture.fixtureId} fixture={fixture} onSelect={setSelectedFixture} />
                  ))}
                </div>

                {/* 2. Live Match Events (Middle) */}
                <div style={{ flex: '1 1 35%', minWidth: 300 }}>
                  <div className="ro-window" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="ro-window__header" style={{ background: 'linear-gradient(to right, #ea6b6b 0%, #b71c1c 100%)' }}>
                      <span>⚡ Live Updates</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>🔴 LIVE</span>
                    </div>
                    <div className="ro-window__body" style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
                      {[
                        { id: '1', minute: 42, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', type: 'goal', points: 10, description: 'GOAL! Messi scores a brilliant free kick!' },
                        { id: '2', minute: 38, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', type: 'shot_on_target', points: 2, description: 'Mbappé shoots but it is saved.' },
                        { id: '3', minute: 38, team: 'Argentina', teamFlag: '🇦🇷', player: 'Martínez', type: 'goalkeeper_save', points: 1, description: 'Incredible save by Martínez!' },
                        { id: '4', minute: 32, team: 'France', teamFlag: '🇫🇷', player: 'Tchouaméni', type: 'tackle', points: 1, description: 'Crucial tackle in the midfield.' },
                        { id: '5', minute: 28, team: 'Argentina', teamFlag: '🇦🇷', player: 'Di María', type: 'assist', points: 6, description: 'Beautiful cross into the box!' },
                        { id: '6', minute: 21, team: 'France', teamFlag: '🇫🇷', player: 'Griezmann', type: 'yellow_card', points: -2, description: 'Yellow card for a late challenge.' },
                        { id: '7', minute: 14, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero', type: 'clean_sheet', points: 4, description: 'Solid defensive work so far.' },
                        { id: '8', minute: 7, team: 'France', teamFlag: '🇫🇷', player: 'Giroud', type: 'offside', points: -1, description: 'Flag is up! Giroud caught offside.' },
                        { id: '9', minute: 1, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Kick Off! Argentina vs France has begun!' },
                      ].map((event) => (
                        <div key={event.id} style={{ display: 'flex', gap: 12 }}>
                          <div style={{ width: 28, fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', paddingTop: 2 }}>
                            {event.minute}'
                          </div>
                          <div style={{ 
                            flex: 1, 
                            background: 'rgba(0,0,0,0.3)', 
                            padding: '10px 12px', 
                            border: '1px solid #4f6382',
                            boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.5)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <strong style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{event.teamFlag} {event.player}</strong>
                              {event.points !== 0 && (
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: event.points > 0 ? '#00e87a' : '#ff4d6d' }}>
                                  {event.points > 0 ? '+' : ''}{event.points} pts
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{event.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Live Leaderboard (Right) */}
                <div style={{ flex: '1 1 25%', minWidth: 260 }}>
                  <div className="ro-window" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="ro-window__header" style={{ background: 'linear-gradient(to right, #b45309 0%, #78350f 100%)' }}>
                      <span>🏆 Live Leaderboard</span>
                    </div>
                    <div className="ro-window__body" style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
                      {[
                        { rank: 1, user: 'CryptoKing', pts: 86, prize: '1.2' },
                        { rank: 2, user: 'SatoshiStriker', pts: 78, prize: '0.85' },
                        { rank: 3, user: 'Web3Winner', pts: 72, prize: '0.6' },
                        { rank: 4, user: 'BlockBetter', pts: 68, prize: '0.45' },
                        { rank: 5, user: 'NFTNinja', pts: 64, prize: '0.35' },
                        { rank: 6, user: 'SolanaSurfer', pts: 59, prize: '0.2' },
                        { rank: 7, user: 'DefiDon', pts: 55, prize: '0.1' },
                        { rank: 8, user: 'TokenTactician', pts: 51, prize: '0.1' },
                        { rank: 9, user: 'MetaManager', pts: 48, prize: '0.05' },
                        { rank: 10, user: 'AlphaApe', pts: 45, prize: '0.05' },
                        { rank: 11, user: 'BetBros', pts: 42, prize: '-' },
                        { rank: 12, user: 'ChainChamp', pts: 40, prize: '-' },
                      ].map((entry) => (
                        <div key={entry.rank} style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                          background: 'rgba(0,0,0,0.3)', padding: '10px 12px', 
                          border: '1px solid #4f6382',
                          boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.5)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 800, color: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : '#cd7f32' }}>#{entry.rank}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>{entry.user}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                            <span style={{ fontSize: '0.8rem', color: '#00e87a' }}>{entry.pts} pts</span>
                            <span style={{ fontSize: '0.75rem', color: '#ffd700', fontWeight: 700 }}>{entry.prize} SOL</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* UPCOMING Contests */}
          {upcoming.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>Upcoming</h2>
              <div className="grid-contests">
                {upcoming.map((fixture) => (
                  <ContestCard key={fixture.fixtureId} fixture={fixture} onSelect={setSelectedFixture} />
                ))}
              </div>
            </section>
          )}

          {/* FINISHED Contests */}
          {finished.length > 0 && (
            <section>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-secondary)' }}>
                Completed
              </h2>
              <div className="grid-contests">
                {finished.map((fixture) => (
                  <ContestCard key={fixture.fixtureId} fixture={fixture} onSelect={setSelectedFixture} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* LOBBY MODAL */}
      {selectedFixture && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div className="ro-window" style={{ width: '100%', maxWidth: 500, animation: 'slide-in-bottom 0.2s ease-out' }}>
            <div className="ro-window__header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Select Contest Type</span>
              <button onClick={() => setSelectedFixture(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            <div className="ro-window__body" style={{ padding: 24 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedFixture.homeTeam} vs {selectedFixture.awayTeam}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Choose a prize structure to compete in</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { id: 'top3', title: 'Top 3 Classic', desc: '50% / 30% / 20% prize split. The standard competitive mode.', entry: '0.1 SOL', icon: '🏆', participants: 42 },
                  { id: '5050', title: 'Double Up (50/50)', desc: 'Top 50% of the leaderboard double their entry fee.', entry: '0.1 SOL', icon: '⚖️', participants: 87 },
                  { id: 'wta', title: 'Winner Takes All', desc: '1st place gets 100% of the prize pool. High risk, high reward.', entry: '0.1 SOL', icon: '💀', participants: 15 },
                ].map(ct => (
                  <Link href={`/lineup/${selectedFixture.fixtureId}?contestType=${ct.id}`} key={ct.id} style={{ textDecoration: 'none' }}>
                    <div className="card card--hoverable" style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                      <div style={{ fontSize: '2rem' }}>{ct.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{ct.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ct.desc}</div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Entry</div>
                          <div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{ct.entry}</div>
                        </div>
                        <div style={{ width: 80, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
                            Lobby: {ct.participants}/100
                          </div>
                          <div style={{ width: '100%', height: 4, background: 'var(--bg-glass)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ width: `${ct.participants}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 999 }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContestCard({ fixture, onSelect }: { fixture: DemoFixture, onSelect?: (f: DemoFixture) => void }) {
  const kickoff = new Date(fixture.kickoffAt);
  const isLive = fixture.status === 'live';
  const isFinished = fixture.status === 'finished';
  const isUpcoming = fixture.status === 'upcoming';

  // Simulated participant count & prize pool
  const participants = isLive ? 47 : isFinished ? 83 : Math.floor(Math.random() * 30) + 10;
  const prizePool = (participants * 0.1).toFixed(1);

  return (
    <div
      className="ro-window card--hoverable"
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
      id={`contest-card-${fixture.fixtureId}`}
    >
      {/* Live pulse bg */}
      {isLive && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at top right, rgba(255, 77, 109, 0.08), transparent 60%)',
          pointerEvents: 'none',
        }} />
      )}

      {/* RO Window Header */}
      <div className="ro-window__header" style={{
        background: isLive 
          ? 'linear-gradient(to right, #ea6b6b 0%, #b71c1c 100%)'
          : (isFinished ? 'linear-gradient(to right, #4f5f70 0%, #2c353f 100%)' : 'linear-gradient(to right, var(--color-ro-blue-header) 0%, var(--color-ro-blue-header-light) 100%)'),
      }}>
        <span>{fixture.homeTeam} vs {fixture.awayTeam}</span>
        <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>
          {isLive ? '🔴 LIVE' : isUpcoming ? '⏳ UPCOMING' : '🏁 COMPLETED'}
        </span>
      </div>

      <div className="ro-window__body">
        {/* Time info */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {isUpcoming
              ? `Starts in ${formatDistanceToNow(kickoff)}`
              : isLive
              ? `Started ${formatDistanceToNow(kickoff)} ago`
              : format(kickoff, 'MMM d, yyyy')}
          </span>
        </div>

        {/* Teams */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>{fixture.homeFlag}</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fixture.homeTeam}</div>
            {isLive && (
              <div style={{
                fontFamily: 'Bebas Neue, cursive',
                fontSize: '2.5rem',
                color: 'var(--text-primary)',
                marginTop: 4,
              }}>
                {fixture.homeScore ?? 0}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', padding: '0 16px' }}>
            {isLive ? (
              <div style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.8rem' }}>VS</div>
            ) : isFinished ? (
              <div style={{
                fontFamily: 'Bebas Neue, cursive',
                fontSize: '1.8rem',
                color: 'var(--text-secondary)',
                letterSpacing: '0.08em',
              }}>
                {fixture.homeScore} — {fixture.awayScore}
              </div>
            ) : (
              <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.5rem', color: 'var(--text-muted)' }}>
                VS
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>{fixture.awayFlag}</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fixture.awayTeam}</div>
            {isLive && (
              <div style={{
                fontFamily: 'Bebas Neue, cursive',
                fontSize: '2.5rem',
                color: 'var(--text-primary)',
                marginTop: 4,
              }}>
                {fixture.awayScore ?? 0}
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.3rem', color: 'var(--color-primary)' }}>
              {prizePool}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Prize Pool
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.3rem', color: 'var(--text-primary)' }}>
              {participants}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Players
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.3rem', color: 'var(--color-accent)' }}>
              0.1
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Entry SOL
            </div>
          </div>
        </div>



        {/* CTA */}
        {isUpcoming && (
          <button
            onClick={() => onSelect?.(fixture)}
            className="btn btn--primary btn--full"
            id={`join-${fixture.fixtureId}`}
          >
            Build Lineup →
          </button>
        )}
        {isLive && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/live/${fixture.fixtureId}`} className="btn btn--danger btn--full" id={`live-${fixture.fixtureId}`}>
              🔴 Watch Live
            </Link>
            <button 
              onClick={() => onSelect?.(fixture)} 
              className="btn btn--secondary" 
              id={`join-live-${fixture.fixtureId}`} 
              style={{ whiteSpace: 'nowrap' }}
            >
              Join
            </button>
          </div>
        )}
        {isFinished && (
          <Link
            href={`/contest/${fixture.fixtureId}`}
            className="btn btn--ghost btn--full"
            id={`results-${fixture.fixtureId}`}
          >
            View Results
          </Link>
        )}
      </div>
    </div>
  );
}
