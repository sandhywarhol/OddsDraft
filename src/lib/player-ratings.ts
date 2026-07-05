// Accurate quality ratings (60-99) for WC2026 players.
// Applied on top of football-data.org sync which has no ratings.
// Key: player full name (as returned by football-data.org)

export const PLAYER_RATINGS: Record<string, number> = {
  // ===== BRAZIL =====
  'Alisson Becker': 91, 'Ederson': 89, 'Weverton': 82,
  'Marquinhos': 87, 'Gabriel Magalhães': 85, 'Bremer': 85,
  'Danilo Luiz da Silva': 80, 'Léo Pereira': 81, 'Roger Ibañez': 79,
  'Vinicius Junior': 92, 'Raphinha': 86, 'Endrick': 83,
  'Martinelli': 84, 'Matheus Cunha': 82, 'Luiz Henrique': 78,
  'Rodrygo': 84, 'Rayan': 76,
  'Casemiro': 86, 'Lucas Paquetá': 85, 'Bruno Guimarães': 86,
  'Fabinho': 83, 'Gerson': 80,

  // ===== NORWAY =====
  'Erling Haaland': 95, 'Alexander Sørloth': 83, 'Jørgen Strand Larsen': 79,
  'Jens Hauge': 77, 'Andreas Schjelderup': 76,
  'Martin Ødegaard': 89, 'Sander Berge': 81, 'Fredrik Aursnes': 79,
  'Antonio Nusa': 80, 'Oscar Bobb': 78, 'Kristian Thorstvedt': 77,
  'Patrick Berg': 76, 'Morten Thorsby': 75, 'Thelo Aasgaard': 74,
  'Kristoffer Ajer': 80, 'Leo Østigård': 79, 'Julian Ryerson': 78,
  'Marcus Pedersen': 77, 'Fredrik Bjørkan': 76,
  'Ørjan Nyland': 77, 'Sander Tangvik': 72, 'Egil Selvik': 71,

  // ===== ENGLAND =====
  'Jordan Pickford': 86, 'Aaron Ramsdale': 83, 'Dean Henderson': 81,
  'Kyle Walker': 84, 'Trent Alexander-Arnold': 87, 'Kieran Trippier': 83,
  'John Stones': 84, 'Harry Maguire': 81, 'Marc Guéhi': 83,
  'Luke Shaw': 82, 'Ben Chilwell': 81,
  'Jude Bellingham': 91, 'Declan Rice': 87, 'Kobbie Mainoo': 82,
  'Conor Gallagher': 81, 'Adam Wharton': 79,
  'Harry Kane': 90, 'Phil Foden': 88, 'Bukayo Saka': 88,
  'Marcus Rashford': 84, 'Cole Palmer': 86, 'Ollie Watkins': 83,
  'Anthony Gordon': 81, 'Jarrod Bowen': 80,

  // ===== FRANCE =====
  'Mike Maignan': 88, 'Alphonse Areola': 82,
  'William Saliba': 87, 'Dayot Upamecano': 85, 'Jules Koundé': 86,
  'Theo Hernandez': 84, 'Lucas Hernandez': 83, 'Benjamin Pavard': 82,
  'N\'Golo Kanté': 85, 'Aurélien Tchouaméni': 85, 'Adrien Rabiot': 82,
  'Eduardo Camavinga': 84, 'Warren Zaïre-Emery': 81,
  'Kylian Mbappé': 92, 'Antoine Griezmann': 87, 'Ousmane Dembélé': 85,
  'Marcus Thuram': 84, 'Randal Kolo Muani': 82, 'Christopher Nkunku': 83,
  'Bradley Barcola': 81, 'Kingsley Coman': 82,

  // ===== ARGENTINA =====
  'Emiliano Martínez': 90, 'Geronimo Rulli': 81,
  'Nicolás Otamendi': 83, 'Lisandro Martínez': 86, 'Cristian Romero': 86,
  'Nahuel Molina': 82, 'Nicolás Tagliafico': 81, 'Marcos Acuña': 80,
  'Rodrigo De Paul': 84, 'Leandro Paredes': 82, 'Enzo Fernández': 85,
  'Alexis Mac Allister': 85, 'Giovanni Lo Celso': 81, 'Guido Rodríguez': 80,
  'Lionel Messi': 93, 'Lautaro Martínez': 87, 'Julián Álvarez': 86,
  'Nicolás González': 81, 'Paulo Dybala': 84, 'Ángel Di María': 82,

  // ===== PORTUGAL =====
  'Diogo Costa': 86, 'Rui Patrício': 82,
  'Rúben Dias': 89, 'Pepe': 81, 'Danilo Pereira': 80,
  'Nuno Mendes': 84, 'João Cancelo': 85, 'Diogo Dalot': 82,
  'Bruno Fernandes': 88, 'Bernardo Silva': 89, 'Vitinha': 84,
  'João Palhinha': 83, 'Rúben Neves': 83, 'Matheus Nunes': 81,
  'Cristiano Ronaldo': 88, 'Rafael Leão': 86, 'Gonçalo Ramos': 84,
  'Pedro Neto': 83, 'Francisco Conceição': 81, 'João Félix': 83,

  // ===== SPAIN =====
  'Unai Simón': 86, 'David Raya': 85, 'Alex Remiro': 82,
  'Daniel Carvajal': 86, 'Dani Vivian': 82, 'Aymeric Laporte': 83,
  'Robin Le Normand': 82, 'Alejandro Grimaldo': 84, 'Mikel Merino': 83,
  'Rodri': 91, 'Pedri': 88, 'Fabián Ruiz': 84, 'Martín Zubimendi': 83,
  'Gavi': 86, 'Dani Olmo': 85,
  'Álvaro Morata': 83, 'Lamine Yamal': 87, 'Nico Williams': 86,
  'Ferran Torres': 82, 'Mikel Oyarzabal': 83, 'Ayoze Pérez': 79,

  // ===== GERMANY =====
  'Manuel Neuer': 87, 'Marc-André ter Stegen': 87, 'Oliver Baumann': 81,
  'Antonio Rüdiger': 86, 'Jonathan Tah': 84, 'Nico Schlotterbeck': 83,
  'Joshua Kimmich': 88, 'Leon Goretzka': 84, 'Florian Wirtz': 89,
  'Jamal Musiala': 88, 'Kai Havertz': 85, 'Leroy Sané': 85,
  'Thomas Müller': 84, 'Serge Gnabry': 82, 'Maximilian Mittelstädt': 81,
  'Robert Andrich': 81, 'Pascal Groß': 80,

  // ===== NETHERLANDS =====
  'Bart Verbruggen': 83, 'Mark Flekken': 81,
  'Virgil van Dijk': 89, 'Matthijs de Ligt': 85, 'Stefan de Vrij': 83,
  'Denzel Dumfries': 84, 'Daley Blind': 80, 'Nathan Aké': 83,
  'Frenkie de Jong': 87, 'Tijjani Reijnders': 84, 'Ryan Gravenberch': 84,
  'Xavi Simons': 84, 'Georginio Wijnaldum': 82, 'Teun Koopmeiners': 85,
  'Memphis Depay': 83, 'Cody Gakpo': 84, 'Steven Bergwijn': 80,
  'Donyell Malen': 82, 'Brian Brobbey': 81, 'Wout Weghorst': 79,

  // ===== BELGIUM =====
  'Koen Casteels': 85, 'Matz Sels': 82,
  'Alexander Teklemariam': 78, 'Wout Faes': 81, 'Arthur Theate': 81,
  'Timothy Castagne': 81, 'Thomas Meunier': 79,
  'Kevin De Bruyne': 90, 'Youri Tielemans': 83, 'Amadou Onana': 83,
  'Axel Witsel': 80, 'Leandro Trossard': 83, 'Charles De Ketelaere': 83,
  'Romelu Lukaku': 86, 'Dodi Lukebakio': 80, 'Jeremy Doku': 83,
  'Lois Openda': 83, 'Johan Bakayoko': 79,

  // ===== MEXICO =====
  'Guillermo Ochoa': 83, 'Luis Malagón': 80,
  'César Montes': 80, 'Johan Vásquez': 79, 'Jorge Sánchez': 79,
  'Jesús Gallardo': 79, 'Kevin Álvarez': 78,
  'Edson Álvarez': 83, 'Carlos Rodríguez': 80, 'Héctor Herrera': 80,
  'Orbelín Pineda': 79, 'Charly Rodríguez': 78,
  'Hirving Lozano': 83, 'Alexis Vega': 79, 'Raúl Jiménez': 82,
  'Santiago Giménez': 83, 'Roberto Alvarado': 79, 'Henry Martín': 79,

  // ===== USA =====
  'Matt Turner': 81, 'Ethan Horvath': 78,
  'Sergino Dest': 81, 'Antonee Robinson': 82, 'Joe Scally': 79,
  'Chris Richards': 80, 'Walker Zimmerman': 79, 'Mark McKenzie': 78,
  'Tyler Adams': 83, 'Weston McKennie': 82, 'Yunus Musah': 81,
  'Christian Pulisic': 84, 'Giovanni Reyna': 81, 'Brenden Aaronson': 80,
  'Ricardo Pepi': 80, 'Folarin Balogun': 80, 'Josh Sargent': 79,
  'Tim Weah': 80, 'Malik Tillman': 79,

  // ===== CANADA =====
  'Maxime Crépeau': 80, 'Milan Borjan': 79,
  'Alistair Johnston': 79, 'Kamal Miller': 79, 'Derek Cornelius': 78,
  'Richie Laryea': 78, 'Sam Adekugbe': 78,
  'Ismaël Koné': 80, 'Jonathan Osorio': 79, 'Stephen Eustáquio': 80,
  'Liam Millar': 78,
  'Alphonso Davies': 88, 'Jonathan David': 84, 'Cyle Larin': 80,
  'Tajon Buchanan': 81, 'Theo Bair': 77,

  // ===== JAPAN =====
  'Shuichi Gonda': 81, 'Zion Suzuki': 79,
  'Maya Yoshida': 79, 'Takehiro Tomiyasu': 82, 'Ko Itakura': 81,
  'Yuto Nagatomo': 78, 'Miki Yamane': 78,
  'Wataru Endō': 83, 'Hidemasa Morita': 81, 'Junya Ito': 81,
  'Ritsu Dōan': 82, 'Daichi Kamada': 82, 'Kaoru Mitoma': 84,
  'Takumi Minamino': 81, 'Sho Ito': 79, 'Koki Ogawa': 79,
  'Ayase Ueda': 80,

  // ===== SOUTH KOREA =====
  'Kim Seung-gyu': 80, 'Jo Hyeon-woo': 78,
  'Kim Min-jae': 87, 'Kim Young-gwon': 79, 'Kwon Kyung-won': 78,
  'Kim Moon-hwan': 78, 'Lee Ki-je': 77,
  'Lee Jae-sung': 80, 'Jung Woo-young': 78, 'Hwang In-beom': 80,
  'Son Heung-min': 89, 'Lee Kang-in': 84, 'Hwang Hee-chan': 81,
  'Cho Gue-sung': 80, 'Oh Hyeon-gyu': 79,

  // ===== MOROCCO =====
  'Yassine Bounou': 87, 'Munir El Kajoui': 79,
  'Nayef Aguerd': 83, 'Romain Saïss': 81, 'Jawad El Yamiq': 79,
  'Achraf Hakimi': 87, 'Noussair Mazraoui': 83, 'Adam Masina': 79,
  'Sofyan Amrabat': 83, 'Azzedine Ounahi': 80, 'Selim Amallah': 79,
  'Bilal El Khannouss': 80,
  'Hakim Ziyech': 83, 'Youssef En-Nesyri': 83, 'Soufiane Boufal': 80,
  'Abde Ezzalzouli': 80, 'Anass Zaroury': 79,

  // ===== SWITZERLAND =====
  'Yann Sommer': 86, 'Gregor Kobel': 85,
  'Manuel Akanji': 85, 'Nico Elvedi': 82, 'Fabian Schär': 82,
  'Ricardo Rodríguez': 81, 'Silvan Widmer': 79,
  'Granit Xhaka': 84, 'Remo Freuler': 82, 'Denis Zakaria': 81,
  'Fabian Rieder': 79, 'Vincent Sierro': 78,
  'Xherdan Shaqiri': 82, 'Breel Embolo': 81, 'Haris Seferović': 79,
  'Noah Okafor': 81, 'Dan Ndoye': 79, 'Zeki Amdouni': 79,

  // ===== COLOMBIA =====
  'Camilo Vargas': 81, 'David Ospina': 82,
  'Davinson Sánchez': 83, 'Yerry Mina': 81, 'Carlos Cuesta': 79,
  'Daniel Muñoz': 80, 'Johan Mojica': 79,
  'Wilmar Barrios': 81, 'Mateus Uribe': 80, 'Richard Ríos': 79,
  'James Rodríguez': 84, 'Cuadrado': 81, 'Juan Fernando Quintero': 80,
  'Luis Díaz': 87, 'Jhon Durán': 81, 'Rafael Santos Borré': 80,
  'Falcao': 79, 'Jhon Córdoba': 79,

  // ===== URUGUAY =====
  'Sergio Rochet': 81, 'Fernando Muslera': 82,
  'Ronald Araújo': 87, 'José María Giménez': 85, 'Sebastián Coates': 81,
  'Nahitan Nández': 80, 'Matías Viña': 79,
  'Federico Valverde': 88, 'Rodrigo Bentancur': 83, 'Manuel Ugarte': 83,
  'Lucas Torreira': 81, 'Nicolás de la Cruz': 80,
  'Luis Suárez': 83, 'Darwin Núñez': 84, 'Facundo Torres': 80,
  'Facundo Pellistri': 80, 'Maximiliano Araújo': 79,

  // ===== ECUADOR =====
  'Hernán Galíndez': 79, 'Alexander Domínguez': 80,
  'Piero Hincapié': 82, 'Jackson Porozo': 79, 'Félix Torres': 80,
  'Angelo Preciado': 79, 'Pervis Estupiñán': 83,
  'Carlos Gruezo': 79, 'Jhegson Méndez': 78, 'Moisés Caicedo': 85,
  'Gonzalo Plata': 79, 'Jeremy Sarmiento': 78,
  'Enner Valencia': 81, 'Jordy Caicedo': 79, 'Michael Estrada': 79,
  'Ángel Mena': 79,

  // ===== CROATIA =====
  'Dominik Livaković': 85, 'Ivo Grbić': 80,
  'Joško Gvardiol': 87, 'Duje Ćaleta-Car': 81, 'Domagoj Vida': 79,
  'Josip Stanišić': 80, 'Borna Sosa': 79, 'Josip Šutalo': 79,
  'Luka Modrić': 88, 'Mateo Kovačić': 86, 'Marcelo Brozović': 84,
  'Mario Pašalić': 81, 'Lovro Majer': 82,
  'Andrej Kramarić': 83, 'Ivan Perišić': 82, 'Bruno Petković': 79,
  'Marko Livaja': 79, 'Ante Budimir': 79,

  // ===== AUSTRIA =====
  'Patrick Pentz': 81, 'Alexander Schlager': 80,
  'David Alaba': 87, 'Philipp Lienhart': 80, 'Maximilian Wöber': 81,
  'Stefan Posch': 79, 'Phillipp Mwene': 78,
  'Konrad Laimer': 83, 'Florian Grillitsch': 80, 'Nicolas Seiwald': 80,
  'Marcel Sabitzer': 83, 'Christoph Baumgartner': 80,
  'Marko Arnautović': 82, 'Michael Gregoritsch': 80, 'Sasa Kalajdzic': 80,
  'Romano Schmid': 79,

  // ===== SENEGAL =====
  'Édouard Mendy': 85, 'Seny Dieng': 80,
  'Kalidou Koulibaly': 86, 'Abdou Diallo': 81, 'Pape Abou Cissé': 79,
  'Youssouf Sabaly': 79, 'Formose Mendy': 78,
  'Nampalys Mendy': 79, 'Pape Matar Sarr': 82, 'Cheikhou Kouyaté': 79,
  'Idrissa Gueye': 82, 'Lamine Camara': 80,
  'Sadio Mané': 87, 'Ismaïla Sarr': 82, 'Boulaye Dia': 81,
  'Habib Diallo': 79, 'Nicolas Jackson': 82,

  // ===== TURKEY =====
  'Mert Günok': 82, 'Uğurcan Çakır': 81,
  'Merih Demiral': 83, 'Çağlar Söyüncü': 82, 'Samet Akaydin': 79,
  'Zeki Çelik': 81, 'Ferdi Kadıoğlu': 82,
  'Hakan Çalhanoğlu': 87, 'İsmail Yüksek': 79, 'Orkun Kökçü': 80,
  'Kaan Ayhan': 79,
  'Arda Güler': 84, 'Kerem Aktürkoğlu': 81, 'Yusuf Yazıcı': 81,
  'Baris Yılmaz': 79, 'Cenk Tosun': 79,

  // ===== AUSTRALIA =====
  'Mathew Ryan': 82, 'Danny Vukovic': 78,
  'Harry Souttar': 82, 'Kye Rowles': 79, 'Bailey Wright': 78,
  'Nathaniel Atkinson': 79, 'Aziz Behich': 78,
  'Jackson Irvine': 80, 'Ajdin Hrustić': 80, 'Aaron Mooy': 81,
  'Denis Genreau': 78, 'Riley McGree': 79,
  'Mathew Leckie': 80, 'Martin Boyle': 79, 'Jason Cummings': 78,
  'Mitchell Duke': 79, 'Adam Taggart': 78,

  // ===== GHANA =====
  'Lawrence Ati-Zigi': 78, 'Manaf Nurudeen': 76,
  'Alexander Djiku': 79, 'Daniel Amartey': 79, 'Gideon Mensah': 77,
  'Tariq Lamptey': 80, 'Baba Rahman': 77,
  'Thomas Partey': 84, 'Mohammed Kudus': 83, 'Daniel-Kofi Kyereh': 79,
  'Antoine Semenyo': 79, 'Kamaldeen Sulemana': 80,
  'Jordan Ayew': 79, 'André Ayew': 79, 'Inaki Williams': 81,
  'Osman Bukari': 78,

  // ===== EGYPT =====
  'Mohamed El-Shenawy': 81, 'Ahmed El-Shenawy': 78,
  'Ahmed Hegazi': 80, 'Mohamed Abdelmonem': 78, 'Mahmoud Hamdi': 77,
  'Mohamed Hany': 78, 'Ayman Ashraf': 77,
  'Tarek Hamed': 78, 'Amr El Sulaya': 77, 'Ahmed Sayed Zizo': 78,
  'Emam Ashour': 78, 'Mahmoud Trezeguet': 79,
  'Mohamed Salah': 90, 'Omar Marmoush': 83, 'Ahmed Kamouka': 77,
  'Mostafa Mohamed': 79,

  // ===== SAUDI ARABIA =====
  'Mohammed Al-Owais': 80, 'Nawaf Al-Aqidi': 77,
  'Ali Al-Bulaihi': 79, 'Hassan Tambakti': 78, 'Abdulelah Al-Amri': 77,
  'Saud Abdulhamid': 79, 'Yasser Al-Shahrani': 78,
  'Mohammed Kanno': 79, 'Salman Al-Faraj': 80, 'Abdelhamid Al-Dossari': 77,
  'Ali Al-Hassan': 78,
  'Salem Al-Dawsari': 82, 'Firas Al-Buraikan': 79, 'Abdullah Al-Hamdan': 78,
  'Saleh Al-Shehri': 79,

  // ===== IRAN =====
  'Alireza Beiranvand': 82, 'Hossein Hosseini': 78,
  'Morteza Pouraliganji': 79, 'Shoja Khalilzadeh': 78, 'Rouzbeh Cheshmi': 79,
  'Sadegh Moharrami': 79, 'Ehsan Hajsafi': 79,
  'Saeid Ezatolahi': 80, 'Ahmad Noorollahi': 79, 'Ali Gholizadeh': 79,
  'Mehdi Torabi': 79, 'Milad Sarlak': 77,
  'Sardar Azmoun': 83, 'Mehdi Taremi': 84, 'Karim Ansarifard': 79,
  'Allahyar Sayyadmanesh': 79,

  // ===== SWEDEN =====
  'Robin Olsen': 81, 'Karl-Johan Johnsson': 78,
  'Victor Nilsson Lindelöf': 83, 'Isak Petersson': 79, 'Marcus Danielson': 78,
  'Emil Krafth': 78, 'Mikael Lustig': 77,
  'Albin Ekdal': 78, 'Viktor Claesson': 79, 'Dejan Kulusevski': 84,
  'Mattias Svanberg': 79, 'Emil Forsberg': 82,
  'Alexander Isak': 85, 'Robin Quaison': 78, 'Jordan Larsson': 78,
  'Anthony Elanga': 81, 'Jesper Karlsson': 79,

  // ===== TUNISIA =====
  'Aymen Dahmen': 79, 'Bechir Ben Said': 76,
  'Dylan Bronn': 78, 'Montassar Talbi': 78, 'Nader Ghandri': 77,
  'Ali Maaloul': 79, 'Mohamed Drager': 78,
  'Ellyes Skhiri': 81, 'Aissa Laidouni': 79, 'Hannibal Mejbri': 79,
  'Ferjani Sassi': 79, 'Naim Sliti': 78,
  'Youssef Msakni': 80, 'Wahbi Khazri': 79, 'Seifeddine Jaziri': 78,
  'Issam Jebali': 79,

  // ===== JAPAN (additional) =====
  'Takefusa Kubo': 83, 'Ao Tanaka': 81,

  // ===== PARAGUAY =====
  'Antony Silva': 79, 'Gatito Fernández': 78,
  'Gustavo Gómez': 82, 'Omar Alderete': 79, 'Fabián Balbuena': 79,
  'Matías Rojas': 80, 'Júnior Alonso': 78,
  'Andrés Cubas': 79, 'Miguel Almirón': 83, 'Richard Sánchez': 79,
  'Mathías Villasanti': 78,
  'Ángel Romero': 80, 'Roque Santa Cruz': 76, 'Antonio Sanabria': 80,
  'Alberto Espínola': 78,

  // ===== PANAMA =====
  'Luis Mejía': 79, 'Orlando Mosquera': 76,
  'Harold Cummings': 79, 'Fidel Escobar': 78, 'Eric Davis': 77,
  'Michael Murillo': 79, 'Édgar Yoel Bárcenas': 77,
  'José Fajardo': 78, 'Adalberto Carrasquilla': 79, 'César Blackman': 77,
  'Anibal Godoy': 80,
  'Rolando Blackburn': 78, 'Abdiel Arroyo': 78, 'Ismael Díaz': 78,
  'Cecilio Waterman': 78,

  // ===== NEW ZEALAND =====
  'Oliver Sail': 77, 'Stefan Marinovic': 76,
  'Winston Reid': 78, 'Tommy Smith': 77, 'Michael Boxall': 77,
  'Liberato Cacace': 78, 'Tim Payne': 76,
  'Marko Stamenic': 78, 'Clayton Lewis': 77, 'Callum McCowatt': 76,
  'Marco Rojas': 77,
  'Chris Wood': 80, 'Daizen Maeda': 79, 'Eli Just': 76,
  'Matthew Garbett': 76,

  // ===== SOUTH AFRICA =====
  'Ronwen Williams': 80, 'Bruce Bvuma': 77,
  'Rushine de Reuck': 79, 'Siyanda Xulu': 78, 'Mothobi Mvala': 78,
  'Terrence Mashego': 78, 'Teboho Mokoena': 80,
  'Themba Zwane': 81, 'Ethan Nompokothi': 76, 'Njabulo Blom': 79,
  'Percy Tau': 81, 'Bongokuhle Hlongwane': 79,
  'Lyle Foster': 79, 'Evidence Makgopa': 78, 'Bradley Grobler': 77,

  // ===== CAPE VERDE =====
  'Vozinha': 79, 'Josimar': 76,
  'Stopira': 79, 'Héldon': 78, 'Dylan Tavares': 77,
  'Koba Cissé': 79, 'Fábio Carvalho': 80,
  'Jamiro Monteiro': 79, 'Kenny Rocha': 77, 'Júlio Tavares': 78,
  'Garry Rodrigues': 78,

  // ===== IRAQ =====
  'Jalal Hassan': 77, 'Dhurgham Ismail': 75,
  'Ali Adnan': 79, 'Rebin Sulaka': 76, 'Ahmed Ibrahim': 76,
  'Saad Natiq': 77, 'Bashar Resan': 76,
  'Amjed Attwan': 77, 'Aymen Hussein': 79, 'Osama Rashid': 78,
  'Humam Tariq': 76,
  'Mohanad Ali': 78, 'Alaa Abbas': 77, 'Ahmed Yasin': 77,

  // ===== JORDAN =====
  'Yazeed Abo Laila': 77, 'Mohammad Abu Hamdan': 75,
  'Yazan Alanazeh': 77, 'Musa Al-Taamari': 79, 'Baha Faisal': 76,
  'Mohammad Al-Dmeiri': 76, 'Bara Salman': 75,
  'Nour Ali': 77, 'Ahmad Hayel': 76, 'Salam Al-Aqraa': 77,
  'Abdullah Nasib': 76, 'Mohammad Abu Zema': 76,
  'Hamza Al-Dardour': 78, 'Zaid Al-Deek': 77,

  // ===== ALGERIA =====
  'Raïs M\'Bolhi': 82, 'Alexandre Oukidja': 80,
  'Djamel Benlamri': 79, 'Riyad Boudebouz': 78, 'Aïssa Mandi': 80,
  'Youcef Atal': 81, 'Rami Bensebaini': 82,
  'Ismaël Bennacer': 84, 'Adlène Guedioura': 78, 'Sofiane Feghouli': 79,
  'Houssem Aouar': 81, 'Ramiz Zerrouki': 79,
  'Riyad Mahrez': 86, 'Andy Delort': 79, 'Baghdad Bounedjah': 79,
  'Youcef Belaïli': 80, 'Islam Slimani': 79,

  // ===== IVORY COAST =====
  'Yahia Fofana': 81, 'Badra Ali Sangaré': 79,
  'Willy Boly': 81, 'Odilon Kossounou': 81, 'Simon Deli': 79,
  'Serge Aurier': 80, 'Ghislain Konan': 79,
  'Jean-Louis Touré': 78, 'Ibrahim Sangaré': 83, 'Franck Kessié': 83,
  'Jean Michaël Seri': 78, 'Seko Fofana': 83,
  'Sébastien Haller': 83, 'Nicolas Pépé': 81, 'Jonathan Kodjia': 79,
  'Wilfried Zaha': 82, 'Wilfried Gnonto': 79, 'Simon Adingra': 80,

  // ===== UZBEKISTAN =====
  'Eldor Shomurodov': 81, 'Dostonbek Khamdamov': 77,
  'Sanjar Tursunov': 78, 'Sherzod Nishonov': 77, 'Bobur Abdikholiqov': 77,
  'Khurshid Makhkamov': 77, 'Jasurbek Yakhshiboev': 77,
  'Jamshid Iskanderov': 78, 'Doniyor Ergashev': 78, 'Jaloliddin Masharipov': 79,
  'Azizbek Turgunboev': 77, 'Khojimat Erkinov': 76,
  'Otabek Shukurov': 77, 'Umid Nasimov': 76,

  // ===== HAITI =====
  'Josué Duverger': 76, 'Carlens Arcus': 74,
  'Andrew Jean-Baptiste': 77, 'Mechack Jérôme': 76, 'Florian Ayé': 76,
  'Steeven Saba': 77, 'Frantzdy Pierrot': 75,
  'Duckens Nazon': 78, 'Derrick Etienne': 77, 'Wilde-Donald Guerrier': 76,
  'Kevin Lafrance': 76,
  'Frantzdy Pierrot': 76, 'Nazon': 78, 'Kervens Belfort': 76,

  // ===== CZECH REPUBLIC =====
  'Jiří Staněk': 82, 'Tomáš Vaclík': 81,
  'Tomáš Souček': 83, 'Jan Bořil': 79, 'Vladimír Coufal': 80,
  'Lukáš Hrádecký': 79, 'David Zima': 79,
  'Tomáš Holeš': 79, 'Lukáš Provod': 79, 'Marek Suchý': 78,
  'Ondřej Lingr': 79, 'Alex Král': 80,
  'Patrik Schick': 84, 'Adam Hložek': 81, 'Tomáš Chorý': 79,
  'Jan Kuchta': 78, 'David Jurásek': 78,

  // ===== BOSNIA & HERZEGOVINA =====
  'Ibrahim Šehić': 80, 'Kenan Pirić': 77,
  'Sead Kolašinac': 81, 'Ermin Bičakčić': 79, 'Ognjen Vranješ': 78,
  'Amer Gojak': 80, 'Amar Dedić': 80,
  'Miralem Pjanić': 83, 'Luka Menalo': 78, 'Jasmin Mujezinović': 78,
  'Ermedin Demirović': 83, 'Haris Seferović': 79,
  'Edin Džeko': 84, 'Armin Hodžić': 78, 'Anel Ahmedhodžić': 80,

  // ===== QATAR =====
  'Meshaal Barsham': 80, 'Yousuf Hassan': 76,
  'Assim Madibo': 78, 'Pedro Miguel': 78, 'Homam Ahmed': 77,
  'Karim Boudiaf': 79, 'Bassam Al-Rawi': 77,
  'Abdulaziz Hatem': 79, 'Akram Afif': 82, 'Almoez Ali': 81,
  'Hassan Al-Haydos': 80, 'Ismail Mohamad': 77,
  'Mohammed Muntari': 79, 'Ahmad Al-Rawi': 77,

  // ===== SCOTLAND =====
  'Angus Gunn': 81, 'Craig Gordon': 79,
  'Grant Hanley': 79, 'Liam Cooper': 78, 'Jack Hendry': 79,
  'Andrew Robertson': 86, 'Aaron Hickey': 81, 'Kieran Tierney': 82,
  'Scott McTominay': 83, 'John McGinn': 82, 'Billy Gilmour': 81,
  'Callum McGregor': 82, 'Stuart Armstrong': 79,
  'Che Adams': 79, 'Lyndon Dykes': 78, 'Lawrence Shankland': 79,
  'Ryan Christie': 79, 'Ryan Jack': 78,

  // ===== CURACAO =====
  'Eloy Room': 79, 'Wuilker Faríñez': 78,
  'Jurien Gaari': 77, 'Rangelo Janga': 77, 'Cuco Martina': 77,
  'Vurnon Anita': 78, 'Leandro Bacuna': 78,
  'Jeanvion Amatikole': 76, 'Leandro Bacuna': 78, 'Rocky Dwarka': 76,
  'Giliano Wijnaldum': 79,
  'Kenzo Goudmijn': 78, 'Myron Boadu': 80, 'Curaçao': 76,

  // ===== CONGO DR =====
  'Joël Kiassumbua': 79, 'Lionel Mpasi': 76,
  'Merveille Bokadi': 78, 'Chancel Mbemba': 81, 'Marcel Tisserand': 79,
  'Zakaria Diallo': 78, 'Arthur Masuaku': 79,
  'Neeskens Kebano': 79, 'Yannick Bolasie': 79, 'Silas Katompa Mvumpa': 80,
  'Cédric Bakambu': 80, 'Théo Bongonda': 78,
  'Dieumerci Mbokani': 79, 'Gael Kakuta': 78,

  // ===== COLOMBIA (additional) =====
  'Lerma': 80, 'Juan Lerma': 80,
};

// Players who should be excluded (retired from national team, etc.)
export const EXCLUDED_PLAYERS: Set<string> = new Set([
  'Neymar',        // Brazil — retired from national team Oct 2023
  'Alex Sandro',   // Brazil — retired from national team
  'Thiago',        // Brazil — Thiago Silva retired from international football 2024
  'Dani Alves',    // Brazil — banned
]);
