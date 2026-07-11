// World Cup 2026 Player Registry — OddsDraft
// Primary source: Supabase `players` table (synced from football-data.org via /api/admin/sync-players)
// Fallback: static WORLD_CUP_PLAYERS array below (used when Supabase is unavailable or not yet synced)

export interface Player {
  id: string;
  name: string;
  team: string;
  teamFlag: string;
  position: 'GK' | 'DEF' | 'MID' | 'ATT' | 'SWG';
  photoUrl?: string;
  nationality?: string;
  jerseyNumber?: number;
  rating?: number; // AI-estimated quality 0-100
}

export const WORLD_CUP_PLAYERS: Player[] = [
  // ===== BRAZIL =====
  { id: 'bra-alisson', name: 'Alisson', team: 'Brazil', teamFlag: '🇧🇷', position: 'GK', jerseyNumber: 1, rating: 92 },
  { id: 'bra-ederson', name: 'Ederson', team: 'Brazil', teamFlag: '🇧🇷', position: 'GK', jerseyNumber: 23, rating: 90 },
  { id: 'bra-marquinhos', name: 'Marquinhos', team: 'Brazil', teamFlag: '🇧🇷', position: 'DEF', jerseyNumber: 4, rating: 87 },
  { id: 'bra-militao', name: 'Éder Militão', team: 'Brazil', teamFlag: '🇧🇷', position: 'DEF', jerseyNumber: 3, rating: 85 },
  { id: 'bra-danilo', name: 'Danilo', team: 'Brazil', teamFlag: '🇧🇷', position: 'DEF', jerseyNumber: 2, rating: 80 },
  { id: 'bra-bremer', name: 'Bremer', team: 'Brazil', teamFlag: '🇧🇷', position: 'DEF', jerseyNumber: 14, rating: 82 },
  { id: 'bra-gabriel', name: 'Gabriel Magalhães', team: 'Brazil', teamFlag: '🇧🇷', position: 'DEF', jerseyNumber: 6, rating: 84 },
  { id: 'bra-casemiro', name: 'Casemiro', team: 'Brazil', teamFlag: '🇧🇷', position: 'MID', jerseyNumber: 5, rating: 86 },
  { id: 'bra-lucas', name: 'Lucas Paquetá', team: 'Brazil', teamFlag: '🇧🇷', position: 'MID', jerseyNumber: 10, rating: 84 },
  { id: 'bra-guimaraes', name: 'Bruno Guimarães', team: 'Brazil', teamFlag: '🇧🇷', position: 'MID', jerseyNumber: 8, rating: 85 },
  { id: 'bra-douglas', name: 'Douglas Luiz', team: 'Brazil', teamFlag: '🇧🇷', position: 'MID', jerseyNumber: 15, rating: 82 },
  { id: 'bra-vinicius', name: 'Vinícius Jr.', team: 'Brazil', teamFlag: '🇧🇷', position: 'SWG', jerseyNumber: 7, rating: 91 },
  { id: 'bra-rodrygo', name: 'Rodrygo', team: 'Brazil', teamFlag: '🇧🇷', position: 'SWG', jerseyNumber: 11, rating: 84 },
  { id: 'bra-richarlison', name: 'Richarlison', team: 'Brazil', teamFlag: '🇧🇷', position: 'ATT', jerseyNumber: 9, rating: 83 },
  { id: 'bra-endrick', name: 'Endrick', team: 'Brazil', teamFlag: '🇧🇷', position: 'ATT', jerseyNumber: 19, rating: 82 },
  { id: 'bra-raphinha', name: 'Raphinha', team: 'Brazil', teamFlag: '🇧🇷', position: 'SWG', jerseyNumber: 22, rating: 83 },
  { id: 'bra-martinelli', name: 'Gabriel Martinelli', team: 'Brazil', teamFlag: '🇧🇷', position: 'SWG', jerseyNumber: 21, rating: 84 },

  // ===== ARGENTINA =====
  { id: 'arg-martinez', name: 'Emiliano Martínez', team: 'Argentina', teamFlag: '🇦🇷', position: 'GK', jerseyNumber: 23, rating: 90 },
  { id: 'arg-rulli', name: 'Gerónimo Rulli', team: 'Argentina', teamFlag: '🇦🇷', position: 'GK', jerseyNumber: 1, rating: 81 },
  { id: 'arg-romero', name: 'Cristian Romero', team: 'Argentina', teamFlag: '🇦🇷', position: 'DEF', jerseyNumber: 13, rating: 86 },
  { id: 'arg-otamendi', name: 'Nicolás Otamendi', team: 'Argentina', teamFlag: '🇦🇷', position: 'DEF', jerseyNumber: 19, rating: 83 },
  { id: 'arg-molina', name: 'Nahuel Molina', team: 'Argentina', teamFlag: '🇦🇷', position: 'DEF', jerseyNumber: 26, rating: 81 },
  { id: 'arg-lisandro', name: 'Lisandro Martínez', team: 'Argentina', teamFlag: '🇦🇷', position: 'DEF', jerseyNumber: 25, rating: 84 },
  { id: 'arg-acuna', name: 'Marcos Acuña', team: 'Argentina', teamFlag: '🇦🇷', position: 'DEF', jerseyNumber: 8, rating: 80 },
  { id: 'arg-depaul', name: 'Rodrigo de Paul', team: 'Argentina', teamFlag: '🇦🇷', position: 'MID', jerseyNumber: 7, rating: 84 },
  { id: 'arg-messi', name: 'Lionel Messi', team: 'Argentina', teamFlag: '🇦🇷', position: 'MID', jerseyNumber: 10, rating: 95 },
  { id: 'arg-enzo', name: 'Enzo Fernández', team: 'Argentina', teamFlag: '🇦🇷', position: 'MID', jerseyNumber: 24, rating: 85 },
  { id: 'arg-macallister', name: 'Alexis Mac Allister', team: 'Argentina', teamFlag: '🇦🇷', position: 'MID', jerseyNumber: 20, rating: 86 },
  { id: 'arg-paredes', name: 'Leandro Paredes', team: 'Argentina', teamFlag: '🇦🇷', position: 'MID', jerseyNumber: 5, rating: 82 },
  { id: 'arg-lautaro', name: 'Lautaro Martínez', team: 'Argentina', teamFlag: '🇦🇷', position: 'ATT', jerseyNumber: 22, rating: 88 },
  { id: 'arg-alvarez', name: 'Julián Álvarez', team: 'Argentina', teamFlag: '🇦🇷', position: 'ATT', jerseyNumber: 9, rating: 86 },
  { id: 'arg-dybala', name: 'Paulo Dybala', team: 'Argentina', teamFlag: '🇦🇷', position: 'ATT', jerseyNumber: 21, rating: 84 },
  { id: 'arg-dimaria', name: 'Ángel Di María', team: 'Argentina', teamFlag: '🇦🇷', position: 'SWG', jerseyNumber: 11, rating: 82 },

  // ===== FRANCE =====
  { id: 'fra-maignan', name: 'Mike Maignan', team: 'France', teamFlag: '🇫🇷', position: 'GK', jerseyNumber: 16, rating: 88 },
  { id: 'fra-samba', name: 'Brice Samba', team: 'France', teamFlag: '🇫🇷', position: 'GK', jerseyNumber: 1, rating: 80 },
  { id: 'fra-upamecano', name: 'Dayot Upamecano', team: 'France', teamFlag: '🇫🇷', position: 'DEF', jerseyNumber: 4, rating: 83 },
  { id: 'fra-theo', name: 'Theo Hernandez', team: 'France', teamFlag: '🇫🇷', position: 'SWG', jerseyNumber: 22, rating: 84 },
  { id: 'fra-saliba', name: 'William Saliba', team: 'France', teamFlag: '🇫🇷', position: 'DEF', jerseyNumber: 17, rating: 88 },
  { id: 'fra-konate', name: 'Ibrahima Konaté', team: 'France', teamFlag: '🇫🇷', position: 'DEF', jerseyNumber: 24, rating: 83 },
  { id: 'fra-kounde', name: 'Jules Koundé', team: 'France', teamFlag: '🇫🇷', position: 'DEF', jerseyNumber: 5, rating: 84 },
  { id: 'fra-kante', name: "N'Golo Kanté", team: 'France', teamFlag: '🇫🇷', position: 'MID', jerseyNumber: 13, rating: 87 },
  { id: 'fra-camavinga', name: 'Eduardo Camavinga', team: 'France', teamFlag: '🇫🇷', position: 'MID', jerseyNumber: 8, rating: 83 },
  { id: 'fra-tchouameni', name: 'Aurélien Tchouaméni', team: 'France', teamFlag: '🇫🇷', position: 'MID', jerseyNumber: 14, rating: 85 },
  { id: 'fra-rabiot', name: 'Adrien Rabiot', team: 'France', teamFlag: '🇫🇷', position: 'MID', jerseyNumber: 25, rating: 82 },
  { id: 'fra-mbappe', name: 'Kylian Mbappé', team: 'France', teamFlag: '🇫🇷', position: 'SWG', jerseyNumber: 10, rating: 95 },
  { id: 'fra-dembele', name: 'Ousmane Dembélé', team: 'France', teamFlag: '🇫🇷', position: 'SWG', jerseyNumber: 11, rating: 83 },
  { id: 'fra-griezmann', name: 'Antoine Griezmann', team: 'France', teamFlag: '🇫🇷', position: 'ATT', jerseyNumber: 7, rating: 87 },
  { id: 'fra-giroud', name: 'Olivier Giroud', team: 'France', teamFlag: '🇫🇷', position: 'ATT', jerseyNumber: 9, rating: 80 },
  { id: 'fra-coman', name: 'Kingsley Coman', team: 'France', teamFlag: '🇫🇷', position: 'SWG', jerseyNumber: 20, rating: 84 },
  { id: 'fra-thuram', name: 'Marcus Thuram', team: 'France', teamFlag: '🇫🇷', position: 'ATT', jerseyNumber: 15, rating: 82 },

  // ===== ENGLAND =====
  { id: 'eng-pickford', name: 'Jordan Pickford', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'GK', jerseyNumber: 1, rating: 85 },
  { id: 'eng-ramsdale', name: 'Aaron Ramsdale', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'GK', jerseyNumber: 13, rating: 82 },
  { id: 'eng-stones', name: 'John Stones', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 5, rating: 83 },
  { id: 'eng-maguire', name: 'Harry Maguire', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 6, rating: 80 },
  { id: 'eng-alexander', name: 'Trent Alexander-Arnold', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'SWG', jerseyNumber: 2, rating: 85 },
  { id: 'eng-walker', name: 'Kyle Walker', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 12, rating: 84 },
  { id: 'eng-trippier', name: 'Kieran Trippier', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 3, rating: 81 },
  { id: 'eng-guehi', name: 'Marc Guéhi', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 14, rating: 82 },
  { id: 'eng-bellingham', name: 'Jude Bellingham', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'MID', jerseyNumber: 10, rating: 92 },
  { id: 'eng-rice', name: 'Declan Rice', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'MID', jerseyNumber: 4, rating: 86 },
  { id: 'eng-gallagher', name: 'Conor Gallagher', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'MID', jerseyNumber: 18, rating: 81 },
  { id: 'eng-mainoo', name: 'Kobbie Mainoo', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'MID', jerseyNumber: 21, rating: 83 },
  { id: 'eng-kane', name: 'Harry Kane', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ATT', jerseyNumber: 9, rating: 90 },
  { id: 'eng-saka', name: 'Bukayo Saka', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'SWG', jerseyNumber: 7, rating: 87 },
  { id: 'eng-rashford', name: 'Marcus Rashford', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'SWG', jerseyNumber: 11, rating: 83 },
  { id: 'eng-foden', name: 'Phil Foden', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ATT', jerseyNumber: 20, rating: 88 },
  { id: 'eng-palmer', name: 'Cole Palmer', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ATT', jerseyNumber: 24, rating: 88 },

  // ===== PORTUGAL =====
  { id: 'por-costa', name: 'Diogo Costa', team: 'Portugal', teamFlag: '🇵🇹', position: 'GK', jerseyNumber: 1, rating: 86 },
  { id: 'por-sa', name: 'José Sá', team: 'Portugal', teamFlag: '🇵🇹', position: 'GK', jerseyNumber: 12, rating: 79 },
  { id: 'por-cancelo', name: 'João Cancelo', team: 'Portugal', teamFlag: '🇵🇹', position: 'SWG', jerseyNumber: 20, rating: 85 },
  { id: 'por-dias', name: 'Rúben Dias', team: 'Portugal', teamFlag: '🇵🇹', position: 'DEF', jerseyNumber: 4, rating: 88 },
  { id: 'por-guerreiro', name: 'Raphaël Guerreiro', team: 'Portugal', teamFlag: '🇵🇹', position: 'DEF', jerseyNumber: 22, rating: 82 },
  { id: 'por-pepe', name: 'Pepe', team: 'Portugal', teamFlag: '🇵🇹', position: 'DEF', jerseyNumber: 3, rating: 80 },
  { id: 'por-mendes', name: 'Nuno Mendes', team: 'Portugal', teamFlag: '🇵🇹', position: 'DEF', jerseyNumber: 19, rating: 83 },
  { id: 'por-dalot', name: 'Diogo Dalot', team: 'Portugal', teamFlag: '🇵🇹', position: 'DEF', jerseyNumber: 2, rating: 81 },
  { id: 'por-bruno', name: 'Bruno Fernandes', team: 'Portugal', teamFlag: '🇵🇹', position: 'MID', jerseyNumber: 8, rating: 89 },
  { id: 'por-vitinha', name: 'Vitinha', team: 'Portugal', teamFlag: '🇵🇹', position: 'MID', jerseyNumber: 16, rating: 83 },
  { id: 'por-palhinha', name: 'João Palhinha', team: 'Portugal', teamFlag: '🇵🇹', position: 'MID', jerseyNumber: 6, rating: 84 },
  { id: 'por-neves', name: 'Rúben Neves', team: 'Portugal', teamFlag: '🇵🇹', position: 'MID', jerseyNumber: 18, rating: 81 },
  { id: 'por-otavio', name: 'Otávio', team: 'Portugal', teamFlag: '🇵🇹', position: 'MID', jerseyNumber: 25, rating: 80 },
  { id: 'por-ronaldo', name: 'Cristiano Ronaldo', team: 'Portugal', teamFlag: '🇵🇹', position: 'ATT', jerseyNumber: 7, rating: 88 },
  { id: 'por-felix', name: 'João Félix', team: 'Portugal', teamFlag: '🇵🇹', position: 'ATT', jerseyNumber: 11, rating: 83 },
  { id: 'por-leao', name: 'Rafael Leão', team: 'Portugal', teamFlag: '🇵🇹', position: 'SWG', jerseyNumber: 15, rating: 84 },
  { id: 'por-jota', name: 'Diogo Jota', team: 'Portugal', teamFlag: '🇵🇹', position: 'ATT', jerseyNumber: 21, rating: 83 },
  { id: 'por-ramos', name: 'Gonçalo Ramos', team: 'Portugal', teamFlag: '🇵🇹', position: 'ATT', jerseyNumber: 9, rating: 81 },

  // ===== SPAIN =====
  { id: 'esp-unai', name: 'Unai Simón', team: 'Spain', teamFlag: '🇪🇸', position: 'GK', jerseyNumber: 1, rating: 84 },
  { id: 'esp-raya', name: 'David Raya', team: 'Spain', teamFlag: '🇪🇸', position: 'GK', jerseyNumber: 13, rating: 82 },
  { id: 'esp-carvajal', name: 'Dani Carvajal', team: 'Spain', teamFlag: '🇪🇸', position: 'DEF', jerseyNumber: 2, rating: 83 },
  { id: 'esp-laporte', name: 'Aymeric Laporte', team: 'Spain', teamFlag: '🇪🇸', position: 'DEF', jerseyNumber: 14, rating: 84 },
  { id: 'esp-lenormand', name: 'Robin Le Normand', team: 'Spain', teamFlag: '🇪🇸', position: 'DEF', jerseyNumber: 3, rating: 81 },
  { id: 'esp-grimaldo', name: 'Alejandro Grimaldo', team: 'Spain', teamFlag: '🇪🇸', position: 'SWG', jerseyNumber: 12, rating: 84 },
  { id: 'esp-cucurella', name: 'Marc Cucurella', team: 'Spain', teamFlag: '🇪🇸', position: 'DEF', jerseyNumber: 24, rating: 82 },
  { id: 'esp-pedri', name: 'Pedri', team: 'Spain', teamFlag: '🇪🇸', position: 'MID', jerseyNumber: 26, rating: 88 },
  { id: 'esp-gavi', name: 'Gavi', team: 'Spain', teamFlag: '🇪🇸', position: 'MID', jerseyNumber: 9, rating: 86 },
  { id: 'esp-rodri', name: 'Rodri', team: 'Spain', teamFlag: '🇪🇸', position: 'MID', jerseyNumber: 16, rating: 90 },
  { id: 'esp-fabian', name: 'Fabián Ruiz', team: 'Spain', teamFlag: '🇪🇸', position: 'MID', jerseyNumber: 8, rating: 84 },
  { id: 'esp-merino', name: 'Mikel Merino', team: 'Spain', teamFlag: '🇪🇸', position: 'MID', jerseyNumber: 6, rating: 82 },
  { id: 'esp-morata', name: 'Álvaro Morata', team: 'Spain', teamFlag: '🇪🇸', position: 'ATT', jerseyNumber: 7, rating: 83 },
  { id: 'esp-yamal', name: 'Lamine Yamal', team: 'Spain', teamFlag: '🇪🇸', position: 'SWG', jerseyNumber: 19, rating: 90 },
  { id: 'esp-nico', name: 'Nico Williams', team: 'Spain', teamFlag: '🇪🇸', position: 'SWG', jerseyNumber: 17, rating: 86 },
  { id: 'esp-olmo', name: 'Dani Olmo', team: 'Spain', teamFlag: '🇪🇸', position: 'ATT', jerseyNumber: 10, rating: 86 },
  { id: 'esp-torres', name: 'Ferran Torres', team: 'Spain', teamFlag: '🇪🇸', position: 'SWG', jerseyNumber: 11, rating: 81 },

  // ===== GERMANY =====
  { id: 'ger-neuer', name: 'Manuel Neuer', team: 'Germany', teamFlag: '🇩🇪', position: 'GK', jerseyNumber: 1, rating: 85 },
  { id: 'ger-terstegen', name: 'Marc-André ter Stegen', team: 'Germany', teamFlag: '🇩🇪', position: 'GK', jerseyNumber: 22, rating: 86 },
  { id: 'ger-rudiger', name: 'Antonio Rüdiger', team: 'Germany', teamFlag: '🇩🇪', position: 'DEF', jerseyNumber: 2, rating: 84 },
  { id: 'ger-tah', name: 'Jonathan Tah', team: 'Germany', teamFlag: '🇩🇪', position: 'DEF', jerseyNumber: 4, rating: 82 },
  { id: 'ger-raum', name: 'David Raum', team: 'Germany', teamFlag: '🇩🇪', position: 'SWG', jerseyNumber: 3, rating: 81 },
  { id: 'ger-henrichs', name: 'Benjamin Henrichs', team: 'Germany', teamFlag: '🇩🇪', position: 'DEF', jerseyNumber: 20, rating: 79 },
  { id: 'ger-schlotterbeck', name: 'Nico Schlotterbeck', team: 'Germany', teamFlag: '🇩🇪', position: 'DEF', jerseyNumber: 15, rating: 81 },
  { id: 'ger-kimmich', name: 'Joshua Kimmich', team: 'Germany', teamFlag: '🇩🇪', position: 'MID', jerseyNumber: 6, rating: 88 },
  { id: 'ger-kroos', name: 'Toni Kroos', team: 'Germany', teamFlag: '🇩🇪', position: 'MID', jerseyNumber: 8, rating: 88 },
  { id: 'ger-gundogan', name: 'Ilkay Gündoğan', team: 'Germany', teamFlag: '🇩🇪', position: 'MID', jerseyNumber: 21, rating: 86 },
  { id: 'ger-musiala', name: 'Jamal Musiala', team: 'Germany', teamFlag: '🇩🇪', position: 'MID', jerseyNumber: 10, rating: 87 },
  { id: 'ger-andrich', name: 'Robert Andrich', team: 'Germany', teamFlag: '🇩🇪', position: 'MID', jerseyNumber: 23, rating: 80 },
  { id: 'ger-gross', name: 'Pascal Groß', team: 'Germany', teamFlag: '🇩🇪', position: 'MID', jerseyNumber: 5, rating: 81 },
  { id: 'ger-havertz', name: 'Kai Havertz', team: 'Germany', teamFlag: '🇩🇪', position: 'ATT', jerseyNumber: 7, rating: 84 },
  { id: 'ger-wirtz', name: 'Florian Wirtz', team: 'Germany', teamFlag: '🇩🇪', position: 'ATT', jerseyNumber: 17, rating: 89 },
  { id: 'ger-sane', name: 'Leroy Sané', team: 'Germany', teamFlag: '🇩🇪', position: 'SWG', jerseyNumber: 19, rating: 84 },
  { id: 'ger-muller', name: 'Thomas Müller', team: 'Germany', teamFlag: '🇩🇪', position: 'ATT', jerseyNumber: 13, rating: 81 },

  // ===== ITALY =====
  { id: 'ita-donnarumma', name: 'Gianluigi Donnarumma', team: 'Italy', teamFlag: '🇮🇹', position: 'GK', jerseyNumber: 1, rating: 88 },
  { id: 'ita-vicario', name: 'Guglielmo Vicario', team: 'Italy', teamFlag: '🇮🇹', position: 'GK', jerseyNumber: 12, rating: 83 },
  { id: 'ita-bastoni', name: 'Alessandro Bastoni', team: 'Italy', teamFlag: '🇮🇹', position: 'DEF', jerseyNumber: 95, rating: 86 },
  { id: 'ita-dimarco', name: 'Federico Dimarco', team: 'Italy', teamFlag: '🇮🇹', position: 'DEF', jerseyNumber: 3, rating: 85 },
  { id: 'ita-buongiorno', name: 'Alessandro Buongiorno', team: 'Italy', teamFlag: '🇮🇹', position: 'DEF', jerseyNumber: 4, rating: 82 },
  { id: 'ita-calafiori', name: 'Riccardo Calafiori', team: 'Italy', teamFlag: '🇮🇹', position: 'DEF', jerseyNumber: 5, rating: 81 },
  { id: 'ita-barella', name: 'Nicolò Barella', team: 'Italy', teamFlag: '🇮🇹', position: 'MID', jerseyNumber: 18, rating: 87 },
  { id: 'ita-tonali', name: 'Sandro Tonali', team: 'Italy', teamFlag: '🇮🇹', position: 'MID', jerseyNumber: 8, rating: 84 },
  { id: 'ita-frattesi', name: 'Davide Frattesi', team: 'Italy', teamFlag: '🇮🇹', position: 'MID', jerseyNumber: 16, rating: 83 },
  { id: 'ita-chiesa', name: 'Federico Chiesa', team: 'Italy', teamFlag: '🇮🇹', position: 'ATT', jerseyNumber: 14, rating: 84 },
  { id: 'ita-scamacca', name: 'Gianluca Scamacca', team: 'Italy', teamFlag: '🇮🇹', position: 'ATT', jerseyNumber: 9, rating: 82 },
  { id: 'ita-raspadori', name: 'Giacomo Raspadori', team: 'Italy', teamFlag: '🇮🇹', position: 'ATT', jerseyNumber: 11, rating: 80 },
  
  // ===== SOUTH KOREA =====
  { id: 'kor-seunggyu', name: 'Kim Seung-gyu', team: 'South Korea', teamFlag: '🇰🇷', position: 'GK', jerseyNumber: 1, rating: 77 },
  { id: 'kor-minjae', name: 'Kim Min-jae', team: 'South Korea', teamFlag: '🇰🇷', position: 'DEF', jerseyNumber: 4, rating: 86 },
  { id: 'kor-younggwon', name: 'Kim Young-gwon', team: 'South Korea', teamFlag: '🇰🇷', position: 'DEF', jerseyNumber: 19, rating: 75 },
  { id: 'kor-jinsu', name: 'Kim Jin-su', team: 'South Korea', teamFlag: '🇰🇷', position: 'DEF', jerseyNumber: 3, rating: 76 },
  { id: 'kor-kangin', name: 'Lee Kang-in', team: 'South Korea', teamFlag: '🇰🇷', position: 'MID', jerseyNumber: 18, rating: 83 },
  { id: 'kor-inbeom', name: 'Hwang In-beom', team: 'South Korea', teamFlag: '🇰🇷', position: 'MID', jerseyNumber: 6, rating: 78 },
  { id: 'kor-jaesung', name: 'Lee Jae-sung', team: 'South Korea', teamFlag: '🇰🇷', position: 'MID', jerseyNumber: 10, rating: 77 },
  { id: 'kor-heungmin', name: 'Son Heung-min', team: 'South Korea', teamFlag: '🇰🇷', position: 'ATT', jerseyNumber: 7, rating: 88 },
  { id: 'kor-heechan', name: 'Hwang Hee-chan', team: 'South Korea', teamFlag: '🇰🇷', position: 'ATT', jerseyNumber: 11, rating: 81 },
  { id: 'kor-guesung', name: 'Cho Gue-sung', team: 'South Korea', teamFlag: '🇰🇷', position: 'ATT', jerseyNumber: 9, rating: 76 },
  { id: 'kor-hyunjun', name: 'Yang Hyun-jun', team: 'South Korea', teamFlag: '🇰🇷', position: 'ATT', jerseyNumber: 20, rating: 74 },
  // ===== NETHERLANDS =====
  { id: 'ned-flekken', name: 'Mark Flekken', team: 'Netherlands', teamFlag: '🇳🇱', position: 'GK', jerseyNumber: 1, rating: 80 },
  { id: 'ned-vandijk', name: 'Virgil van Dijk', team: 'Netherlands', teamFlag: '🇳🇱', position: 'DEF', jerseyNumber: 4, rating: 89 },
  { id: 'ned-ake', name: 'Nathan Aké', team: 'Netherlands', teamFlag: '🇳🇱', position: 'DEF', jerseyNumber: 5, rating: 84 },
  { id: 'ned-dumfries', name: 'Denzel Dumfries', team: 'Netherlands', teamFlag: '🇳🇱', position: 'DEF', jerseyNumber: 22, rating: 82 },
  { id: 'ned-dejong', name: 'Frenkie de Jong', team: 'Netherlands', teamFlag: '🇳🇱', position: 'MID', jerseyNumber: 21, rating: 86 },
  { id: 'ned-simons', name: 'Xavi Simons', team: 'Netherlands', teamFlag: '🇳🇱', position: 'MID', jerseyNumber: 7, rating: 84 },
  { id: 'ned-gakpo', name: 'Cody Gakpo', team: 'Netherlands', teamFlag: '🇳🇱', position: 'ATT', jerseyNumber: 11, rating: 84 },
  { id: 'ned-depay', name: 'Memphis Depay', team: 'Netherlands', teamFlag: '🇳🇱', position: 'ATT', jerseyNumber: 10, rating: 83 },
  { id: 'ned-malen', name: 'Donyell Malen', team: 'Netherlands', teamFlag: '🇳🇱', position: 'ATT', jerseyNumber: 18, rating: 81 },
  { id: 'ned-koopmeiners', name: 'Teun Koopmeiners', team: 'Netherlands', teamFlag: '🇳🇱', position: 'MID', jerseyNumber: 20, rating: 82 },
  { id: 'ned-deligt', name: 'Matthijs de Ligt', team: 'Netherlands', teamFlag: '🇳🇱', position: 'DEF', jerseyNumber: 3, rating: 84 },
  { id: 'ned-blind', name: 'Daley Blind', team: 'Netherlands', teamFlag: '🇳🇱', position: 'DEF', jerseyNumber: 17, rating: 79 },
  { id: 'ned-reijnders', name: 'Tijjani Reijnders', team: 'Netherlands', teamFlag: '🇳🇱', position: 'MID', jerseyNumber: 14, rating: 81 },
  { id: 'ned-verbruggen', name: 'Bart Verbruggen', team: 'Netherlands', teamFlag: '🇳🇱', position: 'GK', jerseyNumber: 23, rating: 78 },
  { id: 'ned-weghorst', name: 'Wout Weghorst', team: 'Netherlands', teamFlag: '🇳🇱', position: 'ATT', jerseyNumber: 9, rating: 79 },

  // ===== USA =====
  { id: 'usa-turner', name: 'Matt Turner', team: 'USA', teamFlag: '🇺🇸', position: 'GK', jerseyNumber: 1, rating: 78 },
  { id: 'usa-robinson', name: 'Antonee Robinson', team: 'USA', teamFlag: '🇺🇸', position: 'DEF', jerseyNumber: 5, rating: 79 },
  { id: 'usa-dest', name: 'Sergiño Dest', team: 'USA', teamFlag: '🇺🇸', position: 'DEF', jerseyNumber: 2, rating: 78 },
  { id: 'usa-richards', name: 'Chris Richards', team: 'USA', teamFlag: '🇺🇸', position: 'DEF', jerseyNumber: 3, rating: 77 },
  { id: 'usa-mckennie', name: 'Weston McKennie', team: 'USA', teamFlag: '🇺🇸', position: 'MID', jerseyNumber: 8, rating: 80 },
  { id: 'usa-adams', name: 'Tyler Adams', team: 'USA', teamFlag: '🇺🇸', position: 'MID', jerseyNumber: 4, rating: 79 },
  { id: 'usa-pulisic', name: 'Christian Pulisic', team: 'USA', teamFlag: '🇺🇸', position: 'ATT', jerseyNumber: 10, rating: 82 },
  { id: 'usa-weah', name: 'Tim Weah', team: 'USA', teamFlag: '🇺🇸', position: 'ATT', jerseyNumber: 21, rating: 77 },
  { id: 'usa-balogun', name: 'Folarin Balogun', team: 'USA', teamFlag: '🇺🇸', position: 'ATT', jerseyNumber: 20, rating: 79 },
  { id: 'usa-musah', name: 'Yunus Musah', team: 'USA', teamFlag: '🇺🇸', position: 'MID', jerseyNumber: 6, rating: 78 },
  { id: 'usa-reyna', name: 'Gio Reyna', team: 'USA', teamFlag: '🇺🇸', position: 'MID', jerseyNumber: 7, rating: 78 },
  { id: 'usa-zimmerman', name: 'Walker Zimmerman', team: 'USA', teamFlag: '🇺🇸', position: 'DEF', jerseyNumber: 13, rating: 75 },
  { id: 'usa-horvath', name: 'Ethan Horvath', team: 'USA', teamFlag: '🇺🇸', position: 'GK', jerseyNumber: 18, rating: 74 },

  // ===== JAPAN =====
  { id: 'jpn-yoshida', name: 'Maya Yoshida', team: 'Japan', teamFlag: '🇯🇵', position: 'DEF', jerseyNumber: 22, rating: 78 },
  { id: 'jpn-tomiyasu', name: 'Takehiro Tomiyasu', team: 'Japan', teamFlag: '🇯🇵', position: 'DEF', jerseyNumber: 16, rating: 84 },
  { id: 'jpn-itakura', name: 'Ko Itakura', team: 'Japan', teamFlag: '🇯🇵', position: 'DEF', jerseyNumber: 4, rating: 81 },
  { id: 'jpn-ito', name: 'Hiroki Ito', team: 'Japan', teamFlag: '🇯🇵', position: 'DEF', jerseyNumber: 21, rating: 80 },
  { id: 'jpn-endo', name: 'Wataru Endo', team: 'Japan', teamFlag: '🇯🇵', position: 'MID', jerseyNumber: 6, rating: 83 },
  { id: 'jpn-morita', name: 'Hidemasa Morita', team: 'Japan', teamFlag: '🇯🇵', position: 'MID', jerseyNumber: 5, rating: 80 },
  { id: 'jpn-kamada', name: 'Daichi Kamada', team: 'Japan', teamFlag: '🇯🇵', position: 'MID', jerseyNumber: 15, rating: 81 },
  { id: 'jpn-mitoma', name: 'Kaoru Mitoma', team: 'Japan', teamFlag: '🇯🇵', position: 'MID', jerseyNumber: 7, rating: 85 },
  { id: 'jpn-kubo', name: 'Takefusa Kubo', team: 'Japan', teamFlag: '🇯🇵', position: 'MID', jerseyNumber: 20, rating: 84 },
  { id: 'jpn-maeda', name: 'Daizen Maeda', team: 'Japan', teamFlag: '🇯🇵', position: 'ATT', jerseyNumber: 11, rating: 79 },
  { id: 'jpn-ueda', name: 'Ayase Ueda', team: 'Japan', teamFlag: '🇯🇵', position: 'ATT', jerseyNumber: 9, rating: 80 },
  { id: 'jpn-asano', name: 'Takuma Asano', team: 'Japan', teamFlag: '🇯🇵', position: 'ATT', jerseyNumber: 18, rating: 78 },

  // ===== CROATIA =====
  { id: 'cro-livakovic', name: 'Dominik Livaković', team: 'Croatia', teamFlag: '🇭🇷', position: 'GK', jerseyNumber: 1, rating: 84 },
  { id: 'cro-ivusic', name: 'Ivica Ivušić', team: 'Croatia', teamFlag: '🇭🇷', position: 'GK', jerseyNumber: 12, rating: 77 },
  { id: 'cro-gvardiol', name: 'Joško Gvardiol', team: 'Croatia', teamFlag: '🇭🇷', position: 'DEF', jerseyNumber: 20, rating: 88 },
  { id: 'cro-lovren', name: 'Dejan Lovren', team: 'Croatia', teamFlag: '🇭🇷', position: 'DEF', jerseyNumber: 6, rating: 78 },
  { id: 'cro-vida', name: 'Domagoj Vida', team: 'Croatia', teamFlag: '🇭🇷', position: 'DEF', jerseyNumber: 21, rating: 77 },
  { id: 'cro-sutalo', name: 'Josip Šutalo', team: 'Croatia', teamFlag: '🇭🇷', position: 'DEF', jerseyNumber: 4, rating: 80 },
  { id: 'cro-sosa', name: 'Borna Sosa', team: 'Croatia', teamFlag: '🇭🇷', position: 'DEF', jerseyNumber: 3, rating: 79 },
  { id: 'cro-modric', name: 'Luka Modrić', team: 'Croatia', teamFlag: '🇭🇷', position: 'MID', jerseyNumber: 10, rating: 88 },
  { id: 'cro-kovacic', name: 'Mateo Kovačić', team: 'Croatia', teamFlag: '🇭🇷', position: 'MID', jerseyNumber: 8, rating: 84 },
  { id: 'cro-brozovic', name: 'Marcelo Brozović', team: 'Croatia', teamFlag: '🇭🇷', position: 'MID', jerseyNumber: 11, rating: 81 },
  { id: 'cro-pasalic', name: 'Mario Pašalić', team: 'Croatia', teamFlag: '🇭🇷', position: 'MID', jerseyNumber: 15, rating: 80 },
  { id: 'cro-perisic', name: 'Ivan Perišić', team: 'Croatia', teamFlag: '🇭🇷', position: 'ATT', jerseyNumber: 4, rating: 82 },
  { id: 'cro-kramaric', name: 'Andrej Kramarić', team: 'Croatia', teamFlag: '🇭🇷', position: 'ATT', jerseyNumber: 9, rating: 81 },
  { id: 'cro-petkovic', name: 'Bruno Petković', team: 'Croatia', teamFlag: '🇭🇷', position: 'ATT', jerseyNumber: 17, rating: 79 },

  // ===== SENEGAL =====
  { id: 'sen-mendy', name: 'Édouard Mendy', team: 'Senegal', teamFlag: '🇸🇳', position: 'GK', jerseyNumber: 1, rating: 82 },
  { id: 'sen-koulibaly', name: 'Kalidou Koulibaly', team: 'Senegal', teamFlag: '🇸🇳', position: 'DEF', jerseyNumber: 3, rating: 85 },
  { id: 'sen-diallo', name: 'Abdou Diallo', team: 'Senegal', teamFlag: '🇸🇳', position: 'DEF', jerseyNumber: 22, rating: 79 },
  { id: 'sen-sabaly', name: 'Youssouf Sabaly', team: 'Senegal', teamFlag: '🇸🇳', position: 'DEF', jerseyNumber: 21, rating: 77 },
  { id: 'sen-gueye', name: 'Idrissa Gueye', team: 'Senegal', teamFlag: '🇸🇳', position: 'MID', jerseyNumber: 5, rating: 80 },
  { id: 'sen-sarr', name: 'Pape Matar Sarr', team: 'Senegal', teamFlag: '🇸🇳', position: 'MID', jerseyNumber: 15, rating: 78 },
  { id: 'sen-mane', name: 'Sadio Mané', team: 'Senegal', teamFlag: '🇸🇳', position: 'ATT', jerseyNumber: 10, rating: 86 },
  { id: 'sen-dia', name: 'Boulaye Dia', team: 'Senegal', teamFlag: '🇸🇳', position: 'ATT', jerseyNumber: 9, rating: 79 },
  { id: 'sen-sarr-i', name: 'Ismaïla Sarr', team: 'Senegal', teamFlag: '🇸🇳', position: 'ATT', jerseyNumber: 18, rating: 81 },
  { id: 'sen-dieng', name: 'Bamba Dieng', team: 'Senegal', teamFlag: '🇸🇳', position: 'ATT', jerseyNumber: 20, rating: 76 },
  { id: 'sen-ciss', name: 'Pathé Ciss', team: 'Senegal', teamFlag: '🇸🇳', position: 'MID', jerseyNumber: 11, rating: 75 },
  { id: 'sen-gomis', name: 'Alfred Gomis', team: 'Senegal', teamFlag: '🇸🇳', position: 'GK', jerseyNumber: 23, rating: 74 },

  // ===== MEXICO =====
  { id: 'mex-ochoa', name: 'Guillermo Ochoa', team: 'Mexico', teamFlag: '🇲🇽', position: 'GK', jerseyNumber: 13, rating: 80 },
  { id: 'mex-montes', name: 'César Montes', team: 'Mexico', teamFlag: '🇲🇽', position: 'DEF', jerseyNumber: 3, rating: 78 },
  { id: 'mex-moreno', name: 'Héctor Moreno', team: 'Mexico', teamFlag: '🇲🇽', position: 'DEF', jerseyNumber: 15, rating: 76 },
  { id: 'mex-gallardo', name: 'Jesús Gallardo', team: 'Mexico', teamFlag: '🇲🇽', position: 'DEF', jerseyNumber: 23, rating: 77 },
  { id: 'mex-alvarez', name: 'Edson Álvarez', team: 'Mexico', teamFlag: '🇲🇽', position: 'MID', jerseyNumber: 4, rating: 82 },
  { id: 'mex-chavez', name: 'Luis Chávez', team: 'Mexico', teamFlag: '🇲🇽', position: 'MID', jerseyNumber: 24, rating: 79 },
  { id: 'mex-lozano', name: 'Hirving Lozano', team: 'Mexico', teamFlag: '🇲🇽', position: 'ATT', jerseyNumber: 22, rating: 81 },
  { id: 'mex-jimenez', name: 'Raúl Jiménez', team: 'Mexico', teamFlag: '🇲🇽', position: 'ATT', jerseyNumber: 9, rating: 79 },
  { id: 'mex-vega', name: 'Alexis Vega', team: 'Mexico', teamFlag: '🇲🇽', position: 'ATT', jerseyNumber: 10, rating: 78 },
  { id: 'mex-herrera', name: 'Héctor Herrera', team: 'Mexico', teamFlag: '🇲🇽', position: 'MID', jerseyNumber: 16, rating: 75 },
  { id: 'mex-sanchez', name: 'Jorge Sánchez', team: 'Mexico', teamFlag: '🇲🇽', position: 'DEF', jerseyNumber: 19, rating: 76 },
  { id: 'mex-talavera', name: 'Alfredo Talavera', team: 'Mexico', teamFlag: '🇲🇽', position: 'GK', jerseyNumber: 1, rating: 75 },

  // ===== URUGUAY =====
  { id: 'uru-rochet', name: 'Sergio Rochet', team: 'Uruguay', teamFlag: '🇺🇾', position: 'GK', jerseyNumber: 23, rating: 79 },
  { id: 'uru-gimenez', name: 'José Giménez', team: 'Uruguay', teamFlag: '🇺🇾', position: 'DEF', jerseyNumber: 2, rating: 83 },
  { id: 'uru-araujo', name: 'Ronald Araújo', team: 'Uruguay', teamFlag: '🇺🇾', position: 'DEF', jerseyNumber: 4, rating: 85 },
  { id: 'uru-olivera', name: 'Mathías Olivera', team: 'Uruguay', teamFlag: '🇺🇾', position: 'DEF', jerseyNumber: 16, rating: 80 },
  { id: 'uru-valverde', name: 'Federico Valverde', team: 'Uruguay', teamFlag: '🇺🇾', position: 'MID', jerseyNumber: 15, rating: 88 },
  { id: 'uru-bentancur', name: 'Rodrigo Bentancur', team: 'Uruguay', teamFlag: '🇺🇾', position: 'MID', jerseyNumber: 6, rating: 83 },
  { id: 'uru-nunez', name: 'Darwin Núñez', team: 'Uruguay', teamFlag: '🇺🇾', position: 'ATT', jerseyNumber: 11, rating: 84 },
  { id: 'uru-suarez', name: 'Luis Suárez', team: 'Uruguay', teamFlag: '🇺🇾', position: 'ATT', jerseyNumber: 9, rating: 81 },
  { id: 'uru-pellistri', name: 'Facundo Pellistri', team: 'Uruguay', teamFlag: '🇺🇾', position: 'ATT', jerseyNumber: 8, rating: 78 },
  { id: 'uru-ugarte', name: 'Manuel Ugarte', team: 'Uruguay', teamFlag: '🇺🇾', position: 'MID', jerseyNumber: 25, rating: 81 },
  { id: 'uru-caceres', name: 'Martín Cáceres', team: 'Uruguay', teamFlag: '🇺🇾', position: 'DEF', jerseyNumber: 22, rating: 76 },
  { id: 'uru-muslera', name: 'Fernando Muslera', team: 'Uruguay', teamFlag: '🇺🇾', position: 'GK', jerseyNumber: 1, rating: 77 },

  // ===== MOROCCO =====
  { id: 'mar-bono', name: 'Yassine Bounou', team: 'Morocco', teamFlag: '🇲🇦', position: 'GK', jerseyNumber: 1, rating: 84 },
  { id: 'mar-hakimi', name: 'Achraf Hakimi', team: 'Morocco', teamFlag: '🇲🇦', position: 'DEF', jerseyNumber: 2, rating: 86 },
  { id: 'mar-saiss', name: 'Romain Saïss', team: 'Morocco', teamFlag: '🇲🇦', position: 'DEF', jerseyNumber: 6, rating: 81 },
  { id: 'mar-aguerd', name: 'Nayef Aguerd', team: 'Morocco', teamFlag: '🇲🇦', position: 'DEF', jerseyNumber: 5, rating: 82 },
  { id: 'mar-amrabat', name: 'Sofyan Amrabat', team: 'Morocco', teamFlag: '🇲🇦', position: 'MID', jerseyNumber: 4, rating: 83 },
  { id: 'mar-ounahi', name: 'Azzedine Ounahi', team: 'Morocco', teamFlag: '🇲🇦', position: 'MID', jerseyNumber: 8, rating: 80 },
  { id: 'mar-ziyech', name: 'Hakim Ziyech', team: 'Morocco', teamFlag: '🇲🇦', position: 'ATT', jerseyNumber: 7, rating: 83 },
  { id: 'mar-ennesyri', name: 'Youssef En-Nesyri', team: 'Morocco', teamFlag: '🇲🇦', position: 'ATT', jerseyNumber: 19, rating: 81 },
  { id: 'mar-boufal', name: 'Sofiane Boufal', team: 'Morocco', teamFlag: '🇲🇦', position: 'ATT', jerseyNumber: 17, rating: 79 },
  { id: 'mar-amallah', name: 'Selim Amallah', team: 'Morocco', teamFlag: '🇲🇦', position: 'MID', jerseyNumber: 15, rating: 77 },
  { id: 'mar-mazraoui', name: 'Noussair Mazraoui', team: 'Morocco', teamFlag: '🇲🇦', position: 'DEF', jerseyNumber: 3, rating: 82 },
  { id: 'mar-munir', name: 'Munir Mohamedi', team: 'Morocco', teamFlag: '🇲🇦', position: 'GK', jerseyNumber: 12, rating: 76 },

  // ===== BELGIUM =====
  { id: 'bel-courtois', name: 'Thibaut Courtois', team: 'Belgium', teamFlag: '🇧🇪', position: 'GK', jerseyNumber: 1, rating: 89 },
  { id: 'bel-vertonghen', name: 'Jan Vertonghen', team: 'Belgium', teamFlag: '🇧🇪', position: 'DEF', jerseyNumber: 5, rating: 80 },
  { id: 'bel-faes', name: 'Wout Faes', team: 'Belgium', teamFlag: '🇧🇪', position: 'DEF', jerseyNumber: 4, rating: 79 },
  { id: 'bel-castagne', name: 'Timothy Castagne', team: 'Belgium', teamFlag: '🇧🇪', position: 'DEF', jerseyNumber: 21, rating: 78 },
  { id: 'bel-debruyne', name: 'Kevin De Bruyne', team: 'Belgium', teamFlag: '🇧🇪', position: 'MID', jerseyNumber: 7, rating: 91 },
  { id: 'bel-tielemans', name: 'Youri Tielemans', team: 'Belgium', teamFlag: '🇧🇪', position: 'MID', jerseyNumber: 8, rating: 82 },
  { id: 'bel-lukaku', name: 'Romelu Lukaku', team: 'Belgium', teamFlag: '🇧🇪', position: 'ATT', jerseyNumber: 9, rating: 84 },
  { id: 'bel-doku', name: 'Jérémy Doku', team: 'Belgium', teamFlag: '🇧🇪', position: 'ATT', jerseyNumber: 22, rating: 83 },
  { id: 'bel-carrasco', name: 'Yannick Carrasco', team: 'Belgium', teamFlag: '🇧🇪', position: 'ATT', jerseyNumber: 11, rating: 81 },
  { id: 'bel-onana', name: 'Amadou Onana', team: 'Belgium', teamFlag: '🇧🇪', position: 'MID', jerseyNumber: 18, rating: 80 },
  { id: 'bel-meunier', name: 'Thomas Meunier', team: 'Belgium', teamFlag: '🇧🇪', position: 'DEF', jerseyNumber: 15, rating: 77 },
  { id: 'bel-casteels', name: 'Koen Casteels', team: 'Belgium', teamFlag: '🇧🇪', position: 'GK', jerseyNumber: 13, rating: 81 },

  // ===== COLOMBIA =====
  { id: 'col-ospina', name: 'David Ospina', team: 'Colombia', teamFlag: '🇨🇴', position: 'GK', jerseyNumber: 1, rating: 78 },
  { id: 'col-mina', name: 'Yerry Mina', team: 'Colombia', teamFlag: '🇨🇴', position: 'DEF', jerseyNumber: 13, rating: 79 },
  { id: 'col-sanchez', name: 'Davinson Sánchez', team: 'Colombia', teamFlag: '🇨🇴', position: 'DEF', jerseyNumber: 23, rating: 78 },
  { id: 'col-cuadrado', name: 'Juan Cuadrado', team: 'Colombia', teamFlag: '🇨🇴', position: 'DEF', jerseyNumber: 11, rating: 80 },
  { id: 'col-barrios', name: 'Wílmar Barrios', team: 'Colombia', teamFlag: '🇨🇴', position: 'MID', jerseyNumber: 5, rating: 79 },
  { id: 'col-uribe', name: 'Mateus Uribe', team: 'Colombia', teamFlag: '🇨🇴', position: 'MID', jerseyNumber: 15, rating: 77 },
  { id: 'col-diaz', name: 'Luis Díaz', team: 'Colombia', teamFlag: '🇨🇴', position: 'ATT', jerseyNumber: 14, rating: 85 },
  { id: 'col-james', name: 'James Rodríguez', team: 'Colombia', teamFlag: '🇨🇴', position: 'ATT', jerseyNumber: 10, rating: 81 },
  { id: 'col-falcao', name: 'Radamel Falcao', team: 'Colombia', teamFlag: '🇨🇴', position: 'ATT', jerseyNumber: 9, rating: 77 },
  { id: 'col-lerma', name: 'Jefferson Lerma', team: 'Colombia', teamFlag: '🇨🇴', position: 'MID', jerseyNumber: 16, rating: 78 },
  { id: 'col-mojica', name: 'Johan Mojica', team: 'Colombia', teamFlag: '🇨🇴', position: 'DEF', jerseyNumber: 17, rating: 76 },
  { id: 'col-vargas', name: 'Camilo Vargas', team: 'Colombia', teamFlag: '🇨🇴', position: 'GK', jerseyNumber: 12, rating: 77 },

  // ===== AUSTRIA =====
  { id: 'aut-pentz', name: 'Patrick Pentz', team: 'Austria', teamFlag: '🇦🇹', position: 'GK', jerseyNumber: 1, rating: 76 },
  { id: 'aut-lindner', name: 'Alexander Schlager', team: 'Austria', teamFlag: '🇦🇹', position: 'GK', jerseyNumber: 12, rating: 74 },
  { id: 'aut-alaba', name: 'David Alaba', team: 'Austria', teamFlag: '🇦🇹', position: 'DEF', jerseyNumber: 8, rating: 87 },
  { id: 'aut-posch', name: 'Stefan Posch', team: 'Austria', teamFlag: '🇦🇹', position: 'DEF', jerseyNumber: 5, rating: 77 },
  { id: 'aut-trauner', name: 'Gernot Trauner', team: 'Austria', teamFlag: '🇦🇹', position: 'DEF', jerseyNumber: 4, rating: 77 },
  { id: 'aut-wober', name: 'Maximilian Wöber', team: 'Austria', teamFlag: '🇦🇹', position: 'DEF', jerseyNumber: 3, rating: 78 },
  { id: 'aut-sabitzer', name: 'Marcel Sabitzer', team: 'Austria', teamFlag: '🇦🇹', position: 'MID', jerseyNumber: 7, rating: 82 },
  { id: 'aut-laimer', name: 'Konrad Laimer', team: 'Austria', teamFlag: '🇦🇹', position: 'MID', jerseyNumber: 6, rating: 81 },
  { id: 'aut-grillitsch', name: 'Florian Grillitsch', team: 'Austria', teamFlag: '🇦🇹', position: 'MID', jerseyNumber: 13, rating: 77 },
  { id: 'aut-baumgartner', name: 'Christoph Baumgartner', team: 'Austria', teamFlag: '🇦🇹', position: 'MID', jerseyNumber: 14, rating: 80 },
  { id: 'aut-arnautovic', name: 'Marko Arnautović', team: 'Austria', teamFlag: '🇦🇹', position: 'ATT', jerseyNumber: 9, rating: 79 },
  { id: 'aut-gregoritsch', name: 'Michael Gregoritsch', team: 'Austria', teamFlag: '🇦🇹', position: 'ATT', jerseyNumber: 19, rating: 76 },
  { id: 'aut-wimmer', name: 'Patrick Wimmer', team: 'Austria', teamFlag: '🇦🇹', position: 'ATT', jerseyNumber: 11, rating: 75 },

  // ===== ALGERIA =====
  { id: 'alg-mbolhi', name: 'Raïs M\'Bolhi', team: 'Algeria', teamFlag: '🇩🇿', position: 'GK', jerseyNumber: 1, rating: 74 },
  { id: 'alg-benayada', name: 'Alexandre Oukidja', team: 'Algeria', teamFlag: '🇩🇿', position: 'GK', jerseyNumber: 16, rating: 72 },
  { id: 'alg-mandi', name: 'Aïssa Mandi', team: 'Algeria', teamFlag: '🇩🇿', position: 'DEF', jerseyNumber: 3, rating: 76 },
  { id: 'alg-benlamri', name: 'Djamel Benlamri', team: 'Algeria', teamFlag: '🇩🇿', position: 'DEF', jerseyNumber: 5, rating: 73 },
  { id: 'alg-atal', name: 'Youcef Atal', team: 'Algeria', teamFlag: '🇩🇿', position: 'DEF', jerseyNumber: 15, rating: 77 },
  { id: 'alg-bennacer', name: 'Ismail Bennacer', team: 'Algeria', teamFlag: '🇩🇿', position: 'MID', jerseyNumber: 8, rating: 82 },
  { id: 'alg-aouar', name: 'Houssem Aouar', team: 'Algeria', teamFlag: '🇩🇿', position: 'MID', jerseyNumber: 10, rating: 80 },
  { id: 'alg-mahrez', name: 'Riyad Mahrez', team: 'Algeria', teamFlag: '🇩🇿', position: 'ATT', jerseyNumber: 7, rating: 85 },
  { id: 'alg-amoura', name: 'Mohamed Amoura', team: 'Algeria', teamFlag: '🇩🇿', position: 'ATT', jerseyNumber: 11, rating: 79 },
  { id: 'alg-slimani', name: 'Islam Slimani', team: 'Algeria', teamFlag: '🇩🇿', position: 'ATT', jerseyNumber: 9, rating: 75 },
  { id: 'alg-belaili', name: 'Youcef Belaïli', team: 'Algeria', teamFlag: '🇩🇿', position: 'ATT', jerseyNumber: 14, rating: 76 },

  // ===== NORWAY =====
  { id: 'nor-nyland', name: 'Ørjan Nyland', team: 'Norway', teamFlag: '🇳🇴', position: 'GK', jerseyNumber: 1, rating: 76 },
  { id: 'nor-oslo', name: 'Jørgen Strand Larsen', team: 'Norway', teamFlag: '🇳🇴', position: 'GK', jerseyNumber: 12, rating: 72 },
  { id: 'nor-ajer', name: 'Kristoffer Ajer', team: 'Norway', teamFlag: '🇳🇴', position: 'DEF', jerseyNumber: 5, rating: 79 },
  { id: 'nor-ostigard', name: 'Leo Østigård', team: 'Norway', teamFlag: '🇳🇴', position: 'DEF', jerseyNumber: 4, rating: 77 },
  { id: 'nor-pedersen', name: 'Morten Thorsby', team: 'Norway', teamFlag: '🇳🇴', position: 'DEF', jerseyNumber: 3, rating: 76 },
  { id: 'nor-ryerson', name: 'Julian Ryerson', team: 'Norway', teamFlag: '🇳🇴', position: 'DEF', jerseyNumber: 2, rating: 76 },
  { id: 'nor-odegaard', name: 'Martin Ødegaard', team: 'Norway', teamFlag: '🇳🇴', position: 'MID', jerseyNumber: 10, rating: 88 },
  { id: 'nor-berge', name: 'Sander Berge', team: 'Norway', teamFlag: '🇳🇴', position: 'MID', jerseyNumber: 8, rating: 80 },
  { id: 'nor-thorsby', name: 'Morten Thorsby', team: 'Norway', teamFlag: '🇳🇴', position: 'MID', jerseyNumber: 6, rating: 75 },
  { id: 'nor-haaland', name: 'Erling Haaland', team: 'Norway', teamFlag: '🇳🇴', position: 'ATT', jerseyNumber: 9, rating: 95 },
  { id: 'nor-sorloth', name: 'Alexander Sørloth', team: 'Norway', teamFlag: '🇳🇴', position: 'ATT', jerseyNumber: 11, rating: 82 },
  { id: 'nor-nusa', name: 'Antonio Nusa', team: 'Norway', teamFlag: '🇳🇴', position: 'ATT', jerseyNumber: 22, rating: 79 },
  { id: 'nor-elyounoussi', name: 'Mohamed Elyounoussi', team: 'Norway', teamFlag: '🇳🇴', position: 'ATT', jerseyNumber: 7, rating: 77 },

  // ===== CANADA =====
  { id: 'can-borjan', name: 'Milan Borjan', team: 'Canada', teamFlag: '🇨🇦', position: 'GK', jerseyNumber: 18, rating: 76 },
  { id: 'can-henry', name: 'Kamal Miller', team: 'Canada', teamFlag: '🇨🇦', position: 'DEF', jerseyNumber: 5, rating: 76 },
  { id: 'can-johnston', name: 'Alistair Johnston', team: 'Canada', teamFlag: '🇨🇦', position: 'DEF', jerseyNumber: 2, rating: 77 },
  { id: 'can-davies', name: 'Alphonso Davies', team: 'Canada', teamFlag: '🇨🇦', position: 'DEF', jerseyNumber: 3, rating: 87 },
  { id: 'can-hutchinson', name: 'Atiba Hutchinson', team: 'Canada', teamFlag: '🇨🇦', position: 'MID', jerseyNumber: 13, rating: 76 },
  { id: 'can-kone', name: 'Ismael Koné', team: 'Canada', teamFlag: '🇨🇦', position: 'MID', jerseyNumber: 8, rating: 78 },
  { id: 'can-eustaquio', name: 'Stephen Eustáquio', team: 'Canada', teamFlag: '🇨🇦', position: 'MID', jerseyNumber: 7, rating: 79 },
  { id: 'can-david', name: 'Jonathan David', team: 'Canada', teamFlag: '🇨🇦', position: 'ATT', jerseyNumber: 20, rating: 84 },
  { id: 'can-larin', name: 'Cyle Larin', team: 'Canada', teamFlag: '🇨🇦', position: 'ATT', jerseyNumber: 9, rating: 77 },
  { id: 'can-buchanan', name: 'Tajon Buchanan', team: 'Canada', teamFlag: '🇨🇦', position: 'ATT', jerseyNumber: 11, rating: 78 },
  { id: 'can-millar', name: 'Liam Millar', team: 'Canada', teamFlag: '🇨🇦', position: 'ATT', jerseyNumber: 19, rating: 75 },

  // ===== SWITZERLAND =====
  { id: 'sui-sommer', name: 'Yann Sommer', team: 'Switzerland', teamFlag: '🇨🇭', position: 'GK', jerseyNumber: 1, rating: 85 },
  { id: 'sui-kobel', name: 'Gregor Kobel', team: 'Switzerland', teamFlag: '🇨🇭', position: 'GK', jerseyNumber: 12, rating: 82 },
  { id: 'sui-akanji', name: 'Manuel Akanji', team: 'Switzerland', teamFlag: '🇨🇭', position: 'DEF', jerseyNumber: 5, rating: 84 },
  { id: 'sui-rodriguez', name: 'Ricardo Rodríguez', team: 'Switzerland', teamFlag: '🇨🇭', position: 'DEF', jerseyNumber: 13, rating: 78 },
  { id: 'sui-widmer', name: 'Silvan Widmer', team: 'Switzerland', teamFlag: '🇨🇭', position: 'DEF', jerseyNumber: 2, rating: 77 },
  { id: 'sui-xhaka', name: 'Granit Xhaka', team: 'Switzerland', teamFlag: '🇨🇭', position: 'MID', jerseyNumber: 10, rating: 84 },
  { id: 'sui-freuler', name: 'Remo Freuler', team: 'Switzerland', teamFlag: '🇨🇭', position: 'MID', jerseyNumber: 8, rating: 80 },
  { id: 'sui-sow', name: 'Djibril Sow', team: 'Switzerland', teamFlag: '🇨🇭', position: 'MID', jerseyNumber: 6, rating: 78 },
  { id: 'sui-shaqiri', name: 'Xherdan Shaqiri', team: 'Switzerland', teamFlag: '🇨🇭', position: 'ATT', jerseyNumber: 23, rating: 80 },
  { id: 'sui-embolo', name: 'Breel Embolo', team: 'Switzerland', teamFlag: '🇨🇭', position: 'ATT', jerseyNumber: 7, rating: 79 },
  { id: 'sui-vargas', name: 'Ruben Vargas', team: 'Switzerland', teamFlag: '🇨🇭', position: 'ATT', jerseyNumber: 16, rating: 78 },
  { id: 'sui-zuber', name: 'Steven Zuber', team: 'Switzerland', teamFlag: '🇨🇭', position: 'ATT', jerseyNumber: 11, rating: 75 },

  // ===== TURKEY =====
  { id: 'tur-gunok', name: 'Mert Günok', team: 'Turkey', teamFlag: '🇹🇷', position: 'GK', jerseyNumber: 1, rating: 77 },
  { id: 'tur-bayindir', name: 'Altay Bayındır', team: 'Turkey', teamFlag: '🇹🇷', position: 'GK', jerseyNumber: 12, rating: 78 },
  { id: 'tur-soyuncu', name: 'Çağlar Söyüncü', team: 'Turkey', teamFlag: '🇹🇷', position: 'DEF', jerseyNumber: 4, rating: 80 },
  { id: 'tur-demiral', name: 'Merih Demiral', team: 'Turkey', teamFlag: '🇹🇷', position: 'DEF', jerseyNumber: 3, rating: 79 },
  { id: 'tur-celik', name: 'Zeki Çelik', team: 'Turkey', teamFlag: '🇹🇷', position: 'DEF', jerseyNumber: 2, rating: 77 },
  { id: 'tur-calhanoglu', name: 'Hakan Çalhanoğlu', team: 'Turkey', teamFlag: '🇹🇷', position: 'MID', jerseyNumber: 10, rating: 85 },
  { id: 'tur-yokuslu', name: 'Okay Yokuşlu', team: 'Turkey', teamFlag: '🇹🇷', position: 'MID', jerseyNumber: 6, rating: 77 },
  { id: 'tur-guler', name: 'Arda Güler', team: 'Turkey', teamFlag: '🇹🇷', position: 'ATT', jerseyNumber: 11, rating: 84 },
  { id: 'tur-akturkoglu', name: 'Kerem Aktürkoğlu', team: 'Turkey', teamFlag: '🇹🇷', position: 'ATT', jerseyNumber: 7, rating: 79 },
  { id: 'tur-tosun', name: 'Cenk Tosun', team: 'Turkey', teamFlag: '🇹🇷', position: 'ATT', jerseyNumber: 9, rating: 76 },
  { id: 'tur-yildiz', name: 'Kenan Yıldız', team: 'Turkey', teamFlag: '🇹🇷', position: 'ATT', jerseyNumber: 17, rating: 80 },

  // ===== ECUADOR =====
  { id: 'ecu-dominguez', name: 'Alexander Domínguez', team: 'Ecuador', teamFlag: '🇪🇨', position: 'GK', jerseyNumber: 1, rating: 73 },
  { id: 'ecu-hincapie', name: 'Piero Hincapié', team: 'Ecuador', teamFlag: '🇪🇨', position: 'DEF', jerseyNumber: 4, rating: 81 },
  { id: 'ecu-torres', name: 'Angelo Preciado', team: 'Ecuador', teamFlag: '🇪🇨', position: 'DEF', jerseyNumber: 2, rating: 74 },
  { id: 'ecu-arboleda', name: 'Robert Arboleda', team: 'Ecuador', teamFlag: '🇪🇨', position: 'DEF', jerseyNumber: 3, rating: 76 },
  { id: 'ecu-caicedo', name: 'Moisés Caicedo', team: 'Ecuador', teamFlag: '🇪🇨', position: 'MID', jerseyNumber: 10, rating: 85 },
  { id: 'ecu-gruezo', name: 'Carlos Gruezo', team: 'Ecuador', teamFlag: '🇪🇨', position: 'MID', jerseyNumber: 5, rating: 74 },
  { id: 'ecu-yeboah', name: 'Jeremy Sarmiento', team: 'Ecuador', teamFlag: '🇪🇨', position: 'MID', jerseyNumber: 17, rating: 75 },
  { id: 'ecu-plata', name: 'Romario Ibarra', team: 'Ecuador', teamFlag: '🇪🇨', position: 'ATT', jerseyNumber: 11, rating: 75 },
  { id: 'ecu-estrada', name: 'Enner Valencia', team: 'Ecuador', teamFlag: '🇪🇨', position: 'ATT', jerseyNumber: 13, rating: 79 },
  { id: 'ecu-guerron', name: 'Michael Estrada', team: 'Ecuador', teamFlag: '🇪🇨', position: 'ATT', jerseyNumber: 9, rating: 73 },

  // ===== AUSTRALIA =====
  { id: 'aus-ryan', name: 'Mat Ryan', team: 'Australia', teamFlag: '🇦🇺', position: 'GK', jerseyNumber: 1, rating: 76 },
  { id: 'aus-souttar', name: 'Harry Souttar', team: 'Australia', teamFlag: '🇦🇺', position: 'DEF', jerseyNumber: 4, rating: 77 },
  { id: 'aus-atkinson', name: 'Bailey Wright', team: 'Australia', teamFlag: '🇦🇺', position: 'DEF', jerseyNumber: 5, rating: 72 },
  { id: 'aus-degenek', name: 'Miloš Degenek', team: 'Australia', teamFlag: '🇦🇺', position: 'DEF', jerseyNumber: 2, rating: 74 },
  { id: 'aus-mooy', name: 'Aaron Mooy', team: 'Australia', teamFlag: '🇦🇺', position: 'MID', jerseyNumber: 13, rating: 78 },
  { id: 'aus-rogic', name: 'Tom Rogic', team: 'Australia', teamFlag: '🇦🇺', position: 'MID', jerseyNumber: 11, rating: 76 },
  { id: 'aus-irvine', name: 'Jackson Irvine', team: 'Australia', teamFlag: '🇦🇺', position: 'MID', jerseyNumber: 14, rating: 74 },
  { id: 'aus-leckie', name: 'Mathew Leckie', team: 'Australia', teamFlag: '🇦🇺', position: 'ATT', jerseyNumber: 7, rating: 77 },
  { id: 'aus-mabil', name: 'Awer Mabil', team: 'Australia', teamFlag: '🇦🇺', position: 'ATT', jerseyNumber: 17, rating: 73 },
  { id: 'aus-duke', name: 'Mitchell Duke', team: 'Australia', teamFlag: '🇦🇺', position: 'ATT', jerseyNumber: 20, rating: 72 },
  { id: 'aus-goodwin', name: 'Craig Goodwin', team: 'Australia', teamFlag: '🇦🇺', position: 'ATT', jerseyNumber: 22, rating: 72 },

  // ===== EGYPT =====
  { id: 'egy-elneny', name: 'Mohamed El-Shenawy', team: 'Egypt', teamFlag: '🇪🇬', position: 'GK', jerseyNumber: 1, rating: 77 },
  { id: 'egy-hegazy', name: 'Ahmed Hegazi', team: 'Egypt', teamFlag: '🇪🇬', position: 'DEF', jerseyNumber: 5, rating: 76 },
  { id: 'egy-fathi', name: 'Ahmed Fathi', team: 'Egypt', teamFlag: '🇪🇬', position: 'DEF', jerseyNumber: 6, rating: 72 },
  { id: 'egy-omar', name: 'Mohamed Abdelmoneim', team: 'Egypt', teamFlag: '🇪🇬', position: 'DEF', jerseyNumber: 14, rating: 73 },
  { id: 'egy-hamed', name: 'Amr El-Solia', team: 'Egypt', teamFlag: '🇪🇬', position: 'MID', jerseyNumber: 8, rating: 72 },
  { id: 'egy-elneny2', name: 'Mohamed El-Neny', team: 'Egypt', teamFlag: '🇪🇬', position: 'MID', jerseyNumber: 4, rating: 76 },
  { id: 'egy-salah', name: 'Mohamed Salah', team: 'Egypt', teamFlag: '🇪🇬', position: 'ATT', jerseyNumber: 10, rating: 92 },
  { id: 'egy-trezeguet', name: 'Mahmoud Trezeguet', team: 'Egypt', teamFlag: '🇪🇬', position: 'ATT', jerseyNumber: 11, rating: 75 },
  { id: 'egy-mostafa', name: 'Mostafa Mohamed', team: 'Egypt', teamFlag: '🇪🇬', position: 'ATT', jerseyNumber: 9, rating: 74 },

  // ===== SAUDI ARABIA =====
  { id: 'ksa-alowais', name: 'Mohammed Al-Owais', team: 'Saudi Arabia', teamFlag: '🇸🇦', position: 'GK', jerseyNumber: 1, rating: 76 },
  { id: 'ksa-albulayhi', name: 'Ali Al-Bulayhi', team: 'Saudi Arabia', teamFlag: '🇸🇦', position: 'DEF', jerseyNumber: 2, rating: 73 },
  { id: 'ksa-alshahrani', name: 'Yasser Al-Shahrani', team: 'Saudi Arabia', teamFlag: '🇸🇦', position: 'DEF', jerseyNumber: 3, rating: 74 },
  { id: 'ksa-albilal', name: 'Hassan Al-Tambakti', team: 'Saudi Arabia', teamFlag: '🇸🇦', position: 'DEF', jerseyNumber: 5, rating: 73 },
  { id: 'ksa-albehja', name: 'Salman Al-Faraj', team: 'Saudi Arabia', teamFlag: '🇸🇦', position: 'MID', jerseyNumber: 6, rating: 77 },
  { id: 'ksa-kanno', name: 'Mohamed Kanno', team: 'Saudi Arabia', teamFlag: '🇸🇦', position: 'MID', jerseyNumber: 8, rating: 75 },
  { id: 'ksa-aldawsari', name: 'Salem Al-Dawsari', team: 'Saudi Arabia', teamFlag: '🇸🇦', position: 'ATT', jerseyNumber: 10, rating: 79 },
  { id: 'ksa-alshehri', name: 'Saleh Al-Shehri', team: 'Saudi Arabia', teamFlag: '🇸🇦', position: 'ATT', jerseyNumber: 7, rating: 75 },
  { id: 'ksa-alburaikan', name: 'Firas Al-Buraikan', team: 'Saudi Arabia', teamFlag: '🇸🇦', position: 'ATT', jerseyNumber: 9, rating: 73 },

  // ===== GHANA =====
  { id: 'gha-ati', name: 'Jojo Wollacott', team: 'Ghana', teamFlag: '🇬🇭', position: 'GK', jerseyNumber: 1, rating: 72 },
  { id: 'gha-amartey', name: 'Daniel Amartey', team: 'Ghana', teamFlag: '🇬🇭', position: 'DEF', jerseyNumber: 5, rating: 76 },
  { id: 'gha-salisu', name: 'Mohammed Salisu', team: 'Ghana', teamFlag: '🇬🇭', position: 'DEF', jerseyNumber: 3, rating: 77 },
  { id: 'gha-odoi', name: 'Ransford-Yeboah Königsdörffer', team: 'Ghana', teamFlag: '🇬🇭', position: 'DEF', jerseyNumber: 2, rating: 73 },
  { id: 'gha-partey', name: 'Thomas Partey', team: 'Ghana', teamFlag: '🇬🇭', position: 'MID', jerseyNumber: 6, rating: 83 },
  { id: 'gha-mubarak', name: 'Mohammed Kudus', team: 'Ghana', teamFlag: '🇬🇭', position: 'MID', jerseyNumber: 10, rating: 82 },
  { id: 'gha-ayew-a', name: 'André Ayew', team: 'Ghana', teamFlag: '🇬🇭', position: 'ATT', jerseyNumber: 11, rating: 77 },
  { id: 'gha-ayew-j', name: 'Jordan Ayew', team: 'Ghana', teamFlag: '🇬🇭', position: 'ATT', jerseyNumber: 9, rating: 76 },
  { id: 'gha-boateng', name: 'Inaki Williams', team: 'Ghana', teamFlag: '🇬🇭', position: 'ATT', jerseyNumber: 7, rating: 79 },

  // ===== SWEDEN =====
  { id: 'swe-olsen', name: 'Robin Olsen', team: 'Sweden', teamFlag: '🇸🇪', position: 'GK', jerseyNumber: 1, rating: 75 },
  { id: 'swe-lindelof', name: 'Victor Lindelöf', team: 'Sweden', teamFlag: '🇸🇪', position: 'DEF', jerseyNumber: 6, rating: 80 },
  { id: 'swe-augustinsson', name: 'Ludwig Augustinsson', team: 'Sweden', teamFlag: '🇸🇪', position: 'DEF', jerseyNumber: 3, rating: 76 },
  { id: 'swe-danielson', name: 'Filip Helander', team: 'Sweden', teamFlag: '🇸🇪', position: 'DEF', jerseyNumber: 5, rating: 74 },
  { id: 'swe-ekdal', name: 'Albin Ekdal', team: 'Sweden', teamFlag: '🇸🇪', position: 'MID', jerseyNumber: 8, rating: 73 },
  { id: 'swe-forsberg', name: 'Emil Forsberg', team: 'Sweden', teamFlag: '🇸🇪', position: 'MID', jerseyNumber: 10, rating: 79 },
  { id: 'swe-larsson', name: 'Sebastian Larsson', team: 'Sweden', teamFlag: '🇸🇪', position: 'MID', jerseyNumber: 7, rating: 74 },
  { id: 'swe-isak', name: 'Alexander Isak', team: 'Sweden', teamFlag: '🇸🇪', position: 'ATT', jerseyNumber: 9, rating: 84 },
  { id: 'swe-kulusevski', name: 'Dejan Kulusevski', team: 'Sweden', teamFlag: '🇸🇪', position: 'ATT', jerseyNumber: 11, rating: 83 },
  { id: 'swe-gyokeres', name: 'Viktor Gyökeres', team: 'Sweden', teamFlag: '🇸🇪', position: 'ATT', jerseyNumber: 20, rating: 86 },

  // ===== SCOTLAND =====
  { id: 'sco-gordon', name: 'Craig Gordon', team: 'Scotland', teamFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', position: 'GK', jerseyNumber: 1, rating: 74 },
  { id: 'sco-robertson', name: 'Andy Robertson', team: 'Scotland', teamFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', position: 'DEF', jerseyNumber: 3, rating: 84 },
  { id: 'sco-tierney', name: 'Kieran Tierney', team: 'Scotland', teamFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', position: 'DEF', jerseyNumber: 5, rating: 79 },
  { id: 'sco-hanley', name: 'Grant Hanley', team: 'Scotland', teamFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', position: 'DEF', jerseyNumber: 6, rating: 73 },
  { id: 'sco-mctominay', name: 'Scott McTominay', team: 'Scotland', teamFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', position: 'MID', jerseyNumber: 10, rating: 80 },
  { id: 'sco-mcgregor', name: 'Callum McGregor', team: 'Scotland', teamFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', position: 'MID', jerseyNumber: 8, rating: 77 },
  { id: 'sco-armstrong', name: 'Stuart Armstrong', team: 'Scotland', teamFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', position: 'MID', jerseyNumber: 7, rating: 74 },
  { id: 'sco-adams', name: 'Che Adams', team: 'Scotland', teamFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', position: 'ATT', jerseyNumber: 9, rating: 74 },
  { id: 'sco-dykes', name: 'Lyndon Dykes', team: 'Scotland', teamFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', position: 'ATT', jerseyNumber: 11, rating: 72 },
  { id: 'sco-mcginn', name: 'John McGinn', team: 'Scotland', teamFlag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', position: 'MID', jerseyNumber: 6, rating: 78 },

  // ===== IRAN =====
  { id: 'irn-beiranvand', name: 'Ali Beiranvand', team: 'Iran', teamFlag: '🇮🇷', position: 'GK', jerseyNumber: 1, rating: 75 },
  { id: 'irn-mohammadi', name: 'Ehsan Hajsafi', team: 'Iran', teamFlag: '🇮🇷', position: 'DEF', jerseyNumber: 3, rating: 73 },
  { id: 'irn-pouraliganji', name: 'Majid Hosseini', team: 'Iran', teamFlag: '🇮🇷', position: 'DEF', jerseyNumber: 4, rating: 73 },
  { id: 'irn-rezaeian', name: 'Sadegh Moharrami', team: 'Iran', teamFlag: '🇮🇷', position: 'DEF', jerseyNumber: 2, rating: 71 },
  { id: 'irn-karimi', name: 'Ahmad Noorollahi', team: 'Iran', teamFlag: '🇮🇷', position: 'MID', jerseyNumber: 8, rating: 73 },
  { id: 'irn-amiri', name: 'Ali Karimi', team: 'Iran', teamFlag: '🇮🇷', position: 'MID', jerseyNumber: 10, rating: 74 },
  { id: 'irn-azmoun', name: 'Sardar Azmoun', team: 'Iran', teamFlag: '🇮🇷', position: 'ATT', jerseyNumber: 9, rating: 81 },
  { id: 'irn-jahanbakhsh', name: 'Alireza Jahanbakhsh', team: 'Iran', teamFlag: '🇮🇷', position: 'ATT', jerseyNumber: 7, rating: 78 },
  { id: 'irn-taremi', name: 'Mehdi Taremi', team: 'Iran', teamFlag: '🇮🇷', position: 'ATT', jerseyNumber: 9, rating: 82 },

  // ===== BOSNIA & HERZEGOVINA =====
  { id: 'bih-sehic', name: 'Ibrahim Šehić', team: 'Bosnia & Herzegovina', teamFlag: '🇧🇦', position: 'GK', jerseyNumber: 1, rating: 73 },
  { id: 'bih-kolasinac', name: 'Sead Kolašinac', team: 'Bosnia & Herzegovina', teamFlag: '🇧🇦', position: 'DEF', jerseyNumber: 3, rating: 78 },
  { id: 'bih-sunjic', name: 'Ivica Šunjić', team: 'Bosnia & Herzegovina', teamFlag: '🇧🇦', position: 'DEF', jerseyNumber: 5, rating: 73 },
  { id: 'bih-civic', name: 'Nedim Ćivić', team: 'Bosnia & Herzegovina', teamFlag: '🇧🇦', position: 'DEF', jerseyNumber: 2, rating: 72 },
  { id: 'bih-pjanic', name: 'Miralem Pjanić', team: 'Bosnia & Herzegovina', teamFlag: '🇧🇦', position: 'MID', jerseyNumber: 8, rating: 82 },
  { id: 'bih-hadziahmetovic', name: 'Adnan Hadžiahmetović', team: 'Bosnia & Herzegovina', teamFlag: '🇧🇦', position: 'MID', jerseyNumber: 6, rating: 73 },
  { id: 'bih-dzeko', name: 'Edin Džeko', team: 'Bosnia & Herzegovina', teamFlag: '🇧🇦', position: 'ATT', jerseyNumber: 10, rating: 82 },
  { id: 'bih-krunic', name: 'Rade Krunić', team: 'Bosnia & Herzegovina', teamFlag: '🇧🇦', position: 'ATT', jerseyNumber: 7, rating: 76 },
  { id: 'bih-prevljak', name: 'Munas Dabbur', team: 'Bosnia & Herzegovina', teamFlag: '🇧🇦', position: 'ATT', jerseyNumber: 9, rating: 73 },

  // ===== CZECH REPUBLIC =====
  { id: 'cze-kolar', name: 'Jiří Pavlenka', team: 'Czech Republic', teamFlag: '🇨🇿', position: 'GK', jerseyNumber: 23, rating: 76 },
  { id: 'cze-coufal', name: 'Vladimír Coufal', team: 'Czech Republic', teamFlag: '🇨🇿', position: 'DEF', jerseyNumber: 2, rating: 76 },
  { id: 'cze-celustka', name: 'Ondřej Čelůstka', team: 'Czech Republic', teamFlag: '🇨🇿', position: 'DEF', jerseyNumber: 3, rating: 72 },
  { id: 'cze-krejci', name: 'Ladislav Krejčí', team: 'Czech Republic', teamFlag: '🇨🇿', position: 'DEF', jerseyNumber: 5, rating: 73 },
  { id: 'cze-soucek', name: 'Tomáš Souček', team: 'Czech Republic', teamFlag: '🇨🇿', position: 'MID', jerseyNumber: 8, rating: 82 },
  { id: 'cze-darida', name: 'Vladimír Darida', team: 'Czech Republic', teamFlag: '🇨🇿', position: 'MID', jerseyNumber: 6, rating: 73 },
  { id: 'cze-sadilek', name: 'Michal Sadílek', team: 'Czech Republic', teamFlag: '🇨🇿', position: 'MID', jerseyNumber: 14, rating: 73 },
  { id: 'cze-schick', name: 'Patrik Schick', team: 'Czech Republic', teamFlag: '🇨🇿', position: 'ATT', jerseyNumber: 9, rating: 82 },
  { id: 'cze-jankto', name: 'Jakub Jankto', team: 'Czech Republic', teamFlag: '🇨🇿', position: 'ATT', jerseyNumber: 11, rating: 73 },
  { id: 'cze-hlozek', name: 'Adam Hložek', team: 'Czech Republic', teamFlag: '🇨🇿', position: 'ATT', jerseyNumber: 21, rating: 77 },

  // ===== SOUTH AFRICA =====
  { id: 'rsa-williams', name: 'Ronwen Williams', team: 'South Africa', teamFlag: '🇿🇦', position: 'GK', jerseyNumber: 1, rating: 75 },
  { id: 'rsa-ngcobo', name: 'Mothobi Mvala', team: 'South Africa', teamFlag: '🇿🇦', position: 'DEF', jerseyNumber: 5, rating: 71 },
  { id: 'rsa-modiba', name: 'Siyanda Xulu', team: 'South Africa', teamFlag: '🇿🇦', position: 'DEF', jerseyNumber: 4, rating: 71 },
  { id: 'rsa-carnell', name: 'Reeve Frosler', team: 'South Africa', teamFlag: '🇿🇦', position: 'DEF', jerseyNumber: 2, rating: 72 },
  { id: 'rsa-grobler', name: 'Bongani Zungu', team: 'South Africa', teamFlag: '🇿🇦', position: 'MID', jerseyNumber: 8, rating: 72 },
  { id: 'rsa-mokoena', name: 'Andile Jali', team: 'South Africa', teamFlag: '🇿🇦', position: 'MID', jerseyNumber: 6, rating: 71 },
  { id: 'rsa-tau', name: 'Percy Tau', team: 'South Africa', teamFlag: '🇿🇦', position: 'ATT', jerseyNumber: 10, rating: 78 },
  { id: 'rsa-mabunda', name: 'Lyle Foster', team: 'South Africa', teamFlag: '🇿🇦', position: 'ATT', jerseyNumber: 9, rating: 73 },
  { id: 'rsa-dolly', name: 'Keagan Dolly', team: 'South Africa', teamFlag: '🇿🇦', position: 'ATT', jerseyNumber: 11, rating: 72 },

  // ===== PARAGUAY =====
  { id: 'par-silva', name: 'Antony Silva', team: 'Paraguay', teamFlag: '🇵🇾', position: 'GK', jerseyNumber: 1, rating: 73 },
  { id: 'par-alonso', name: 'Junior Alonso', team: 'Paraguay', teamFlag: '🇵🇾', position: 'DEF', jerseyNumber: 4, rating: 74 },
  { id: 'par-balbuena', name: 'Fabián Balbuena', team: 'Paraguay', teamFlag: '🇵🇾', position: 'DEF', jerseyNumber: 3, rating: 76 },
  { id: 'par-rojas', name: 'Santiago Arzamendia', team: 'Paraguay', teamFlag: '🇵🇾', position: 'DEF', jerseyNumber: 19, rating: 72 },
  { id: 'par-romero-o', name: 'Óscar Romero', team: 'Paraguay', teamFlag: '🇵🇾', position: 'MID', jerseyNumber: 10, rating: 77 },
  { id: 'par-almiro', name: 'Miguel Almirón', team: 'Paraguay', teamFlag: '🇵🇾', position: 'MID', jerseyNumber: 8, rating: 80 },
  { id: 'par-aquino', name: 'Iván Piris', team: 'Paraguay', teamFlag: '🇵🇾', position: 'MID', jerseyNumber: 6, rating: 72 },
  { id: 'par-sanabria', name: 'Antonio Sanabria', team: 'Paraguay', teamFlag: '🇵🇾', position: 'ATT', jerseyNumber: 9, rating: 77 },
  { id: 'par-almiron-a', name: 'Gabriel Ávalos', team: 'Paraguay', teamFlag: '🇵🇾', position: 'ATT', jerseyNumber: 11, rating: 72 },

  // ===== QATAR =====
  { id: 'qat-barsham', name: 'Saad Al-Sheeb', team: 'Qatar', teamFlag: '🇶🇦', position: 'GK', jerseyNumber: 1, rating: 73 },
  { id: 'qat-salman', name: 'Pedro Miguel', team: 'Qatar', teamFlag: '🇶🇦', position: 'DEF', jerseyNumber: 5, rating: 71 },
  { id: 'qat-khoukhi', name: 'Bassam Al-Rawi', team: 'Qatar', teamFlag: '🇶🇦', position: 'DEF', jerseyNumber: 3, rating: 70 },
  { id: 'qat-hatem', name: 'Tarek Salman', team: 'Qatar', teamFlag: '🇶🇦', position: 'MID', jerseyNumber: 6, rating: 70 },
  { id: 'qat-madibo', name: 'Abdelkarim Hassan', team: 'Qatar', teamFlag: '🇶🇦', position: 'MID', jerseyNumber: 10, rating: 72 },
  { id: 'qat-hassan', name: 'Yousuf Hassan', team: 'Qatar', teamFlag: '🇶🇦', position: 'MID', jerseyNumber: 8, rating: 70 },
  { id: 'qat-afif', name: 'Akram Afif', team: 'Qatar', teamFlag: '🇶🇦', position: 'ATT', jerseyNumber: 11, rating: 78 },
  { id: 'qat-ali', name: 'Almoez Ali', team: 'Qatar', teamFlag: '🇶🇦', position: 'ATT', jerseyNumber: 19, rating: 76 },
  { id: 'qat-muntari', name: 'Ismaeel Mohammad', team: 'Qatar', teamFlag: '🇶🇦', position: 'ATT', jerseyNumber: 9, rating: 70 },

  // ===== UZBEKISTAN =====
  { id: 'uzb-nesterov', name: 'Eldor Shomurodov', team: 'Uzbekistan', teamFlag: '🇺🇿', position: 'ATT', jerseyNumber: 9, rating: 76 },
  { id: 'uzb-masharipov', name: 'Jaloliddin Masharipov', team: 'Uzbekistan', teamFlag: '🇺🇿', position: 'MID', jerseyNumber: 10, rating: 74 },
  { id: 'uzb-yusupov', name: 'Otabek Shukurov', team: 'Uzbekistan', teamFlag: '🇺🇿', position: 'MID', jerseyNumber: 8, rating: 72 },
  { id: 'uzb-ergashev', name: 'Abdulaziz Komilov', team: 'Uzbekistan', teamFlag: '🇺🇿', position: 'DEF', jerseyNumber: 4, rating: 71 },
  { id: 'uzb-amonov', name: 'Shamsiddin Nematov', team: 'Uzbekistan', teamFlag: '🇺🇿', position: 'DEF', jerseyNumber: 3, rating: 70 },
  { id: 'uzb-dos', name: 'Khamza Karimov', team: 'Uzbekistan', teamFlag: '🇺🇿', position: 'DEF', jerseyNumber: 5, rating: 70 },
  { id: 'uzb-djuraev', name: 'Hamidjon Djuraev', team: 'Uzbekistan', teamFlag: '🇺🇿', position: 'GK', jerseyNumber: 1, rating: 69 },
  { id: 'uzb-tursunov', name: 'Dostonbek Tursunov', team: 'Uzbekistan', teamFlag: '🇺🇿', position: 'ATT', jerseyNumber: 7, rating: 71 },
  { id: 'uzb-yakhshiliqov', name: 'Umid Murtazaev', team: 'Uzbekistan', teamFlag: '🇺🇿', position: 'MID', jerseyNumber: 6, rating: 70 },

  // ===== CONGO DR =====
  { id: 'cod-bakambu', name: 'Cédric Bakambu', team: 'Congo DR', teamFlag: '🇨🇩', position: 'ATT', jerseyNumber: 9, rating: 78 },
  { id: 'cod-mbemba', name: 'Chancel Mbemba', team: 'Congo DR', teamFlag: '🇨🇩', position: 'DEF', jerseyNumber: 4, rating: 76 },
  { id: 'cod-masuaku', name: 'Arthur Masuaku', team: 'Congo DR', teamFlag: '🇨🇩', position: 'DEF', jerseyNumber: 3, rating: 74 },
  { id: 'cod-kibondo', name: 'Gaël Kakuta', team: 'Congo DR', teamFlag: '🇨🇩', position: 'MID', jerseyNumber: 10, rating: 74 },
  { id: 'cod-kayembe', name: 'Nathan Ngoy', team: 'Congo DR', teamFlag: '🇨🇩', position: 'MID', jerseyNumber: 8, rating: 71 },
  { id: 'cod-mukiele', name: 'Nordi Mukiele', team: 'Congo DR', teamFlag: '🇨🇩', position: 'DEF', jerseyNumber: 2, rating: 77 },
  { id: 'cod-kediena', name: 'Silas Katompa', team: 'Congo DR', teamFlag: '🇨🇩', position: 'ATT', jerseyNumber: 7, rating: 77 },
  { id: 'cod-ngoy', name: 'Samuel Moutoussamy', team: 'Congo DR', teamFlag: '🇨🇩', position: 'MID', jerseyNumber: 6, rating: 72 },
  { id: 'cod-bolasie', name: 'Yannick Bolasie', team: 'Congo DR', teamFlag: '🇨🇩', position: 'ATT', jerseyNumber: 11, rating: 73 },
  { id: 'cod-kabongo', name: 'Joël Kiassumbua', team: 'Congo DR', teamFlag: '🇨🇩', position: 'GK', jerseyNumber: 1, rating: 70 },

  // ===== NEW ZEALAND =====
  { id: 'nzl-moss', name: 'Stefan Marinovic', team: 'New Zealand', teamFlag: '🇳🇿', position: 'GK', jerseyNumber: 1, rating: 68 },
  { id: 'nzl-boxall', name: 'Tommy Smith', team: 'New Zealand', teamFlag: '🇳🇿', position: 'DEF', jerseyNumber: 5, rating: 68 },
  { id: 'nzl-thomas', name: 'Michael Boxall', team: 'New Zealand', teamFlag: '🇳🇿', position: 'DEF', jerseyNumber: 4, rating: 69 },
  { id: 'nzl-payne', name: 'Winston Reid', team: 'New Zealand', teamFlag: '🇳🇿', position: 'DEF', jerseyNumber: 3, rating: 70 },
  { id: 'nzl-bell', name: 'Joe Bell', team: 'New Zealand', teamFlag: '🇳🇿', position: 'MID', jerseyNumber: 8, rating: 71 },
  { id: 'nzl-rojas-n', name: 'Liberato Cacace', team: 'New Zealand', teamFlag: '🇳🇿', position: 'MID', jerseyNumber: 17, rating: 70 },
  { id: 'nzl-wood', name: 'Chris Wood', team: 'New Zealand', teamFlag: '🇳🇿', position: 'ATT', jerseyNumber: 9, rating: 78 },
  { id: 'nzl-thomas2', name: 'Tim Payne', team: 'New Zealand', teamFlag: '🇳🇿', position: 'ATT', jerseyNumber: 7, rating: 67 },
  { id: 'nzl-corin', name: 'Callan Elliot', team: 'New Zealand', teamFlag: '🇳🇿', position: 'ATT', jerseyNumber: 11, rating: 67 },

  // ===== TUNISIA =====
  { id: 'tun-dahmen', name: 'Aymen Dahmen', team: 'Tunisia', teamFlag: '🇹🇳', position: 'GK', jerseyNumber: 1, rating: 74 },
  { id: 'tun-bronn', name: 'Dylan Bronn', team: 'Tunisia', teamFlag: '🇹🇳', position: 'DEF', jerseyNumber: 5, rating: 74 },
  { id: 'tun-talbi', name: 'Montassar Talbi', team: 'Tunisia', teamFlag: '🇹🇳', position: 'DEF', jerseyNumber: 4, rating: 73 },
  { id: 'tun-meriah', name: 'Ali Maaloul', team: 'Tunisia', teamFlag: '🇹🇳', position: 'DEF', jerseyNumber: 13, rating: 73 },
  { id: 'tun-skhiri', name: 'Ellyes Skhiri', team: 'Tunisia', teamFlag: '🇹🇳', position: 'MID', jerseyNumber: 8, rating: 77 },
  { id: 'tun-laïdouni', name: 'Aïssa Laïdouni', team: 'Tunisia', teamFlag: '🇹🇳', position: 'MID', jerseyNumber: 6, rating: 74 },
  { id: 'tun-khazri', name: 'Wahbi Khazri', team: 'Tunisia', teamFlag: '🇹🇳', position: 'ATT', jerseyNumber: 10, rating: 77 },
  { id: 'tun-jebali', name: 'Issam Jebali', team: 'Tunisia', teamFlag: '🇹🇳', position: 'ATT', jerseyNumber: 9, rating: 74 },
  { id: 'tun-sliti', name: 'Naïm Sliti', team: 'Tunisia', teamFlag: '🇹🇳', position: 'ATT', jerseyNumber: 7, rating: 74 },

  // ===== PANAMA =====
  { id: 'pan-penedo', name: 'Jaime Penedo', team: 'Panama', teamFlag: '🇵🇦', position: 'GK', jerseyNumber: 1, rating: 70 },
  { id: 'pan-escobar', name: 'Fidel Escobar', team: 'Panama', teamFlag: '🇵🇦', position: 'DEF', jerseyNumber: 3, rating: 69 },
  { id: 'pan-murillo', name: 'César Yanis', team: 'Panama', teamFlag: '🇵🇦', position: 'DEF', jerseyNumber: 4, rating: 70 },
  { id: 'pan-davis', name: 'Rolando Blackburn', team: 'Panama', teamFlag: '🇵🇦', position: 'ATT', jerseyNumber: 9, rating: 72 },
  { id: 'pan-godoy', name: 'Gabriel Torres', team: 'Panama', teamFlag: '🇵🇦', position: 'ATT', jerseyNumber: 11, rating: 70 },
  { id: 'pan-quintero', name: 'Adolfo Machado', team: 'Panama', teamFlag: '🇵🇦', position: 'DEF', jerseyNumber: 5, rating: 69 },
  { id: 'pan-andersson', name: 'Armando Cooper', team: 'Panama', teamFlag: '🇵🇦', position: 'MID', jerseyNumber: 8, rating: 70 },
  { id: 'pan-godoy2', name: 'Anibal Godoy', team: 'Panama', teamFlag: '🇵🇦', position: 'MID', jerseyNumber: 6, rating: 71 },
  { id: 'pan-hall', name: 'Freddie Hall', team: 'Panama', teamFlag: '🇵🇦', position: 'GK', jerseyNumber: 18, rating: 68 },

  // ===== IRAQ =====
  { id: 'irq-nouri', name: 'Jalal Hassan', team: 'Iraq', teamFlag: '🇮🇶', position: 'GK', jerseyNumber: 1, rating: 69 },
  { id: 'irq-salim', name: 'Ahmed Ibrahim', team: 'Iraq', teamFlag: '🇮🇶', position: 'DEF', jerseyNumber: 4, rating: 68 },
  { id: 'irq-karrar', name: 'Rebin Sulaka', team: 'Iraq', teamFlag: '🇮🇶', position: 'DEF', jerseyNumber: 5, rating: 68 },
  { id: 'irq-hamdani', name: 'Mohammed Al-Hamdani', team: 'Iraq', teamFlag: '🇮🇶', position: 'MID', jerseyNumber: 8, rating: 70 },
  { id: 'irq-hussein', name: 'Aymen Hussein', team: 'Iraq', teamFlag: '🇮🇶', position: 'ATT', jerseyNumber: 9, rating: 73 },
  { id: 'irq-karrar2', name: 'Mohanad Ali', team: 'Iraq', teamFlag: '🇮🇶', position: 'ATT', jerseyNumber: 10, rating: 71 },
  { id: 'irq-hasan', name: 'Amjed Attwan', team: 'Iraq', teamFlag: '🇮🇶', position: 'MID', jerseyNumber: 6, rating: 68 },
  { id: 'irq-ibrahim', name: 'Ali Adnan', team: 'Iraq', teamFlag: '🇮🇶', position: 'DEF', jerseyNumber: 3, rating: 72 },
  { id: 'irq-awat', name: 'Safaa Hadi', team: 'Iraq', teamFlag: '🇮🇶', position: 'ATT', jerseyNumber: 7, rating: 68 },

  // ===== JORDAN =====
  { id: 'jor-amer', name: 'Amer Shafi', team: 'Jordan', teamFlag: '🇯🇴', position: 'GK', jerseyNumber: 1, rating: 73 },
  { id: 'jor-musa', name: 'Yazan Al-Naimat', team: 'Jordan', teamFlag: '🇯🇴', position: 'DEF', jerseyNumber: 4, rating: 69 },
  { id: 'jor-al-deeb', name: 'Ahmad Ibrahim', team: 'Jordan', teamFlag: '🇯🇴', position: 'DEF', jerseyNumber: 5, rating: 69 },
  { id: 'jor-khalil', name: 'Baha\' Faisal', team: 'Jordan', teamFlag: '🇯🇴', position: 'MID', jerseyNumber: 8, rating: 71 },
  { id: 'jor-abdelfattah', name: 'Mousa Taamari', team: 'Jordan', teamFlag: '🇯🇴', position: 'MID', jerseyNumber: 10, rating: 73 },
  { id: 'jor-dardour', name: 'Hamza Al-Dardour', team: 'Jordan', teamFlag: '🇯🇴', position: 'ATT', jerseyNumber: 9, rating: 71 },
  { id: 'jor-al-salem', name: 'Mohammad Abu Zreiq', team: 'Jordan', teamFlag: '🇯🇴', position: 'MID', jerseyNumber: 6, rating: 70 },
  { id: 'jor-al-rawabdeh', name: 'Mutaz Yaseen', team: 'Jordan', teamFlag: '🇯🇴', position: 'DEF', jerseyNumber: 3, rating: 69 },
  { id: 'jor-al-jundi', name: 'Khaled Al-Shehadeh', team: 'Jordan', teamFlag: '🇯🇴', position: 'ATT', jerseyNumber: 7, rating: 69 },

  // ===== CAPE VERDE =====
  { id: 'cpv-vozinha', name: 'Vozinha', team: 'Cape Verde', teamFlag: '🇨🇻', position: 'GK', jerseyNumber: 1, rating: 71 },
  { id: 'cpv-fali', name: 'Stopira', team: 'Cape Verde', teamFlag: '🇨🇻', position: 'DEF', jerseyNumber: 5, rating: 71 },
  { id: 'cpv-roberto', name: 'Roberto Lopes', team: 'Cape Verde', teamFlag: '🇨🇻', position: 'DEF', jerseyNumber: 4, rating: 70 },
  { id: 'cpv-silva', name: 'Gilson Benchimol', team: 'Cape Verde', teamFlag: '🇨🇻', position: 'MID', jerseyNumber: 8, rating: 70 },
  { id: 'cpv-rodrigues', name: 'Garry Rodrigues', team: 'Cape Verde', teamFlag: '🇨🇻', position: 'ATT', jerseyNumber: 7, rating: 73 },
  { id: 'cpv-tavares', name: 'Julio Tavares', team: 'Cape Verde', teamFlag: '🇨🇻', position: 'ATT', jerseyNumber: 9, rating: 72 },
  { id: 'cpv-andrade', name: 'Ryan Mendes', team: 'Cape Verde', teamFlag: '🇨🇻', position: 'MID', jerseyNumber: 10, rating: 71 },
  { id: 'cpv-leao', name: 'Willy Semedo', team: 'Cape Verde', teamFlag: '🇨🇻', position: 'DEF', jerseyNumber: 3, rating: 69 },
  { id: 'cpv-ferreira', name: 'Kenny Rocha Santos', team: 'Cape Verde', teamFlag: '🇨🇻', position: 'MID', jerseyNumber: 6, rating: 69 },

  // ===== CURACAO =====
  { id: 'cuw-warnaars', name: 'Eloy Room', team: 'Curacao', teamFlag: '🇨🇼', position: 'GK', jerseyNumber: 1, rating: 73 },
  { id: 'cuw-del-pino', name: 'Cuco Martina', team: 'Curacao', teamFlag: '🇨🇼', position: 'DEF', jerseyNumber: 3, rating: 70 },
  { id: 'cuw-frederiks', name: 'Barry Opdam', team: 'Curacao', teamFlag: '🇨🇼', position: 'DEF', jerseyNumber: 5, rating: 68 },
  { id: 'cuw-martina', name: 'Vurnon Anita', team: 'Curacao', teamFlag: '🇨🇼', position: 'MID', jerseyNumber: 8, rating: 69 },
  { id: 'cuw-dumfries2', name: 'Leandro Bacuna', team: 'Curacao', teamFlag: '🇨🇼', position: 'MID', jerseyNumber: 10, rating: 73 },
  { id: 'cuw-bacuna', name: 'Juninho Bacuna', team: 'Curacao', teamFlag: '🇨🇼', position: 'MID', jerseyNumber: 6, rating: 72 },
  { id: 'cuw-chaleroi', name: 'Gevaro Nepomuceno', team: 'Curacao', teamFlag: '🇨🇼', position: 'ATT', jerseyNumber: 7, rating: 72 },
  { id: 'cuw-bermudez', name: 'Jarchinio Antonia', team: 'Curacao', teamFlag: '🇨🇼', position: 'ATT', jerseyNumber: 9, rating: 70 },
  { id: 'cuw-isidora', name: 'Shanon van der Biezen', team: 'Curacao', teamFlag: '🇨🇼', position: 'DEF', jerseyNumber: 2, rating: 67 },

  // ===== HAITI =====
  { id: 'hai-anglade', name: 'Johnny Placide', team: 'Haiti', teamFlag: '🇭🇹', position: 'GK', jerseyNumber: 1, rating: 67 },
  { id: 'hai-guerrier', name: 'Andrew Jean-Baptiste', team: 'Haiti', teamFlag: '🇭🇹', position: 'DEF', jerseyNumber: 3, rating: 68 },
  { id: 'hai-sanon', name: 'Mechack Jérôme', team: 'Haiti', teamFlag: '🇭🇹', position: 'DEF', jerseyNumber: 4, rating: 67 },
  { id: 'hai-jerome', name: 'Fraìtzky Bazile', team: 'Haiti', teamFlag: '🇭🇹', position: 'MID', jerseyNumber: 8, rating: 67 },
  { id: 'hai-elie', name: 'James Léveillé', team: 'Haiti', teamFlag: '🇭🇹', position: 'MID', jerseyNumber: 6, rating: 67 },
  { id: 'hai-joseph', name: 'Duckens Nazon', team: 'Haiti', teamFlag: '🇭🇹', position: 'ATT', jerseyNumber: 9, rating: 70 },
  { id: 'hai-laventure', name: 'Nicolas Ade', team: 'Haiti', teamFlag: '🇭🇹', position: 'ATT', jerseyNumber: 11, rating: 69 },
  { id: 'hai-saintil', name: 'Frantzdy Pierrot', team: 'Haiti', teamFlag: '🇭🇹', position: 'ATT', jerseyNumber: 7, rating: 70 },
  { id: 'hai-barthelemy', name: 'Steeven Saba', team: 'Haiti', teamFlag: '🇭🇹', position: 'DEF', jerseyNumber: 5, rating: 66 },

  // ===== IVORY COAST =====
  { id: 'civ-fofana', name: 'Yahia Fofana', team: 'Ivory Coast', teamFlag: '🇨🇮', position: 'GK', jerseyNumber: 1, rating: 75 },
  { id: 'civ-ndicka', name: 'Evan Ndicka', team: 'Ivory Coast', teamFlag: '🇨🇮', position: 'DEF', jerseyNumber: 21, rating: 81 },
  { id: 'civ-diomande', name: 'Ousmane Diomande', team: 'Ivory Coast', teamFlag: '🇨🇮', position: 'DEF', jerseyNumber: 2, rating: 79 },
  { id: 'civ-konan', name: 'Ghislain Konan', team: 'Ivory Coast', teamFlag: '🇨🇮', position: 'DEF', jerseyNumber: 3, rating: 76 },
  { id: 'civ-kessie', name: 'Franck Kessié', team: 'Ivory Coast', teamFlag: '🇨🇮', position: 'MID', jerseyNumber: 8, rating: 82 },
  { id: 'civ-seko', name: 'Seko Fofana', team: 'Ivory Coast', teamFlag: '🇨🇮', position: 'MID', jerseyNumber: 6, rating: 81 },
  { id: 'civ-pepe', name: 'Nicolas Pépé', team: 'Ivory Coast', teamFlag: '🇨🇮', position: 'ATT', jerseyNumber: 19, rating: 78 },
  { id: 'civ-haller', name: 'Sébastien Haller', team: 'Ivory Coast', teamFlag: '🇨🇮', position: 'ATT', jerseyNumber: 22, rating: 80 },
  { id: 'civ-zaha', name: 'Wilfried Zaha', team: 'Ivory Coast', teamFlag: '🇨🇮', position: 'ATT', jerseyNumber: 9, rating: 79 },
  { id: 'civ-seri', name: 'Jean Michaël Seri', team: 'Ivory Coast', teamFlag: '🇨🇮', position: 'MID', jerseyNumber: 4, rating: 77 },
  { id: 'civ-aurier', name: 'Serge Aurier', team: 'Ivory Coast', teamFlag: '🇨🇮', position: 'DEF', jerseyNumber: 17, rating: 76 },
  { id: 'civ-sangare', name: 'Badra Ali Sangaré', team: 'Ivory Coast', teamFlag: '🇨🇮', position: 'GK', jerseyNumber: 16, rating: 74 },


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
  penaltyHome?: number;
  penaltyAway?: number;
  isNonDemo?: boolean;
}

export const DEMO_FIXTURES: DemoFixture[] = [
  {
    fixtureId: 'special-arg-ger',
    homeTeam: 'Argentina',
    awayTeam: 'Germany',
    homeFlag: '🇦🇷',
    awayFlag: '🇩🇪',
    kickoffAt: new Date(Date.now() + 86400000).toISOString(),
    status: 'upcoming',
    isNonDemo: true,
  },
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
  {
    fixtureId: 'wc2026-ned-sen',
    homeTeam: 'Netherlands',
    awayTeam: 'Senegal',
    homeFlag: '🇳🇱',
    awayFlag: '🇸🇳',
    kickoffAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming',
  },
  {
    fixtureId: 'wc2026-usa-mex',
    homeTeam: 'USA',
    awayTeam: 'Mexico',
    homeFlag: '🇺🇸',
    awayFlag: '🇲🇽',
    kickoffAt: new Date(Date.now() + 84 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming',
  },
  {
    fixtureId: 'wc2026-kor-uru',
    homeTeam: 'South Korea',
    awayTeam: 'Uruguay',
    homeFlag: '🇰🇷',
    awayFlag: '🇺🇾',
    kickoffAt: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming',
  },
  {
    fixtureId: 'wc2026-mar-bel',
    homeTeam: 'Morocco',
    awayTeam: 'Belgium',
    homeFlag: '🇲🇦',
    awayFlag: '🇧🇪',
    kickoffAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'finished',
    homeScore: 2,
    awayScore: 0,
  },
  {
    fixtureId: 'wc2026-col-civ',
    homeTeam: 'Colombia',
    awayTeam: 'Ivory Coast',
    homeFlag: '🇨🇴',
    awayFlag: '🇨🇮',
    kickoffAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'finished',
    homeScore: 2,
    awayScore: 1,
  }
];

// Helper to dynamically map Argentina/France events to actual competing teams
export function getDynamicEvents(fixture: DemoFixture, baseEvents: any[]): any[] {
  const homeTeam = fixture.homeTeam;
  const awayTeam = fixture.awayTeam;
  const homeFlag = fixture.homeFlag;
  const awayFlag = fixture.awayFlag;
  
  const homePlayers = getPlayersByTeam(homeTeam);
  const awayPlayers = getPlayersByTeam(awayTeam);
  
  if (homePlayers.length === 0 || awayPlayers.length === 0) {
    return baseEvents; // fallback if no players found
  }

  
  // Map standard player positions/names
  const homeGK = homePlayers.find(p => p.position === 'GK')?.name || 'Goalkeeper';
  const homeDef = homePlayers.find(p => p.position === 'DEF')?.name || 'Defender';
  const homeMid = homePlayers.find(p => p.position === 'MID')?.name || 'Midfielder';
  const homeAtts = homePlayers.filter(p => p.position === 'ATT');
  const homeAtt1 = homeAtts[0]?.name || 'Forward 1';
  const homeAtt2 = homeAtts[1]?.name || 'Forward 2';
  const homeAtt3 = homeAtts[2]?.name || homeAtt2;
  
  const awayGK = awayPlayers.find(p => p.position === 'GK')?.name || 'Goalkeeper';
  const awayDef = awayPlayers.find(p => p.position === 'DEF')?.name || 'Defender';
  const awayMid = awayPlayers.find(p => p.position === 'MID')?.name || 'Midfielder';
  const awayAtts = awayPlayers.filter(p => p.position === 'ATT');
  const awayAtt1 = awayAtts[0]?.name || 'Forward 1';
  const awayAtt2 = awayAtts[1]?.name || 'Forward 2';
  const awayAtt3 = awayAtts[2]?.name || 'Forward 3';
  
  // Let's map player names from Argentina/France defaults
  const playerMap: Record<string, string> = {
    // Argentina default players -> Home team
    'E. Martínez': homeGK,
    'Romero': homeDef,
    'Messi': homeMid,
    'L. Martínez': homeAtt1,
    'Álvarez': homeAtt2,
    'Di María': homeAtt3,
    
    // France default players -> Away team
    'Maignan': awayGK,
    'Varane': awayDef,
    'Griezmann': awayMid,
    'Mbappé': awayAtt1,
    'Dembélé': awayAtt2,
    'Giroud': awayAtt3,
    'Coman': awayAtts[3]?.name || awayAtt2,
  };


  const playerIdMap: Record<string, string> = {
    'arg-martinez': homePlayers.find(p => p.position === 'GK')?.id || '',
    'arg-romero': homePlayers.find(p => p.position === 'DEF')?.id || '',
    'arg-messi': homePlayers.find(p => p.position === 'MID')?.id || '',
    'arg-lautaro': homeAtts[0]?.id || '',
    'arg-alvarez': homeAtts[1]?.id || '',
    'arg-dimaria': homeAtts[2]?.id || homeAtts[1]?.id || '',

    'fra-maignan': awayPlayers.find(p => p.position === 'GK')?.id || '',
    'fra-varane': awayPlayers.find(p => p.position === 'DEF')?.id || '',
    'fra-griezmann': awayPlayers.find(p => p.position === 'MID')?.id || '',
    'fra-mbappe': awayAtts[0]?.id || '',
    'fra-dembele': awayAtts[1]?.id || '',
    'fra-giroud': awayAtts[2]?.id || '',
    'fra-coman': awayAtts[3]?.id || awayAtts[1]?.id || '',
  };
  
  return baseEvents.map(event => {
    let mappedTeam = event.team;
    let mappedFlag = event.teamFlag;
    let mappedPlayer = event.player;
    let mappedPlayerId = event.playerId;
    
    if (event.team === 'Argentina') {
      mappedTeam = homeTeam;
      mappedFlag = homeFlag;
    } else if (event.team === 'France') {
      mappedTeam = awayTeam;
      mappedFlag = awayFlag;
    }
    
    if (event.player && playerMap[event.player]) {
      mappedPlayer = playerMap[event.player];
    }

    if (event.playerId && playerIdMap[event.playerId]) {
      mappedPlayerId = playerIdMap[event.playerId];
    }
    
    // Replace names in description
    let mappedDescription = event.description;
    if (mappedDescription) {
      Object.entries(playerMap).forEach(([origName, newName]) => {
        mappedDescription = mappedDescription.replace(new RegExp(origName, 'gi'), newName);
      });
      mappedDescription = mappedDescription.replace(/Argentina/gi, homeTeam);
      mappedDescription = mappedDescription.replace(/France/gi, awayTeam);
    }

    let mappedDialog = event.dialog ? JSON.parse(JSON.stringify(event.dialog)) : undefined;
    if (mappedDialog) {
      mappedDialog.forEach((d: any) => {
        if (d.text) {
          d.text = d.text.replace(/Argentina/gi, homeTeam);
          d.text = d.text.replace(/France/gi, awayTeam);
          
          Object.keys(playerMap).forEach(oldName => {
            const regex = new RegExp(oldName, 'gi');
            d.text = d.text.replace(regex, playerMap[oldName]);
          });
        }
      });
    }
    
    return {
      ...event,
      team: mappedTeam,
      teamFlag: mappedFlag,
      player: mappedPlayer,
      playerId: mappedPlayerId,
      description: mappedDescription,
      dialog: mappedDialog
    };
  });
}

// Dedicated Argentina vs Germany event script for the 'special-arg-ger' demo fixture.
// Uses correct player IDs from wc2026-players-static.ts — no remapping needed.
// Narrative: Argentina 3-2 Germany (Germany lead twice, Argentina comeback)
export const ARG_GER_EVENTS = [
  // KICK OFF
  { id: 'ag_e0', minute: 0, team: '', teamFlag: '', player: '', playerId: '', type: 'kick_off', points: 0, description: 'KICK OFF! Argentina vs Germany — World Cup 2026 Semi-Final! The stadium is electric!' },
  // Starting XI — Argentina
  { id: 'ag_xi_ema', minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez',  playerId: 'arg-emartinez', type: 'starting_xi', points: 2, description: 'Emiliano Martínez starts in goal for Argentina — the 2022 World Cup hero!' },
  { id: 'ag_xi_rom', minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero',        playerId: 'arg-romero',    type: 'starting_xi', points: 2, description: 'Cristian Romero anchors the Argentine defence tonight.' },
  { id: 'ag_xi_lma', minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Lis. Martínez', playerId: 'arg-martinez',  type: 'starting_xi', points: 2, description: 'Lisandro Martínez alongside Romero at centre-back for Argentina.' },
  { id: 'ag_xi_all', minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Mac Allister', playerId: 'arg-allister',  type: 'starting_xi', points: 2, description: 'Alexis Mac Allister controls the midfield for Argentina — the heartbeat of this team.' },
  { id: 'ag_xi_mes', minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi',          playerId: 'arg-messi',     type: 'starting_xi', points: 2, description: 'MESSI starts — chasing a second World Cup Final. Can he deliver again?' },
  { id: 'ag_xi_lau', minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Lautaro',        playerId: 'arg-lmartinez', type: 'starting_xi', points: 2, description: 'Lautaro Martínez leads the Argentine attack alongside Álvarez.' },
  { id: 'ag_xi_alv', minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez',        playerId: 'arg-alvarez',   type: 'starting_xi', points: 2, description: 'Julián Álvarez starts up front — a dangerous presence alongside Lautaro.' },
  // Starting XI — Germany
  { id: 'ag_xi_neu', minute: 0, team: 'Germany', teamFlag: '🇩🇪', player: 'Neuer',    playerId: 'ger-neuer',    type: 'starting_xi', points: 2, description: 'Manuel Neuer starts in goal for Germany — still one of the world\'s very best.' },
  { id: 'ag_xi_rue', minute: 0, team: 'Germany', teamFlag: '🇩🇪', player: 'Rüdiger',  playerId: 'ger-ruediger', type: 'starting_xi', points: 2, description: 'Antonio Rüdiger commands the German backline with pace and presence.' },
  { id: 'ag_xi_tah', minute: 0, team: 'Germany', teamFlag: '🇩🇪', player: 'Tah',      playerId: 'ger-tah',      type: 'starting_xi', points: 2, description: 'Jonathan Tah partners Rüdiger at centre-back — a formidable defensive duo.' },
  { id: 'ag_xi_gor', minute: 0, team: 'Germany', teamFlag: '🇩🇪', player: 'Goretzka', playerId: 'ger-goretzka', type: 'starting_xi', points: 2, description: 'Leon Goretzka provides power and energy from central midfield.' },
  { id: 'ag_xi_mus', minute: 0, team: 'Germany', teamFlag: '🇩🇪', player: 'Musiala',  playerId: 'ger-musiala',  type: 'starting_xi', points: 2, description: 'Jamal Musiala — Germany\'s match-winner — ready to unlock any defence tonight.' },
  { id: 'ag_xi_wir', minute: 0, team: 'Germany', teamFlag: '🇩🇪', player: 'Wirtz',    playerId: 'ger-wirtz',    type: 'starting_xi', points: 2, description: 'Florian Wirtz — tournament revelation — starts on the left for Germany.' },
  { id: 'ag_xi_hav', minute: 0, team: 'Germany', teamFlag: '🇩🇪', player: 'Havertz',  playerId: 'ger-havertz',  type: 'starting_xi', points: 2, description: 'Kai Havertz leads the German attack — direct, powerful, dangerous in the box.' },

  // FIRST HALF
  { id: 'ag_d1', minute: 8, team: 'Germany', teamFlag: '🇩🇪', player: 'Musiala', playerId: 'ger-musiala', type: 'danger_attack', points: 0, description: 'Musiala drives into the Argentine half! Germany pressing with intent from the start.' },

  { id: 'ag_asst_gor1', minute: 11, team: 'Germany', teamFlag: '🇩🇪', player: 'Goretzka', playerId: 'ger-goretzka', type: 'assist', points: 6, description: 'Goretzka surges from deep and threads a perfectly weighted through ball for Havertz!' },
  { id: 'ag_goal_hav', minute: 12, team: 'Germany', teamFlag: '🇩🇪', player: 'Havertz', playerId: 'ger-havertz', type: 'goal', points: 10, goalType: 'Shot', description: 'GOAL! Havertz rounds Emiliano Martínez and rolls it into an empty net — Germany lead!' },
  { id: 'ag_conc_ema1', minute: 12, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-emartinez', type: 'goal_conceded', points: -1, description: 'Emiliano Martínez caught off his line — Havertz punishes the Argentine backline.' },
  { id: 'ag_conc_rom1', minute: 12, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero', playerId: 'arg-romero', type: 'goal_conceded', points: -1, description: 'Romero appeals for offside but the flag stays down — Havertz was perfectly timed.' },

  { id: 'ag_d2', minute: 20, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'danger_attack', points: 0, description: 'Argentina finding their rhythm — Messi drifting inside, demanding the ball!' },

  { id: 'ag_save_ema1', minute: 26, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-emartinez', type: 'goalkeeper_save', points: 1, description: 'E. Martínez tips Musiala\'s curling effort over the bar! Argentina survive.' },

  { id: 'ag_yc_rue', minute: 30, team: 'Germany', teamFlag: '🇩🇪', player: 'Rüdiger', playerId: 'ger-ruediger', type: 'yellow_card', points: -2, description: 'Yellow card for Rüdiger — catches Álvarez late to halt a dangerous counter.' },

  { id: 'ag_d3', minute: 35, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez', playerId: 'arg-alvarez', type: 'danger_attack', points: 0, description: 'ARGENTINA PRESSING! Álvarez cutting inside, driving at the German defence!' },

  { id: 'ag_asst_mes1', minute: 37, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'assist', points: 6, description: 'MESSI — a delightful first-time ball slices the German defence clean open for Lautaro!' },
  { id: 'ag_goal_lau', minute: 38, team: 'Argentina', teamFlag: '🇦🇷', player: 'Lautaro', playerId: 'arg-lmartinez', type: 'goal', points: 10, goalType: 'Shot', description: 'GOAL! Lautaro slides the ball under Neuer — Argentina level! The stadium is on its feet!' },
  { id: 'ag_conc_neu1', minute: 38, team: 'Germany', teamFlag: '🇩🇪', player: 'Neuer', playerId: 'ger-neuer', type: 'goal_conceded', points: -1, description: 'Neuer wrong-footed by Lautaro\'s precise placement — absolutely no chance.' },
  { id: 'ag_conc_rue1', minute: 38, team: 'Germany', teamFlag: '🇩🇪', player: 'Rüdiger', playerId: 'ger-ruediger', type: 'goal_conceded', points: -1, description: 'Rüdiger failed to track Lautaro\'s run — Argentina punish the lapse ruthlessly.' },

  { id: 'ag_save_neu1', minute: 42, team: 'Germany', teamFlag: '🇩🇪', player: 'Neuer', playerId: 'ger-neuer', type: 'goalkeeper_save', points: 1, description: 'Neuer stretches to his right to palm away Álvarez\'s thunderbolt — world class!' },

  { id: 'ag_poss_mes', minute: 44, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'possession_bonus', points: 1, description: 'Messi dominated the first half — pulling strings, controlling every phase of play.' },
  { id: 'ag_poss_mus', minute: 44, team: 'Germany', teamFlag: '🇩🇪', player: 'Musiala', playerId: 'ger-musiala', type: 'possession_bonus', points: 1, description: 'Musiala was everywhere in the first half — carrying, probing, creating danger.' },

  { id: 'ag_ht', minute: 45, team: '', teamFlag: '', player: '', playerId: '', type: 'half_time', points: 0, description: 'Half Time! Argentina 1–1 Germany — a breathtaking opening 45 minutes!' },

  // SECOND HALF
  { id: 'ag_ko2', minute: 46, team: '', teamFlag: '', player: '', playerId: '', type: 'kick_off', points: 0, description: 'Second half under way — Germany get us going again. Can they recapture the lead?' },

  { id: 'ag_d4', minute: 52, team: 'Germany', teamFlag: '🇩🇪', player: 'Havertz', playerId: 'ger-havertz', type: 'danger_attack', points: 0, description: 'Germany building again — Havertz holding the ball up brilliantly, bringing Musiala and Wirtz into play.' },

  { id: 'ag_asst_gor2', minute: 54, team: 'Germany', teamFlag: '🇩🇪', player: 'Goretzka', playerId: 'ger-goretzka', type: 'assist', points: 6, description: 'Goretzka surges into the box and pulls the ball back to Musiala — the timing is perfect!' },
  { id: 'ag_goal_mus', minute: 55, team: 'Germany', teamFlag: '🇩🇪', player: 'Musiala', playerId: 'ger-musiala', type: 'goal', points: 12, goalType: 'Shot', description: 'GOAL! MUSIALA strikes first time — the ball arrows into the far corner! Germany lead again!' },
  { id: 'ag_conc_ema2', minute: 55, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-emartinez', type: 'goal_conceded', points: -1, description: 'E. Martínez had no chance — Musiala\'s strike was unstoppable. Germany 2-1.' },
  { id: 'ag_conc_lma2', minute: 55, team: 'Argentina', teamFlag: '🇦🇷', player: 'Lis. Martínez', playerId: 'arg-martinez', type: 'goal_conceded', points: -1, description: 'Lisandro Martínez caught out by Goretzka\'s run — the gap is punished immediately.' },

  { id: 'ag_var', minute: 57, team: '', teamFlag: '', player: '', playerId: '', type: 'var_review', points: 0, description: 'VAR checks the build-up to Musiala\'s goal for a foul on Mac Allister — the goal stands!' },

  { id: 'ag_pw_mus', minute: 60, team: 'Germany', teamFlag: '🇩🇪', player: 'Musiala', playerId: 'ger-musiala', type: 'penalty_won', points: 3, description: 'Musiala is brought down in the box! Clear foul — the referee immediately points to the spot!' },
  { id: 'ag_pc_lma', minute: 60, team: 'Argentina', teamFlag: '🇦🇷', player: 'Lis. Martínez', playerId: 'arg-martinez', type: 'penalty_conceded', points: -3, description: 'Lisandro Martínez — late lunge on Musiala — concedes a penalty. Argentina in deep trouble!' },
  { id: 'ag_pm_hav', minute: 61, team: 'Germany', teamFlag: '🇩🇪', player: 'Havertz', playerId: 'ger-havertz', type: 'penalty_missed', points: -3, description: 'HAVERTZ MISSES THE PENALTY! He blazes it wide of the right post — an incredible reprieve for Argentina!' },

  { id: 'ag_d5', minute: 63, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'danger_attack', points: 0, description: 'ARGENTINA RESPONSE! Messi drives forward at pace — the crowd roaring every touch!' },

  { id: 'ag_asst_alv', minute: 64, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez', playerId: 'arg-alvarez', type: 'assist', points: 6, description: 'Álvarez peels off Rüdiger and finds Messi arriving in the box — perfect weight on the pass!' },
  { id: 'ag_goal_mes', minute: 65, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'goal', points: 11, goalType: 'Shot', description: 'GOOOOAL! MESSI! A curling left-footed strike into the top corner — PURE GENIUS! 2–2!' },
  { id: 'ag_conc_neu2', minute: 65, team: 'Germany', teamFlag: '🇩🇪', player: 'Neuer', playerId: 'ger-neuer', type: 'goal_conceded', points: -1, description: 'Neuer got a fingertip to it but couldn\'t stop Messi\'s curler — nobody could.' },
  { id: 'ag_conc_tah2', minute: 65, team: 'Germany', teamFlag: '🇩🇪', player: 'Tah', playerId: 'ger-tah', type: 'goal_conceded', points: -1, description: 'Tah failed to close down Messi fast enough — world-class finishing takes no prisoners.' },

  { id: 'ag_sub_hav', minute: 66, team: 'Germany', teamFlag: '🇩🇪', player: 'Woltemade', playerId: 'ger-woltemade', type: 'substitution', points: 0, playerOut: 'Havertz', description: 'Substitution: Woltemade replaces Havertz — Nagelsmann reacts after the missed penalty.' },
  { id: 'ag_app_wol', minute: 66, team: 'Germany', teamFlag: '🇩🇪', player: 'Woltemade', playerId: 'ger-woltemade', type: 'sub_appearance', points: 1, description: 'Nick Woltemade comes on — fresh legs and physicality to trouble the Argentine defence.' },

  { id: 'ag_pw_wir', minute: 70, team: 'Germany', teamFlag: '🇩🇪', player: 'Wirtz', playerId: 'ger-wirtz', type: 'penalty_won', points: 3, description: 'Wirtz wins a penalty! He cuts inside and is clipped by Romero — the referee has no hesitation!' },
  { id: 'ag_pc_rom', minute: 70, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero', playerId: 'arg-romero', type: 'penalty_conceded', points: -3, description: 'Romero clips Wirtz from behind — unavoidable penalty. Argentina on the ropes!' },
  { id: 'ag_pm_wir', minute: 71, team: 'Germany', teamFlag: '🇩🇪', player: 'Wirtz', playerId: 'ger-wirtz', type: 'penalty_missed', points: -3, description: 'WIRTZ MISSES! Emiliano Martínez dives to his left and SAVES IT! Unbelievable scenes!' },
  { id: 'ag_ps_ema', minute: 71, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-emartinez', type: 'penalty_save', points: 5, description: 'EMILIANO MARTÍNEZ SAVES THE PENALTY! Two German penalties missed — Argentina survive!' },

  { id: 'ag_sub_gor', minute: 75, team: 'Germany', teamFlag: '🇩🇪', player: 'Sanè', playerId: 'ger-sane', type: 'substitution', points: 0, playerOut: 'Goretzka', description: 'Substitution: Sanè replaces Goretzka — fresh pace for Germany on the left.' },
  { id: 'ag_app_san', minute: 75, team: 'Germany', teamFlag: '🇩🇪', player: 'Sanè', playerId: 'ger-sane', type: 'sub_appearance', points: 1, description: 'Leroy Sanè enters the fray — direct running and trickery to test Argentina\'s full-backs.' },
  { id: 'ag_save_ema2', minute: 75, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-emartinez', type: 'goalkeeper_save', points: 1, description: 'E. Martínez! Spreads himself to deny Woltemade a tap-in — this goalkeeper is inspired!' },

  { id: 'ag_d6', minute: 76, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez', playerId: 'arg-alvarez', type: 'danger_attack', points: 0, description: 'Argentina sensing this moment! Álvarez leads the counter-attack — Germany scrambling!' },

  { id: 'ag_asst_all', minute: 77, team: 'Argentina', teamFlag: '🇦🇷', player: 'Mac Allister', playerId: 'arg-allister', type: 'assist', points: 6, description: 'Mac Allister plays a perfectly timed through ball into Álvarez\'s path — inch perfect!' },
  { id: 'ag_goal_alv', minute: 77, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez', playerId: 'arg-alvarez', type: 'goal', points: 10, goalType: 'Shot', description: 'GOAL! ÁLVAREZ! Lifts it calmly over Neuer — ARGENTINA LEAD 3–2! 13 minutes remaining!' },
  { id: 'ag_conc_neu3', minute: 77, team: 'Germany', teamFlag: '🇩🇪', player: 'Neuer', playerId: 'ger-neuer', type: 'goal_conceded', points: -1, description: 'Neuer beaten by the chip — Álvarez\'s composure in front of goal was extraordinary.' },
  { id: 'ag_conc_tah3', minute: 77, team: 'Germany', teamFlag: '🇩🇪', player: 'Tah', playerId: 'ger-tah', type: 'goal_conceded', points: -1, description: 'Tah failed to track Álvarez\'s diagonal run — Argentina punish the lapse on the counter.' },

  { id: 'ag_sub_lma', minute: 80, team: 'Argentina', teamFlag: '🇦🇷', player: 'Otamendi', playerId: 'arg-otamendi', type: 'substitution', points: 0, playerOut: 'Lis. Martínez', description: 'Substitution: Otamendi replaces Lisandro Martínez — defensive reinforcement to protect the lead.' },
  { id: 'ag_app_ota', minute: 80, team: 'Argentina', teamFlag: '🇦🇷', player: 'Otamendi', playerId: 'arg-otamendi', type: 'sub_appearance', points: 1, description: 'Nicolás Otamendi enters — experienced head to help Argentina see this out.' },
  { id: 'ag_sub_lau', minute: 83, team: 'Argentina', teamFlag: '🇦🇷', player: 'Simeone', playerId: 'arg-simeone', type: 'substitution', points: 0, playerOut: 'Lautaro', description: 'Substitution: Simeone replaces Lautaro — the goalscorer given a well-deserved ovation.' },
  { id: 'ag_app_sim', minute: 83, team: 'Argentina', teamFlag: '🇦🇷', player: 'Simeone', playerId: 'arg-simeone', type: 'sub_appearance', points: 1, description: 'Giuliano Simeone enters to help Argentina hold what they have in the final minutes.' },
  { id: 'ag_save_ema3', minute: 82, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-emartinez', type: 'goalkeeper_save', points: 1, description: 'E. Martínez! Fingertips Wirtz\'s swerving effort around the post — three saves tonight!' },

  { id: 'ag_d7', minute: 87, team: 'Germany', teamFlag: '🇩🇪', player: 'Wirtz', playerId: 'ger-wirtz', type: 'danger_attack', points: 0, description: 'Germany throwing everything forward in the final minutes! Wirtz driving at the Argentine defence!' },

  { id: 'ag_poss_alv', minute: 88, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez', playerId: 'arg-alvarez', type: 'possession_bonus', points: 1, description: 'Álvarez running channels relentlessly — relieving Argentina\'s pressure in the dying minutes.' },
  { id: 'ag_poss_gor', minute: 88, team: 'Germany', teamFlag: '🇩🇪', player: 'Goretzka', playerId: 'ger-goretzka', type: 'possession_bonus', points: 1, description: 'Goretzka covered every blade of grass for Germany tonight — a tireless performance.' },

  { id: 'ag_ft', minute: 90, team: '', teamFlag: '', player: '', playerId: '', type: 'full_time', points: 0, description: 'FULL TIME! Argentina 3–2 Germany! La Albiceleste are heading to the World Cup Final!' },
];
