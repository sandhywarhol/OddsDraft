// Card Collection — localStorage-backed collection management for Skill Cards
// Stores owned cards, handles gacha roll, equip/unequip per contest lineup.

import {
  SKILL_CARDS,
  RARITY_CHANCE,
  RARITY_ORDER,
  type SkillCard,
  type Rarity,
  type CardPosition,
  LINEUP_POS_TO_CARD_POS,
} from './skill-cards';

// ── Combine system ────────────────────────────────────────────────────────────
// 2 copies of the same card (same cardId) → 1 card of the next rarity,
// same position, randomly selected from that position's pool.

export interface CombineResult {
  success: boolean;
  resultCard: SkillCard | null;
  resultInstance: OwnedCard | null;
  error?: string;
}

export function canCombine(cardId: string): boolean {
  if (typeof window === 'undefined') return false;
  const col = getCollection();
  const copies = col.cards.filter(c => c.cardId === cardId);
  const card = SKILL_CARDS.find(c => c.id === cardId);
  if (!card) return false;
  const currentRarityIdx = RARITY_ORDER.indexOf(card.rarity);
  return copies.length >= 2 && currentRarityIdx < RARITY_ORDER.length - 1;
}

export function combineCards(cardId: string): CombineResult {
  const col = getCollection();
  const copies = col.cards.filter(c => c.cardId === cardId);
  const card = SKILL_CARDS.find(c => c.id === cardId);

  if (!card) return { success: false, resultCard: null, resultInstance: null, error: 'Card definition not found.' };
  if (copies.length < 2) return { success: false, resultCard: null, resultInstance: null, error: 'Need 2 copies to combine.' };

  const currentRarityIdx = RARITY_ORDER.indexOf(card.rarity);
  if (currentRarityIdx >= RARITY_ORDER.length - 1) {
    return { success: false, resultCard: null, resultInstance: null, error: 'Already at maximum rarity (SSSR).' };
  }

  // Consume 2 copies (take first two by instanceId)
  const toRemove = copies.slice(0, 2).map(c => c.instanceId);
  col.cards = col.cards.filter(c => !toRemove.includes(c.instanceId));

  // Pick result card: next rarity, same position
  const nextRarity: Rarity = RARITY_ORDER[currentRarityIdx + 1];
  const pool = SKILL_CARDS.filter(c => c.rarity === nextRarity && c.position === card.position);
  const resultCard = pool.length > 0
    ? pool[Math.floor(Math.random() * pool.length)]
    : SKILL_CARDS.filter(c => c.rarity === nextRarity)[0]; // fallback: any card of next rarity

  const resultInstance: OwnedCard = {
    instanceId: `combine-${cardId}-${Date.now()}`,
    cardId: resultCard.id,
    obtainedAt: new Date().toISOString(),
  };

  col.cards.unshift(resultInstance);
  saveCollection(col);

  return { success: true, resultCard, resultInstance };
}

export interface OwnedCard {
  instanceId: string;
  cardId: string;
  obtainedAt: string; // ISO date
}

export interface CardCollection {
  cards: OwnedCard[];
}

const COLLECTION_KEY = 'oddsdraft_card_collection';
const PACK_OPENED_PREFIX = 'oddsdraft_pack_opened_';

export function getCollection(): CardCollection {
  if (typeof window === 'undefined') return { cards: [] };
  try {
    const stored = localStorage.getItem(COLLECTION_KEY);
    if (stored) return JSON.parse(stored) as CardCollection;
  } catch {}
  return { cards: [] };
}

function saveCollection(col: CardCollection): void {
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(col));
}

export function addCardToCollection(card: OwnedCard): void {
  const col = getCollection();
  col.cards.unshift(card);
  saveCollection(col);
}

export function rollRandomCard(): SkillCard {
  const rand = Math.random();
  let cumulative = 0;
  // Iterate from rarest to most common so thresholds accumulate correctly
  for (const rarity of [...RARITY_ORDER].reverse() as Rarity[]) {
    cumulative += RARITY_CHANCE[rarity];
    if (rand <= cumulative) {
      const pool = SKILL_CARDS.filter(c => c.rarity === rarity);
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }
  const commons = SKILL_CARDS.filter(c => c.rarity === 'Common');
  return commons[Math.floor(Math.random() * commons.length)];
}

export function openCardPack(contestId: string): { instance: OwnedCard; card: SkillCard } {
  const card = rollRandomCard();
  const instance: OwnedCard = {
    instanceId: `${contestId}-${Date.now()}`,
    cardId: card.id,
    obtainedAt: new Date().toISOString(),
  };
  addCardToCollection(instance);
  localStorage.setItem(`${PACK_OPENED_PREFIX}${contestId}`, '1');
  return { instance, card };
}

export function hasOpenedPack(contestId: string): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(`${PACK_OPENED_PREFIX}${contestId}`) === '1';
}

export function getCardById(cardId: string): SkillCard | undefined {
  return SKILL_CARDS.find(c => c.id === cardId);
}

// Returns all cards in collection with their SkillCard definition
export function getCollectionWithDefs(): { instance: OwnedCard; card: SkillCard }[] {
  const col = getCollection();
  return col.cards
    .map(inst => {
      const card = getCardById(inst.cardId);
      return card ? { instance: inst, card } : null;
    })
    .filter((x): x is { instance: OwnedCard; card: SkillCard } => x !== null);
}

// Returns cards in collection that are compatible with a given lineup position
export function getCardsForLineupPosition(lineupPos: string): { instance: OwnedCard; card: SkillCard }[] {
  const allowedPositions: CardPosition[] = LINEUP_POS_TO_CARD_POS[lineupPos] ?? [];
  return getCollectionWithDefs().filter(({ card }) => allowedPositions.includes(card.position));
}

// ── Per-lineup equip management ────────────────────────────────────────────
// equippedCards is stored inside the lineup localStorage entry to keep
// everything co-located with the lineup submission.

function readLineup(contestId: string): Record<string, unknown> | null {
  try {
    const stored = localStorage.getItem(`txodds_user_lineup_${contestId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function writeLineup(contestId: string, data: Record<string, unknown>): void {
  localStorage.setItem(`txodds_user_lineup_${contestId}`, JSON.stringify(data));
}

export function getEquippedCardInstance(contestId: string, playerId: string): OwnedCard | null {
  if (typeof window === 'undefined') return null;
  const lineup = readLineup(contestId);
  if (!lineup) return null;
  const equippedCards = (lineup.equippedCards ?? {}) as Record<string, string>;
  const instanceId = equippedCards[playerId];
  if (!instanceId) return null;
  const col = getCollection();
  return col.cards.find(c => c.instanceId === instanceId) ?? null;
}

export function getEquippedCardDef(contestId: string, playerId: string): SkillCard | null {
  const instance = getEquippedCardInstance(contestId, playerId);
  return instance ? (getCardById(instance.cardId) ?? null) : null;
}

// Resolve an instanceId → SkillCard (used in live page panel)
export function getCardDefByInstanceId(instanceId: string): SkillCard | undefined {
  const col = getCollection();
  const instance = col.cards.find(c => c.instanceId === instanceId);
  if (!instance) return undefined;
  return getCardById(instance.cardId);
}

export function equipCard(contestId: string, playerId: string, instanceId: string): void {
  const lineup = readLineup(contestId);
  if (!lineup) return;
  const equippedCards = ((lineup.equippedCards ?? {}) as Record<string, string>);
  // Exclusive equip — remove this instanceId from any other player first
  for (const pid of Object.keys(equippedCards)) {
    if (equippedCards[pid] === instanceId && pid !== playerId) {
      delete equippedCards[pid];
    }
  }
  equippedCards[playerId] = instanceId;
  writeLineup(contestId, { ...lineup, equippedCards });
}

// Flat bonus this card adds for a single event type.
// Reduction cards (goal_conceded_reduction, yellow_card_reduction) return a positive
// value that offsets the negative base points.
export function getCardBonusForEvent(card: SkillCard, eventType: string): number {
  switch (card.modifierType) {
    case 'goal_bonus':              return eventType === 'goal'             ? card.modifierValue : 0;
    case 'assist_bonus':            return eventType === 'assist'            ? card.modifierValue : 0;
    case 'goalkeeper_save_bonus':   return eventType === 'goalkeeper_save'   ? card.modifierValue : 0;
    case 'goal_conceded_reduction': return eventType === 'goal_conceded'     ? card.modifierValue : 0;
    case 'clean_sheet_bonus':       return eventType === 'clean_sheet'       ? card.modifierValue : 0;
    case 'yellow_card_reduction':   return eventType === 'yellow_card'       ? card.modifierValue : 0;
    case 'possession_bonus_extra':  return eventType === 'possession_bonus'  ? card.modifierValue : 0;
    case 'penalty_save_bonus':      return eventType === 'penalty_save'      ? card.modifierValue : 0;
    case 'penalty_scored_bonus':    return eventType === 'penalty_scored'    ? card.modifierValue : 0;
    case 'appearance_bonus':
      return (eventType === 'starting_xi' || eventType === 'sub_appearance') ? card.modifierValue : 0;
    default: return 0;
  }
}

export function unequipCard(contestId: string, playerId: string): void {
  const lineup = readLineup(contestId);
  if (!lineup) return;
  const equippedCards = ((lineup.equippedCards ?? {}) as Record<string, string>);
  delete equippedCards[playerId];
  writeLineup(contestId, { ...lineup, equippedCards });
}

// ── Skill modifier application (call this after Fantasy Engine calculates) ──
export interface SkillModifierResult {
  bonus: number;
  cardName: string | null;
  cardRarity: Rarity | null;
}

export function applySkillModifier(
  contestId: string,
  playerId: string,
  playerEvents: { type: string }[]
): SkillModifierResult {
  const card = getEquippedCardDef(contestId, playerId);
  if (!card) return { bonus: 0, cardName: null, cardRarity: null };

  let bonus = 0;
  for (const ev of playerEvents) {
    switch (card.modifierType) {
      case 'goal_bonus':               if (ev.type === 'goal') bonus += card.modifierValue; break;
      case 'assist_bonus':             if (ev.type === 'assist') bonus += card.modifierValue; break;
      case 'goalkeeper_save_bonus':    if (ev.type === 'goalkeeper_save') bonus += card.modifierValue; break;
      case 'goal_conceded_reduction':  if (ev.type === 'goal_conceded') bonus += card.modifierValue; break;
      case 'clean_sheet_bonus':        if (ev.type === 'clean_sheet') bonus += card.modifierValue; break;
      case 'yellow_card_reduction':    if (ev.type === 'yellow_card') bonus += card.modifierValue; break;
      case 'possession_bonus_extra':   if (ev.type === 'possession_bonus') bonus += card.modifierValue; break;
      case 'penalty_save_bonus':       if (ev.type === 'penalty_save') bonus += card.modifierValue; break;
      case 'appearance_bonus':         if (ev.type === 'starting_xi' || ev.type === 'sub_appearance') bonus += card.modifierValue; break;
      case 'penalty_scored_bonus':     if (ev.type === 'penalty_scored') bonus += card.modifierValue; break;
    }
  }

  return { bonus: Math.round(bonus * 100) / 100, cardName: card.name, cardRarity: card.rarity };
}
