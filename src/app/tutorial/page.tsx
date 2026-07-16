'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import PlayerAvatar from '@/components/PlayerAvatar';
import FlagImage from '@/components/FlagImage';
import { addCardToCollection, getCardsForLineupPosition, type OwnedCard } from '@/lib/card-collection';
import { RARITY_COLOR, SKILL_CARDS } from '@/lib/skill-cards';
import { prefetchPlayerPhotos } from '@/lib/player-photos';
import SkillCardDisplay from '@/components/SkillCardDisplay';

// ── Hardcoded tutorial squad ───────────────────────────────────────────────
// Famous players with reliable TheSportsDB photos
const TUTORIAL_PLAYERS = [
  { id: 'ger-neuer',   name: 'Manuel Neuer',     team: 'Germany',     teamFlag: '🇩🇪', position: 'GK',  rating: 87 },
  { id: 'ger-tah',     name: 'Jonathan Tah',     team: 'Germany',     teamFlag: '🇩🇪', position: 'DEF', rating: 84 },
  { id: 'arg-paul',    name: 'Rodrigo De Paul',  team: 'Argentina',   teamFlag: '🇦🇷', position: 'MID', rating: 84 },
  { id: 'arg-messi',   name: 'Lionel Messi',     team: 'Argentina',   teamFlag: '🇦🇷', position: 'SWG', rating: 94 },
  { id: 'arg-alvarez', name: 'Julián Álvarez',   team: 'Argentina',   teamFlag: '🇦🇷', position: 'ATT', rating: 86 },
];

const CAPTAIN_ID = 'arg-messi';

const TUTORIAL_CONFIDENCE: Record<string, number> = {
  'ger-neuer':   3,
  'ger-tah':     3,
  'arg-paul':    4,
  'arg-messi':   5,
  'arg-alvarez': 4,
};

// Demo skill cards equipped on the tutorial squad
const DEMO_CARDS: OwnedCard[] = [
  { instanceId: 'tutorial-demo-gk',  cardId: 'gk-common',     obtainedAt: new Date().toISOString() },
  { instanceId: 'tutorial-demo-def', cardId: 'def-uncommon',  obtainedAt: new Date().toISOString() },
  { instanceId: 'tutorial-demo-mid', cardId: 'mid-rare',      obtainedAt: new Date().toISOString() },
  { instanceId: 'tutorial-demo-swg', cardId: 'win-epic',      obtainedAt: new Date().toISOString() },
  { instanceId: 'tutorial-demo-att', cardId: 'str-legendary', obtainedAt: new Date().toISOString() },
];

const EQUIPPED_CARDS: Record<string, string> = {
  'ger-neuer':   'tutorial-demo-gk',
  'ger-tah':     'tutorial-demo-def',
  'arg-paul':    'tutorial-demo-mid',
  'arg-messi':   'tutorial-demo-swg',
  'arg-alvarez': 'tutorial-demo-att',
};

// ── Tutorial dialog data ───────────────────────────────────────────────────
type TutorialStep = {
  speakerTitle: string;
  text: string;
  position: 'left' | 'right';
  targetId: string;
};

function getTutorialData(step: number): TutorialStep | null {
  switch (step) {
    case 1: return {
      speakerTitle: 'Guide',
      text: `"Welcome to the Lineup Builder! Here you'll draft your 5-a-side team for this match."`,
      position: 'left', targetId: 'lineup-header',
    };
    case 2: return {
      speakerTitle: 'Guide',
      text: `"You need to fill 5 positions: Goalkeeper, Defender, Midfielder, Swinger (wing player LW/RW), and Forward. Each position earns points differently!"`,
      position: 'right', targetId: 'lineup-grid',
    };
    case 3: return {
      speakerTitle: 'Guide',
      text: `"To recruit a player, simply click an empty slot, and the Recruitment Terminal will show you available players."`,
      position: 'left', targetId: 'recruitment-terminal',
    };
    case 4: return {
      speakerTitle: 'Guide',
      text: `"Let me show you! I've automatically recruited a full demo squad for you. Notice how we also assigned a Captain (2x points)."`,
      position: 'right', targetId: 'lineup-grid',
    };
    case 5: return {
      speakerTitle: 'Guide',
      text: `"We also set Confidence ratings (⭐1-5). A 5-star rating gives a huge multiplier, but also amplifies negative points for mistakes like Red Cards!"`,
      position: 'left', targetId: 'confidence-panel',
    };
    case 6: return {
      speakerTitle: 'Guide',
      text: `"Once your squad is ready, lock it in by paying the 0.1 SOL entry fee. Then, head to the Live Match screen to watch your points update! Good luck!"`,

      position: 'right', targetId: 'submit-button',
    };
    case 7: return {
      speakerTitle: 'Guide',
      text: `"Bonus tip! Equip a Skill Card to each player for extra points — I've already equipped demo cards so you can see how it looks. Earn your own cards after every match!"`,
      position: 'left', targetId: 'skill-card-section',
    };
    case 8: return {
      speakerTitle: 'Guide',
      text: `"Visit 'My Cards' (top menu) to manage your full collection. Collect 2 copies of the same card to combine them into a higher rarity for even stronger bonuses. Legendary cards give massive point multipliers! Good luck, manager!"`,
      position: 'right', targetId: 'lineup-header',
    };
    default: return null;
  }
}

// ── StarRating ─────────────────────────────────────────────────────────────
function StarRating({ value }: { value: number }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= value ? 'star--filled' : ''}`}
          style={{ fontSize: '1rem' }}
        >★</span>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function TutorialPage() {
  const router = useRouter();

  const [tutorialStep, setTutorialStep] = useState(1);
  const [zoomedElementId, setZoomedElementId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFadingNPC, setIsFadingNPC] = useState(false);
  const [wrapperTransform, setWrapperTransform] = useState('none');

  // Slot 0–2 filled from step 1; slot 3–4 revealed at step 4
  const showFilledLineup = tutorialStep >= 4;

  const shouldBlurBg = tutorialStep === 1;

  useEffect(() => {
    localStorage.removeItem('hasSeenLineupTutorial');
    // Warm photo cache immediately
    prefetchPlayerPhotos(TUTORIAL_PLAYERS.map(p => ({ id: p.id, name: p.name })));
    // Seed demo cards
    DEMO_CARDS.forEach(c => {
      try {
        const existing = JSON.parse(localStorage.getItem('oddsdraft_card_collection') || '{"cards":[]}');
        if (!existing.cards.find((x: OwnedCard) => x.instanceId === c.instanceId)) {
          addCardToCollection(c);
        }
      } catch { /* ignore */ }
    });
  }, []);

  useEffect(() => {
    if (tutorialStep === 8) {
      document.body.classList.add('tutorial-step-8-active');
    } else {
      document.body.classList.remove('tutorial-step-8-active');
    }
    return () => document.body.classList.remove('tutorial-step-8-active');
  }, [tutorialStep]);

  const customSmoothScroll = (element: HTMLElement, duration = 800) => {
    const targetY = element.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35 + element.offsetHeight / 2;
    const startY = window.scrollY;
    const distance = targetY - startY;
    let startTime: number | null = null;
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
      if (elapsed < duration) requestAnimationFrame(animation);
    };
    requestAnimationFrame(animation);
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransitioning) return;

    setIsTransitioning(true);
    setIsFadingNPC(true);

    const nextStep = tutorialStep + 1;
    const nextData = getTutorialData(nextStep);
    const targetId = nextData?.targetId;

    // Unzoom previous element
    if (zoomedElementId) {
      const prevEl = document.getElementById(zoomedElementId);
      if (prevEl) {
        prevEl.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.6s ease';
        prevEl.style.transform = 'translate(0px, 0px) scale(1)';
        prevEl.style.boxShadow = '0 0 0 0px rgba(0,0,0,0), 0 0 0px rgba(255,255,255,0)';
      }
    }

    setTimeout(() => {
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
          prevEl.style.width = '';
        }
      }
      setZoomedElementId(null);

      if (tutorialStep < 8) {
        if (targetId) {
          setWrapperTransform('scale(1)');
          setTimeout(() => setWrapperTransform('scale(0.94)'), 20);

          setTimeout(() => {
            const element = document.getElementById(targetId);
            if (element) {
              customSmoothScroll(element, 700);

              setTimeout(() => {
                setTutorialStep(nextStep);
                setIsFadingNPC(false);
              }, 300);

              setTimeout(() => {
                setWrapperTransform('scale(1)');
                setTimeout(() => {
                  setWrapperTransform('none');

                  const isMobile = window.innerWidth <= 768;
                  if (isMobile && targetId !== 'submit-button' && targetId !== 'lineup-header') {
                    element.style.width = '90vw';
                  }

                  const rect = element.getBoundingClientRect();
                  const viewportWidth = window.innerWidth;
                  const currentCenterX = rect.left + rect.width / 2;

                  let shift = 0;
                  if (isMobile) {
                    shift = (viewportWidth / 2) - currentCenterX;
                  } else {
                    const targetCenterX = nextData?.position === 'left' ? viewportWidth * 0.78 : viewportWidth * 0.22;
                    shift = targetCenterX - currentCenterX;
                  }

                  const padding = 24;
                  if (rect.left + shift < padding) shift = padding - rect.left;
                  if (rect.right + shift > viewportWidth - padding) shift = viewportWidth - padding - rect.right;

                  element.style.position = 'relative';
                  element.style.zIndex = '99999';
                  element.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.8s ease';
                  element.style.background = 'rgba(8, 15, 28, 1)';
                  element.style.borderRadius = '16px';
                  element.style.pointerEvents = 'none';
                  if (targetId === 'recruitment-terminal' || targetId === 'confidence-panel' || targetId === 'submit-button' || targetId === 'skill-card-section') {
                    element.style.maxWidth = targetId === 'skill-card-section' ? '650px' : '560px';
                  }

                  void element.offsetWidth;

                  let translateY = -50;
                  if (isMobile) {
                    if (targetId === 'submit-button') translateY = -560;
                    else if (targetId === 'confidence-panel') translateY = 0;
                    else if (targetId === 'recruitment-terminal') translateY = -420;
                    else if (targetId === 'lineup-grid' && nextStep === 4) translateY = 0;
                    else if (targetId === 'lineup-grid' && nextStep === 2) translateY = -280;
                    else if (targetId === 'skill-card-section') translateY = -100;
                    else if (targetId === 'lineup-header') translateY = -150;
                  } else {
                    if (targetId === 'submit-button') translateY = -230;
                    else if (targetId === 'confidence-panel') translateY = 0;
                    else if (targetId === 'lineup-grid' && nextStep === 4) translateY = 80;
                    else if (targetId === 'lineup-grid' && nextStep === 2) translateY = -35;
                    else if (targetId === 'skill-card-section') translateY = 30;
                  }

                  if (targetId === 'skill-card-section') shift -= isMobile ? 40 : 200;
                  if (targetId === 'submit-button') shift += isMobile ? 30 : 200;

                  const scaleVal = isMobile ? (targetId !== 'submit-button' && targetId !== 'lineup-header' ? 1 : 0.88) : 1.02;
                  element.style.transform = `translate(${shift}px, ${translateY}px) scale(${scaleVal})`;
                  element.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.85), 0 0 40px rgba(255,255,255,0.2)';

                  setZoomedElementId(targetId);

                  setTimeout(() => setIsTransitioning(false), 500);
                }, 400);
              }, 750);
            } else {
              setWrapperTransform('none');
              setTutorialStep(nextStep);
              setIsFadingNPC(false);
              setIsTransitioning(false);
            }
          }, 400);
        } else {
          setTutorialStep(nextStep);
          setIsFadingNPC(false);
          setIsTransitioning(false);
        }
      } else {
        // Tutorial complete
        localStorage.setItem('hasSeenLineupTutorial', 'true');
        setTutorialStep(0);
        setIsFadingNPC(false);
        setIsTransitioning(false);
        router.push('/contests');
      }
    }, 450);
  };

  const tutorialData = getTutorialData(tutorialStep);

  // ── Skill card data ──────────────────────────────────────────────────────
  const skillCardRows = showFilledLineup ? TUTORIAL_PLAYERS.map(p => {
    const cards = getCardsForLineupPosition(p.position);
    const equippedInstanceId = EQUIPPED_CARDS[p.id] ?? null;
    const equippedInstance = equippedInstanceId ? cards.find(c => c.instance.instanceId === equippedInstanceId) : null;
    const equippedCardDef = equippedInstance?.card ?? null;
    return { player: p, equippedCardDef };
  }) : [];

  const SLOTS_LABELS = ['GK', 'DEF (CB/LB/RB)', 'MID (CMF/AMF)', 'SWINGER (LW/RW)', 'FWD (CF/SS)'];

  return (
    <>
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

      {/* Background blur overlay */}
      {tutorialStep > 0 && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: shouldBlurBg ? 'blur(8px)' : 'none',
          zIndex: 9990,
          pointerEvents: 'none',
          opacity: isTransitioning ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }} />
      )}

      {/* NPC dialog overlay */}
      {tutorialStep > 0 && tutorialData && (
        <div
          onClick={handleNextStep}
          className="npc-dialog-overlay"
          style={{
            backgroundColor: tutorialStep === 8 ? 'rgba(0,0,0,0.85)' : 'transparent',
            zIndex: 999999,
            backdropFilter: (shouldBlurBg || tutorialStep === 8) ? 'blur(5px)' : 'none',
            WebkitBackdropFilter: (shouldBlurBg || tutorialStep === 8) ? 'blur(5px)' : 'none',
          }}
        >
          {tutorialStep === 8 && (
            <div style={{
              position: 'fixed',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10000,
              display: 'flex',
              gap: '15px',
              pointerEvents: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100vw'
            }}>
              {DEMO_CARDS.map((card, i) => {
                const def = SKILL_CARDS.find(c => c.id === card.cardId);
                return (
                  <div key={card.instanceId} style={{
                    width: 230,
                    height: 307,
                    transform: 'scale(1)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 50px rgba(255,255,255,0.2)',
                    borderRadius: 16,
                    background: 'rgba(0,0,0,0.5)',
                  }}>
                    {def ? <SkillCardDisplay card={def} /> : <div style={{color:'white', padding:'20px'}}>Missing {card.cardId}</div>}
                  </div>
                );
              })}
            </div>
          )}
          {tutorialData.position === 'left' && (
            <img
              src="/NPC/npc%20guide%20female.svg"
              alt="Guide"
              className="npc-commentator1-img"
              style={{
                bottom: '0', left: '0%', height: '85vh', maxHeight: '700px', zIndex: 10005,
                transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
                opacity: isFadingNPC ? 0 : 1,
                transform: isFadingNPC ? 'translateX(-20px)' : 'translateX(0)',
              }}
            />
          )}
          {tutorialData.position === 'right' && (
            <img
              src="/NPC/npc%20guide%20male.svg"
              alt="Guide"
              className="npc-commentator2-img"
              style={{
                bottom: '0', right: '0%', height: '85vh', maxHeight: '700px', zIndex: 10005,
                transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
                opacity: isFadingNPC ? 0 : 1,
                transform: isFadingNPC ? 'translateX(20px)' : 'translateX(0)',
              }}
            />
          )}

          <div
            className="npc-jrpg-dialog-box"
            style={{
              position: 'absolute', bottom: '4vh', left: '50%',
              transform: isFadingNPC ? 'translateX(-50%) translateY(10px)' : 'translateX(-50%) translateY(0px)',
              opacity: isFadingNPC ? 0 : 1,
              transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
              zIndex: 1000010,
            }}
          >
            <div className="npc-jrpg-speaker-tag" style={{ alignSelf: 'flex-start' }}>
              {tutorialData.speakerTitle}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div className="npc-jrpg-dialog-text">{tutorialData.text}</div>
            </div>
            <div className="npc-jrpg-dialog-footer">
              <div style={{
                color: 'rgba(26,16,8,0.5)', fontSize: '0.7rem', fontWeight: 800,
                textTransform: 'uppercase', animation: 'blink-text 1.5s infinite', letterSpacing: '0.05em',
              }}>
                Click anywhere to continue
                <span style={{ marginLeft: 8 }}>({tutorialStep}/8)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      <div style={{ minHeight: '100vh', paddingBottom: 100, background: 'transparent', overflowX: 'hidden' }}>
        <Navbar />
        <div style={{
          transform: wrapperTransform,
          transition: wrapperTransform === 'none' ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: 'center center',
          willChange: wrapperTransform === 'none' ? 'auto' : 'transform',
        }}>
          <main style={{ padding: '32px 0 80px' }}>
            <div className="container">

              {/* Back link */}
              <Link href="/contests" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                ← Back to Contests
              </Link>

              {/* ── Header ──────────────────────────────────────────────── */}
              <div style={{ marginBottom: 32 }}>
                <div id="lineup-header" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                    Tutorial Match — World Cup 2026
                  </h1>
                  <span className="badge badge--upcoming" style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                    DEMO MODE
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                  Pick your 5-a-side lineup (GK, DEF, MID, SWG, FWD) • Select a captain (2× pts) • Set confidence
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* ── Player card grid ────────────────────────────────── */}
                <div>
                  <div id="lineup-grid" style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center', marginBottom: 24 }}>
                    {SLOTS_LABELS.map((slotLabel, i) => {
                      const player = showFilledLineup ? TUTORIAL_PLAYERS[i] : null;
                      const isCaptain = player?.id === CAPTAIN_ID;
                      const scoreTop  = '16%';
                      const nameTop   = '67%';
                      const nationTop = '77%';
                      const posTop    = '86%';

                      return (
                        <div
                          key={i}
                          style={{
                            flex: '1 1 0px',
                            maxWidth: 220,
                            aspectRatio: '120/165',
                            backgroundImage: player ? "url('/card/Player%20Card%20(3).svg')" : 'none',
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            backgroundColor: player ? 'transparent' : 'rgba(255,255,255,0.01)',
                            border: player ? 'none' : '1.5px dashed rgba(255, 255, 255, 0.25)',
                            borderRadius: '0px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            boxShadow: player
                              ? (isCaptain ? '0px 0px 12px #ffd700' : '2px 2px 6px rgba(0,0,0,0.4)')
                              : 'none',
                          }}
                        >
                          {player ? (
                            <>
                              <PlayerAvatar
                                playerId={player.id}
                                name={player.name}
                                team={player.team}
                                variant="fill"
                                style={{ top: '25%', bottom: '38%', left: '8%', right: '8%', zIndex: 1 }}
                              />
                              {/* Rating */}
                              <div style={{
                                position: 'absolute', top: scoreTop, right: '12%', width: '18%',
                                textAlign: 'center',
                                color: player.rating >= 90 ? '#ca8a04' : (player.rating >= 85 ? '#15803d' : '#1e293b'),
                                fontFamily: 'Inter, sans-serif', fontStyle: 'normal',
                                fontSize: 'clamp(0.6rem, 1.5vw, 0.95rem)', fontWeight: 800, lineHeight: 1, zIndex: 2,
                              }}>
                                {player.rating}
                              </div>
                              {/* Name */}
                              <div style={{
                                position: 'absolute', top: nameTop, left: '43%', width: '52%',
                                textAlign: 'left', color: '#36220f',
                                fontSize: player.name.length > 15 ? 'clamp(0.36rem, 0.82vw, 0.46rem)'
                                  : player.name.length > 10 ? 'clamp(0.4rem, 0.92vw, 0.52rem)'
                                  : 'clamp(0.44rem, 1vw, 0.58rem)',
                                fontWeight: 700, fontFamily: 'Inter, sans-serif', fontStyle: 'normal',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', zIndex: 2,
                              }}>
                                {player.name}
                              </div>
                              {/* Team */}
                              <div style={{
                                position: 'absolute', top: nationTop, left: '43%', width: '52%',
                                textAlign: 'left', color: '#36220f',
                                fontSize: 'clamp(0.38rem, 0.88vw, 0.5rem)', fontWeight: 700,
                                fontFamily: 'Inter, sans-serif', fontStyle: 'normal',
                                display: 'flex', alignItems: 'center', gap: 6,
                                whiteSpace: 'nowrap', overflow: 'hidden', zIndex: 2,
                              }}>
                                <span>{player.teamFlag} {player.team}</span>
                              </div>
                              {/* Position */}
                              <div style={{
                                position: 'absolute', top: posTop, left: '43%',
                                fontSize: 'clamp(0.34rem, 0.8vw, 0.45rem)', fontWeight: 800,
                                fontFamily: 'Inter, sans-serif', color: '#fbf0b9',
                                textTransform: 'uppercase', zIndex: 2,
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ color: '#36220f' }}>
                                    {player.position === 'GK' ? 'Goalkeeper' :
                                     player.position === 'DEF' ? 'Defender' :
                                     player.position === 'MID' ? 'Midfielder' :
                                     player.position === 'SWG' ? 'Swinger' :
                                     player.position === 'ATT' ? 'Attacker' : player.position}
                                  </span>
                                  <span style={{
                                    background: player.position === 'GK' ? '#eab308' :
                                                player.position === 'DEF' ? '#2563eb' :
                                                player.position === 'MID' ? '#16a34a' :
                                                player.position === 'SWG' ? '#9333ea' :
                                                player.position === 'ATT' ? '#dc2626' : '#2d1b09',
                                    color: '#ffffff',
                                    padding: '1.5px 5px',
                                    borderRadius: '3px',
                                    border: `1px solid ${
                                                player.position === 'GK' ? '#fef08a' :
                                                player.position === 'DEF' ? '#93c5fd' :
                                                player.position === 'MID' ? '#86efac' :
                                                player.position === 'SWG' ? '#d8b4fe' :
                                                player.position === 'ATT' ? '#fca5a5' : '#7c5835'
                                    }`,
                                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.5)',
                                    textShadow: '0 1px 1px rgba(0,0,0,0.6)'
                                  }}>
                                    {player.position}
                                  </span>
                                </div>
                              </div>
                              {/* Captain badge */}
                              {isCaptain && (
                                <div style={{
                                  position: 'absolute', top: '-8%', left: '50%',
                                  transform: 'translateX(-50%)',
                                  background: 'linear-gradient(to bottom, #d32f2f 0%, #8b1e1e 100%)',
                                  border: '2px solid #ffffff', padding: '2px 6px', borderRadius: '0px',
                                  fontWeight: 700, fontFamily: 'Inter, -apple-system, sans-serif',
                                  fontSize: 'clamp(0.55rem, 1.4vw, 0.8rem)', color: '#fff',
                                  textShadow: '0px 1px 1px rgba(0,0,0,0.5)',
                                  boxShadow: '0 0 0 1px #000000, 1px 2px 4px rgba(0,0,0,0.30)',
                                  zIndex: 10,
                                }}>CAPTAIN</div>
                              )}
                            </>
                          ) : (
                            <>
                              <div style={{ opacity: 0.3, fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 900 }}>+</div>
                              <div style={{
                                marginTop: 4, fontSize: 'clamp(0.75rem, 1.6vw, 0.95rem)',
                                fontWeight: 800, fontFamily: 'Bebas Neue, cursive', fontStyle: 'italic',
                              }}>
                                {slotLabel}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Bottom stacked panels ────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto', width: '100%' }}>

                  {/* Skill Card section */}
                  {showFilledLineup && tutorialStep !== 8 && (
                    <div className="ro-window" id="skill-card-section" style={{ maxWidth: 650, margin: '0 auto', width: '100%' }}>
                      <div className="ro-window__header">
                        <span>🎴 Skill Card Equipment</span>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Equip before kickoff — locked at match start</span>
                      </div>
                      <div className="ro-window__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4, lineHeight: 1.5 }}>
                          Equip a Skill Card to each player for bonus points.
                          {' '}<a href="/cards" style={{ color: '#ffd700', fontWeight: 700 }}>View My Collection →</a>
                        </div>
                        {skillCardRows.map(({ player, equippedCardDef }) => (
                          <div key={player.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 12px',
                            background: equippedCardDef ? `${RARITY_COLOR[equippedCardDef.rarity]}0d` : 'rgba(255,255,255,0.03)',
                            border: equippedCardDef ? `1px solid ${RARITY_COLOR[equippedCardDef.rarity]}33` : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 8, flexWrap: 'wrap',
                          }}>
                            <div style={{ flex: 1, minWidth: 80 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{player.name}</div>
                              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{player.position}</div>
                            </div>
                            {equippedCardDef ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 2 }}>
                                <div style={{
                                  background: `${RARITY_COLOR[equippedCardDef.rarity]}22`,
                                  border: `1px solid ${RARITY_COLOR[equippedCardDef.rarity]}55`,
                                  borderRadius: 6, padding: '4px 10px',
                                  display: 'flex', flexDirection: 'column', gap: 1,
                                }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: RARITY_COLOR[equippedCardDef.rarity] }}>{equippedCardDef.name}</span>
                                  <span style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.45)' }}>{equippedCardDef.effectText}</span>
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No card equipped</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confidence panel */}
                  {showFilledLineup && (
                    <div className="ro-window" id="confidence-panel">
                      <div className="ro-window__header">
                        <span>Confidence Rating</span>
                        <span>⭐</span>
                      </div>
                      <div className="ro-window__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{
                          padding: '10px 14px',
                          background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)',
                          borderRadius: 6, fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6,
                        }}>
                          <span style={{ color: '#ffd700', fontWeight: 700 }}>⭐ Confidence Multiplier:</span>{' '}
                          Rate your confidence in each player (1–5 stars). The higher the rating, the more points you earn — but also the bigger the penalty if the player underperforms.
                          <br />
                          <span style={{ color: '#94a3b8' }}>1★ = ×1.1 &nbsp;|&nbsp; 3★ = ×1.3 &nbsp;|&nbsp; 5★ = ×1.5</span>
                        </div>
                        {TUTORIAL_PLAYERS.map(p => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <FlagImage flag={p.teamFlag} size={16} />
                              <span style={{ fontSize: '0.85rem', fontWeight: p.id === CAPTAIN_ID ? 700 : 400 }}>
                                {p.name}
                                {p.id === CAPTAIN_ID && (
                                  <span style={{ color: '#ffd700', marginLeft: 6, fontSize: '0.75rem', fontWeight: 700 }}>© CAPTAIN</span>
                                )}
                              </span>
                            </div>
                            <StarRating value={TUTORIAL_CONFIDENCE[p.id] ?? 3} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recruitment terminal */}
                  {!showFilledLineup && (
                    <div className="ro-window" id="recruitment-terminal">
                      <div className="ro-window__header">
                        <span>Recruitment Terminal</span>
                        <span>👥</span>
                      </div>
                      <div className="ro-window__body" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 12 }}>👆</div>
                        Click an empty slot to select a player
                      </div>
                    </div>
                  )}
                  {showFilledLineup && (
                    <div className="ro-window" id="recruitment-terminal">
                      <div className="ro-window__header">
                        <span>Recruitment Terminal</span>
                        <span>✅</span>
                      </div>
                      <div className="ro-window__body" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>✔</div>
                        Demo squad is fully recruited
                      </div>
                    </div>
                  )}

                  {/* Submit button */}
                  <div id="submit-button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: '100%', maxWidth: 560 }}>
                      <button
                        disabled
                        style={{
                          width: '100%', padding: '16px 32px',
                          fontFamily: 'Bebas Neue, cursive', fontSize: '1.4rem', letterSpacing: '0.1em',
                          background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)',
                          border: '2px solid rgba(255,255,255,0.15)', borderRadius: 4, cursor: 'not-allowed',
                        }}
                      >
                        LOCK IN LINEUP — 0.1 SOL
                      </button>
                      <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                        Demo mode — real entry available on the Match Schedule
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
