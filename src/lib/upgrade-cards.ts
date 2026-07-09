// Upgrade Card System — OddsDraft
// 15 Upgrade Cards (3 levels × 5 positions) that boost Skill Card modifier values.

export type UpgradePosition = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Winger' | 'Striker';
export type UpgradeLevel = 1 | 2 | 3;

export interface UpgradeCard {
  id: string;
  name: string;
  position: UpgradePosition;
  level: UpgradeLevel;
  rarity: 'Uncommon' | 'Rare' | 'Epic';
  // Credits granted to the skill card when this upgrade card is consumed.
  // Max upgrade progress = 10 credits.
  // Lv1 = 2.5 credits (need 4 to max)
  // Lv2 = 5.0 credits (need 2 to max)
  // Lv3 = 10  credits (1 to max)
  upgradeCredits: number;
  // Multiplier added to skill card's modifierValue at max upgrade (10 credits)
  // Interpolated: (currentCredits / 10) × 0.3
  maxMultiplier: 0.3;
  description: string;
  flavorText: string;
  imageUrl: string;
}

// ── Drop Rates ─────────────────────────────────────────────────────────────
// Total chance to get AN upgrade card in a single pack opening: ~15%
// Distribution within that 15%:
//   Lv1 (Uncommon): 60% of 15% = 9%
//   Lv2 (Rare):     30% of 15% = 4.5%
//   Lv3 (Epic):     10% of 15% = 1.5%
export const UPGRADE_PACK_DROP_CHANCE = 0.50;
export const UPGRADE_LEVEL_DIST: Record<UpgradeLevel, number> = {
  1: 0.60,
  2: 0.30,
  3: 0.10,
};

export const UPGRADE_RARITY_COLOR: Record<'Uncommon' | 'Rare' | 'Epic', string> = {
  Uncommon: '#4caf50',
  Rare:     '#2196f3',
  Epic:     '#9c27b0',
};

export const UPGRADE_RARITY_GLOW: Record<'Uncommon' | 'Rare' | 'Epic', string> = {
  Uncommon: '0 0 10px rgba(76,175,80,0.5)',
  Rare:     '0 0 14px rgba(33,150,243,0.6)',
  Epic:     '0 0 18px rgba(156,39,176,0.7)',
};

export const UPGRADE_CREDITS: Record<UpgradeLevel, number> = {
  1: 2.5,
  2: 5.0,
  3: 10.0,
};

export const MAX_UPGRADE_CREDITS = 10;

// Returns the effective multiplier for a given credit amount (0–0.3)
export function getUpgradeMultiplier(credits: number): number {
  const clamped = Math.min(credits, MAX_UPGRADE_CREDITS);
  return Math.round((clamped / MAX_UPGRADE_CREDITS) * 0.3 * 1000) / 1000;
}

// ── 15 Upgrade Card Definitions ────────────────────────────────────────────
export const UPGRADE_CARDS: UpgradeCard[] = [

  // ─── GOALKEEPER ───────────────────────────────────────────────────────────
  {
    id: 'upg-gk-1',
    name: 'Guardian',
    position: 'Goalkeeper',
    level: 1,
    rarity: 'Uncommon',
    upgradeCredits: 2.5,
    maxMultiplier: 0.3,
    description: 'Position upgrade for GK. Slightly increases saving instincts — each save grants slightly higher points than before.',
    flavorText: 'Instinct cannot be taught — only sharpened.',
    imageUrl: '/Upgrade Pack/Goal Keeper Upgrade  1.jpg',
  },
  {
    id: 'upg-gk-2',
    name: 'Iron Grip',
    position: 'Goalkeeper',
    level: 2,
    rarity: 'Rare',
    upgradeCredits: 5.0,
    maxMultiplier: 0.3,
    description: 'Position upgrade for GK. Goalkeeper\'s grip becomes stronger — bonuses from every save and clean sheet increase significantly.',
    flavorText: 'A ball in his hands never goes anywhere else.',
    imageUrl: '/Upgrade Pack/Goal Keeper Upgrade  2.jpg',
  },
  {
    id: 'upg-gk-3',
    name: 'Bastion',
    position: 'Goalkeeper',
    level: 3,
    rarity: 'Epic',
    upgradeCredits: 10.0,
    maxMultiplier: 0.3,
    description: 'Ultimate position upgrade for GK. This goalkeeper has reached absolute potential — GK skill card stats increase to maximum level.',
    flavorText: 'This goal is not just a box — it\'s a fortress that never falls.',
    imageUrl: '/Upgrade Pack/Goal Keeper Upgrade 3.jpg',
  },

  // ─── DEFENDER ─────────────────────────────────────────────────────────────
  {
    id: 'upg-def-1',
    name: 'Tactical',
    position: 'Defender',
    level: 1,
    rarity: 'Uncommon',
    upgradeCredits: 2.5,
    maxMultiplier: 0.3,
    description: 'Position upgrade for DEF. Defender\'s positioning is slightly improved — every defensive contribution provides a more noticeable point impact.',
    flavorText: 'A defensive wall begins with a single solid stone.',
    imageUrl: '/Upgrade Pack/Defender Upgrade 1.jpg',
  },
  {
    id: 'upg-def-2',
    name: 'Stone Wall',
    position: 'Defender',
    level: 2,
    rarity: 'Rare',
    upgradeCredits: 5.0,
    maxMultiplier: 0.3,
    description: 'Position upgrade for DEF. Defense becomes much harder to penetrate — bonuses from clean sheets, tackles, and defender contributions increase drastically.',
    flavorText: 'Every failed attack is a victory in itself.',
    imageUrl: '/Upgrade Pack/Defender Upgrade 2.jpg',
  },
  {
    id: 'upg-def-3',
    name: 'Colossus',
    position: 'Defender',
    level: 3,
    rarity: 'Epic',
    upgradeCredits: 10.0,
    maxMultiplier: 0.3,
    description: 'Ultimate position upgrade for DEF. The defender has transformed into a colossus — DEF skill card stats rise to maximum level.',
    flavorText: 'He is not an ordinary defender. He is the reason the defense exists.',
    imageUrl: '/Upgrade Pack/Defender Upgrade 3.jpg',
  },

  // ─── MIDFIELDER ───────────────────────────────────────────────────────────
  {
    id: 'upg-mid-1',
    name: 'Field Pulse',
    position: 'Midfielder',
    level: 1,
    rarity: 'Uncommon',
    upgradeCredits: 2.5,
    maxMultiplier: 0.3,
    description: 'Position upgrade for MID. Midfielder\'s rhythm slightly increases — every key pass and MID contribution becomes more valuable.',
    flavorText: 'The midfield beats faster when he plays.',
    imageUrl: '/Upgrade Pack/Midfield Upgrade 1.jpg',
  },
  {
    id: 'upg-mid-2',
    name: 'Overdrive',
    position: 'Midfielder',
    level: 2,
    rarity: 'Rare',
    upgradeCredits: 5.0,
    maxMultiplier: 0.3,
    description: 'Position upgrade for MID. The midfielder\'s engine runs at full capacity — bonuses for assists, possession, and goals from the MID position surge significantly.',
    flavorText: 'A good engine never stops — it only gets faster.',
    imageUrl: '/Upgrade Pack/Midfield Upgrade 2.jpg',
  },
  {
    id: 'upg-mid-3',
    name: 'Conductor',
    position: 'Midfielder',
    level: 3,
    rarity: 'Epic',
    upgradeCredits: 10.0,
    maxMultiplier: 0.3,
    description: 'Ultimate position upgrade for MID. This midfielder controls the entire pitch — MID skill card stats reach absolute potential.',
    flavorText: 'He doesn\'t just play on the pitch — he conducts it.',
    imageUrl: '/Upgrade Pack/Midfield Upgrade 3.jpg',
  },

  // ─── WINGER ───────────────────────────────────────────────────────────────
  {
    id: 'upg-win-1',
    name: 'Flank Spark',
    position: 'Winger',
    level: 1,
    rarity: 'Uncommon',
    upgradeCredits: 2.5,
    maxMultiplier: 0.3,
    description: 'Position upgrade for WIN. Winger\'s speed is slightly sharpened — every sprint, cross, and goal from the winger position is more rewarding.',
    flavorText: 'The spark on the flank that ignites the fire of victory.',
    imageUrl: '/Upgrade Pack/Winger Upgrade 1.jpg',
  },
  {
    id: 'upg-win-2',
    name: 'Turbo Wing',
    position: 'Winger',
    level: 2,
    rarity: 'Rare',
    upgradeCredits: 5.0,
    maxMultiplier: 0.3,
    description: 'Position upgrade for WIN. The winger accelerates to the max — assist and goal contributions from the flanks increase drastically.',
    flavorText: 'When the turbo ignites, no defender can keep up.',
    imageUrl: '/Upgrade Pack/Winger Upgrade 2.jpg',
  },
  {
    id: 'upg-win-3',
    name: 'Lightning',
    position: 'Winger',
    level: 3,
    rarity: 'Epic',
    upgradeCredits: 10.0,
    maxMultiplier: 0.3,
    description: 'Ultimate position upgrade for WIN. This winger moves as fast as lightning — WIN skill card stats increase to the most extreme level.',
    flavorText: 'No longer just a winger — he is a phenomenon.',
    imageUrl: '/Upgrade Pack/winger upgrade 3.jpg',
  },

  // ─── STRIKER ──────────────────────────────────────────────────────────────
  {
    id: 'upg-str-1',
    name: 'Predator',
    position: 'Striker',
    level: 1,
    rarity: 'Uncommon',
    upgradeCredits: 2.5,
    maxMultiplier: 0.3,
    description: 'Position upgrade for STR. Striker\'s instinct is slightly sharpened — every goal opportunity provides greater points than usual.',
    flavorText: 'A true predator is always one step ahead of its prey.',
    imageUrl: '/Upgrade Pack/striker upgrade 1.jpg',
  },
  {
    id: 'upg-str-2',
    name: 'Clinical',
    position: 'Striker',
    level: 2,
    rarity: 'Rare',
    upgradeCredits: 5.0,
    maxMultiplier: 0.3,
    description: 'Position upgrade for STR. Striker\'s efficiency increases rapidly — every goal and penalty provides a much larger point impact.',
    flavorText: 'Clinical is not just about technique — it\'s a mentality.',
    imageUrl: '/Upgrade Pack/striker upgrade 2.jpg',
  },
  {
    id: 'upg-str-3',
    name: 'Awakening',
    position: 'Striker',
    level: 3,
    rarity: 'Epic',
    upgradeCredits: 10.0,
    maxMultiplier: 0.3,
    description: 'Ultimate position upgrade for STR. This striker can no longer be stopped — STR skill card stats increase to the absolute highest level.',
    flavorText: 'At this level, scoring goals is not a goal — it has become destiny.',
    imageUrl: '/Upgrade Pack/striker upgrade 3.jpg',
  },
];

// Helper: get all upgrade cards for a specific position
export function getUpgradeCardsForPosition(position: UpgradePosition): UpgradeCard[] {
  return UPGRADE_CARDS.filter(c => c.position === position);
}

// Helper: get upgrade card by id
export function getUpgradeCardById(id: string): UpgradeCard | undefined {
  return UPGRADE_CARDS.find(c => c.id === id);
}

// Roll a random upgrade card (used during pack opening)
export function rollUpgradeCard(): UpgradeCard {
  const rand = Math.random();
  let level: UpgradeLevel = 1;
  if (rand < UPGRADE_LEVEL_DIST[3]) {
    level = 3;
  } else if (rand < UPGRADE_LEVEL_DIST[3] + UPGRADE_LEVEL_DIST[2]) {
    level = 2;
  } else {
    level = 1;
  }

  // Pick random position
  const positions: UpgradePosition[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Winger', 'Striker'];
  const position = positions[Math.floor(Math.random() * positions.length)];

  const card = UPGRADE_CARDS.find(c => c.position === position && c.level === level);
  return card ?? UPGRADE_CARDS[0]; // fallback
}
