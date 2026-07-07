// OddsDraft — Shared TypeScript Types

export interface User {
  id: string;
  walletAddress: string;
  username?: string;
  avatarUrl?: string;
  totalWins: number;
  totalContests: number;
  totalEarnedSol: number;
  createdAt: string;
}

export interface Contest {
  id: string;
  fixtureId: string;
  matchName: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  kickoffAt: string;
  lineupLockAt: string;
  entryFeeSol: number;
  prizePoolSol: number;
  participantCount: number;
  status: 'upcoming' | 'lineup_open' | 'locked' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
  txoddsData?: Record<string, unknown>;
  createdAt: string;
}

export interface LineupPlayer {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'ATT' | 'SWG';
  team: string;
  teamFlag: string;
  photoUrl?: string;
  rating?: number;
}

export interface Lineup {
  id: string;
  userId: string;
  contestId: string;
  players: LineupPlayer[];
  captainPlayerId: string;
  confidence: Record<string, number>; // playerId -> stars (1-5)
  totalPoints: number;
  rank?: number;
  lockedAt?: string;
  entryTx?: string;
  prizeClaimed: boolean;
  prizeSol: number;
  createdAt: string;
}

export interface ScoreEvent {
  id: string;
  contestId: string;
  fixtureId: string;
  playerId?: string;
  playerName?: string;
  team?: string;
  eventType: string;
  points: number;
  minute?: number;
  period?: string;
  rawEvent?: Record<string, unknown>;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: string;
  contestId: string;
  lineupId: string;
  userId: string;
  username?: string;
  walletAddress: string;
  totalPoints: number;
  rank: number;
  prizeSol: number;
  prizeClaimed: boolean;
  updatedAt: string;
}

export interface PlayerRecommendation {
  captainPick: LineupPlayer & { reason: string };
  safePick: LineupPlayer & { reason: string };
  highRiskPick: LineupPlayer & { reason: string };
  undervalued: LineupPlayer & { reason: string };
}

export type Position = 'GK' | 'DEF' | 'MID' | 'ATT' | 'SWG';
export type ContestStatus = 'upcoming' | 'lineup_open' | 'locked' | 'live' | 'finished';

// Game rules
export const MAX_PLAYERS = 5;

export const POSITION_LABELS: Record<Position, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  ATT: 'Attacker',
  SWG: 'Swinger',
};
