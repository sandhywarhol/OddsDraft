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

import {
  UPGRADE_PACK_DROP_CHANCE,
  rollUpgradeCard,
  getUpgradeCardById,
  getUpgradeMultiplier,
  MAX_UPGRADE_CREDITS,
  type UpgradeCard,
} from './upgrade-cards';

// Produces a compact 16-char hex ID safe for Solana PDA seeds (well under 32 bytes)
export function makeInstanceId(): string {
  const arr = new Uint8Array(8);
  (typeof crypto !== 'undefined' ? crypto : require('crypto')).getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

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
    instanceId: makeInstanceId(),
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
  upgradeCredits?: number; // 0–10, drives the upgrade multiplier
  soulbound?: boolean;     // Gift cards — permanently bound to owner, cannot be sold
}

// ── Upgrade Card Inventory ────────────────────────────────────────────────────
export interface OwnedUpgradeCard {
  instanceId: string;
  upgradeCardId: string;
  obtainedAt: string;
  soulbound?: boolean;     // Gift cards — permanently bound to owner, cannot be sold
}

export interface UpgradeCardCollection {
  cards: OwnedUpgradeCard[];
}

export interface UpgradeResult {
  success: boolean;
  newCredits: number;
  isMaxed: boolean;
  error?: string;
}

export interface CardCollection {
  cards: OwnedCard[];
}

const COLLECTION_KEY = 'oddsdraft_card_collection';
const PACK_OPENED_PREFIX = 'oddsdraft_pack_opened_';
const UPGRADE_COLLECTION_KEY = 'oddsdraft_upgrade_collection';
const NEW_CARDS_KEY = 'oddsdraft_new_cards';
const SOLD_ACKED_KEY = 'oddsdraft_sold_acked';

// Fired after any mutation to the skill/upgrade collections so SupabaseSyncProvider
// can push the change to Supabase immediately (not only on tab close). Without this,
// cards earned this session reach Supabase solely via an unreliable unload flush —
// which frequently never fires on mobile — so a different device sees an empty wallet.
export const COLLECTION_CHANGED_EVENT = 'oddsdraft:collection-changed';
// Fired by SupabaseSyncProvider once it has pulled a wallet's data from Supabase into
// localStorage. Collection views (e.g. /cards) that read localStorage on mount listen
// for this to re-read after the async pull lands — otherwise a fresh device shows an
// empty collection until a manual refresh.
export const REMOTE_SYNCED_EVENT = 'oddsdraft:remote-synced';
function emitCollectionChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(COLLECTION_CHANGED_EVENT));
  }
}

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
  emitCollectionChanged();
}

// ── Upgrade Card Collection Storage ─────────────────────────────────────────
export function getUpgradeCollection(): UpgradeCardCollection {
  if (typeof window === 'undefined') return { cards: [] };
  try {
    const stored = localStorage.getItem(UPGRADE_COLLECTION_KEY);
    if (stored) return JSON.parse(stored) as UpgradeCardCollection;
  } catch {}
  return { cards: [] };
}

function saveUpgradeCollection(col: UpgradeCardCollection): void {
  localStorage.setItem(UPGRADE_COLLECTION_KEY, JSON.stringify(col));
  emitCollectionChanged();
}

export function addUpgradeCardToCollection(upgradeCardId: string, soulbound = false): OwnedUpgradeCard {
  const col = getUpgradeCollection();
  const instance: OwnedUpgradeCard = {
    instanceId: makeInstanceId(),
    upgradeCardId,
    obtainedAt: new Date().toISOString(),
    ...(soulbound ? { soulbound: true } : {}),
  };
  col.cards.unshift(instance);
  saveUpgradeCollection(col);
  markCardAsNew(instance.instanceId);
  return instance;
}

// ── Apply Upgrade Card to Skill Card ─────────────────────────────────────────
// Consumes 1 upgrade card instance, adds credits to the target skill card instance.
export function upgradeSkillCard(
  skillCardInstanceId: string,
  upgradeCardInstanceId: string
): UpgradeResult {
  const upgCol = getUpgradeCollection();
  const upgradeInstance = upgCol.cards.find(c => c.instanceId === upgradeCardInstanceId);
  if (!upgradeInstance) {
    return { success: false, newCredits: 0, isMaxed: false, error: 'Upgrade card not found.' };
  }

  const upgradeCard = getUpgradeCardById(upgradeInstance.upgradeCardId);
  if (!upgradeCard) {
    return { success: false, newCredits: 0, isMaxed: false, error: 'Upgrade card definition not found.' };
  }

  const col = getCollection();
  const skillInstance = col.cards.find(c => c.instanceId === skillCardInstanceId);
  if (!skillInstance) {
    return { success: false, newCredits: 0, isMaxed: false, error: 'Skill card instance not found.' };
  }

  const currentCredits = skillInstance.upgradeCredits ?? 0;
  if (currentCredits >= MAX_UPGRADE_CREDITS) {
    return { success: false, newCredits: currentCredits, isMaxed: true, error: 'Card is already at max upgrade level.' };
  }

  // Add credits (capped at max)
  const newCredits = Math.min(currentCredits + upgradeCard.upgradeCredits, MAX_UPGRADE_CREDITS);
  skillInstance.upgradeCredits = newCredits;

  // Consume the upgrade card
  upgCol.cards = upgCol.cards.filter(c => c.instanceId !== upgradeCardInstanceId);
  saveUpgradeCollection(upgCol);
  saveCollection(col);

  return {
    success: true,
    newCredits,
    isMaxed: newCredits >= MAX_UPGRADE_CREDITS,
  };
}

// ── New-card tracking ─────────────────────────────────────────────────────────
// instanceIds of cards the user hasn't clicked yet — cleared per-card on first click.

export function getNewCardIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(NEW_CARDS_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch { return new Set(); }
}

export function markCardAsNew(instanceId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const ids = Array.from(getNewCardIds());
    if (!ids.includes(instanceId)) {
      ids.push(instanceId);
      localStorage.setItem(NEW_CARDS_KEY, JSON.stringify(ids));
    }
  } catch {}
}

export function dismissNewCard(instanceId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const ids = Array.from(getNewCardIds()).filter(id => id !== instanceId);
    localStorage.setItem(NEW_CARDS_KEY, JSON.stringify(ids));
  } catch {}
}

// ── Sold listing acknowledgment ───────────────────────────────────────────────
// Listing PDAs the seller has acknowledged so the SOLD badge doesn't reappear.

export function getSoldAcked(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(SOLD_ACKED_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch { return new Set(); }
}

export function ackSoldListing(listingPda: string): void {
  if (typeof window === 'undefined') return;
  try {
    const pdas = Array.from(getSoldAcked());
    if (!pdas.includes(listingPda)) {
      pdas.push(listingPda);
      localStorage.setItem(SOLD_ACKED_KEY, JSON.stringify(pdas));
    }
  } catch {}
}

export function addCardToCollection(card: OwnedCard): void {
  const col = getCollection();
  col.cards.unshift(card);
  saveCollection(col);
  markCardAsNew(card.instanceId);
}

export function removeCardFromCollection(instanceId: string): void {
  const col = getCollection();
  col.cards = col.cards.filter(c => c.instanceId !== instanceId);
  saveCollection(col);
}

export function removeUpgradeCardFromCollection(instanceId: string): void {
  const col = getUpgradeCollection();
  col.cards = col.cards.filter(c => c.instanceId !== instanceId);
  saveUpgradeCollection(col);
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

export function openCardPack(contestId: string): {
  instance: OwnedCard;
  card: SkillCard;
  upgradeInstance?: OwnedUpgradeCard;
  upgradeCard?: UpgradeCard;
} {
  const card = rollRandomCard();
  const instance: OwnedCard = {
    instanceId: makeInstanceId(),
    cardId: card.id,
    obtainedAt: new Date().toISOString(),
  };
  addCardToCollection(instance);
  localStorage.setItem(`${PACK_OPENED_PREFIX}${contestId}`, '1');

  // Bonus: ~15% chance to also drop an upgrade card
  if (Math.random() < UPGRADE_PACK_DROP_CHANCE) {
    const upgradeCard = rollUpgradeCard();
    const upgradeInstance = addUpgradeCardToCollection(upgradeCard.id);
    return { instance, card, upgradeInstance, upgradeCard };
  }

  return { instance, card };
}

export function openUpgradeCardPack(): {
  upgradeInstance: OwnedUpgradeCard;
  upgradeCard: UpgradeCard;
} {
  const upgradeCard = rollUpgradeCard();
  const upgradeInstance = addUpgradeCardToCollection(upgradeCard.id);
  return { upgradeInstance, upgradeCard };
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
  // Equip/unequip lives inside the lineup entry — mark dirty so the change syncs to
  // Supabase (SupabaseSyncProvider's payload includes lineups), not just the collection.
  emitCollectionChanged();
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

export function getCardInstanceById(instanceId: string): OwnedCard | undefined {
  const col = getCollection();
  return col.cards.find(c => c.instanceId === instanceId);
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
export function getCardBonusForEvent(card: SkillCard, eventType: string, upgradeCredits: number = 0): number {
  let baseValue = 0;
  switch (card.modifierType) {
    case 'goal_bonus':              baseValue = eventType === 'goal'             ? card.modifierValue : 0; break;
    case 'assist_bonus':            baseValue = eventType === 'assist'            ? card.modifierValue : 0; break;
    case 'goalkeeper_save_bonus':   baseValue = eventType === 'goalkeeper_save'   ? card.modifierValue : 0; break;
    case 'goal_conceded_reduction': baseValue = eventType === 'goal_conceded'     ? card.modifierValue : 0; break;
    case 'clean_sheet_bonus':       baseValue = eventType === 'clean_sheet'       ? card.modifierValue : 0; break;
    case 'yellow_card_reduction':   baseValue = eventType === 'yellow_card'       ? card.modifierValue : 0; break;
    case 'possession_bonus_extra':  baseValue = (eventType === 'possession_bonus' || eventType === 'possession_dominant' || eventType === 'possession_slight') ? card.modifierValue : 0; break;
    case 'penalty_save_bonus':      baseValue = eventType === 'penalty_save'      ? card.modifierValue : 0; break;
    case 'penalty_scored_bonus':    baseValue = eventType === 'penalty_scored'    ? card.modifierValue : 0; break;
    case 'appearance_bonus':        baseValue = (eventType === 'starting_xi' || eventType === 'sub_appearance') ? card.modifierValue : 0; break;
    default:                        baseValue = 0;
  }
  
  if (baseValue === 0 || !upgradeCredits) return baseValue;
  
  const credits = Math.min(upgradeCredits, 10);
  const multiplier = 1 + (credits / 10) * 0.3;
  return baseValue * multiplier;
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

  // Get upgrade multiplier from the equipped card instance's upgradeCredits
  const instance = getEquippedCardInstance(contestId, playerId);
  const upgradeCredits = instance?.upgradeCredits ?? 0;
  const upgradeMultiplier = getUpgradeMultiplier(upgradeCredits);
  const effectiveValue = card.modifierValue * (1 + upgradeMultiplier);

  let bonus = 0;
  for (const ev of playerEvents) {
    switch (card.modifierType) {
      case 'goal_bonus':               if (ev.type === 'goal') bonus += effectiveValue; break;
      case 'assist_bonus':             if (ev.type === 'assist') bonus += effectiveValue; break;
      case 'goalkeeper_save_bonus':    if (ev.type === 'goalkeeper_save') bonus += effectiveValue; break;
      case 'goal_conceded_reduction':  if (ev.type === 'goal_conceded') bonus += effectiveValue; break;
      case 'clean_sheet_bonus':        if (ev.type === 'clean_sheet') bonus += effectiveValue; break;
      case 'yellow_card_reduction':    if (ev.type === 'yellow_card') bonus += effectiveValue; break;
      case 'possession_bonus_extra':   if (ev.type === 'possession_bonus' || ev.type === 'possession_dominant' || ev.type === 'possession_slight') bonus += effectiveValue; break;
      case 'penalty_save_bonus':       if (ev.type === 'penalty_save') bonus += effectiveValue; break;
      case 'appearance_bonus':         if (ev.type === 'starting_xi' || ev.type === 'sub_appearance') bonus += effectiveValue; break;
      case 'penalty_scored_bonus':     if (ev.type === 'penalty_scored') bonus += effectiveValue; break;
    }
  }

  return { bonus: Math.round(bonus * 100) / 100, cardName: card.name, cardRarity: card.rarity };
}
