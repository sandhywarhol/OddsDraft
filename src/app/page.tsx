'use client';

import { useTxLine } from '@/context/TxLineContext';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FlagImage from '@/components/FlagImage';
import { DEMO_FIXTURES } from '@/lib/players';
import { WC2026_FIXTURES, getFixtureStatus } from '@/lib/wc2026-fixtures';
import { formatDistanceToNow } from 'date-fns';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (window.innerWidth <= 768) {
      router.replace('/contests');
    }
  }, [router]);

  return (
    <main style={{ minHeight: '100vh', background: 'transparent', overflowX: 'hidden' }}>
      <Navbar />

      <HeroSection />
      <LiveTicker />
      <StatsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CTASection />
      <Footer />

      <style jsx global>{`
        body {
          background-color: #080f1c;
          color: #f8fafc;
        }
      `}</style>
    </main>
  );
}

function HeroSection() {
  return (
    <section id="hero-section" style={{
      position: 'relative',
      overflow: 'hidden',
      padding: '80px 0 100px',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '600px',
        background: 'radial-gradient(ellipse, rgba(0, 232, 122, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(ellipse, rgba(0, 180, 232, 0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <span className="badge badge--live">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
            World Cup 2026
          </span>
          <span className="badge badge--primary">Powered by TxODDS</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-shine-glow" style={{
          fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: 24,
          letterSpacing: '-0.01em',
        }}>
          <span style={{ display: 'block', fontSize: '1rem', color: '#ffd700', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>ファンタジーフットボール</span>
          <span className="white-text-shiny">Fantasy F</span>
          <span className="bounce-ball" style={{ display: 'inline-block', fontSize: '0.62em', verticalAlign: 'middle', lineHeight: 1, position: 'relative', top: '-0.01em' }}>⚽</span>
          <span className="white-text-shiny">otball</span>
          <br />
          <span className="meets-onchain-prizes-shiny">Meets On-Chain Prizes</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-secondary)',
          maxWidth: 600,
          margin: '0 auto 40px',
          lineHeight: 1.7,
        }}>
          Build your lineup. Pick your captain. Assign confidence ratings. Win SOL based on real World Cup player performances — powered by live TxODDS data.
        </p>

        {/* CTA Buttons */}
        <div className="hero-ctas">
          <Link href="/contests" className="btn-hero-play" id="hero-play-btn">
            🏆 Play Now
          </Link>
          <Link href="/how-it-works" className="btn-hero-learn" id="hero-learn-btn">
            How It Works
          </Link>
        </div>

        {/* Trust indicators */}
        <div style={{
          display: 'flex',
          gap: 32,
          justifyContent: 'center',
          marginTop: 48,
          flexWrap: 'wrap',
        }}>
          {[
            { icon: <span>⚡</span>, text: 'Live TxODDS Data' },
            { icon: <span>🔗</span>, text: 'On-Chain Prizes' },
            { icon: <span>🏆</span>, text: 'World Cup 2026' },
            { icon: (
                <svg viewBox="0 0 508.07 398.17" width="14" height="12" style={{ display: 'block' }}>
                  <defs>
                    <linearGradient id="solana-gradient-final" x1="463" y1="205.16" x2="182.39" y2="742.62" gradientTransform="translate(0 -198)" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#00ffa3"/>
                      <stop offset="1" stopColor="#dc1fff"/>
                    </linearGradient>
                  </defs>
                  <path fill="url(#solana-gradient-final)" d="M84.53,358.89A16.63,16.63,0,0,1,96.28,354H501.73a8.3,8.3,0,0,1,5.87,14.18l-80.09,80.09a16.61,16.61,0,0,1-11.75,4.86H10.31A8.31,8.31,0,0,1,4.43,439Z" transform="translate(-1.98 -55)"/>
                  <path fill="url(#solana-gradient-final)" d="M84.53,59.85A17.08,17.08,0,0,1,96.28,55H501.73a8.3,8.3,0,0,1,5.87,14.18l-80.09,80.09a16.61,16.61,0,0,1-11.75,4.86H10.31A8.31,8.31,0,0,1,4.43,140Z" transform="translate(-1.98 -55)"/>
                  <path fill="url(#solana-gradient-final)" d="M427.51,208.42a16.61,16.61,0,0,0-11.75-4.86H10.31a8.31,8.30,0,0,0-5.88,14.18l80.1,80.09a16.6,16.6,0,0,0,11.75,4.86H501.73a8.3,8.3,0,0,0,5.87-14.18Z" transform="translate(-1.98 -55)"/>
                </svg>
              ), text: 'Solana Verified' },
          ].map((item) => (
            <div key={item.text} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}>
              {item.icon}
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveTicker() {
  const { appMode, apiToken, isSubscribing, subscribeAndActivate, liveFixtures, allFixtures } = useTxLine();
  const [finishedScores, setFinishedScores] = useState<Record<string, { home: number; away: number }>>({});

  useEffect(() => {
    if (appMode === 'demo') return;
    fetch('/api/scores/wc2026')
      .then(r => r.json())
      .then((data: Record<string, { home: number; away: number }>) => {
        setFinishedScores(prev => ({ ...prev, ...data }));
      })
      .catch(() => {});
  }, [appMode]);

  const { connected } = useWallet();
  const demoLiveMatch = DEMO_FIXTURES.find((f) => f.status === 'live');
  
  const hasLiveTxLineData = liveFixtures && liveFixtures.length > 0;
  
  // Conditionally choose which match to display
  const isDemo = appMode === 'demo';
  const displayDemo = isDemo;
  
  if (isDemo && !demoLiveMatch) return null;
  if (!isDemo && !apiToken) {
    return (
      <div id="live-ticker-section" style={{ background: '#1a1008', borderTop: '1px solid rgba(255, 77, 109, 0.2)', borderBottom: '1px solid rgba(255, 77, 109, 0.2)', padding: '12px 0', color: '#f8fafc' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>LIVE MODE ACTIVE: Waiting for txLINE on-chain subscription...</span>
          <button className="btn btn--primary btn--sm" onClick={subscribeAndActivate} disabled={!connected || isSubscribing}>
            {isSubscribing ? 'Subscribing...' : (!connected ? 'Connect Wallet First' : 'Unlock txLINE Live Data')}
          </button>
        </div>
      </div>
    );
  }
  if (!isDemo && !hasLiveTxLineData) {
    // Check allFixtures for any in-progress match (GameState 2–8 = playing/HT/ET)
    const liveFromAll = (allFixtures || []).filter((f: any) => {
      const rawState = f.GameState ?? f.gameState ?? f.Status ?? f.status;
      const strState = typeof rawState === 'string' ? rawState.toLowerCase() : '';
      const intState = typeof rawState === 'number' ? rawState : null;
      return [2, 3, 4, 5, 6, 7, 8].includes(intState as number) ||
        ['inprogress', 'live', 'playing', 'firsthalf', 'halftime', 'secondhalf', 'extratime'].some(s => strState.includes(s));
    }).slice(0, 3);

    const finishedFixtures = (allFixtures || []).filter((f: any) => {
      const rawState = f.GameState ?? f.gameState ?? f.Status ?? f.status;
      const strState = typeof rawState === 'string' ? rawState.toLowerCase() : '';
      const intState = typeof rawState === 'number' ? rawState : null;
      return [9, 10, 11].includes(intState as number) || ['fulltime', 'finished', 'postgame', 'abandoned'].some(s => strState.includes(s));
    });
    
    // Sort by most recent start time and take 3
    const recentFinished = finishedFixtures
      .sort((a, b) => (b.startTime || b.StartTime || 0) - (a.startTime || a.StartTime || 0))
      .slice(0, 3);

    let displayFinished = recentFinished.length > 0 ? recentFinished.map(f => {
      const home = f.homeTeam?.name || f.HomeTeamName || 'Home';
      const away = f.awayTeam?.name || f.AwayTeamName || 'Away';
      const homeFlag = f.homeFlag || f.homeTeam?.flag || '';
      const awayFlag = f.awayFlag || f.awayTeam?.flag || '';
      const scoreHome = f.score?.home ?? f.Score?.Home ?? 0;
      const scoreAway = f.score?.away ?? f.Score?.Away ?? 0;
      return { home, away, homeFlag, awayFlag, scoreHome, scoreAway };
    }) : [];

    if (displayFinished.length === 0) {
      const scheduleFinished = WC2026_FIXTURES
        .filter(f => {
          if (getFixtureStatus(f) !== 'finished') return false;
          // Only show matches finished within the last 24 hours (1 hari)
          const kickoffMs = new Date(f.kickoffAt).getTime();
          const nowMs = Date.now();
          return nowMs - kickoffMs <= 24 * 60 * 60 * 1000;
        })
        .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime())
        .slice(0, 3);

      displayFinished = scheduleFinished.map(f => {
        let sh: string | number = '-';
        let sa: string | number = '-';

        if (finishedScores[f.fixtureId]) {
          sh = finishedScores[f.fixtureId].home;
          sa = finishedScores[f.fixtureId].away;
        } else {
          const af = (allFixtures || []).find((x: any) => String(x.FixtureId ?? x.fixtureId ?? x.id) === f.fixtureId);
          if (af) {
             const h = af.score?.home ?? af.Score?.Home ?? af.HomeScore ?? af.home_score;
             const a = af.score?.away ?? af.Score?.Away ?? af.AwayScore ?? af.away_score;
             if (h !== undefined) sh = Number(h);
             if (a !== undefined) sa = Number(a);
          }
        }

        return {
          home: f.homeTeam,
          away: f.awayTeam,
          homeFlag: f.homeFlag,
          awayFlag: f.awayFlag,
          scoreHome: sh,
          scoreAway: sa
        };
      });
    }

    return (
      <>
        {liveFromAll.length > 0 ? (
          <div style={{ background: 'rgba(0,20,10,0.85)', padding: '6px 0', borderBottom: '1px solid rgba(0,229,100,0.2)', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ color: '#00e564', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00e564', display: 'inline-block', boxShadow: '0 0 6px #00e564' }} />
                LIVE NOW
              </span>
              {liveFromAll.map((f: any, i: number) => {
                const home = f.homeTeam?.name || f.HomeTeamName || f.Participant1 || 'Home';
                const away = f.awayTeam?.name || f.AwayTeamName || f.Participant2 || 'Away';
                const homeFlag = f.homeFlag || f.homeTeam?.flag || '';
                const awayFlag = f.awayFlag || f.awayTeam?.flag || '';
                const sh = f.score?.home ?? f.Score?.Home ?? f.HomeScore ?? 0;
                const sa = f.score?.away ?? f.Score?.Away ?? f.AwayScore ?? 0;
                const clock = f.clock?.matchTime || f.Clock?.MatchTime || '';
                return (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,229,100,0.08)', border: '1px solid rgba(0,229,100,0.3)', borderRadius: 6, padding: '3px 10px', fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
                    <><FlagImage flag={homeFlag} size={16} /> {home}</> <span style={{ color: '#00e564', fontFamily: 'Bebas Neue, cursive', fontSize: '1rem' }}>{sh}–{sa}</span> <>{away} <FlagImage flag={awayFlag} size={16} /></>
                    {clock && <span style={{ color: '#00e564', fontSize: '0.75rem', marginLeft: 4 }}>{clock}'</span>}
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ background: 'rgba(26,16,8,0.5)', padding: '4px 0', borderBottom: '1px solid rgba(255, 77, 109, 0.05)', textAlign: 'center' }}>
            <span style={{ color: '#ff4d6d', fontSize: '0.8rem', fontWeight: 600, textShadow: '0 0 8px rgba(255, 77, 109, 0.5)', letterSpacing: '0.05em' }}>
              • LIVE txLINE: No matches currently in progress.
            </span>
          </div>
        )}

        {displayFinished.length > 0 && (
          <div id="live-ticker-section" style={{ 
            background: '#ffffff', 
            borderTop: '1px solid #e2e8f0', 
            borderBottom: '1px solid #e2e8f0', 
            padding: '6px 0', 
            color: '#0f172a', 
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <div className="container">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img 
                    src="/2026_FIFA_World_Cup_emblem.svg" 
                    alt="World Cup 2026" 
                    style={{ height: '36px', objectFit: 'contain' }} 
                  />
                  <span style={{ 
                    color: '#0f172a', 
                    fontSize: '0.85rem', 
                    fontWeight: 900, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.15em',
                  }}>
                    FIFA WORLD CUP 2026 - RECENTLY FINISHED:
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {displayFinished.map((match, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      background: 'rgba(0, 0, 0, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
                    }}>
                      <FlagImage flag={match.homeFlag} size={20} style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.2))' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', color: '#f8fafc' }}>{match.home}</span>
                      <span style={{ 
                        fontFamily: 'Bebas Neue, cursive', 
                        fontSize: '1.1rem', 
                        color: '#00e5ff', 
                        margin: '0 2px',
                        textShadow: '0 0 6px rgba(0, 229, 255, 0.6)'
                      }}>
                        {match.scoreHome} - {match.scoreAway}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', color: '#f8fafc' }}>{match.away}</span>
                      <FlagImage flag={match.awayFlag} size={20} style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.2))' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div id="live-ticker-section" style={{
      background: '#1a1008',
      borderTop: '1px solid rgba(255, 77, 109, 0.2)',
      borderBottom: '1px solid rgba(255, 77, 109, 0.2)',
      padding: '12px 0',
      color: '#f8fafc'
    }}>
      <div className="container">
        {isDemo ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className="badge badge--live">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                DEMO LIVE
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <FlagImage flag={demoLiveMatch?.homeFlag ?? ''} size={22} />
                <span style={{ fontWeight: 700 }}>{demoLiveMatch?.homeTeam}</span>
                <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.5rem', letterSpacing: '0.1em' }}>
                  {demoLiveMatch?.homeScore ?? 0} — {demoLiveMatch?.awayScore ?? 0}
                </span>
                <span style={{ fontWeight: 700 }}>{demoLiveMatch?.awayTeam}</span>
                <FlagImage flag={demoLiveMatch?.awayFlag ?? ''} size={22} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00e5ff', fontSize: '0.85rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 8px #00e5ff' }} />
              txLINE REAL-TIME DATA ACTIVE
            </div>
            {liveFixtures.slice(0, 2).map((fixture: any, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span className="badge badge--live" style={{ background: 'rgba(0, 229, 255, 0.2)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.5)' }}>LIVE</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <span style={{ fontWeight: 700 }}>{fixture.homeTeam?.name || 'Home'}</span>
                  <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.5rem', letterSpacing: '0.1em', color: '#00e5ff' }}>
                    {fixture.score?.home ?? 0} — {fixture.score?.away ?? 0}
                  </span>
                  <span style={{ fontWeight: 700 }}>{fixture.awayTeam?.name || 'Away'}</span>
                  <span style={{ fontSize: '0.8rem', color: '#00e5ff' }}>{fixture.clock?.matchTime || "00:00"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function StatsSection() {
  const stats = [
    { value: '48', label: 'Teams', sub: 'Qualified Nations' },
    { value: '104', label: 'Matches', sub: 'Total Tournament Games' },
    { value: '0.1 SOL', label: 'Entry Fee', sub: 'Low Entry Cost' },
    { value: '100%', label: 'Prizes', sub: 'Distributed On-Chain' },
  ];

  return (
    <section style={{ padding: '40px 0 80px' }}>
      <div style={{
        position: 'relative',
        padding: '54px 0',
        borderTop: '2px solid #ffd700',
        borderBottom: '2px solid #ffd700',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        {/* Background Image without blur */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundImage: 'url("/homepage.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 1,
          pointerEvents: 'none',
        }} />

        {/* Content wrapped in container so it aligns nicely with the rest of the page */}
        <div className="container" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Header inside the stats box */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
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
                Tournament Stats
              </span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 800, margin: 0, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              2026 World Cup by the Numbers
            </h2>
          </div>

          {/* Stats grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: 24 
          }}>
            {stats.map((stat) => (
              <div 
                key={stat.label} 
                style={{ 
                  background: 'rgba(10,13,18,0.3)', 
                  border: '1px solid rgba(255,215,0,0.25)', 
                  padding: '20px 24px', 
                  borderRadius: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
              >
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffd700', fontFamily: 'monospace', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Connect Wallet',
      desc: 'Connect your Phantom wallet to the Solana network to play.',
      icon: '👛',
      color: '#ffd700',
    },
    {
      step: '02',
      title: 'Build Your Lineup',
      desc: 'Pick 5 players (GK, DEF, MID, SWG, FWD) from the two competing teams. Swinger = wing player (LW/RW).',
      icon: '🧩',
      color: '#00e87a',
    },
    {
      step: '03',
      title: 'Select Captain & Confidence',
      desc: 'Choose your captain (2x multiplier) and rate your confidence per player (⭐1-5).',
      icon: '⭐',
      color: '#00e5ff',
    },
    {
      step: '04',
      title: 'Lock & Pay Entry',
      desc: 'Submit lineup before kickoff. Pay 0.1 SOL entry fee to the prize pool.',
      icon: '🔒',
      color: '#e056fd',
    },
    {
      step: '05',
      title: 'Watch Live & Earn Points',
      desc: 'Goals +10, Assists +6, Shot on Target +2, Saves +1, Cards -2, Own Goal -4. Watch your points update live!',
      icon: '📊',
      color: '#ff4d6d',
    },
    {
      step: '06',
      title: 'Win SOL Prizes',
      desc: 'Compete in 3 lobbies (Free, Degens, Whales). Prizes distributed on-chain.',
      icon: '🏆',
      color: '#ff8a00',
    },
  ];

  return (
    <section id="how-it-works-section" style={{ padding: '80px 0', background: 'transparent' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 12, color: '#ffd700', textShadow: '0 0 10px rgba(255,215,0,0.2)' }}>
            How OddsDraft Works
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
            From lineup to prize in 6 simple steps
          </p>
        </div>

        <div className="grid-three">
          {steps.map((step) => (
            <div 
              key={step.step} 
              id={`step-${step.step}`}
              className="ro-window"
              style={{
                background: 'rgba(251, 240, 185, 0.96)',
                border: '2px solid #5c4028',
                boxShadow: 'inset 0 0 12px rgba(92, 64, 40, 0.2), 0 0 0 2px #000000, 0 6px 16px rgba(0, 0, 0, 0.6)',
                color: '#36220f',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
            >
              <div 
                className="ro-window__header" 
                style={{ 
                  background: 'linear-gradient(to right, #b45309 0%, #78350f 100%)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '2px solid #5c4028'
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>STEP {step.step}</span>
                <span>{step.icon}</span>
              </div>
              
              <div className="ro-window__body" style={{ padding: '20px 24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 8, color: '#36220f' }}>
                  {step.title}
                </h3>
                <p style={{ color: '#5c4028', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                  {step.desc}
                </p>
              </div>

              <style jsx>{`
                .ro-window:hover {
                  transform: translateY(-4px);
                  border-color: #ffd700 !important;
                  box-shadow: inset 0 0 12px rgba(255, 215, 0, 0.3), 0 0 0 2px #ffd700, 0 10px 24px rgba(0, 0, 0, 0.8) !important;
                }
              `}</style>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: 'Live TxODDS Data',
      desc: 'Real-time match data from TxODDS — goals, cards, and events as they happen.',
      icon: '⚡',
      color: '#00e5ff',
      tag: 'SYS_LIVE'
    },
    {
      title: 'Confidence Rating System',
      desc: 'Rate your confidence per player ⭐1-5. Higher confidence = bigger bonus or penalty.',
      icon: '🎯',
      color: '#ffd700',
      tag: 'SYS_CONF'
    },
    {
      title: 'On-Chain Prize Distribution',
      desc: 'Prize outcomes recorded on Solana. Transparent, automated, and verifiable at match end.',
      icon: '🔗',
      color: '#00e87a',
      tag: 'SYS_SOL'
    },
    {
      title: 'Multi-Contest',
      desc: 'Join multiple contests simultaneously. Build different lineups for each match.',
      icon: '🏟️',
      color: '#ff4d6d',
      tag: 'SYS_CONTEST'
    },
    {
      title: 'Real-Time Leaderboard',
      desc: 'Watch rankings update live as match events happen. See your rank change in real-time.',
      icon: '📈',
      color: '#a855f7',
      tag: 'SYS_LEADER'
    },
    {
      title: 'AI Recommendations',
      desc: 'Rule-based AI picks: Captain Suggestion, Safe Pick, High Risk, and Undervalued players.',
      icon: '🤖',
      color: '#e2e8f0',
      tag: 'SYS_AI'
    },
    {
      title: 'Telegram Notifications',
      desc: 'Get live alerts for match events and points. Just subscribe to @oddsdraftbot!',
      icon: '📱',
      color: '#0088cc',
      tag: 'SYS_BOT'
    },
    {
      title: 'Collectible Skill Cards',
      desc: 'Gather unique collectible cards to boost your points and gain an edge in contests.',
      icon: '🃏',
      color: '#fbbf24',
      tag: 'SYS_CARDS'
    },
    {
      title: 'Card Marketplace (Coming Soon)',
      desc: 'Trade and sell your rare Skill Cards to other players in the open marketplace.',
      icon: '🏪',
      color: '#10b981',
      tag: 'SYS_MARKET'
    }
  ];

  return (
    <section id="features-section" style={{ padding: '0 0 80px', background: 'transparent' }}>
      {/* Why OddsDraft header box — footer.webp as background image */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        borderTop: '2px solid #ffd700',
        borderBottom: '2px solid #ffd700',
        marginBottom: 60,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url("/footer.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          pointerEvents: 'none',
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '60px 24px' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 12, color: '#ffd700', textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.5)' }}>
            Why OddsDraft?
          </h2>
          <p style={{ color: '#ffffff', maxWidth: 500, margin: '0 auto', fontSize: '1.05rem', fontWeight: 600, textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
            The only fantasy platform built on live football data + on-chain rewards
          </p>
        </div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="grid-three">
          {features.map((feature, idx) => {
            const card = (
              <div
                id={`feature-${idx}`}
                className="features-gaming-card"
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  borderRadius: '8px',
                  padding: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}
              >
                {/* Card Header Border Glow Accent */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '60px',
                  height: '3px',
                  background: feature.color,
                  boxShadow: `0 0 8px ${feature.color}`
                }} />

                {/* Tag/Index System Indicator */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#64748b', letterSpacing: '0.1em' }}>
                    {feature.tag} // 0{idx + 1}
                  </span>
                  <span style={{
                    fontSize: '1.25rem',
                    padding: '6px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>{feature.icon}</span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10, color: '#f8fafc' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                  {feature.desc}
                </p>

                {/* Hover effect styles */}
                <style jsx>{`
                  .features-gaming-card:hover {
                    transform: translateY(-5px);
                    border-color: ${feature.color}55 !important;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.6), 0 0 20px ${feature.color}15 !important;
                    background: rgba(15, 23, 42, 0.85) !important;
                  }
                `}</style>
              </div>
            );
            return (feature as { link?: string }).link ? (
              <a key={feature.title} href={(feature as { link?: string }).link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                {card}
              </a>
            ) : (
              <div key={feature.title}>{card}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const { appMode } = useTxLine();
  
  return (
    <section id="cta-section" style={{ padding: '100px 0' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="ro-window" style={{
          maxWidth: 700,
          margin: '0 auto',
        }}>
          <div className="ro-window__header">
            <span>System // Ready to Play</span>
            <span>🎮</span>
          </div>
          <div className="ro-window__body" style={{ padding: '48px 32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 16 }}>
              Ready to Play?
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1.05rem',
              lineHeight: 1.7,
              marginBottom: 32,
            }}>
              World Cup 2026 is happening now. Join a contest, build your lineup, and compete for SOL prizes using live match data.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/contests" className="btn btn--primary btn--lg" id="cta-join-btn">
                🏆 Join a Contest
              </Link>
              {appMode === 'demo' && (
                <a
                  href="https://faucet.solana.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--secondary btn--lg"
                  id="cta-airdrop-btn"
                >
                  💧 Get Testnet SOL
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



function Footer() {
  return (
    <footer style={{
      position: 'relative',
      color: '#fff',
      overflow: 'hidden',
      background: '#030810',
    }}>
      {/* Top accent bar */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, transparent 0%, #29b6f6 20%, #ffd700 50%, #29b6f6 80%, transparent 100%)', boxShadow: '0 0 18px rgba(41,182,246,0.5)' }} />

      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(41,182,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(41,182,246,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      {/* Glow radial */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(41,182,246,0.06) 0%, transparent 70%)',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 2, padding: '48px 24px 36px' }}>
        {/* Main row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 32 }}>

          {/* Logo + tagline */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#030810', borderRadius: 8, padding: '6px 12px', border: '1px solid rgba(41,182,246,0.2)', marginBottom: 10, width: 'fit-content' }}>
              <img
                src="/2026_FIFA_World_Cup_emblem.svg"
                alt="World Cup 26 Logo"
                style={{ height: '40px', objectFit: 'contain', display: 'block' }}
              />
              <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)' }} />
              <img
                src="/logo_oddsdraft.svg"
                alt="OddsDraft Logo"
                style={{ height: '30px', objectFit: 'contain', display: 'block' }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5, maxWidth: 240 }}>
              Fantasy Football.<br />On-chain. Real-time. World Cup '26.
            </p>
          </div>

          {/* Center — power stats */}
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
            {[
              { label: 'DATA SOURCE', value: 'TxODDS', sub: 'Live Football API' },
              { label: 'BLOCKCHAIN', value: 'SOLANA', sub: 'Ultra-fast L1' },
              { label: 'TOURNAMENT', value: 'WC 2026', sub: 'USA · CAN · MEX' },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: '0.55rem', color: '#29b6f6', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#ffd700', letterSpacing: '0.05em', fontFamily: 'Bebas Neue, cursive', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Right — links */}
          <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', maxWidth: 140 }}>
              <div style={{ fontSize: '0.55rem', color: '#29b6f6', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 10 }}>CONNECT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="https://t.me/OddsDraftBot" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#29b6f6')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.02 9.522c-.149.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 14.376l-2.95-.924c-.642-.2-.654-.642.136-.95l11.52-4.44c.535-.194 1.003.13.976.186z"/></svg>
                Telegram
              </a>
              <a href="https://x.com/chainvolio" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#1DA1F2')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                @ChainVolio
              </a>
              <a href="https://txline-docs.txodds.com" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ffd700')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/></svg>
                TxODDS Docs
              </a>
            </div>
            </div>
          </div>
        </div>

        {/* Bottom divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(41,182,246,0.2), rgba(255,215,0,0.2), rgba(41,182,246,0.2), transparent)', marginBottom: 20 }} />

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em', lineHeight: 1.6 }}>
            © 2026 OddsDraft · All rights reserved <br />
            Created by <span style={{ color: '#fff', fontWeight: 600 }}>Sandhy Warhol</span>, creator of <span style={{ color: '#00e5ff', fontWeight: 600 }}>ChainVolio</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {['BETA', 'SOLANA', 'WC26'].map(tag => (
              <span key={tag} style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', padding: '2px 6px', border: '1px solid rgba(41,182,246,0.2)', borderRadius: 2, color: 'rgba(41,182,246,0.5)' }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)' }} />
    </footer>
  );
}
