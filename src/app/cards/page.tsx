'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import SkillCardDisplay from '@/components/SkillCardDisplay';
import UpgradeCardDisplay from '@/components/UpgradeCardDisplay';
import CardPackOpener from '@/components/CardPackOpener';
import {
  getCollectionWithDefs,
  equipCard,
  getEquippedCardInstance,
  combineCards,
  canCombine,
  rollRandomCard,
  addCardToCollection,
  openCardPack,
  openUpgradeCardPack,
  getUpgradeCollection,
  addUpgradeCardToCollection,
  upgradeSkillCard,
  getCardById,
  makeInstanceId,
  getNewCardIds,
  dismissNewCard,
  getSoldAcked,
  ackSoldListing,
  removeCardFromCollection,
  removeUpgradeCardFromCollection,
  type OwnedCard,
  type OwnedUpgradeCard,
} from '@/lib/card-collection';
import {
  UPGRADE_CARDS,
  getUpgradeCardById,
  getUpgradeMultiplier,
  MAX_UPGRADE_CREDITS,
  UPGRADE_RARITY_COLOR,
  UPGRADE_CREDITS,
  type UpgradeCard,
  type UpgradePosition,
} from '@/lib/upgrade-cards';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useTxLine } from '@/context/TxLineContext';
import { Transaction, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { buildListCardIx, buildCancelListingIx, buildBuyCardIx } from '@/lib/oddsdraft-anchor';
import {
  RARITY_ORDER,
  RARITY_COLOR,
  RARITY_BG,
  RARITY_STARS,
  SKILL_CARDS,
  getUpgradedEffectText,
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
  isListed,
  isSoulbound,
  onList,
  onDelist,
}: {
  card: SkillCard;
  instance?: OwnedCard;
  onClose: () => void;
  onEquip?: () => void;
  isListed?: boolean;
  isSoulbound?: boolean;
  onList?: () => void;
  onDelist?: () => void;
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
          maxWidth: 880,
          width: '100%',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span>{colorizeEffect(getUpgradedEffectText(card, instance?.upgradeCredits || 0))}</span>
                {instance?.upgradeCredits ? (
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: '#4ade80',
                    background: 'rgba(74, 222, 128, 0.15)', padding: '2px 8px', borderRadius: 12,
                    display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: '0.02em',
                  }}>
                    ⬆ {instance.upgradeCredits >= 10 ? 'MAX' : `+${instance.upgradeCredits}%`}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Obtained */}
          {instance && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 24 }}>
              Obtained {new Date(instance.obtainedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {onEquip && instance && (
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
                  SET AS DEFAULT
                </button>
              )}
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
            {instance && (
              isSoulbound ? (
                <div style={{ width: '100%', padding: '10px 0', background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.3)', borderRadius: 8, color: 'rgba(255,255,255,0.35)', fontWeight: 700, fontSize: 13, textAlign: 'center', letterSpacing: '0.04em' }}>
                  🔒 Soulbound — Cannot be sold
                </div>
              ) : isListed ? (
                <button
                  onClick={onDelist}
                  style={{ width: '100%', padding: '10px 0', background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.35)', borderRadius: 8, color: '#ff6b6b', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel Listing
                </button>
              ) : (
                <button
                  onClick={onList}
                  style={{ width: '100%', padding: '10px 0', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.35)', borderRadius: 8, color: '#ffd700', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  List on Marketplace
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UpgradeCardDetailModal({
  card,
  instance,
  isListed,
  isSoulbound,
  onList,
  onDelist,
  onClose,
}: {
  card: UpgradeCard;
  instance?: OwnedUpgradeCard;
  isListed?: boolean;
  isSoulbound?: boolean;
  onList?: () => void;
  onDelist?: () => void;
  onClose: () => void;
}) {
  const rarityColor = UPGRADE_RARITY_COLOR[card.rarity];
  const posColor =
    card.position === 'Goalkeeper' ? '#1565c0' :
    card.position === 'Defender'   ? '#2e7d32' :
    card.position === 'Midfielder' ? '#e65100' :
    card.position === 'Winger'     ? '#00838f' : '#6a1b9a';

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
        <UpgradeCardDisplay card={card} width={280} />

        {/* Info panel */}
        <div style={{ minWidth: 240, flex: 1 }}>
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
            {card.rarity.toUpperCase()}
          </div>

          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 6, lineHeight: 1.1 }}>
            {card.name}
          </div>

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
              Upgrade Stats
            </div>
            <div style={{
              fontSize: 14, fontWeight: 600,
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.6,
            }}>
              {card.description}
            </div>
          </div>

          {instance && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 24 }}>
              Obtained {new Date(instance.obtainedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {instance && isSoulbound && (
              <div style={{ flex: 1, padding: '12px 16px', borderRadius: 8, background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.3)', color: 'rgba(255,255,255,0.35)', fontWeight: 700, fontSize: 13, textAlign: 'center' }}>
                🔒 Soulbound — Cannot be sold
              </div>
            )}
            {instance && !isSoulbound && onList && !isListed && (
              <button
                onClick={onList}
                style={{ flex: 1, padding: '12px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #ffd700, #d4af37)', color: '#111', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer' }}
              >
                List on Marketplace
              </button>
            )}
            {instance && !isSoulbound && onDelist && isListed && (
              <button
                onClick={onDelist}
                style={{ flex: 1, padding: '12px 16px', borderRadius: 8, background: 'rgba(255,60,60,0.12)', border: '1px solid rgba(255,60,60,0.35)', color: '#ff6b6b', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel Listing
              </button>
            )}
            <button
              onClick={onClose}
              style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              ✕ CLOSE
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
                opacity: phase === 'combining' ? 0 : 1,
                transform: phase === 'combining' 
                  ? `translateX(${i === 0 ? '140px' : '-140px'}) scale(0.2) rotate(${i === 0 ? '45deg' : '-45deg'})` 
                  : 'translateX(0) scale(1) rotate(0deg)',
                transition: 'all 1.2s cubic-bezier(0.5, 0, 0.2, 1)',
                zIndex: 2,
              }}>
                <SkillCardDisplay
                  card={card}
                  width={140}
                />
              </div>
            ))}

            {/* Arrow */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 1,
              opacity: phase === 'combining' ? 0 : 1,
              transition: 'opacity 0.5s',
            }}>
              <div style={{
                fontSize: '1.5rem',
              }}>
                →
              </div>
            </div>

            {/* Result slot */}
            <div style={{
              width: '100%', maxWidth: 140, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 'auto',
            }}>
              <div style={{
                width: '100%', height: 'auto', aspectRatio: '1086 / 1448', borderRadius: 16,
                background: phase === 'combining'
                  ? `linear-gradient(135deg, ${nextRarityColor}, #fff)`
                  : 'rgba(255,255,255,0.04)',
                border: `2px dashed ${phase === 'combining' ? 'transparent' : 'rgba(255,255,255,0.15)'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 1.2s ease',
                boxShadow: phase === 'combining' ? `0 0 60px 20px ${nextRarityColor}, inset 0 0 30px #fff` : 'none',
                animation: phase === 'combining' ? 'combine-flash 1.8s ease-in forwards' : undefined,
                zIndex: 0,
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 32, animation: 'pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
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
          @keyframes combine-flash {
            0% { filter: brightness(1) hue-rotate(0deg); transform: scale(1); opacity: 1; }
            50% { filter: brightness(2) hue-rotate(90deg); transform: scale(1.1); opacity: 1; }
            90% { filter: brightness(4) hue-rotate(180deg); transform: scale(0); opacity: 0; }
            100% { transform: scale(0); opacity: 0; }
          }
          @keyframes pop-in {
            0% { transform: scale(0.4); opacity: 0; filter: blur(10px); }
            100% { transform: scale(1); opacity: 1; filter: blur(0); }
          }
        `}</style>
      </div>
    </div>
  );
}

// Component to animate progress bar from old to new value
function UpgradeProgressBar({
  oldCredits,
  newCredits,
  isMaxed,
  rarityColor = '#2196F3',
}: {
  oldCredits: number;
  newCredits: number;
  isMaxed: boolean;
  rarityColor?: string;
}) {
  const [credits, setCredits] = useState(oldCredits);

  useEffect(() => {
    // Trigger transition shortly after mount
    const timer = setTimeout(() => setCredits(newCredits), 50);
    return () => clearTimeout(timer);
  }, [newCredits]);

  return (
    <div style={{ margin: '16px 0', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 }}>
      <div style={{ height: 10, borderRadius: 5, background: 'rgba(0,0,0,0.5)', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          height: '100%',
          width: `${(credits / MAX_UPGRADE_CREDITS) * 100}%`,
          background: isMaxed ? '#ffd700' : `linear-gradient(90deg, ${rarityColor}, ${rarityColor}88)`,
          borderRadius: 5,
          transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Progress</div>
        <div style={{ fontSize: 13, color: '#fff', fontWeight: 900 }}>
          {newCredits} / {MAX_UPGRADE_CREDITS}
        </div>
      </div>
    </div>
  );
}

// SkillUpgradeModal — given a skill card, select an upgrade card to apply
function SkillUpgradeModal({
  targetCard,
  targetInstance,
  availableUpgrades,
  onClose,
  onSuccess,
}: {
  targetCard: SkillCard;
  targetInstance: OwnedCard;
  availableUpgrades: { instance: OwnedUpgradeCard; card: UpgradeCard }[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [result, setResult] = useState<{ success: boolean; message: string; newCredits?: number; oldCredits?: number; isMaxed?: boolean } | null>(null);
  const [animationState, setAnimationState] = useState<'idle' | 'upgrading' | 'success_flash'>('idle');
  
  const handleApply = (upgradeInstanceId: string) => {
    setAnimationState('upgrading');
    setTimeout(() => {
      const res = upgradeSkillCard(targetInstance.instanceId, upgradeInstanceId);
      if (res.success) {
        setAnimationState('success_flash');
        setTimeout(() => {
          setResult({
            success: true,
            message: res.isMaxed
              ? `Card reached MAX upgrade! (+30% bonus permanently applied)`
              : `Upgrade applied! Progress: ${res.newCredits} / ${MAX_UPGRADE_CREDITS} credits`,
            newCredits: res.newCredits,
            oldCredits: targetInstance.upgradeCredits || 0,
            isMaxed: res.isMaxed,
          });
          setAnimationState('idle');
        }, 2000); // 2s success delay so user can read it
      } else {
        setResult({ success: false, message: res.error || 'Upgrade failed.' });
        setAnimationState('idle');
      }
    }, 1200); // 1.2s dramatic pause
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24, width: '100%', maxWidth: 460,
        display: 'flex', flexDirection: 'column',
        maxHeight: '90vh', overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#fff' }}>Upgrade {targetCard.name}</h2>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            Select an upgrade card to apply
          </div>
        </div>
        
        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          <style>{`
            @keyframes intense-shake {
              0% { transform: translate(2px, 1px) rotate(0deg) scale(1); filter: brightness(1); }
              10% { transform: translate(-1px, -2px) rotate(-2deg) scale(1.02); filter: brightness(1.2); }
              20% { transform: translate(-3px, 0px) rotate(2deg) scale(1.04); filter: brightness(1.4); }
              30% { transform: translate(0px, 2px) rotate(0deg) scale(1.06); filter: brightness(1.6); }
              40% { transform: translate(1px, -1px) rotate(2deg) scale(1.08); filter: brightness(1.8); }
              50% { transform: translate(-1px, 2px) rotate(-2deg) scale(1.1); filter: brightness(2) drop-shadow(0 0 40px #fff); }
              60% { transform: translate(-3px, 1px) rotate(0deg) scale(1.08); filter: brightness(1.8); }
              70% { transform: translate(2px, 1px) rotate(-2deg) scale(1.06); filter: brightness(1.6); }
              80% { transform: translate(-1px, -1px) rotate(2deg) scale(1.04); filter: brightness(1.4); }
              90% { transform: translate(2px, 2px) rotate(0deg) scale(1.02); filter: brightness(1.2); }
              100% { transform: translate(1px, -2px) rotate(-2deg) scale(1); filter: brightness(1); }
            }
            .animate-upgrade-shake {
              animation: intense-shake 0.15s infinite cubic-bezier(0.36, 0.07, 0.19, 0.97);
            }
            @keyframes white-flash {
              0% { filter: brightness(2) drop-shadow(0 0 40px #fff); transform: scale(1.1); }
              20% { filter: brightness(4) drop-shadow(0 0 100px #fff); transform: scale(1.2); }
              100% { filter: brightness(1.2) drop-shadow(0 0 20px #fff); transform: scale(1.05); }
            }
            .animate-success-flash {
              animation: white-flash 1s ease-out forwards;
            }
            @keyframes pop-in {
              0% { transform: scale(0.5); opacity: 0; }
              50% { transform: scale(1.2); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
          
          {animationState !== 'idle' ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{ position: 'relative' }}>
                <div className={animationState === 'success_flash' ? 'animate-success-flash' : 'animate-upgrade-shake'} style={{ width: 200 }}>
                  <SkillCardDisplay card={targetCard} instance={targetInstance} width={200} />
                </div>
                <div style={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-15deg)',
                  fontSize: 32,
                  fontWeight: 900,
                  fontFamily: '"Palatino", "Georgia", serif',
                  fontStyle: 'italic',
                  color: animationState === 'success_flash' ? '#4ade80' : '#ef4444', 
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase', 
                  animation: animationState === 'success_flash' ? 'pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'pulse 1s infinite',
                  textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 10px 20px rgba(0,0,0,0.9)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 10
                }}>
                  {animationState === 'success_flash' ? 'SUCCESS!' : 'UPGRADING'}
                </div>
              </div>
            </div>
          ) : result ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{result.success ? '✨' : '❌'}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: result.success ? '#4CAF50' : '#f44336', marginBottom: 12 }}>
                {result.message}
              </div>
              
              {result.success && result.newCredits !== undefined && result.oldCredits !== undefined && (
                <UpgradeProgressBar
                  oldCredits={result.oldCredits}
                  newCredits={result.newCredits}
                  isMaxed={!!result.isMaxed}
                />
              )}
              
              <button
                onClick={() => {
                  if (result.success) onSuccess();
                  else setResult(null);
                }}
                style={{
                  padding: '12px 24px', background: '#fff', color: '#000',
                  border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer'
                }}
              >
                {result.success ? 'Continue' : 'Try Again'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {availableUpgrades.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                  No compatible upgrade cards available in your collection.<br />
                  <span style={{ fontSize: 12, marginTop: 8, display: 'inline-block' }}>Open Card Packs to find more Upgrade Cards!</span>
                </div>
              ) : (
                availableUpgrades.map(({ instance, card }) => (
                  <div
                    key={instance.instanceId}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 12, background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 8,
                        background: UPGRADE_RARITY_COLOR[card.rarity],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, color: '#000'
                      }}>
                        ⬆️
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{card.name}</div>
                        <div style={{ fontSize: 11, color: UPGRADE_RARITY_COLOR[card.rarity], fontWeight: 800 }}>
                          Lv.{card.level} • {card.rarity}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApply(instance.instanceId)}
                      style={{
                        padding: '8px 16px', background: UPGRADE_RARITY_COLOR[card.rarity],
                        color: '#000', border: 'none', borderRadius: 8,
                        fontSize: 12, fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      Apply
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px', background: 'transparent', color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                fontSize: 13, fontWeight: 700, cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// UpgradeModal — pick a compatible Skill Card to apply upgrade to
function UpgradeModal({
  upgradeCard,
  upgradeInstance,
  onClose,
  onSuccess,
}: {
  upgradeCard: UpgradeCard;
  upgradeInstance: OwnedUpgradeCard;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const rarityColor = UPGRADE_RARITY_COLOR[upgradeCard.rarity];
  const [result, setResult] = useState<{ success: boolean; message: string; newCredits?: number; oldCredits?: number; isMaxed?: boolean } | null>(null);
  const [upgradingCard, setUpgradingCard] = useState<{ instance: OwnedCard, card: SkillCard } | null>(null);
  const [animationState, setAnimationState] = useState<'idle' | 'upgrading' | 'success_flash'>('idle');

  // Get compatible Skill Cards (matching position, not yet maxed)
  const allSkillCards = getCollectionWithDefs();
  const compatible = allSkillCards.filter(({ card }) => card.position === upgradeCard.position);

  const handleApply = (skillInstanceId: string) => {
    const skillCardObj = compatible.find(c => c.instance.instanceId === skillInstanceId);
    setUpgradingCard(skillCardObj || null);
    setAnimationState('upgrading');
    
    setTimeout(() => {
      const skillInstance = skillCardObj?.instance;
      const res = upgradeSkillCard(skillInstanceId, upgradeInstance.instanceId);
      if (res.success) {
        setAnimationState('success_flash');
        setTimeout(() => {
          setResult({
            success: true,
            message: res.isMaxed
              ? `Card reached MAX upgrade! (+30% bonus permanently applied)`
              : `Upgrade applied! Progress: ${res.newCredits} / ${MAX_UPGRADE_CREDITS} credits`,
            newCredits: res.newCredits,
            oldCredits: skillInstance?.upgradeCredits || 0,
            isMaxed: res.isMaxed,
          });
          setUpgradingCard(null);
          setAnimationState('idle');
        }, 2000); // 2s success delay
      } else {
        setResult({ success: false, message: res.error ?? 'Failed to apply upgrade.' });
        setUpgradingCard(null);
        setAnimationState('idle');
      }
    }, 1200);
  };

  return (
    <div
      onClick={result ? undefined : onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 9200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0d1520', border: `1px solid ${rarityColor}55`,
        borderRadius: 18, padding: 28, maxWidth: 520, width: '100%',
        boxShadow: `0 0 40px ${rarityColor}22`,
      }}>
        {upgradingCard && animationState !== 'idle' ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <style>{`
              @keyframes intense-shake {
                0% { transform: translate(2px, 1px) rotate(0deg) scale(1); filter: brightness(1); }
                10% { transform: translate(-1px, -2px) rotate(-2deg) scale(1.02); filter: brightness(1.2); }
                20% { transform: translate(-3px, 0px) rotate(2deg) scale(1.04); filter: brightness(1.4); }
                30% { transform: translate(0px, 2px) rotate(0deg) scale(1.06); filter: brightness(1.6); }
                40% { transform: translate(1px, -1px) rotate(2deg) scale(1.08); filter: brightness(1.8); }
                50% { transform: translate(-1px, 2px) rotate(-2deg) scale(1.1); filter: brightness(2) drop-shadow(0 0 40px #fff); }
                60% { transform: translate(-3px, 1px) rotate(0deg) scale(1.08); filter: brightness(1.8); }
                70% { transform: translate(2px, 1px) rotate(-2deg) scale(1.06); filter: brightness(1.6); }
                80% { transform: translate(-1px, -1px) rotate(2deg) scale(1.04); filter: brightness(1.4); }
                90% { transform: translate(2px, 2px) rotate(0deg) scale(1.02); filter: brightness(1.2); }
                100% { transform: translate(1px, -2px) rotate(-2deg) scale(1); filter: brightness(1); }
              }
              .animate-upgrade-shake {
                animation: intense-shake 0.15s infinite cubic-bezier(0.36, 0.07, 0.19, 0.97);
              }
              @keyframes white-flash {
                0% { filter: brightness(2) drop-shadow(0 0 40px #fff); transform: scale(1.1); }
                20% { filter: brightness(4) drop-shadow(0 0 100px #fff); transform: scale(1.2); }
                100% { filter: brightness(1.2) drop-shadow(0 0 20px #fff); transform: scale(1.05); }
              }
              .animate-success-flash {
                animation: white-flash 1s ease-out forwards;
              }
              @keyframes pop-in {
                0% { transform: scale(0.5); opacity: 0; }
                50% { transform: scale(1.2); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative' }}>
                <div className={animationState === 'success_flash' ? 'animate-success-flash' : 'animate-upgrade-shake'} style={{ width: 200 }}>
                  <SkillCardDisplay card={upgradingCard.card} instance={upgradingCard.instance} width={200} />
                </div>
                <div style={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-15deg)',
                  fontSize: 32,
                  fontWeight: 900,
                  fontFamily: '"Palatino", "Georgia", serif',
                  fontStyle: 'italic',
                  color: animationState === 'success_flash' ? '#4ade80' : '#ef4444', 
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase', 
                  animation: animationState === 'success_flash' ? 'pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'pulse 1s infinite',
                  textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 10px 20px rgba(0,0,0,0.9)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 10
                }}>
                  {animationState === 'success_flash' ? 'SUCCESS!' : 'UPGRADING'}
                </div>
              </div>
            </div>
          </div>
        ) : result ? (
          // Result state
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>{result.success ? (result.isMaxed ? '💥' : '⬆') : '❌'}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: result.success ? '#4caf50' : '#f44336', marginBottom: 8 }}>
              {result.success ? (result.isMaxed ? 'MAX UPGRADE REACHED!' : 'Upgrade Applied!') : 'Upgrade Failed'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 8, lineHeight: 1.6 }}>{result.message}</div>
            {result.success && result.newCredits !== undefined && result.oldCredits !== undefined && (
              <UpgradeProgressBar
                oldCredits={result.oldCredits}
                newCredits={result.newCredits}
                isMaxed={!!result.isMaxed}
                rarityColor={rarityColor}
              />
            )}
            <button onClick={() => { onSuccess(); onClose(); }} style={{
              marginTop: 8, padding: '10px 28px', background: '#4caf50',
              border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14,
            }}>Done</button>
          </div>
        ) : (
          // Selection state
          <>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: rarityColor, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
                ⬆ Apply Upgrade Card
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{upgradeCard.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                Level {upgradeCard.level} · +{UPGRADE_CREDITS[upgradeCard.level]} credits · For {upgradeCard.position} cards
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: 18 }} />

            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Select Skill Card to Upgrade:
            </div>

            {compatible.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                No compatible {upgradeCard.position} Skill Cards in your collection.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
                {compatible.map(({ instance, card }) => {
                  const credits = instance.upgradeCredits ?? 0;
                  const isMaxed = credits >= MAX_UPGRADE_CREDITS;
                  const pct = (credits / MAX_UPGRADE_CREDITS) * 100;
                  const skillRarityColor = RARITY_COLOR[card.rarity];
                  return (
                    <div
                      key={instance.instanceId}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${skillRarityColor}33`,
                        borderRadius: 12, padding: '12px 14px',
                        opacity: isMaxed ? 0.5 : 1,
                      }}
                    >
                      {/* Rarity dot */}
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: skillRarityColor, flexShrink: 0, boxShadow: `0 0 6px ${skillRarityColor}88` }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{card.name}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{card.rarity} · {card.effectText}</div>
                        {/* Progress bar */}
                        <div style={{ height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${pct}%`,
                            background: isMaxed ? '#ffd700' : `linear-gradient(90deg, ${rarityColor}, ${rarityColor}88)`,
                            borderRadius: 4, transition: 'width 0.4s',
                          }} />
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>
                          {isMaxed ? '💥 MAX UPGRADE' : `${credits} / ${MAX_UPGRADE_CREDITS} credits (${Math.round(getUpgradeMultiplier(credits) * 100)}% bonus)`}
                        </div>
                      </div>
                      <button
                        disabled={isMaxed}
                        onClick={() => handleApply(instance.instanceId)}
                        style={{
                          padding: '8px 14px',
                          background: isMaxed ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${rarityColor}cc, ${rarityColor}88)`,
                          border: isMaxed ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${rarityColor}`,
                          borderRadius: 8, color: isMaxed ? 'rgba(255,255,255,0.3)' : '#fff',
                          fontWeight: 800, fontSize: 11, cursor: isMaxed ? 'not-allowed' : 'pointer',
                          letterSpacing: '0.05em', flexShrink: 0,
                        }}
                      >
                        {isMaxed ? 'MAXED' : 'APPLY'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button onClick={onClose} style={{
              marginTop: 20, padding: '10px 0', width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: 'rgba(255,255,255,0.4)',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

function WelcomeGiftModal({
  queue,
  publicKey,
  onComplete
}: {
  queue: { type: 'skill' | 'upgrade'; cardId: string }[];
  publicKey: string;
  onComplete: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Add all cards to collection once when the modal opens
  useEffect(() => {
    if (localStorage.getItem(`txodds_welcome_gift_claimed_${publicKey}`)) return;

    queue.forEach((q) => {
      if (q.type === 'skill') {
        addCardToCollection({
          instanceId: makeInstanceId(),
          cardId: q.cardId,
          obtainedAt: new Date().toISOString(),
          upgradeCredits: 0,
          soulbound: true,
        });
      } else {
        addUpgradeCardToCollection(q.cardId, true);
      }
    });
    localStorage.setItem(`txodds_welcome_gift_claimed_${publicKey}`, 'true');
    // Persist to Supabase — prevents re-claiming on a new browser or device
    fetch('/api/user/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: publicKey, packOpened: { welcomeGiftClaimed: true } }),
    }).catch(() => { /* non-blocking — localStorage is the authoritative local guard */ });
  }, [queue, publicKey]);

  const currentItem = queue[currentIndex];
  
  if (!currentItem) {
    onComplete();
    return null;
  }

  const handleOpen = () => {
    if (currentItem.type === 'skill') {
      const card = SKILL_CARDS.find(c => c.id === currentItem.cardId);
      return { card };
    } else {
      const upgradeCard = UPGRADE_CARDS.find(c => c.id === currentItem.cardId);
      return { upgradeCard };
    }
  };

  const handleClose = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <CardPackOpener
      key={currentIndex}
      upgradePackMode={currentItem.type === 'upgrade'}
      title="🎁 Welcome to OddsDraft!"
      subtitle={`Opening Starter Pack (${currentIndex + 1}/${queue.length})`}
      subtitleIdle="Contains 5 Skill Cards and 5 Upgrade Cards"
      primaryButtonText={currentIndex < queue.length - 1 ? 'Open More' : 'Finish & Go to My Cards'}
      onOpen={handleOpen}
      onClose={handleClose}
    />
  );
}

// ── Solana confirmation helper ────────────────────────────────────────────────
// Polls every 2s instead of relying on confirmTransaction which can hang on devnet.
async function confirmWithTimeout(
  connection: any,
  sig: string,
  timeoutMs = 45_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { value } = await connection.getSignatureStatus(sig, { searchTransactionHistory: true });
    if (value?.err) throw new Error('Transaction failed: ' + JSON.stringify(value.err));
    if (value?.confirmationStatus === 'confirmed' || value?.confirmationStatus === 'finalized') return;
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error(`Confirmation timeout (45s). Check explorer for: ${sig}`);
}

// ── Marketplace Modal ─────────────────────────────────────────────────────────

interface MarketplaceListing {
  id: string;
  listing_pda: string;
  seller_wallet: string;
  card_id: string;
  instance_id: string;
  card_type: 'skill' | 'upgrade';
  price_sol: number;
  upgrade_credits: number;
  status: string;
  created_at: string;
}

function MarketplaceModal({
  walletPublicKey,
  connection,
  sendTransaction,
  onClose,
  onListingSold,
}: {
  walletPublicKey: string | null;
  connection: any;
  sendTransaction: any;
  onClose: () => void;
  onListingSold: (cardId: string) => void;
}) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'skill' | 'upgrade'>('all');
  const [filterRarity, setFilterRarity] = useState<'all' | Rarity>('all');
  const [filterPosition, setFilterPosition] = useState<'all' | CardPosition>('all');
  const [sortPrice, setSortPrice] = useState<'none' | 'asc' | 'desc'>('none');

  useEffect(() => {
    setLoading(true);
    fetch('/api/marketplace/listings')
      .then(r => r.ok ? r.json() : { listings: [] })
      .then(d => setListings(d.listings ?? []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const handleBuy = async (listing: MarketplaceListing) => {
    if (!walletPublicKey) return showToast('Connect wallet first', false);
    if (listing.seller_wallet === walletPublicKey) return showToast('Cannot buy your own listing', false);
    setBuyingId(listing.id);
    try {
      const seller = new PublicKey(listing.seller_wallet);
      const buyer = new PublicKey(walletPublicKey);
      // PDA was created with instance_id as key
      const pdaKey = listing.instance_id ?? listing.card_id;
      const ix = buildBuyCardIx(buyer, seller, pdaKey);
      const { blockhash } = await connection.getLatestBlockhash();
      const tx = new Transaction({ feePayer: buyer, recentBlockhash: blockhash }).add(ix);
      const sig = await sendTransaction(tx, connection, { skipPreflight: true });
      await confirmWithTimeout(connection, sig);

      const res = await fetch('/api/marketplace/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txSignature: sig, buyerWallet: walletPublicKey, sellerWallet: listing.seller_wallet, instanceId: listing.instance_id, cardId: listing.card_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Purchase failed');

      // Add to buyer's local collection immediately so it appears in inventory
      if (listing.card_type === 'skill') {
        addCardToCollection({
          instanceId: makeInstanceId(),
          cardId: listing.card_id,
          obtainedAt: new Date().toISOString(),
          upgradeCredits: listing.upgrade_credits ?? 0,
        });
      } else {
        addUpgradeCardToCollection(listing.card_id);
      }

      setListings(prev => prev.filter(l => l.id !== listing.id));
      onListingSold(listing.instance_id ?? listing.card_id);
      showToast('Card purchased! Check your collection.', true);
    } catch (err: any) {
      showToast(err.message ?? 'Transaction failed', false);
    } finally {
      setBuyingId(null);
    }
  };

  const positions: CardPosition[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Winger', 'Striker'];

  const displayed = listings.filter(l => {
    if (filterType !== 'all' && l.card_type !== filterType) return false;
    if (filterRarity !== 'all') {
      const def = getCardById(l.card_id);
      if (!def || def.rarity !== filterRarity) return false;
    }
    if (filterPosition !== 'all') {
      const def = getCardById(l.card_id);
      if (!def || def.position !== filterPosition) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortPrice === 'asc') return a.price_sol - b.price_sol;
    if (sortPrice === 'desc') return b.price_sol - a.price_sol;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)', zIndex: 9100, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ margin: 'auto', width: '100%', maxWidth: 1000, padding: '32px 24px 80px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, fontFamily: 'var(--font-bebas), cursive', letterSpacing: '0.05em', color: '#fff' }}>
              Card Marketplace
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>
              Buy skill &amp; upgrade cards — all transactions on-chain via Solana Devnet
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'rgba(255,255,255,0.5)', padding: '8px 14px', fontSize: '1rem', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24, padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Card type */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', marginRight: 2 }}>Type</span>
            {(['all', 'skill', 'upgrade'] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', border: 'none', background: filterType === t ? '#ffd700' : 'rgba(255,255,255,0.08)', color: filterType === t ? '#111' : 'rgba(255,255,255,0.6)', transition: 'all 0.15s' }}>
                {t === 'all' ? 'All' : t === 'skill' ? 'Skill' : 'Upgrade'}
              </button>
            ))}
          </div>

          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

          {/* Rarity */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', marginRight: 2 }}>Rarity</span>
            {(['all', ...RARITY_ORDER.slice(0, 6)] as ('all' | Rarity)[]).map(r => (
              <button key={r} onClick={() => setFilterRarity(r)} style={{ padding: '5px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', border: `1px solid ${r === 'all' ? 'transparent' : (RARITY_COLOR[r as Rarity] ?? '#888') + '66'}`, background: filterRarity === r ? (r === 'all' ? '#ffd700' : RARITY_COLOR[r as Rarity] + '33') : 'rgba(255,255,255,0.05)', color: filterRarity === r ? (r === 'all' ? '#111' : RARITY_COLOR[r as Rarity]) : 'rgba(255,255,255,0.5)', transition: 'all 0.15s' }}>
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>

          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

          {/* Position */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', marginRight: 2 }}>Pos</span>
            {(['all', ...positions] as ('all' | CardPosition)[]).map(p => (
              <button key={p} onClick={() => setFilterPosition(p)} style={{ padding: '5px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', border: 'none', background: filterPosition === p ? 'rgba(0,229,122,0.25)' : 'rgba(255,255,255,0.06)', color: filterPosition === p ? '#00e87a' : 'rgba(255,255,255,0.5)', transition: 'all 0.15s' }}>
                {p === 'all' ? 'All' : p.slice(0, 3)}
              </button>
            ))}
          </div>

          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

          {/* Price sort */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', marginRight: 2 }}>Price</span>
            {([['none', 'Latest'], ['asc', '↑ Low'], ['desc', '↓ High']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setSortPrice(val)} style={{ padding: '5px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', border: 'none', background: sortPrice === val ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.06)', color: sortPrice === val ? '#60a5fa' : 'rgba(255,255,255,0.5)', transition: 'all 0.15s' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
          {loading ? 'Loading...' : `${displayed.length} listing${displayed.length !== 1 ? 's' : ''} found`}
        </div>

        {/* Listings */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>Loading listings...</div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🏪</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>No listings match your filters</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 100px 90px 100px 90px', alignItems: 'center', padding: '8px 16px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span />
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Card</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Position</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Upgrade</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price</span>
              <span />
            </div>

            {displayed.map((listing, idx) => {
              const skillDef = listing.card_type === 'skill' ? getCardById(listing.card_id) : null;
              const upgDef = listing.card_type === 'upgrade' ? getUpgradeCardById(listing.card_id) : null;
              const rarity: Rarity = (skillDef?.rarity ?? (upgDef ? (upgDef.level === 1 ? 'Uncommon' : upgDef.level === 2 ? 'Rare' : 'Epic') : 'Common')) as Rarity;
              const rc = RARITY_COLOR[rarity] ?? '#888';
              const rb = RARITY_BG[rarity] ?? 'rgba(100,100,100,0.1)';
              const isOwn = listing.seller_wallet === walletPublicKey;
              const isBuying = buyingId === listing.id;
              const shortSeller = `${listing.seller_wallet.slice(0, 4)}…${listing.seller_wallet.slice(-4)}`;
              const credits = listing.upgrade_credits ?? 0;
              const upgradeLabel = listing.card_type === 'upgrade'
                ? `Lv. ${upgDef?.level ?? '?'}`
                : credits > 0 ? `+${credits}%` : 'Base';
              const upgradeColor = listing.card_type === 'upgrade'
                ? rc
                : credits > 0 ? '#ffd700' : 'rgba(255,255,255,0.25)';

              return (
                <div
                  key={listing.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '64px 1fr 100px 90px 100px 90px',
                    alignItems: 'center',
                    padding: '8px 16px',
                    borderBottom: idx < displayed.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    background: 'rgba(255,255,255,0.02)',
                    transition: 'background 0.15s',
                    gap: 0,
                    minHeight: 64,
                  }}
                  onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; }}
                >
                  {/* Thumbnail */}
                  <div style={{ width: 48, height: 60, borderRadius: 6, overflow: 'hidden', background: rb, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {skillDef ? (
                      <SkillCardDisplay card={skillDef} width={48} />
                    ) : upgDef ? (
                      <UpgradeCardDisplay card={upgDef} width={48} />
                    ) : (
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>?</div>
                    )}
                  </div>

                  {/* Card info */}
                  <div style={{ paddingLeft: 12, paddingRight: 8, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: rc, background: rb, padding: '1px 6px', borderRadius: 8, flexShrink: 0 }}>{rarity}</span>
                      <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', textTransform: 'capitalize', flexShrink: 0 }}>{listing.card_type}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: 2, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {skillDef?.name ?? upgDef?.name ?? listing.card_id}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {skillDef ? getUpgradedEffectText(skillDef, credits) : upgDef?.description ?? ''}
                    </div>
                    <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.18)', marginTop: 3 }}>by {shortSeller}</div>
                  </div>

                  {/* Position */}
                  <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                    {skillDef?.position ?? upgDef?.position ?? '—'}
                  </div>

                  {/* Upgrade status */}
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: upgradeColor }}>
                    {upgradeLabel}
                  </div>

                  {/* Price */}
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#00e87a' }}>
                    {listing.price_sol} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(0,232,122,0.6)' }}>SOL</span>
                  </div>

                  {/* Buy button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {isOwn ? (
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600, padding: '7px 14px' }}>Yours</span>
                    ) : (
                      <button
                        onClick={() => handleBuy(listing)}
                        disabled={isBuying || !walletPublicKey}
                        style={{
                          padding: '7px 18px',
                          borderRadius: 8,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: isBuying || !walletPublicKey ? 'not-allowed' : 'pointer',
                          background: isBuying ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #00e87a, #00b85e)',
                          color: isBuying ? 'rgba(255,255,255,0.3)' : '#111',
                          border: 'none',
                          opacity: !walletPublicKey ? 0.4 : 1,
                          transition: 'opacity 0.15s',
                        }}
                      >
                        {isBuying ? '…' : 'Buy'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.ok ? 'rgba(0,232,122,0.15)' : 'rgba(255,60,60,0.15)', border: `1px solid ${toast.ok ? 'rgba(0,232,122,0.5)' : 'rgba(255,60,60,0.5)'}`, borderRadius: 10, padding: '12px 20px', color: toast.ok ? '#00e87a' : '#ff6b6b', fontSize: '0.85rem', fontWeight: 700, zIndex: 9200, maxWidth: 300 }}>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}

function ListCardModal({
  cardName,
  cardSubtitle,
  statusText,
  onClose,
  onConfirm,
}: {
  cardName: string;
  cardSubtitle: string;
  statusText: string;
  onClose: () => void;
  onConfirm: (priceSol: number) => void;
}) {
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const parsed = parseFloat(price);
  const valid = !isNaN(parsed) && parsed >= 0.001 && parsed <= 100;

  const handleSubmit = async () => {
    if (!valid) return;
    setSubmitting(true);
    await onConfirm(parsed);
    setSubmitting(false);
  };

  return (
    <div onClick={!submitting ? onClose : undefined} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: 16, padding: 28, maxWidth: 360, width: '100%' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: 4 }}>List on Marketplace</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
          <strong style={{ color: 'var(--text-primary)' }}>{cardName}</strong> · {cardSubtitle}
        </div>

        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
          Price (SOL)
        </label>
        <input
          type="number"
          step="0.001"
          min="0.001"
          max="100"
          placeholder="e.g. 0.05"
          value={price}
          onChange={e => setPrice(e.target.value)}
          disabled={submitting}
          autoFocus
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-medium)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700, boxSizing: 'border-box', outline: 'none', opacity: submitting ? 0.5 : 1 }}
        />
        {parsed > 0 && !submitting && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
            You receive ~{(parsed * 0.95).toFixed(4)} SOL after 5% platform fee.
          </div>
        )}
        {submitting && statusText && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: '0.78rem', color: '#60a5fa' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', border: '2px solid #60a5fa', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            {statusText}
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={handleSubmit}
            disabled={!valid || submitting}
            style={{ flex: 1, padding: '11px 0', borderRadius: 8, background: valid && !submitting ? 'linear-gradient(135deg, #ffd700, #d4af37)' : 'var(--bg-elevated)', color: valid && !submitting ? '#111' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.9rem', border: 'none', cursor: valid && !submitting ? 'pointer' : 'not-allowed' }}
          >
            {submitting ? 'Processing...' : 'Confirm & List'}
          </button>
          <button onClick={onClose} style={{ padding: '11px 16px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CardsPage() {
  const { connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { appMode } = useTxLine();
  const [allCards, setAllCards] = useState<{ instance: OwnedCard; card: SkillCard }[]>([]);
  const [upgradeCards, setUpgradeCards] = useState<{ instance: OwnedUpgradeCard; card: UpgradeCard }[]>([]);
  const [activeTab, setActiveTab] = useState<'skill' | 'upgrade'>('skill');
  const [upgradeTarget, setUpgradeTarget] = useState<{ instance: OwnedUpgradeCard; card: UpgradeCard } | null>(null);
  const [showDemoOpener, setShowDemoOpener] = useState(false);
  const [showDemoUpgradeOpener, setShowDemoUpgradeOpener] = useState(false);
  const [filterPos, setFilterPos] = useState<FilterPos>('all');
  const [filterRarity, setFilterRarity] = useState<FilterRarity>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [equipTarget, setEquipTarget] = useState<{ instance: OwnedCard; card: SkillCard } | null>(null);
  const [viewTarget, setViewTarget] = useState<{ instance?: OwnedCard; card: SkillCard } | null>(null);
  const [viewUpgradeTarget, setViewUpgradeTarget] = useState<{ instance?: OwnedUpgradeCard; card: UpgradeCard } | null>(null);
  const [combineTarget, setCombineTarget] = useState<SkillCard | null>(null);
  const [skillUpgradeTarget, setSkillUpgradeTarget] = useState<{ instance: OwnedCard; card: SkillCard } | null>(null);
  const [shimmerIds, setShimmerIds] = useState<Set<string>>(new Set());
  const [isCombineInfoExpanded, setIsCombineInfoExpanded] = useState(true);
  const [isUpgradeInfoExpanded, setIsUpgradeInfoExpanded] = useState(true);

  // ── Marketplace state ───────────────────────────────────────────────────────
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [listTarget, setListTarget] = useState<{ instance: OwnedCard; card: SkillCard } | null>(null);
  const [listUpgradeTarget, setListUpgradeTarget] = useState<{ instance: OwnedUpgradeCard; card: UpgradeCard } | null>(null);
  const [listStatusText, setListStatusText] = useState('');
  const [listedCardIds, setListedCardIds] = useState<Set<string>>(new Set()); // instanceId set
  const [listingPdas, setListingPdas] = useState<Record<string, string>>({}); // instanceId → listingPda
  const [listToast, setListToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // ── New-card & sold-notification state ─────────────────────────────────────
  const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());
  // soldListings: listings the seller hasn't acknowledged yet (status = 'sold')
  const [soldListings, setSoldListings] = useState<Array<{ listingPda: string; instanceId: string | null; cardId: string; cardType: string }>>([]);

  // ── Welcome Gift State ──────────────────────────────────────────────────────
  const { publicKey } = useWallet();
  const [welcomeGiftState, setWelcomeGiftState] = useState<'checking' | 'available' | 'opening' | 'done'>('checking');
  const [giftQueue, setGiftQueue] = useState<{ type: 'skill' | 'upgrade'; cardId: string }[]>([]);
  const [giftIndex, setGiftIndex] = useState(0);

  useEffect(() => {
    if (!connected || !publicKey) {
      setWelcomeGiftState('checking');
      return;
    }
    const walletStr = publicKey.toString();
    const claimedKey = `txodds_welcome_gift_claimed_${walletStr}`;

    const buildGift = () => {
      const validSkillCards = SKILL_CARDS.filter(c => ['Common', 'Uncommon', 'Rare', 'Epic'].includes(c.rarity));
      const validUpgradeCards = UPGRADE_CARDS.filter(c => c.level <= 2);
      const generated: { type: 'skill' | 'upgrade'; cardId: string }[] = [];
      for (let i = 0; i < 5; i++) {
        generated.push({ type: 'skill', cardId: validSkillCards[Math.floor(Math.random() * validSkillCards.length)].id });
        generated.push({ type: 'upgrade', cardId: validUpgradeCards[Math.floor(Math.random() * validUpgradeCards.length)].id });
      }
      generated.sort(() => Math.random() - 0.5);
      setGiftQueue(generated);
      setWelcomeGiftState('available');
    };

    // Fast path: localStorage already marked
    if (localStorage.getItem(claimedKey)) {
      setWelcomeGiftState('done');
      return;
    }

    // Verify against Supabase — gift is one-time per wallet across all devices
    fetch(`/api/user/data?wallet=${walletStr}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { pack_opened?: { welcomeGiftClaimed?: boolean } } | null) => {
        if (data?.pack_opened?.welcomeGiftClaimed) {
          localStorage.setItem(claimedKey, 'true');
          setWelcomeGiftState('done');
        } else {
          buildGift();
        }
      })
      .catch(() => buildGift());
  }, [connected, publicKey]);

  // Load new-card IDs from localStorage on mount and after reload
  useEffect(() => {
    setNewCardIds(getNewCardIds());
  }, [allCards, upgradeCards]);

  // Fetch seller's active + sold listings
  useEffect(() => {
    if (!publicKey) { setListedCardIds(new Set()); setSoldListings([]); return; }
    fetch(`/api/marketplace/listings?seller=${publicKey.toString()}&include_sold=true`)
      .then(r => r.ok ? r.json() : { listings: [] })
      .then(data => {
        const ids = new Set<string>();
        const pdaMap: Record<string, string> = {};
        const acked = getSoldAcked();
        const unackedSold: typeof soldListings = [];

        (data.listings ?? []).forEach((l: any) => {
          if (l.status === 'sold') {
            // Only show if not already acknowledged by this seller
            if (l.listing_pda && !acked.has(l.listing_pda)) {
              unackedSold.push({ listingPda: l.listing_pda, instanceId: l.instance_id ?? null, cardId: l.card_id, cardType: l.card_type ?? 'skill' });
            }
          } else {
            // active listing
            const key = l.instance_id ?? l.card_id;
            if (key) { ids.add(key); if (l.listing_pda) pdaMap[key] = l.listing_pda; }
          }
        });

        setListedCardIds(ids);
        setListingPdas(pdaMap);
        setSoldListings(unackedSold);
      })
      .catch(() => {});
  }, [publicKey]);

  const handleListCard = async (instance: OwnedCard, priceSol: number) => {
    if (!publicKey) return;
    try {
      setListStatusText('Approve in Phantom...');
      // Use instanceId as PDA key so each copy of the same card can be listed independently
      const pdaKey = instance.instanceId;
      const ix = buildListCardIx(publicKey, pdaKey, 'skill', BigInt(Math.round(priceSol * LAMPORTS_PER_SOL)));
      const { blockhash } = await connection.getLatestBlockhash();
      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(ix);
      const sig = await sendTransaction(tx, connection, { skipPreflight: true });
      setListStatusText('Confirming on Solana... (~15s)');
      await confirmWithTimeout(connection, sig);

      setListStatusText('Saving listing...');
      const res = await fetch('/api/marketplace/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txSignature: sig, sellerWallet: publicKey.toString(), instanceId: instance.instanceId, cardId: instance.cardId, cardType: 'skill', priceSol, upgradeCredits: instance.upgradeCredits ?? 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Listing failed');
      setListedCardIds(prev => new Set(prev).add(instance.instanceId));
      setListingPdas(prev => ({ ...prev, [instance.instanceId]: data.listingPda }));
      setListTarget(null);
      setListStatusText('');
      setListToast({ msg: 'Card listed on marketplace!', ok: true });
      setTimeout(() => setListToast(null), 4000);
    } catch (err: any) {
      setListStatusText('');
      setListToast({ msg: err.message ?? 'Transaction failed', ok: false });
      setTimeout(() => setListToast(null), 4000);
    }
  };

  const handleDelistCard = async (instanceId: string, cardId: string) => {
    if (!publicKey) return;
    try {
      // PDA was created with instanceId as key
      const ix = buildCancelListingIx(publicKey, instanceId);
      const { blockhash } = await connection.getLatestBlockhash();
      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(ix);
      const sig = await sendTransaction(tx, connection, { skipPreflight: true });
      await confirmWithTimeout(connection, sig);

      await fetch('/api/marketplace/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txSignature: sig, sellerWallet: publicKey.toString(), instanceId, cardId }),
      });
      setListedCardIds(prev => { const s = new Set(prev); s.delete(instanceId); return s; });
      setListingPdas(prev => { const m = { ...prev }; delete m[instanceId]; return m; });
      setListToast({ msg: 'Listing cancelled.', ok: true });
      setTimeout(() => setListToast(null), 4000);
    } catch (err: any) {
      setListToast({ msg: err.message ?? 'Transaction failed', ok: false });
      setTimeout(() => setListToast(null), 4000);
    }
  };

  const handleListUpgradeCard = async (instance: OwnedUpgradeCard, priceSol: number) => {
    if (!publicKey) return;
    try {
      setListStatusText('Approve in Phantom...');
      const pdaKey = instance.instanceId;
      const ix = buildListCardIx(publicKey, pdaKey, 'upgrade', BigInt(Math.round(priceSol * LAMPORTS_PER_SOL)));
      const { blockhash } = await connection.getLatestBlockhash();
      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(ix);
      const sig = await sendTransaction(tx, connection, { skipPreflight: true });
      setListStatusText('Confirming on Solana... (~15s)');
      await confirmWithTimeout(connection, sig);

      setListStatusText('Saving listing...');
      const res = await fetch('/api/marketplace/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txSignature: sig, sellerWallet: publicKey.toString(), instanceId: instance.instanceId, cardId: instance.upgradeCardId, cardType: 'upgrade', priceSol, upgradeCredits: 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Listing failed');
      setListedCardIds(prev => new Set(prev).add(instance.instanceId));
      setListingPdas(prev => ({ ...prev, [instance.instanceId]: data.listingPda }));
      setListUpgradeTarget(null);
      setListStatusText('');
      setListToast({ msg: 'Card listed on marketplace!', ok: true });
      setTimeout(() => setListToast(null), 4000);
    } catch (err: any) {
      setListStatusText('');
      setListToast({ msg: err.message ?? 'Transaction failed', ok: false });
      setTimeout(() => setListToast(null), 4000);
    }
  };

  const handleCardClick = (instance: OwnedCard, card: SkillCard) => {
    // Dismiss NEW badge on first click
    if (newCardIds.has(instance.instanceId)) {
      dismissNewCard(instance.instanceId);
      setNewCardIds(prev => { const s = new Set(prev); s.delete(instance.instanceId); return s; });
    }
    setShimmerIds(prev => new Set(prev).add(instance.instanceId));
    setTimeout(() => {
      setShimmerIds(prev => { const s = new Set(prev); s.delete(instance.instanceId); return s; });
      setViewTarget({ instance, card });
    }, 380);
  };

  // Seller acknowledges a SOLD listing — removes card from local inventory and hides the badge
  const handleAcknowledgeSold = (listing: { listingPda: string; instanceId: string | null; cardId: string; cardType: string }) => {
    ackSoldListing(listing.listingPda);
    // Remove the card from localStorage (server already removed from Supabase)
    if (listing.instanceId) {
      if (listing.cardType === 'upgrade') {
        removeUpgradeCardFromCollection(listing.instanceId);
      } else {
        removeCardFromCollection(listing.instanceId);
      }
    } else {
      // Legacy listing without instanceId — remove first matching card by cardId
      removeCardFromCollection(listing.cardId);
    }
    setSoldListings(prev => prev.filter(s => s.listingPda !== listing.listingPda));
    reload();
  };

  const reload = useCallback(() => {
    setAllCards(getCollectionWithDefs());
    const upgCol = getUpgradeCollection();
    const upgWithDefs = upgCol.cards
      .map(inst => {
        const card = getUpgradeCardById(inst.upgradeCardId);
        return card ? { instance: inst, card } : null;
      })
      .filter((x): x is { instance: OwnedUpgradeCard; card: UpgradeCard } => x !== null);
    setUpgradeCards(upgWithDefs);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleDemoOpenCard = () => {
    setShowDemoOpener(true);
  };

  const handleDemoOpenUpgradeCard = () => {
    setShowDemoUpgradeOpener(true);
  };

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

  const groupedFiltered = useMemo(() => {
    const groups = new Map<string, { instances: OwnedCard[], card: SkillCard }>();
    filtered.forEach(item => {
      const key = `${item.card.id}-${item.instance.upgradeCredits || 0}`;
      if (!groups.has(key)) {
        groups.set(key, { instances: [item.instance], card: item.card });
      } else {
        groups.get(key)!.instances.push(item.instance);
      }
    });
    return Array.from(groups.values());
  }, [filtered]);

  const groupedUpgradeCards = useMemo(() => {
    const groups = new Map<string, { instances: OwnedUpgradeCard[], card: UpgradeCard }>();
    upgradeCards.forEach(item => {
      const key = item.card.id;
      if (!groups.has(key)) {
        groups.set(key, { instances: [item.instance], card: item.card });
      } else {
        groups.get(key)!.instances.push(item.instance);
      }
    });
    return Array.from(groups.values());
  }, [upgradeCards]);

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
                My Collection
              </h1>
              {appMode === 'demo' && connected && (
                <>
                  <button 
                    onClick={handleDemoOpenCard}
                    style={{
                      background: '#ffd700', color: '#000', border: 'none', borderRadius: 8,
                      padding: '8px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(255, 215, 0, 0.25)',
                      letterSpacing: '0.05em'
                    }}
                  >
                    + DEMO: OPEN CARD
                  </button>
                  <button 
                    onClick={handleDemoOpenUpgradeCard}
                    style={{
                      background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8,
                      padding: '8px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
                      letterSpacing: '0.05em'
                    }}
                  >
                    + DEMO: UPGRADE PACK
                  </button>
                </>
              )}
            </div>
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

        {/* ── Tab switcher + Marketplace button ── */}
        {connected && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            {([{ key: 'skill', label: '🎴 Skill Cards', count: allCards.length }, { key: 'upgrade', label: '⬆ Upgrade Cards', count: upgradeCards.length }] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '14px 28px',
                  background: activeTab === tab.key ? '#ffd700' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: activeTab === tab.key ? '#000' : 'rgba(255,255,255,0.8)',
                  fontWeight: activeTab === tab.key ? 900 : 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s',
                  borderRadius: '12px',
                  boxShadow: activeTab === tab.key ? '0 4px 12px rgba(255,215,0,0.3)' : 'none',
                }}
              >
                {tab.label} {tab.count > 0 && <span style={{ fontSize: 11, opacity: 0.8, marginLeft: 6 }}>({tab.count})</span>}
              </button>
            ))}
            <button
              onClick={() => setShowMarketplace(true)}
              style={{
                marginLeft: 'auto', padding: '14px 24px',
                background: 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,215,0,0.06))',
                border: '1px solid rgba(255,215,0,0.4)',
                color: '#ffd700', fontWeight: 800, fontSize: 15,
                cursor: 'pointer', letterSpacing: '0.04em',
                transition: 'all 0.2s', borderRadius: '12px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,215,0,0.18)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,215,0,0.06))'; }}
            >
              🏪 Marketplace
            </button>
          </div>
        )}

        {/* Stats Info — only shown in Skill Cards tab */}
        {!connected ? (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: 12 }}>
              Connect Wallet to View Your Collection
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 40, maxWidth: 460, margin: '0 auto 40px' }}>
              Here is a preview of the Skill Cards you can collect. Log in and participate in contests to earn them!
            </p>
            <div className="cards-grid-mobile" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', marginBottom: 48 }}>
              {SKILL_CARDS.slice(0, 12).map((card) => (
                <div 
                  className="card-responsive-wrapper"
                  key={card.id} 
                  onClick={() => setViewTarget({ card })}
                  style={{ position: 'relative', borderRadius: 16, width: '100%', maxWidth: 240, cursor: 'pointer' }}
                >
                  <SkillCardDisplay card={card} width={240} selectable />
                </div>
              ))}
            </div>

            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 40, maxWidth: 460, margin: '0 auto 40px' }}>
              Level up your lineup with Upgrade Cards to boost base stats and open new tactical possibilities.
            </p>
            <div className="cards-grid-mobile" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
              {UPGRADE_CARDS.slice(0, 6).map((card) => (
                <div 
                  className="card-responsive-wrapper"
                  key={card.id} 
                  style={{ position: 'relative', borderRadius: 16, width: '100%', maxWidth: 240 }}
                >
                  <UpgradeCardDisplay card={card} width={240} />
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'skill' ? (
          <>
            <div className="card card--glass" style={{ marginBottom: 32, padding: 'var(--space-4) var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {[ 
                { label: 'Total Cards', value: allCards.length },
                { label: 'Legendary+', value: rareCount },
                { label: 'Rarities', value: Object.keys(RARITY_ORDER).length },
                { label: 'Upgrade Cards', value: upgradeCards.length }
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
          <div 
            onClick={() => setIsCombineInfoExpanded(!isCombineInfoExpanded)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isCombineInfoExpanded ? 14 : 0, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚗️</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#ffd700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Card Combine System</span>
            </div>
            <div style={{
              color: '#ffd700', fontSize: 14, transition: 'transform 0.2s',
              transform: isCombineInfoExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
            }}>
              ▼
            </div>
          </div>

          {isCombineInfoExpanded && (
            <div style={{ animation: 'fadeIn 0.2s' }}>
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
          )}
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
              @keyframes new-badge-pulse {
                0%, 100% { box-shadow: 0 0 6px 2px rgba(34,197,94,0.7); }
                50%       { box-shadow: 0 0 14px 5px rgba(34,197,94,0.3); }
              }
            `}</style>
            {groupedFiltered.map(({ instances, card }) => {
              const instance = instances[0];
              const count = instances.length;
              const isShimmering = shimmerIds.has(instance.instanceId);
              const copyCount = cardIdCount[instance.cardId] ?? 1;
              const isCombineable = copyCount >= 2 && canCombine(instance.cardId);
              const credits = instance.upgradeCredits ?? 0;
              const isMaxed = credits >= MAX_UPGRADE_CREDITS;
              const hasCompatibleUpgrade = !isMaxed && upgradeCards.some(u => u.card.position === card.position);
              const isListedInMarket = listedCardIds.has(instance.instanceId) || listedCardIds.has(instance.cardId);
              const isNew = newCardIds.has(instance.instanceId);
              const soldListing = soldListings.find(s => s.instanceId === instance.instanceId || (!s.instanceId && s.cardId === instance.cardId && s.cardType === 'skill'));
              const isSoulboundCard = !!instance.soulbound;
              return (
                <div
                  className="card-responsive-wrapper"
                  key={instance.instanceId}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', width: '100%', maxWidth: 240 }}
                  onClick={() => handleCardClick(instance, card)}
                >
                  <div style={{ position: 'relative', borderRadius: 16, width: '100%' }}>
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
                    {/* Listed badge */}
                    {isListedInMarket && (
                      <button
                        onClick={e => { e.stopPropagation(); const pdaKey = listedCardIds.has(instance.instanceId) ? instance.instanceId : instance.cardId; handleDelistCard(pdaKey, instance.cardId); }}
                        style={{
                          position: 'absolute', top: 8, left: 8, zIndex: 20,
                          background: 'rgba(255,165,0,0.95)', border: 'none', borderRadius: 10,
                          color: '#000', fontWeight: 900, fontSize: 12, padding: '5px 12px',
                          cursor: 'pointer', letterSpacing: 0.4, whiteSpace: 'nowrap',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                        }}
                      >
                        LISTED · Cancel
                      </button>
                    )}
                    {/* SOLD badge — seller hasn't acknowledged yet */}
                    {soldListing && (
                      <button
                        onClick={e => { e.stopPropagation(); handleAcknowledgeSold(soldListing); }}
                        style={{
                          position: 'absolute', top: 8, left: 8, zIndex: 21,
                          background: 'linear-gradient(135deg, #16a34a, #15803d)', border: '2px solid #4ade80',
                          borderRadius: 10, color: '#fff', fontWeight: 900, fontSize: 11,
                          padding: '5px 12px', cursor: 'pointer', letterSpacing: 0.4, whiteSpace: 'nowrap',
                          boxShadow: '0 2px 10px rgba(22,163,74,0.6)',
                        }}
                      >
                        ✅ SOLD · Claim
                      </button>
                    )}
                    {/* NEW badge */}
                    {isNew && !soldListing && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8, zIndex: 21,
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        border: '2px solid #fff', borderRadius: 10,
                        color: '#fff', fontWeight: 900, fontSize: 10,
                        padding: '3px 9px', letterSpacing: 0.5, whiteSpace: 'nowrap',
                        animation: 'new-badge-pulse 2s ease-in-out infinite',
                        pointerEvents: 'none',
                      }}>
                        ✨ NEW
                      </div>
                    )}
                    {/* Soulbound badge */}
                    {isSoulboundCard && (
                      <div style={{
                        position: 'absolute', bottom: 8, right: 8, zIndex: 20,
                        background: 'rgba(107,114,128,0.85)',
                        border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                        color: 'rgba(255,255,255,0.7)', fontWeight: 800, fontSize: 9,
                        padding: '3px 8px', letterSpacing: 0.5, whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                      }}>
                        🔒 SOULBOUND
                      </div>
                    )}
                    {/* Upgrade badge */}
                    {hasCompatibleUpgrade && (
                      <button
                        className="action-badge"
                        onClick={e => { e.stopPropagation(); setSkillUpgradeTarget({ instance, card }); }}
                        style={{
                          position: 'absolute', bottom: isCombineable ? 32 : 8, left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 20,
                          background: `linear-gradient(135deg, #e0c367, #c49a37)`,
                          border: 'none', borderRadius: 20,
                          color: '#000', fontWeight: 900, fontSize: 9,
                          padding: '4px 10px', cursor: 'pointer',
                          letterSpacing: 0.5, whiteSpace: 'nowrap',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                        }}
                      >
                        ⬆️ UPGRADE
                      </button>
                    )}
                    {/* Combine badge */}
                    {isCombineable && (
                      <button
                        className="action-badge"
                        onClick={e => { e.stopPropagation(); setCombineTarget(card); }}
                        style={{
                          position: 'absolute', bottom: 8, left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 20,
                          background: `linear-gradient(135deg, #e0c367, #c49a37)`,
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
                    {/* Gaming Duplicates Badge */}
                    {count > 1 && (
                      <div style={{
                        position: 'absolute', bottom: 4, right: 0,
                        zIndex: 20,
                        background: '#dc2626',
                        color: '#fff',
                        fontSize: '1.2rem',
                        fontWeight: 900,
                        padding: '2px 10px',
                        border: '3px solid #000',
                        transform: 'rotate(-8deg)',
                        boxShadow: '2px 4px 10px rgba(0,0,0,0.5)',
                        fontFamily: '"Impact", "Arial Black", sans-serif',
                        letterSpacing: '1px',
                        textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                        pointerEvents: 'none' // allow clicking the card under it
                      }}>
                        x{count}
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
        ) : null}

        {/* ── UPGRADE CARDS TAB ─────────────────────────────────────────────── */}
        {connected && activeTab === 'upgrade' && (
          <>
            {/* Info banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(156,39,176,0.12), rgba(33,150,243,0.08))',
              border: '1px solid rgba(156,39,176,0.3)',
              borderRadius: 12,
              padding: '18px 22px',
              marginBottom: 24,
            }}>
              <div 
                onClick={() => setIsUpgradeInfoExpanded(!isUpgradeInfoExpanded)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isUpgradeInfoExpanded ? 12 : 0, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>⬆</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#ce93d8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Upgrade Card System</span>
                </div>
                <div style={{
                  color: '#ce93d8', fontSize: 14, transition: 'transform 0.2s',
                  transform: isUpgradeInfoExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                  ▼
                </div>
              </div>
              
              {isUpgradeInfoExpanded && (
                <div style={{ animation: 'fadeIn 0.2s' }}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    {[
                      { icon: '🎲', label: 'Drop from packs', desc: '~15% chance to receive a bonus upgrade card after each match reward.' },
                      { icon: '⬆', label: 'Apply to Skill Card', desc: 'Click USE on an upgrade card, then pick a compatible Skill Card to boost.' },
                      { icon: '📈', label: 'Stacks up to MAX', desc: 'Level 1 (×4), Level 2 (×2), or Level 3 (×1) to reach max +30% modifier boost.' },
                    ].map(item => (
                      <div key={item.label} style={{
                        flex: '1 1 160px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(156,39,176,0.15)',
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                          <span>{item.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{item.label}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                    MAX upgrade = +30% to the Skill Card's modifier value. Progress carries over across games.
                  </div>
                </div>
              )}
            </div>

            {/* Demo: add upgrade card button */}
            {appMode === 'demo' && connected && (
              <div style={{ marginBottom: 20 }}>
                <button
                  onClick={() => {
                    const positions: UpgradePosition[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Winger', 'Striker'];
                    const levels = [1, 2, 3] as const;
                    const pos = positions[Math.floor(Math.random() * positions.length)];
                    const lvl = levels[Math.floor(Math.random() * levels.length)];
                    const card = UPGRADE_CARDS.find(c => c.position === pos && c.level === lvl);
                    if (card) { addUpgradeCardToCollection(card.id); reload(); }
                  }}
                  style={{
                    background: 'rgba(156,39,176,0.25)', color: '#ce93d8',
                    border: '1px solid rgba(156,39,176,0.5)', borderRadius: 8,
                    padding: '8px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    letterSpacing: '0.05em'
                  }}
                >
                  + DEMO: ADD UPGRADE CARD
                </button>
              </div>
            )}

            {/* Empty state */}
            {upgradeCards.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '60px 20px',
                background: 'rgba(255,255,255,0.02)', borderRadius: 16,
                border: '1px dashed rgba(255,255,255,0.1)',
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⬆</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No Upgrade Cards Yet</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', maxWidth: 320, margin: '0 auto' }}>
                  Upgrade cards have a ~15% chance to drop alongside your Skill Card after each match reward.
                </div>
              </div>
            )}

            {/* Upgrade card grid */}
            {groupedUpgradeCards.length > 0 && (
              <div className="cards-grid-mobile" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' }}>
                {groupedUpgradeCards.map(({ instances, card }) => {
                  const instance = instances[0];
                  const count = instances.length;
                  const listedUpgradeInstance = instances.find(i => listedCardIds.has(i.instanceId) || listedCardIds.has(i.upgradeCardId));
                  const isNewUpgrade = newCardIds.has(instance.instanceId);
                  const soldUpgradeListing = soldListings.find(s => s.instanceId === instance.instanceId || (!s.instanceId && s.cardId === instance.upgradeCardId && s.cardType === 'upgrade'));
                  const isSoulboundUpgrade = !!instance.soulbound;
                  return (
                    <div
                      key={instance.instanceId}
                      style={{
                        width: '100%', maxWidth: 220,
                        display: 'flex', flexDirection: 'column',
                        transition: 'transform 0.2s',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
                      onClick={() => {
                        if (isNewUpgrade) {
                          dismissNewCard(instance.instanceId);
                          setNewCardIds(prev => { const s = new Set(prev); s.delete(instance.instanceId); return s; });
                        }
                        setViewUpgradeTarget({ instance, card });
                      }}
                    >
                      {/* Card image and stats */}
                      <div style={{ position: 'relative' }}>
                        <UpgradeCardDisplay card={card} width={220} />
                        {/* Listed badge */}
                        {listedUpgradeInstance && (
                          <button
                            onClick={e => { e.stopPropagation(); const pdaKey = listedCardIds.has(listedUpgradeInstance.instanceId) ? listedUpgradeInstance.instanceId : listedUpgradeInstance.upgradeCardId; handleDelistCard(pdaKey, listedUpgradeInstance.upgradeCardId); }}
                            style={{
                              position: 'absolute', top: 8, left: 8, zIndex: 20,
                              background: 'rgba(255,165,0,0.95)', border: 'none', borderRadius: 10,
                              color: '#000', fontWeight: 900, fontSize: 12, padding: '5px 12px',
                              cursor: 'pointer', letterSpacing: 0.4, whiteSpace: 'nowrap',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                            }}
                          >
                            LISTED · Cancel
                          </button>
                        )}
                        {/* SOLD badge for upgrade cards */}
                        {soldUpgradeListing && (
                          <button
                            onClick={e => { e.stopPropagation(); handleAcknowledgeSold(soldUpgradeListing); }}
                            style={{
                              position: 'absolute', top: 8, left: 8, zIndex: 21,
                              background: 'linear-gradient(135deg, #16a34a, #15803d)', border: '2px solid #4ade80',
                              borderRadius: 10, color: '#fff', fontWeight: 900, fontSize: 11,
                              padding: '5px 12px', cursor: 'pointer', letterSpacing: 0.4, whiteSpace: 'nowrap',
                              boxShadow: '0 2px 10px rgba(22,163,74,0.6)',
                            }}
                          >
                            ✅ SOLD · Claim
                          </button>
                        )}
                        {/* NEW badge for upgrade cards */}
                        {isNewUpgrade && !soldUpgradeListing && (
                          <div style={{
                            position: 'absolute', top: 8, right: 8, zIndex: 21,
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            border: '2px solid #fff', borderRadius: 10,
                            color: '#fff', fontWeight: 900, fontSize: 10,
                            padding: '3px 9px', letterSpacing: 0.5, whiteSpace: 'nowrap',
                            animation: 'new-badge-pulse 2s ease-in-out infinite',
                            pointerEvents: 'none',
                          }}>
                            ✨ NEW
                          </div>
                        )}
                        {/* Soulbound badge for upgrade cards */}
                        {isSoulboundUpgrade && (
                          <div style={{
                            position: 'absolute', bottom: 8, right: 8, zIndex: 20,
                            background: 'rgba(107,114,128,0.85)',
                            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                            color: 'rgba(255,255,255,0.7)', fontWeight: 800, fontSize: 9,
                            padding: '3px 8px', letterSpacing: 0.5, whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                          }}>
                            🔒 SOULBOUND
                          </div>
                        )}

                        {/* Gaming Duplicates Badge */}
                        {count > 1 && (
                          <div style={{
                            position: 'absolute', bottom: 4, right: 0,
                            zIndex: 20,
                            background: '#dc2626',
                            color: '#fff',
                            fontSize: '1.2rem',
                            fontWeight: 900,
                            padding: '2px 10px',
                            border: '3px solid #000',
                            transform: 'rotate(-8deg)',
                            boxShadow: '2px 4px 10px rgba(0,0,0,0.5)',
                            fontFamily: '"Impact", "Arial Black", sans-serif',
                            letterSpacing: '1px',
                            textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                            pointerEvents: 'none'
                          }}>
                            x{count}
                          </div>
                        )}
                      </div>

                      {/* Obtained Date */}
                      <div style={{ padding: '8px 4px 0', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                          Obtained {new Date(instance.obtainedAt).toLocaleDateString()}
                        </div>
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
          onEquip={viewTarget.instance ? () => { setEquipTarget(viewTarget as { instance: OwnedCard; card: SkillCard }); setViewTarget(null); } : undefined}
          isListed={viewTarget.instance ? (listedCardIds.has(viewTarget.instance.instanceId) || listedCardIds.has(viewTarget.instance.cardId)) : false}
          isSoulbound={!!viewTarget.instance?.soulbound}
          onList={viewTarget.instance && !viewTarget.instance.soulbound ? () => { setListTarget(viewTarget as { instance: OwnedCard; card: SkillCard }); setViewTarget(null); } : undefined}
          onDelist={viewTarget.instance ? () => { const i = viewTarget.instance!; const pdaKey = listedCardIds.has(i.instanceId) ? i.instanceId : i.cardId; handleDelistCard(pdaKey, i.cardId); setViewTarget(null); } : undefined}
        />
      )}

      {/* Upgrade Card detail modal */}
      {viewUpgradeTarget && (
        <UpgradeCardDetailModal
          card={viewUpgradeTarget.card}
          instance={viewUpgradeTarget.instance}
          isListed={viewUpgradeTarget.instance ? (listedCardIds.has(viewUpgradeTarget.instance.instanceId) || listedCardIds.has(viewUpgradeTarget.instance.upgradeCardId)) : false}
          isSoulbound={!!viewUpgradeTarget.instance?.soulbound}
          onList={viewUpgradeTarget.instance && !viewUpgradeTarget.instance.soulbound ? () => { setListUpgradeTarget(viewUpgradeTarget as { instance: OwnedUpgradeCard; card: UpgradeCard }); setViewUpgradeTarget(null); } : undefined}
          onDelist={viewUpgradeTarget.instance ? () => { const i = viewUpgradeTarget.instance!; const pdaKey = listedCardIds.has(i.instanceId) ? i.instanceId : i.upgradeCardId; handleDelistCard(pdaKey, i.upgradeCardId); setViewUpgradeTarget(null); } : undefined}
          onClose={() => setViewUpgradeTarget(null)}
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

      {/* Skill Card Upgrade modal */}
      {skillUpgradeTarget && (
        <SkillUpgradeModal
          targetCard={skillUpgradeTarget.card}
          targetInstance={skillUpgradeTarget.instance}
          availableUpgrades={upgradeCards.filter(u => u.card.position === skillUpgradeTarget.card.position)}
          onClose={() => setSkillUpgradeTarget(null)}
          onSuccess={() => { setSkillUpgradeTarget(null); reload(); }}
        />
      )}

      {/* Upgrade modal */}
      {upgradeTarget && (
        <UpgradeModal
          upgradeCard={upgradeTarget.card}
          upgradeInstance={upgradeTarget.instance}
          onClose={() => setUpgradeTarget(null)}
          onSuccess={() => { setUpgradeTarget(null); reload(); }}
        />
      )}

      {/* Demo pack opener */}
      {showDemoOpener && (
        <CardPackOpener
          contestId={`demo-pack-${Date.now()}`}
          onOpen={() => {
            // Use openCardPack so upgrade card 15% drop logic is included
            const result = openCardPack(`demo-pack-${Date.now()}`);
            return result;
          }}
          onClose={() => {
            setShowDemoOpener(false);
            reload();
          }}
        />
      )}

      {/* Demo Upgrade pack opener */}
      {showDemoUpgradeOpener && (
        <CardPackOpener
          upgradePackMode={true}
          onOpen={() => {
            return openUpgradeCardPack();
          }}
          onClose={() => {
            setShowDemoUpgradeOpener(false);
            reload();
          }}
        />
      )}

      {/* Marketplace Modal */}
      {showMarketplace && (
        <MarketplaceModal
          walletPublicKey={publicKey?.toString() ?? null}
          connection={connection}
          sendTransaction={sendTransaction}
          onClose={() => setShowMarketplace(false)}
          onListingSold={(instanceId) => {
            setListedCardIds(prev => { const s = new Set(prev); s.delete(instanceId); return s; });
            reload();
          }}
        />
      )}

      {/* List Skill Card Modal */}
      {listTarget && (
        <ListCardModal
          cardName={listTarget.card.name}
          cardSubtitle={`${listTarget.card.rarity} · ${listTarget.card.position}`}
          statusText={listStatusText}
          onClose={() => { setListTarget(null); setListStatusText(''); }}
          onConfirm={(priceSol) => handleListCard(listTarget.instance, priceSol)}
        />
      )}

      {/* List Upgrade Card Modal */}
      {listUpgradeTarget && (
        <ListCardModal
          cardName={listUpgradeTarget.card.name}
          cardSubtitle={`${listUpgradeTarget.card.rarity} · ${listUpgradeTarget.card.position} Upgrade`}
          statusText={listStatusText}
          onClose={() => { setListUpgradeTarget(null); setListStatusText(''); }}
          onConfirm={(priceSol) => handleListUpgradeCard(listUpgradeTarget.instance, priceSol)}
        />
      )}

      {/* Listing toast */}
      {listToast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
          background: listToast.ok ? 'rgba(0,232,122,0.12)' : 'rgba(255,60,60,0.12)',
          border: `1px solid ${listToast.ok ? 'rgba(0,232,122,0.4)' : 'rgba(255,60,60,0.4)'}`,
          borderRadius: 10, padding: '12px 20px',
          color: listToast.ok ? '#00e87a' : '#ff6b6b',
          fontSize: '0.85rem', fontWeight: 700, maxWidth: 300,
        }}>
          {listToast.msg}
        </div>
      )}

      {/* Welcome Gift Flow */}
      {(welcomeGiftState === 'available' || welcomeGiftState === 'opening') && giftQueue.length > 0 && publicKey && (
        <WelcomeGiftModal
          queue={giftQueue}
          publicKey={publicKey.toString()}
          onComplete={() => {
            setWelcomeGiftState('done');
            reload();
          }}
        />
      )}

      <style>{`
        .action-badge {
          transition: transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease !important;
        }
        .action-badge:hover {
          transform: translateX(-50%) scale(1.08) !important;
          filter: brightness(1.2) drop-shadow(0 4px 12px rgba(224, 195, 103, 0.4)) !important;
        }
      `}</style>
    </main>
  );
}
