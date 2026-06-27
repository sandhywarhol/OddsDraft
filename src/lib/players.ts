// World Cup 2026 Player Registry — OddsDraft
// Seeded player data for demo/lineup building
// Source: World Cup 2026 squads (USA, Canada, Mexico host nations + major teams)

export interface Player {
  id: string;
  name: string;
  team: string;
  teamFlag: string;
  position: 'GK' | 'DEF' | 'MID' | 'ATT';
  photoUrl?: string;
  nationality?: string;
  jerseyNumber?: number;
  rating?: number; // AI-estimated quality 0-100
}

export const WORLD_CUP_PLAYERS: Player[] = [
  // ===== BRAZIL =====
  { id: 'bra-alisson', name: 'Alisson', team: 'Brazil', teamFlag: '🇧🇷', position: 'GK', jerseyNumber: 1, rating: 92 },
  { id: 'bra-marquinhos', name: 'Marquinhos', team: 'Brazil', teamFlag: '🇧🇷', position: 'DEF', jerseyNumber: 4, rating: 87 },
  { id: 'bra-militao', name: 'Éder Militão', team: 'Brazil', teamFlag: '🇧🇷', position: 'DEF', jerseyNumber: 3, rating: 85 },
  { id: 'bra-danilo', name: 'Danilo', team: 'Brazil', teamFlag: '🇧🇷', position: 'DEF', jerseyNumber: 2, rating: 80 },
  { id: 'bra-casemiro', name: 'Casemiro', team: 'Brazil', teamFlag: '🇧🇷', position: 'MID', jerseyNumber: 5, rating: 86 },
  { id: 'bra-lucas', name: 'Lucas Paquetá', team: 'Brazil', teamFlag: '🇧🇷', position: 'MID', jerseyNumber: 10, rating: 84 },
  { id: 'bra-vinicius', name: 'Vinícius Jr.', team: 'Brazil', teamFlag: '🇧🇷', position: 'ATT', jerseyNumber: 7, rating: 91 },
  { id: 'bra-rodrygo', name: 'Rodrygo', team: 'Brazil', teamFlag: '🇧🇷', position: 'ATT', jerseyNumber: 11, rating: 84 },
  { id: 'bra-richarlison', name: 'Richarlison', team: 'Brazil', teamFlag: '🇧🇷', position: 'ATT', jerseyNumber: 9, rating: 83 },
  { id: 'bra-endrick', name: 'Endrick', team: 'Brazil', teamFlag: '🇧🇷', position: 'ATT', jerseyNumber: 19, rating: 82 },
  { id: 'bra-raphinha', name: 'Raphinha', team: 'Brazil', teamFlag: '🇧🇷', position: 'ATT', jerseyNumber: 22, rating: 83 },

  // ===== ARGENTINA =====
  { id: 'arg-martinez', name: 'Emiliano Martínez', team: 'Argentina', teamFlag: '🇦🇷', position: 'GK', jerseyNumber: 23, rating: 90 },
  { id: 'arg-romero', name: 'Cristian Romero', team: 'Argentina', teamFlag: '🇦🇷', position: 'DEF', jerseyNumber: 13, rating: 86 },
  { id: 'arg-otamendi', name: 'Nicolás Otamendi', team: 'Argentina', teamFlag: '🇦🇷', position: 'DEF', jerseyNumber: 19, rating: 83 },
  { id: 'arg-molina', name: 'Nahuel Molina', team: 'Argentina', teamFlag: '🇦🇷', position: 'DEF', jerseyNumber: 26, rating: 81 },
  { id: 'arg-depaul', name: 'Rodrigo de Paul', team: 'Argentina', teamFlag: '🇦🇷', position: 'MID', jerseyNumber: 7, rating: 84 },
  { id: 'arg-messi', name: 'Lionel Messi', team: 'Argentina', teamFlag: '🇦🇷', position: 'MID', jerseyNumber: 10, rating: 95 },
  { id: 'arg-lautaro', name: 'Lautaro Martínez', team: 'Argentina', teamFlag: '🇦🇷', position: 'ATT', jerseyNumber: 22, rating: 88 },
  { id: 'arg-alvarez', name: 'Julián Álvarez', team: 'Argentina', teamFlag: '🇦🇷', position: 'ATT', jerseyNumber: 9, rating: 86 },
  { id: 'arg-dybala', name: 'Paulo Dybala', team: 'Argentina', teamFlag: '🇦🇷', position: 'ATT', jerseyNumber: 21, rating: 84 },
  { id: 'arg-dimaria', name: 'Ángel Di María', team: 'Argentina', teamFlag: '🇦🇷', position: 'ATT', jerseyNumber: 11, rating: 82 },

  // ===== FRANCE =====
  { id: 'fra-maignan', name: 'Mike Maignan', team: 'France', teamFlag: '🇫🇷', position: 'GK', jerseyNumber: 16, rating: 88 },
  { id: 'fra-varane', name: 'Raphaël Varane', team: 'France', teamFlag: '🇫🇷', position: 'DEF', jerseyNumber: 4, rating: 85 },
  { id: 'fra-upamecano', name: 'Dayot Upamecano', team: 'France', teamFlag: '🇫🇷', position: 'DEF', jerseyNumber: 5, rating: 83 },
  { id: 'fra-theo', name: 'Theo Hernandez', team: 'France', teamFlag: '🇫🇷', position: 'DEF', jerseyNumber: 22, rating: 84 },
  { id: 'fra-kante', name: "N'Golo Kanté", team: 'France', teamFlag: '🇫🇷', position: 'MID', jerseyNumber: 13, rating: 87 },
  { id: 'fra-camavinga', name: 'Eduardo Camavinga', team: 'France', teamFlag: '🇫🇷', position: 'MID', jerseyNumber: 8, rating: 83 },
  { id: 'fra-mbappe', name: 'Kylian Mbappé', team: 'France', teamFlag: '🇫🇷', position: 'ATT', jerseyNumber: 10, rating: 95 },
  { id: 'fra-dembele', name: 'Ousmane Dembélé', team: 'France', teamFlag: '🇫🇷', position: 'ATT', jerseyNumber: 11, rating: 83 },
  { id: 'fra-griezmann', name: 'Antoine Griezmann', team: 'France', teamFlag: '🇫🇷', position: 'ATT', jerseyNumber: 7, rating: 87 },
  { id: 'fra-giroud', name: 'Olivier Giroud', team: 'France', teamFlag: '🇫🇷', position: 'ATT', jerseyNumber: 9, rating: 80 },

  // ===== ENGLAND =====
  { id: 'eng-pickford', name: 'Jordan Pickford', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'GK', jerseyNumber: 1, rating: 85 },
  { id: 'eng-stones', name: 'John Stones', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 5, rating: 83 },
  { id: 'eng-maguire', name: 'Harry Maguire', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 6, rating: 80 },
  { id: 'eng-alexander', name: 'Trent Alexander-Arnold', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 2, rating: 85 },
  { id: 'eng-bellingham', name: 'Jude Bellingham', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'MID', jerseyNumber: 10, rating: 92 },
  { id: 'eng-rice', name: 'Declan Rice', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'MID', jerseyNumber: 4, rating: 86 },
  { id: 'eng-kane', name: 'Harry Kane', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ATT', jerseyNumber: 9, rating: 90 },
  { id: 'eng-saka', name: 'Bukayo Saka', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ATT', jerseyNumber: 7, rating: 87 },
  { id: 'eng-rashford', name: 'Marcus Rashford', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ATT', jerseyNumber: 11, rating: 83 },
  { id: 'eng-foden', name: 'Phil Foden', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ATT', jerseyNumber: 20, rating: 88 },

  // ===== PORTUGAL =====
  { id: 'por-costa', name: 'Diogo Costa', team: 'Portugal', teamFlag: '🇵🇹', position: 'GK', jerseyNumber: 1, rating: 86 },
  { id: 'por-cancelo', name: 'João Cancelo', team: 'Portugal', teamFlag: '🇵🇹', position: 'DEF', jerseyNumber: 20, rating: 85 },
  { id: 'por-dias', name: 'Rúben Dias', team: 'Portugal', teamFlag: '🇵🇹', position: 'DEF', jerseyNumber: 4, rating: 88 },
  { id: 'por-guerreiro', name: 'Raphaël Guerreiro', team: 'Portugal', teamFlag: '🇵🇹', position: 'DEF', jerseyNumber: 22, rating: 82 },
  { id: 'por-bruno', name: 'Bruno Fernandes', team: 'Portugal', teamFlag: '🇵🇹', position: 'MID', jerseyNumber: 8, rating: 89 },
  { id: 'por-vitinha', name: 'Vitinha', team: 'Portugal', teamFlag: '🇵🇹', position: 'MID', jerseyNumber: 16, rating: 83 },
  { id: 'por-ronaldo', name: 'Cristiano Ronaldo', team: 'Portugal', teamFlag: '🇵🇹', position: 'ATT', jerseyNumber: 7, rating: 88 },
  { id: 'por-felix', name: 'João Félix', team: 'Portugal', teamFlag: '🇵🇹', position: 'ATT', jerseyNumber: 11, rating: 83 },
  { id: 'por-leao', name: 'Rafael Leão', team: 'Portugal', teamFlag: '🇵🇹', position: 'ATT', jerseyNumber: 15, rating: 84 },

  // ===== SPAIN =====
  { id: 'esp-unai', name: 'Unai Simón', team: 'Spain', teamFlag: '🇪🇸', position: 'GK', jerseyNumber: 1, rating: 84 },
  { id: 'esp-carvajal', name: 'Dani Carvajal', team: 'Spain', teamFlag: '🇪🇸', position: 'DEF', jerseyNumber: 2, rating: 83 },
  { id: 'esp-laporte', name: 'Aymeric Laporte', team: 'Spain', teamFlag: '🇪🇸', position: 'DEF', jerseyNumber: 14, rating: 84 },
  { id: 'esp-pedri', name: 'Pedri', team: 'Spain', teamFlag: '🇪🇸', position: 'MID', jerseyNumber: 26, rating: 88 },
  { id: 'esp-gavi', name: 'Gavi', team: 'Spain', teamFlag: '🇪🇸', position: 'MID', jerseyNumber: 9, rating: 86 },
  { id: 'esp-rodri', name: 'Rodri', team: 'Spain', teamFlag: '🇪🇸', position: 'MID', jerseyNumber: 16, rating: 90 },
  { id: 'esp-morata', name: 'Álvaro Morata', team: 'Spain', teamFlag: '🇪🇸', position: 'ATT', jerseyNumber: 7, rating: 83 },
  { id: 'esp-yamal', name: 'Lamine Yamal', team: 'Spain', teamFlag: '🇪🇸', position: 'ATT', jerseyNumber: 19, rating: 90 },
  { id: 'esp-nico', name: 'Nico Williams', team: 'Spain', teamFlag: '🇪🇸', position: 'ATT', jerseyNumber: 17, rating: 86 },

  // ===== GERMANY =====
  { id: 'ger-neuer', name: 'Manuel Neuer', team: 'Germany', teamFlag: '🇩🇪', position: 'GK', jerseyNumber: 1, rating: 85 },
  { id: 'ger-rudiger', name: 'Antonio Rüdiger', team: 'Germany', teamFlag: '🇩🇪', position: 'DEF', jerseyNumber: 2, rating: 84 },
  { id: 'ger-kimmich', name: 'Joshua Kimmich', team: 'Germany', teamFlag: '🇩🇪', position: 'MID', jerseyNumber: 6, rating: 88 },
  { id: 'ger-kroos', name: 'Toni Kroos', team: 'Germany', teamFlag: '🇩🇪', position: 'MID', jerseyNumber: 8, rating: 88 },
  { id: 'ger-musiala', name: 'Jamal Musiala', team: 'Germany', teamFlag: '🇩🇪', position: 'MID', jerseyNumber: 10, rating: 87 },
  { id: 'ger-havertz', name: 'Kai Havertz', team: 'Germany', teamFlag: '🇩🇪', position: 'ATT', jerseyNumber: 7, rating: 84 },
  { id: 'ger-wirtz', name: 'Florian Wirtz', team: 'Germany', teamFlag: '🇩🇪', position: 'ATT', jerseyNumber: 17, rating: 89 },
];

// Get all unique teams
export function getTeams(): string[] {
  return [...new Set(WORLD_CUP_PLAYERS.map((p) => p.team))].sort();
}

// Get players by team
export function getPlayersByTeam(team: string): Player[] {
  return WORLD_CUP_PLAYERS.filter((p) => p.team === team);
}

// Get players by position
export function getPlayersByPosition(position: string): Player[] {
  return WORLD_CUP_PLAYERS.filter((p) => p.position === position);
}

// Get player by ID
export function getPlayerById(id: string): Player | undefined {
  return WORLD_CUP_PLAYERS.find((p) => p.id === id);
}

// Search players
export function searchPlayers(query: string, team?: string): Player[] {
  const q = query.toLowerCase();
  return WORLD_CUP_PLAYERS.filter(
    (p) =>
      (p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)) &&
      (!team || p.team === team)
  );
}

// Demo fixtures (World Cup 2026 - using real match IDs where possible)
export interface DemoFixture {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  kickoffAt: string;
  status: 'upcoming' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
}

export const DEMO_FIXTURES: DemoFixture[] = [
  {
    fixtureId: 'wc2026-arg-fra',
    homeTeam: 'Argentina',
    awayTeam: 'France',
    homeFlag: '🇦🇷',
    awayFlag: '🇫🇷',
    kickoffAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // started 45 mins ago
    status: 'live',
    homeScore: 1,
    awayScore: 0,
  },
  {
    fixtureId: 'wc2026-bra-eng',
    homeTeam: 'Brazil',
    awayTeam: 'England',
    homeFlag: '🇧🇷',
    awayFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    kickoffAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
    status: 'upcoming',
  },
  {
    fixtureId: 'wc2026-por-ger',
    homeTeam: 'Portugal',
    awayTeam: 'Germany',
    homeFlag: '🇵🇹',
    awayFlag: '🇩🇪',
    kickoffAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    status: 'upcoming',
  },
  {
    fixtureId: 'wc2026-ita-esp',
    homeTeam: 'Italy',
    awayTeam: 'Spain',
    homeFlag: '🇮🇹',
    awayFlag: '🇪🇸',
    kickoffAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 2 days from now
    status: 'upcoming',
  },
  {
    fixtureId: 'wc2026-spa-ger',
    homeTeam: 'Spain',
    awayTeam: 'Germany',
    homeFlag: '🇪🇸',
    awayFlag: '🇩🇪',
    kickoffAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    status: 'finished',
    homeScore: 2,
    awayScore: 1,
  },
  {
    fixtureId: 'wc2026-jpn-cro',
    homeTeam: 'Japan',
    awayTeam: 'Croatia',
    homeFlag: '🇯🇵',
    awayFlag: '🇭🇷',
    kickoffAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    status: 'finished',
    homeScore: 1,
    awayScore: 1, // Let's say it went to penalties, but 1-1 at FT
  },
  {
    fixtureId: 'wc2026-por-bra-qf',
    homeTeam: 'Portugal',
    awayTeam: 'Brazil',
    homeFlag: '🇵🇹',
    awayFlag: '🇧🇷',
    kickoffAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    status: 'finished',
    homeScore: 1,
    awayScore: 3,
  },
];
