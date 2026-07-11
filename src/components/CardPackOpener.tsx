'use client';

// CardPackOpener — two-phase card pack opening animation.
// Phase 1: Shows Unopened Card.svg (the pack) — user taps to open.
// Phase 2: Flip animation → reveals Opened Card.svg with card data overlaid via SkillCardDisplay.

import { useState, useEffect } from 'react';
import { type SkillCard, RARITY_COLOR, RARITY_STARS } from '@/lib/skill-cards';
import type { OwnedCard, OwnedUpgradeCard } from '@/lib/card-collection';
import { type UpgradeCard, UPGRADE_RARITY_COLOR } from '@/lib/upgrade-cards';
import SkillCardDisplay from './SkillCardDisplay';
import UpgradeCardDisplay from './UpgradeCardDisplay';

// Module-level cache so the 4.4MB SVG is only fetched once per session.
// <img> sandboxes SVGs and blocks embedded base64 <image> elements;
// <object> respects the SVG's own width/height attrs (1080×1350) and ignores CSS sizing.
// Fetching + inlining as HTML is the only reliable cross-browser approach.
let _svgCache: string | null = null;
let _svgFetch: Promise<string> | null = null;
function fetchUnopenedSvg(): Promise<string> {
  if (_svgCache) return Promise.resolve(_svgCache);
  if (!_svgFetch) {
    _svgFetch = fetch('/card/unopened%20card.svg')
      .then(r => r.text())
      .then(text => {
        // Strip the fixed pixel dimensions from the root <svg> tag so it fills its CSS container.
        _svgCache = text.replace(/<svg([^>]*?)width="[^"]*"([^>]*?)height="[^"]*"/, '<svg$1width="100%"$2height="100%"');
        return _svgCache;
      });
  }
  return _svgFetch;
}

interface CardPackOpenerProps {
  contestId?: string;
  upgradePackMode?: boolean;
  title?: string;
  subtitle?: string;
  subtitleIdle?: string;
  primaryButtonText?: string;
  onOpen: () => { instance?: OwnedCard; card?: SkillCard; upgradeInstance?: OwnedUpgradeCard; upgradeCard?: UpgradeCard };
  onClose: () => void;
}

type Phase = 'idle' | 'shaking' | 'flip-out' | 'flip-in' | 'done';

export default function CardPackOpener({ contestId, upgradePackMode, title, subtitle, subtitleIdle, primaryButtonText, onOpen, onClose }: CardPackOpenerProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [unopenedSvg, setUnopenedSvg] = useState<string>('');
  const [revealedCard, setRevealedCard] = useState<SkillCard | null>(null);
  const [revealedUpgradeCard, setRevealedUpgradeCard] = useState<UpgradeCard | null>(null);
  const [bonusUpgradeCard, setBonusUpgradeCard] = useState<UpgradeCard | null>(null);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; size: number }[]>([]);

  const CARD_W = 220; // card display width in px

  const handleOpenPack = () => {
    if (phase !== 'idle') return;

    // Phase 1: shake the pack
    setPhase('shaking');

    setTimeout(() => {
      // Phase 2: flip the pack face-out
      setPhase('flip-out');

      // Roll the card at the midpoint of the flip (when invisible)
      setTimeout(() => {
        const result = onOpen();
        
        if (upgradePackMode) {
          if (result.upgradeCard) setRevealedUpgradeCard(result.upgradeCard);
        } else {
          if (result.card) setRevealedCard(result.card);
          if (result.upgradeCard) {
            setBonusUpgradeCard(result.upgradeCard);
          }
        }

        // Spawn rarity-coloured particles
        const activeCard = upgradePackMode ? result.upgradeCard : result.card;
        const color = activeCard ? (upgradePackMode ? UPGRADE_RARITY_COLOR[activeCard.rarity as keyof typeof UPGRADE_RARITY_COLOR] : RARITY_COLOR[activeCard.rarity as keyof typeof RARITY_COLOR]) : '#ffd700';
        
        setParticles(
          Array.from({ length: 24 }, (_, i) => ({
            id: i,
            x: 30 + Math.random() * 40,
            y: 30 + Math.random() * 40,
            color: i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? color : '#ffffff',
            size: 3 + Math.random() * 7,
          }))
        );

        // Phase 3: flip in the revealed card
        setPhase('flip-in');

        setTimeout(() => {
          setPhase('done');
        }, 500);
      }, 350); // halfway through flip-out (700ms total)
    }, 1000); // shake duration
  };

  // Clear particles after burst
  useEffect(() => {
    if (phase === 'flip-in') {
      const t = setTimeout(() => setParticles([]), 1800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Fetch and cache the unopened card SVG on first mount.
  useEffect(() => {
    fetchUnopenedSvg().then(setUnopenedSvg).catch(() => {});
  }, []);

  const rarityColor = revealedCard ? RARITY_COLOR[revealedCard.rarity as keyof typeof RARITY_COLOR] : revealedUpgradeCard ? UPGRADE_RARITY_COLOR[revealedUpgradeCard.rarity as keyof typeof UPGRADE_RARITY_COLOR] : '#ffd700';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.90)',
      backdropFilter: 'blur(10px)',
      zIndex: 9000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#ffd700',
          letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8,
        }}>
          {title || '🎴 Match Reward'}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', textShadow: '0 0 24px rgba(255,215,0,0.5)' }}>
          {phase === 'done' && (revealedCard || revealedUpgradeCard) ? `${revealedCard?.name || revealedUpgradeCard?.name} Obtained!` : (subtitle || 'You Earned a Card Pack!')}
        </div>
        {phase === 'done' && (revealedCard || revealedUpgradeCard) && (
          <div style={{
            fontSize: 13, marginTop: 6, fontWeight: 700,
            color: rarityColor, textShadow: `0 0 10px ${rarityColor}`,
            letterSpacing: 2, textTransform: 'uppercase',
          }}>
            {revealedCard && revealedCard.rarity}
            {revealedUpgradeCard && revealedUpgradeCard.rarity}
          </div>
        )}
        {phase === 'idle' && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
            {subtitleIdle || 'A reward for participating in this match'}
          </div>
        )}
      </div>

      {/* Cards stage */}
      <div style={{
        display: 'flex',
        gap: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        flexWrap: 'wrap',
      }}>
        
        {/* Main Card */}
        <div style={{ position: 'relative' }}>
          {/* Particle burst */}
          {particles.map(p => (
            <div key={p.id} style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.color,
              left: `${p.x}%`,
              top: `${p.y}%`,
              pointerEvents: 'none',
              animation: 'particleBurst 1.4s ease-out forwards',
              boxShadow: `0 0 4px ${p.color}`,
            }} />
          ))}

          {/* Flip container — perspective */}
          <div style={{
            width: CARD_W,
            height: Math.round(CARD_W * (1448 / 1086)),
            perspective: 900,
            position: 'relative',
          }}>
            {/* ── FRONT: Unopened Card (visible during idle / shake / flip-out) ── */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              transition: phase === 'flip-out' ? 'transform 0.7s cubic-bezier(0.4,0,0.6,1)' : undefined,
              transform: phase === 'flip-out' || phase === 'flip-in' || phase === 'done'
                ? 'rotateY(90deg)'
                : 'rotateY(0deg)',
              animation: phase === 'shaking' ? 'shake 0.25s ease-in-out infinite' : undefined,
              cursor: phase === 'idle' ? 'pointer' : 'default',
            }} onClick={handleOpenPack}>
              {/* Inline SVG via fetch — the only reliable approach for SVGs with embedded
                  base64 <image> elements. <img> sandboxes them; <object> ignores CSS sizing
                  because the SVG declares its own width/height. Fetched once, cached in memory. */}
              <div
                aria-label="Card Pack"
                dangerouslySetInnerHTML={{ __html: unopenedSvg }}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  filter: phase === 'idle'
                    ? 'drop-shadow(0 0 18px rgba(255,215,0,0.5))'
                    : phase === 'shaking'
                    ? 'drop-shadow(0 0 28px rgba(255,215,0,0.8)) brightness(1.1)'
                    : 'none',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  overflow: 'hidden',
                }}
              />
              {/* Tap prompt overlay */}
              {phase === 'idle' && (
                <div style={{
                  position: 'absolute',
                  bottom: '8%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#ffd700',
                  color: '#000',
                  fontWeight: 900,
                  fontSize: 12,
                  padding: '8px 22px',
                  borderRadius: 24,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  animation: 'pulse 1.6s ease infinite',
                  whiteSpace: 'nowrap',
                }}>
                  Tap to Open
                </div>
              )}
              {phase === 'shaking' && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  animation: 'pulse 0.25s ease infinite',
                }}>
                  ✨
                </div>
              )}
            </div>

            {/* ── BACK: Opened Card with skill card data overlaid ── */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              transition: phase === 'flip-in' ? 'transform 0.5s cubic-bezier(0.2,0.9,0.5,1)' : undefined,
              transform: phase === 'flip-in' || phase === 'done'
                ? 'rotateY(0deg)'
                : 'rotateY(-90deg)',
            }}>
              {revealedCard && (
                <SkillCardDisplay
                  card={revealedCard}
                  width={CARD_W}
                />
              )}
              {revealedUpgradeCard && (
                <UpgradeCardDisplay
                  card={revealedUpgradeCard}
                  width={CARD_W}
                />
              )}
            </div>
          </div>
        </div>

        {/* Bonus Upgrade Card (rendered side-by-side) */}
        {phase === 'done' && bonusUpgradeCard && (
          <div style={{
            width: CARD_W,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'fadeInScale 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s both',
          }}>
            <div style={{ 
              position: 'absolute', top: -32,
              fontSize: 13, fontWeight: 900, letterSpacing: '0.15em', 
              color: UPGRADE_RARITY_COLOR[bonusUpgradeCard.rarity], textTransform: 'uppercase', 
              textShadow: `0 0 12px ${UPGRADE_RARITY_COLOR[bonusUpgradeCard.rarity]}66` 
            }}>
              🎁 Bonus Drop!
            </div>
            
            <UpgradeCardDisplay card={bonusUpgradeCard} width={CARD_W} />
          </div>
        )}
      </div>

      {/* Post-reveal actions */}
      {phase === 'done' && (revealedCard || revealedUpgradeCard) && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          animation: 'fadeInUp 0.4s ease 0.1s both',
        }}>
          {primaryButtonText ? (
            <button
              onClick={() => onClose()}
              style={{
                padding: '16px 48px',
                background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontSize: 15,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: `0 4px 12px rgba(33, 150, 243, 0.4)`,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {primaryButtonText}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => onClose()}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 10,
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <button
                onClick={() => { window.location.href = '/cards'; }}
                style={{
                  padding: '12px 24px',
                  background: rarityColor,
                  border: 'none',
                  borderRadius: 10,
                  color: '#000',
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: 'pointer',
                  letterSpacing: 0.5,
                }}
              >
                View My Collection →
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          20%       { transform: rotate(-3deg) translateX(-5px); }
          40%       { transform: rotate(3deg)  translateX(5px); }
          60%       { transform: rotate(-2deg) translateX(-3px); }
          80%       { transform: rotate(2deg)  translateX(3px); }
        }
        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) scale(1);    opacity: 1; }
          50%       { transform: translateX(-50%) scale(1.07); opacity: 0.85; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes particleBurst {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(
                    calc((var(--i, 0.5) - 0.5) * 200px),
                    calc((var(--j, 0.5) - 0.5) * 200px)
                  ) scale(0); opacity: 0; }
        }
        @keyframes fadeInScale {
          0%   { opacity: 0; transform: scale(0.9) translateX(-20px); }
          100% { opacity: 1; transform: scale(1) translateX(0); }
        }
      `}</style>
    </div>
  );
}
