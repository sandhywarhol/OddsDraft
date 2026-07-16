const fs = require('fs');
let code = fs.readFileSync('src/app/live/[contestId]/page.tsx', 'utf8');

// Replace both instances of the onClick handler for the demo claim button
code = code.replace(
  /onClick=\{\(\) => \{\/\* demo — decorative only \*\/\}\}/g,
  `onClick={() => {
    if (claimStatus !== 'claimed') {
      setClaimStatus('submitting');
      setTimeout(() => {
        setClaimStatus('claimed');
        setClaimTxSig('demo-tx-signature-12345');
      }, 1500);
    }
  }}
  disabled={claimStatus === 'submitting' || claimStatus === 'claimed'}`
);

// We also need to change the text inside the button for the demo mode
// Currently it is CLAIM {DEMO_PRIZE_SOL} SOL →
code = code.replace(
  /CLAIM \{DEMO_PRIZE_SOL\} SOL →/g,
  `{claimStatus === 'submitting' ? 'CLAIMING...' : claimStatus === 'claimed' ? 'CLAIMED' : \`CLAIM \${DEMO_PRIZE_SOL} SOL →\`}`
);

// We also want to display the "Transaction confirmed" text if claimed, just like live mode.
// In the demo prize card, let's inject it below the button.
code = code.replace(
  /\<p style=\{\{ marginTop: 10, fontSize: '0.68rem', color: 'rgba\(255,255,255,0.28\)', lineHeight: 1.5, margin: '10px 0 0' \}\}\>\n                    \* Demo mode — no real SOL is transferred\. Live contests pay out on-chain via Solana\.\n                  \<\/p\>/g,
  `                  {claimStatus === 'claimed' ? (
                    <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(0,232,122,0.1)', borderRadius: 8, border: '1px solid rgba(0,232,122,0.2)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e87a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00e87a', marginBottom: 2 }}>Prize Sent to Wallet!</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>Tx: demo-tx-signature-12345</div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ marginTop: 10, fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)', lineHeight: 1.5, margin: '10px 0 0' }}>
                      * Demo mode — no real SOL is transferred. Live contests pay out on-chain via Solana.
                    </p>
                  )}`
);

fs.writeFileSync('src/app/live/[contestId]/page.tsx', code);
