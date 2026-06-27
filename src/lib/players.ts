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
  { id: 'ger-fullkrug', name: 'Niclas Füllkrug', team: 'Germany', teamFlag: '🇩🇪', position: 'ATT', jerseyNumber: 9, rating: 83 },
  { id: 'ger-sane', name: 'Leroy Sané', team: 'Germany', teamFlag: '🇩🇪', position: 'ATT', jerseyNumber: 19, rating: 84 },
  { id: 'ger-muller', name: 'Thomas Müller', team: 'Germany', teamFlag: '🇩🇪', position: 'ATT', jerseyNumber: 13, rating: 81 },

  // ===== JAPAN =====
  { id: 'jpn-gonda', name: 'Keisuke Gonda', team: 'Japan', teamFlag: '🇯🇵', position: 'GK', jerseyNumber: 12, rating: 78 },
  { id: 'jpn-suzuki', name: 'Zion Suzuki', team: 'Japan', teamFlag: '🇯🇵', position: 'GK', jerseyNumber: 1, rating: 79 },
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
      mappedDescription = mappedDescription.replace(/Argentina/g, homeTeam);
      mappedDescription = mappedDescription.replace(/France/g, awayTeam);
      
      Object.keys(playerMap).forEach(oldName => {
        const regex = new RegExp(oldName, 'g');
        mappedDescription = mappedDescription.replace(regex, playerMap[oldName]);
      });
    }
    
    return {
      ...event,
      team: mappedTeam,
      teamFlag: mappedFlag,
      player: mappedPlayer,
      description: mappedDescription
    };
  });
}
