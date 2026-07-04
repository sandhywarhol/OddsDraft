'use client';

import { useState, useEffect, useRef, use } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { DEMO_FIXTURES, getDynamicEvents } from '@/lib/players';
import { WC2026_FIXTURES, getFixtureStatus } from '@/lib/wc2026-fixtures';
import { calculateEventPoints, POINT_MAP } from '@/lib/fantasy-engine';
import { getRandomTeamFact } from '@/lib/commentaryKnowledge';
import { useAudio } from '@/context/AudioContext';
import { useWallet } from '@solana/wallet-adapter-react';
import FantasyToast, { type FantasyNotificationItem } from '@/components/FantasyToast';
import CardPackOpener from '@/components/CardPackOpener';
import SkillCardDisplay from '@/components/SkillCardDisplay';
import { openCardPack, hasOpenedPack, getCardDefByInstanceId, getCardBonusForEvent } from '@/lib/card-collection';
import { type SkillCard, RARITY_COLOR, RARITY_STARS } from '@/lib/skill-cards';
import { useTxLine } from '@/context/TxLineContext';
import { buildPlayerIdMap, convertTxLineUpdates, matchPlayerName } from '@/lib/txline-bridge';
import { fetchLiveScoreUpdates, fetchScoreSnapshot } from '@/lib/txline';

// Demo live events that replay at interval to simulate a live match
const LIVE_EVENTS = [
  // === KICK OFF ===
  { id: 'e0', minute: 0, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Kick Off! The match begins!' },
  // Starting XI
  { id: 'xi_arg_mart',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez',  playerId: 'arg-martinez',  type: 'starting_xi', points: 2, description: 'E. Martínez starts in goal for Argentina.' },
  { id: 'xi_arg_rome',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero',       playerId: 'arg-romero',   type: 'starting_xi', points: 2, description: 'Romero starts at centre-back for Argentina.' },
  { id: 'xi_arg_mess',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi',        playerId: 'arg-messi',    type: 'starting_xi', points: 2, description: 'MESSI starts for Argentina!' },
  { id: 'xi_arg_laut',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'L. Martínez',  playerId: 'arg-lautaro',  type: 'starting_xi', points: 2, description: 'Lautaro Martínez leads the attack for Argentina.' },
  { id: 'xi_arg_alva',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez',      playerId: 'arg-alvarez',  type: 'starting_xi', points: 2, description: 'Julián Álvarez starts up front alongside Lautaro.' },
  { id: 'xi_fra_maig',  minute: 0, team: 'France',    teamFlag: '🇫🇷', player: 'Maignan',      playerId: 'fra-maignan',  type: 'starting_xi', points: 2, description: 'Maignan starts in goal for France.' },
  { id: 'xi_fra_mbap',  minute: 0, team: 'France',    teamFlag: '🇫🇷', player: 'Mbappé',       playerId: 'fra-mbappe',   type: 'starting_xi', points: 2, description: 'Mbappé captains France tonight — dangerous from the first whistle.' },
  { id: 'xi_fra_grie',  minute: 0, team: 'France',    teamFlag: '🇫🇷', player: 'Griezmann',    playerId: 'fra-griezmann',type: 'starting_xi', points: 2, description: 'Griezmann lines up in central midfield for France.' },
  { id: 'xi_fra_demb',  minute: 0, team: 'France',    teamFlag: '🇫🇷', player: 'Dembélé',      playerId: 'fra-dembele',  type: 'starting_xi', points: 2, description: 'Dembélé starts on the right wing, ready to trouble the defence.' },
  { id: 'xi_fra_giro',  minute: 0, team: 'France',    teamFlag: '🇫🇷', player: 'Giroud',       playerId: 'fra-giroud',   type: 'starting_xi', points: 2, description: 'Giroud leads the line — aerial strength will be key tonight.' },
  // === FIRST HALF ===
  { id: 'e0_d1', minute: 10, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', playerId: 'fra-mbappe', type: 'danger_attack', points: 0, description: 'France pressing high in the Argentine half! Mbappé is causing chaos.' },
  { id: 'e_asst_mbap', minute: 11, team: 'France', teamFlag: '🇫🇷', player: 'Griezmann', playerId: 'fra-griezmann', type: 'assist', points: 6, description: 'Griezmann threads a perfect through ball into Mbappé\'s path.' },
  { id: 'e1', minute: 12, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', playerId: 'fra-mbappe', type: 'goal', points: 10, goalType: 'Shot', description: 'GOAL! Mbappé fires a powerful shot into the top corner!' },
  { id: 'e1_concede', minute: 12, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goal_conceded', points: -1, description: 'Martínez beaten at his near post — unfortunate position from the keeper.' },
  { id: 'e1_concede_def', minute: 12, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero', playerId: 'arg-romero', type: 'goal_conceded', points: -1, description: 'Romero caught out of position — Mbappé exploits the gap in behind.' },
  { id: 'e_save_maig1', minute: 20, team: 'France', teamFlag: '🇫🇷', player: 'Maignan', playerId: 'fra-maignan', type: 'goalkeeper_save', points: 1, description: 'Maignan dives low to keep out Lautaro\'s fierce shot!' },
  { id: 'e3_1', minute: 24, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', playerId: 'fra-mbappe', type: 'corner_kick', points: 0, description: 'Corner kick awarded to France after a brave block.' },
  { id: 'e4', minute: 31, team: 'France', teamFlag: '🇫🇷', player: 'Dembélé', playerId: 'fra-dembele', type: 'yellow_card', points: -2, description: 'Yellow card for Dembélé after a late, reckless challenge.' },
  { id: 'e4_d1', minute: 36, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'danger_attack', points: 0, description: 'Argentina attacking with purpose now! Messi orchestrating from deep.' },
  { id: 'e_asst_laut', minute: 37, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'assist', points: 6, description: 'Messi delivers a pinpoint cross right onto Lautaro\'s head.' },
  { id: 'e5', minute: 38, team: 'Argentina', teamFlag: '🇦🇷', player: 'L. Martínez', playerId: 'arg-lautaro', type: 'goal', points: 10, goalType: 'Head', description: 'GOAL! Lautaro rises highest to head it home — 1-1!' },
  { id: 'e5_concede', minute: 38, team: 'France', teamFlag: '🇫🇷', player: 'Maignan', playerId: 'fra-maignan', type: 'goal_conceded', points: -1, description: 'Maignan had no chance — Lautaro got ahead of his marker to equalise.' },
  { id: 'e5_concede_def', minute: 38, team: 'France', teamFlag: '🇫🇷', player: 'Varane', playerId: 'fra-varane', type: 'goal_conceded', points: -1, description: 'Varane beaten in the air — Lautaro\'s header leaves him stranded at the back post.' },
  { id: 'e_save_mart1', minute: 42, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goalkeeper_save', points: 1, description: 'E. Martínez spreads his body brilliantly to deny Dembélé!' },
  { id: 'poss_h1_mess', minute: 44, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'possession_bonus', points: 1, description: 'Argentina dominated possession in the first half — Messi controlled the tempo.' },
  { id: 'poss_h1_macall', minute: 44, team: 'Argentina', teamFlag: '🇦🇷', player: 'Mac Allister', playerId: 'arg-macallister', type: 'possession_bonus', points: 1, description: 'Argentina\'s midfield dominated — Mac Allister dictated the rhythm throughout.' },
  { id: 'e4_5', minute: 45, team: '', teamFlag: '', player: '', type: 'half_time', points: 0, description: 'Half Time! Argentina 1–1 France — an even and electric first half.' },
  // === SECOND HALF ===
  { id: 'e4_6', minute: 46, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Second Half Kick Off! France get us underway again.' },
  { id: 'e6_d1', minute: 50, team: 'France', teamFlag: '🇫🇷', player: 'Giroud', playerId: 'fra-giroud', type: 'danger_attack', points: 0, description: 'France immediately on the front foot — Giroud holding up play brilliantly in the area.' },
  { id: 'e_asst_giro', minute: 51, team: 'France', teamFlag: '🇫🇷', player: 'Griezmann', playerId: 'fra-griezmann', type: 'assist', points: 6, description: 'Griezmann whips in a dangerous cross from the right — Giroud is waiting at the far post.' },
  { id: 'e7', minute: 52, team: 'France', teamFlag: '🇫🇷', player: 'Giroud', playerId: 'fra-giroud', type: 'goal', points: 10, goalType: 'Head', description: 'GOAL! Giroud powers a towering header into the net — France lead again!' },
  { id: 'e7_concede', minute: 52, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goal_conceded', points: -1, description: 'Martínez stranded by Griezmann\'s delivery — Giroud gets in front at the near post.' },
  { id: 'e7_concede_def', minute: 52, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero', playerId: 'arg-romero', type: 'goal_conceded', points: -1, description: 'Romero unable to win the aerial duel — Giroud gets the run on him.' },
  { id: 'e7_1', minute: 54, team: '', teamFlag: '', player: '', type: 'var_review', points: 0, description: 'VAR reviewing a potential foul in the build-up to the goal — play stopped.' },
  { id: 'e_save_maig2', minute: 58, team: 'France', teamFlag: '🇫🇷', player: 'Maignan', playerId: 'fra-maignan', type: 'goalkeeper_save', points: 1, description: 'Maignan tips over Álvarez\'s powerful header at full stretch — outstanding!' },
  { id: 'e7_2', minute: 60, team: 'France', teamFlag: '🇫🇷', player: 'Coman', playerId: 'fra-coman', type: 'substitution', points: 0, playerInId: 'fra-coman', playerOutId: 'fra-dembele', description: 'Substitution: Coman replaces Dembélé — Deschamps looking for fresh legs.' },
  { id: 'e7_2_sub', minute: 60, team: 'France', teamFlag: '🇫🇷', player: 'Coman', playerId: 'fra-coman', type: 'sub_appearance', points: 1, description: 'Coman enters the pitch — immediate energy on the left flank.' },
  { id: 'e7_d2', minute: 65, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'danger_attack', points: 0, description: 'Argentina pressing desperately now — Messi driving forward with intent!' },
  { id: 'e_asst_mess', minute: 66, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez', playerId: 'arg-alvarez', type: 'assist', points: 6, description: 'Álvarez lays off a perfectly weighted pass to find Messi in space.' },
  { id: 'e8', minute: 67, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'goal', points: 10, goalType: 'Shot', description: 'GOAL! MESSI! A curling shot into the far corner — pure genius, 2-2!' },
  { id: 'e8_concede', minute: 67, team: 'France', teamFlag: '🇫🇷', player: 'Maignan', playerId: 'fra-maignan', type: 'goal_conceded', points: -1, description: 'Maignan had no answer — Messi\'s curler was simply unstoppable.' },
  { id: 'e8_concede_def', minute: 67, team: 'France', teamFlag: '🇫🇷', player: 'Varane', playerId: 'fra-varane', type: 'goal_conceded', points: -1, description: 'Varane caught ball-watching — Messi ghost past him before firing home.' },
  { id: 'e8_1', minute: 72, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', playerId: 'fra-mbappe', type: 'penalty_won', points: 3, description: 'Mbappé is brought down in the box! The referee points to the spot immediately!' },
  { id: 'e8_2', minute: 72, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero', playerId: 'arg-romero', type: 'penalty_conceded', points: -3, description: 'Romero mistimes his challenge and brings down Mbappé — a costly foul.' },
  { id: 'e8_3', minute: 73, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', playerId: 'fra-mbappe', type: 'penalty_missed', points: -3, description: 'Mbappé steps up... but blazes it over the bar! The pressure got to him.' },
  { id: 'e_save_mart2', minute: 75, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goalkeeper_save', points: 1, description: 'E. Martínez palms away Griezmann\'s curling effort around the post — superb!' },
  { id: 'e8_d1', minute: 77, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', playerId: 'fra-mbappe', type: 'danger_attack', points: 0, description: 'France probing again — Mbappé drifting infield looking for the decisive moment.' },
  { id: 'e_asst_mbap3', minute: 78, team: 'France', teamFlag: '🇫🇷', player: 'Coman', playerId: 'fra-coman', type: 'assist', points: 6, description: 'Coman bursts down the left and cuts the ball back perfectly to Mbappé.' },
  { id: 'e9', minute: 79, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', playerId: 'fra-mbappe', type: 'goal', points: 10, goalType: 'Other', description: 'HAT-TRICK! Mbappé taps in from close range — his third of the game, 3-2!' },
  { id: 'e9_concede', minute: 79, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goal_conceded', points: -1, description: 'Third goal conceded for Martínez — another low cross catches the defence flat.' },
  { id: 'e9_concede_def', minute: 79, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero', playerId: 'arg-romero', type: 'goal_conceded', points: -1, description: 'Romero out of position again — the gap allows Coman\'s cutback to reach Mbappé.' },
  { id: 'e_save_mart3', minute: 85, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goalkeeper_save', points: 1, description: 'E. Martínez pulls off a brilliant low save to deny Coman a second!' },
  { id: 'e9_d1', minute: 88, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez', playerId: 'arg-alvarez', type: 'danger_attack', points: 0, description: 'Argentina throwing everyone forward! Sustained pressure in the final minutes.' },
  { id: 'e_asst_alva', minute: 89, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'assist', points: 6, description: 'Messi picks out Álvarez with a defence-splitting through ball in behind.' },
  { id: 'poss_h2_grie', minute: 89, team: 'France', teamFlag: '🇫🇷', player: 'Griezmann', playerId: 'fra-griezmann', type: 'possession_bonus', points: 1, description: 'France dominated possession in the second half — Griezmann pulled the strings throughout.' },
  { id: 'poss_h2_kante', minute: 89, team: 'France', teamFlag: '🇫🇷', player: 'Kanté', playerId: 'fra-kante', type: 'possession_bonus', points: 1, description: 'Kanté covered every blade of grass — France\'s engine in midfield.' },
  { id: 'e10', minute: 90, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez', playerId: 'arg-alvarez', type: 'goal', points: 10, goalType: 'Shot', description: '90th minute! Álvarez drives a low shot into the bottom corner — 3-3!' },
  { id: 'e10_concede', minute: 90, team: 'France', teamFlag: '🇫🇷', player: 'Maignan', playerId: 'fra-maignan', type: 'goal_conceded', points: -1, description: 'Maignan beaten at his near post — a late equalizer for Argentina.' },
  { id: 'e10_concede_def', minute: 90, team: 'France', teamFlag: '🇫🇷', player: 'Varane', playerId: 'fra-varane', type: 'goal_conceded', points: -1, description: 'Varane caught flat-footed in stoppage time — Álvarez finds the gap.' },
  { id: 'e11', minute: 90, team: '', teamFlag: '', player: '', type: 'full_time', points: 0, description: 'Full Time! Argentina 3–3 France! A breathtaking match with goals at both ends.' },
];

// Demo leaderboard
const DEMO_LEADERBOARD = [
  { rank: 1, username: 'CryptoGoalkeeper', wallet: 'Cx9...4mN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoGoalkeeper', points: 124.5, prize: '5.0 SOL', isUser: false },
  { rank: 2, username: 'You', wallet: 'YOUR WALLET', avatar: '', points: 98.2, prize: '3.0 SOL', isUser: true },
  { rank: 3, username: 'MbappeObsessed', wallet: '7kP...2sQ', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MbappeObsessed', points: 87.0, prize: '2.0 SOL', isUser: false },
  { rank: 4, username: 'TacticalMaster', wallet: 'Rz3...9vT', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TacticalMaster', points: 72.4, prize: '-', isUser: false },
  { rank: 5, username: 'SolanaBaller', wallet: 'Lw8...mX1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SolanaBaller', points: 65.1, prize: '-', isUser: false },
  { rank: 6, username: 'BlockStriker', wallet: 'Bs4...9kP', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BlockStriker', points: 58.6, prize: '-', isUser: false },
  { rank: 7, username: 'DegenDeGea', wallet: 'Dg2...1vL', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DegenDeGea', points: 54.3, prize: '-', isUser: false },
  { rank: 8, username: 'PhantomPlaymaker', wallet: 'Pp5...7wQ', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PhantomPlaymaker', points: 51.0, prize: '-', isUser: false },
  { rank: 9, username: 'GigaChadFC', wallet: 'Gc7...3tN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GigaChadFC', points: 48.5, prize: '-', isUser: false },
  { rank: 10, username: 'SolStriker', wallet: 'Ss8...5kM', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SolStriker', points: 45.2, prize: '-', isUser: false },
  { rank: 11, username: 'NodeNavigator', wallet: 'Nn9...2wP', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NodeNavigator', points: 42.0, prize: '-', isUser: false },
  { rank: 12, username: 'RugPullResist', wallet: 'Rr3...6vL', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RugPullResist', points: 39.8, prize: '-', isUser: false },
  { rank: 13, username: 'LedgerLegend', wallet: 'Ll4...1tK', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LedgerLegend', points: 36.5, prize: '-', isUser: false },
  { rank: 14, username: 'ApeInUnited', wallet: 'Au6...8mN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ApeInUnited', points: 34.2, prize: '-', isUser: false },
  { rank: 15, username: 'CryptoCruiser', wallet: 'Cc2...9sJ', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoCruiser', points: 31.0, prize: '-', isUser: false },
  { rank: 16, username: 'SatoshiSquad', wallet: 'Sq7...4vL', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SatoshiSquad', points: 28.5, prize: '-', isUser: false },
  { rank: 17, username: 'GasLimitFC', wallet: 'Gl5...3kP', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GasLimitFC', points: 25.0, prize: '-', isUser: false },
  { rank: 18, username: 'HODLUnited', wallet: 'Hu9...1wQ', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HODLUnited', points: 22.3, prize: '-', isUser: false },
  { rank: 19, username: 'YieldFarmer', wallet: 'Yf3...7sN', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=YieldFarmer', points: 18.5, prize: '-', isUser: false },
  { rank: 20, username: 'MoonBoyz', wallet: 'Mb4...5vL', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MoonBoyz', points: 12.0, prize: '-', isUser: false },
];

const EVENT_COLORS: Record<string, string> = {
  goal:                    '#2e7d32',
  goal_conceded:           '#c62828',
  own_goal:                '#c62828',
  assist:                  '#1565c0',
  goalkeeper_save:         '#00838f',
  penalty_save:            '#f9a825',
  yellow_card:             '#e65100',
  red_card:                '#c62828',
  kick_off:                '#0288d1',
  half_time:               '#5e35b1',
  full_time:               '#c62828',
  extra_time:              '#5e35b1',
  penalty_won:             '#2e7d32',
  penalty_missed:          '#c62828',
  penalty_conceded:        '#c62828',
  penalty_scored:          '#2e7d32',
  penalty_missed_shootout: '#c62828',
  corner_kick:             '#00838f',
  substitution:            '#fbc02d',
  var_review:              '#424242',
  danger_attack:           '#e65100',
  starting_xi:             '#ffd700',
  sub_appearance:          '#00acc1',
  possession_bonus:        '#00acc1',
  clean_sheet:             '#2e7d32',
};

const EVENT_ICONS: Record<string, string> = {
  goal:                    '⚽',
  goal_conceded:           '😓',
  own_goal:                '😰',
  assist:                  '🎯',
  goalkeeper_save:         '🧤',
  penalty_save:            '🧤',
  yellow_card:             '🟨',
  red_card:                '🟥',
  kick_off:                '📢',
  half_time:               '⏸️',
  full_time:               '🛑',
  extra_time:              '⏱️',
  penalty_won:             '✅',
  penalty_missed:          '❌',
  penalty_conceded:        '⚠️',
  penalty_scored:          '🥅',
  penalty_missed_shootout: '❌',
  corner_kick:             '⛳',
  substitution:            '🔄',
  var_review:              '📺',
  danger_attack:           '⚡',
  starting_xi:             '🌟',
  sub_appearance:          '🔄',
  possession_bonus:        '🎮',
  clean_sheet:             '🛡️',
};

interface DialogData {
  speakerTitle: string;
  text: string;
  commentator1Image?: string; // Always Left
  commentator2Image?: string; // Always Right
  refereeImage?: string;      // Usually Right
  isRefereeStyle?: boolean;
  refereePosition?: 'left' | 'right';
}

function getDialogData(event: any, step: number, fixture: any, score: { home: number, away: number } = { home: 0, away: 0 }): DialogData {
  const player = event.player || 'Player';
  const team = event.team || 'Team';
  const opponent = event.team === fixture.homeTeam ? fixture.awayTeam : fixture.homeTeam;
  const minute = event.minute ?? 0;

  switch (event.type) {
    case 'kick_off':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'KICK OFF',
          refereeImage: '/NPC/Referee Kick OFF.svg',
          isRefereeStyle: true,
          refereePosition: 'left'
        };
      } else if (step === 2) {
        if (minute >= 45) {
          return {
            speakerTitle: 'Alan',
            text: `"The referee blows the whistle for the second half! The score is currently ${fixture.homeTeam} ${score.home} - ${score.away} ${fixture.awayTeam}."`,
            commentator2Image: '/NPC/Comentator 2 Calm.svg',
          };
        } else {
          return {
            speakerTitle: 'Alan',
            text: `"The referee blows the whistle and we are underway! Let's hope for an exciting match today."`,
            commentator2Image: '/NPC/Comentator 2 Calm.svg',
          };
        }
      } else if (step === 3) {
        if (minute >= 45) {
          return {
            speakerTitle: 'Martin',
            text: `"Let's see if the managers' half-time instructions can make a difference in these final 45 minutes!"`,
            commentator1Image: '/NPC/Komentator 1 calm.svg',
          };
        } else {
          return {
            speakerTitle: 'Martin',
            text: `"The atmosphere in the stadium is absolutely electric. I can't wait to see which team takes control of the match early on!"`,
            commentator1Image: '/NPC/Komentator 1 calm.svg',
          };
        }
      } else if (step === 4) {
        if (minute < 45) {
          const homeFact = getRandomTeamFact(fixture.homeTeam);
          if (homeFact) {
            return {
              speakerTitle: 'Alan',
              text: `"Speaking of ${fixture.homeTeam}, did you know? ${homeFact}"`,
              commentator2Image: '/NPC/Comentator 2 Calm.svg',
            };
          }
        }
        return {
          speakerTitle: 'Alan',
          text: `"Both teams look completely focused today. We're in for a treat."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else {
        if (minute < 45) {
          const awayFact = getRandomTeamFact(fixture.awayTeam);
          if (awayFact) {
            return {
              speakerTitle: 'Martin',
              text: `"And don't forget about ${fixture.awayTeam}. ${awayFact}"`,
              commentator1Image: '/NPC/Komentator 1 calm.svg',
            };
          }
        }
        return {
          speakerTitle: 'Martin',
          text: `"Absolutely, every detail will count on the pitch today!"`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'half_time':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'HALF TIME',
          refereeImage: '/NPC/ End of Game.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Alan',
          text: `"And that's the whistle for the break! It's been an intense first 45 minutes. Let's take a quick look at the midway TxODDS statistics."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else if (step === 3) {
        return {
          speakerTitle: 'Martin',
          text: `"The possession is incredibly even so far, but ${fixture.homeTeam} has been much more dangerous in the final third, creating higher quality xG chances."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"Absolutely. The managers will have a lot to talk about in the dressing room. We'll see what tactical adjustments they make for the second half."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      }
    case 'full_time':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'FULL TIME',
          refereeImage: '/NPC/ End of Game.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Martin',
          text: `"What an incredible match! Let's dive into the post-match statistics provided by TxODDS."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      } else if (step === 3) {
        return {
          speakerTitle: 'Alan',
          text: `"Looking at the data, ${fixture.homeTeam} absolutely dominated the possession today, holding onto the ball for a staggering 62% of the game."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else if (step === 4) {
        return {
          speakerTitle: 'Martin',
          text: `"Indeed! And their passing accuracy was exceptional as well. They completed nearly 88% of their passes, constantly putting pressure on the defense."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      } else if (step === 5) {
        return {
          speakerTitle: 'Alan',
          text: `"However, the Expected Goals (xG) tells a different story. Despite the possession, ${fixture.awayTeam} had a much higher xG thanks to their lethal counter-attacks and clinical finishing!"`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else if (step === 6) {
        return {
          speakerTitle: 'Martin',
          text: `"Don't forget the incredible performance between the posts! Both goalkeepers registered crucial saves that kept the fans on the edge of their seats."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"A truly tactical masterclass and a fantastic display of football. Thank you for joining our live coverage, we'll see you at the next fixture!"`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      }
    case 'goal': {
      // TxLINE: dataSoccer.GoalType — 'Head' | 'Shot' | 'OwnGoal' | 'Other'
      const goalType = event.goalType as string | undefined;
      let goalTypeDesc = '';
      if (goalType === 'Head') goalTypeDesc = 'A thunderous header';
      else if (goalType === 'Shot') goalTypeDesc = 'A powerful shot';
      else goalTypeDesc = 'A clinical finish';

      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: event.description
            ? `"${event.description}"`
            : `"GOAL! ${player} finds the back of the net in the ${minute} minute! ${goalTypeDesc} — and ${team} take the lead!"`,
          commentator1Image: '/NPC/Comentator 1.svg',
        };
      } else {
        if (goalType === 'Head') {
          return {
            speakerTitle: 'Alan',
            text: `"What a delivery! ${player} attacked the ball with complete conviction — that's an aerial masterclass!"`,
            commentator2Image: '/NPC/Comentator 2.svg',
          };
        } else if (goalType === 'Shot') {
          return {
            speakerTitle: 'Alan',
            text: `"Pure technique from ${player}! That shot had pace, precision, and the goalkeeper stood absolutely no chance!"`,
            commentator2Image: '/NPC/Comentator 2.svg',
          };
        } else {
          return {
            speakerTitle: 'Alan',
            text: `"A brilliant team move from ${team} finally breaks through the ${opponent} defense and ends with a well-deserved goal!"`,
            commentator2Image: '/NPC/Comentator 2.svg',
          };
        }
      }
    }
    case 'yellow_card':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: event.description ? `"${event.description}"` : `"Oh, that's a reckless challenge by ${player}! The referee steps in and shows a yellow card. He must be careful now!"`,
          commentator1Image: '/NPC/Comentator 1.svg',
          refereeImage: '/NPC/Referee Yellow Card.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"He really needs to watch his step now. One more mistake and ${team} will be down to 10 men!"`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      }
    case 'red_card':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: event.description ? `"${event.description}"` : `"Oh, that's a reckless challenge by ${player}! The referee has no choice but to show a straight red card, and it's a huge blow for ${team}!"`,
          commentator1Image: '/NPC/Comentator 1.svg',
          refereeImage: '/NPC/Referee Red Card.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"That's a game-changing moment! The manager of ${team} will have to completely rethink their strategy now."`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      }
    case 'own_goal':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: `"Disaster! It's an own goal by ${player}! An absolute nightmare moment for ${team}!"`,
          commentator1Image: '/NPC/Comentator 1.svg',
          refereeImage: '/NPC/ End of Game.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"Absolutely gutting for ${team}. These are the moments that can completely change the momentum of a match!"`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      }
    case 'substitution':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'SUBSTITUTION',
          refereeImage: '/NPC/Player subtitution.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Alan',
          text: event.description ? `"${event.description}"` : `"Substitution for ${team}. Let's see if this tactical change can turn the tide of the match."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"Fresh legs on the pitch often provide that extra spark. It will be interesting to see how the opposition responds."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'penalty_won':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'PENALTY',
          refereeImage: '/NPC/Foul.svg',
          isRefereeStyle: true,
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: event.description ? `"${event.description}"` : `"PENALTY! The referee points to the spot! A massive opportunity for ${team} here!"`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      }
    case 'penalty_conceded':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: `"That is a disastrous challenge by ${player} in the box. He leaves the referee with absolutely no choice."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"What was he thinking? You simply cannot make a tackle like that inside the area."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      }
    case 'penalty_missed':
      if (step === 1) {
        return {
          speakerTitle: 'Alan',
          text: `"MISSED! I don't believe it! ${player} has completely fluffed his lines!"`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"He'll be having nightmares about that one. A golden chance wasted."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'corner_kick':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'CORNER',
          refereeImage: '/NPC/Corner Kick.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Alan',
          text: event.description ? `"${event.description}"` : `"It's out for a corner kick. A chance for ${team} to send their tall defenders forward."`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"Set pieces are crucial in tight games like this. Delivery will be everything."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'var_review':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'VAR REVIEW',
          refereeImage: '/NPC/VAR.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Alan',
          text: `"Hold on, the referee is pausing play. We are having a VAR review for a potential incident."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"This is a tense moment for both teams. The technology is checking everything closely."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'danger_attack':
      // TxLINE: possessionType=Danger|HighDanger — predictive signal before a goal
      if (step === 1) {
        return {
          speakerTitle: 'Alan',
          text: `"${team} is in a highly dangerous position! TxLINE data shows they are in the Danger zone right now — a goal could come at any moment!"`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"${opponent} needs to hold their defensive shape carefully. The pressure from ${team} is relentless and any lapse in concentration could be fatal!"`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'starting_xi':
      // TxLINE: lineups[].starter = true
      return {
        speakerTitle: 'Alan',
        text: event.description
          ? `"${event.description}"`
          : `"${player} is confirmed in the starting eleven for ${team} today!"`,
        commentator2Image: '/NPC/Comentator 2 Calm.svg',
      };
    case 'sub_appearance':
      // TxLINE: dataSoccer.PlayerInId matches user's lineup
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'SUBSTITUTION',
          refereeImage: '/NPC/Player subtitution.svg',
          isRefereeStyle: true,
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: event.description
            ? `"${event.description}"`
            : `"${player} is now on the pitch! Fresh legs that could make all the difference for ${team} in the closing stages."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      }
    case 'possession_bonus':
      // TxLINE: inferred from possession stream — team dominant per half
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: event.description
            ? `"${event.description}"`
            : `"${team} has been absolutely dominant in possession this half! ${player} has been the engine in midfield, controlling the tempo beautifully."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"When you control the ball like that, you control the game. ${player} deserves full credit for the work rate shown today."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      }
    case 'clean_sheet':
      // TxLINE: inferred from scoreSoccer.Total.Goals = 0 at full_time
      if (step === 1) {
        return {
          speakerTitle: 'Alan',
          text: `"CLEAN SHEET! ${team} has successfully kept the opposition off the scoreboard — ${player} has been absolutely magnificent today!"`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"A clean sheet is the ultimate reward for a solid defensive performance. The entire backline for ${team} deserves enormous credit today."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'assist':
      // TxLINE: dataSoccer.assistPlayerId embedded in goal events
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: event.description
            ? `"${event.description}"`
            : `"What a pass from ${player}! The vision to pick out that run was exceptional — that assist was every bit as important as the goal itself!"`,
          commentator1Image: '/NPC/Comentator 1.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"Creative genius from ${player}! He saw the run nobody else spotted and delivered the perfect ball. That's the mark of a truly world-class player."`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      }
    case 'goalkeeper_save':
      // TxLINE: dataSoccer.save
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: event.description
            ? `"${event.description}"`
            : `"INCREDIBLE SAVE from ${player}! That looked destined for the net, but he has pulled off an absolutely stunning stop!"`,
          commentator1Image: '/NPC/Comentator 1.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"What a moment from ${player}! That save alone could be worth three points for ${team}. He has single-handedly kept them in this match."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      }
    case 'penalty_save':
      // TxLINE: dataSoccer.penaltysave
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: `"SAVED!! ${player} guesses correctly and palms it away! The penalty taker is absolutely devastated — what a moment for the goalkeeper!"`,
          commentator1Image: '/NPC/Comentator 1.svg',
          refereeImage: '/NPC/ End of Game.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"A defining save that could completely change the course of this match! ${player} is the hero — ${team} are absolutely ecstatic!"`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      }
    case 'extra_time':
      // TxLINE: gameState transitions to ExtraTime
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'EXTRA TIME',
          refereeImage: '/NPC/Referee Kick OFF.svg',
          isRefereeStyle: true,
          refereePosition: 'left',
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Alan',
          text: `"We are going to extra time! Ninety minutes were not enough to separate these two sides — thirty more minutes to decide this contest!"`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"Both squads must dig deep now. Fatigue is a real factor, but so is the prize. One moment of quality could decide everything!"`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'penalty_scored':
      // TxLINE: goal event during gameState=Penalties
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: `"SCORED! ${player} steps up and sends the keeper the wrong way — nerves of steel from the ${team} player!"`,
          commentator1Image: '/NPC/Comentator 1.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"Ice in the veins! That is how you take a penalty under the biggest pressure possible. ${team} are one step closer!"`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      }
    case 'penalty_missed_shootout':
      // TxLINE: miss during gameState=Penalties
      if (step === 1) {
        return {
          speakerTitle: 'Alan',
          text: `"MISSED! ${player} has blazed it wide — that is an absolutely cruel moment in a penalty shootout. ${team} are on the brink!"`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"The pressure of a penalty shootout can break the best players in the world. ${player} will need enormous support from the bench and the fans right now."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    default:
      return {
        speakerTitle: 'Commentator',
        text: `"${event.description}"`,
        commentator1Image: '/NPC/Komentator 1 calm.svg',
      };
  }
}

export default function LivePage({ params, searchParams }: { params: Promise<{ contestId: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { contestId } = use(params);
  const searchParamsObj = use(searchParams);
  const contestType = (searchParamsObj.contestType as string) || 'top3';
  const { publicKey } = useWallet();
  const { playSFX } = useAudio();
  const { appMode, apiToken, guestJwt, liveFixtures, allFixtures } = useTxLine();

  // Read persisted mode directly from localStorage for useState initializers.
  // TxLineContext's useEffect hasn't run yet on the first render, so appMode
  // is still 'demo' even after a page refresh in live mode.
  const persistedIsLive = typeof window !== 'undefined'
    && localStorage.getItem('txline_app_mode') === 'live'
    && !!localStorage.getItem('txline_api_token');

  // Always prefer WC2026 real fixtures (works in both demo and live modes)
  const wcFixture = WC2026_FIXTURES.find(f => f.fixtureId === contestId);
  const fixture = wcFixture
    ? { ...wcFixture, status: getFixtureStatus(wcFixture), homeScore: 0, awayScore: 0 }
    : (DEMO_FIXTURES.find((f) => f.fixtureId === contestId) || DEMO_FIXTURES.find(f => f.status === 'live') || DEMO_FIXTURES[0]);

  const matchEvents = getDynamicEvents(fixture, LIVE_EVENTS);

  const [initialState] = useState(() => {
    // Live mode: always start clean — API provides score/events/minute
    if (persistedIsLive) {
      return {
        initialMin: 0,
        initialIdx: 0,
        initialEvents: [] as typeof matchEvents,
        homeScore: 0,
        awayScore: 0,
        triggered: new Set<string>(),
      };
    }

    // Demo mode: pre-load events up to a random minute if the match is "live"
    const isLive = fixture.status === 'live';
    const initialMin = isLive ? Math.floor(Math.random() * 80) + 1 : 0;

    let initialIdx = matchEvents.findIndex(e => e.minute >= initialMin);
    if (initialIdx === -1) initialIdx = matchEvents.length;

    const initialEvents = matchEvents.slice(0, initialIdx).reverse();

    let homeScore = 0;
    let awayScore = 0;

    initialEvents.forEach(e => {
      if (e.type === 'goal' || e.type === 'own_goal') {
        if (e.team === fixture.homeTeam) homeScore++;
        else if (e.team === fixture.awayTeam) awayScore++;
      }
    });

    const triggered = new Set<string>();
    initialEvents.forEach(e => triggered.add(e.id));

    return { initialMin, initialIdx, initialEvents, homeScore, awayScore, triggered };
  });

  const [events, setEvents] = useState<typeof matchEvents>(initialState.initialEvents);
  const [currentEventIdx, setCurrentEventIdx] = useState(initialState.initialIdx);
  const [score, setScore] = useState({ home: initialState.homeScore, away: initialState.awayScore });
  const [minute, setMinute] = useState(initialState.initialMin);
  const [leaderboard, setLeaderboard] = useState(() => {
    if (persistedIsLive) {
      // Live mode: start with only the current user at 0 pts.
      // Real participants are loaded asynchronously via useEffect below.
      const walletStr = publicKey?.toString() ?? '';
      let username = 'You';
      let avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletStr || 'default'}`;
      try {
        if (typeof window !== 'undefined' && walletStr) {
          const stored = localStorage.getItem(`profile_${walletStr}`);
          if (stored) {
            const p = JSON.parse(stored);
            username = p.username || username;
            avatar = p.avatar || avatar;
          }
        }
      } catch {}
      return [{
        rank: 1,
        username,
        wallet: walletStr ? `${walletStr.substring(0, 4)}...${walletStr.slice(-3)}` : '–',
        avatar,
        points: 0,
        prize: contestType === 'wta' ? '– SOL' : '–',
        isUser: true,
      }];
    }

    // Demo mode: simulated leaderboard with scaled points
    let initialBoard = [...DEMO_LEADERBOARD];
    const scaleFactor = initialState.initialMin > 0 ? initialState.initialMin / 90 : 0;

    initialBoard = initialBoard.map((entry, index) => {
      let prize = '-';
      if (contestType === '5050') {
        prize = index < 10 ? '0.18 SOL' : '-';
      } else if (contestType === 'wta') {
        prize = index === 0 ? '10.0 SOL' : '-';
      } else {
        if (index === 0) prize = '5.0 SOL';
        else if (index === 1) prize = '3.0 SOL';
        else if (index === 2) prize = '2.0 SOL';
      }

      const scaledPoints = parseFloat((entry.points * scaleFactor).toFixed(1));

      if (entry.isUser) {
        let customUser = 'You';
        let customAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=default`;
        if (publicKey) {
          customAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${publicKey.toString()}`;
          const stored = localStorage.getItem(`profile_${publicKey.toString()}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            customUser = parsed.username || customUser;
            customAvatar = parsed.avatar || customAvatar;
          }
        }
        return {
          ...entry,
          username: customUser,
          wallet: publicKey ? `${publicKey.toString().substring(0, 4)}...${publicKey.toString().substring(publicKey.toString().length - 3)}` : entry.wallet,
          avatar: customAvatar,
          points: scaledPoints,
          prize
        };
      }
      return { ...entry, points: scaledPoints, prize };
    });

    return initialBoard.sort((a, b) => b.points - a.points);
  });
  const [latestEvent, setLatestEvent] = useState<(typeof matchEvents)[0] | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFastForward, setIsFastForward] = useState(false);
  const eventRef = useRef<HTMLDivElement>(null);
  const triggeredEventsRef = useRef<Set<string>>(initialState.triggered);
  const [mobileToast, setMobileToast] = useState<{ text: string; type: string } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeToasts, setActiveToasts] = useState<FantasyNotificationItem[]>([]);
  const prevRankRef = useRef<number>(2);
  const notifiedEventsRef = useRef<Set<string>>(new Set());
  const leaderboardRef = useRef(leaderboard);
  const userLineupRef = useRef<any>(null);
  const appearedPlayersRef = useRef<Set<string>>(new Set());
  // Tracks score synchronously so the full_time handler can read the final score
  // without depending on stale React state (score is not in the event-effect dep array)
  const scoreRef = useRef({ home: initialState.homeScore, away: initialState.awayScore });
  // Live mode refs — TxLINE fixture resolution and player mapping
  const txlineFixtureIdRef = useRef<string | null>(null);
  const playerIdMapRef = useRef<Record<string, string>>({});
  const seenSeqsRef = useRef<Set<number>>(new Set());
  const liveInitDoneRef = useRef(false);
  const lastGameStateRef = useRef<string | null>(null);
  const lastClockRunningRef = useRef<boolean | null>(null);
  const lastClockSecondsRef = useRef<number | null>(null);
  const matchResultLoadedRef = useRef(false);
  const showPopupRef = useRef(false);
  const [txlineStatus, setTxlineStatus] = useState<'connecting' | 'live' | 'waiting'>('connecting');
  const [minutesToKickoff, setMinutesToKickoff] = useState<number | null>(null);

  // Pre-loaded equipped card definitions keyed by playerId — avoids per-event localStorage reads
  const equippedCardDefsRef = useRef<Record<string, SkillCard | null>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`txodds_user_lineup_${contestId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        userLineupRef.current = parsed;
        setUserLineup(parsed);
        // Build card-def lookup once so event handlers don't hit localStorage every tick
        const defs: Record<string, SkillCard | null> = {};
        for (const [pid, instId] of Object.entries(parsed.equippedCards ?? {})) {
          defs[pid] = getCardDefByInstanceId(instId as string) ?? null;
        }
        equippedCardDefsRef.current = defs;
      }
    } catch (e) {
      console.error('Failed to parse user lineup:', e);
    }
  }, [contestId]);

  useEffect(() => {
    leaderboardRef.current = leaderboard;
  }, [leaderboard]);

  // Live mode: populate leaderboard with real Supabase participants
  useEffect(() => {
    if (appMode !== 'live') return;
    fetch(`/api/contest/leaderboard?fixture=${contestId}&contestType=${contestType}`)
      .then(r => r.json())
      .then((data: { participants?: Array<{ wallet_address: string; contest_type: string }> }) => {
        const list = data.participants ?? [];
        if (list.length === 0) return;
        const walletStr = publicKey?.toString() ?? '';
        const entries = list.map((p, i) => {
          const w = p.wallet_address;
          const isUser = !!walletStr && w === walletStr;
          let username = isUser ? 'You' : `${w.substring(0, 4)}...${w.slice(-3)}`;
          let avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${w}`;
          if (isUser) {
            try {
              const stored = localStorage.getItem(`profile_${w}`);
              if (stored) {
                const pp = JSON.parse(stored);
                username = pp.username || username;
                avatar = pp.avatar || avatar;
              }
            } catch {}
          }
          return {
            rank: i + 1,
            username,
            wallet: `${w.substring(0, 4)}...${w.slice(-3)}`,
            avatar,
            points: 0,
            prize: '–',
            isUser,
          };
        });
        setLeaderboard(entries);
      })
      .catch(err => console.warn('[Leaderboard] fetch failed:', err));
  }, [appMode, contestId, contestType, publicKey]);

  const [dialogStep, setDialogStep] = useState(1);

  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verifying' | 'success'>('pending');

  const handleVerify = () => {
    setVerificationStatus('verifying');
    setTimeout(() => {
      setVerificationStatus('success');
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Keep showPopupRef in sync so live polling can check it without re-creating the interval
  useEffect(() => {
    showPopupRef.current = showPopup;
  }, [showPopup]);

  // ── Kickoff countdown + live clock fallback ───────────────────────────────
  // minutesToKickoff: positive = pre-match; null = match in progress or finished
  // When in live mode and events haven't arrived yet, we derive the match minute
  // from elapsed time since kickoff so the display doesn't stick at 0'.
  const [liveClockMinute, setLiveClockMinute] = useState<number>(0);
  useEffect(() => {
    if (appMode !== 'live' || !wcFixture) return;
    const update = () => {
      const diff = new Date(wcFixture.kickoffAt).getTime() - Date.now();
      if (diff > 0) {
        setMinutesToKickoff(Math.ceil(diff / 60000));
        setLiveClockMinute(0);
      } else {
        setMinutesToKickoff(null);
        // Approximate match clock accounting for a ~15-min halftime break
        const elapsed = Math.floor(-diff / 60000);
        const approx = elapsed <= 47 ? Math.min(elapsed, 45)
          : elapsed <= 62 ? 45   // halftime window
          : Math.min(elapsed - 17, 90); // second half (subtract break)
        setLiveClockMinute(approx);
      }
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [appMode, wcFixture]);

  // ── LIVE MODE: TxLINE API polling ──────────────────────────────────────────
  useEffect(() => {
    if (appMode !== 'live' || !apiToken) return;

    let isMounted = true;

    // Accepts TxLINE (PascalCase/camelCase) AND TxODDS legacy (Incidents/Status/Team) formats
    const txoddsStatusToGameState = (s: string): string | undefined => {
      const v = s.toLowerCase();
      if (v === 'inprogress' || v === 'in_progress' || v === 'live') return 'FirstHalf';
      if (v === 'halftime' || v === 'half_time') return 'HalfTime';
      if (v === 'finished' || v === 'completed' || v === 'fulltime') return 'FullTime';
      if (v === 'secondhalf' || v === 'second_half') return 'SecondHalf';
      if (v === 'extratime' || v === 'extra_time') return 'ExtraTime';
      if (v === 'penalties') return 'Penalties';
      return undefined;
    };
    const normalizeUpdate = (u: any) => ({
      seq:       u.seq       ?? u.Seq,
      ts:        u.ts        ?? u.Ts,
      fixtureId: u.fixtureId ?? u.FixtureId,
      // TxLINE uses GameState; TxODDS legacy uses Status; Clock.Running is ground truth
      // when GameState is "scheduled" but match has actually started (TxLINE devnet quirk)
      gameState: (() => {
        const raw = u.gameState ?? u.GameState ?? u.Status ?? u.MatchStatus;
        const rawStr = raw != null ? String(raw) : undefined;
        const clockRunning = u.Clock?.Running === true || u.clock?.running === true;
        if (clockRunning && (!rawStr || /^(scheduled|notstarted|not_started)$/i.test(rawStr))) return 'FirstHalf';
        if (!rawStr) return undefined;
        return txoddsStatusToGameState(rawStr) ?? rawStr;
      })(),
      // Only extract score if it contains actual numeric data — Score:{} is truthy but empty
      // and would reset to 0-0 on every poll, overwriting the ESPN-backed score
      score: (() => {
        if (u.score && typeof u.score.home === 'number') return u.score;
        if (u.Score) {
          const h = u.Score.Home ?? u.Score.home;
          const a = u.Score.Away ?? u.Score.away;
          if (typeof h === 'number') return { home: h, away: typeof a === 'number' ? a : 0 };
        }
        if (u.ScoreSoccer) return { home: u.ScoreSoccer['1']?.Goals ?? 0, away: u.ScoreSoccer['2']?.Goals ?? 0 };
        return undefined;
      })(),
      // TxLINE uses Events[]; TxODDS legacy uses Incidents[] with IncidentType/Team fields
      events: (u.events ?? u.Events ?? u.Incidents ?? u.incidents ?? []).map((e: any) => ({
        type:              (e.type ?? e.Type ?? e.IncidentType ?? e.incidentType ?? '').toLowerCase(),
        minute:            e.minute ?? e.Minute ?? 0,
        period:            e.period ?? e.Period ?? '',
        // TxLINE uses Participant (1=home, 2=away); TxODDS uses Team with same 1/2 values
        participant:       e.participant ?? e.Participant ?? e.Team ?? e.team ?? 1,
        playerId:          e.playerId ?? e.PlayerId,
        playerName:        e.playerName ?? e.PlayerName,
        assistPlayerId:    e.assistPlayerId ?? e.AssistPlayerId,
        assistPlayerName:  e.assistPlayerName ?? e.AssistPlayerName,
        goalType:          e.goalType ?? e.GoalType,
      })),
      clockRunning: u.Clock?.Running ?? u.clock?.running,
      clockSeconds: u.Clock?.Seconds ?? u.Clock?.seconds ?? u.clock?.seconds,
    });

    const bootstrap = async () => {
      if (liveInitDoneRef.current) return;
      liveInitDoneRef.current = true;

      // Default: our WC2026 fixture ID matches TxLINE fixture ID
      txlineFixtureIdRef.current = contestId;
      console.log('[LivePage] Starting bootstrap — contestId:', contestId, 'home:', fixture.homeTeam, 'away:', fixture.awayTeam);
      console.log('[LivePage] TxLINE liveFixtures count:', liveFixtures?.length ?? 0);

      // Try to match a better fixture ID from liveFixtures or allFixtures (in case devnet uses different IDs).
      // allFixtures covers pre-match fixtures not yet in liveFixtures.
      const fixturePool = liveFixtures?.length > 0 ? liveFixtures : allFixtures;
      if (fixturePool?.length > 0) {
        const normStr = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, ' ').trim();
        const normHome = normStr(fixture.homeTeam);
        const normAway = normStr(fixture.awayTeam);
        const matched = fixturePool.find((f: any) => {
          const p1 = normStr(f.Participant1 || f.homeTeam?.name || f.home || '');
          const p2 = normStr(f.Participant2 || f.awayTeam?.name || f.away || '');
          return (p1.includes(normHome.split(' ')[0]) || normHome.includes(p1.split(' ')[0]))
              && (p2.includes(normAway.split(' ')[0]) || normAway.includes(p2.split(' ')[0]));
        });
        if (matched) {
          const resolvedId = matched.FixtureId || matched.fixtureId || matched.id;
          const poolName = liveFixtures?.length > 0 ? 'liveFixtures' : 'allFixtures';
          console.log(`[LivePage] Matched fixture from ${poolName}:`, JSON.stringify(matched));
          if (resolvedId && resolvedId !== contestId) {
            console.log(`[LivePage] Fixture ID override: ${contestId} → ${resolvedId}`);
            txlineFixtureIdRef.current = resolvedId;
          }
        } else {
          console.warn('[LivePage] No match in fixture pool for', fixture.homeTeam, 'vs', fixture.awayTeam);
          console.log('[LivePage] pool sample:', JSON.stringify(fixturePool.slice(0, 3)));
        }
      }

      const resolvedFixtureId = txlineFixtureIdRef.current ?? contestId;

      // Build player ID map (from lineups or snapshot events)
      const pMap = await buildPlayerIdMap(apiToken!, resolvedFixtureId, fixture.homeTeam, fixture.awayTeam, guestJwt);
      if (isMounted) {
        playerIdMapRef.current = pMap;
        console.log(`[LivePage] Player map — ${Object.keys(pMap).length} players matched`);
      }

      // Load all events that happened before we connected via the score snapshot
      const snap = await fetchScoreSnapshot(apiToken!, resolvedFixtureId, guestJwt);
      if (snap && isMounted) {
        const snapRaw = Array.isArray(snap) ? snap : [snap];
        const snapUpdates = snapRaw.map(normalizeUpdate);
        console.log('[LivePage] Snapshot raw (first 800):', JSON.stringify(snapRaw)?.slice(0, 800));
        console.log('[LivePage] Snapshot normalized — gameState:', snapUpdates[snapUpdates.length-1]?.gameState, '| events:', snapUpdates.flatMap(u => u.events ?? []).length, '| score:', JSON.stringify(snapUpdates[snapUpdates.length-1]?.score));

        // Apply score from snapshot
        const latestSnap = snapUpdates[snapUpdates.length - 1];
        if (latestSnap?.score) {
          setScore({ home: latestSnap.score.home ?? 0, away: latestSnap.score.away ?? 0 });
          scoreRef.current = { home: latestSnap.score.home ?? 0, away: latestSnap.score.away ?? 0 };
        }

        // Apply historical events from snapshot
        const snapEvents = convertTxLineUpdates(
          snapUpdates,
          playerIdMapRef.current,
          fixture.homeTeam, fixture.awayTeam,
          fixture.homeFlag, fixture.awayFlag,
          seenSeqsRef.current,
        );

        // ── Game state synthesis from snapshot ──────────────────────────────
        // The /api/scores/updates endpoint often omits GameState; snapshot always has it.
        // We synthesize match-flow events here so they appear even when joining late.
        const snapGs = latestSnap?.gameState ?? null;
        const synthBootEvents: typeof matchEvents = [];
        const isMatchLive = ['FirstHalf','SecondHalf','HalfTime','ExtraTime','Penalties'].includes(snapGs ?? '');

        if (snapGs && lastGameStateRef.current === null) {
          lastGameStateRef.current = snapGs; // prevent poll from re-synthesizing the same state

          // Award starting_xi appearance points once (skip players already in snapshot events)
          if (isMatchLive && userLineupRef.current?.players?.length > 0) {
            const { players, captain, confidence } = userLineupRef.current;
            let totalBonus = 0;
            for (const p of (players as any[])) {
              if (!p?.id || appearedPlayersRef.current.has(p.id)) continue;
              let pts = 2;
              const stars = (confidence as Record<string, number>)?.[p.id] ?? 3;
              pts *= stars === 5 ? 1.5 : stars === 4 ? 1.35 : stars === 3 ? 1.2 : stars === 2 ? 1.1 : 1.0;
              if (captain === p.id) pts *= 2;
              pts = Math.round(pts * 100) / 100;
              totalBonus += pts;
              appearedPlayersRef.current.add(p.id);
              setPlayerPoints(prev => ({ ...prev, [p.id]: Math.round(((prev[p.id] ?? 0) + pts) * 100) / 100 }));
              setPlayerHistory(prev => ({
                ...prev,
                [p.id]: [...(prev[p.id] ?? []), { label: 'starting xi', pts, minute: 0 }],
              }));
            }
            if (totalBonus > 0 && isMounted) {
              setLeaderboard(prev => {
                const next = prev.map(e => e.isUser ? { ...e, points: Math.round((e.points + totalBonus) * 100) / 100 } : e);
                return next.sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }));
              });
            }
          }

          // Synthesize a match-flow marker event for the feed
          if (snapGs === 'FirstHalf') {
            synthBootEvents.push({ id: 'synth-ko-boot', minute: 0, team: '', teamFlag: '', player: '', playerId: '', type: 'kick_off', points: 0, description: 'Kick off! Match has started.' });
          } else if (snapGs === 'HalfTime') {
            synthBootEvents.push({ id: 'synth-ht-boot', minute: 45, team: '', teamFlag: '', player: '', playerId: '', type: 'half_time', points: 0, description: 'Half time!' });
          } else if (snapGs === 'SecondHalf') {
            synthBootEvents.push({ id: 'synth-ko-boot', minute: 45, team: '', teamFlag: '', player: '', playerId: '', type: 'kick_off', points: 0, description: 'Second half underway!' });
          } else if (snapGs === 'FullTime') {
            synthBootEvents.push({ id: 'synth-ft-boot', minute: 90, team: '', teamFlag: '', player: '', playerId: '', type: 'full_time', points: 0, description: 'Full time! Match has ended.' });
          }
          console.log(`[LivePage] Snapshot GameState: ${snapGs} — synthesized ${synthBootEvents.length} flow events`);
        }

        // Merge: synthBootEvents (low minute, e.g. kick_off@0) + real snapshot events (sorted ascending)
        const allBootEvents = [...synthBootEvents, ...snapEvents];
        if (allBootEvents.length > 0 && isMounted) {
          setEvents(allBootEvents.slice().reverse()); // most recent first
          setMinute(allBootEvents[allBootEvents.length - 1]?.minute ?? 0);
          setTxlineStatus('live');
          console.log(`[LivePage] Snapshot loaded — ${snapEvents.length} real events + ${synthBootEvents.length} flow events`);
        } else {
          console.log('[LivePage] Snapshot: no events and no game state (match not started yet)');
        }

        // ── Goal history for late joiners ─────────────────────────────────────
        // TxLINE devnet never sends real Incidents, so load scoring history from
        // /api/match/result (ESPN-backed, server-side only). This runs once per
        // session for any live/half-time/full-time state regardless of snapshot events.
        if (isMatchLive && !matchResultLoadedRef.current) {
          matchResultLoadedRef.current = true;
          try {
            const res = await fetch(`/api/match/result?fixtureId=${contestId}`);
            if (res.ok && isMounted) {
              const resultData: { events: Array<{ minute: string; type: string; player: string; assist?: string; team: string }> } = await res.json();
              const espnEvents = resultData.events ?? [];
              console.log(`[LivePage] Match result — ${espnEvents.length} historical events`);

              if (espnEvents.length > 0 && isMounted) {
                const historyEvents: typeof matchEvents = [];
                const pidMap = playerIdMapRef.current;

                for (const ev of espnEvents) {
                  const min = parseInt(ev.minute) || 0;
                  const teamFlag = ev.team === fixture.homeTeam ? fixture.homeFlag : fixture.awayFlag;
                  const evType = ev.type === 'penalty' ? 'goal' : ev.type as string;

                  // Fuzzy-match ESPN player name against TxLINE names in the player map
                  let playerId = '';
                  for (const [txlineName, fantasyId] of Object.entries(pidMap)) {
                    if (matchPlayerName(ev.player, txlineName)) { playerId = fantasyId; break; }
                  }

                  const evId = `hist-${evType}-${min}-${ev.player.replace(/\s+/g, '')}`;
                  const desc =
                    evType === 'goal'       ? `Goal! ${ev.player}${ev.assist ? ` (assist: ${ev.assist})` : ''}` :
                    evType === 'own_goal'   ? `Own goal — ${ev.player}` :
                    evType === 'yellow_card'? `Yellow card — ${ev.player}` :
                    evType === 'red_card'   ? `Red card — ${ev.player}` :
                    `${evType} — ${ev.player}`;

                  historyEvents.push({ id: evId, minute: min, team: ev.team, teamFlag, player: ev.player, playerId, type: evType, points: 0, description: desc });

                  // Award fantasy points once for matched lineup players
                  if (playerId && userLineupRef.current?.players?.length > 0) {
                    const { players, captain, confidence } = userLineupRef.current;
                    const matched = players.find((p: any) => p?.id === playerId);
                    if (matched) {
                      const wasAppeared = appearedPlayersRef.current.has(playerId);
                      let rawPts = calculateEventPoints(evType, (matched as any).position);
                      if (!wasAppeared) { rawPts += 2; appearedPlayersRef.current.add(playerId); }
                      const cardDef = equippedCardDefsRef.current[playerId];
                      if (cardDef) rawPts += getCardBonusForEvent(cardDef, evType);
                      let delta = rawPts;
                      if (captain === playerId) delta *= 2;
                      const stars = (confidence as Record<string, number>)?.[playerId] ?? 3;
                      delta *= stars === 5 ? 1.5 : stars === 4 ? 1.35 : stars === 3 ? 1.2 : stars === 2 ? 1.1 : 1.0;
                      delta = Math.round(delta * 100) / 100;
                      setPlayerPoints(prev => ({ ...prev, [playerId]: Math.round(((prev[playerId] ?? 0) + delta) * 100) / 100 }));
                      setPlayerHistory(prev => ({ ...prev, [playerId]: [...(prev[playerId] ?? []), { label: evType, pts: delta, minute: min }] }));
                    }
                  }
                }

                if (historyEvents.length > 0 && isMounted) {
                  setEvents(prev => {
                    const existingIds = new Set(prev.map(e => e.id));
                    const fresh = historyEvents.filter(e => !existingIds.has(e.id));
                    if (fresh.length === 0) return prev;
                    // historyEvents sorted ascending → reverse to newest-first before prepending
                    return [...fresh.slice().reverse(), ...prev];
                  });
                }
              }
            }
          } catch (e) {
            console.warn('[LivePage] Failed to load match result history:', e);
          }
        }
      }
    };

    const poll = async () => {
      if (!txlineFixtureIdRef.current) return;
      try {
        const raw = await fetchLiveScoreUpdates(apiToken!, txlineFixtureIdRef.current, guestJwt);
        if (!isMounted) return;

        // null = 404 (fixture not live on TxLINE yet) — try snapshot fallback
        if (raw === null) {
          const snap = await fetchScoreSnapshot(apiToken!, txlineFixtureIdRef.current!, guestJwt);
          if (snap && isMounted) {
            const snapUpdates = Array.isArray(snap) ? snap : [snap];
            const latest = snapUpdates[snapUpdates.length - 1];
            const s = latest?.score ?? (latest?.Score ? { home: latest.Score.Home ?? 0, away: latest.Score.Away ?? 0 } : null);
            if (s) { setScore({ home: s.home ?? 0, away: s.away ?? 0 }); scoreRef.current = { home: s.home ?? 0, away: s.away ?? 0 }; }
          }
          setTxlineStatus('waiting');
          return;
        }

        // Log raw response ONCE so we can inspect real structure if events are missing
        if (seenSeqsRef.current.size === 0) {
          console.log('[LivePage] TxLINE first poll raw:', JSON.stringify(raw)?.slice(0, 1000));
        }

        const rawUpdates = Array.isArray(raw) ? raw : (raw ? [raw] : []);
        const updates = rawUpdates.map(normalizeUpdate);
        if (updates.length === 0) { setTxlineStatus('waiting'); return; }
        setTxlineStatus('live');

        // Update score from latest snapshot
        const latest = updates[updates.length - 1];
        if (latest?.score) {
          setScore({ home: latest.score.home ?? 0, away: latest.score.away ?? 0 });
          scoreRef.current = { home: latest.score.home ?? 0, away: latest.score.away ?? 0 };
        }

        // ── Clock tracking — update live minute display from TxLINE Clock.Seconds ──
        const pollClockRunning: boolean | undefined = latest?.clockRunning;
        const pollClockSeconds: number | undefined = latest?.clockSeconds;
        if (typeof pollClockSeconds === 'number' && pollClockSeconds > 0) {
          setLiveClockMinute(Math.floor(pollClockSeconds / 60));
        }

        // Detect Clock.Running transitions true→false (half/full-time) and false→true (2nd half)
        // as a fallback when TxLINE GameState is always "scheduled" (devnet quirk).
        if (typeof pollClockRunning === 'boolean' && pollClockRunning !== lastClockRunningRef.current) {
          const prevRunning = lastClockRunningRef.current;
          lastClockRunningRef.current = pollClockRunning;
          const approxMin = Math.floor((lastClockSecondsRef.current ?? 0) / 60);

          if (!pollClockRunning && prevRunning === true) {
            // Clock just stopped
            if (approxMin >= 40 && approxMin < 65 && lastGameStateRef.current !== 'HalfTime') {
              lastGameStateRef.current = 'HalfTime';
              if (isMounted) {
                setEvents(prev => [{ id: `synth-ht-clk-${Date.now()}`, minute: 45, team: '', teamFlag: '', player: '', playerId: '', type: 'half_time', points: 0, description: 'Half time!' }, ...prev]);
                setMinute(45);
                playSFX('whistle');
              }
            } else if (approxMin >= 85 && lastGameStateRef.current !== 'FullTime') {
              lastGameStateRef.current = 'FullTime';
              if (isMounted) {
                setEvents(prev => [{ id: `synth-ft-clk-${Date.now()}`, minute: 90, team: '', teamFlag: '', player: '', playerId: '', type: 'full_time', points: 0, description: 'Full time! Match has ended.' }, ...prev]);
                setMinute(90);
                playSFX('end_game');
              }
            }
          } else if (pollClockRunning === true && prevRunning === false && lastGameStateRef.current === 'HalfTime') {
            // Clock restarted after half-time → second half
            lastGameStateRef.current = 'SecondHalf';
            if (isMounted) {
              setEvents(prev => [{ id: `synth-sh-clk-${Date.now()}`, minute: 45, team: '', teamFlag: '', player: '', playerId: '', type: 'kick_off', points: 0, description: 'Second half underway!' }, ...prev]);
              setMinute(45);
              playSFX('whistle');
            }
          }
        }
        if (typeof pollClockSeconds === 'number') lastClockSecondsRef.current = pollClockSeconds;

        // ── Game state transition synthesis ────────────────────────────────────
        // Detect state changes (null → FirstHalf, FirstHalf → HalfTime, etc.) and
        // synthesize match-flow events. Also awards starting_xi fantasy points once.
        const gs = latest?.gameState ?? null;
        if (gs && gs !== lastGameStateRef.current) {
          const prevGs = lastGameStateRef.current;
          lastGameStateRef.current = gs;

          const synthEvents: typeof matchEvents = [];
          const isMatchLive = ['FirstHalf','SecondHalf','HalfTime','ExtraTime','Penalties','FullTime'].includes(gs);

          // Award starting appearance bonus once per session when match is first detected live
          if (!prevGs && isMatchLive && userLineupRef.current?.players?.length > 0) {
            const { players, captain, confidence } = userLineupRef.current;
            let totalBonus = 0;
            for (const p of (players as any[])) {
              if (!p?.id || appearedPlayersRef.current.has(p.id)) continue;
              let pts = 2;
              const stars = (confidence as Record<string, number>)?.[p.id] ?? 3;
              pts *= stars === 5 ? 1.5 : stars === 4 ? 1.35 : stars === 3 ? 1.2 : stars === 2 ? 1.1 : 1.0;
              if (captain === p.id) pts *= 2;
              pts = Math.round(pts * 100) / 100;
              totalBonus += pts;
              appearedPlayersRef.current.add(p.id); // prevent double-counting from appearance bonus
              setPlayerPoints(prev => ({ ...prev, [p.id]: Math.round(((prev[p.id] ?? 0) + pts) * 100) / 100 }));
              setPlayerHistory(prev => ({
                ...prev,
                [p.id]: [...(prev[p.id] ?? []), { label: 'starting xi', pts, minute: 0 }],
              }));
            }
            if (totalBonus > 0 && isMounted) {
              setLeaderboard(prev => {
                const next = prev.map(e => e.isUser ? { ...e, points: Math.round((e.points + totalBonus) * 100) / 100 } : e);
                return next.sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }));
              });
            }
          }

          // Synthesize match-flow events for the feed
          if (gs === 'FirstHalf' && !prevGs) {
            synthEvents.push({ id: `synth-kickoff-${Date.now()}`, minute: 0, team: '', teamFlag: '', player: '', playerId: '', type: 'kick_off', points: 0, description: 'Kick off! The match has started.' });
          } else if (gs === 'HalfTime') {
            synthEvents.push({ id: `synth-ht-${Date.now()}`, minute: 45, team: '', teamFlag: '', player: '', playerId: '', type: 'half_time', points: 0, description: 'Half time!' });
          } else if (gs === 'SecondHalf' && prevGs) {
            synthEvents.push({ id: `synth-so-${Date.now()}`, minute: 45, team: '', teamFlag: '', player: '', playerId: '', type: 'kick_off', points: 0, description: 'Second half underway!' });
          } else if (gs === 'FullTime') {
            synthEvents.push({ id: `synth-ft-${Date.now()}`, minute: 90, team: '', teamFlag: '', player: '', playerId: '', type: 'full_time', points: 0, description: 'Full time! Match has ended.' });
          }

          if (synthEvents.length > 0 && isMounted) {
            setEvents(prev => [...synthEvents.slice().reverse(), ...prev]);
            setMinute(synthEvents[synthEvents.length - 1].minute);
            if (gs === 'FullTime') playSFX('end_game'); else playSFX('whistle');
          }
        }
        // ── End game state synthesis ────────────────────────────────────────────

        // Fallback: TxLINE is responding with score data but no GameState field detected.
        // This happens with some TxODDS devnet responses that omit status entirely.
        // Synthesize a kick_off once so the feed isn't empty.
        if (!gs && lastGameStateRef.current === null && latest?.score !== undefined) {
          lastGameStateRef.current = 'InPlay'; // sentinel — prevents re-running
          if (isMounted) {
            setEvents(prev => [{ id: `synth-ko-fb-${Date.now()}`, minute: 0, team: '', teamFlag: '', player: '', playerId: '', type: 'kick_off', points: 0, description: 'Match in progress!' }, ...prev]);
          }
          if (userLineupRef.current?.players?.length > 0) {
            const { players, captain, confidence } = userLineupRef.current;
            let totalBonus = 0;
            for (const p of (players as any[])) {
              if (!p?.id || appearedPlayersRef.current.has(p.id)) continue;
              let pts = 2;
              const stars = (confidence as Record<string, number>)?.[p.id] ?? 3;
              pts *= stars === 5 ? 1.5 : stars === 4 ? 1.35 : stars === 3 ? 1.2 : stars === 2 ? 1.1 : 1.0;
              if (captain === p.id) pts *= 2;
              pts = Math.round(pts * 100) / 100;
              totalBonus += pts;
              appearedPlayersRef.current.add(p.id);
              setPlayerPoints(prev => ({ ...prev, [p.id]: Math.round(((prev[p.id] ?? 0) + pts) * 100) / 100 }));
              setPlayerHistory(prev => ({ ...prev, [p.id]: [...(prev[p.id] ?? []), { label: 'starting xi', pts, minute: 0 }] }));
            }
            if (totalBonus > 0 && isMounted) {
              setLeaderboard(prev => {
                const next = prev.map(e => e.isUser ? { ...e, points: Math.round((e.points + totalBonus) * 100) / 100 } : e);
                return next.sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }));
              });
            }
          }
          console.log('[LivePage] Fallback: TxLINE live but no GameState detected — synthesized kick_off');
        }

        const newEvents = convertTxLineUpdates(
          updates,
          playerIdMapRef.current,
          fixture.homeTeam,
          fixture.awayTeam,
          fixture.homeFlag,
          fixture.awayFlag,
          seenSeqsRef.current
        );

        if (newEvents.length === 0) return;

        // Add all events to the feed silently
        setEvents(prev => [...newEvents.slice().reverse(), ...prev]);

        // Only pop dialog for the final (most recent) event — same as demo UX
        const trigger = newEvents[newEvents.length - 1];
        setMinute(trigger.minute);

        // SFX
        if (trigger.type === 'goal' || trigger.type === 'own_goal') {
          playSFX('goal');
        } else if (trigger.type === 'full_time') {
          playSFX('end_game');
        } else if (['kick_off', 'half_time', 'yellow_card', 'red_card', 'corner_kick', 'substitution', 'extra_time', 'penalty_save'].includes(trigger.type)) {
          playSFX('whistle');
        }

        // Update score from goal events
        for (const ev of newEvents) {
          if (ev.type === 'goal' || ev.type === 'own_goal') {
            const isHome = ev.team === fixture.homeTeam;
            setScore(s => ({ home: isHome ? s.home + 1 : s.home, away: !isHome ? s.away + 1 : s.away }));
          }
        }

        // Show popup if not already open
        if (!showPopupRef.current) {
          setLatestEvent(trigger);
          setDialogStep(1);
          setShowPopup(true);
        }

        // Fantasy points + toasts for every event
        for (const ev of newEvents) {
          if (!userLineupRef.current || !ev.playerId) continue;
          const { players, captain, confidence } = userLineupRef.current;
          const matched = players.find((p: any) => p && p.id === ev.playerId);
          if (!matched) continue;

          let rawPts = calculateEventPoints(ev.type, matched.position);
          const isAppearanceEv = ev.type === 'starting_xi' || ev.type === 'sub_appearance';
          if (!isAppearanceEv && !appearedPlayersRef.current.has(ev.playerId)) {
            rawPts += 2;
          }
          appearedPlayersRef.current.add(ev.playerId);
          // Apply equipped skill card bonus before captain/confidence multipliers
          const cardDefLive = equippedCardDefsRef.current[ev.playerId];
          if (cardDefLive) rawPts += getCardBonusForEvent(cardDefLive, ev.type);
          let delta = rawPts;
          let isCap = false;
          if (captain === ev.playerId) { delta *= 2; isCap = true; }
          const stars = confidence?.[ev.playerId] ?? 3;
          delta *= stars === 5 ? 1.5 : stars === 4 ? 1.35 : stars === 3 ? 1.2 : stars === 2 ? 1.1 : 1.0;

          setLeaderboard(prev => {
            const next = prev.map(entry =>
              entry.isUser
                ? { ...entry, points: entry.points + delta }
                : entry // other real participants — no fake scoring
            );
            return next.sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }));
          });
          if (ev.playerId && delta !== 0) {
            const pid = ev.playerId;
            const rnd = Math.round(delta * 100) / 100;
            setPlayerPoints(prev => ({ ...prev, [pid]: Math.round(((prev[pid] ?? 0) + rnd) * 100) / 100 }));
            setPlayerHistory(prev => ({
              ...prev,
              [pid]: [...(prev[pid] ?? []), { label: ev.type.replace(/_/g, ' '), pts: rnd, minute: ev.minute }],
            }));
          }

          if (delta !== 0 && !notifiedEventsRef.current.has(ev.id)) {
            notifiedEventsRef.current.add(ev.id);
            const rd = Math.round(delta * 100) / 100;
            const val = rd > 0 ? `+${rd} pts` : `${rd} pts`;
            const toasts: FantasyNotificationItem[] = [{
              id: `toast-${Date.now()}-${ev.id}`,
              type: ev.type as any,
              title: ev.type.replace(/_/g, ' '),
              subtitle: ev.player || 'Player Action',
              value: val,
            }];
            if (isCap) {
              const cap = Math.round((rd / 2) * 100) / 100;
              toasts.unshift({ id: `toast-cap-${Date.now()}`, type: 'captain_bonus', title: 'Captain 2× Bonus', subtitle: ev.player, value: cap > 0 ? `+${cap} pts` : `${cap} pts` });
            }
            setActiveToasts(prev => [...toasts, ...prev]);
          }
        }
      } catch (err) {
        if (isMounted) setTxlineStatus('waiting');
        console.error('[LivePage] poll error:', err);
      }
    };

    bootstrap().then(() => poll());
    const interval = setInterval(poll, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appMode, apiToken]);

  // ── LIVE MODE: Score from internal scoreboard (ESPN-backed, server-side) ──────
  // TxLINE devnet returns Score:{} (empty) so we always poll our own /api/scores/wc2026
  // endpoint as the source of truth for the score display, regardless of txlineStatus.
  // TxLINE events (goals) can still increment score on top of this baseline.
  useEffect(() => {
    if (appMode !== 'live') return;
    if (!fixture.homeTeam) return;

    let isMounted = true;
    const pollScore = async () => {
      try {
        const res = await fetch('/api/scores/wc2026');
        if (!res.ok || !isMounted) return;
        const data: Record<string, { home: number; away: number }> = await res.json();
        const entry = data[contestId];
        if (entry && isMounted) {
          // Only apply if TxLINE hasn't already given us a higher score (from goal events)
          setScore(prev => ({
            home: Math.max(prev.home, entry.home),
            away: Math.max(prev.away, entry.away),
          }));
          scoreRef.current = {
            home: Math.max(scoreRef.current.home, entry.home),
            away: Math.max(scoreRef.current.away, entry.away),
          };
        }
      } catch { /* silent */ }
    };

    pollScore();
    const interval = setInterval(pollScore, 30000); // poll every 30s for fresher scores
    return () => { isMounted = false; clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appMode, contestId]);

  // ── DEMO MODE: Simulate live events via minute ticker ──────────────────────
  // Simulate live events
  useEffect(() => {
    if (appMode === 'live' || persistedIsLive || !isPlaying || showPopup) return;

    const tickRate = isFastForward ? 2000 : 60000;

    const interval = setInterval(() => {
      setMinute((m) => Math.min(m + 1, 90));
      setCurrentEventIdx((idx) => {
        if (idx >= matchEvents.length) return idx;
        return idx;
      });
    }, tickRate);

    return () => clearInterval(interval);
  // appMode must be in deps so the timer stops immediately when switching to live
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appMode, isPlaying, showPopup, isFastForward]);

    // Trigger events based on minute (demo mode only)
    useEffect(() => {
      if (appMode === 'live' || persistedIsLive) return;
      if (showPopup) return;
      const event = matchEvents[currentEventIdx];
      if (!event || minute < event.minute) return;
      if (triggeredEventsRef.current.has(event.id)) return;
      if (events.find((e) => e.id === event.id)) return;
  
      triggeredEventsRef.current.add(event.id);
      
      // Play Sound Effect based on event type
      if (event.type === 'goal' || event.type === 'own_goal') {
        playSFX('goal');
      } else if (event.type === 'full_time') {
        playSFX('end_game');
      } else if (['kick_off', 'half_time', 'yellow_card', 'red_card', 'corner_kick', 'substitution', 'extra_time', 'penalty_save'].includes(event.type)) {
        playSFX('whistle');
      }

      setEvents((prev) => [event, ...prev]);
      setCurrentEventIdx((idx) => idx + 1);
      setLatestEvent(event);
      setDialogStep(1);
      setShowPopup(true);
  
      // Update score — mirror into scoreRef synchronously so full_time can read final score
      if (event.type === 'goal' || event.type === 'own_goal') {
        const isHome = event.team === fixture.homeTeam;
        scoreRef.current = {
          home: isHome ? scoreRef.current.home + 1 : scoreRef.current.home,
          away: !isHome ? scoreRef.current.away + 1 : scoreRef.current.away,
        };
        setScore((s) => ({
          home: isHome ? s.home + 1 : s.home,
          away: !isHome ? s.away + 1 : s.away,
        }));
      }

      // At full_time: award clean sheet bonus to eligible lineup players
      if (event.type === 'full_time' && userLineupRef.current) {
        const { players: csPlayers, captain: csCaptain, confidence: csConf } = userLineupRef.current;
        const finalScore = scoreRef.current;
        const cleanSheetTeams: string[] = [];
        if (finalScore.away === 0) cleanSheetTeams.push(fixture.homeTeam);
        if (finalScore.home === 0) cleanSheetTeams.push(fixture.awayTeam);

        for (const p of (csPlayers as any[])) {
          if (!p || !cleanSheetTeams.includes(p.team)) continue;
          let csBase = calculateEventPoints('clean_sheet', p.position);
          // Skill card clean_sheet_bonus applied before captain/confidence
          const cardDefCs = equippedCardDefsRef.current[p.id];
          if (cardDefCs) csBase += getCardBonusForEvent(cardDefCs, 'clean_sheet');
          if (csBase === 0) continue;
          let csDelta = csCaptain === p.id ? csBase * 2 : csBase;
          const csStars = csConf?.[p.id] ?? 3;
          csDelta *= csStars === 5 ? 1.5 : csStars === 4 ? 1.35 : csStars === 3 ? 1.2 : csStars === 2 ? 1.1 : 1.0;
          csDelta = Math.round(csDelta * 100) / 100;
          setLeaderboard(prev => {
            const next = prev.map(e => e.isUser ? { ...e, points: Math.round((e.points + csDelta) * 100) / 100 } : e);
            return next.sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }));
          });
          setActiveToasts(prev => [{
            id: `toast-cs-${Date.now()}-${p.id}`,
            type: 'clean_sheet' as any,
            title: 'Clean Sheet!',
            subtitle: p.name,
            value: `+${csDelta} pts`,
          }, ...prev]);
          setPlayerPoints(prev => ({ ...prev, [p.id]: Math.round(((prev[p.id] ?? 0) + csDelta) * 100) / 100 }));
          setPlayerHistory(prev => ({
            ...prev,
            [p.id]: [...(prev[p.id] ?? []), { label: 'clean sheet', pts: csDelta, minute: 90 }],
          }));
        }
      }

      // Determine authentic points for user
      let delta = 0;
      let isCap = false;

      if (userLineupRef.current && event.playerId) {
        const { players, captain, confidence } = userLineupRef.current;
        const matchedPlayer = players.find((p: any) => p && p.id === event.playerId);
        if (matchedPlayer) {
          let rawPoints = calculateEventPoints(event.type, matchedPlayer.position);
          const isAppearanceEvt = event.type === 'starting_xi' || event.type === 'sub_appearance';
          if (!isAppearanceEvt && !appearedPlayersRef.current.has(event.playerId)) {
            rawPoints += 2;
          }
          appearedPlayersRef.current.add(event.playerId);
          // Apply equipped skill card bonus before captain/confidence multipliers
          const cardDefDemo = equippedCardDefsRef.current[event.playerId];
          if (cardDefDemo) rawPoints += getCardBonusForEvent(cardDefDemo, event.type);
          delta = rawPoints;

          if (captain === event.playerId) {
            delta *= 2;
            isCap = true;
          }
          const stars = confidence?.[event.playerId] ?? 3;
          const confidenceMultiplier = stars === 5 ? 1.5 : stars === 4 ? 1.35 : stars === 3 ? 1.2 : stars === 2 ? 1.1 : 1.0;
          delta = delta * confidenceMultiplier;
        }
      }

      // Update leaderboard points (demo mode — bots accumulate simulated points)
      setLeaderboard((prev) => {
        const next = prev.map(entry => {
          if (entry.isUser) {
            return { ...entry, points: entry.points + delta };
          }
          return { ...entry, points: entry.points + Math.abs(event.points) * (Math.random() * 0.4) };
        });
        
        const sorted = next.sort((a, b) => b.points - a.points).map((e, i) => {
          let prize = '-';
          if (contestType === '5050') {
            prize = i < 10 ? '0.18 SOL' : '-';
          } else if (contestType === 'wta') {
            prize = i === 0 ? '10.0 SOL' : '-';
          } else {
            if (i === 0) prize = '5.0 SOL';
            else if (i === 1) prize = '3.0 SOL';
            else if (i === 2) prize = '2.0 SOL';
          }
          return { ...e, rank: i + 1, prize };
        });
        return sorted;
      });
      // Track per-player points and history for the lineup panel
      if (event.playerId && delta !== 0) {
        const pid = event.playerId!;
        const rnd = Math.round(delta * 100) / 100;
        setPlayerPoints(prev => ({ ...prev, [pid]: Math.round(((prev[pid] ?? 0) + rnd) * 100) / 100 }));
        setPlayerHistory(prev => ({
          ...prev,
          [pid]: [...(prev[pid] ?? []), { label: event.type.replace(/_/g, ' '), pts: rnd, minute: event.minute }],
        }));
      }

      // Fantasy Point Notification Trigger (Safe single-trigger outside leaderboard setter)
      if (delta !== 0 && !notifiedEventsRef.current.has(event.id)) {
        notifiedEventsRef.current.add(event.id);
        
        const roundedDelta = Math.round(delta * 100) / 100;
        const valueStr = roundedDelta > 0 ? `+${roundedDelta} pts` : `${roundedDelta} pts`;
        
        const newToasts: FantasyNotificationItem[] = [
          {
            id: `toast-${Date.now()}-${event.id}`,
            type: event.type as any,
            title: event.type.replace(/_/g, ' '),
            subtitle: event.player || 'Player Action',
            value: valueStr,
          }
        ];

        // Authentic captain bonus notification
        if (isCap) {
          // Captain bonus = half of total delta (since delta was doubled for captain)
          const capBonusPts = Math.round((roundedDelta / 2) * 100) / 100;
          newToasts.unshift({
            id: `toast-cap-${Date.now()}`,
            type: 'captain_bonus',
            title: 'Captain 2× Bonus',
            subtitle: event.player,
            value: capBonusPts > 0 ? `+${capBonusPts} pts` : `${capBonusPts} pts`,
          });
        }

        // Rank up simulation — use isUser instead of index
        const nextBoard = leaderboardRef.current.map(entry => {
          if (entry.isUser) return { ...entry, points: entry.points + delta };
          return { ...entry };
        });
        const sorted = nextBoard.sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }));
        const newUserRank = sorted.find((e) => e.isUser)?.rank ?? 2;
        
        if (newUserRank < prevRankRef.current) {
          newToasts.unshift({
            id: `toast-rank-${Date.now()}`,
            type: 'rank_up',
            title: 'Rank Up!',
            subtitle: `#${prevRankRef.current} → #${newUserRank}`,
            value: 'Rank Up',
          });

          if (newUserRank === 1) {
            newToasts.unshift({
              id: `toast-ach-${Date.now()}`,
              type: 'achievement',
              title: 'Achievement',
              subtitle: "You're now in 1st Place!",
              value: '🏆 1st Place',
            });
          }
        }
        prevRankRef.current = newUserRank;

        setActiveToasts(prev => [...newToasts, ...prev]);
      }

    }, [minute, currentEventIdx, fixture.homeTeam, showPopup]);

    // Auto-advance or auto-close JRPG dialog popups
    useEffect(() => {
      if (!showPopup || !latestEvent) return;

      let timer: NodeJS.Timeout;
      // Only events with 2 dialog steps (valid TxLINE events)
      const multiStepEvents = [
        'goal', 'own_goal', 'yellow_card', 'red_card',
        'penalty_won', 'penalty_conceded', 'penalty_missed',
        'penalty_save', 'penalty_scored', 'penalty_missed_shootout',
        'clean_sheet', 'substitution', 'sub_appearance',
        'possession_bonus', 'danger_attack', 'starting_xi',
        'assist', 'goalkeeper_save',
      ];

      if (latestEvent.type === 'full_time') {
        if (dialogStep === 1) {
          timer = setTimeout(() => setDialogStep(2), 4000);
        } else if (dialogStep === 2) {
          timer = setTimeout(() => setDialogStep(3), 5000);
        } else if (dialogStep === 3) {
          timer = setTimeout(() => setDialogStep(4), 5000);
        } else if (dialogStep === 4) {
          timer = setTimeout(() => setDialogStep(5), 5000);
        } else if (dialogStep === 5) {
          timer = setTimeout(() => setDialogStep(6), 5000);
        } else if (dialogStep === 6) {
          timer = setTimeout(() => setDialogStep(7), 5000);
        } else {
          timer = setTimeout(() => setShowPopup(false), 5000);
        }
      } else if (latestEvent.type === 'half_time') {
        if (dialogStep === 1) {
          timer = setTimeout(() => setDialogStep(2), 4000);
        } else if (dialogStep === 2) {
          timer = setTimeout(() => setDialogStep(3), 5000);
        } else if (dialogStep === 3) {
          timer = setTimeout(() => setDialogStep(4), 5000);
        } else {
          timer = setTimeout(() => setShowPopup(false), 5000);
        }
      } else if (latestEvent.type === 'kick_off') {
        if (dialogStep === 1) {
          timer = setTimeout(() => setDialogStep(2), 4000);
        } else if (dialogStep === 2) {
          timer = setTimeout(() => setDialogStep(3), 5000);
        } else if (dialogStep === 3) {
          timer = setTimeout(() => setDialogStep(4), 5000);
        } else if (dialogStep === 4) {
          timer = setTimeout(() => setDialogStep(5), 5000);
        } else {
          timer = setTimeout(() => setShowPopup(false), 5000);
        }
      } else if (['var_review', 'corner_kick', 'extra_time'].includes(latestEvent.type)) {
        if (dialogStep === 1) {
          timer = setTimeout(() => setDialogStep(2), 4000);
        } else if (dialogStep === 2) {
          timer = setTimeout(() => setDialogStep(3), 5000);
        } else {
          timer = setTimeout(() => setShowPopup(false), 5000);
        }
      } else if (multiStepEvents.includes(latestEvent.type) && dialogStep === 1) {
        timer = setTimeout(() => {
          setDialogStep(2);
        }, 5000);
      } else {
        timer = setTimeout(() => {
          setShowPopup(false);
        }, 5000);
      }

      return () => clearTimeout(timer);
    }, [showPopup, latestEvent, dialogStep]);

    // Card pack reward after full time
    useEffect(() => {
      if (latestEvent?.type === 'full_time' && !showPopup) {
        if (userLineupRef.current && !hasOpenedPack(contestId)) {
          const packTimer = setTimeout(() => setShowCardPack(true), 800);
          return () => clearTimeout(packTimer);
        }
      }
    }, [latestEvent, showPopup, contestId]);

    // Restart the demo match 2 minutes after full time (demo only — live matches don't loop)
    useEffect(() => {
      if (appMode === 'live') return;
      if (latestEvent?.type === 'full_time' && !showPopup) {
        const resetTimer = setTimeout(() => {
          setMinute(0);
          setCurrentEventIdx(0);
          triggeredEventsRef.current.clear();
          notifiedEventsRef.current.clear();
          appearedPlayersRef.current.clear();
          scoreRef.current = { home: 0, away: 0 };
          setEvents([]);
          setScore({ home: 0, away: 0 });
          setPlayerPoints({});
          setPlayerHistory({});

          let restartBoard = [...DEMO_LEADERBOARD];
          if (publicKey) {
            const stored = localStorage.getItem(`profile_${publicKey.toString()}`);
            let customUser = 'You';
            let customAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${publicKey.toString()}`;
            if (stored) {
              const parsed = JSON.parse(stored);
              customUser = parsed.username || customUser;
              customAvatar = parsed.avatar || customAvatar;
            }
            restartBoard = restartBoard.map((entry, index) => {
              let prize = '-';
              if (contestType === '5050') prize = index < 10 ? '0.18 SOL' : '-';
              else if (contestType === 'wta') prize = index === 0 ? '10.0 SOL' : '-';
              else {
                if (index === 0) prize = '5.0 SOL';
                else if (index === 1) prize = '3.0 SOL';
                else if (index === 2) prize = '2.0 SOL';
              }
              if (entry.isUser) {
                return {
                  ...entry, prize,
                  username: customUser,
                  wallet: `${publicKey.toString().substring(0, 4)}...${publicKey.toString().slice(-3)}`,
                  avatar: customAvatar,
                };
              }
              return { ...entry, prize };
            });
          } else {
            restartBoard = restartBoard.map((entry, index) => {
              let prize = '-';
              if (contestType === '5050') prize = index < 10 ? '0.18 SOL' : '-';
              else if (contestType === 'wta') prize = index === 0 ? '10.0 SOL' : '-';
              else {
                if (index === 0) prize = '5.0 SOL';
                else if (index === 1) prize = '3.0 SOL';
                else if (index === 2) prize = '2.0 SOL';
              }
              return { ...entry, prize };
            });
          }
          setLeaderboard(restartBoard);
          setLatestEvent(null);
        }, 120000);
        return () => clearTimeout(resetTimer);
      }
    }, [latestEvent, showPopup]);

  const [showCardPack, setShowCardPack] = useState(false);
  // Per-player accumulated fantasy points (after captain + confidence multipliers)
  const [playerPoints, setPlayerPoints] = useState<Record<string, number>>({});
  const [playerHistory, setPlayerHistory] = useState<Record<string, Array<{ label: string; pts: number; minute: number }>>>({});
  // Lineup exposed as state so it can drive the player panel UI
  const [userLineup, setUserLineup] = useState<any>(null);

  const userPoints = leaderboard.find((e) => e.isUser)?.points ?? 0;
  const userRank = leaderboard.find((e) => e.isUser)?.rank ?? '-';

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      {/* Skill Card Pack reward — appears after full time if user has a lineup */}
      {showCardPack && (
        <CardPackOpener
          contestId={contestId}
          onOpen={() => openCardPack(contestId)}
          onClose={() => setShowCardPack(false)}
        />
      )}

      {/* Fantasy Notification Toast Queue */}
      {activeToasts.map((toast, idx) => (
        <FantasyToast
          key={toast.id}
          notification={toast}
          index={idx}
          onDismiss={() => {
            setActiveToasts((prev) => prev.filter((t) => t.id !== toast.id));
          }}
        />
      ))}

      {/* Live Event Popup */}
      {showPopup && latestEvent && (() => {
        const dialog = getDialogData(latestEvent, dialogStep, fixture, score);
        
        if (dialog.isRefereeStyle) {
          return (
            <div className="npc-dialog-overlay" onClick={() => setShowPopup(false)}>
              {/* Referee Image */}
              <img
                src={dialog.refereeImage}
                alt="Referee"
                className={`npc-referee-img-style referee-${(dialog as any).refereePosition === 'left' ? 'left' : 'right'}`}
              />
              
              {/* Giant Yellow Explosion Speech Bubble */}
              <div className={`npc-referee-bubble-wrapper referee-${(dialog as any).refereePosition === 'left' ? 'left' : 'right'}`}>
                <div className="npc-referee-bubble-container">
                  {/* Background Starburst SVG */}
                  <svg viewBox="0 0 500 300" width="100%" height="100%" preserveAspectRatio="none" className="npc-referee-bubble-bg">
                    <polygon points="250,10 280,70 340,30 350,90 410,60 400,120 470,110 440,160 490,190 430,210 460,260 400,250 390,290 330,260 300,295 270,240 220,285 200,230 140,270 140,210 70,225 100,175 40,140 105,115 70,65 130,85 140,25 190,75 220,15" fill="black" transform="translate(8, 8)" />
                    <polygon points="250,10 280,70 340,30 350,90 410,60 400,120 470,110 440,160 490,190 430,210 460,260 400,250 390,290 330,260 300,295 270,240 220,285 200,230 140,270 140,210 70,225 100,175 40,140 105,115 70,65 130,85 140,25 190,75 220,15" fill="#ffee00" stroke="black" strokeWidth="8" strokeLinejoin="miter" />
                  </svg>
                  <div className="npc-referee-bubble-text">
                    {dialog.text}
                    <span style={{ color: '#ff0000', fontSize: '1.2em', WebkitTextStroke: '2px #000000', textShadow: '3px 3px 0px #000000' }}>!</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        const hasDual = !!(dialog.commentator1Image && (dialog.refereeImage || dialog.commentator2Image));

        return (
          <div 
            className="npc-dialog-overlay"
            onClick={() => {
              const type = latestEvent.type;
              let maxSteps = 2; // Default for most multi-step events
              if (type === 'full_time') maxSteps = 7;
              else if (type === 'half_time') maxSteps = 4;
              else if (type === 'kick_off') maxSteps = minute < 45 ? 5 : 3;
              else if (['var_review', 'corner_kick', 'substitution', 'extra_time'].includes(type)) maxSteps = 3;

              if (dialogStep < maxSteps) {
                setDialogStep(prev => prev + 1);
              } else {
                setShowPopup(false);
              }
            }}
          >
            {/* Left character: Commentator 1 */}
            {dialog.commentator1Image && (
              <img
                src={dialog.commentator1Image}
                alt="Commentator 1"
                className={`npc-commentator1-img${hasDual ? ' dual-active' : ''}`}
              />
            )}

            {/* Right character: Commentator 2 */}
            {dialog.commentator2Image && (
              <img
                src={dialog.commentator2Image}
                alt="Commentator 2"
                className={`npc-commentator2-img${hasDual ? ' dual-active' : ''}`}
              />
            )}

            {/* Right character: Referee */}
            {dialog.refereeImage && (
              <img
                src={dialog.refereeImage}
                alt="Referee"
                className={`npc-referee-img${hasDual ? ' dual-active' : ''}`}
              />
            )}

            {/* JRPG Dialog Box */}
            <div className="npc-jrpg-dialog-box">
              {/* Speaker Tag */}
              <div className="npc-jrpg-speaker-tag">
                {dialog.speakerTitle}
              </div>

              {/* Dialog Text */}
              <div className="npc-jrpg-dialog-text">
                {dialog.text}
              </div>

              {/* Next/Close Action Arrow */}
              <div className="npc-jrpg-arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="#1a1008" />
                  <path d="M10 7L15 12L10 17" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        );
      })()}

      <main style={{ padding: '24px 0 80px' }}>
        <div className="container">
          {/* Breadcrumb */}
          <Link href="/contests" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            ← Back to Lobby
          </Link>

          {/* Score Bug — suppressHydrationWarning because minute/score are initialised from
              localStorage (persistedIsLive) which is unavailable on the server */}
          {(() => {
            const isPreMatch = appMode === 'live' && minutesToKickoff !== null && minutesToKickoff > 0;
            const fixtureStatus = wcFixture ? getFixtureStatus(wcFixture) : 'live';
            const isFinished = fixtureStatus === 'finished' && score.home === 0 && score.away === 0 && events.length === 0;
            return (
              <div className="score-bug" style={{ marginBottom: 24 }} suppressHydrationWarning>
                <div className="score-bug__team">
                  <span className="score-bug__flag">{fixture.homeFlag}</span>
                  <span className="score-bug__name">{fixture.homeTeam}</span>
                </div>
                <div className="score-bug__score-container">
                  {isPreMatch ? (
                    <>
                      <div style={{ fontSize: '0.75rem', color: '#ffd700', fontWeight: 700, letterSpacing: 1 }}>
                        KICK OFF IN
                      </div>
                      <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '2rem', lineHeight: 1, color: '#fff' }}>
                        {minutesToKickoff < 60
                          ? `${minutesToKickoff} MIN`
                          : `${Math.floor(minutesToKickoff / 60)}h ${minutesToKickoff % 60}m`}
                      </div>
                      <span style={{
                        fontSize: '0.6rem', padding: '2px 6px', borderRadius: 4, fontWeight: 700,
                        background: 'rgba(255,193,7,0.15)', color: '#ffc107', border: '1px solid #ffc10744',
                      }}>
                        PRE-MATCH
                      </span>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="score-bug__score" suppressHydrationWarning>{score.home}</span>
                        <span className="score-bug__separator">—</span>
                        <span className="score-bug__score" suppressHydrationWarning>{score.away}</span>
                      </div>
                      <div className="score-bug__minute" suppressHydrationWarning>
                        {appMode !== 'live'
                          ? (minute < 90 ? `${minute}'` : 'FT')
                          : txlineStatus === 'live'
                            ? (minute > 0 ? `${minute}'` : liveClockMinute > 0 ? `~${liveClockMinute}'` : `0'`)
                            : (isFinished ? 'FT' : '—')}
                      </div>
                      {appMode === 'live' ? (
                        <span
                          className={txlineStatus === 'live' ? 'badge badge--live' : undefined}
                          style={txlineStatus !== 'live' ? {
                            fontSize: '0.65rem', padding: '2px 8px', borderRadius: 4, fontWeight: 700,
                            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)',
                            border: '1px solid rgba(255,255,255,0.1)',
                          } : { fontSize: '0.65rem' }}
                        >
                          {txlineStatus === 'live' ? (
                            <><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} /> LIVE</>
                          ) : txlineStatus === 'connecting' ? 'CONNECTING…' : 'WAITING'}
                        </span>
                      ) : (
                        <span className="badge badge--live" style={{ fontSize: '0.65rem' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                          LIVE
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="score-bug__team">
                  <span className="score-bug__flag">{fixture.awayFlag}</span>
                  <span className="score-bug__name">{fixture.awayTeam}</span>
                </div>
              </div>
            );
          })()}

          {/* Controls — demo mode only */}
          {appMode !== 'live' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className={`btn btn--sm ${isPlaying ? 'btn--danger' : 'btn--primary'}`}
                onClick={() => setIsPlaying(!isPlaying)}
                id="toggle-simulation-btn"
              >
                {isPlaying ? '⏸ Pause' : '▶ Resume'}
              </button>
              <button
                className={`btn btn--sm ${isFastForward ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setIsFastForward(!isFastForward)}
              >
                {isFastForward ? '⏩ Fast Forward On' : '⏩ Fast Forward Off'}
              </button>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setEvents(initialState.initialEvents);
                  setScore({ home: initialState.homeScore, away: initialState.awayScore });
                  setMinute(initialState.initialMin);
                  setCurrentEventIdx(initialState.initialIdx);
                  setIsPlaying(true);
                  setVerificationStatus('pending');
                  const triggered = new Set<string>();
                  initialState.initialEvents.forEach(e => triggered.add(e.id));
                  triggeredEventsRef.current = triggered;
                }}
                id="reset-simulation-btn"
              >
                ↺ Reset
              </button>
            </div>
          )}
          {appMode === 'live' && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 16px', borderRadius: 20,
                background: 'rgba(0,229,255,0.07)',
                border: '1px solid rgba(0,229,255,0.25)',
                fontSize: '0.72rem', fontWeight: 700, color: '#00e5ff', letterSpacing: '0.06em',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 6px #00e5ff', animation: 'pulse 1.5s infinite' }} />
                LIVE — Real-time TxLINE data
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid-sidebar">
            {/* LEFT: Events Timeline + User Stats */}
            <div>
              {/* User Fantasy Stats */}
              <div className="card card--primary" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 'var(--live-stats-gap)', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                      Fantasy Points
                    </div>
                    <div suppressHydrationWarning style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '3rem', color: 'var(--color-primary)', lineHeight: 1 }}>
                      {userPoints.toFixed(1)}
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', gap: 16 }}>
                    <div>
                      <div suppressHydrationWarning style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.8rem', color: 'var(--text-primary)' }}>
                        #{userRank}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rank</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.8rem', color: '#ffd700' }}>
                        3.0
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Estimated SOL</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* ── Spectator banner (no lineup) ── */}
              {!userLineup && (
                <div className="card" style={{ marginBottom: 20, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.18)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.2rem' }}>👁</span>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#00e5ff', letterSpacing: '0.04em' }}>SPECTATOR MODE</div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Watching without a lineup — no fantasy points tracked.</div>
                    </div>
                  </div>
                  <Link
                    href={`/lineup/${fixture.fixtureId}`}
                    className="btn btn--primary btn--sm"
                    style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}
                  >
                    Join & Build Lineup →
                  </Link>
                </div>
              )}

              {/* ── My Lineup — 5-card horizontal row with live pts + history ── */}
              {userLineup && userLineup.players?.filter(Boolean).length > 0 && (() => {
                const players = (userLineup.players as any[]).filter(Boolean);
                return (
                  <div className="card" style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14, color: '#ffd700', display: 'flex', alignItems: 'center', gap: 8 }}>
                      My Lineup
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>real-time pts</span>
                    </h3>
                    <div className="live-lineup-row">
                      {players.map((p: any) => {
                        const pts = playerPoints[p.id] ?? 0;
                        const hist = playerHistory[p.id] ?? [];
                        const isCap = userLineup.captain === p.id;
                        const stars = userLineup.confidence?.[p.id] ?? 3;
                        const ptColor = pts > 0 ? '#4ade80' : pts < 0 ? '#f87171' : 'rgba(255,255,255,0.3)';
                        const nameFs = `calc(${p.name.length > 15 ? '0.46rem' : p.name.length > 10 ? '0.52rem' : '0.6rem'} * var(--live-card-scale))`;
                        const equippedCard = equippedCardDefsRef.current[p.id] ?? null;
                        const cardRarityColor = equippedCard ? RARITY_COLOR[equippedCard.rarity] : null;
                        const cardRarityStars = equippedCard ? RARITY_STARS[equippedCard.rarity] : null;
                        return (
                          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, width: 'var(--live-card-w)', paddingTop: isCap ? 'calc(20px * var(--live-card-scale))' : 0 }}>
                            {/* Player Card (2).svg — same design as lineup builder */}
                            <div style={{
                              width: 'var(--live-card-w)', height: 'var(--live-card-h)', flexShrink: 0, position: 'relative',
                              backgroundImage: "url('/Player%20Card%20(2).svg')",
                              backgroundSize: '100% 100%', overflow: 'visible',
                              boxShadow: isCap
                                ? '0 0 14px rgba(255,215,0,0.55)'
                                : pts !== 0 ? `0 0 8px ${ptColor}44` : '2px 2px 6px rgba(0,0,0,0.4)',
                            }}>
                              {/* Rating */}
                              <div style={{
                                position: 'absolute', top: '22.5%', right: '10.5%', width: '18%',
                                textAlign: 'center', color: (p.rating ?? 0) >= 90 ? '#ca8a04' : (p.rating ?? 0) >= 85 ? '#15803d' : '#1e293b',
                                fontFamily: 'Inter, sans-serif', fontSize: 'calc(var(--live-card-w) * 0.11)',
                                fontWeight: 800, lineHeight: 1, zIndex: 2,
                              }}>
                                {p.rating ?? '-'}
                              </div>
                              {/* Name */}
                              <div style={{
                                position: 'absolute', top: '67.2%', left: '38%', width: '52%',
                                color: '#36220f', fontSize: nameFs, fontWeight: 700,
                                fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                                overflow: 'hidden', textOverflow: 'ellipsis', zIndex: 2,
                              }}>
                                {p.name}
                              </div>
                              {/* Team flag + name */}
                              <div style={{
                                position: 'absolute', top: '75.5%', left: '38%', width: '52%',
                                color: '#36220f', fontSize: 'calc(0.48rem * var(--live-card-scale))', fontWeight: 700,
                                fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center',
                                gap: 3, whiteSpace: 'nowrap', overflow: 'hidden', zIndex: 2,
                              }}>
                                <span>{p.teamFlag}</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.team}</span>
                              </div>
                              {/* Position badge */}
                              <div style={{
                                position: 'absolute', top: '85.5%', left: '42%', zIndex: 2,
                                background: p.position === 'GK' ? '#1565c0' : p.position === 'DEF' ? '#2e7d32' : p.position === 'MID' ? '#e65100' : '#6a1b9a',
                                color: '#fff', border: '1px solid #36220f', borderRadius: 0,
                                padding: '1px 3px', fontSize: 'calc(0.42rem * var(--live-card-scale))', fontWeight: 900,
                                fontFamily: 'Inter, sans-serif', textTransform: 'uppercase',
                              }}>
                                {p.position}
                              </div>
                              {/* Captain badge — sits above the card using negative top; paddingTop on wrapper gives clearance */}
                              {isCap && (
                                <div style={{
                                  position: 'absolute', top: 'calc(-20px * var(--live-card-scale))', left: '50%', transform: 'translateX(-50%)',
                                  background: 'linear-gradient(to bottom, #d32f2f, #8b1e1e)',
                                  border: '2px solid #fff', padding: '2px 6px', whiteSpace: 'nowrap',
                                  fontWeight: 800, fontFamily: 'Inter, sans-serif',
                                  fontSize: 'calc(0.55rem * var(--live-card-scale))', color: '#fff', letterSpacing: '0.04em',
                                  boxShadow: '0 0 0 1px #000, 1px 2px 4px rgba(0,0,0,0.5)', zIndex: 10,
                                }}>⭐ CAPTAIN</div>
                              )}
                            </div>
                            {/* Confidence stars — outside the card SVG so they're always visible */}
                            <div style={{ textAlign: 'center', fontSize: 'calc(0.65rem * var(--live-card-scale))', letterSpacing: 1, lineHeight: 1 }}>
                              <span style={{ color: '#ffd700' }}>{'★'.repeat(stars)}</span>
                              <span style={{ color: 'rgba(255,255,255,0.2)' }}>{'★'.repeat(5 - stars)}</span>
                            </div>

                            {/* Equipped skill card indicator */}
                            {equippedCard && cardRarityColor && cardRarityStars && (
                              <div style={{
                                width: '100%', textAlign: 'center',
                                fontSize: 'calc(0.4rem * var(--live-card-scale))', lineHeight: 1.3,
                              }}>
                                <span style={{ color: cardRarityColor, fontWeight: 800, letterSpacing: '0.03em' }}>
                                  {cardRarityStars}
                                </span>
                                <span style={{ display: 'block', color: cardRarityColor, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {equippedCard.name}
                                </span>
                              </div>
                            )}

                            {/* Live total pts */}
                            <div style={{ textAlign: 'center', lineHeight: 1 }}>
                              <div style={{
                                fontFamily: 'Bebas Neue, cursive', fontSize: 'calc(1.35rem * var(--live-card-scale))',
                                color: ptColor, textShadow: pts !== 0 ? `0 0 6px ${ptColor}88` : 'none',
                              }}>
                                {pts > 0 ? `+${pts.toFixed(1)}` : pts === 0 ? '0' : pts.toFixed(1)}
                              </div>
                              <div style={{ fontSize: 'calc(0.45rem * var(--live-card-scale))', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>PTS</div>
                            </div>

                            {/* Point history log */}
                            {hist.length > 0 && (
                              <div style={{
                                width: '100%', display: 'flex', flexDirection: 'column', gap: 2,
                                maxHeight: 90, overflowY: 'auto',
                              }}>
                                {hist.map((h, i) => (
                                  <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '1px 4px',
                                    background: h.pts > 0 ? 'rgba(74,222,128,0.07)' : h.pts < 0 ? 'rgba(248,113,113,0.07)' : 'transparent',
                                    borderRadius: 3,
                                  }}>
                                    <span style={{ fontSize: 'calc(0.42rem * var(--live-card-scale))', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                                      {h.label}
                                    </span>
                                    <span style={{ fontSize: 'calc(0.44rem * var(--live-card-scale))', fontWeight: 700, flexShrink: 0, color: h.pts > 0 ? '#4ade80' : h.pts < 0 ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
                                      {h.pts > 0 ? `+${h.pts.toFixed(1)}` : h.pts.toFixed(1)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Match Events Timeline */}
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: '#ffd700', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Match Events
                  {appMode === 'live' ? (
                    <span
                      className={txlineStatus === 'live' ? 'badge badge--live' : undefined}
                      style={{
                        fontSize: '0.6rem',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontWeight: 700,
                        background: txlineStatus === 'live' ? undefined : txlineStatus === 'connecting' ? 'rgba(255,193,7,0.2)' : 'rgba(255,255,255,0.08)',
                        color: txlineStatus === 'live' ? undefined : txlineStatus === 'connecting' ? '#ffc107' : 'rgba(255,255,255,0.4)',
                        border: txlineStatus === 'live' ? undefined : `1px solid ${txlineStatus === 'connecting' ? '#ffc10744' : 'rgba(255,255,255,0.12)'}`,
                      }}
                    >
                      {txlineStatus === 'live' ? 'LIVE' : txlineStatus === 'connecting' ? 'CONNECTING…' : 'WAITING'}
                    </span>
                  ) : (
                    <span className="badge badge--live" style={{ fontSize: '0.6rem' }}>DEMO</span>
                  )}
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 400, marginLeft: 'auto' }}
                    title="Points shown are base values for that event type. Your actual pts include captain 2× and confidence multiplier — see the lineup panel above.">
                    ⓘ base pts
                  </span>
                </h3>

                {events.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {appMode === 'live' && minutesToKickoff !== null && minutesToKickoff > 0 ? (
                      <>
                        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏟️</div>
                        <div style={{ fontWeight: 700, color: '#ffd700', marginBottom: 4 }}>
                          {fixture.homeTeam} vs {fixture.awayTeam}
                        </div>
                        <div>
                          Match kicks off in {minutesToKickoff < 60
                            ? `${minutesToKickoff} minute${minutesToKickoff !== 1 ? 's' : ''}`
                            : `${Math.floor(minutesToKickoff / 60)}h ${minutesToKickoff % 60}m`}
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: 8, color: 'rgba(255,255,255,0.25)' }}>
                          Events will appear here as the match unfolds
                        </div>
                      </>
                    ) : appMode === 'live' && txlineStatus === 'live' ? (
                      <>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚽</div>
                        <div style={{ fontWeight: 700, color: '#ffd700', marginBottom: 4 }}>Match in progress</div>
                        <div>Connected to TxLINE — waiting for first notable event</div>
                        <div style={{ fontSize: '0.75rem', marginTop: 4, color: 'rgba(255,255,255,0.25)' }}>
                          Goals, cards and key plays will appear here instantly
                        </div>
                      </>
                    ) : appMode === 'live' && txlineStatus === 'waiting' ? (
                      <>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📡</div>
                        <div>Waiting for live data — checking TxLINE every 10s</div>
                        <div style={{ fontSize: '0.75rem', marginTop: 4, color: 'rgba(255,255,255,0.25)' }}>
                          Score updates via ESPN are shown above while we wait
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>⏰</div>
                        <div>Waiting for match events...</div>
                      </>
                    )}
                  </div>
                )}

                <div ref={eventRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                  {events.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        padding: '12px 14px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: `3px solid ${EVENT_COLORS[event.type] ?? 'var(--border-medium)'}`,
                        animation: 'score-pop 300ms ease',
                      }}
                    >
                      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{EVENT_ICONS[event.type]}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                            {event.player || (event.type === 'kick_off' ? 'KICK OFF' : event.type === 'half_time' ? 'HALF TIME' : 'FULL TIME')}
                          </span>
                          <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            {event.minute}&apos;
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {event.team ? `${event.teamFlag} ${event.team}` : event.description}
                        </div>
                      </div>
                      <div style={{
                        fontFamily: 'Bebas Neue, cursive',
                        fontSize: '1.1rem',
                        color: event.points >= 0 ? 'var(--color-primary)' : 'var(--color-danger)',
                        flexShrink: 0,
                      }}>
                        {event.points !== 0 ? `${event.points >= 0 ? '+' : ''}${event.points}` : '0'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic Result Verification Panel */}
              <div className="card" style={{ 
                marginBottom: 20,
              }}>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#ffd700' }}>
                    TxLINE Cryptographic Verification
                  </h3>
                  <span className={`badge`} style={{
                    background: verificationStatus === 'success' ? 'rgba(0, 232, 122, 0.15)' : (verificationStatus === 'verifying' ? 'rgba(255, 165, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)'),
                    color: verificationStatus === 'success' ? '#00e87a' : (verificationStatus === 'verifying' ? 'orange' : 'var(--text-muted)'),
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 0,
                  }}>
                    {verificationStatus === 'success' ? '✅ VERIFIED' : (verificationStatus === 'verifying' ? '⚡ VERIFYING...' : '⏳ PENDING')}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                  Cryptographically verifies that match events and scores match the TxLINE oracle stream recorded on Solana.
                </p>

                <div style={{ 
                  background: 'var(--bg-elevated)', 
                  padding: 12, 
                  borderRadius: 0, 
                  fontSize: '0.75rem', 
                  fontFamily: 'monospace',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  color: 'var(--text-muted)',
                  marginBottom: 16,
                  border: '1.5px solid #ffffff',
                  boxShadow: '0 0 0 1px #000000'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Oracle Stream:</span>
                    <span style={{ color: 'var(--text-primary)' }}>txline-soccer-feed-v2</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Merkle Root:</span>
                    <span style={{ color: verificationStatus === 'success' ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                      {verificationStatus === 'success' ? '0x8f3d...9c2e (MATCHED)' : '0x8f3d...9c2e'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Solana State Anchor:</span>
                    <span style={{ color: 'var(--color-accent)' }}>4u7Gz...h2Pw3L (Slot #289,102)</span>
                  </div>
                  {verificationStatus === 'success' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 6, marginTop: 4 }}>
                        <span>Verification Hash:</span>
                        <span style={{ color: 'var(--color-primary)' }}>0x9e8a7b6c5d4e3f2a</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Merkle Proof:</span>
                        <span style={{ color: 'var(--color-primary)' }}>Validated (3 Leaves)</span>
                      </div>
                    </>
                  )}
                </div>

                {verificationStatus === 'verifying' ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 12,
                    padding: '12px',
                    background: 'rgba(123, 162, 199, 0.1)',
                    borderRadius: 0,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)'
                  }}>
                    <span style={{ 
                      width: 16, 
                      height: 16, 
                      border: '2px solid var(--text-muted)', 
                      borderTopColor: 'var(--color-primary)', 
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Generating Merkle Proof and verifying Solana Anchor...
                  </div>
                ) : (
                  <button
                    className={`btn btn--full ${verificationStatus === 'success' ? 'btn--ghost' : 'btn--primary'}`}
                    onClick={handleVerify}
                    disabled={minute < 90 && verificationStatus !== 'success'}
                    style={{
                      padding: '10px 16px',
                      fontSize: '0.85rem',
                      opacity: minute >= 90 || verificationStatus === 'success' ? 1 : 0.6,
                      cursor: minute >= 90 || verificationStatus === 'success' ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {verificationStatus === 'success' 
                      ? '✓ Verified' 
                      : (minute >= 90 ? 'Run Verification' : 'Wait for Full Time')}
                  </button>
                )}
              </div>

              {/* Point Reference */}
              <div className="card" style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Fantasy Points Reference
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {Object.entries(POINT_MAP).map(([event, pts]) => (
                    <div key={event} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '4px 8px', background: 'var(--bg-elevated)', borderRadius: 6 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{event.replace(/_/g, ' ')}</span>
                      <span style={{ fontWeight: 700, color: pts >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                        {pts >= 0 ? '+' : ''}{pts}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Leaderboard */}
            <div>
              <div className="ro-window" style={{ position: 'sticky', top: 80 }}>
                <div className="ro-window__header" style={{ background: 'linear-gradient(to right, #b45309 0%, #78350f 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🏆 Live Leaderboard</span>
                  <span className="badge badge--live" style={{ fontSize: '0.6rem' }}>Live</span>
                </div>
                <div className="ro-window__body" style={{ padding: 16, maxHeight: '420px', overflowY: 'auto' }}>
                  <table className="leaderboard" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'center' }}>#</th>
                        <th>Player</th>
                        <th style={{ textAlign: 'right' }}>Pts</th>
                        <th style={{ textAlign: 'right' }}>Prize</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry) => (
                        <tr
                          key={entry.wallet}
                          style={{
                            background: entry.isUser ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                            transition: 'all 300ms',
                          }}
                        >
                          <td className="leaderboard__rank" style={{ textAlign: 'center' }}>
                            <span className={`leaderboard__rank--${entry.rank}`}>
                              {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                            </span>
                          </td>
                          <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img 
                              src={(entry as any).avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.wallet}`} 
                              alt="avatar" 
                              style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-surface)' }} 
                            />
                            <div>
                              <div style={{ fontWeight: entry.isUser ? 700 : 500, fontSize: '0.85rem', color: entry.isUser ? '#00e5ff' : 'var(--text-primary)' }}>
                                {entry.username}
                                {entry.isUser && <span style={{ fontSize: '0.65rem', color: '#00e5ff', marginLeft: 4 }}>YOU</span>}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                {entry.wallet}
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="leaderboard__points" style={{ color: entry.isUser ? '#00e5ff' : 'var(--text-primary)' }}>{entry.points.toFixed(1)}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '0.8rem', color: entry.prize !== '-' ? '#ffd700' : 'var(--text-muted)', fontWeight: 600 }}>
                            {entry.prize}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Prize pool breakdown */}
                  <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      Prize Pool: 10.0 SOL
                    </div>
                    {(() => {
                      let breakdown = [];
                      if (contestType === '5050') {
                        breakdown = [
                          { place: 'Top 50%', prize: '0.18 SOL (each)', pct: '90%', color: '#10b981' }
                        ];
                      } else if (contestType === 'wta') {
                        breakdown = [
                          { place: '1st', prize: '10.0 SOL', pct: '100%', color: '#FFD700' }
                        ];
                      } else {
                        breakdown = [
                          { place: '1st', prize: '5.0 SOL', pct: '50%', color: '#FFD700' },
                          { place: '2nd', prize: '3.0 SOL', pct: '30%', color: '#C0C0C0' },
                          { place: '3rd', prize: '2.0 SOL', pct: '20%', color: '#CD7F32' },
                        ];
                      }
                      return breakdown.map((p) => (
                        <div key={p.place} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.8rem', color: p.color, fontWeight: 700, width: 50 }}>{p.place}</span>
                          <div style={{ flex: 1, height: 4, background: 'var(--bg-glass)', borderRadius: 999, margin: '0 10px', overflow: 'hidden' }}>
                            <div style={{ width: p.pct, height: '100%', background: p.color, borderRadius: 999 }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>{p.prize}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
