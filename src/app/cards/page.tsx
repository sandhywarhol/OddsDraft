'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import SkillCardDisplay from '@/components/SkillCardDisplay';
import {
  getCollectionWithDefs,
  equipCard,
  unequipCard,
  getEquippedCardInstance,
  type OwnedCard,
} from '@/lib/card-collection';
import {
  RARITY_ORDER,
  RARITY_COLOR,
  RARITY_STARS,
  type Rarity,
  type CardPosition,
  type SkillCard,
} from '@/lib/skill-cards';

type SortKey = 'newest' | 'rarity' | 'name';
type FilterPos = 'all' | CardPosition;
type FilterRarity = 'all' | Rarity;

const POSITION_FILTERS: { label: string; value: FilterPos }[] = [
  { label: 'All', value: 'all' },
  { label: '🧤 GK',  value: 'Goalkeeper' },
  { label: '🛡️ DEF', value: 'Defender' },
  { label: '🎮 MID', value: 'Midfielder' },
  { label: '⚡ WIN', value: 'Winger' },
  { label: '⚽ STR', value: 'Striker' },
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

export default function CardsPage() {
  const [allCards, setAllCards] = useState<{ instance: OwnedCard; card: SkillCard }[]>([]);
  const [filterPos, setFilterPos] = useState<FilterPos>('all');
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [equipTarget, setEquipTarget] = useState<{ instance: OwnedCard; card: SkillCard } | null>(null);
  const [viewTarget, setViewTarget] = useState<{ instance: OwnedCard; card: SkillCard } | null>(null);
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
        return new Date(b.instance.obtainedAt).getTime() - new Date(a.instance.obtainedAt).getTime();
      }
      if (sortKey === 'rarity') {
        return RARITY_ORDER.indexOf(b.card.rarity) - RARITY_ORDER.indexOf(a.card.rarity);
      }
      return a.card.name.localeCompare(b.card.name);
    });

  const rarityCount: Partial<Record<Rarity, number>> = {};
  allCards.forEach(({ card }) => {
    rarityCount[card.rarity] = (rarityCount[card.rarity] ?? 0) + 1;
  });
  const rareCount = allCards.filter(({ card }) => RARITY_ORDER.indexOf(card.rarity) >= 4).length;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(156,39,176,0.08) 100%)',
          border: '1px solid rgba(255,215,0,0.15)',
          borderRadius: 20,
          padding: '28px 28px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ffd700', letterSpacing: 3, marginBottom: 6, textTransform: 'uppercase' }}>
              Fantasy Skill Cards
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 4 }}>My Collection</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              Earn card packs after each match and equip cards to your lineup for bonus points.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#ffd700' }}>{allCards.length}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>TOTAL CARDS</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#9c27b0' }}>{rareCount}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>LEGENDARY+</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#2196f3' }}>
                {Object.keys(RARITY_ORDER).length}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>RARITIES</div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div style={{
          background: 'rgba(33,150,243,0.06)',
          border: '1px solid rgba(33,150,243,0.15)',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 24,
          fontSize: 12,
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.6,
        }}>
          <span style={{ color: '#2196f3', fontWeight: 700 }}>How Cards Work: </span>
          Equip a Skill Card to a player before kickoff. After the Fantasy Engine calculates points, your card adds a fixed bonus for matching events (e.g. a Striker with "Golden Boot" earns +1.50 pts per goal scored). Cards are locked after kickoff.
          Cards are earned automatically after each match ends. Rarity ranges from Common to SSSR.
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
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'flex-start',
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
              return (
                <div
                  key={instance.instanceId}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  onClick={() => handleCardClick(instance, card)}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 4 }}>
                    <SkillCardDisplay
                      card={card}
                      instance={instance}
                      width={180}
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
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
                    Obtained {new Date(instance.obtainedAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
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
    </div>
  );
}
