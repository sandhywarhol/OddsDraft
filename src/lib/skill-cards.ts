// Skill Card System — OddsDraft
// A modifier layer on top of the Fantasy Engine. Does NOT modify fantasy-engine.ts.

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'SSR' | 'SSSR';
export type CardPosition = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Winger' | 'Striker';
export type ModifierType =
  | 'goal_bonus'
  | 'assist_bonus'
  | 'goalkeeper_save_bonus'
  | 'goal_conceded_reduction'
  | 'clean_sheet_bonus'
  | 'possession_bonus_extra'
  | 'penalty_save_bonus'
  | 'penalty_scored_bonus'
  | 'yellow_card_reduction'
  | 'appearance_bonus';

export interface SkillCard {
  id: string;
  name: string;
  position: CardPosition;
  rarity: Rarity;
  modifierType: ModifierType;
  modifierValue: number;
  // Short effect line shown on card (explains the mechanical bonus clearly)
  effectText: string;
  // Flavor / lore text shown on card (narrative, position-themed)
  flavorText: string;
}

export const RARITY_ORDER: Rarity[] = [
  'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'SSR', 'SSSR',
];

export const RARITY_STARS: Record<Rarity, string> = {
  Common:    'COMMON',
  Uncommon:  'UNCOMMON',
  Rare:      'RARE',
  Epic:      'EPIC',
  Legendary: 'LEGENDARY',
  Mythic:    'MYTHIC',
  SSR:       'SSR',
  SSSR:      'SSSR',
};

export const RARITY_COLOR: Record<Rarity, string> = {
  Common:    '#9e9e9e',
  Uncommon:  '#4caf50',
  Rare:      '#2196f3',
  Epic:      '#9c27b0',
  Legendary: '#ff9800',
  Mythic:    '#f44336',
  SSR:       '#ff0080',
  SSSR:      '#ffd700',
};

export const RARITY_BG: Record<Rarity, string> = {
  Common:    'linear-gradient(135deg, #424242 0%, #212121 100%)',
  Uncommon:  'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
  Rare:      'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)',
  Epic:      'linear-gradient(135deg, #4a148c 0%, #6a1b9a 100%)',
  Legendary: 'linear-gradient(135deg, #e65100 0%, #ff6f00 100%)',
  Mythic:    'linear-gradient(135deg, #b71c1c 0%, #880e4f 100%)',
  SSR:       'linear-gradient(135deg, #880e4f 0%, #1565c0 50%, #880e4f 100%)',
  SSSR:      'linear-gradient(135deg, #f57f17 0%, #b71c1c 33%, #4a148c 66%, #f57f17 100%)',
};

export const RARITY_GLOW: Record<Rarity, string> = {
  Common:    '0 0 6px rgba(158,158,158,0.3)',
  Uncommon:  '0 0 10px rgba(76,175,80,0.5)',
  Rare:      '0 0 14px rgba(33,150,243,0.6)',
  Epic:      '0 0 18px rgba(156,39,176,0.7)',
  Legendary: '0 0 22px rgba(255,152,0,0.8)',
  Mythic:    '0 0 28px rgba(244,67,54,0.9)',
  SSR:       '0 0 34px rgba(255,0,128,1.0)',
  SSSR:      '0 0 44px rgba(255,215,0,1.0)',
};

export const RARITY_CHANCE: Record<Rarity, number> = {
  Common:    0.500,
  Uncommon:  0.250,
  Rare:      0.120,
  Epic:      0.070,
  Legendary: 0.040,
  Mythic:    0.015,
  SSR:       0.004,
  SSSR:      0.001,
};

export const LINEUP_POS_TO_CARD_POS: Record<string, CardPosition[]> = {
  GK:  ['Goalkeeper'],
  DEF: ['Defender'],
  MID: ['Midfielder'],
  ATT: ['Winger', 'Striker'],
};

// 8 cards × 5 positions = 40 cards
// effectText: clear mechanical description of what changes
// flavorText: thematic lore narrative
export const SKILL_CARDS: SkillCard[] = [

  // ─── GOALKEEPER (8 cards) ──────────────────────────────────────────────────
  {
    id: 'gk-common',
    name: 'Cat Reflex',
    position: 'Goalkeeper',
    rarity: 'Common',
    modifierType: 'goalkeeper_save_bonus',
    modifierValue: 0.25,
    effectText: 'Save: +1.00 → +1.25 pts per save',
    flavorText: 'Your reflexes and focus, just like a cat. No matter how fast the shot, you always land on your feet.',
  },
  {
    id: 'gk-uncommon',
    name: 'Iron Gate',
    position: 'Goalkeeper',
    rarity: 'Uncommon',
    modifierType: 'goal_conceded_reduction',
    modifierValue: 0.25,
    effectText: 'Goal Conceded: -1.00 → -0.75 pts per goal',
    flavorText: 'The gate swings shut before the ball even leaves the striker\'s boot. Some doors simply cannot be broken.',
  },
  {
    id: 'gk-rare',
    name: 'Zero Hour',
    position: 'Goalkeeper',
    rarity: 'Rare',
    modifierType: 'clean_sheet_bonus',
    modifierValue: 0.75,
    effectText: 'Clean Sheet: +5.00 → +5.75 pts',
    flavorText: 'The scoreboard stays blank. When zero has never looked this beautiful, the crowd stands in silence — then erupts.',
  },
  {
    id: 'gk-epic',
    name: 'Hexagon Lock',
    position: 'Goalkeeper',
    rarity: 'Epic',
    modifierType: 'goal_conceded_reduction',
    modifierValue: 0.50,
    effectText: 'Goal Conceded: -1.00 → -0.50 pts per goal',
    flavorText: 'Six angles of pure defensive geometry. Every shot path is calculated, every gap is sealed. The net is untouchable.',
  },
  {
    id: 'gk-legendary',
    name: 'Penalty Oracle',
    position: 'Goalkeeper',
    rarity: 'Legendary',
    modifierType: 'penalty_save_bonus',
    modifierValue: 1.50,
    effectText: 'Penalty Save: +5.00 → +6.50 pts',
    flavorText: 'He reads the run-up, the eyes, the breath of the taker. The direction was never a question — only a matter of timing.',
  },
  {
    id: 'gk-mythic',
    name: 'Divine Net',
    position: 'Goalkeeper',
    rarity: 'Mythic',
    modifierType: 'goalkeeper_save_bonus',
    modifierValue: 1.00,
    effectText: 'Save: +1.00 → +2.00 pts per save',
    flavorText: 'The net itself becomes a living shield. Balls curve back, shots deflect upward — as if the goal simply refuses to be scored.',
  },
  {
    id: 'gk-ssr',
    name: 'Eternal Fortress',
    position: 'Goalkeeper',
    rarity: 'SSR',
    modifierType: 'clean_sheet_bonus',
    modifierValue: 2.50,
    effectText: 'Clean Sheet: +5.00 → +7.50 pts',
    flavorText: 'Fortresses are built over centuries. This one was built in a single lifetime — and no army has breached it since.',
  },
  {
    id: 'gk-sssr',
    name: 'Absolute Zero',
    position: 'Goalkeeper',
    rarity: 'SSSR',
    modifierType: 'goal_conceded_reduction',
    modifierValue: 1.00,
    effectText: 'Goal Conceded: -1.00 → 0.00 pts (fully negated)',
    flavorText: 'In this dimension, the concept of conceding a goal does not exist. The universe itself refuses to allow it.',
  },

  // ─── DEFENDER (8 cards) ────────────────────────────────────────────────────
  {
    id: 'def-common',
    name: 'Steel Tackle',
    position: 'Defender',
    rarity: 'Common',
    modifierType: 'goal_conceded_reduction',
    modifierValue: 0.25,
    effectText: 'Goal Conceded: -1.00 → -0.75 pts per goal',
    flavorText: 'The sound of steel on leather echoes across the stadium. Every tackle lands with the weight of certainty.',
  },
  {
    id: 'def-uncommon',
    name: 'Overlap King',
    position: 'Defender',
    rarity: 'Uncommon',
    modifierType: 'assist_bonus',
    modifierValue: 0.50,
    effectText: 'Assist: +6.00 → +6.50 pts per assist',
    flavorText: 'He sprints the full length of the flank before the midfielder even notices. The assist came from the last man back.',
  },
  {
    id: 'def-rare',
    name: 'Fort Knox',
    position: 'Defender',
    rarity: 'Rare',
    modifierType: 'clean_sheet_bonus',
    modifierValue: 0.75,
    effectText: 'Clean Sheet: +5.00 → +5.75 pts',
    flavorText: 'Nothing goes in. Nothing comes out. The defense is not a line — it is a vault.',
  },
  {
    id: 'def-epic',
    name: 'Aerial Titan',
    position: 'Defender',
    rarity: 'Epic',
    modifierType: 'goal_bonus',
    modifierValue: 1.00,
    effectText: 'Goal (DEF): +15.00 → +16.00 pts per goal',
    flavorText: 'He rises above every striker, every cross, every corner. When he heads the ball, it was never going anywhere else.',
  },
  {
    id: 'def-legendary',
    name: 'Last Bastion',
    position: 'Defender',
    rarity: 'Legendary',
    modifierType: 'clean_sheet_bonus',
    modifierValue: 1.50,
    effectText: 'Clean Sheet: +5.00 → +6.50 pts',
    flavorText: 'When all other defenders have fallen, he still stands. The last wall between victory and collapse — it never falls.',
  },
  {
    id: 'def-mythic',
    name: 'Shadow Sweeper',
    position: 'Defender',
    rarity: 'Mythic',
    modifierType: 'goal_conceded_reduction',
    modifierValue: 0.75,
    effectText: 'Goal Conceded: -1.00 → -0.25 pts per goal',
    flavorText: 'He clears balls that no one else can see coming. Operating in shadows, he sweeps away danger before danger knows he exists.',
  },
  {
    id: 'def-ssr',
    name: 'Imperial Shield',
    position: 'Defender',
    rarity: 'SSR',
    modifierType: 'assist_bonus',
    modifierValue: 2.50,
    effectText: 'Assist: +6.00 → +8.50 pts per assist',
    flavorText: 'The empire\'s greatest general commanded from behind the front lines. His shield protected the kingdom and launched the attack.',
  },
  {
    id: 'def-sssr',
    name: 'God of Defense',
    position: 'Defender',
    rarity: 'SSSR',
    modifierType: 'goal_bonus',
    modifierValue: 3.00,
    effectText: 'Goal (DEF): +15.00 → +18.00 pts per goal',
    flavorText: 'He was not born to defend — he was born to make defending an art form. Goals scored by him are miracles. Goals stopped by him are religion.',
  },

  // ─── MIDFIELDER (8 cards) ──────────────────────────────────────────────────
  {
    id: 'mid-common',
    name: 'Pulse Keeper',
    position: 'Midfielder',
    rarity: 'Common',
    modifierType: 'possession_bonus_extra',
    modifierValue: 0.25,
    effectText: 'Possession Bonus: +1.00 → +1.25 pts',
    flavorText: 'He is the heartbeat of the team — steady, relentless, essential. Remove him and the rhythm collapses entirely.',
  },
  {
    id: 'mid-uncommon',
    name: 'Vision Thread',
    position: 'Midfielder',
    rarity: 'Uncommon',
    modifierType: 'assist_bonus',
    modifierValue: 0.50,
    effectText: 'Assist: +6.00 → +6.50 pts per assist',
    flavorText: 'A pass that threads through five defenders like a needle through silk. He sees angles that exist only in his mind — until the ball proves otherwise.',
  },
  {
    id: 'mid-rare',
    name: 'Dynamo Core',
    position: 'Midfielder',
    rarity: 'Rare',
    modifierType: 'goal_bonus',
    modifierValue: 0.75,
    effectText: 'Goal (MID): +12.00 → +12.75 pts per goal',
    flavorText: 'Energy that never diminishes, even in the 90th minute. His engine runs hotter than anyone else on the pitch.',
  },
  {
    id: 'mid-epic',
    name: 'Two-Way General',
    position: 'Midfielder',
    rarity: 'Epic',
    modifierType: 'assist_bonus',
    modifierValue: 1.00,
    effectText: 'Assist: +6.00 → +7.00 pts per assist',
    flavorText: 'He defends and attacks with equal mastery. The pitch is his battlefield and every position on it belongs to him.',
  },
  {
    id: 'mid-legendary',
    name: 'The Maestro',
    position: 'Midfielder',
    rarity: 'Legendary',
    modifierType: 'possession_bonus_extra',
    modifierValue: 1.50,
    effectText: 'Possession Bonus: +1.00 → +2.50 pts',
    flavorText: 'He doesn\'t play football — he conducts it. The ball moves to his tempo, the players respond to his baton. Football becomes music.',
  },
  {
    id: 'mid-mythic',
    name: 'Shadow Creator',
    position: 'Midfielder',
    rarity: 'Mythic',
    modifierType: 'goal_bonus',
    modifierValue: 2.00,
    effectText: 'Goal (MID): +12.00 → +14.00 pts per goal',
    flavorText: 'Creating danger from places danger has no right to exist. His shadow moves through the midfield leaving chaos in its wake.',
  },
  {
    id: 'mid-ssr',
    name: 'Golden Thread',
    position: 'Midfielder',
    rarity: 'SSR',
    modifierType: 'assist_bonus',
    modifierValue: 2.50,
    effectText: 'Assist: +6.00 → +8.50 pts per assist',
    flavorText: 'A single golden thread connects every great move in football. He holds that thread — and when he pulls it, history is made.',
  },
  {
    id: 'mid-sssr',
    name: 'Field Conductor',
    position: 'Midfielder',
    rarity: 'SSSR',
    modifierType: 'possession_bonus_extra',
    modifierValue: 3.00,
    effectText: 'Possession Bonus: +1.00 → +4.00 pts',
    flavorText: 'The entire pitch bends to his will. He does not follow the game — the game follows him. Possession is not luck; it is inevitability.',
  },

  // ─── WINGER (8 cards) ──────────────────────────────────────────────────────
  {
    id: 'win-common',
    name: 'Turbo Sprint',
    position: 'Winger',
    rarity: 'Common',
    modifierType: 'assist_bonus',
    modifierValue: 0.25,
    effectText: 'Assist: +6.00 → +6.25 pts per assist',
    flavorText: 'Activated before the defender even processes the signal. By the time they react, the cross is already flying into the box.',
  },
  {
    id: 'win-uncommon',
    name: 'Inside Cut',
    position: 'Winger',
    rarity: 'Uncommon',
    modifierType: 'goal_bonus',
    modifierValue: 0.50,
    effectText: 'Goal: +10.00 → +10.50 pts per goal',
    flavorText: 'He cuts inside on his stronger foot while the fullback scrambles. The shot curls into the far corner — as if it was always going there.',
  },
  {
    id: 'win-rare',
    name: 'Cross King',
    position: 'Winger',
    rarity: 'Rare',
    modifierType: 'assist_bonus',
    modifierValue: 0.75,
    effectText: 'Assist: +6.00 → +6.75 pts per assist',
    flavorText: 'Every delivery from his boot is a weapon. Corners, free kicks, open play — the ball bends to his will and arrives perfectly.',
  },
  {
    id: 'win-epic',
    name: 'Flank Breaker',
    position: 'Winger',
    rarity: 'Epic',
    modifierType: 'goal_bonus',
    modifierValue: 1.00,
    effectText: 'Goal: +10.00 → +11.00 pts per goal',
    flavorText: 'He doesn\'t go around defenders — he runs straight through their confidence. The flank is his property and no one disputes ownership.',
  },
  {
    id: 'win-legendary',
    name: 'Infinite Dribble',
    position: 'Winger',
    rarity: 'Legendary',
    modifierType: 'assist_bonus',
    modifierValue: 1.50,
    effectText: 'Assist: +6.00 → +7.50 pts per assist',
    flavorText: 'He has never stopped dribbling. The opponents who tried to tackle him are still spinning. The ball never left his feet.',
  },
  {
    id: 'win-mythic',
    name: 'Ghost Wing',
    position: 'Winger',
    rarity: 'Mythic',
    modifierType: 'goal_bonus',
    modifierValue: 2.00,
    effectText: 'Goal: +10.00 → +12.00 pts per goal',
    flavorText: 'Visible everywhere on the flank, invisible in the box. He disappears from the defender\'s vision and reappears exactly where the ball arrives.',
  },
  {
    id: 'win-ssr',
    name: 'Electric Arc',
    position: 'Winger',
    rarity: 'SSR',
    modifierType: 'assist_bonus',
    modifierValue: 2.50,
    effectText: 'Assist: +6.00 → +8.50 pts per assist',
    flavorText: 'The touchline crackles with electricity when he sprints. Defenders get shocked just by attempting to close him down. Resistance is futile.',
  },
  {
    id: 'win-sssr',
    name: 'Wing Transcendence',
    position: 'Winger',
    rarity: 'SSSR',
    modifierType: 'goal_bonus',
    modifierValue: 3.00,
    effectText: 'Goal: +10.00 → +13.00 pts per goal',
    flavorText: 'His presence alone warps the opposing defense\'s entire shape. He has moved beyond the concept of a winger into something the game has no words for.',
  },

  // ─── STRIKER (8 cards) ─────────────────────────────────────────────────────
  {
    id: 'str-common',
    name: 'First Touch',
    position: 'Striker',
    rarity: 'Common',
    modifierType: 'goal_bonus',
    modifierValue: 0.25,
    effectText: 'Goal: +10.00 → +10.25 pts per goal',
    flavorText: 'One touch. One control. One goal. Clinical precision that turns a half-chance into a guaranteed net ripple.',
  },
  {
    id: 'str-uncommon',
    name: 'Spot Kick Ace',
    position: 'Striker',
    rarity: 'Uncommon',
    modifierType: 'penalty_scored_bonus',
    modifierValue: 0.50,
    effectText: 'Penalty Scored: +5.00 → +5.50 pts',
    flavorText: 'He stands on the spot as if the goalkeeper simply does not exist. Eyes down, run-up smooth — the outcome was decided before he stepped up.',
  },
  {
    id: 'str-rare',
    name: 'Triple Crown',
    position: 'Striker',
    rarity: 'Rare',
    modifierType: 'goal_bonus',
    modifierValue: 0.75,
    effectText: 'Goal: +10.00 → +10.75 pts per goal',
    flavorText: 'Three goals. The crowd doesn\'t celebrate individually anymore — they count. One... Two... and the stadium holds its breath for the third.',
  },
  {
    id: 'str-epic',
    name: 'Target Man',
    position: 'Striker',
    rarity: 'Epic',
    modifierType: 'assist_bonus',
    modifierValue: 1.00,
    effectText: 'Assist: +6.00 → +7.00 pts per assist',
    flavorText: 'He holds the ball, shields it, turns, finds the runner. Not every striker scores — the great ones make everyone around them better.',
  },
  {
    id: 'str-legendary',
    name: 'Boot of Legend',
    position: 'Striker',
    rarity: 'Legendary',
    modifierType: 'goal_bonus',
    modifierValue: 1.50,
    effectText: 'Goal: +10.00 → +11.50 pts per goal',
    flavorText: 'This boot was forged in the fires of a hundred final whistles. Every goal scored with it is written directly into football history.',
  },
  {
    id: 'str-mythic',
    name: 'Predator Mind',
    position: 'Striker',
    rarity: 'Mythic',
    modifierType: 'goal_bonus',
    modifierValue: 2.00,
    effectText: 'Goal: +10.00 → +12.00 pts per goal',
    flavorText: 'In the penalty box, he does not think — he hunts. The striker\'s mind becomes pure instinct: ball, space, net. Goal.',
  },
  {
    id: 'str-ssr',
    name: 'Century Club',
    position: 'Striker',
    rarity: 'SSR',
    modifierType: 'penalty_scored_bonus',
    modifierValue: 2.50,
    effectText: 'Penalty Scored: +5.00 → +7.50 pts',
    flavorText: '100 goals for club. 100 goals for country. The century was not celebrated — it was simply the beginning of the next hundred.',
  },
  {
    id: 'str-sssr',
    name: 'God of Goals',
    position: 'Striker',
    rarity: 'SSSR',
    modifierType: 'goal_bonus',
    modifierValue: 3.00,
    effectText: 'Goal: +10.00 → +13.00 pts per goal',
    flavorText: 'He was not born — he was placed on Earth for a single purpose. Every goal scored by him is not an event; it is a scripture. It is proof.',
  },
];
