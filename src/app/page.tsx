'use client';

import { useTxLine } from '@/context/TxLineContext';
import { useWallet } from '@solana/wallet-adapter-react';
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
    // Check if the user has already seen the tutorial or is on mobile
    if (window.innerWidth < 768) {
      return;
    }
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
        prevEl.style.width = '';
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
                
                const isMobile = window.innerWidth <= 768;
                if (isMobile && targetId.startsWith('step-0')) {
                  element.style.width = '90vw';
                }
                
                const rect = element.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const currentCenterX = rect.left + rect.width / 2;
                
                let shift = 0;
                if (isMobile) {
                  shift = (viewportWidth / 2) - currentCenterX;
                } else {
                  const targetCenterX = nextData?.position === 'left' ? viewportWidth * 0.70 : viewportWidth * 0.30;
                  shift = targetCenterX - currentCenterX;
                }
                
                const padding = 24;
                if (rect.left + shift < padding) shift = padding - rect.left;
                if (rect.right + shift > viewportWidth - padding) shift = viewportWidth - padding - rect.right;
                
                element.style.position = 'relative';
                element.style.zIndex = '99999';
                element.style.transition = 'transform 0.5s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.5s ease';
                let newBg = '#fcf8eb';
                if (targetId === 'live-ticker-section') newBg = '#1a1008';
                if (targetId.startsWith('feature-')) newBg = 'rgba(15, 23, 42, 1)';
                
                element.style.background = newBg;
                element.style.borderRadius = '16px';
                element.style.pointerEvents = 'none';
                
                void element.offsetWidth;
                
                const scaleVal = isMobile ? (targetId.startsWith('step-0') ? 1 : 0.88) : 1.05;
                const translateYVal = isMobile ? -170 : 0;
                element.style.transform = `translate(${shift}px, ${translateYVal}px) scale(${scaleVal})`;
                element.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.85), 0 0 40px rgba(255,255,255,0.2)';
                
                setZoomedElementId(targetId);
              }, 400); 
            }, 750); 
          } else {
            setWrapperTransform('none');
            setIsTransitioning(false);
            setTutorialStep(nextStep);
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
  const shouldBlurHomeBg = [1, 2, 15].includes(tutorialStep);
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
          backdropFilter: shouldBlurHomeBg ? 'blur(8px)' : 'none',
          zIndex: 9990, 
          pointerEvents: 'none',
        }} />
      )}

      {/* Onboarding Tutorial Popup */}
      {tutorialStep > 0 && tutorialData && (
        <div 
          onClick={handleNextTutorialStep}
          className="npc-dialog-overlay"
          style={{
            backgroundColor: 'transparent',
            zIndex: 999999, // Super high z-index to sit above spotlight shadow
            backdropFilter: shouldBlurHomeBg ? 'blur(5px)' : 'none',
            WebkitBackdropFilter: shouldBlurHomeBg ? 'blur(5px)' : 'none',
          }}
        >
          {/* NPC Character Image (Female - Left) */}
          {tutorialData?.position === 'left' && (
            <img
              src="/NPC/NPC Guide Female.svg"
              alt="Guide"
              className="npc-commentator1-img"
              style={{
                bottom: '-25vh',
                left: tutorialData?.shiftEdge ? '-10%' : '2%',
                height: '105vh',
                zIndex: 10005,
                transition: 'opacity 0.4s ease-out, transform 0.4s ease-out, left 0.4s ease-out',
                opacity: 1,
                transform: 'translateX(0)',
              }}
            />
          )}

          {/* NPC Character Image (Male - Right) */}
          {tutorialData?.position === 'right' && (
            <img
              src="/NPC/NPC Guide Male.svg"
              alt="Guide"
              className="npc-commentator2-img"
              style={{
                bottom: '-25vh',
                right: tutorialData?.shiftEdge ? '-10%' : '2%',
                height: '105vh',
                zIndex: 10005,
                transition: 'opacity 0.4s ease-out, transform 0.4s ease-out, right 0.4s ease-out',
                opacity: 1,
                transform: 'translateX(0)',
              }}
            />
          )}

          {/* Dialog Bubble */}
          <div 
            className="npc-jrpg-dialog-box"
            style={{
              position: 'absolute',
              bottom: '12vh',
              left: tutorialData.position === 'left' ? '30%' : 'auto',
              right: tutorialData.position === 'left' ? 'auto' : '30%',
              zIndex: 1000010,
            }}
          >
            {/* Speaker Tag */}
            <div 
              className="npc-jrpg-speaker-tag"
              style={{
                border: '2px solid #1a1008',
                boxShadow: '4px 4px 0px rgba(0,0,0,1)',
              }}
            >
              {tutorialData.speakerTitle}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '16px',
            }}>
              <div className="npc-jrpg-dialog-text">
                {tutorialData.text}
              </div>
            </div>
            
            <div className="npc-jrpg-dialog-footer">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (zoomedElementId) {
                    const el = document.getElementById(zoomedElementId);
                    if (el) { el.style.position=''; el.style.zIndex=''; el.style.transition=''; el.style.transform=''; el.style.background=''; el.style.pointerEvents=''; el.style.boxShadow=''; el.style.width=''; }
                  }
                  localStorage.setItem('hasSeenOddsDraftTutorial', 'true');
                  setTutorialStep(0);
                  setZoomedElementId(null);
                  setWrapperTransform('none');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  background: 'transparent',
                  border: '2px solid rgba(26,16,8,0.25)',
                  color: 'rgba(26,16,8,0.55)',
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background='rgba(26,16,8,0.08)'; e.currentTarget.style.color='rgba(26,16,8,0.8)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(26,16,8,0.55)'; }}
              >
                Skip Tutorial ✕
              </button>
              <div style={{
                color: 'rgba(26,16,8,0.5)',
                fontSize: '0.7rem',
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
        text: `"Playing is easy! Step 1: Connect your Phantom wallet on the Solana network to get started."`,
        image: '/NPC/NPC Guide Female.svg',
        position: 'left',
        targetId: 'step-01',
      };
    case 4:
      return {
        speakerTitle: 'Guide',
        text: `"Step 2: Build your lineup by picking 5 players (GK, DEF, MID, DEF, ATT) from the competing teams."`,
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
        text: `"Step 6: Compete in 3 different lobbies (Free, Degens, Whales) to win a share of the prize pool directly to your wallet!"`,
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
        text: `"Third, prize distributions are recorded on Solana. Transparent, verifiable, and automated at match end!"`,
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
        text: `"That's everything! Connect your wallet, join a contest lobby, and start drafting your dream team today!"`,
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
          <button 
            onClick={() => { localStorage.removeItem('hasSeenOddsDraftTutorial'); window.location.reload(); }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ▶ Replay Tutorial
          </button>
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
  const { appMode, apiToken, isSubscribing, subscribeAndActivate, liveFixtures } = useTxLine();
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
    return (
      <div id="live-ticker-section" style={{ background: '#1a1008', borderTop: '1px solid rgba(0, 229, 255, 0.2)', borderBottom: '1px solid rgba(0, 229, 255, 0.2)', padding: '12px 0', color: '#f8fafc' }}>
        <div className="container">
          <span style={{ color: '#00e5ff' }}>• LIVE txLINE: No matches currently in progress.</span>
        </div>
      </div>
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
                <span style={{ fontSize: '1.2rem' }}>{demoLiveMatch?.homeFlag}</span>
                <span style={{ fontWeight: 700 }}>{demoLiveMatch?.homeTeam}</span>
                <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.5rem', letterSpacing: '0.1em' }}>
                  {demoLiveMatch?.homeScore ?? 0} — {demoLiveMatch?.awayScore ?? 0}
                </span>
                <span style={{ fontWeight: 700 }}>{demoLiveMatch?.awayTeam}</span>
                <span style={{ fontSize: '1.2rem' }}>{demoLiveMatch?.awayFlag}</span>
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
    { value: '48', label: 'Teams', icon: '🌍' },
    { value: '104', label: 'Matches', icon: '⚽' },
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
      desc: 'Connect your Phantom wallet to the Solana network to play.',
      icon: '👛',
      color: '#ffd700',
    },
    {
      step: '02',
      title: 'Build Your Lineup',
      desc: 'Pick 5 players (GK, DEF, MID, DEF, ATT) from the two competing teams.',
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
      desc: 'Subscribe to @OddsDraftBot for instant goal alerts, red cards, and match events on Telegram.',
      icon: '✈️',
      color: '#29b6f6',
      tag: 'SYS_TG',
      link: 'https://t.me/OddsDraftBot'
    },
  ];

  return (
    <section id="features-section" style={{ padding: '80px 0', background: 'transparent' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 12, color: '#ffd700', textShadow: '0 0 10px rgba(255,215,0,0.2)' }}>
            Why OddsDraft?
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
            The only fantasy platform built on live football data + on-chain rewards
          </p>
        </div>

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
      borderTop: '1px solid var(--border-subtle)',
      padding: '40px 0',
      color: 'var(--text-muted)',
    }}>
      <div className="container">
        <div className="footer-inner">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/Logo OddsDraft.svg" alt="OddsDraft Logo" className="footer-logo" />
          </div>
          <div className="footer-text">
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
            Solana
            {' '}·{' '}
            World Cup '26
          </div>
        </div>
      </div>
    </footer>
  );
}
