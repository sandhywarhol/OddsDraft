'use client';

// SkillCardDisplay — overlays card data onto the Opened Card.svg template.
//
// The Opened Card.svg viewBox is 810 × 1012.5 units.
// Text zones sit INSIDE the blank boxes that appear BELOW each printed label badge:
//   • Rarity box (top-right) : top 5%,    right 5%,   width 26%
//   • Skill Name text box     : top 67%,   left 10%,   width 52%
//   • Position text box       : top 73.5%, left 10%,   width 52%
//   • Description text area   : top 80.5%, left 10%,   width 62%

import { type SkillCard, RARITY_COLOR } from '@/lib/skill-cards';
import type { OwnedCard } from '@/lib/card-collection';

interface SkillCardDisplayProps {
  card: SkillCard;
  instance?: OwnedCard;
  /** Width of the card in px. Height is calculated at 810:1012.5 ratio. */
  width?: number;
  equipped?: boolean;
  onEquip?: () => void;
  onUnequip?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export default function SkillCardDisplay({
  card,
  instance,
  width = 200,
  equipped = false,
  onEquip,
  onUnequip,
  selectable = false,
  selected = false,
  onSelect,
}: SkillCardDisplayProps) {
  const height = Math.round(width * (1012.5 / 810));
  const rarityColor = RARITY_COLOR[card.rarity];

  // Font sizes scale with card width
  const fs = (base: number) => `${(base * width) / 200}px`;

  return (
    <div
      onClick={selectable ? onSelect : undefined}
      style={{
        position: 'relative',
        width,
        height,
        flexShrink: 0,
        cursor: selectable ? 'pointer' : 'default',
        transition: 'transform 0.15s ease',
        transform: selected ? 'scale(1.04)' : 'scale(1)',
      }}
    >
      <style>{`
        @keyframes card-sweep-shine {
          0% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
          15% { opacity: 0.6; }
          30% { transform: translateX(200%) skewX(-25deg); opacity: 0; }
          100% { transform: translateX(200%) skewX(-25deg); opacity: 0; }
        }
      `}</style>

      {/* The skill card image — one unique JPG per card */}
      <img
        src={`/card/Skill Card/${card.name}.jpg`}
        alt={card.name}
        draggable={false}
        onError={e => { (e.target as HTMLImageElement).src = '/Opened Card.svg'; }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '4%',
          userSelect: 'none',
          filter: equipped
            ? `drop-shadow(0 0 ${width * 0.06}px ${rarityColor})`
            : selected
            ? `drop-shadow(0 0 ${width * 0.08}px #fff)`
            : `drop-shadow(0 0 ${width * 0.04}px ${rarityColor}88)`,
        }}
      />

      {/* ── EQUIPPED badge (top-left corner of card) ─────────────────────────── */}
      {equipped && (
        <div style={{
          position: 'absolute',
          top: '1.5%',
          left: '7%',
          background: '#4caf50',
          color: '#fff',
          fontSize: fs(5.5),
          fontWeight: 800,
          padding: '1px 5px',
          borderRadius: 4,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          EQUIPPED
        </div>
      )}

      {/* ── SELECTED badge ───────────────────────────────────────────────────── */}
      {selected && !equipped && (
        <div style={{
          position: 'absolute',
          top: '1.5%',
          left: '7%',
          background: '#2196f3',
          color: '#fff',
          fontSize: fs(5.5),
          fontWeight: 800,
          padding: '1px 5px',
          borderRadius: 4,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          SELECTED
        </div>
      )}

      {/* ── SHINE / HOLO EFFECT ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        borderRadius: '5%', // clip to card border roughly
        zIndex: 5,
      }}>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0,
          width: '60%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
          animation: 'card-sweep-shine 5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          animationDelay: `${(card.name.length % 5) * 0.5}s`, // pseudo-random delay based on name length to stagger the shines
        }} />
      </div>

      {/* ── Action buttons below card ─────────────────────────────────────────── */}
      {(onEquip || onUnequip) && (
        <div style={{
          position: 'absolute',
          bottom: '-36px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}>
          {equipped && onUnequip ? (
            <button
              onClick={e => { e.stopPropagation(); onUnequip(); }}
              style={{
                padding: '4px 12px',
                background: 'rgba(244,67,54,0.15)',
                border: '1px solid #f44336',
                borderRadius: 6,
                color: '#ef9a9a',
                fontSize: fs(6.5),
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              UNEQUIP
            </button>
          ) : !equipped && onEquip ? (
            <button
              onClick={e => { e.stopPropagation(); onEquip(); }}
              style={{
                padding: '4px 12px',
                background: `${rarityColor}22`,
                border: `1px solid ${rarityColor}`,
                borderRadius: 6,
                color: rarityColor,
                fontSize: fs(6.5),
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              EQUIP
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
