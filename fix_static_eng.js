const fs = require('fs');
let file = fs.readFileSync('src/lib/wc2026-players-static.ts', 'utf8');

const engPlayers = `
  { id: 'eng-gallagher', name: 'Conor Gallagher', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'MID', jerseyNumber: 8, rating: 81 },
  { id: 'eng-palmer', name: 'Cole Palmer', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ATT', jerseyNumber: 24, rating: 83 },
  { id: 'eng-ramsdale', name: 'Aaron Ramsdale', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'GK', jerseyNumber: 13, rating: 82 },
  { id: 'eng-white', name: 'Ben White', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 21, rating: 81 },`;

file = file.replace(/(id: 'eng-quansah',.*\},)/, `$1${engPlayers}`);

fs.writeFileSync('src/lib/wc2026-players-static.ts', file);
console.log('Added missing ENG players to wc2026-players-static.ts');
