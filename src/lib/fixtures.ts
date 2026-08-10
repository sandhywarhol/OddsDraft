// Multi-League Fixture Definitions — OddsDraft
// Source: ESPN free API (no auth required)
// fixtureId = ESPN Event ID (used as primary key throughout the app)
// Fixtures are now fetched live from ESPN; this file defines the static shape
// and provides helper functions used by the schedule API.

import { LEAGUES } from './leagues';

export interface Fixture {
  fixtureId: string;    // ESPN Event ID — the primary key
  leagueId: string;     // e.g. 'eng.1', 'esp.1'
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: string;  // added for ESPN integration
  awayTeamId?: string;
  homeFlag: string;     // emoji flag OR club badge URL
  awayFlag: string;
  kickoffAt: string;    // ISO UTC
  stage: 'regular' | 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'group';
  // Populated from ESPN after completion
  homeScore?: number;
  awayScore?: number;
  penaltyHome?: number;
  penaltyAway?: number;
  completed?: boolean;
}

// ── Legacy WCFixture alias (for backward compat with old imports) ──────────────
export type WCFixture = Fixture;

// ── Emoji flags for national teams ────────────────────────────────────────────
const NATIONAL_FLAGS: Record<string, string> = {
  'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Australia': '🇦🇺', 'Turkey': '🇹🇷',
  'Germany': '🇩🇪', 'Curacao': '🇨🇼', 'Netherlands': '🇳🇱', 'Japan': '🇯🇵',
  'Ivory Coast': '🇨🇮', 'Ecuador': '🇪🇨', 'Sweden': '🇸🇪', 'Tunisia': '🇹🇳',
  'Spain': '🇪🇸', 'Cape Verde': '🇨🇻', 'Belgium': '🇧🇪', 'Egypt': '🇪🇬',
  'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾', 'Iran': '🇮🇷', 'New Zealand': '🇳🇿',
  'France': '🇫🇷', 'Senegal': '🇸🇳', 'Iraq': '🇮🇶', 'Norway': '🇳🇴',
  'Argentina': '🇦🇷', 'Algeria': '🇩🇿', 'Austria': '🇦🇹', 'Jordan': '🇯🇴',
  'Portugal': '🇵🇹', 'Congo DR': '🇨🇩', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷',
  'Ghana': '🇬🇭', 'Panama': '🇵🇦', 'Uzbekistan': '🇺🇿', 'Colombia': '🇨🇴',
  'Czech Republic': '🇨🇿', 'South Africa': '🇿🇦', 'Switzerland': '🇨🇭',
  'Bosnia & Herzegovina': '🇧🇦', 'Canada': '🇨🇦', 'Qatar': '🇶🇦',
  'Mexico': '🇲🇽', 'South Korea': '🇰🇷', 'USA': '🇺🇸', 'Morocco': '🇲🇦',
  'Brazil': '🇧🇷', 'Paraguay': '🇵🇾', 'Denmark': '🇩🇰', 'Poland': '🇵🇱',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'Serbia': '🇷🇸', 'Slovakia': '🇸🇰', 'Ukraine': '🇺🇦',
  'Albania': '🇦🇱', 'Hungary': '🇭🇺', 'Romania': '🇷🇴', 'Slovenia': '🇸🇮',
  'Greece': '🇬🇷', 'Finland': '🇫🇮', 'Iceland': '🇮🇸', 'North Macedonia': '🇲🇰',
};

// Generic club team emoji (no country flag for club teams)
const CLUB_EMOJI = '⚽';

export function getTeamFlag(teamName: string): string {
  return NATIONAL_FLAGS[teamName] ?? CLUB_EMOJI;
}

// ── Helper: determine if a league uses national teams (flags) or clubs ─────────
const NATIONAL_LEAGUES = new Set(['fifa.world', 'uefa.nations', 'afc.asian', 'caf.nations']);
export function isNationalLeague(leagueId: string): boolean {
  return NATIONAL_LEAGUES.has(leagueId);
}

// ── Static fixture list ────────────────────────────────────────────────────────
// This was previously a huge hardcoded list of WC2026 fixtures with TxLINE IDs.
// Now we use ESPN IDs and fetch live from the API. The static list is intentionally
// empty — fixtures come from ESPN via /api/schedule/[leagueId] route.
// Only keep truly completed historical fixtures here if needed for backward compat.
export const WC2026_FIXTURES: Fixture[] = [];

// ── getFixtureStatus (backward compat) ────────────────────────────────────────
export function getFixtureStatus(fixture: Fixture): 'upcoming' | 'live' | 'finished' {
  if (fixture.completed) return 'finished';
  const now = Date.now();
  const kick = new Date(fixture.kickoffAt).getTime();
  if (now > kick + 3 * 3_600_000) return 'finished'; // assume finished after 3h
  if (now > kick - 15 * 60_000) return 'live';       // live from 15min before kickoff
  return 'upcoming';
}

// ── All supported league slugs (for schedule polling) ─────────────────────────
export const ALL_LEAGUE_SLUGS = LEAGUES.map(l => l.espnSlug);
