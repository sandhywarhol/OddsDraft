'use client';

import { useState, useEffect, use } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { DEMO_FIXTURES, type Player, getPlayersByTeam } from '@/lib/players';
import { type LineupPlayer, MAX_PLAYERS } from '@/types';
import { calculateFantasyPoints } from '@/lib/fantasy-engine';
import { formatDistanceToNow } from 'date-fns';
import { useTxLine } from '@/context/TxLineContext';
// Demo score events for showing fantasy points in action
const DEMO_EVENTS = [
  { playerId: 'fra-mbappe', playerName: 'Mbappé', eventType: 'goal', minute: 23, points: 10 },
  { playerId: 'arg-messi', playerName: 'Messi', eventType: 'assist', minute: 23, points: 6 },
  { playerId: 'arg-martinez', playerName: 'E. Martínez', eventType: 'goalkeeper_save', minute: 35, points: 1 },
  { playerId: 'fra-griezmann', playerName: 'Griezmann', eventType: 'yellow_card', minute: 41, points: -2 },
  { playerId: 'arg-lautaro', playerName: 'L. Martínez', eventType: 'goal', minute: 57, points: 10 },
  { playerId: 'fra-mbappe', playerName: 'Mbappé', eventType: 'goal', minute: 78, points: 10 },
];

const SLOTS = [
  { label: 'GK', filter: 'GK' },
  { label: 'DEF (CB/LB/RB)', filter: 'DEF' },
  { label: 'MID (CMF/AMF)', filter: 'MID' },
  { label: 'FLEX DEF', filter: 'DEF' },
  { label: 'FWD (CF/SS/RW)', filter: 'ATT' },
];

const getPositionColor = (label: string) => {
  if (label.includes('GK')) return '#1d4ed8'; // Blue
  if (label.includes('DEF (CB')) return '#15803d'; // Green
  if (label.includes('MID')) return '#b45309'; // Amber/Orange
  if (label.includes('FLEX')) return '#6d28d9'; // Purple
  if (label.includes('FWD')) return '#b91c1c'; // Red
  return '#36220f';
};

const TEAM_FLAG_CODES: Record<string, string> = {
  'Brazil': 'br',
  'Argentina': 'ar',
  'France': 'fr',
  'England': 'gb',
  'Portugal': 'pt',
  'Spain': 'es',
  'Germany': 'de',
};

const getPositionDescription = (label: string) => {
  switch (label) {
    case 'GK': return 'Goalkeeper';
    case 'CB': return 'Center Back';
    case 'MF': return 'Midfielder';
    case 'SW': return 'Sweeper';
    case 'CF': return 'Center Forward';
    default: return '';
  }
};

export default function LineupBuilderPage({ params, searchParams }: { params: Promise<{ contestId: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { contestId } = use(params);
  const searchParamsObj = use(searchParams);
  const contestType = (searchParamsObj.contestType as string) || 'top3';
  const { appMode, liveFixtures, allFixtures } = useTxLine();
  
  const isDemo = appMode === 'demo';

  // Find fixture
  let fixture = DEMO_FIXTURES.find((f) => f.fixtureId === contestId);
  if (!isDemo && allFixtures) {
    const rawFixture = allFixtures.find((f: any) => f.id === contestId || f.fixtureId === contestId || f._id === contestId);
    if (rawFixture) {
      fixture = {
        fixtureId: rawFixture.id || rawFixture.fixtureId || rawFixture._id || contestId,
        kickoffAt: rawFixture.kickoff_time || rawFixture.date || rawFixture.kickoffAt || new Date().toISOString(),
        homeTeam: rawFixture.homeTeam?.name || rawFixture.home_team?.name || rawFixture.homeTeam || 'Home',
        homeFlag: rawFixture.homeTeam?.code ? '🏳️' : '🏳️',
        awayTeam: rawFixture.awayTeam?.name || rawFixture.away_team?.name || rawFixture.awayTeam || 'Away',
        awayFlag: rawFixture.awayTeam?.code ? '🏳️' : '🏳️',
        status: rawFixture.status || 'upcoming',
      };
    }
  }
  // Fallback
  if (!fixture) fixture = DEMO_FIXTURES[0];

  const isTxLineLive = !isDemo && liveFixtures?.some(f => 
    f.homeTeam?.name === fixture.homeTeam || f.awayTeam?.name === fixture.awayTeam
  );
  const kickoffTime = new Date(fixture.kickoffAt);
  const isPastKickoff = !isDemo && Date.now() > kickoffTime.getTime();
  const isLocked = !isDemo && (isTxLineLive || isPastKickoff || fixture.status === 'finished');

  const [lineup, setLineup] = useState<(LineupPlayer | null)[]>([null, null, null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [captain, setCaptain] = useState<string>('');
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [playerSearch, setPlayerSearch] = useState('');
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [tutorialStep, setTutorialStep] = useState(0);
  const [zoomedElementId, setZoomedElementId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [wrapperTransform, setWrapperTransform] = useState('none');
  const [transformOrigin, setTransformOrigin] = useState('center center');

  const customSmoothScroll = (element: HTMLElement, duration = 800) => {
    const targetY = element.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35 + element.offsetHeight / 2;
    const startY = window.scrollY;
    const distance = targetY - startY;
    let startTime: number | null = null;

    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenLineupTutorial');
    if (!hasSeenTutorial) {
      setTutorialStep(1);
    }
  }, []);

  const handleNextTutorialStep = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransitioning) return;
    
    if (zoomedElementId) {
      const prevEl = document.getElementById(zoomedElementId);
      if (prevEl) {
        prevEl.style.position = '';
        prevEl.style.zIndex = '';
        prevEl.style.transition = '';
        prevEl.style.transform = '';
        prevEl.style.background = '';
        prevEl.style.pointerEvents = '';
        prevEl.style.boxShadow = '';
        prevEl.style.maxWidth = '';
      }
    }

    if (tutorialStep < 6) {
      const nextStep = tutorialStep + 1;
      const nextData = getTutorialData(nextStep);
      const targetId = nextData?.targetId;
      
      setZoomedElementId(null);
      
      if (targetId) {
        setIsTransitioning(true);
        setTransformOrigin(`center ${window.scrollY + window.innerHeight / 2}px`);
        
        setWrapperTransform('scale(1)');
        setTimeout(() => {
           setWrapperTransform('scale(0.94)');
        }, 20);
        
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            customSmoothScroll(element, 700);
            setTutorialStep(nextStep);
            
            setTimeout(() => {
              setWrapperTransform('scale(1)');
              
              setTimeout(() => {
                setWrapperTransform('none');
                setIsTransitioning(false);
                
                const rect = element.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const currentCenterX = rect.left + rect.width / 2;
                
                const targetCenterX = nextData?.position === 'left' ? viewportWidth * 0.78 : viewportWidth * 0.22;
                let shift = targetCenterX - currentCenterX;
                
                const padding = 24;
                if (rect.left + shift < padding) shift = padding - rect.left;
                if (rect.right + shift > viewportWidth - padding) shift = viewportWidth - padding - rect.right;
                
                element.style.position = 'relative';
                element.style.zIndex = '99999';
                element.style.transition = 'transform 0.5s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.5s ease';
                element.style.background = 'rgba(8, 15, 28, 1)';
                element.style.borderRadius = '16px';
                element.style.pointerEvents = 'none';
                if (targetId === 'recruitment-terminal' || targetId === 'confidence-panel' || targetId === 'submit-button') {
                  element.style.maxWidth = '560px';
                }
                
                void element.offsetWidth; // Force reflow
                
                let translateY = -50;
                if (targetId === 'submit-button') {
                  translateY = -230;
                } else if (targetId === 'confidence-panel') {
                  translateY = -120;
                } else if (targetId === 'lineup-grid' && nextStep === 4) {
                  translateY = -140;
                } else if (targetId === 'lineup-grid' && nextStep === 2) {
                  translateY = -35;
                }
                
                element.style.transform = `translate(${shift}px, ${translateY}px) scale(1.02)`;
                element.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.85), 0 0 40px rgba(255,255,255,0.2)';
                
                setZoomedElementId(targetId);
              }, 400); // wait for zoom in
            }, 750); // wait for scroll
          } else {
            setWrapperTransform('none');
            setIsTransitioning(false);
            setTutorialStep(nextStep);
          }
        }, 400); // wait for zoom out
      } else {
        setTutorialStep(nextStep);
      }
    } else {
      localStorage.setItem('hasSeenLineupTutorial', 'true');
      setTutorialStep(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Reset demo lineup
      setLineup([null, null, null, null, null]);
      setCaptain('');
      setConfidence({});
    }
  };

  useEffect(() => {
    if (tutorialStep === 4) {
      const team = fixture.homeTeam;
      const allPlayers = getPlayersByTeam(team);
      const gk = allPlayers.find(p => p.position === 'GK');
      const cb = allPlayers.find(p => p.position === 'DEF');
      const mf = allPlayers.find(p => p.position === 'MID');
      const sw = allPlayers.filter(p => p.position === 'DEF')[1] || allPlayers.find(p => p.position === 'DEF');
      const cf = allPlayers.find(p => p.position === 'ATT');
      
      if (gk && cb && mf && sw && cf) {
        setLineup([
          { id: gk.id, name: gk.name, position: gk.position, team: gk.team, teamFlag: gk.teamFlag, rating: gk.rating },
          { id: cb.id, name: cb.name, position: cb.position, team: cb.team, teamFlag: cb.teamFlag, rating: cb.rating },
          { id: mf.id, name: mf.name, position: mf.position, team: mf.team, teamFlag: mf.teamFlag, rating: mf.rating },
          { id: sw.id, name: sw.name, position: sw.position, team: sw.team, teamFlag: sw.teamFlag, rating: sw.rating },
          { id: cf.id, name: cf.name, position: cf.position, team: cf.team, teamFlag: cf.teamFlag, rating: cf.rating },
        ]);
        setCaptain(mf.id);
        setConfidence({ [gk.id]: 2, [cb.id]: 3, [mf.id]: 4, [sw.id]: 3, [cf.id]: 5 });
      }
    }
  }, [tutorialStep, fixture]);

  const tutorialData = getTutorialData(tutorialStep);

  const filledPlayers = lineup.filter((p): p is LineupPlayer => p !== null);
  const totalPlayers = filledPlayers.length;
  const isLineupFull = totalPlayers === MAX_PLAYERS;

  // Get available players for the currently active slot
  const teamName = activeTeam === 'home' ? fixture.homeTeam : fixture.awayTeam;
  const availablePlayers = getPlayersByTeam(teamName)
    .filter((p) => {
      // Must match slot filter
      if (activeSlot !== null && p.position !== SLOTS[activeSlot].filter) return false;
      // Exclude already selected
      return !filledPlayers.find((lp) => lp.id === p.id);
    })
    .filter((p) => !playerSearch || p.name.toLowerCase().includes(playerSearch.toLowerCase()));

  // Calculate current fantasy points (demo events)
  const fantasyPoints = isLineupFull && captain
    ? calculateFantasyPoints(
        DEMO_EVENTS.map((e) => ({ playerId: e.playerId, playerName: e.playerName, eventType: e.eventType })),
        {
          players: filledPlayers,
          captainPlayerId: captain,
          confidence,
        }
      )
    : null;

  const addPlayer = (player: Player) => {
    if (activeSlot === null) return;

    const lp: LineupPlayer = {
      id: player.id,
      name: player.name,
      position: player.position,
      team: player.team,
      teamFlag: player.teamFlag,
      rating: player.rating,
    };

    setLineup((prev) => {
      const next = [...prev];
      next[activeSlot] = lp;
      return next;
    });

    // Auto set confidence to 3
    setConfidence((prev) => ({ ...prev, [player.id]: 3 }));
    setPlayerSearch('');
    setActiveSlot(null);
  };

  const removePlayer = (index: number) => {
    const player = lineup[index];
    if (!player) return;

    setLineup((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });

    if (captain === player.id) setCaptain('');
    setConfidence((prev) => {
      const next = { ...prev };
      delete next[player.id];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!isLineupFull || !captain) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500)); // simulate tx
    setSubmitted(true);
    setSubmitting(false);
  };

  const timeToKickoff = formatDistanceToNow(kickoffTime, { addSuffix: true });

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 24, padding: '0 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Lineup Submitted!</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
            Your 5-player lineup is locked in. Watch the live match to see your fantasy points update in real-time!
          </p>
          <div className="card" style={{ padding: 24, display: 'flex', gap: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '2rem', color: 'var(--color-primary)' }}>
                {MAX_PLAYERS}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Players</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '2rem', color: 'var(--color-accent)' }}>
                {captain ? filledPlayers.find(p => p.id === captain)?.name.split(' ').pop() : '-'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Captain</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '2rem', color: 'var(--text-primary)' }}>
                0.1
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SOL Paid</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href={`/live/${fixture.fixtureId}?contestType=${contestType}`} className="btn btn--primary btn--lg">
              🔴 Watch Live
            </Link>
            <Link href="/contests" className="btn btn--secondary btn--lg">
              Back to Contests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px', background: 'transparent', overflowX: 'hidden' }}>
      <Navbar />

      <div style={{
        transform: wrapperTransform,
        transition: wrapperTransform === 'none' ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transformOrigin: transformOrigin,
        willChange: wrapperTransform === 'none' ? 'auto' : 'transform'
      }}>
        <style jsx global>{`
          @keyframes dialog-glow {
            0% { box-shadow: 10px 10px 0px #1a1008; }
            50% { box-shadow: 10px 10px 0px #1a1008, 0 0 25px rgba(251, 240, 185, 0.45); }
            100% { box-shadow: 10px 10px 0px #1a1008; }
          }
          @keyframes blink-text {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
          }
        `}</style>

        {/* Background Blur Overlay */}
        {tutorialStep > 0 && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 9990, 
            pointerEvents: 'none',
            opacity: isTransitioning ? 0 : 1,
            transition: 'opacity 0.4s ease',
          }} />
        )}

        {/* Onboarding Tutorial Popup */}
        {tutorialStep > 0 && tutorialData && (
          <div 
            onClick={handleNextTutorialStep}
            style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'transparent',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}>
            {/* NPC Character Image (Female - Left) */}
            <img
              src="/NPC/NPC Guide Female.svg"
              alt="Guide"
              style={{
                position: 'absolute',
                bottom: '-25vh',
                left: tutorialData?.shiftEdge ? '-18%' : '2%',
                height: '105vh',
                objectFit: 'contain',
                zIndex: 10005,
                transition: 'opacity 0.4s ease-out, transform 0.4s ease-out, left 0.4s ease-out',
                opacity: tutorialData?.position === 'left' ? 1 : 0,
                transform: tutorialData?.position === 'left' ? 'translateX(0)' : 'translateX(-50px)',
                pointerEvents: 'none',
                filter: 'drop-shadow(3px 0px 0px white) drop-shadow(0px 3px 0px white) drop-shadow(-3px 0px 0px white) drop-shadow(0px -3px 0px white)',
              }}
            />

            {/* NPC Character Image (Male - Right) */}
            <img
              src="/NPC/NPC Guide Male.svg"
              alt="Guide"
              style={{
                position: 'absolute',
                bottom: '-25vh',
                right: tutorialData?.shiftEdge ? '-18%' : '2%',
                height: '105vh',
                objectFit: 'contain',
                zIndex: 10005,
                transition: 'opacity 0.4s ease-out, transform 0.4s ease-out, right 0.4s ease-out',
                opacity: tutorialData?.position === 'right' ? 1 : 0,
                transform: tutorialData?.position === 'right' ? 'translateX(0)' : 'translateX(50px)',
                pointerEvents: 'none',
                filter: 'drop-shadow(3px 0px 0px white) drop-shadow(0px 3px 0px white) drop-shadow(-3px 0px 0px white) drop-shadow(0px -3px 0px white)',
              }}
            />

            {/* Dialog Bubble */}
            <div 
              style={{
                width: '94%',
                maxWidth: '920px',
                background: '#fcf8eb',
                border: '5px solid #1a1008',
                borderRadius: '0px',
                padding: '36px 48px',
                boxShadow: '10px 10px 0px #1a1008',
                position: 'absolute',
                bottom: '5vh',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000010,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                animation: 'dialog-glow 3s infinite',
              }}
            >
              <div style={{
                display: 'inline-block',
                background: '#1a1008',
                color: '#fcf8eb',
                padding: '4px 16px',
                fontWeight: 900,
                fontSize: '1rem',
                letterSpacing: '0.1em',
                marginBottom: '16px',
                alignSelf: 'flex-start',
                textTransform: 'uppercase',
              }}>
                {tutorialData.speakerTitle}
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
              }}>
                <div style={{
                  fontSize: '1.45rem',
                  lineHeight: 1.5,
                  color: '#1a1008',
                  fontWeight: 700,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {tutorialData.text}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12 }}>
                <div style={{ 
                  color: 'rgba(26,16,8,0.5)', 
                  fontSize: '0.9rem', 
                  fontWeight: 800, 
                  textTransform: 'uppercase',
                  animation: 'blink-text 1.5s infinite',
                  letterSpacing: '0.05em'
                }}>
                  Click anywhere to continue 
                  <span style={{ marginLeft: 8 }}>({tutorialStep}/6)</span>
                </div>
              </div>
              
            </div>
          </div>
        )}
        
        <main style={{ padding: '32px 0 80px' }}>
          <div className="container">
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <Link href="/contests" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                ← Back to Contests
              </Link>
              <div id="lineup-header" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                  {fixture.homeFlag} {fixture.homeTeam} vs {fixture.awayTeam} {fixture.awayFlag}
                </h1>
                <span className="badge badge--upcoming">Kickoff {timeToKickoff}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                Pick your 5-a-side lineup (GK, DEF, MID, DEF, ATT) • Select a captain (2× pts) • Set confidence
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {isLocked && (
                <div className="card" style={{ padding: '24px', textAlign: 'center', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.3)' }}>
                  <h2 style={{ color: '#ff4444', marginBottom: '8px', fontSize: '1.4rem' }}>⚠️ Match is Live (Locked)</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>You cannot build a lineup for a match that has already started. You can only watch the live stats.</p>
                  <Link href={`/live/${fixture.fixtureId}`} className="btn btn--primary" style={{ marginTop: '16px', display: 'inline-block' }}>
                    🔴 Go to Live Tracker
                  </Link>
                </div>
              )}

              {/* TOP: Fantasy Points Preview & Player Cards (Full Width) */}
              <div style={{ opacity: isLocked ? 0.5 : 1, pointerEvents: isLocked ? 'none' : 'auto' }}>
                {/* Fantasy Points Preview (if lineup filled) */}
                {fantasyPoints && (
                  <div className="card card--primary" style={{ marginBottom: 24, padding: 20 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Demo Fantasy Points Preview
                    </div>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '3rem', color: 'var(--color-primary)', lineHeight: 1 }}>
                          {fantasyPoints.totalPoints}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Points</div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{fantasyPoints.breakdown.base}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Base</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>+{fantasyPoints.breakdown.captainBonus}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Captain Bonus</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>+{fantasyPoints.breakdown.confidenceBonus.toFixed(1)}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Confidence Bonus</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                      ⚡ Based on demo World Cup match events
                    </div>
                  </div>
                )}

                {/* 5-Player Horizontal Grid (Centered & Enlarged) */}
                <div id="lineup-grid" style={{ 
                  display: 'flex', 
                  gap: 12, 
                  width: '100%',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}>
                  {lineup.map((player, i) => {
                    const slotConfig = SLOTS[i];
                    const isActive = activeSlot === i;
                    
                    return (
                      <div 
                        key={i}
                        onClick={() => {
                          if (player) {
                            setCaptain(player.id);
                          } else {
                            setActiveSlot(isActive ? null : i);
                          }
                        }}
                        style={{
                          flex: '1 1 0px',
                          maxWidth: 220,
                          aspectRatio: '120/165',
                          backgroundImage: player ? "url('/Player%20Card%20(2).svg')" : 'none',
                          backgroundSize: '100% 100%',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          backgroundColor: player ? 'transparent' : (isActive ? 'rgba(123, 162, 199, 0.15)' : 'rgba(255,255,255,0.01)'),
                          border: player 
                            ? 'none'
                            : `${isActive ? '2px solid #ffd700' : '1.5px dashed rgba(255, 255, 255, 0.25)'}`,
                          borderRadius: '0px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 200ms',
                          boxShadow: player 
                            ? (captain === player.id 
                                ? '0px 0px 12px #ffd700' 
                                : '2px 2px 6px rgba(0,0,0,0.4)')
                            : (isActive ? '0px 0px 8px rgba(255, 215, 0, 0.3)' : 'none'),
                        }}
                      >
                        {player ? (
                          <>
                            {/* Score / Rating inside the designated 'スコア' shield */}
                            <div style={{
                              position: 'absolute',
                              top: '22.5%',
                              right: '10.5%',
                              width: '18%',
                              textAlign: 'center',
                              color: player.rating && player.rating >= 90
                                ? '#ca8a04' // JRPG Gold
                                : (player.rating && player.rating >= 85 ? '#15803d' : '#1e293b'), // Green / Charcoal (no red/brown)
                              fontFamily: 'Inter, sans-serif',
                              fontStyle: 'normal',
                              fontSize: 'clamp(0.9rem, 2.2vw, 1.4rem)',
                              fontWeight: 800,
                              lineHeight: 1,
                              zIndex: 2,
                              textShadow: player.rating && player.rating >= 90
                                ? '0px 1px 2px rgba(202, 138, 4, 0.4)'
                                : (player.rating && player.rating >= 85 ? '0px 1px 1px rgba(0, 0, 0, 0.15)' : 'none'),
                            }}>
                              {player.rating ?? '-'}
                            </div>

                            {/* Nama Pemain (Nama) row */}
                            <div style={{ 
                              position: 'absolute',
                              top: '67.2%',
                              left: '38%',
                              width: '52%',
                              textAlign: 'left',
                              color: '#36220f',
                              fontSize: player.name.length > 15
                                ? 'clamp(0.46rem, 1vw, 0.58rem)'
                                : (player.name.length > 10
                                  ? 'clamp(0.5rem, 1.15vw, 0.65rem)'
                                  : 'clamp(0.55rem, 1.25vw, 0.72rem)'),
                              fontWeight: 700,
                              fontFamily: 'Inter, sans-serif',
                              fontStyle: 'normal',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              zIndex: 2,
                            }}>
                              {player.name}
                            </div>

                            {/* Negara (Flag & Name) (国籍) row */}
                            <div style={{ 
                              position: 'absolute',
                              top: '75.5%',
                              left: '38%',
                              width: '52%',
                              textAlign: 'left',
                              color: '#36220f',
                              fontSize: 'clamp(0.55rem, 1.3vw, 0.75rem)',
                              fontWeight: 700,
                              fontFamily: 'Inter, sans-serif',
                              fontStyle: 'normal',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              zIndex: 2,
                            }}>
                              <span>{player.team}</span>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#ffffff',
                                border: '1px solid #36220f',
                                borderRadius: '0px',
                                width: '18px',
                                height: '13px',
                                overflow: 'hidden',
                                boxShadow: '1px 1px 0px #36220f',
                                lineHeight: 1,
                                transform: 'translateY(-1px)',
                              }}>
                                {TEAM_FLAG_CODES[player.team] ? (
                                  <img
                                    src={`https://flagcdn.com/w40/${TEAM_FLAG_CODES[player.team]}.png`}
                                    alt={player.team}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                  />
                                ) : (
                                  <span style={{
                                    display: 'inline-block',
                                    transform: 'scale(1.5)',
                                    transformOrigin: 'center',
                                    lineHeight: 1,
                                  }}>
                                    {player.teamFlag}
                                  </span>
                                )}
                              </span>
                            </div>

                            {/* Posisi (ポジション) row */}
                            <div style={{ 
                              position: 'absolute',
                              top: '85.5%',
                              left: '42%',
                              width: '54%',
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}>
                              <span style={{
                                color: '#36220f',
                                fontSize: getPositionDescription(slotConfig.label).length > 10
                                  ? 'clamp(0.32rem, 0.7vw, 0.42rem)'
                                  : 'clamp(0.36rem, 0.8vw, 0.48rem)',
                                fontWeight: 800,
                                fontFamily: 'Inter, sans-serif',
                                fontStyle: 'normal',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                opacity: 0.85,
                              }} title={getPositionDescription(slotConfig.label)}>
                                {getPositionDescription(slotConfig.label)}
                              </span>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: getPositionColor(slotConfig.label),
                                color: '#ffffff',
                                border: '1.5px solid #36220f',
                                borderRadius: '0px',
                                padding: '1px 4px',
                                fontSize: 'clamp(0.48rem, 1vw, 0.6rem)',
                                fontWeight: 900,
                                fontFamily: 'Inter, sans-serif',
                                fontStyle: 'normal',
                                textTransform: 'uppercase',
                                boxShadow: '1px 1px 0px #36220f',
                                lineHeight: 1,
                                whiteSpace: 'nowrap',
                              }}>
                                {slotConfig.label}
                              </span>
                            </div>

                            {/* Captain Tag */}
                            {captain === player.id && (
                               <div style={{
                                 position: 'absolute',
                                 top: '-8%',
                                 left: '50%',
                                 transform: 'translateX(-50%)',
                                 background: 'linear-gradient(to bottom, #d32f2f 0%, #8b1e1e 100%)',
                                 border: '2px solid #ffffff',
                                 padding: '2px 6px',
                                 borderRadius: '0px',
                                 fontWeight: 700,
                                 fontFamily: 'Inter, -apple-system, sans-serif',
                                 fontStyle: 'normal',
                                 fontSize: 'clamp(0.55rem, 1.4vw, 0.8rem)',
                                 color: '#fff',
                                 textShadow: '0px 1px 1px rgba(0, 0, 0, 0.5)',
                                 boxShadow: '0 0 0 1px #000000, 1px 2px 4px rgba(0,0,0,0.30)',
                                 zIndex: 10,
                               }}>CAPTAIN</div>
                             )}

                            {/* Close / Remove button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); removePlayer(i); }}
                              style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '0px',
                                background: '#ea6b6b',
                                color: '#ffffff',
                                border: '2px solid #36220f',
                                boxShadow: '1px 1px 0px #36220f',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: '12px',
                                zIndex: 10,
                              }}
                            >×</button>
                          </>
                        ) : (
                          <>
                            <div style={{ opacity: isActive ? 1 : 0.3, fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', color: isActive ? '#ffd700' : 'inherit', fontWeight: 900 }}>+</div>
                            <div style={{ 
                              marginTop: 4, 
                              fontSize: 'clamp(0.75rem, 1.6vw, 0.95rem)', 
                              fontWeight: 800, 
                              fontFamily: 'Bebas Neue, cursive',
                              fontStyle: 'italic',
                            }}>
                              {slotConfig.label}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>


              {/* BOTTOM: Stacked Content below player cards */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 24, 
                maxWidth: 800, 
                margin: '0 auto', 
                width: '100%' 
              }}>
                {/* Progress */}
                <div className="ro-window" id="progress-bar">
                  <div className="ro-window__header">
                    <span>Lineup Build Progress</span>
                    <span>{totalPlayers}/{MAX_PLAYERS} Slots</span>
                  </div>
                  <div className="ro-window__body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: '700' }}>
                      <span>LINEUP EXP</span>
                      <span>{((totalPlayers / MAX_PLAYERS) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="ro-bar" style={{ height: 16 }}>
                      <div 
                        className="ro-bar__fill ro-bar__fill--exp" 
                        style={{ width: `${(totalPlayers / MAX_PLAYERS) * 100}%` }} 
                      />
                      <div className="ro-bar__text">EXP: {((totalPlayers / MAX_PLAYERS) * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>

                {/* Confidence Rating Panel */}
                {filledPlayers.length > 0 && (
                  <div className="ro-window" id="confidence-panel">
                    <div className="ro-window__header">
                      <span>Confidence Rating</span>
                      <span>⭐</span>
                    </div>
                    <div className="ro-window__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {filledPlayers.map((p) => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.8rem' }}>{p.teamFlag}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: p.id === captain ? 700 : 400 }}>
                              {p.name}
                              {p.id === captain && <span style={{ color: '#ffd700', marginLeft: 6 }}>©</span>}
                            </span>
                          </div>
                          <StarRating
                            value={confidence[p.id] ?? 3}
                            onChange={(stars) => setConfidence((prev) => ({ ...prev, [p.id]: stars }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Player Picker */}
                {!isLineupFull && (
                  <div className="ro-window" id="recruitment-terminal">
                    {activeSlot === null ? (
                      <>
                        <div className="ro-window__header">
                          <span>Recruitment Terminal</span>
                          <span>👥</span>
                        </div>
                        <div className="ro-window__body" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                          <div style={{ fontSize: '2rem', marginBottom: 12 }}>👆</div>
                          Click an empty slot to select a player
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="ro-window__header">
                          <span>Recruiting {SLOTS[activeSlot].label}</span>
                          <span>🔍</span>
                        </div>
                        <div className="ro-window__body">
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                              <button
                                className={`btn btn--sm ${activeTeam === 'home' ? 'btn--primary' : 'btn--ghost'}`}
                                onClick={() => setActiveTeam('home')}
                              >
                                {fixture.homeFlag} {fixture.homeTeam}
                              </button>
                              <button
                                className={`btn btn--sm ${activeTeam === 'away' ? 'btn--primary' : 'btn--ghost'}`}
                                onClick={() => setActiveTeam('away')}
                              >
                                {fixture.awayFlag} {fixture.awayTeam}
                              </button>
                            </div>
                            <input
                              className="input"
                              placeholder={`Search ${SLOTS[activeSlot].label}...`}
                              value={playerSearch}
                              onChange={(e) => setPlayerSearch(e.target.value)}
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                            {availablePlayers.length === 0 && (
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 16 }}>
                                No players available
                              </p>
                            )}
                            {availablePlayers.map((player) => (
                              <button
                                key={player.id}
                                onClick={() => addPlayer(player)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  padding: '10px 14px',
                                  background: 'rgba(8, 15, 28, 0.94)',
                                  border: '2px solid #ffffff',
                                  borderRadius: '0px',
                                  cursor: 'pointer',
                                  transition: 'all 150ms',
                                  textAlign: 'left',
                                  width: '100%',
                                  color: 'var(--text-primary)',
                                  boxShadow: '0 0 0 2px #000000, inset 0 0 0 1px rgba(255,255,255,0.05)',
                                }}
                                onMouseEnter={(e) => { 
                                  (e.currentTarget as HTMLElement).style.borderColor = '#ffd700';
                                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px #000000, inset 0 0 0 1px rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={(e) => { 
                                  (e.currentTarget as HTMLElement).style.borderColor = '#ffffff';
                                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px #000000, inset 0 0 0 1px rgba(255,255,255,0.05)';
                                }}
                              >
                                <span style={{ fontSize: '1.2rem' }}>{player.teamFlag}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', fontStyle: 'italic', fontFamily: 'Bebas Neue, cursive' }}>{player.name}</div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{player.team} • {player.position}</div>
                                </div>
                                <div style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  fontFamily: 'Bebas Neue, cursive',
                                  fontStyle: 'italic',
                                  padding: '2px 6px',
                                  borderRadius: '0px',
                                  border: '2px solid #ffffff',
                                  boxShadow: '0 0 0 1px #000000',
                                  background: player.rating && player.rating >= 88 ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.08)',
                                  color: player.rating && player.rating >= 88 ? '#000000' : 'var(--text-secondary)',
                                }}>
                                  {player.rating}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Captain Hint */}
                {totalPlayers > 0 && !captain && (
                  <div className="card card--gold" style={{ padding: 16, fontSize: '0.85rem', color: '#ffd700', textAlign: 'center' }}>
                    ⭐ Tap a filled player card to set them as captain (2× multiplier)
                  </div>
                )}

                {/* Submit Button */}
                <div id="submit-button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <button
                    className="btn btn--primary btn--lg"
                    onClick={handleSubmit}
                    disabled={!isLineupFull || !captain || submitting}
                    style={{
                      opacity: isLineupFull && captain ? 1 : 0.5,
                      cursor: isLineupFull && captain ? 'pointer' : 'not-allowed',
                      width: '100%',
                      maxWidth: '400px', // Prevent it from being too wide on desktop but keep it centered
                    }}
                  >
                    {submitting ? '⏳ Processing...' : isLineupFull ? (captain ? '🔒 Lock Lineup & Pay 0.1 SOL' : '⭐ Select a Captain First') : `Fill ${MAX_PLAYERS - totalPlayers} More Slots`}
                  </button>
                  {isLineupFull && captain && (
                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Entry fee: 0.1 SOL • {contestType === '5050' ? 'Top 50% Double Up' : contestType === 'wta' ? 'Winner Takes All' : 'Top 3 win prizes'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (stars: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className={`star ${star <= (hover || value) ? 'star--filled' : ''}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '1rem' }}
          aria-label={`${star} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function getTutorialData(step: number): { speakerTitle: string, text: string, image: string, position: 'left' | 'right', shiftEdge?: boolean, targetId: string } | null {
  switch (step) {
    case 1:
      return {
        speakerTitle: 'Guide',
        text: `"Welcome to the Lineup Builder! Here you'll draft your 5-a-side team for this match."`,
        image: '/NPC/NPC Guide Female.svg',
        position: 'left',
        targetId: 'lineup-header',
      };
    case 2:
      return {
        speakerTitle: 'Guide',
        text: `"You need to fill these 5 specific positions: Goalkeeper, 2 Defenders, 1 Midfielder, and 1 Attacker."`,
        image: '/NPC/NPC Guide Male.svg',
        position: 'right',
        targetId: 'lineup-grid',
      };
    case 3:
      return {
        speakerTitle: 'Guide',
        text: `"To recruit a player, simply click an empty slot, and the Recruitment Terminal will show you available players."`,
        image: '/NPC/NPC Guide Female.svg',
        position: 'left',
        targetId: 'recruitment-terminal',
      };
    case 4:
      return {
        speakerTitle: 'Guide',
        text: `"Let me show you! I've automatically recruited a full demo squad for you. Notice how we also assigned a Captain (2x points)."`,
        image: '/NPC/NPC Guide Male.svg',
        position: 'right',
        targetId: 'lineup-grid',
      };
    case 5:
      return {
        speakerTitle: 'Guide',
        text: `"We also set Confidence ratings (⭐1-5). A 5-star rating gives a huge multiplier, but also amplifies negative points for mistakes like Red Cards!"`,
        image: '/NPC/NPC Guide Female.svg',
        position: 'left',
        targetId: 'confidence-panel',
      };
    case 6:
      return {
        speakerTitle: 'Guide',
        text: `"Once your squad is ready, lock it in by paying the 0.1 SOL entry fee. Then, head to the Live Match screen to watch your points update! Good luck!"`,
        image: '/NPC/NPC Guide Male.svg',
        position: 'right',
        targetId: 'submit-button',
      };
    default:
      return null;
  }
}

