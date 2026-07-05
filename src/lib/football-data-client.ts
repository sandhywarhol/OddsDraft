// football-data.org v4 API client
// Free tier: https://www.football-data.org/client/register
// Set FOOTBALL_DATA_API_KEY in your environment variables

import { PLAYER_RATINGS, EXCLUDED_PLAYERS } from './player-ratings';

const BASE = 'https://api.football-data.org/v4';

const headers = () => ({
  'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY ?? '',
});

// Position mapping: football-data.org → our system
const POS_MAP: Record<string, string> = {
  Goalkeeper: 'GK',
  Defence:    'DEF',
  Midfield:   'MID',
  Offence:    'ATT',
  Forward:    'ATT',
  Defender:   'DEF',
  Midfielder: 'MID',
};

// Default ratings by position (overridden by PLAYER_RATINGS for known players)
const BASE_RATING: Record<string, number> = {
  GK: 78, DEF: 79, MID: 80, ATT: 81,
};

// Team flag map — same as wc2026-fixtures.ts
const FLAG: Record<string, string> = {
  'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Australia': '🇦🇺', 'Turkey': '🇹🇷',
  'Germany': '🇩🇪', 'Curaçao': '🇨🇼', 'Curacao': '🇨🇼', 'Netherlands': '🇳🇱', 'Japan': '🇯🇵',
  "Côte d'Ivoire": '🇨🇮', 'Ivory Coast': '🇨🇮', 'Ecuador': '🇪🇨', 'Sweden': '🇸🇪', 'Tunisia': '🇹🇳',
  'Spain': '🇪🇸', 'Cabo Verde': '🇨🇻', 'Cape Verde': '🇨🇻', 'Belgium': '🇧🇪', 'Egypt': '🇪🇬',
  'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾', 'Iran': '🇮🇷', 'New Zealand': '🇳🇿',
  'France': '🇫🇷', 'Senegal': '🇸🇳', 'Iraq': '🇮🇶', 'Norway': '🇳🇴',
  'Argentina': '🇦🇷', 'Algeria': '🇩🇿', 'Austria': '🇦🇹', 'Jordan': '🇯🇴',
  'Portugal': '🇵🇹', 'DR Congo': '🇨🇩', 'Congo DR': '🇨🇩', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷',
  'Ghana': '🇬🇭', 'Panama': '🇵🇦', 'Uzbekistan': '🇺🇿', 'Colombia': '🇨🇴',
  'Czech Republic': '🇨🇿', 'South Africa': '🇿🇦', 'Switzerland': '🇨🇭',
  'Bosnia and Herzegovina': '🇧🇦', 'Bosnia & Herzegovina': '🇧🇦',
  'Canada': '🇨🇦', 'Qatar': '🇶🇦',
  'Mexico': '🇲🇽', 'South Korea': '🇰🇷', 'Korea Republic': '🇰🇷',
  'United States': '🇺🇸', 'USA': '🇺🇸', 'Morocco': '🇲🇦',
  'Brazil': '🇧🇷', 'Paraguay': '🇵🇾',
};

// Normalize team name from football-data.org to our fixture names
const TEAM_NAME_MAP: Record<string, string> = {
  "Côte d'Ivoire": 'Ivory Coast',
  'Cabo Verde': 'Cape Verde',
  'DR Congo': 'Congo DR',
  'United States': 'USA',
  'Korea Republic': 'South Korea',
  'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'Curaçao': 'Curacao',
};

function normalizeTeamName(name: string): string {
  return TEAM_NAME_MAP[name] ?? name;
}

function makeId(team: string, name: string, jerseyNumber?: number | null, usedIds?: Set<string>): string {
  const prefix = team.toLowerCase().replace(/[^a-z]/g, '').slice(0, 3);
  const normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z ]/g, '')
    .trim();
  const parts = normalized.split(' ').filter(Boolean);
  const last = parts[parts.length - 1] ?? 'player';
  const first = parts.slice(0, -1).join('');

  // Try progressively more specific slugs until unique
  const candidates = [
    `${prefix}-${last}`,
    first ? `${prefix}-${first[0]}${last}` : null,
    first.length > 1 ? `${prefix}-${first.slice(0, 2)}${last}` : null,
    first ? `${prefix}-${first}${last}` : null,
    jerseyNumber != null ? `${prefix}-${last}${jerseyNumber}` : null,
    `${prefix}-${normalized.replace(/ /g, '')}`,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (!usedIds?.has(candidate)) return candidate;
  }
  return candidates[candidates.length - 1]; // last resort fallback
}

export interface FDPlayer {
  id: string;
  name: string;
  team: string;
  teamFlag: string;
  position: string;
  jerseyNumber: number | null;
  rating: number;
}

export interface FDSquad {
  team: string;
  players: FDPlayer[];
}

// Fetch all WC2026 teams + their squads in one call
export async function fetchWC2026Squads(): Promise<FDSquad[]> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error('FOOTBALL_DATA_API_KEY env var is not set');

  // football-data.org competition code for FIFA World Cup
  const res = await fetch(`${BASE}/competitions/WC/teams?season=2026`, { headers: headers() });

  if (res.status === 403) throw new Error('Invalid or missing FOOTBALL_DATA_API_KEY');
  if (res.status === 404) throw new Error('WC2026 competition not found — season may not be available on your plan');
  if (!res.ok) throw new Error(`football-data.org API error: ${res.status} ${res.statusText}`);

  const data = await res.json();
  const teams: any[] = data.teams ?? [];

  return teams.map((team: any) => {
    const teamName = normalizeTeamName(team.name ?? team.shortName ?? '');
    const flag = FLAG[teamName] ?? FLAG[team.name] ?? '🏳️';

    const usedIds = new Set<string>();
    const players: FDPlayer[] = (team.squad ?? [])
      .filter((p: any) => !EXCLUDED_PLAYERS.has(p.name ?? ''))
      .map((p: any) => {
        const rawPos = p.position ?? '';
        const pos = POS_MAP[rawPos] ?? 'MID';
        const name = p.name ?? '';
        const id = makeId(teamName, name, p.shirtNumber ?? null, usedIds);
        usedIds.add(id);
        const rating = PLAYER_RATINGS[name] ?? BASE_RATING[pos] ?? 78;
        return {
          id,
          name,
          team: teamName,
          teamFlag: flag,
          position: pos,
          jerseyNumber: p.shirtNumber ?? null,
          rating,
        };
      });

    return { team: teamName, players };
  });
}
