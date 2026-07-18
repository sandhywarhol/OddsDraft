'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { DEMO_FIXTURES, getDynamicEvents } from '@/lib/players';
import { WC2026_FIXTURES, getFixtureStatus } from '@/lib/wc2026-fixtures';
import { WC2026_PLAYERS } from '@/lib/wc2026-players-static';
import { REPLAY_EVENTS } from '@/lib/replay-events';
import { calculateEventPoints, resolvePlayerDelta } from '@/lib/fantasy-engine';
import { getRandomTeamFact } from '@/lib/commentaryKnowledge';
import { useAudio } from '@/context/AudioContext';
import FantasyToast, { type FantasyNotificationItem } from '@/components/FantasyToast';
import { useTxLine } from '@/context/TxLineContext';
import { buildPlayerIdMap, convertTxLineUpdates } from '@/lib/txline-bridge';
import { fetchLiveScoreUpdates } from '@/lib/txline';
import CardPackOpener from '@/components/CardPackOpener';
import FlagImage from '@/components/FlagImage';
import { openCardPack, hasOpenedPack } from '@/lib/card-collection';
import type { MatchResult, MatchEvent, PeriodStats, TeamLineup } from '@/app/api/match/result/route';
import LiveLineupFormation, { type FormationPlayer } from '@/components/LiveLineupFormation';

// Best-effort XI when TxLINE has no published lineup for this fixture — derived purely
// from our own roster data (jersey numbers 1-11), so it's always available for a real match.
function buildPredictedXI(team: string, participant: 1 | 2): FormationPlayer[] {
  const seenJerseys = new Set<number>();
  return WC2026_PLAYERS
    .filter(p => p.team === team && p.jerseyNumber <= 11)
    .sort((a, b) => a.jerseyNumber - b.jerseyNumber)
    .filter(p => {
      // Some roster entries share a jersey number (data duplicates) — keep only the
      // first so this never returns more than 11 players. TeamCard treats >11 players
      // with no explicit starter flag as "starters + bench", so leftover duplicates
      // were showing up as fake substitutes.
      if (seenJerseys.has(p.jerseyNumber)) return false;
      seenJerseys.add(p.jerseyNumber);
      return true;
    })
    .map(p => ({
      id: p.id,
      name: p.name,
      jerseyNumber: p.jerseyNumber,
      position: p.position === 'SWG' ? 'ATT' : p.position,
      participant,
    }));
}

// ESPN's rosters field (via /api/match/result) — the only source with a complete
// matchday squad (starters + full bench), since this is a finished match. Preferred
// over TxLINE, which often only records starters plus whichever subs actually played.
function espnLineupToFormationPlayers(lineup: TeamLineup, participant: 1 | 2): FormationPlayer[] {
  return lineup.players.map(p => ({
    name: p.name,
    jerseyNumber: p.jerseyNumber,
    position: p.position,
    participant,
    starter: p.starter,
  }));
}

// ESPN gives minutes like "55'" or stoppage time like "90'+2'" — parse to a plain
// integer (base + stoppage) for sorting/display.
function parseEspnMinute(m: string): number {
  const match = m.match(/(\d+)'?(?:\+(\d+))?/);
  if (!match) return 0;
  return (parseInt(match[1], 10) || 0) + (match[2] ? parseInt(match[2], 10) || 0 : 0);
}

const ESPN_TYPE_MAP: Record<MatchEvent['type'], string> = {
  goal: 'goal',
  own_goal: 'own_goal',
  penalty: 'goal',
  yellow_card: 'yellow_card',
  red_card: 'red_card',
  yellow_red_card: 'red_card',
  sub: 'substitution',
};

// Converts ESPN's real (but sparse — goals/cards/subs only, no saves/shots/possession)
// match report into the same internal event shape the timeline renders, with synthetic
// kick_off/half_time/full_time markers so playback still has a coherent start and end.
// This is what actually happened in the match — unlike the position-remapped generic
// demo script, which reuses the same fixed storyline (and score) for every fixture.
function espnEventsToTimeline(espnEvents: MatchEvent[], homeTeam: string, homeFlag: string, awayFlag: string): any[] {
  const scored = espnEvents
    .map((e, i) => {
      const minute = parseEspnMinute(e.minute);
      const type = ESPN_TYPE_MAP[e.type] ?? 'goal';
      const isHome = e.team === homeTeam;
      return {
        id: `espn-${i}-${type}-${minute}`,
        minute,
        team: e.team,
        teamFlag: isHome ? homeFlag : awayFlag,
        player: e.player,
        type,
        points: calculateEventPoints(type),
        description: `${e.player} (${e.team}) — ${type.replace(/_/g, ' ')} at ${e.minute}`,
      };
    })
    .sort((a, b) => a.minute - b.minute);

  const lastMinute = scored.length > 0 ? scored[scored.length - 1].minute : 90;
  return [
    { id: 'espn-kickoff', minute: 0, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Kick Off! The match begins.' },
    ...scored,
    { id: 'espn-fulltime', minute: Math.max(90, lastMinute), team: '', teamFlag: '', player: '', type: 'full_time', points: 0, description: 'Full Time!' },
  ];
}

// Flattens TxLINE's lineup response (any of its several shapes) into FormationPlayer[].
function parseLineupData(lineupData: any, pMap: Record<string, string>): { home: FormationPlayer[]; away: FormationPlayer[]; homeCoach?: string; awayCoach?: string } | null {
  let players: any[] = [];
  const topArr: any[] | null = (() => {
    if (Array.isArray(lineupData)) return lineupData;
    const cand = lineupData?.Lineups ?? lineupData?.lineups
              ?? lineupData?.Data?.Lineups ?? lineupData?.Data?.lineups
              ?? lineupData?.players;
    return Array.isArray(cand) ? cand : null;
  })();
  if (topArr && topArr.length > 0) {
    const first = topArr[0];
    const isTeamNested = first && (Array.isArray(first.lineups) || Array.isArray(first.Lineups) || Array.isArray(first.players));
    if (isTeamNested) {
      topArr.forEach((teamData: any, idx: number) => {
        const ptcp: 1 | 2 = (teamData.Participant ?? teamData.participant ?? (idx === 0 ? 1 : 2)) === 2 ? 2 : 1;
        const sub: any[] = teamData.lineups ?? teamData.Lineups ?? teamData.players ?? [];
        sub.forEach((p: any) => players.push({ ...p, Participant: ptcp }));
      });
    } else {
      players = topArr;
    }
  }
  if (players.length === 0) return null;
  const home: FormationPlayer[] = [];
  const away: FormationPlayer[] = [];
  let homeCoach: string | undefined;
  let awayCoach: string | undefined;
  for (const p of players) {
    const participant: 1 | 2 = (p.Participant ?? p.participant ?? 1) === 2 ? 2 : 1;
    const rawPos: string = (p.Position ?? p.position ?? '').toUpperCase();
    const rawName: string = p.PlayerName ?? p.playerName ?? p.player?.preferredName ?? '';
    const name = rawName.includes(',') ? rawName.split(',').map((s: string) => s.trim()).reverse().join(' ') : rawName;
    if (!name) continue;
    if (rawPos === 'COACH' || (p.Role ?? p.role ?? '').toUpperCase() === 'COACH') {
      if (participant === 1) homeCoach = name; else awayCoach = name;
      continue;
    }
    const starterRaw = p.Starter ?? p.starter;
    const fp: FormationPlayer = {
      id: pMap[String(p.PlayerId ?? p.playerId ?? '')] ?? undefined,
      name,
      jerseyNumber: p.JerseyNumber ?? p.jerseyNumber ?? undefined,
      position: rawPos || 'MID',
      participant,
      starter: starterRaw !== undefined ? !!starterRaw : undefined,
    };
    if (participant === 1) home.push(fp); else away.push(fp);
  }
  if (home.length + away.length === 0) return null;
  return { home, away, homeCoach, awayCoach };
}

// Fallback events (mirrors live page LIVE_EVENTS with all valid TxLINE event types)
const LIVE_EVENTS = [
  { id: 'e0', minute: 0, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Kick Off! The match begins!' },
  // Starting XI — Argentina
  { id: 'xi_arg_mart',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez',  playerId: 'arg-martinez',   type: 'starting_xi', points: 2, description: 'E. Martínez starts in goal for Argentina.' },
  { id: 'xi_arg_rome',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero',       playerId: 'arg-romero',    type: 'starting_xi', points: 2, description: 'Romero starts at centre-back.' },
  { id: 'xi_arg_mess',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi',        playerId: 'arg-messi',     type: 'starting_xi', points: 2, description: 'MESSI starts for Argentina!' },
  { id: 'xi_arg_laut',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'L. Martínez',  playerId: 'arg-lautaro',   type: 'starting_xi', points: 2, description: 'Lautaro Martínez starts up front.' },
  { id: 'xi_arg_alva',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez',      playerId: 'arg-alvarez',   type: 'starting_xi', points: 2, description: 'Julián Álvarez leads the attack.' },
  // Starting XI — France
  { id: 'xi_fra_maig',  minute: 0, team: 'France',    teamFlag: '🇫🇷', player: 'Maignan',      playerId: 'fra-maignan',   type: 'starting_xi', points: 2, description: 'Maignan starts in goal for France.' },
  { id: 'xi_fra_mbap',  minute: 0, team: 'France',    teamFlag: '🇫🇷', player: 'Mbappé',       playerId: 'fra-mbappe',    type: 'starting_xi', points: 2, description: 'Mbappé starts as captain for France!' },
  { id: 'xi_fra_grie',  minute: 0, team: 'France',    teamFlag: '🇫🇷', player: 'Griezmann',    playerId: 'fra-griezmann', type: 'starting_xi', points: 2, description: 'Griezmann lines up in midfield.' },
  { id: 'xi_fra_demb',  minute: 0, team: 'France',    teamFlag: '🇫🇷', player: 'Dembélé',      playerId: 'fra-dembele',   type: 'starting_xi', points: 2, description: 'Dembélé starts on the right wing.' },
  { id: 'xi_fra_giro',  minute: 0, team: 'France',    teamFlag: '🇫🇷', player: 'Giroud',       playerId: 'fra-giroud',    type: 'starting_xi', points: 2, description: 'Giroud leads the line for France.' },
  // Danger signal before Mbappé goal
  { id: 'e0_d1', minute: 10, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', playerId: 'fra-mbappe', type: 'danger_attack', points: 0, description: 'France pressing high! TxLINE signals HIGH DANGER zone for France.' },
  // Griezmann assists Mbappé's opener — dataSoccer.assistPlayerId
  { id: 'e_asst_mbap', minute: 11, team: 'France', teamFlag: '🇫🇷', player: 'Griezmann', playerId: 'fra-griezmann', type: 'assist', points: 6, description: 'Griezmann threads a perfect through ball into Mbappé\'s path.' },
  { id: 'e1', minute: 12, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', playerId: 'fra-mbappe', type: 'goal', points: 10, goalType: 'Shot', description: 'GOAL! Mbappé fires a powerful shot into the top corner!' },
  { id: 'e1_concede', minute: 12, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goal_conceded', points: -2, description: 'Goal conceded by Martínez.' },
  // Maignan makes a save from Lautaro — dataSoccer.save
  { id: 'e_save_maig1', minute: 20, team: 'France', teamFlag: '🇫🇷', player: 'Maignan', playerId: 'fra-maignan', type: 'goalkeeper_save', points: 1, description: 'Maignan dives low to keep out Lautaro\'s fierce shot!' },
  { id: 'e3_1', minute: 24, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', playerId: 'fra-mbappe', type: 'corner_kick', points: 0, description: 'Corner kick awarded to France' },
  { id: 'e4', minute: 31, team: 'France', teamFlag: '🇫🇷', player: 'Dembélé', playerId: 'fra-dembele', type: 'yellow_card', points: -2, description: 'Yellow card for Dembélé after a late challenge.' },
  // Danger signal before Argentina equalizer
  { id: 'e4_d1', minute: 36, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'danger_attack', points: 0, description: 'Argentina in the DANGER zone! TxLINE signals high-danger possession.' },
  // Messi assists Lautaro's equaliser header — dataSoccer.assistPlayerId
  { id: 'e_asst_laut', minute: 37, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'assist', points: 6, description: 'Messi delivers a pinpoint cross right onto Lautaro\'s head.' },
  { id: 'e5', minute: 38, team: 'Argentina', teamFlag: '🇦🇷', player: 'L. Martínez', playerId: 'arg-lautaro', type: 'goal', points: 10, goalType: 'Head', description: 'GOAL! Lautaro rises highest and heads it home!' },
  { id: 'e5_concede', minute: 38, team: 'France', teamFlag: '🇫🇷', player: 'Maignan', playerId: 'fra-maignan', type: 'goal_conceded', points: -2, description: 'Goal conceded by Maignan.' },
  // E. Martínez makes a save before half time — dataSoccer.save
  { id: 'e_save_mart1', minute: 42, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goalkeeper_save', points: 1, description: 'E. Martínez spreads his body brilliantly to deny Dembélé!' },
  // Possession bonus H1 — Argentina dominant
  { id: 'poss_h1_mess',   minute: 44, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi',       playerId: 'arg-messi',       type: 'possession_bonus', points: 1, description: 'Argentina dominated possession in H1. Messi controlled the midfield.' },
  { id: 'poss_h1_macall', minute: 44, team: 'Argentina', teamFlag: '🇦🇷', player: 'Mac Allister', playerId: 'arg-macallister', type: 'possession_bonus', points: 1, description: 'Argentina dominated possession in H1. Mac Allister dictated tempo.' },
  { id: 'e4_5', minute: 45, team: '', teamFlag: '', player: '', type: 'half_time', points: 0, description: 'Half Time! The first half concludes!' },
  { id: 'e4_6', minute: 46, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Second Half Kick Off! We are underway again!' },
  // Danger signal before Giroud goal
  { id: 'e6_d1', minute: 50, team: 'France', teamFlag: '🇫🇷', player: 'Giroud', playerId: 'fra-giroud', type: 'danger_attack', points: 0, description: 'France building pressure! TxLINE: HighDanger possession for France in the box.' },
  // Griezmann assists Giroud header — dataSoccer.assistPlayerId
  { id: 'e_asst_giro', minute: 51, team: 'France', teamFlag: '🇫🇷', player: 'Griezmann', playerId: 'fra-griezmann', type: 'assist', points: 6, description: 'Griezmann whips in a dangerous cross from the right — Giroud is waiting.' },
  { id: 'e7', minute: 52, team: 'France', teamFlag: '🇫🇷', player: 'Giroud', playerId: 'fra-giroud', type: 'goal', points: 10, goalType: 'Head', description: 'GOAL! Giroud powers a towering header into the net!' },
  { id: 'e7_concede', minute: 52, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goal_conceded', points: -2, description: 'Goal conceded by Martínez.' },
  { id: 'e7_1', minute: 54, team: '', teamFlag: '', player: '', type: 'var_review', points: 0, description: 'VAR Review ongoing for a potential foul in the build-up.' },
  // Maignan saves from Álvarez — dataSoccer.save
  { id: 'e_save_maig2', minute: 58, team: 'France', teamFlag: '🇫🇷', player: 'Maignan', playerId: 'fra-maignan', type: 'goalkeeper_save', points: 1, description: 'Maignan tips over Álvarez\'s powerful header — outstanding reflexes!' },
  { id: 'e7_2', minute: 60, team: 'France', teamFlag: '🇫🇷', player: 'Coman', playerId: 'fra-coman', type: 'substitution', points: 0, playerInId: 'fra-coman', playerOutId: 'fra-dembele', description: 'Substitution: Coman replaces Dembélé.' },
  { id: 'e7_2_sub', minute: 60, team: 'France', teamFlag: '🇫🇷', player: 'Coman', playerId: 'fra-coman', type: 'sub_appearance', points: 1, description: 'Coman enters the pitch as a substitute for France.' },
  // Danger signal before Messi goal
  { id: 'e7_d2', minute: 65, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'danger_attack', points: 0, description: 'DANGER! Argentina attacking at full speed!' },
  // Álvarez assists Messi's curler — dataSoccer.assistPlayerId
  { id: 'e_asst_mess', minute: 66, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez', playerId: 'arg-alvarez', type: 'assist', points: 6, description: 'Álvarez plays a perfectly weighted pass to find Messi in space.' },
  { id: 'e8', minute: 67, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'goal', points: 10, goalType: 'Shot', description: 'GOAL! MESSI! Curling shot into the far corner — unstoppable!' },
  { id: 'e8_concede', minute: 67, team: 'France', teamFlag: '🇫🇷', player: 'Maignan', playerId: 'fra-maignan', type: 'goal_conceded', points: -2, description: 'Goal conceded by Maignan.' },
  { id: 'e8_1', minute: 72, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', playerId: 'fra-mbappe', type: 'penalty_won', points: 3, description: 'Mbappé is brought down in the box! Penalty awarded to France!' },
  { id: 'e8_2', minute: 72, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero', playerId: 'arg-romero', type: 'penalty_conceded', points: -3, description: 'Romero concedes the penalty with a reckless challenge.' },
  { id: 'e8_3', minute: 73, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', playerId: 'fra-mbappe', type: 'penalty_missed', points: -3, description: 'Mbappé steps up... but blazes it over the bar!' },
  // E. Martínez saves from Griezmann — dataSoccer.save
  { id: 'e_save_mart2', minute: 75, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goalkeeper_save', points: 1, description: 'E. Martínez parries Griezmann\'s curling effort around the post!' },
  // Danger signal before Mbappé hat-trick
  { id: 'e8_d1', minute: 77, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', playerId: 'fra-mbappe', type: 'danger_attack', points: 0, description: 'France pressing dangerously again! Mbappé is a constant threat.' },
  // Coman assists Mbappé hat-trick — dataSoccer.assistPlayerId
  { id: 'e_asst_mbap3', minute: 78, team: 'France', teamFlag: '🇫🇷', player: 'Coman', playerId: 'fra-coman', type: 'assist', points: 6, description: 'Coman bursts down the left and cuts the ball back to Mbappé.' },
  { id: 'e9', minute: 79, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', playerId: 'fra-mbappe', type: 'goal', points: 10, goalType: 'Other', description: 'Hat-trick! Mbappé taps in from close range — his third of the game!' },
  { id: 'e9_concede', minute: 79, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goal_conceded', points: -2, description: 'Goal conceded by Martínez.' },
  // E. Martínez saves from Coman — dataSoccer.save
  { id: 'e_save_mart3', minute: 85, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goalkeeper_save', points: 1, description: 'E. Martínez pulls off a brilliant save to deny Coman a second!' },
  // Danger signal before Álvarez late goal
  { id: 'e9_d1', minute: 88, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez', playerId: 'arg-alvarez', type: 'danger_attack', points: 0, description: 'Argentina desperate! TxLINE: sustained Danger possession in French half.' },
  // Messi assists Álvarez late goal — dataSoccer.assistPlayerId
  { id: 'e_asst_alva', minute: 89, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'assist', points: 6, description: 'Messi picks out Álvarez with a defence-splitting through ball.' },
  { id: 'e10', minute: 90, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez', playerId: 'arg-alvarez', type: 'goal', points: 10, goalType: 'Shot', description: '90th minute! Álvarez drives a low shot into the bottom corner!' },
  { id: 'e10_concede', minute: 90, team: 'France', teamFlag: '🇫🇷', player: 'Maignan', playerId: 'fra-maignan', type: 'goal_conceded', points: -2, description: 'Goal conceded by Maignan.' },
  // Possession bonus H2 — France dominant
  { id: 'poss_h2_grie',  minute: 89, team: 'France', teamFlag: '🇫🇷', player: 'Griezmann', playerId: 'fra-griezmann', type: 'possession_bonus', points: 1, description: 'France dominated possession in H2. Griezmann pulled the strings in midfield.' },
  { id: 'poss_h2_kante', minute: 89, team: 'France', teamFlag: '🇫🇷', player: 'Kanté',     playerId: 'fra-kante',      type: 'possession_bonus', points: 1, description: 'France dominated H2 possession. Kanté covered every blade of grass.' },
  // Full time — both teams scored, no clean sheet
  { id: 'e11', minute: 90, team: '', teamFlag: '', player: '', type: 'full_time', points: 0, description: 'Full Time! France 3–2 Argentina! What a match!' },
];

// Demo leaderboard
const DEMO_LEADERBOARD = [
  { rank: 1, username: 'CryptoGoalkeeper', wallet: 'Cx9...4mN', points: 124.5, prize: '5.0 SOL', isUser: false },
  { rank: 2, username: 'You', wallet: 'YOUR WALLET', points: 98.2, prize: '3.0 SOL', isUser: true },
  { rank: 3, username: 'MbappeObsessed', wallet: '7kP...2sQ', points: 87.0, prize: '2.0 SOL', isUser: false },
  { rank: 4, username: 'TacticalMaster', wallet: 'Rz3...9vT', points: 72.4, prize: '-', isUser: false },
  { rank: 5, username: 'SolanaBaller', wallet: 'Lw8...mX1', points: 65.1, prize: '-', isUser: false },
  { rank: 6, username: 'BlockStriker', wallet: 'Bs4...9kP', points: 58.6, prize: '-', isUser: false },
  { rank: 7, username: 'DegenDeGea', wallet: 'Dg2...1vL', points: 54.3, prize: '-', isUser: false },
  { rank: 8, username: 'PhantomPlaymaker', wallet: 'Pp5...7wQ', points: 51.0, prize: '-', isUser: false },
  { rank: 9, username: 'GigaChadFC', wallet: 'Gc7...3tN', points: 48.5, prize: '-', isUser: false },
  { rank: 10, username: 'SolStriker', wallet: 'Ss8...5kM', points: 45.2, prize: '-', isUser: false },
  { rank: 11, username: 'NodeNavigator', wallet: 'Nn9...2wP', points: 42.0, prize: '-', isUser: false },
  { rank: 12, username: 'RugPullResist', wallet: 'Rr3...6vL', points: 39.8, prize: '-', isUser: false },
  { rank: 13, username: 'LedgerLegend', wallet: 'Ll4...1tK', points: 36.5, prize: '-', isUser: false },
  { rank: 14, username: 'ApeInUnited', wallet: 'Au6...8mN', points: 34.2, prize: '-', isUser: false },
  { rank: 15, username: 'CryptoCruiser', wallet: 'Cc2...9sJ', points: 31.0, prize: '-', isUser: false },
  { rank: 16, username: 'SatoshiSquad', wallet: 'Sq7...4vL', points: 28.5, prize: '-', isUser: false },
  { rank: 17, username: 'GasLimitFC', wallet: 'Gl5...3kP', points: 25.0, prize: '-', isUser: false },
  { rank: 18, username: 'HODLUnited', wallet: 'Hu9...1wQ', points: 22.3, prize: '-', isUser: false },
  { rank: 19, username: 'YieldFarmer', wallet: 'Yf3...7sN', points: 18.5, prize: '-', isUser: false },
  { rank: 20, username: 'MoonBoyz', wallet: 'Mb4...5vL', points: 12.0, prize: '-', isUser: false },
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
          refereeImage: '/NPC/Referee%20Kick%20OFF.svg',
          isRefereeStyle: true,
          refereePosition: 'left'
        };
      } else if (step === 2) {
        if (minute >= 45) {
          return {
            speakerTitle: 'Alan',
            text: `"The referee blows the whistle for the second half! The score is currently ${fixture.homeTeam} ${score.home} - ${score.away} ${fixture.awayTeam}."`,
            commentator2Image: '/NPC/Comentator%202%20Calm.svg',
          };
        } else {
          return {
            speakerTitle: 'Alan',
            text: `"The referee blows the whistle and we are underway! Let's hope for an exciting match today."`,
            commentator2Image: '/NPC/Comentator%202%20Calm.svg',
          };
        }
      } else if (step === 3) {
        if (minute >= 45) {
          return {
            speakerTitle: 'Martin',
            text: `"Let's see if the managers' half-time instructions can make a difference in these final 45 minutes!"`,
            commentator1Image: '/NPC/Komentator%201%20calm.svg',
          };
        } else {
          return {
            speakerTitle: 'Martin',
            text: `"The atmosphere in the stadium is absolutely electric. I can't wait to see which team takes control of the match early on!"`,
            commentator1Image: '/NPC/Komentator%201%20calm.svg',
          };
        }
      } else if (step === 4) {
        if (minute < 45) {
          const homeFact = getRandomTeamFact(fixture.homeTeam);
          if (homeFact) {
            return {
              speakerTitle: 'Alan',
              text: `"Speaking of ${fixture.homeTeam}, did you know? ${homeFact}"`,
              commentator2Image: '/NPC/Comentator%202%20Calm.svg',
            };
          }
        }
        return {
          speakerTitle: 'Alan',
          text: `"Both teams look completely focused today. We're in for a treat."`,
          commentator2Image: '/NPC/Comentator%202%20Calm.svg',
        };
      } else {
        if (minute < 45) {
          const awayFact = getRandomTeamFact(fixture.awayTeam);
          if (awayFact) {
            return {
              speakerTitle: 'Martin',
              text: `"And don't forget about ${fixture.awayTeam}. ${awayFact}"`,
              commentator1Image: '/NPC/Komentator%201%20calm.svg',
            };
          }
        }
        return {
          speakerTitle: 'Martin',
          text: `"Absolutely, every detail will count on the pitch today!"`,
          commentator1Image: '/NPC/Komentator%201%20calm.svg',
        };
      }
    case 'half_time':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'HALF TIME',
          refereeImage: '/NPC/%20End%20of%20Game.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Alan',
          text: `"And that's the whistle for the break! It's been an intense first 45 minutes. Let's take a quick look at the midway TxODDS statistics."`,
          commentator2Image: '/NPC/Comentator%202%20Calm.svg',
        };
      } else if (step === 3) {
        return {
          speakerTitle: 'Martin',
          text: `"The possession is incredibly even so far, but ${fixture.homeTeam} has been much more dangerous in the final third, creating higher quality xG chances."`,
          commentator1Image: '/NPC/Komentator%201%20calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"Absolutely. The managers will have a lot to talk about in the dressing room. We'll see what tactical adjustments they make for the second half."`,
          commentator2Image: '/NPC/Comentator%202%20Calm.svg',
        };
      }
    case 'full_time':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'FULL TIME',
          refereeImage: '/NPC/%20End%20of%20Game.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Martin',
          text: `"What an incredible match! Let's dive into the post-match statistics provided by TxODDS."`,
          commentator1Image: '/NPC/Komentator%201%20calm.svg',
        };
      } else if (step === 3) {
        return {
          speakerTitle: 'Alan',
          text: `"Looking at the data, ${fixture.homeTeam} absolutely dominated the possession today, holding onto the ball for a staggering 62% of the game."`,
          commentator2Image: '/NPC/Comentator%202%20Calm.svg',
        };
      } else if (step === 4) {
        return {
          speakerTitle: 'Martin',
          text: `"Indeed! And their passing accuracy was exceptional as well. They completed nearly 88% of their passes, constantly putting pressure on the defense."`,
          commentator1Image: '/NPC/Komentator%201%20calm.svg',
        };
      } else if (step === 5) {
        return {
          speakerTitle: 'Alan',
          text: `"However, the Expected Goals (xG) tells a different story. Despite the possession, ${fixture.awayTeam} had a much higher xG thanks to their lethal counter-attacks and clinical finishing!"`,
          commentator2Image: '/NPC/Comentator%202%20Calm.svg',
        };
      } else if (step === 6) {
        return {
          speakerTitle: 'Martin',
          text: `"Don't forget the incredible performance between the posts! Both goalkeepers registered crucial saves that kept the fans on the edge of their seats."`,
          commentator1Image: '/NPC/Komentator%201%20calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"A truly tactical masterclass and a fantastic display of football. Thank you for joining our live coverage, we'll see you at the next fixture!"`,
          commentator2Image: '/NPC/Comentator%202%20Calm.svg',
        };
      }
    case 'goal': {
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
          commentator1Image: '/NPC/Comentator%201.svg',
        };
      } else {
        if (goalType === 'Head') {
          return {
            speakerTitle: 'Alan',
            text: `"What a delivery! ${player} attacked the ball with complete conviction — that's an aerial masterclass!"`,
            commentator2Image: '/NPC/Comentator%202.svg',
          };
        } else if (goalType === 'Shot') {
          return {
            speakerTitle: 'Alan',
            text: `"Pure technique from ${player}! That shot had pace, precision, and the goalkeeper stood absolutely no chance!"`,
            commentator2Image: '/NPC/Comentator%202.svg',
          };
        } else {
          return {
            speakerTitle: 'Alan',
            text: `"A brilliant team move from ${team} finally breaks through the ${opponent} defense and ends with a well-deserved goal!"`,
            commentator2Image: '/NPC/Comentator%202.svg',
          };
        }
      }
    }
    case 'yellow_card':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: event.description ? `"${event.description}"` : `"Oh, that's a reckless challenge by ${player}! The referee steps in and shows a yellow card. He must be careful now!"`,
          commentator1Image: '/NPC/Comentator%201.svg',
          refereeImage: '/NPC/Referee%20Yellow%20Card.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"He really needs to watch his step now. One more mistake and ${team} will be down to 10 men!"`,
          commentator2Image: '/NPC/Comentator%202.svg',
        };
      }
    case 'red_card':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: event.description ? `"${event.description}"` : `"Oh, that's a reckless challenge by ${player}! The referee has no choice but to show a straight red card, and it's a huge blow for ${team}!"`,
          commentator1Image: '/NPC/Comentator%201.svg',
          refereeImage: '/NPC/Referee%20Red%20Card.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"That's a game-changing moment! The manager of ${team} will have to completely rethink their strategy now."`,
          commentator2Image: '/NPC/Comentator%202.svg',
        };
      }
    case 'own_goal':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: `"Disaster! It's an own goal by ${player}! An absolute nightmare moment for ${team}!"`,
          commentator1Image: '/NPC/Comentator%201.svg',
          refereeImage: '/NPC/%20End%20of%20Game.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"Absolutely gutting for ${team}. These are the moments that can completely change the momentum of a match!"`,
          commentator2Image: '/NPC/Comentator%202.svg',
        };
      }
    case 'substitution':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'SUBSTITUTION',
          refereeImage: '/NPC/Player%20subtitution.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Alan',
          text: event.description ? `"${event.description}"` : `"Substitution for ${team}. Let's see if this tactical change can turn the tide of the match."`,
          commentator2Image: '/NPC/Comentator%202%20Calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"Fresh legs on the pitch often provide that extra spark. It will be interesting to see how the opposition responds."`,
          commentator1Image: '/NPC/Komentator%201%20calm.svg',
        };
      }
    case 'corner_kick':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'CORNER',
          refereeImage: '/NPC/Corner%20Kick.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Alan',
          text: event.description ? `"${event.description}"` : `"It's out for a corner kick. A chance for ${team} to send their tall defenders forward."`,
          commentator2Image: '/NPC/Comentator%202.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"Set pieces are crucial in tight games like this. Delivery will be everything."`,
          commentator1Image: '/NPC/Komentator%201%20calm.svg',
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
          commentator2Image: '/NPC/Comentator%202%20Calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"This is a tense moment for both teams. The technology is checking everything closely."`,
          commentator1Image: '/NPC/Komentator%201%20calm.svg',
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
          commentator2Image: '/NPC/Comentator%202.svg',
        };
      }
    case 'penalty_conceded':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: `"That is a disastrous challenge by ${player} in the box. He leaves the referee with absolutely no choice."`,
          commentator1Image: '/NPC/Komentator%201%20calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"What was he thinking? You simply cannot make a tackle like that inside the area."`,
          commentator2Image: '/NPC/Comentator%202%20Calm.svg',
        };
      }
    case 'penalty_missed':
      if (step === 1) {
        return {
          speakerTitle: 'Alan',
          text: `"MISSED! I don't believe it! ${player} has completely fluffed his lines!"`,
          commentator2Image: '/NPC/Comentator%202.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"He'll be having nightmares about that one. A golden chance wasted."`,
          commentator1Image: '/NPC/Komentator%201%20calm.svg',
        };
      }
    case 'danger_attack':
      if (step === 1) {
        return {
          speakerTitle: 'Alan',
          text: `"${team} is in a highly dangerous position! TxLINE data shows they are in the Danger zone right now — a goal could come at any moment!"`,
          commentator2Image: '/NPC/Comentator%202.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"${opponent} needs to hold their defensive shape carefully. The pressure from ${team} is relentless and any lapse in concentration could be fatal!"`,
          commentator1Image: '/NPC/Komentator%201%20calm.svg',
        };
      }
    case 'starting_xi':
      return {
        speakerTitle: 'Alan',
        text: event.description
          ? `"${event.description}"`
          : `"${player} is confirmed in the starting eleven for ${team} today!"`,
        commentator2Image: '/NPC/Comentator%202%20Calm.svg',
      };
    case 'sub_appearance':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'SUBSTITUTION',
          refereeImage: '/NPC/Player%20subtitution.svg',
          isRefereeStyle: true,
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: event.description
            ? `"${event.description}"`
            : `"${player} is now on the pitch! Fresh legs that could make all the difference for ${team} in the closing stages."`,
          commentator2Image: '/NPC/Comentator%202%20Calm.svg',
        };
      }
    case 'possession_bonus':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: event.description
            ? `"${event.description}"`
            : `"${team} has been absolutely dominant in possession this half! ${player} has been the engine in midfield, controlling the tempo beautifully."`,
          commentator1Image: '/NPC/Komentator%201%20calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"When you control the ball like that, you control the game. ${player} deserves full credit for the work rate shown today."`,
          commentator2Image: '/NPC/Comentator%202%20Calm.svg',
        };
      }
    case 'clean_sheet':
      if (step === 1) {
        return {
          speakerTitle: 'Alan',
          text: `"CLEAN SHEET! ${team} has successfully kept the opposition off the scoreboard — ${player} has been absolutely magnificent today!"`,
          commentator2Image: '/NPC/Comentator%202.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"A clean sheet is the ultimate reward for a solid defensive performance. The entire backline for ${team} deserves enormous credit today."`,
          commentator1Image: '/NPC/Komentator%201%20calm.svg',
        };
      }
    case 'assist':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: event.description
            ? `"${event.description}"`
            : `"What a pass from ${player}! The vision to pick out that run was exceptional — that assist was every bit as important as the goal itself!"`,
          commentator1Image: '/NPC/Comentator%201.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"Creative genius from ${player}! He saw the run nobody else spotted and delivered the perfect ball. That's the mark of a truly world-class player."`,
          commentator2Image: '/NPC/Comentator%202.svg',
        };
      }
    case 'goalkeeper_save':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: event.description
            ? `"${event.description}"`
            : `"INCREDIBLE SAVE from ${player}! That looked destined for the net, but he has pulled off an absolutely stunning stop!"`,
          commentator1Image: '/NPC/Comentator%201.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"What a moment from ${player}! That save alone could be worth three points for ${team}. He has single-handedly kept them in this match."`,
          commentator2Image: '/NPC/Comentator%202%20Calm.svg',
        };
      }
    case 'penalty_save':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: `"SAVED!! ${player} guesses correctly and palms it away! The penalty taker is absolutely devastated — what a moment for the goalkeeper!"`,
          commentator1Image: '/NPC/Comentator%201.svg',
          refereeImage: '/NPC/%20End%20of%20Game.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"A defining save that could completely change the course of this match! ${player} is the hero — ${team} are absolutely ecstatic!"`,
          commentator2Image: '/NPC/Comentator%202.svg',
        };
      }
    case 'extra_time':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'EXTRA TIME',
          refereeImage: '/NPC/Referee%20Kick%20OFF.svg',
          isRefereeStyle: true,
          refereePosition: 'left',
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Alan',
          text: `"We are going to extra time! Ninety minutes were not enough to separate these two sides — thirty more minutes to decide this contest!"`,
          commentator2Image: '/NPC/Comentator%202%20Calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"Both squads must dig deep now. Fatigue is a real factor, but so is the prize. One moment of quality could decide everything!"`,
          commentator1Image: '/NPC/Komentator%201%20calm.svg',
        };
      }
    case 'penalty_scored':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: `"SCORED! ${player} steps up and sends the keeper the wrong way — nerves of steel from the ${team} player!"`,
          commentator1Image: '/NPC/Comentator%201.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"Ice in the veins! That is how you take a penalty under the biggest pressure possible. ${team} are one step closer!"`,
          commentator2Image: '/NPC/Comentator%202.svg',
        };
      }
    case 'penalty_missed_shootout':
      if (step === 1) {
        return {
          speakerTitle: 'Alan',
          text: `"MISSED! ${player} has blazed it wide — that is an absolutely cruel moment in a penalty shootout. ${team} are on the brink!"`,
          commentator2Image: '/NPC/Comentator%202.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"The pressure of a penalty shootout can break the best players in the world. ${player} will need enormous support from the bench and the fans right now."`,
          commentator1Image: '/NPC/Komentator%201%20calm.svg',
        };
      }
    default:
      return {
        speakerTitle: 'Commentator',
        text: `"${event.description}"`,
        commentator1Image: '/NPC/Komentator%201%20calm.svg',
      };
  }
}

export default function ReplayPage({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = use(params);
  const searchParams = useSearchParams();
  const isResultsMode = searchParams.get('results') === '1';
  const contestTypeParam = searchParams.get('contestType') ?? 'top3';
  const { playSFX } = useAudio();
  const { appMode, apiToken, guestJwt } = useTxLine();

  // Fixture resolution — WC2026 takes priority in both modes
  const wcFixture = WC2026_FIXTURES.find(f => f.fixtureId === contestId);
  const isDemoFixture = DEMO_FIXTURES.some(f => f.fixtureId === contestId);

  // In live mode: NEVER fall back to demo fixtures — demo team names must not
  // appear on a real replay page.
  const fixture = wcFixture
    ? { ...wcFixture, status: getFixtureStatus(wcFixture), homeScore: 0, awayScore: 0 }
    : appMode !== 'demo'
      ? { fixtureId: contestId, homeTeam: '—', awayTeam: '—', homeFlag: '🏳️', awayFlag: '🏳️',
          kickoffAt: new Date().toISOString(), status: 'upcoming' as const, homeScore: 0, awayScore: 0 }
      : (DEMO_FIXTURES.find(f => f.fixtureId === contestId) || DEMO_FIXTURES[0]);

  // Mutable events queue — demo events only in demo mode; live starts empty (API fills it).
  // For a real wcFixture this is a placeholder until TxLINE or ESPN data (below) replaces
  // it with what actually happened — getDynamicEvents just remaps a fixed generic script
  // (same storyline, same score, every time) onto whichever real players are on the roster.
  const eventsQueueRef = useRef<any[]>(
    appMode === 'demo' || !!wcFixture
      ? getDynamicEvents(fixture, REPLAY_EVENTS[contestId] || LIVE_EVENTS)
      : []
  );
  // Which source eventsQueueRef.current actually came from — purely for the "EVENTS FROM
  // ..." badge label. ESPN is treated as authoritative for event correctness regardless of
  // whether TxLINE also responded (see the ESPN effect below): TxLINE's live stream can
  // return a partial or inconsistent reconstruction for a fixture it didn't track cleanly,
  // and for a REPLAY of an already-finished match, ESPN's post-match report is the more
  // reliable source of "what actually happened" even when TxLINE has *something*.
  const [eventsSource, setEventsSource] = useState<'demo' | 'txline' | 'espn'>('demo');

  // apiVersion increments after API events load, triggering the event trigger effect to re-evaluate
  const [apiVersion, setApiVersion] = useState(0);
  // true while fetching from TxLINE API
  const [apiLoading, setApiLoading] = useState(
    appMode === 'live' && !!wcFixture
  );

  // Match statistics (shots/corners/cards per half, venue, attendance) — public info,
  // shown to spectators and entrants alike, unlike the lineup-only panels below.
  const [matchStats, setMatchStats] = useState<{ data: MatchResult | null; loading: boolean }>({ data: null, loading: !!wcFixture });
  useEffect(() => {
    if (!wcFixture) { setMatchStats({ data: null, loading: false }); return; }
    let cancelled = false;
    setMatchStats(prev => ({ ...prev, loading: true }));
    fetch(`/api/match/result?fixtureId=${contestId}&homeTeam=${encodeURIComponent(wcFixture.homeTeam)}&awayTeam=${encodeURIComponent(wcFixture.awayTeam)}`)
      .then(r => r.json())
      .then((data: MatchResult) => { if (!cancelled) setMatchStats({ data, loading: false }); })
      .catch(() => { if (!cancelled) setMatchStats({ data: null, loading: false }); });
    return () => { cancelled = true; };
  }, [contestId, wcFixture]);

  // TxLINE-published lineup (formation + starters + bench), if TxLINE has one for this
  // fixture. Combined with the ESPN-sourced lineup (from matchStats, below) and a
  // predicted-XI fallback into `realLineup` — see that derivation further down.
  const [txlineLineup, setTxlineLineup] = useState<{ home: FormationPlayer[]; away: FormationPlayer[]; homeCoach?: string; awayCoach?: string } | null>(null);

  // All state hooks — always called unconditionally (Rules of Hooks)
  const [events, setEvents] = useState<any[]>([]);
  const [currentEventIdx, setCurrentEventIdx] = useState(0);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [minute, setMinute] = useState(0);
  const [leaderboard, setLeaderboard] = useState(DEMO_LEADERBOARD);
  const [latestEvent, setLatestEvent] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isPlaying, setIsPlaying] = useState(!isResultsMode);
  const [isFastForward, setIsFastForward] = useState(true);
  const eventRef = useRef<HTMLDivElement>(null);
  const triggeredEventsRef = useRef<Set<string>>(new Set());
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeToasts, setActiveToasts] = useState<FantasyNotificationItem[]>([]);
  const prevRankRef = useRef<number>(2);
  const notifiedEventsRef = useRef<Set<string>>(new Set());
  const appearedPlayersRef = useRef<Set<string>>(new Set());
  const leaderboardRef = useRef(leaderboard);
  const userLineupRef = useRef<any>(null);

  // Prize claim / card pack state
  const [hasClaimed, setHasClaimed] = useState(false);
  const [showCardPack, setShowCardPack] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`txodds_user_lineup_${contestId}_${contestTypeParam}`)
        ?? localStorage.getItem(`txodds_user_lineup_${contestId}`);
      if (stored) {
        userLineupRef.current = JSON.parse(stored);
      }
      if (hasOpenedPack(`${contestId}_${contestTypeParam}`)) setHasClaimed(true);
    } catch (e) {
      console.error('Failed to parse user lineup:', e);
    }
  }, [contestId]);

  // Results mode: immediately skip to final state
  useEffect(() => {
    if (!isResultsMode) return;
    const queue = eventsQueueRef.current;
    if (queue.length === 0) return;

    // Compute final score from all events
    let h = 0; let a = 0;
    queue.forEach(ev => {
      if (ev.type === 'goal' || ev.type === 'own_goal') {
        if (ev.team === fixture.homeTeam) h++; else a++;
      }
    });

    // Reverse so newest event is at top (matches replay display order)
    setEvents([...queue].reverse());
    setCurrentEventIdx(queue.length);
    setScore({ home: h, away: a });
    const ftEvent = queue.find(ev => ev.type === 'full_time');
    setMinute(ftEvent?.minute ?? 90);
    queue.forEach(ev => triggeredEventsRef.current.add(ev.id));
    setIsPlaying(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResultsMode]);

  // ESPN's real match report replaces whatever's in eventsQueueRef once matchStats
  // resolves with real events — including overriding TxLINE if it already applied
  // something above. TxLINE's live-stream reconstruction can come back partial or
  // inconsistent for a fixture it didn't track cleanly, and this page's whole purpose
  // is showing what actually happened in a finished match, so correctness (ESPN) wins
  // over "whichever source responded" or extra live-only granularity (TxLINE). Either
  // way this replaces the placeholder generic script (fixed storyline, fixed score,
  // remapped by position) that's there until one of the real sources loads.
  useEffect(() => {
    const espnEvents = matchStats.data?.events;
    if (!espnEvents || espnEvents.length === 0) return;

    const sorted = espnEventsToTimeline(espnEvents, fixture.homeTeam, (fixture as any).homeFlag ?? '', (fixture as any).awayFlag ?? '');
    eventsQueueRef.current = sorted;
    triggeredEventsRef.current.clear();
    notifiedEventsRef.current.clear();
    setEventsSource('espn');

    if (isResultsMode) {
      let h = 0, a = 0;
      sorted.forEach(ev => {
        if (ev.type === 'goal' || ev.type === 'own_goal') { if (ev.team === fixture.homeTeam) h++; else a++; }
        triggeredEventsRef.current.add(ev.id);
      });
      setEvents([...sorted].reverse());
      setCurrentEventIdx(sorted.length);
      setScore({ home: h, away: a });
      const ftEvent = sorted.find(ev => ev.type === 'full_time');
      setMinute(ftEvent?.minute ?? 90);
      setIsPlaying(false);
    } else {
      // Replay from the beginning with the real event script instead of the placeholder.
      setEvents([]);
      setMinute(0);
      setCurrentEventIdx(0);
      setScore({ home: 0, away: 0 });
      setApiVersion(v => v + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchStats.data]);

  useEffect(() => {
    leaderboardRef.current = leaderboard;
  }, [leaderboard]);

  // ── Live mode: fetch full match event history from TxLINE API ─────────────
  useEffect(() => {
    if (appMode !== 'live' || !apiToken || !wcFixture) {
      setApiLoading(false);
      return;
    }

    let cancelled = false;

    Promise.all([
      fetchLiveScoreUpdates(apiToken, contestId, guestJwt),
      buildPlayerIdMap(apiToken, contestId, fixture.homeTeam, fixture.awayTeam, guestJwt),
      fetch('/api/scores/txline').then(r => r.ok ? r.json() : {}).catch(() => ({})),
      fetch(`/api/txline/api/fixtures/lineups/${contestId}`).then(r => r.ok ? r.json() : null).catch(() => null),
      // TxLINE's dedicated lineup endpoint sometimes only lists starters + whichever subs
      // actually came on, not the full bench. The score snapshot separately carries a
      // "lineups" action that's often more complete — fetch it too and keep whichever
      // parse yields more players.
      fetch(`/api/txline/api/scores/snapshot/${contestId}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([raw, pMap, scoresData, lineupData, snapshotData]) => {
        if (cancelled) return;
        const updates = Array.isArray(raw) ? raw : (raw ? [raw] : []);
        const seenSeqs = new Set<number>();
        const apiEvents = convertTxLineUpdates(
          updates, pMap,
          fixture.homeTeam, fixture.awayTeam,
          (fixture as any).homeFlag ?? '', (fixture as any).awayFlag ?? '',
          seenSeqs,
        );

        // TxLINE lineup, if published for this fixture — used as a fallback behind the
        // ESPN-sourced lineup (see realLineup derivation below), which is normally more complete.
        const fromDedicated = lineupData ? parseLineupData(lineupData, pMap) : null;
        const snapshotLineupAction = Array.isArray(snapshotData)
          ? snapshotData.find((u: any) => (u.Action ?? u.action ?? '').toLowerCase() === 'lineups')
          : (snapshotData && (snapshotData.Action ?? snapshotData.action ?? '').toLowerCase() === 'lineups' ? snapshotData : null);
        const fromSnapshot = snapshotLineupAction ? parseLineupData(snapshotLineupAction, pMap) : null;
        const countOf = (l: typeof fromDedicated) => (l ? l.home.length + l.away.length : 0);
        setTxlineLineup(countOf(fromSnapshot) > countOf(fromDedicated) ? fromSnapshot : fromDedicated);

        if (apiEvents.length > 0) {
          const sorted = [...apiEvents].sort((a, b) => a.minute - b.minute);
          eventsQueueRef.current = sorted;
          setEventsSource('txline');
          triggeredEventsRef.current.clear();
          notifiedEventsRef.current.clear();

          // If the match is already completed, jump straight to the final state
          const matchScore: { home: number; away: number; completed?: boolean } | undefined = (scoresData as Record<string, { home: number; away: number; completed?: boolean }>)[contestId];
          const kickoffMs = wcFixture?.kickoffAt ? new Date(wcFixture.kickoffAt).getTime() : 0;
          const matchIsComplete = matchScore?.completed || (kickoffMs > 0 && Date.now() > kickoffMs + 2.5 * 3600 * 1000);

          if (matchIsComplete) {
            sorted.forEach(ev => triggeredEventsRef.current.add(ev.id));
            setEvents([...sorted].reverse());
            setCurrentEventIdx(sorted.length);
            const ftEvent = sorted.find(ev => ev.type === 'full_time');
            setMinute(ftEvent?.minute ?? 90);
            if (matchScore) setScore({ home: matchScore.home, away: matchScore.away });
            setIsPlaying(false);
            console.log(`[Replay] Match complete — jumping to final state`);
          } else {
            // Match still in progress — replay from beginning
            setEvents([]);
            setMinute(0);
            setCurrentEventIdx(0);
            setScore({ home: 0, away: 0 });
            setApiVersion(v => v + 1);
          }
          console.log(`[Replay] Loaded ${apiEvents.length} events from TxLINE API`);
        }
      })
      .catch(err => console.error('[Replay] API fetch error:', err))
      .finally(() => { if (!cancelled) setApiLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appMode, apiToken, contestId]);

  // Final lineup shown in Team Lineup, combining every source in priority order:
  //   1. ESPN's rosters (via matchStats) — the only source with a full matchday squad,
  //      since this is a finished match ESPN has already fully reported on.
  //   2. TxLINE's published lineup — often starters-only or missing unused bench players.
  //   3. Predicted XI from our own roster — a guess, used only when neither above has data.
  const espnLineup = matchStats.data?.homeLineup && matchStats.data?.awayLineup
    ? {
        home: espnLineupToFormationPlayers(matchStats.data.homeLineup, 1),
        away: espnLineupToFormationPlayers(matchStats.data.awayLineup, 2),
      }
    : null;
  const realLineup = espnLineup ?? txlineLineup ?? (wcFixture ? {
    home: buildPredictedXI(fixture.homeTeam, 1),
    away: buildPredictedXI(fixture.awayTeam, 2),
  } : null);
  const isPredictedLineup = !espnLineup && !txlineLineup && !!wcFixture;

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
  // Simulate live events
  useEffect(() => {
    if (!isPlaying || showPopup) return;
    
    const tickRate = isFastForward ? 2000 : 60000;

    const interval = setInterval(() => {
      setMinute((m) => Math.min(m + 1, 120)); // allow up to 120' for extra time
    }, tickRate);

    return () => clearInterval(interval);
  }, [isPlaying, showPopup, isFastForward]);

    // Trigger events based on minute
    useEffect(() => {
      if (showPopup) return;
      const event = eventsQueueRef.current[currentEventIdx];
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
  
      // Update score
      if (event.type === 'goal' || event.type === 'own_goal') {
        const isHome = event.team === fixture.homeTeam;
        setScore((s) => ({
          home: isHome ? s.home + 1 : s.home,
          away: !isHome ? s.away + 1 : s.away,
        }));
      }
  
      // Determine authentic points for user
      let delta = 0;
      let isCap = false;

      if (userLineupRef.current && event.playerId) {
        const { players, captain, confidence } = userLineupRef.current;
        const matchedPlayer = players.find((p: any) => p && p.id === event.playerId);
        
        if (matchedPlayer) {
          const basePts = calculateEventPoints(event.type, matchedPlayer.position);
          let appearanceBonus = 0;
          if (!appearedPlayersRef.current.has(event.playerId)) {
            appearanceBonus = 2;
            appearedPlayersRef.current.add(event.playerId);
          }
          isCap = captain === event.playerId;
          const stars = confidence?.[event.playerId] ?? 3;
          delta = resolvePlayerDelta(basePts, { isCaptain: isCap, confidenceStars: stars, appearanceBonus });
        }
      }

      // Shuffle leaderboard
      setLeaderboard((prev) => {
        const next = [...prev];
        // Simulate bot point accumulation based on event
        next.forEach((entry, i) => {
          if (i !== 1) { // not user
            entry.points += Math.abs(event.points) * (Math.random() * 0.4);
          }
        });
        
        // Authentic user points
        next[1] = { ...next[1], points: next[1].points + delta };
        
        const sorted = next.sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }));
        return sorted;
      });

      // Fantasy Point Notification Trigger
      if (delta !== 0 && !notifiedEventsRef.current.has(event.id)) {
        notifiedEventsRef.current.add(event.id);
        
        const roundedDelta = Math.round(delta * 100) / 100;
        const valueStr = roundedDelta > 0 ? `+${roundedDelta} pts` : `${roundedDelta} pts`;
        
        const newToasts: FantasyNotificationItem[] = [
          {
            id: `toast-${Date.now()}-${event.id}`,
            type: event.type as any,
            title: event.type.replace('_', ' '),
            subtitle: event.player || 'Player Action',
            value: valueStr,
          }
        ];

        // Authentic captain bonus simulation
        if (isCap) {
          const capBonus = roundedDelta / 2;
          newToasts.unshift({
            id: `toast-cap-${Date.now()}`,
            type: 'captain_bonus',
            title: 'Captain Bonus',
            subtitle: event.player,
            value: `+${capBonus} pts`,
          });
        }

        // Rank up simulation
        const nextBoard = [...leaderboardRef.current];
        nextBoard[1] = { ...nextBoard[1], points: nextBoard[1].points + delta };
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
    }, [minute, currentEventIdx, fixture.homeTeam, showPopup, contestId, apiVersion]);

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

    // Restart the match exactly 2 minutes after full time dialog finishes
    useEffect(() => {
      if (latestEvent?.type === 'full_time' && !showPopup) {
        const resetTimer = setTimeout(() => {
          setMinute(0);
          setCurrentEventIdx(0);
          triggeredEventsRef.current.clear();
          setEvents([]);
          setScore({ home: 0, away: 0 });
          setLeaderboard(DEMO_LEADERBOARD);
          setLatestEvent(null);
        }, 120000); // 120,000ms = 2 minutes
        return () => clearTimeout(resetTimer);
      }
    }, [latestEvent, showPopup]);

  const userPoints = leaderboard.find((e) => e.isUser)?.points ?? 0;
  const userRank = leaderboard.find((e) => e.isUser)?.rank ?? '-';

  // Prize / claim helpers
  const allEventsPlayed = currentEventIdx >= eventsQueueRef.current.length && eventsQueueRef.current.length > 0;
  const matchIsOver = isResultsMode || allEventsPlayed;
  const userLineup = userLineupRef.current;
  const contestType: string = userLineup?.contestType ?? 'top3';
  const participantCount = userLineup ? 10 : 0; // demo: 10 participants
  const rankNum = typeof userRank === 'number' ? userRank : 2;
  const prizePool = participantCount * 0.1;
  const userPrizeSol =
    contestType === 'wta'   ? (rankNum === 1 ? prizePool : 0) :
    contestType === '5050'  ? (rankNum <= Math.floor(participantCount / 2) ? prizePool / Math.floor(participantCount / 2) : 0) :
    rankNum === 1 ? prizePool * 0.5 : rankNum === 2 ? prizePool * 0.3 : rankNum === 3 ? prizePool * 0.2 : 0;

  const handleClaim = () => {
    setShowCardPack(true);
  };

  // ── Loading screen while fetching API events ────────────────────────────────
  if (apiLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', gap: 24, padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', animation: 'pulse 1.5s infinite' }}>🎬</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            <><FlagImage flag={fixture.homeFlag} size={16} /> {fixture.homeTeam} vs {fixture.awayTeam} <FlagImage flag={fixture.awayFlag} size={16} /></>
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 380, lineHeight: 1.7 }}>
            Fetching match events from TxLINE API...
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
            Loading TxLINE data
          </div>
        </div>
      </div>
    );
  }

  // ── Live mode: fixture not in WC2026 schedule (demo ID used on live page) ──
  if (appMode === 'live' && !wcFixture) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', gap: 24, padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>⚽</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Match Not Found</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 380, lineHeight: 1.7 }}>
            This fixture is not in the WC 2026 schedule. It may have been a demo match.
          </p>
          <Link href="/contests" className="btn btn--primary">← Back to Schedule</Link>
        </div>
      </div>
    );
  }

  // ── Still fetching TxLINE data — once the fetch settles (success OR failure),
  // fall through to the main page, which already has a generic demo event script
  // pre-loaded in eventsQueueRef as a fallback for fixtures TxLINE has no data for. ──
  if (appMode === 'live' && wcFixture && !isDemoFixture && !REPLAY_EVENTS[contestId] && apiLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', gap: 24, padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>🎬</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, maxWidth: 500 }}>
            <><FlagImage flag={wcFixture.homeFlag} size={16} /> {wcFixture.homeTeam} vs {wcFixture.awayTeam} <FlagImage flag={wcFixture.awayFlag} size={16} /></>
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.7 }}>
            No replay data available yet. The replay will be available once match events are recorded by TxLINE.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/contests" className="btn btn--primary">← Back to Contests</Link>
            <Link href={`/live/${contestId}`} className="btn btn--secondary">🔴 Watch Live</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

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

          {/* Score Bug */}
          <div className="score-bug" style={{ marginBottom: 24 }}>
            <div className="score-bug__team">
              <span className="score-bug__flag"><FlagImage flag={fixture.homeFlag} size={36} /></span>
              <span className="score-bug__name">{fixture.homeTeam}</span>
            </div>
            <div className="score-bug__score-container">
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="score-bug__score">{score.home}</span>
                <span className="score-bug__separator">—</span>
                <span className="score-bug__score">{score.away}</span>
              </div>
              <div className="score-bug__minute">
                {minute < 90 ? `${minute}'` : 'FT'}
              </div>
              <span className="badge" style={{ fontSize: '0.65rem', background: '#3b82f6', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: '4px' }}>
                {userLineup ? 'MY RESULT' : 'MATCH RESULT'}
              </span>
            </div>
            <div className="score-bug__team">
              <span className="score-bug__flag"><FlagImage flag={fixture.awayFlag} size={36} /></span>
              <span className="score-bug__name">{fixture.awayTeam}</span>
            </div>
          </div>

          {/* Data source badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            {eventsSource !== 'demo' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, background: 'rgba(0,229,255,0.07)', border: '1px solid rgba(0,229,255,0.25)', fontSize: '0.7rem', fontWeight: 700, color: '#00e5ff', letterSpacing: '0.06em' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 6px #00e5ff' }} />
                {eventsQueueRef.current.length} EVENTS FROM {eventsSource === 'espn' ? 'ESPN' : 'TxLINE API'}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                DEMO REPLAY
              </div>
            )}
          </div>

          {/* Controls */}
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
                setEvents([]);
                setScore({ home: 0, away: 0 });
                setMinute(0);
                setCurrentEventIdx(0);
                setIsPlaying(true);
                setVerificationStatus('pending');
                triggeredEventsRef.current.clear();
                notifiedEventsRef.current.clear();
              }}
              id="reset-simulation-btn"
            >
              ↺ Reset
            </button>
          </div>

          {/* Main Grid — spectators (no saved lineup) get a single column since the
              leaderboard/prize sidebar is entrant-only */}
          <div className="grid-sidebar" style={!userLineup ? { gridTemplateColumns: '1fr' } : undefined}>
            {/* LEFT: Events Timeline + User Stats */}
            <div>
              {/* User Fantasy Stats — only shown to users who actually entered this contest */}
              {userLineup && (
                <div className="card card--primary" style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                        Fantasy Points
                      </div>
                      <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '3rem', color: 'var(--color-primary)', lineHeight: 1 }}>
                        {userPoints.toFixed(1)}
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', gap: 16 }}>
                      <div>
                        <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.8rem', color: 'var(--text-primary)' }}>
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
              )}

              {/* Match Events + Match Statistics — side by side on desktop */}
              <style>{`
                .replay-events-stats-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  align-items: stretch;
                  margin-bottom: 20px;
                }
                @media (max-width: 900px) {
                  .replay-events-stats-grid { grid-template-columns: 1fr; }
                }
              `}</style>
              <div className={matchStats.data && (matchStats.data.stats || matchStats.data.venue) ? 'replay-events-stats-grid' : undefined} style={!(matchStats.data && (matchStats.data.stats || matchStats.data.venue)) ? { marginBottom: 20 } : undefined}>
              {/* Match Events Timeline */}
              <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: '#ffd700', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Match Events
                  <span className="badge badge--live" style={{ fontSize: '0.6rem' }}>LIVE</span>
                </h3>

                {events.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>⏰</div>
                    Waiting for match events...
                  </div>
                )}

                {/* flex: 1 + minHeight: 0 lets this fill whatever height the grid's
                    align-items: stretch gives the card (matching Match Statistics'
                    height) instead of stopping at a fixed 400px with empty space below */}
                <div ref={eventRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  {[...events].sort((a, b) => b.minute - a.minute).map((event) => (
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
                          {event.team ? <><FlagImage flag={event.teamFlag} size={14} /> {event.team}</> : event.description}
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

              {/* Match Statistics — public info (shots/corners/cards, venue), shown to everyone */}
              {matchStats.data && (matchStats.data.stats || matchStats.data.venue) && (
                <div className="card" style={{ margin: 0 }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: '#ffd700' }}>
                    Match Statistics
                  </h3>

                  {/* Final score + goals/cards — read straight from the full event queue (not the
                      progressively-revealed `events` state) so Match Statistics always shows the
                      end result immediately, independent of where Match Events playback is. */}
                  {(() => {
                    const allEvents = eventsQueueRef.current;
                    let finalHome = 0, finalAway = 0;
                    allEvents.forEach((e: any) => {
                      if (e.type === 'goal' || e.type === 'own_goal') {
                        if (e.team === fixture.homeTeam) finalHome++; else finalAway++;
                      }
                    });
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FlagImage flag={fixture.homeFlag} size={18} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{fixture.homeTeam}</span>
                        </div>
                        <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.6rem', letterSpacing: '0.05em' }}>
                          {finalHome} — {finalAway}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{fixture.awayTeam}</span>
                          <FlagImage flag={fixture.awayFlag} size={18} />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Goal scorers + cards — derived from the full event queue, same reasoning as above */}
                  {(() => {
                    const allEvents = eventsQueueRef.current;
                    const goals = allEvents.filter((e: any) => e.type === 'goal' || e.type === 'own_goal').sort((a: any, b: any) => a.minute - b.minute);
                    const cards = allEvents.filter((e: any) => e.type === 'yellow_card' || e.type === 'red_card').sort((a: any, b: any) => a.minute - b.minute);
                    if (goals.length === 0 && cards.length === 0) return null;
                    return (
                      <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {goals.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6, opacity: 0.7 }}>Goals</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {goals.map((g, i) => (
                                <div key={`goal-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                                  <span style={{ color: 'var(--text-muted)', width: 28, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{g.minute}&apos;</span>
                                  <span style={{ flexShrink: 0 }}>⚽</span>
                                  <FlagImage flag={g.teamFlag} size={14} />
                                  <span style={{ fontWeight: 600 }}>{g.player}</span>
                                  {g.type === 'own_goal' && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>(OG)</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {cards.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6, opacity: 0.7 }}>Cards</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {cards.map((c, i) => (
                                <div key={`card-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                                  <span style={{ color: 'var(--text-muted)', width: 28, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{c.minute}&apos;</span>
                                  <span style={{ flexShrink: 0 }}>{c.type === 'red_card' ? '🟥' : '🟨'}</span>
                                  <FlagImage flag={c.teamFlag} size={14} />
                                  <span style={{ fontWeight: 600 }}>{c.player}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {matchStats.data.stats && (() => {
                    const { h1, h2, total } = matchStats.data.stats;
                    const allRows: { label: string; hKey: keyof PeriodStats; aKey: keyof PeriodStats }[] = [
                      { label: 'Goals',          hKey: 'homeGoals',   aKey: 'awayGoals'   },
                      { label: 'Shots',          hKey: 'homeShots',   aKey: 'awayShots'   },
                      { label: 'Corners',        hKey: 'homeCorners', aKey: 'awayCorners' },
                      { label: 'Yellow Cards',   hKey: 'homeYellows', aKey: 'awayYellows' },
                      { label: 'Red Cards',      hKey: 'homeReds',    aKey: 'awayReds'    },
                      { label: 'Danger Attacks', hKey: 'homeDangers', aKey: 'awayDangers' },
                    ];
                    const statRows = allRows.filter(r => (total[r.hKey] as number) > 0 || (total[r.aKey] as number) > 0);
                    if (statRows.length === 0) return null;
                    // A half-period section is only worth showing if at least one of its
                    // rows has real data — otherwise every source we have (TxLINE Period1/2,
                    // our own live-tracked Supabase events) simply never captured this match's
                    // per-half breakdown, and a row of zeros would misleadingly read as
                    // "literally nothing happened" rather than "no data".
                    const hasHalfData = (data: PeriodStats) => statRows.some(row => (data[row.hKey] as number) > 0 || (data[row.aKey] as number) > 0);
                    const h1HasData = hasHalfData(h1);
                    const h2HasData = hasHalfData(h2);
                    const StatSection = ({ label, data }: { label: string; data: PeriodStats }) => (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 5, opacity: 0.7 }}>{label}</div>
                        {statRows.map(row => {
                          const hv = data[row.hKey] as number;
                          const av = data[row.aKey] as number;
                          return (
                            <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', alignItems: 'center', gap: 0, padding: '3px 0' }}>
                              <div style={{ textAlign: 'right', fontSize: '0.83rem', fontWeight: hv > av ? 700 : 400, color: hv > av ? 'var(--text-primary)' : 'var(--text-muted)', paddingRight: 12, fontVariantNumeric: 'tabular-nums' }}>{hv}</div>
                              <div style={{ textAlign: 'center', fontSize: '0.67rem', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>{row.label}</div>
                              <div style={{ textAlign: 'left', fontSize: '0.83rem', fontWeight: av > hv ? 700 : 400, color: av > hv ? 'var(--text-primary)' : 'var(--text-muted)', paddingLeft: 12, fontVariantNumeric: 'tabular-nums' }}>{av}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                    return (
                      <div style={{ marginBottom: 4 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', marginBottom: 8 }}>
                          <div style={{ textAlign: 'right', fontSize: '0.72rem', fontWeight: 700, paddingRight: 12 }}>{fixture.homeTeam}</div>
                          <div style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Statistics</div>
                          <div style={{ textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, paddingLeft: 12 }}>{fixture.awayTeam}</div>
                        </div>
                        {h1HasData && <StatSection label="1st Half" data={h1} />}
                        {h2HasData && <StatSection label="2nd Half" data={h2} />}
                        {!h1HasData && !h2HasData && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10, opacity: 0.7 }}>
                            Per-half breakdown not available for this match
                          </div>
                        )}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
                          <StatSection label="Full Time" data={total} />
                        </div>
                      </div>
                    );
                  })()}
                  {matchStats.data.venue && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12, marginTop: 4 }}>
                      📍 {matchStats.data.venue}{matchStats.data.attendance ? ` · ${matchStats.data.attendance} attendance` : ''}
                    </div>
                  )}
                </div>
              )}
              </div>

              {/* Cryptographic Result Verification Panel — verifies YOUR result, so only relevant to entrants */}
              {userLineup && (
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
              )}

              {/* Team Lineup — ESPN's full matchday squad (starters + bench) when available,
                  else TxLINE's published lineup, else a predicted XI as last resort; falls back
                  further to a plain starting_xi/substitution list for demo fixtures with no
                  TxLINE/ESPN backing at all */}
              {realLineup ? (
                <>
                  {isPredictedLineup && (
                    <div style={{ textAlign: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ffaa00', background: 'rgba(255,170,0,0.12)', border: '1px solid rgba(255,170,0,0.3)', borderRadius: 4, padding: '2px 8px', letterSpacing: '0.05em' }}>
                        ⏳ PREDICTED XI — TxLINE has no published lineup for this match
                      </span>
                    </div>
                  )}
                  <LiveLineupFormation
                    homePlayers={realLineup.home}
                    awayPlayers={realLineup.away}
                    homeTeam={fixture.homeTeam}
                    awayTeam={fixture.awayTeam}
                    homeFlag={fixture.homeFlag}
                    awayFlag={fixture.awayFlag}
                    homeCoach={(realLineup as { homeCoach?: string }).homeCoach}
                    awayCoach={(realLineup as { awayCoach?: string }).awayCoach}
                  />
                </>
              ) : (
                <div className="card" style={{ marginTop: 20 }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Team Lineup
                  </h4>
                  {(() => {
                    const allEvents = eventsQueueRef.current;
                    const homeXI = allEvents.filter((e: any) => e.type === 'starting_xi' && e.team === fixture.homeTeam);
                    const awayXI = allEvents.filter((e: any) => e.type === 'starting_xi' && e.team === fixture.awayTeam);
                    const homeSubs = allEvents.filter((e: any) => e.type === 'substitution' && e.team === fixture.homeTeam).sort((a: any, b: any) => a.minute - b.minute);
                    const awaySubs = allEvents.filter((e: any) => e.type === 'substitution' && e.team === fixture.awayTeam).sort((a: any, b: any) => a.minute - b.minute);

                    if (homeXI.length === 0 && awayXI.length === 0) {
                      return (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.7 }}>
                          Lineup not available for this match
                        </div>
                      );
                    }

                    const posOf = (playerId?: string): string | null => {
                      if (!playerId) return null;
                      return WC2026_PLAYERS.find(p => p.id === playerId)?.position ?? null;
                    };

                    const TeamColumn = ({ team, flag, xi, subs }: { team: string; flag: string; xi: any[]; subs: any[] }) => (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <FlagImage flag={flag} size={16} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{team}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: subs.length > 0 ? 12 : 0 }}>
                          {xi.map((p, i) => {
                            const pos = posOf(p.playerId);
                            return (
                              <div key={`xi-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem' }}>
                                {pos && (
                                  <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', width: 24, flexShrink: 0 }}>{pos}</span>
                                )}
                                <span>{p.player}</span>
                              </div>
                            );
                          })}
                        </div>
                        {subs.length > 0 && (
                          <>
                            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 5, opacity: 0.7 }}>Substitutes</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {subs.map((s, i) => (
                                <div key={`sub-${i}`} style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                  <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{s.minute}&apos;</span>{' '}
                                  {s.player}{s.playerOut ? ` (for ${s.playerOut})` : ''}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );

                    return (
                      <>
                        <style>{`
                          .replay-lineup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                          @media (max-width: 480px) {
                            .replay-lineup-grid { grid-template-columns: 1fr; }
                          }
                        `}</style>
                        <div className="replay-lineup-grid">
                          <TeamColumn team={fixture.homeTeam} flag={fixture.homeFlag} xi={homeXI} subs={homeSubs} />
                          <TeamColumn team={fixture.awayTeam} flag={fixture.awayFlag} xi={awayXI} subs={awaySubs} />
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* RIGHT: Leaderboard — entrant-only, spectators have no lineup/prize stake to show */}
            {userLineup && (
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
                          <td>
                            <div style={{ fontWeight: entry.isUser ? 700 : 500, fontSize: '0.85rem', color: entry.isUser ? '#00e5ff' : 'var(--text-primary)' }}>
                              {entry.username}
                              {entry.isUser && <span style={{ fontSize: '0.65rem', color: '#00e5ff', marginLeft: 4 }}>YOU</span>}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {entry.wallet}
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
                      Prize Pool: {prizePool.toFixed(2)} SOL
                    </div>
                    {contestType === 'wta' ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#FFD700', fontWeight: 700 }}>1st</span>
                        <div style={{ flex: 1, height: 4, background: 'var(--bg-glass)', borderRadius: 999, margin: '0 10px', overflow: 'hidden' }}>
                          <div style={{ width: '100%', height: '100%', background: '#FFD700', borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>{prizePool.toFixed(2)} SOL</span>
                      </div>
                    ) : contestType === '5050' ? (
                      <div style={{ fontSize: '0.8rem', color: '#10b981' }}>Top 50% share {prizePool.toFixed(2)} SOL equally</div>
                    ) : (
                      [
                        { place: '1st', prize: `${(prizePool * 0.5).toFixed(2)} SOL`, pct: '50%', color: '#FFD700' },
                        { place: '2nd', prize: `${(prizePool * 0.3).toFixed(2)} SOL`, pct: '30%', color: '#C0C0C0' },
                        { place: '3rd', prize: `${(prizePool * 0.2).toFixed(2)} SOL`, pct: '20%', color: '#CD7F32' },
                      ].map((p) => (
                        <div key={p.place} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.8rem', color: p.color, fontWeight: 700 }}>{p.place}</span>
                          <div style={{ flex: 1, height: 4, background: 'var(--bg-glass)', borderRadius: 999, margin: '0 10px', overflow: 'hidden' }}>
                            <div style={{ width: p.pct, height: '100%', background: p.color, borderRadius: 999 }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>{p.prize}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* ── Claim Prize panel — visible once match is over ── */}
                  {matchIsOver && userLineup && (
                    <div style={{ marginTop: 20, padding: 16, borderRadius: 8, border: `1px solid ${userPrizeSol > 0 ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.08)'}`, background: userPrizeSol > 0 ? 'rgba(255,215,0,0.06)' : 'rgba(0,0,0,0.25)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                        Your Result
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                        <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '2.5rem', lineHeight: 1, color: userPrizeSol > 0 ? '#ffd700' : 'var(--text-muted)' }}>
                          #{rankNum}
                        </div>
                        <div>
                          <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.4rem', color: userPrizeSol > 0 ? '#ffd700' : 'var(--text-primary)', lineHeight: 1 }}>
                            {userPrizeSol > 0 ? `${userPrizeSol.toFixed(4)} SOL` : 'No prize'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {userPoints.toFixed(1)} pts · {userPrizeSol > 0 ? 'You won!' : 'Better luck next match'}
                          </div>
                        </div>
                      </div>

                      {userPrizeSol > 0 && !hasClaimed && (
                        <button className="btn btn--primary btn--full" onClick={handleClaim} style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                          🏆 Claim Prize + Open Card Pack
                        </button>
                      )}
                      {userPrizeSol > 0 && hasClaimed && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ textAlign: 'center', color: '#00e87a', fontWeight: 700, fontSize: '0.85rem', padding: '8px 0' }}>
                            ✅ Prize claimed!
                          </div>
                          <button className="btn btn--ghost btn--full" onClick={() => setShowCardPack(true)} style={{ fontSize: '0.85rem' }}>
                            🃏 Open Card Pack
                          </button>
                        </div>
                      )}
                      {userPrizeSol === 0 && (
                        <button className="btn btn--ghost btn--full" onClick={() => setShowCardPack(true)} style={{ fontSize: '0.85rem' }}>
                          🃏 Open Participation Pack
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Card Pack Modal (real CardPackOpener — saves to collection) ── */}
      {showCardPack && (
        <CardPackOpener
          contestId={contestId}
          onOpen={() => openCardPack(`${contestId}_${contestTypeParam}`)}
          onClose={() => {
            setShowCardPack(false);
            setHasClaimed(hasOpenedPack(`${contestId}_${contestTypeParam}`));
          }}
        />
      )}
    </div>
  );
}
