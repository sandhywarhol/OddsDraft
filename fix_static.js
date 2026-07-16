const fs = require('fs');
let file = fs.readFileSync('src/lib/wc2026-players-static.ts', 'utf8');

const argPlayers = `
  { id: 'arg-acuna', name: 'Marcos Acuña', team: 'Argentina', teamFlag: '🇦🇷', position: 'DEF', jerseyNumber: 8, rating: 80 },
  { id: 'arg-dimaria', name: 'Angel Di Maria', team: 'Argentina', teamFlag: '🇦🇷', position: 'ATT', jerseyNumber: 11, rating: 84 },
  { id: 'arg-dybala', name: 'Paulo Dybala', team: 'Argentina', teamFlag: '🇦🇷', position: 'ATT', jerseyNumber: 21, rating: 84 },`;

const engPlayers = `
  { id: 'eng-walker', name: 'Kyle Walker', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 2, rating: 85 },
  { id: 'eng-maguire', name: 'Harry Maguire', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 6, rating: 82 },
  { id: 'eng-shaw', name: 'Luke Shaw', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 3, rating: 83 },
  { id: 'eng-foden', name: 'Phil Foden', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'MID', jerseyNumber: 20, rating: 86 },
  { id: 'eng-trippier', name: 'Kieran Trippier', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'DEF', jerseyNumber: 12, rating: 84 },
  { id: 'eng-grealish', name: 'Jack Grealish', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ATT', jerseyNumber: 7, rating: 84 },
  { id: 'eng-mount', name: 'Mason Mount', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'MID', jerseyNumber: 19, rating: 83 },
  { id: 'eng-sterling', name: 'Raheem Sterling', team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', position: 'ATT', jerseyNumber: 10, rating: 84 },`;

file = file.replace(/(id: 'arg-molina',.*\},)/, `$1${argPlayers}`);
file = file.replace(/(id: 'eng-quansah',.*\},)/, `$1${engPlayers}`);

fs.writeFileSync('src/lib/wc2026-players-static.ts', file);
console.log('Added missing players to wc2026-players-static.ts');
