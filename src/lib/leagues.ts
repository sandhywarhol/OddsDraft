// Supported leagues — all powered by ESPN free API (no auth needed)

export interface League {
  id: string;           // Internal ID used in our DB / URLs
  espnSlug: string;     // ESPN API slug: site.api.espn.com/.../soccer/{espnSlug}/...
  name: string;
  shortName: string;
  country: string;
  flag: string;
  logo: string;         // ESPN Logo URL
  color: string;        // Brand color for UI
}

export const LEAGUES: League[] = [
  { id: 'eng.1',         espnSlug: 'eng.1',         name: 'Premier League',        shortName: 'PL',   country: 'England',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png', color: '#3d195b' },
  { id: 'esp.1',         espnSlug: 'esp.1',         name: 'La Liga',               shortName: 'LL',   country: 'Spain',    flag: '🇪🇸', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png', color: '#ee8707' },
  { id: 'ger.1',         espnSlug: 'ger.1',         name: 'Bundesliga',            shortName: 'BL',   country: 'Germany',  flag: '🇩🇪', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png', color: '#d20515' },
  { id: 'fra.1',         espnSlug: 'fra.1',         name: 'Ligue 1',              shortName: 'L1',   country: 'France',   flag: '🇫🇷', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png', color: '#003189' },
  { id: 'ita.1',         espnSlug: 'ita.1',         name: 'Serie A',               shortName: 'SA',   country: 'Italy',    flag: '🇮🇹', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png', color: '#008fd7' },
  { id: 'uefa.champions',espnSlug: 'uefa.champions',name: 'Champions League',      shortName: 'UCL',  country: 'Europe',   flag: '🏆', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png', color: '#1a1a2e' },
  { id: 'fifa.world',    espnSlug: 'fifa.world',    name: 'FIFA World Cup',        shortName: 'WC',   country: 'World',    flag: '🌍', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/4.png', color: '#003087' },
];

export const LEAGUE_MAP = new Map<string, League>(LEAGUES.map(l => [l.id, l]));

export function getLeague(id: string): League | undefined {
  return LEAGUE_MAP.get(id);
}

export function getLeagueBySlug(slug: string): League | undefined {
  return LEAGUES.find(l => l.espnSlug === slug);
}
