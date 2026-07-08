const fs = require('fs');
const file = 'src/app/live/[contestId]/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const ptRefStart = code.indexOf('{/* Point Reference */}');
const ptRefEnd = code.indexOf('</div>\n\n            </div>\n              {/* Leaderboard */}');
const ptRefBlock = code.substring(ptRefStart, ptRefEnd + 6);

const lbStart = code.indexOf('{/* Leaderboard */}');
const lbEnd = code.indexOf('{/* Cryptographic Result Verification Panel */}');
const lbBlock = code.substring(lbStart, lbEnd).trim();

// Now swap them
code = code.replace(ptRefBlock, lbBlock + '\n');
code = code.replace(lbBlock, ptRefBlock);

fs.writeFileSync(file, code);
