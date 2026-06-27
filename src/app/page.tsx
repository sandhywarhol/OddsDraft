'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { DEMO_FIXTURES } from '@/lib/players';
import { formatDistanceToNow } from 'date-fns';

export default function HomePage() {
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
    // Check if the user has already seen the tutorial
    const hasSeenTutorial = localStorage.getItem('hasSeenOddsDraftTutorial');
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
      }
    }

    if (tutorialStep < 15) {
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
                
                const targetCenterX = nextData?.position === 'left' ? viewportWidth * 0.70 : viewportWidth * 0.30;
                let shift = targetCenterX - currentCenterX;
                
                const padding = 24;
                if (rect.left + shift < padding) shift = padding - rect.left;
                if (rect.right + shift > viewportWidth - padding) shift = viewportWidth - padding - rect.right;
                
                element.style.position = 'relative';
                element.style.zIndex = '99999';
                element.style.transition = 'transform 0.5s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.5s ease';
                element.style.background = targetId === 'live-ticker-section' ? '#1a1008' : '#fcf8eb';
                element.style.borderRadius = '16px';
                element.style.pointerEvents = 'none';
                
                void element.offsetWidth;
                
                element.style.transform = `translateX(${shift}px) scale(1.05)`;
                element.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.85), 0 0 40px rgba(255,255,255,0.2)';
                
                setZoomedElementId(targetId);
              }, 400); 
            }, 750); 
          }
        }, 400); 
      } else {
        setTutorialStep(nextStep);
      }
    } else {
      localStorage.setItem('hasSeenOddsDraftTutorial', 'true');
      setTutorialStep(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const tutorialData = getTutorialData(tutorialStep);
  return (
    <div style={{ minHeight: '100vh', background: 'transparent', overflowX: 'hidden' }}>
      <Navbar />
      
      {/* Content Wrapper for Zoom Motion */}
      <div style={{
        transform: wrapperTransform,
        transition: wrapperTransform === 'none' ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transformOrigin: transformOrigin,
        willChange: wrapperTransform === 'none' ? 'auto' : 'transform'
      }}>
        {/* Hero Section */}
        <HeroSection />

        {/* Live Matches Ticker */}
        <LiveTicker />

        {/* Stats Section */}
        <StatsSection />
        
        {/* How It Works */}
        <HowItWorksSection />

        {/* Features */}
        <FeaturesSection />

        {/* CTA */}
        <CTASection />

        {/* Footer */}
        <Footer />
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        body {
          background-color: #080f1c;
          color: #f8fafc;
        }
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

      {/* Background Blur Overlay (Below zoomed element) */}
      {tutorialStep > 0 && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(8px)',
          zIndex: 9990, 
          pointerEvents: 'none',
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
          zIndex: 999999, // Super high z-index to sit above spotlight shadow
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
              left: tutorialData?.shiftEdge ? '-10%' : '2%',
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
              right: tutorialData?.shiftEdge ? '-10%' : '2%',
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
              left: tutorialData.position === 'left' ? '30%' : 'auto',
              right: tutorialData.position === 'left' ? 'auto' : '30%',
              zIndex: 1000010,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              animation: 'score-pop 300ms ease-out, dialog-glow 2s infinite',
            }}
          >
            {/* Speaker Tag */}
            <div style={{
              position: 'absolute',
              top: '-22px',
              left: '32px',
              background: '#1a1008',
              color: '#ffffff',
              padding: '6px 24px',
              fontSize: '1rem',
              fontWeight: 800,
              fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '2px solid #1a1008',
              boxShadow: '4px 4px 0px rgba(0,0,0,1)',
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
                <span style={{ marginLeft: 8 }}>({tutorialStep}/15)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTutorialData(step: number): { speakerTitle: string, text: string, image: string, position: 'left' | 'right', shiftEdge?: boolean, targetId: string } | null {
  switch (step) {
    case 1:
      return {
        speakerTitle: 'Guide',
        text: `"Welcome to OddsDraft! I'll be your guide. We're thrilled to have you join our Web3 Fantasy Football platform powered by real-time TxODDS data."`,
        image: '/NPC/NPC Guide Female.svg',
        position: 'left',
        targetId: 'hero-section',
      };
    case 2:
      return {
        speakerTitle: 'Guide',
        text: `"Here you can see ongoing live matches and global stats. You can instantly jump into any live game and watch the fantasy points update second-by-second!"`,
        image: '/NPC/NPC Guide Male.svg',
        position: 'right',
        targetId: 'live-ticker-section',
      };
    case 3:
      return {
        speakerTitle: 'Guide',
        text: `"Playing is easy! Step 1: Connect your Phantom wallet on the Solana Devnet to get started."`,
        image: '/NPC/NPC Guide Female.svg',
        position: 'left',
        targetId: 'step-01',
      };
    case 4:
      return {
        speakerTitle: 'Guide',
        text: `"Step 2: Build your lineup by picking 5 players (GK, CB, MF, SW, CF) from the competing teams."`,
        image: '/NPC/NPC Guide Male.svg',
        position: 'right',
        targetId: 'step-02',
      };
    case 5:
      return {
        speakerTitle: 'Guide',
        text: `"Step 3: Don't forget to choose your Captain for a 2x multiplier and assign a confidence rating to each player."`,
        image: '/NPC/NPC Guide Female.svg',
        position: 'left',
        targetId: 'step-03',
      };
    case 6:
      return {
        speakerTitle: 'Guide',
        text: `"Step 4: Once your lineup is perfect, pay the 0.1 SOL entry fee to lock it in before kickoff."`,
        image: '/NPC/NPC Guide Male.svg',
        position: 'right',
        targetId: 'step-04',
      };
    case 7:
      return {
        speakerTitle: 'Guide',
        text: `"Step 5: Watch the match live! Goals, Assists, Saves, and Cards will instantly impact your points."`,
        image: '/NPC/NPC Guide Female.svg',
        position: 'left',
        targetId: 'step-05',
      };
    case 8:
      return {
        speakerTitle: 'Guide',
        text: `"Step 6: If you finish in the Top 3, you'll win a share of the prize pool directly to your wallet!"`,
        image: '/NPC/NPC Guide Male.svg',
        position: 'right',
        targetId: 'step-06',
      };
    case 9:
      return {
        speakerTitle: 'Guide',
        text: `"Why OddsDraft? First, we are the only platform powered by Live TxODDS data for sub-second updates."`,
        image: '/NPC/NPC Guide Female.svg',
        position: 'left',
        targetId: 'feature-0',
      };
    case 10:
      return {
        speakerTitle: 'Guide',
        text: `"Second, our Confidence Rating System allows you to multiply points if you truly believe in a player."`,
        image: '/NPC/NPC Guide Male.svg',
        position: 'right',
        targetId: 'feature-1',
      };
    case 11:
      return {
        speakerTitle: 'Guide',
        text: `"Third, all prize distributions are fully on-chain. Transparent, trustless, and immediate!"`,
        image: '/NPC/NPC Guide Female.svg',
        position: 'left',
        targetId: 'feature-2',
      };
    case 12:
      return {
        speakerTitle: 'Guide',
        text: `"Fourth, you can join multiple contests simultaneously and build different lineups for the same match."`,
        image: '/NPC/NPC Guide Male.svg',
        position: 'right',
        targetId: 'feature-3',
      };
    case 13:
      return {
        speakerTitle: 'Guide',
        text: `"Fifth, our Real-Time Leaderboard lets you watch your rank change dynamically as events happen."`,
        image: '/NPC/NPC Guide Female.svg',
        position: 'left',
        targetId: 'feature-4',
      };
    case 14:
      return {
        speakerTitle: 'Guide',
        text: `"Sixth, our AI Recommendations will help you make the best picks, from Safe choices to High-Risk gambles."`,
        image: '/NPC/NPC Guide Male.svg',
        position: 'right',
        targetId: 'feature-5',
      };
    case 15:
      return {
        speakerTitle: 'Guide',
        text: `"That's everything! Claim your Devnet SOL from the faucet, join a contest, and start drafting your dream team today!"`,
        image: '/NPC/NPC Guide Female.svg',
        position: 'left',
        shiftEdge: true,
        targetId: 'cta-section',
      };
    default:
      return null;
  }
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
        <h1 style={{
          fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: 24,
          letterSpacing: '-0.01em',
        }}>
          <span style={{ display: 'block', fontSize: '1rem', color: '#ffd700', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>ファンタジーフットボール</span>
          Fantasy Football
          <br />
          <span className="gradient-text">Meets On-Chain Prizes</span>
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
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/contests" className="btn btn--primary btn--lg" id="hero-play-btn">
            🏆 Play Now
          </Link>
          <Link href="/how-it-works" className="btn btn--secondary btn--lg" id="hero-learn-btn">
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
            { icon: '⚡', text: 'Live TxODDS Data' },
            { icon: '🔗', text: 'On-Chain Prizes' },
            { icon: '🏟️', text: 'World Cup 2026' },
            { icon: '🛡️', text: 'Solana Verified' },
          ].map((item) => (
            <div key={item.text} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}>
              <span>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveTicker() {
  const liveMatch = DEMO_FIXTURES.find((f) => f.status === 'live');
  if (!liveMatch) return null;

  return (
    <div id="live-ticker-section" style={{
      background: '#1a1008',
      borderTop: '1px solid rgba(255, 77, 109, 0.2)',
      borderBottom: '1px solid rgba(255, 77, 109, 0.2)',
      padding: '12px 0',
      color: '#f8fafc'
    }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span className="badge badge--live">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
            LIVE
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <span style={{ fontSize: '1.2rem' }}>{liveMatch.homeFlag}</span>
            <span style={{ fontWeight: 700 }}>{liveMatch.homeTeam}</span>
            <span style={{
              fontFamily: 'Bebas Neue, cursive',
              fontSize: '1.5rem',
              color: '#ffffff',
              letterSpacing: '0.1em',
            }}>
              {liveMatch.homeScore ?? 0} — {liveMatch.awayScore ?? 0}
            </span>
            <span style={{ fontWeight: 700 }}>{liveMatch.awayTeam}</span>
            <span style={{ fontSize: '1.2rem' }}>{liveMatch.awayFlag}</span>
          </div>
          <Link href={`/contest/demo-live`} className="btn btn--danger btn--sm" id="live-join-btn">
            Join Contest →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatsSection() {
  const stats = [
    { value: '32', label: 'Teams', icon: '🌍' },
    { value: '64', label: 'Matches', icon: '⚽' },
    { value: '0.1', label: 'SOL Entry', icon: '💰' },
    { value: '100%', label: 'On-Chain Prizes', icon: '🔗' },
  ];

  return (
    <section style={{ padding: '60px 0' }}>
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-item card" id={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>{stat.icon}</div>
              <div className="stat-item__value">{stat.value}</div>
              <div className="stat-item__label">{stat.label}</div>
            </div>
          ))}
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
      desc: 'Connect your Phantom wallet to Solana devnet. Get free devnet SOL to play.',
      icon: '👛',
    },
    {
      step: '02',
      title: 'Build Your Lineup',
      desc: 'Pick 5 players (GK, CB, MF, SW, CF) from the two competing teams.',
      icon: '🧩',
    },
    {
      step: '03',
      title: 'Select Captain & Confidence',
      desc: 'Choose your captain (2x multiplier) and rate your confidence per player (⭐1-5).',
      icon: '⭐',
    },
    {
      step: '04',
      title: 'Lock & Pay Entry',
      desc: 'Submit lineup before kickoff. Pay 0.1 SOL entry fee to the prize pool.',
      icon: '🔒',
    },
    {
      step: '05',
      title: 'Watch Live & Earn Points',
      desc: 'Goals +10, Assists +6, Saves +1, Cards -2. Watch your points update live!',
      icon: '📊',
    },
    {
      step: '06',
      title: 'Win SOL Prizes',
      desc: 'Top 3 win 50%, 30%, 20% of the prize pool — automatically distributed on-chain.',
      icon: '🏆',
    },
  ];

  return (
    <section id="how-it-works-section" style={{ padding: '80px 0' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 12 }}>
            How OddsDraft Works
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
            From lineup to prize in 6 simple steps
          </p>
        </div>

        <div className="grid-three">
          {steps.map((step) => (
            <div key={step.step} className="jrpg-scroll card--hoverable" id={`step-${step.step}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{
                  fontFamily: 'Bebas Neue, cursive',
                  fontSize: '2.5rem',
                  color: '#b45309',
                  opacity: 0.8,
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                }}>
                  {step.step}
                </div>
                <div style={{ fontSize: '1.8rem' }}>{step.icon}</div>
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: 8, color: '#36220f' }}>{step.title}</h3>
              <p style={{ color: '#5c4028', fontSize: '0.875rem', lineHeight: 1.6 }}>
                {step.desc}
              </p>
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
      color: 'var(--color-primary)',
    },
    {
      title: 'Confidence Rating System',
      desc: 'Rate your confidence per player ⭐1-5. Higher confidence = bigger bonus or penalty.',
      icon: '🎯',
      color: 'var(--color-accent)',
    },
    {
      title: 'On-Chain Prize Distribution',
      desc: 'Prizes auto-distributed via Solana. Transparent, trustless, immediate.',
      icon: '🔗',
      color: 'var(--color-info)',
    },
    {
      title: 'Multi-Contest',
      desc: 'Join multiple contests simultaneously. Build different lineups for each match.',
      icon: '🏟️',
      color: 'var(--color-primary)',
    },
    {
      title: 'Real-Time Leaderboard',
      desc: 'Watch rankings update live as match events happen. See your rank change in real-time.',
      icon: '📈',
      color: '#A855F7',
    },
    {
      title: 'AI Recommendations',
      desc: 'Rule-based AI picks: Captain Suggestion, Safe Pick, High Risk, and Undervalued players.',
      icon: '🤖',
      color: 'var(--color-danger)',
    },
  ];

  return (
    <section id="features-section" style={{ padding: '80px 0', background: 'rgba(255,255,255,0.01)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 12 }}>
            Why OddsDraft?
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
            The only fantasy platform built on live football data + on-chain rewards
          </p>
        </div>

        <div className="grid-three">
          {features.map((feature, idx) => (
            <div key={feature.title} className="jrpg-scroll card--hoverable" id={`feature-${idx}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{
                  fontFamily: 'Bebas Neue, cursive',
                  fontSize: '2.5rem',
                  color: '#b45309',
                  opacity: 0.8,
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                }}>
                  0{idx + 1}
                </div>
                <div style={{ fontSize: '1.8rem' }}>{feature.icon}</div>
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: 8, color: '#36220f' }}>{feature.title}</h3>
              <p style={{ color: '#5c4028', fontSize: '0.875rem', lineHeight: 1.6 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
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
              <a
                href="https://faucet.solana.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--secondary btn--lg"
                id="cta-airdrop-btn"
              >
                💧 Get Devnet SOL
              </a>
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
      borderTop: '1px solid var(--border-subtle)',
      padding: '40px 0',
      color: 'var(--text-muted)',
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚽</span>
            <span style={{
              fontFamily: 'Bebas Neue, cursive',
              fontSize: '1.2rem',
              letterSpacing: '0.05em',
              color: 'var(--text-secondary)',
            }}>
              OddsDraft
            </span>
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            Powered by{' '}
            <a
              href="https://txline-docs.txodds.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
            >
              TxODDS
            </a>
            {' '}·{' '}
            Built on Solana Devnet
            {' '}·{' '}
            World Cup 2026 Hackathon
          </div>
        </div>
      </div>
    </footer>
  );
}
