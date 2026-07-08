const fs = require('fs');

const path = 'src/app/live/[contestId]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. User Fantasy Stats
content = content.replace(
  '<div className="card card--primary live-stats" style={{ marginBottom: 20 }}>',
  '<div className="card card--primary live-stats live-fantasy-points" style={{ marginBottom: 20 }}>'
);

// 2. Team Lineup
content = content.replace(
  '<div className="live-team-lineup" style={{ display: \'contents\' }}>',
  '<div className="live-team-lineup">'
);

// 3. Match Events
content = content.replace(
  '<div className="desktop-only" style={{ display: \'contents\' }}>\n              {/* Match Events panel */}',
  '<div className="desktop-only live-events-wrapper">\n              {/* Match Events panel */}'
);

fs.writeFileSync(path, content);
console.log('Done');
