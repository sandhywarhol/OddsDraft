const fs = require('fs');
let code = fs.readFileSync('src/app/live/[contestId]/page.tsx', 'utf8');

// 1. Resize Referee Bubble
code = code.replace(
  "width: 960, height: 540",
  "width: 720, height: 405"
);
code = code.replace(
  "fontSize: 'clamp(2rem, 6vw, 4rem)',",
  "fontSize: 'clamp(1.5rem, 5vw, 3rem)',"
);

// 2. Fix the Claim SOL button in the Demo Prize Card
const oldButton = `                      <button
                        className="btn btn--primary"
                        style={{ width: '100%' }}
                        onClick={() => {/* demo — decorative only */}}
                      >
                        Claim 0.00 SOL
                      </button>`;

const newButton = `                      <button
                        className="btn btn--primary"
                        style={{ width: '100%' }}
                        onClick={() => {
                          // In demo mode, simulate a claim
                          if (claimStatus !== 'claimed') {
                            setClaimStatus('submitting');
                            setTimeout(() => {
                              setClaimStatus('claimed');
                              setClaimTxSig('demo-tx-signature-12345');
                            }, 1500);
                          }
                        }}
                        disabled={claimStatus === 'submitting' || claimStatus === 'claimed'}
                      >
                        {claimStatus === 'submitting' ? 'Claiming...' : claimStatus === 'claimed' ? 'Claimed' : 'Claim 0.00 SOL'}
                      </button>`;

code = code.replace(oldButton, newButton);

fs.writeFileSync('src/app/live/[contestId]/page.tsx', code);
