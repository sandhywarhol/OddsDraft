'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import SkillCardDisplay from '@/components/SkillCardDisplay';
import {
  getCollectionWithDefs,
  equipCard,
  getEquippedCardInstance,
  combineCards,
  canCombine,
  type OwnedCard,
} from '@/lib/card-collection';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  RARITY_ORDER,
  RARITY_COLOR,
  RARITY_STARS,
  SKILL_CARDS,
  type Rarity,
  type CardPosition,
  type SkillCard,
} from '@/lib/skill-cards';

type SortKey = 'newest' | 'rarity' | 'name';
type FilterPos = 'all' | CardPosition;
type FilterRarity = 'all' | Rarity;

const POSITION_FILTERS: { label: string; value: FilterPos }[] = [
  { label: 'All', value: 'all' },
  { label: 'GK',  value: 'Goalkeeper' },
  { label: 'DEF', value: 'Defender' },
  { label: 'MID', value: 'Midfielder' },
  { label: 'WIN', value: 'Winger' },
  { label: 'STR', value: 'Striker' },
];

// Card detail overlay — enlarged card + full info + equip shortcut
function CardDetailModal({
  card,
  instance,
  onClose,
  onEquip,
}: {
  card: SkillCard;
  instance: OwnedCard;
  onClose: () => void;
  onEquip: () => void;
}) {
  const rarityColor = RARITY_COLOR[card.rarity];
  const rarityLabel = RARITY_STARS[card.rarity];

  const posColor =
    card.position === 'Goalkeeper' ? '#1565c0' :
    card.position === 'Defender'   ? '#2e7d32' :
    card.position === 'Midfielder' ? '#e65100' :
    card.position === 'Winger'     ? '#00838f' : '#6a1b9a';

  const colorizeEffect = (text: string) =>
    text.split(/(\+[\d.]+|-[\d.]+)/).map((chunk, i) => {
      if (/^\+[\d.]+/.test(chunk)) return <span key={i} style={{ color: '#4ade80', fontWeight: 900 }}>{chunk}</span>;
      if (/^-[\d.]+/.test(chunk))  return <span key={i} style={{ color: '#f87171', fontWeight: 900 }}>{chunk}</span>;
      return chunk;
    });

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 720,
        }}
      >
        {/* Enlarged card */}
        <SkillCardDisplay card={card} instance={instance} width={280} />

        {/* Info panel */}
        <div style={{ minWidth: 240, flex: 1 }}>
          {/* Rarity badge */}
          <div style={{
            display: 'inline-block',
            padding: '3px 12px', borderRadius: 4,
            background: `${rarityColor}22`,
            border: `1px solid ${rarityColor}66`,
            color: rarityColor,
            fontSize: 11, fontWeight: 900,
            letterSpacing: '0.12em',
            marginBottom: 12,
            textShadow: `0 0 6px ${rarityColor}88`,
          }}>
            {rarityLabel}
          </div>

          {/* Card name */}
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 6, lineHeight: 1.1 }}>
            {card.name}
          </div>

          {/* Position */}
          <div style={{ marginBottom: 20 }}>
            <span style={{
              background: posColor,
              color: '#fff',
              fontSize: 11, fontWeight: 900,
              padding: '3px 10px', borderRadius: 3,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {card.position}
            </span>
          </div>

          {/* Lore section */}
          <div style={{
            marginBottom: 18,
            background: `linear-gradient(135deg, ${rarityColor}0d, rgba(0,0,0,0.4))`,
            border: `1px solid ${rarityColor}33`,
            borderRadius: 8,
            padding: '14px 16px',
          }}>
            <div style={{
              fontSize: 9, fontWeight: 900, letterSpacing: '0.18em',
              color: rarityColor, fontFamily: '"Cinzel Decorative", Cinzel, serif',
              marginBottom: 8, textTransform: 'uppercase',
              textShadow: `0 0 8px ${rarityColor}88`,
            }}>
              ◆ Lore ◆
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(255,255,255,0.6)',
              fontStyle: 'italic', lineHeight: 1.7,
            }}>
              "{card.flavorText}"
            </div>
          </div>

          {/* Ability / effect */}
          <div style={{
            marginBottom: 24,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 8,
            padding: '12px 16px',
          }}>
            <div style={{
              fontSize: 9, fontWeight: 900, letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.35)', marginBottom: 8, textTransform: 'uppercase',
            }}>
              Ability
            </div>
            <div style={{
              fontSize: 14, fontWeight: 600,
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.6,
            }}>
              {colorizeEffect(card.effectText)}
            </div>
          </div>

          {/* Obtained */}
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 24 }}>
            Obtained {new Date(instance.obtainedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onEquip}
              style={{
                flex: 1, padding: '12px 0',
                background: `linear-gradient(135deg, ${rarityColor}cc, ${rarityColor}88)`,
                border: `1px solid ${rarityColor}`,
                borderRadius: 8,
                color: '#fff', fontWeight: 800, fontSize: 13,
                cursor: 'pointer', letterSpacing: '0.06em',
              }}
            >
              EQUIP CARD
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Equip modal: picks an upcoming contest lineup to equip into
function EquipModal({
  card,
  instance,
  onClose,
}: {
  card: SkillCard;
  instance: OwnedCard;
  onClose: () => void;
}) {
  const [lineups, setLineups] = useState<{ contestId: string; homeTeam: string; awayTeam: string; players: { id: string; name: string; position: string }[] }[]>([]);
  const [selectedLineup, setSelectedLineup] = useState<string>('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const found: typeof lineups = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('txodds_user_lineup_')) continue;
      try {
        const data = JSON.parse(localStorage.getItem(key) ?? '{}');
        if (!data.players?.length) continue;
        const contestId = key.replace('txodds_user_lineup_', '');
        found.push({
          contestId,
          homeTeam: data.players[0]?.team ?? contestId,
          awayTeam: contestId,
          players: (data.players as { id: string; name: string; position: string }[]) ?? [],
        });
      } catch {}
    }
    setLineups(found);
  }, []);

  const selectedLineupObj = lineups.find(l => l.contestId === selectedLineup);

  // Map card position → lineup player position codes
  const posMap: Record<CardPosition, string[]> = {
    Goalkeeper: ['GK'],
    Defender:   ['DEF'],
    Midfielder: ['MID'],
    Winger:     ['ATT'],
    Striker:    ['ATT'],
  };
  const allowedPositions = posMap[card.position] ?? [];
  const eligiblePlayers = selectedLineupObj?.players.filter(p => allowedPositions.includes(p.position)) ?? [];

  const handleEquip = () => {
    if (!selectedLineup || !selectedPlayer) return;
    equipCard(selectedLineup, selectedPlayer, instance.instanceId);
    setDone(true);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(6px)', zIndex: 8000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#0f1929', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 28, maxWidth: 420, width: '100%',
      }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#4caf50', marginBottom: 8 }}>Card Equipped!</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
              {card.name} has been equipped to the selected player.
            </div>
            <button onClick={onClose} style={{
              padding: '10px 24px', background: '#4caf50', border: 'none',
              borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer',
            }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
              Equip: {card.name}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
              Choose a lineup and player to assign this card to
            </div>

            {lineups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                No saved lineups found.{' '}
                <Link href="/contests" style={{ color: '#ffd700' }}>Browse contests →</Link>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: 1 }}>SELECT LINEUP</div>
                  {lineups.map(l => (
                    <button
                      key={l.contestId}
                      onClick={() => { setSelectedLineup(l.contestId); setSelectedPlayer(''); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 14px', marginBottom: 6,
                        background: selectedLineup === l.contestId ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                        border: selectedLineup === l.contestId ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      Contest #{l.contestId.slice(-6)} — {l.players.length} players
                    </button>
                  ))}
                </div>

                {selectedLineup && eligiblePlayers.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: 1 }}>
                      SELECT PLAYER ({card.position.toUpperCase()})
                    </div>
                    {eligiblePlayers.map(p => {
                      const alreadyHasCard = !!getEquippedCardInstance(selectedLineup, p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPlayer(p.id)}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '10px 14px', marginBottom: 6,
                            background: selectedPlayer === p.id ? 'rgba(33,150,243,0.15)' : 'rgba(255,255,255,0.05)',
                            border: selectedPlayer === p.id ? '1px solid #2196f3' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer',
                          }}
                        >
                          {p.name}
                          {alreadyHasCard && (
                            <span style={{ fontSize: 10, color: '#ff9800', marginLeft: 8 }}>card equipped</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedLineup && eligiblePlayers.length === 0 && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
                    No eligible {card.position} players in this lineup.
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{
                padding: '10px 20px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer',
              }}>
                Cancel
              </button>
              {selectedLineup && selectedPlayer && (
                <button onClick={handleEquip} style={{
                  padding: '10px 20px', background: '#ffd700', border: 'none',
                  borderRadius: 8, color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>
                  Equip Card
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// CombineModal — shows 2 copies of a card + combine action → reveals next-rarity result
function CombineModal({
  card,
  onClose,
  onSuccess,
}: {
  card: SkillCard;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [phase, setPhase] = useState<'confirm' | 'combining' | 'done'>('confirm');
  const [resultCard, setResultCard] = useState<SkillCard | null>(null);

  const currentRarityIdx = RARITY_ORDER.indexOf(card.rarity);
  const nextRarity: Rarity = RARITY_ORDER[currentRarityIdx + 1];
  const rarityColor = RARITY_COLOR[card.rarity];
  const nextRarityColor = RARITY_COLOR[nextRarity];

  const handleCombine = () => {
    setPhase('combining');
    setTimeout(() => {
      const res = combineCards(card.id);
      if (res.success && res.resultCard) {
        setResultCard(res.resultCard);
        setPhase('done');
      } else {
        setPhase('confirm');
      }
    }, 1800);
  };

  return (
    <div
      onClick={phase === 'done' ? undefined : onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 9100,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, textAlign: 'center' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#ffd700', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
            Card Combine
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>
            {phase === 'done' && resultCard ? `${resultCard.name} Obtained!` : `Combine 2× ${card.name}`}
          </div>
          {phase === 'done' && resultCard && (
            <div style={{ fontSize: 13, marginTop: 6, fontWeight: 700, color: nextRarityColor, textTransform: 'uppercase', letterSpacing: 2 }}>
              {RARITY_STARS[resultCard.rarity]} {resultCard.rarity} — {resultCard.position}
            </div>
          )}
        </div>

        {/* Combine animation area */}
        {phase !== 'done' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
            {/* Source card ×2 */}
            {[0, 1].map(i => (
              <div key={i} style={{
                width: '100%',
                maxWidth: 140,
                flex: 1,
                opacity: phase === 'combining' ? 0.4 : 1,
                transition: 'opacity 0.6s ease',
              }}>
                <SkillCardDisplay
                  card={card}
                  width={140}
                />
              </div>
            ))}

            {/* Arrow */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                fontSize: phase === 'combining' ? '2rem' : '1.5rem',
                transition: 'font-size 0.3s',
                animation: phase === 'combining' ? 'pulse 0.6s ease infinite' : undefined,
              }}>
                {phase === 'combining' ? '✨' : '→'}
              </div>
              {phase === 'combining' && (
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Combining…</div>
              )}
            </div>

            {/* Result slot */}
            <div style={{
              width: '100%', maxWidth: 140, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 'auto',
            }}>
              <div style={{
                width: '100%', height: 'auto', aspectRatio: '1086 / 1448', borderRadius: 16,
                background: phase === 'combining'
                  ? `linear-gradient(135deg, ${nextRarityColor}33, rgba(0,0,0,0.6))`
                  : 'rgba(255,255,255,0.04)',
                border: `2px dashed ${phase === 'combining' ? nextRarityColor : 'rgba(255,255,255,0.15)'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.6s ease',
                boxShadow: phase === 'combining' ? `0 0 24px ${nextRarityColor}55` : 'none',
                animation: phase === 'combining' ? 'pulse 0.8s ease infinite' : undefined,
              }}>
                {phase === 'combining' ? (
                  <>
                    <div style={{ fontSize: 28 }}>✨</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: nextRarityColor, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {nextRarity}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 28, opacity: 0.3 }}>?</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Result</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: nextRarityColor, textTransform: 'uppercase' }}>{nextRarity}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Result reveal */}
        {phase === 'done' && resultCard && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <SkillCardDisplay card={resultCard} width={200} />
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', maxWidth: 320 }}>
              {resultCard.effectText}
            </div>
          </div>
        )}

        {/* Info text */}
        {phase === 'confirm' && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 24, lineHeight: 1.6 }}>
            Combining 2 copies of <strong style={{ color: rarityColor }}>{card.name}</strong> will produce
            1 random <strong style={{ color: nextRarityColor }}>{nextRarity}</strong> {card.position} card.
            The 2 source cards will be consumed.
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {phase === 'confirm' && (
            <>
              <button onClick={onClose} style={{
                padding: '12px 24px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10,
                color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={handleCombine} style={{
                padding: '12px 28px',
                background: `linear-gradient(135deg, ${rarityColor}, ${nextRarityColor})`,
                border: 'none', borderRadius: 10,
                color: '#000', fontWeight: 900, fontSize: 13, cursor: 'pointer',
                letterSpacing: 0.5,
              }}>
                ⚗️ Combine Cards
              </button>
            </>
          )}
          {phase === 'done' && (
            <button onClick={() => { onSuccess(); onClose(); }} style={{
              padding: '12px 32px',
              background: nextRarityColor,
              border: 'none', borderRadius: 10,
              color: '#000', fontWeight: 900, fontSize: 13, cursor: 'pointer',
            }}>
              Add to Collection →
            </button>
          )}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.06); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function CardsPage() {
  const { connected } = useWallet();
  const [allCards, setAllCards] = useState<{ instance: OwnedCard; card: SkillCard }[]>([]);
  const [filterPos, setFilterPos] = useState<FilterPos>('all');
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [equipTarget, setEquipTarget] = useState<{ instance: OwnedCard; card: SkillCard } | null>(null);
  const [viewTarget, setViewTarget] = useState<{ instance: OwnedCard; card: SkillCard } | null>(null);
  const [combineTarget, setCombineTarget] = useState<SkillCard | null>(null);
  const [shimmerIds, setShimmerIds] = useState<Set<string>>(new Set());

  const handleCardClick = (instance: OwnedCard, card: SkillCard) => {
    setShimmerIds(prev => new Set(prev).add(instance.instanceId));
    setTimeout(() => {
      setShimmerIds(prev => { const s = new Set(prev); s.delete(instance.instanceId); return s; });
      setViewTarget({ instance, card });
    }, 380);
  };

  const reload = useCallback(() => {
    setAllCards(getCollectionWithDefs());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = allCards
    .filter(({ card }) => filterPos === 'all' || card.position === filterPos)
    .filter(({ card }) => filterRarity === 'all' || card.rarity === filterRarity)
    .sort((a, b) => {
      if (sortKey === 'newest') {
        const timeDiff = new Date(b.instance.obtainedAt).getTime() - new Date(a.instance.obtainedAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        // fallback to rarity
        const rDiff = RARITY_ORDER.indexOf(b.card.rarity) - RARITY_ORDER.indexOf(a.card.rarity);
        if (rDiff !== 0) return rDiff;
        return a.card.name.localeCompare(b.card.name);
      }
      if (sortKey === 'rarity') {
        const rDiff = RARITY_ORDER.indexOf(b.card.rarity) - RARITY_ORDER.indexOf(a.card.rarity);
        if (rDiff !== 0) return rDiff;
        return a.card.name.localeCompare(b.card.name);
      }
      return a.card.name.localeCompare(b.card.name);
    });

  const rarityCount: Partial<Record<Rarity, number>> = {};
  allCards.forEach(({ card }) => {
    rarityCount[card.rarity] = (rarityCount[card.rarity] ?? 0) + 1;
  });
  const rareCount = allCards.filter(({ card }) => RARITY_ORDER.indexOf(card.rarity) >= 4).length;

  // Count copies per cardId to identify combinable duplicates
  const cardIdCount: Record<string, number> = {};
  allCards.forEach(({ instance }) => {
    cardIdCount[instance.cardId] = (cardIdCount[instance.cardId] ?? 0) + 1;
  });

  return (
    <main style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <div className="contests-header-banner" style={{
          marginBottom: 40,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20,
          position: 'relative',
          padding: '54px 40px',
          minHeight: 340,
          border: '2px solid #ffd700',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {/* Sharp Background Image (Base) */}
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            backgroundImage: 'url("/card_skill.webp")',
            backgroundSize: 'cover',
            backgroundPosition: 'top',
            opacity: 1,
            pointerEvents: 'none',
          }} />

          {/* Blurred Background Image Overlay (Left to Center only) */}
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            backgroundImage: 'url("/card_skill.webp")',
            backgroundSize: 'cover',
            backgroundPosition: 'top',
            filter: 'blur(3px)',
            opacity: 1,
            pointerEvents: 'none',
            WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 65%)',
            maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 65%)',
          }} />

          {/* Light gradient overlay to ensure text readability without being too dark */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
            background: 'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 60%)',
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
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
                Fantasy Skill Cards
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 8, lineHeight: 1.1 }}>
              My Collection
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0 }}>
              Earn card packs after each match and equip cards to your lineup for bonus points.
            </p>

            {/* How it works */}
            <div className="desktop-only" style={{
              background: 'rgba(33,150,243,0.06)',
              border: '1px solid rgba(33,150,243,0.15)',
              borderRadius: 12,
              padding: '14px 18px',
              marginTop: 24,
              fontSize: 12,
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.6,
              maxWidth: 'calc(100% - 140px)',
              position: 'relative',
              zIndex: 10
            }}>
              <span style={{ color: '#2196f3', fontWeight: 700 }}>How Cards Work: </span>
              Equip a Skill Card to a player before kickoff. After the Fantasy Engine calculates points, your card adds a fixed bonus for matching events (e.g. a Striker with "Golden Boot" earns +1.50 pts per goal scored). Cards are locked after kickoff.
              Cards are earned automatically after each match ends. Rarity ranges from Common to SSSR.
            </div>
          </div>
          <img 
            src="/fifa_world_cup_2026_logo.webp" 
            alt="FIFA World Cup 2026 Logo" 
            style={{ height: '100px', objectFit: 'contain', opacity: 0.95, margin: 0, position: 'absolute', top: 24, right: 24, zIndex: 2 }}
          />
        </div>

        {/* Stats Info */}
        {!connected ? (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: 12 }}>
              Connect Wallet to View Your Collection
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 40, maxWidth: 460, margin: '0 auto 40px' }}>
              Here is a preview of the Skill Cards you can collect. Log in and participate in contests to earn them!
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
              {SKILL_CARDS.slice(0, 8).map((card) => (
                <div key={card.id} style={{ position: 'relative', overflow: 'hidden', borderRadius: 16 }}>
                  <SkillCardDisplay card={card} width={240} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="card card--glass" style={{ marginBottom: 32, padding: 'var(--space-4) var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {[ 
                { label: 'Total Cards', value: allCards.length },
                { label: 'Legendary+', value: rareCount },
                { label: 'Rarities', value: Object.keys(RARITY_ORDER).length }
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{item.label}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Card Combine System */}
        <div className="desktop-only" style={{
          background: 'linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(255,100,0,0.06) 100%)',
          border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: 12,
          padding: '20px 22px',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>⚗️</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#ffd700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Card Combine System</span>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            {[
              { step: '1', icon: '🎴', label: 'Collect 2 copies', desc: 'Earn the same card twice from match rewards. Duplicates stack automatically.' },
              { step: '2', icon: '⚗️', label: 'Click COMBINE', desc: 'A ⚗️ COMBINE badge appears on the card. Click it to open the combine screen.' },
              { step: '3', icon: '✨', label: 'Get higher rarity', desc: '2 source cards are consumed and you receive 1 random card of the next rarity tier.' },
            ].map(item => (
              <div key={item.step} style={{
                flex: '1 1 160px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,215,0,0.12)',
                borderRadius: 10,
                padding: '12px 14px',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(255,215,0,0.2)', border: '1px solid rgba(255,215,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 900, color: '#ffd700', flexShrink: 0,
                  }}>{item.step}</div>
                  <span style={{ fontSize: 13 }}>{item.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{item.label}</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, paddingLeft: 30 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Rarity chain */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginRight: 4 }}>RARITY CHAIN:</span>
            {(['Common', 'Rare', 'Epic', 'Legendary', 'SSR', 'SSSR'] as const).map((r, i, arr) => (
              <span key={r} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                  background: `${RARITY_COLOR[r]}18`,
                  border: `1px solid ${RARITY_COLOR[r]}44`,
                  color: RARITY_COLOR[r],
                }}>{r}</span>
                {i < arr.length - 1 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>→</span>}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
            SSSR is the maximum rarity. Cards at max rarity cannot be combined further.
          </div>
        </div>

        {/* Filters + sort */}
        <div style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 20,
          justifyContent: 'space-between',
        }}>
          {/* Position filter */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {POSITION_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilterPos(f.value)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: filterPos === f.value ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.12)',
                  background: filterPos === f.value ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
                  color: filterPos === f.value ? '#ffd700' : 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  fontWeight: filterPos === f.value ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>SORT</span>
            {(['newest', 'rarity', 'name'] as SortKey[]).map(s => (
              <button
                key={s}
                onClick={() => setSortKey(s)}
                style={{
                  padding: '5px 12px', borderRadius: 20,
                  border: sortKey === s ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: sortKey === s ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: sortKey === s ? '#fff' : 'rgba(255,255,255,0.3)',
                  fontSize: 11, fontWeight: sortKey === s ? 700 : 400, cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Rarity filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            onClick={() => setFilterRarity('all')}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 11,
              border: filterRarity === 'all' ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
              background: filterRarity === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: filterRarity === 'all' ? '#fff' : 'rgba(255,255,255,0.3)',
              cursor: 'pointer', fontWeight: filterRarity === 'all' ? 700 : 400,
            }}
          >
            All Rarities
          </button>
          {RARITY_ORDER.map(r => (
            <button
              key={r}
              onClick={() => setFilterRarity(r)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11,
                border: filterRarity === r ? `1px solid ${RARITY_COLOR[r]}` : '1px solid rgba(255,255,255,0.08)',
                background: filterRarity === r ? `${RARITY_COLOR[r]}22` : 'transparent',
                color: filterRarity === r ? RARITY_COLOR[r] : 'rgba(255,255,255,0.3)',
                cursor: 'pointer', fontWeight: filterRarity === r ? 700 : 400,
              }}
            >
              {r} {rarityCount[r] ? `(${rarityCount[r]})` : ''}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {allCards.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'rgba(255,255,255,0.02)', borderRadius: 16,
            border: '1px dashed rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎴</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No Cards Yet</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
              Participate in a match to earn your first Skill Card pack. Cards are awarded automatically after full time.
            </div>
            <Link
              href="/contests"
              style={{
                display: 'inline-block', padding: '12px 28px',
                background: '#ffd700', borderRadius: 10,
                color: '#000', fontWeight: 800, fontSize: 14, textDecoration: 'none',
              }}
            >
              Browse Contests →
            </Link>
          </div>
        )}

        {/* No results after filter */}
        {allCards.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            No cards match the selected filters.
          </div>
        )}

        {/* Card grid */}
        {filtered.length > 0 && (
          <div className="cards-grid-mobile" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'space-between',
          }}>
            <style>{`
              @keyframes card-shine {
                0%   { transform: translateX(-130%) skewX(-20deg); opacity: 0; }
                20%  { opacity: 1; }
                80%  { opacity: 1; }
                100% { transform: translateX(230%) skewX(-20deg); opacity: 0; }
              }
            `}</style>
            {filtered.map(({ instance, card }) => {
              const isShimmering = shimmerIds.has(instance.instanceId);
              const copyCount = cardIdCount[instance.cardId] ?? 1;
              const isCombineable = copyCount >= 2 && canCombine(instance.cardId);
              return (
                <div
                  className="card-responsive-wrapper"
                  key={instance.instanceId}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', width: '100%', maxWidth: 240 }}
                  onClick={() => handleCardClick(instance, card)}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, width: '100%' }}>
                    <SkillCardDisplay
                      card={card}
                      instance={instance}
                      width={240}
                      onEquip={() => setEquipTarget({ instance, card })}
                    />
                    {isShimmering && (
                      <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
                      }}>
                        <div style={{
                          position: 'absolute', top: 0, bottom: 0,
                          width: '55%',
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
                          animation: 'card-shine 0.38s ease-out forwards',
                        }} />
                      </div>
                    )}
                    {/* Combine badge */}
                    {isCombineable && (
                      <button
                        onClick={e => { e.stopPropagation(); setCombineTarget(card); }}
                        style={{
                          position: 'absolute', bottom: 8, left: '50%',
                          transform: 'translateX(-50%)',
                          background: `linear-gradient(135deg, ${RARITY_COLOR[card.rarity]}, ${RARITY_COLOR[RARITY_ORDER[RARITY_ORDER.indexOf(card.rarity) + 1] ?? card.rarity]})`,
                          border: 'none', borderRadius: 20,
                          color: '#000', fontWeight: 900, fontSize: 9,
                          padding: '4px 10px', cursor: 'pointer',
                          letterSpacing: 0.5, whiteSpace: 'nowrap',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                        }}
                      >
                        ⚗️ COMBINE ×{copyCount}
                      </button>
                    )}
                    {/* Duplicate count badge (when > 1 but not yet combineable) */}
                    {copyCount > 1 && !isCombineable && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 10, padding: '2px 7px',
                        fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700,
                      }}>
                        ×{copyCount}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
                    Obtained {new Date(instance.obtainedAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>

      {/* Card detail modal */}
      {viewTarget && (
        <CardDetailModal
          card={viewTarget.card}
          instance={viewTarget.instance}
          onClose={() => setViewTarget(null)}
          onEquip={() => { setEquipTarget(viewTarget); setViewTarget(null); }}
        />
      )}

      {/* Equip modal */}
      {equipTarget && (
        <EquipModal
          card={equipTarget.card}
          instance={equipTarget.instance}
          onClose={() => { setEquipTarget(null); reload(); }}
        />
      )}

      {/* Combine modal */}
      {combineTarget && (
        <CombineModal
          card={combineTarget}
          onClose={() => setCombineTarget(null)}
          onSuccess={() => { setCombineTarget(null); reload(); }}
        />
      )}
    </main>
  );
}
