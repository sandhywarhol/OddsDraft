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
  { id: 'bra-vinicius', name: 'Vinícius Jr.', team: 'Brazil', teamFlag: '🇧🇷', position: 'ATT', jerseyNumber: 7, rating: 91 },
  { id: 'bra-rodrygo', name: 'Rodrygo', team: 'Brazil', teamFlag: '🇧🇷', position: 'ATT', jerseyNumber: 11, rating: 84 },
  { id: 'bra-richarlison', name: 'Richarlison', team: 'Brazil', teamFlag: '🇧🇷', position: 'ATT', jerseyNumber: 9, rating: 83 },
  { id: 'bra-endrick', name: 'Endrick', team: 'Brazil', teamFlag: '🇧🇷', position: 'ATT', jerseyNumber: 19, rating: 82 },
  { id: 'bra-raphinha', name: 'Raphinha', team: 'Brazil', teamFlag: '🇧🇷', position: 'ATT', jerseyNumber: 22, rating: 83 },
  { id: 'bra-martinelli', name: 'Gabriel Martinelli', team: 'Brazil', teamFlag: '🇧🇷', position: 'ATT', jerseyNumber: 21, rating: 84 },

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
  { id: 'arg-dimaria', name: 'Ángel Di María', team: 'Argentina', teamFlag: '🇦🇷', position: 'ATT', jerseyNumber: 11, rating: 82 },

  // ===== FRANCE =====
  { id: 'fra-maignan', name: 'Mike Maignan', team: 'France', teamFlag: '🇫🇷', position: 'GK', jerseyNumber: 16, rating: 88 },
  { id: 'fra-samba', name: 'Brice Samba', team: 'France', teamFlag: '🇫🇷', position: 'GK', jerseyNumber: 1, rating: 80 },
  { id: 'fra-upamecano', name: 'Dayot Upamecano', team: 'France', teamFlag: '🇫🇷', position: 'DEF', jerseyNumber: 4, rating: 83 },
  { id: 'fra-theo', name: 'Theo Hernandez', team: 'France', teamFlag: '🇫🇷', position: 'DEF', jerseyNumber: 22, rating: 84 },
  { id: 'fra-saliba', name: 'William Saliba', team: 'France', teamFlag: '🇫🇷', position: 'DEF', jerseyNumber: 17, rating: 88 },
  { id: 'fra-konate', name: 'Ibrahima Konaté', team: 'France', teamFlag: '🇫🇷', position: 'DEF', jerseyNumber: 24, rating: 83 },
  { id: 'fra-kounde', name: 'Jules Koundé', team: 'France', teamFlag: '🇫🇷', position: 'DEF', jerseyNumber: 5, rating: 84 },
  { id: 'fra-kante', name: "N'Golo Kanté", team: 'France', teamFlag: '🇫🇷', position: 'MID', jerseyNumber: 13, rating: 87 },
  { id: 'fra-camavinga', name: 'Eduardo Camavinga', team: 'France', teamFlag: '🇫🇷', position: 'MID', jerseyNumber: 8, rating: 83 },
  { id: 'fra-tchouameni', name: 'Aurélien Tchouaméni', team: 'France', teamFlag: '🇫🇷', position: 'MID', jerseyNumber: 14, rating: 85 },
  { id: 'fra-rabiot', name: 'Adrien Rabiot', team: 'France', teamFlag: '🇫🇷', position: 'MID', jerseyNumber: 25, rating: 82 },
  { id: 'fra-mbappe', name: 'Kylian Mbappé', team: 'France', teamFlag: '🇫🇷', position: 'ATT', jerseyNumber: 10, rating: 95 },
  { id: 'fra-dembele', name: 'Ousmane Dembélé', team: 'France', teamFlag: '🇫🇷', position: 'ATT', jerseyNumber: 11, rating: 83 },
  { id: 'fra-griezmann', name: 'Antoine Griezmann', team: 'France', teamFlag: '🇫🇷', position: 'ATT', jerseyNumber: 7, rating: 87 },
  { id: 'fra-giroud', name: 'Olivier Giroud', team: 'France', teamFlag: '🇫🇷', position: 'ATT', jerseyNumber: 9, rating: 80 },
  { id: 'fra-coman', name: 'Kingsley Coman', team: 'France', teamFlag: '🇫🇷', position: 'ATT', jerseyNumber: 20, rating: 84 },
  { id: 'fra-thuram', name: 'Marcus Thuram', team: 'France', teamFlag: '🇫🇷', position: 'ATT', jerseyNumber: 15, rating: 82 },

  // ===== ENGLAND =====
  { id: 'eng-pickford', name: 'Jordan Pickford', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'GK', jerseyNumber: 1, rating: 85 },
  { id: 'eng-ramsdale', name: 'Aaron Ramsdale', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'GK', jerseyNumber: 13, rating: 82 },
  { id: 'eng-stones', name: 'John Stones', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 5, rating: 83 },
  { id: 'eng-maguire', name: 'Harry Maguire', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 6, rating: 80 },
  { id: 'eng-alexander', name: 'Trent Alexander-Arnold', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 2, rating: 85 },
  { id: 'eng-walker', name: 'Kyle Walker', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 12, rating: 84 },
  { id: 'eng-trippier', name: 'Kieran Trippier', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 3, rating: 81 },
  { id: 'eng-guehi', name: 'Marc Guéhi', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 14, rating: 82 },
  { id: 'eng-bellingham', name: 'Jude Bellingham', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'MID', jerseyNumber: 10, rating: 92 },
  { id: 'eng-rice', name: 'Declan Rice', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'MID', jerseyNumber: 4, rating: 86 },
  { id: 'eng-gallagher', name: 'Conor Gallagher', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'MID', jerseyNumber: 18, rating: 81 },
  { id: 'eng-mainoo', name: 'Kobbie Mainoo', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'MID', jerseyNumber: 21, rating: 83 },
  { id: 'eng-kane', name: 'Harry Kane', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ATT', jerseyNumber: 9, rating: 90 },
  { id: 'eng-saka', name: 'Bukayo Saka', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ATT', jerseyNumber: 7, rating: 87 },
  { id: 'eng-rashford', name: 'Marcus Rashford', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ATT', jerseyNumber: 11, rating: 83 },
  { id: 'eng-foden', name: 'Phil Foden', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ATT', jerseyNumber: 20, rating: 88 },
  { id: 'eng-palmer', name: 'Cole Palmer', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ATT', jerseyNumber: 24, rating: 88 },

  // ===== PORTUGAL =====
  { id: 'por-costa', name: 'Diogo Costa', team: 'Portugal', teamFlag: '🇵🇹', position: 'GK', jerseyNumber: 1, rating: 86 },
  { id: 'por-sa', name: 'José Sá', team: 'Portugal', teamFlag: '🇵🇹', position: 'GK', jerseyNumber: 12, rating: 79 },
  { id: 'por-cancelo', name: 'João Cancelo', team: 'Portugal', teamFlag: '🇵🇹', position: 'DEF', jerseyNumber: 20, rating: 85 },
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
  { id: 'por-leao', name: 'Rafael Leão', team: 'Portugal', teamFlag: '🇵🇹', position: 'ATT', jerseyNumber: 15, rating: 84 },
  { id: 'por-jota', name: 'Diogo Jota', team: 'Portugal', teamFlag: '🇵🇹', position: 'ATT', jerseyNumber: 21, rating: 83 },
  { id: 'por-ramos', name: 'Gonçalo Ramos', team: 'Portugal', teamFlag: '🇵🇹', position: 'ATT', jerseyNumber: 9, rating: 81 },

  // ===== SPAIN =====
  { id: 'esp-unai', name: 'Unai Simón', team: 'Spain', teamFlag: '🇪🇸', position: 'GK', jerseyNumber: 1, rating: 84 },
  { id: 'esp-raya', name: 'David Raya', team: 'Spain', teamFlag: '🇪🇸', position: 'GK', jerseyNumber: 13, rating: 82 },
  { id: 'esp-carvajal', name: 'Dani Carvajal', team: 'Spain', teamFlag: '🇪🇸', position: 'DEF', jerseyNumber: 2, rating: 83 },
  { id: 'esp-laporte', name: 'Aymeric Laporte', team: 'Spain', teamFlag: '🇪🇸', position: 'DEF', jerseyNumber: 14, rating: 84 },
  { id: 'esp-lenormand', name: 'Robin Le Normand', team: 'Spain', teamFlag: '🇪🇸', position: 'DEF', jerseyNumber: 3, rating: 81 },
  { id: 'esp-grimaldo', name: 'Alejandro Grimaldo', team: 'Spain', teamFlag: '🇪🇸', position: 'DEF', jerseyNumber: 12, rating: 84 },
  { id: 'esp-cucurella', name: 'Marc Cucurella', team: 'Spain', teamFlag: '🇪🇸', position: 'DEF', jerseyNumber: 24, rating: 82 },
  { id: 'esp-pedri', name: 'Pedri', team: 'Spain', teamFlag: '🇪🇸', position: 'MID', jerseyNumber: 26, rating: 88 },
  { id: 'esp-gavi', name: 'Gavi', team: 'Spain', teamFlag: '🇪🇸', position: 'MID', jerseyNumber: 9, rating: 86 },
  { id: 'esp-rodri', name: 'Rodri', team: 'Spain', teamFlag: '🇪🇸', position: 'MID', jerseyNumber: 16, rating: 90 },
  { id: 'esp-fabian', name: 'Fabián Ruiz', team: 'Spain', teamFlag: '🇪🇸', position: 'MID', jerseyNumber: 8, rating: 84 },
  { id: 'esp-merino', name: 'Mikel Merino', team: 'Spain', teamFlag: '🇪🇸', position: 'MID', jerseyNumber: 6, rating: 82 },
  { id: 'esp-morata', name: 'Álvaro Morata', team: 'Spain', teamFlag: '🇪🇸', position: 'ATT', jerseyNumber: 7, rating: 83 },
  { id: 'esp-yamal', name: 'Lamine Yamal', team: 'Spain', teamFlag: '🇪🇸', position: 'ATT', jerseyNumber: 19, rating: 90 },
  { id: 'esp-nico', name: 'Nico Williams', team: 'Spain', teamFlag: '🇪🇸', position: 'ATT', jerseyNumber: 17, rating: 86 },
  { id: 'esp-olmo', name: 'Dani Olmo', team: 'Spain', teamFlag: '🇪🇸', position: 'ATT', jerseyNumber: 10, rating: 86 },
  { id: 'esp-torres', name: 'Ferran Torres', team: 'Spain', teamFlag: '🇪🇸', position: 'ATT', jerseyNumber: 11, rating: 81 },

  // ===== GERMANY =====
  { id: 'ger-neuer', name: 'Manuel Neuer', team: 'Germany', teamFlag: '🇩🇪', position: 'GK', jerseyNumber: 1, rating: 85 },
  { id: 'ger-terstegen', name: 'Marc-André ter Stegen', team: 'Germany', teamFlag: '🇩🇪', position: 'GK', jerseyNumber: 22, rating: 86 },
  { id: 'ger-rudiger', name: 'Antonio Rüdiger', team: 'Germany', teamFlag: '🇩🇪', position: 'DEF', jerseyNumber: 2, rating: 84 },
  { id: 'ger-tah', name: 'Jonathan Tah', team: 'Germany', teamFlag: '🇩🇪', position: 'DEF', jerseyNumber: 4, rating: 82 },
  { id: 'ger-raum', name: 'David Raum', team: 'Germany', teamFlag: '🇩🇪', position: 'DEF', jerseyNumber: 3, rating: 81 },
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
  { id: 'ger-sane', name: 'Leroy Sané', team: 'Germany', teamFlag: '🇩🇪', position: 'ATT', jerseyNumber: 19, rating: 84 },
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
  
  // If the base events already match the competing teams (e.g. custom replay), return as is
  const hasCorrectTeams = baseEvents.some(e => e.team === homeTeam || e.team === awayTeam);
  if (hasCorrectTeams && baseEvents.some(e => e.team !== 'Argentina' && e.team !== 'France' && e.team !== '')) {
    return baseEvents;
  }

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
  
  return baseEvents.map(event => {
    let mappedTeam = event.team;
    let mappedFlag = event.teamFlag;
    let mappedPlayer = event.player;
    
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
    
    // Replace names in description
    let mappedDescription = event.description || '';
    if (mappedDescription) {
      mappedDescription = mappedDescription.replace(/Argentina/gi, homeTeam);
      mappedDescription = mappedDescription.replace(/France/gi, awayTeam);
      
      Object.keys(playerMap).forEach(oldName => {
        const regex = new RegExp(oldName, 'gi');
        mappedDescription = mappedDescription.replace(regex, playerMap[oldName]);
      });
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
      description: mappedDescription,
      dialog: mappedDialog
    };
  });
}
