import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      <main style={{ padding: '48px 16px 80px' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 12, color: '#ffd700', textShadow: '0 0 10px rgba(255,215,0,0.2)' }}>
              How OddsDraft Works
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Everything you need to know to start building lineups and winning SOL.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Step 1 */}
            <div className="ro-window" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="ro-window__header" style={{ background: 'linear-gradient(to right, #b45309 0%, #78350f 100%)' }}>
                <span>1 // Building Your Lineup</span>
                <span>🧩</span>
              </div>
              <div className="ro-window__body" style={{ padding: 24 }}>
                <p style={{ color: '#cbd5e1', marginBottom: 16, lineHeight: 1.6 }}>
                  For each contest (match), you must select <strong>5 players</strong> from the two competing teams. 
                  Your lineup must strictly follow this 5-a-side positional structure:
                </p>
                <ul style={{ color: '#94a3b8', paddingLeft: 0, marginBottom: 0, lineHeight: 2, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <li style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}><strong>GK:</strong> Goalkeeper</li>
                  <li style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}><strong>DEF:</strong> Defender</li>
                  <li style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}><strong>MID:</strong> Midfielder</li>
                  <li style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}><strong>MID:</strong> Midfielder</li>
                  <li style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}><strong>ATT:</strong> Attacker</li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="ro-window" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="ro-window__header" style={{ background: 'linear-gradient(to right, #b45309 0%, #78350f 100%)' }}>
                <span>2 // Captain & Confidence</span>
                <span>⭐</span>
              </div>
              <div className="ro-window__body" style={{ padding: 24 }}>
                <p style={{ color: '#cbd5e1', marginBottom: 20, lineHeight: 1.6 }}>
                  After selecting 5 players, you must assign your strategic multipliers:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 8, border: '1px solid rgba(255,215,0,0.2)' }}>
                    <strong style={{ color: '#ffd700', display: 'block', marginBottom: 8, fontSize: '1.1rem' }}>The Captain (2x Multiplier)</strong>
                    <span style={{ color: '#94a3b8' }}>Choose one player as your captain. Their total points (positive or negative) will be doubled.</span>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 8, border: '1px solid rgba(0,229,255,0.2)' }}>
                    <strong style={{ color: '#00e5ff', display: 'block', marginBottom: 8, fontSize: '1.1rem' }}>Confidence Rating (⭐1-5)</strong>
                    <span style={{ color: '#94a3b8' }}>Assign a confidence rating to each player. A higher rating increases their positive points but also heavily penalizes negative points. High risk, high reward!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="ro-window" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="ro-window__header" style={{ background: 'linear-gradient(to right, #b45309 0%, #78350f 100%)' }}>
                <span>3 // Scoring System</span>
                <span>📊</span>
              </div>
              <div className="ro-window__body" style={{ padding: 24 }}>
                <p style={{ color: '#cbd5e1', marginBottom: 16, lineHeight: 1.6 }}>
                  Points are awarded based on real-time TxODDS data during the match:
                </p>
                <table className="leaderboard" style={{ width: '100%', marginBottom: 0, border: 'none' }}>
                  <tbody style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '12px 16px', color: '#cbd5e1' }}>Goal</td><td style={{ color: '#00e87a', textAlign: 'right', fontWeight: 700, padding: '12px 16px' }}>+10 pts</td></tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '12px 16px', color: '#cbd5e1' }}>Assist</td><td style={{ color: '#00e87a', textAlign: 'right', fontWeight: 700, padding: '12px 16px' }}>+6 pts</td></tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '12px 16px', color: '#cbd5e1' }}>Shot on Target</td><td style={{ color: '#00e87a', textAlign: 'right', fontWeight: 700, padding: '12px 16px' }}>+2 pts</td></tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '12px 16px', color: '#cbd5e1' }}>Save (GK only)</td><td style={{ color: '#00e87a', textAlign: 'right', fontWeight: 700, padding: '12px 16px' }}>+1 pt</td></tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '12px 16px', color: '#cbd5e1' }}>Yellow Card</td><td style={{ color: '#ff4d6d', textAlign: 'right', fontWeight: 700, padding: '12px 16px' }}>-2 pts</td></tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '12px 16px', color: '#cbd5e1' }}>Red Card</td><td style={{ color: '#ff4d6d', textAlign: 'right', fontWeight: 700, padding: '12px 16px' }}>-5 pts</td></tr>
                    <tr><td style={{ padding: '12px 16px', color: '#cbd5e1' }}>Own Goal</td><td style={{ color: '#ff4d6d', textAlign: 'right', fontWeight: 700, padding: '12px 16px' }}>-4 pts</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step 4 */}
            <div className="ro-window" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="ro-window__header" style={{ background: 'linear-gradient(to right, #b45309 0%, #78350f 100%)' }}>
                <span>4 // Prize Distribution</span>
                <span>🏆</span>
              </div>
              <div className="ro-window__body" style={{ padding: 24 }}>
                <p style={{ color: '#cbd5e1', marginBottom: 20, lineHeight: 1.6 }}>
                  Once the match ends, the smart contract automatically distributes the prize pool based on the contest type you selected:
                </p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 150, background: 'linear-gradient(135deg, rgba(255,215,0,0.1), transparent)', border: '1px solid rgba(255,215,0,0.3)', padding: 20, borderRadius: 8, textAlign: 'center', boxShadow: 'inset 0 1px 1px rgba(255,215,0,0.1)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏆</div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ffd700' }}>Top 3 Classic</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 4 }}>50% / 30% / 20%</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 150, background: 'linear-gradient(135deg, rgba(16,185,129,0.1), transparent)', border: '1px solid rgba(16,185,129,0.3)', padding: 20, borderRadius: 8, textAlign: 'center', boxShadow: 'inset 0 1px 1px rgba(16,185,129,0.1)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚖️</div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#10b981' }}>Double Up 50/50</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 4 }}>Top 50% Win</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 150, background: 'linear-gradient(135deg, rgba(255,77,109,0.1), transparent)', border: '1px solid rgba(255,77,109,0.3)', padding: 20, borderRadius: 8, textAlign: 'center', boxShadow: 'inset 0 1px 1px rgba(255,77,109,0.1)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>💀</div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ff4d6d' }}>Winner Takes All</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 4 }}>1st gets 100%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Architecture */}
            <div className="ro-window" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="ro-window__header" style={{ background: 'linear-gradient(to right, #1e3a5f 0%, #0f2340 100%)' }}>
                <span>5 // Data Architecture</span>
                <span>⚙️</span>
              </div>
              <div className="ro-window__body" style={{ padding: 24 }}>
                <p style={{ color: '#cbd5e1', marginBottom: 20, lineHeight: 1.6 }}>
                  OddsDraft uses a hybrid data model to give you the most accurate fantasy experience:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: 'rgba(0,229,255,0.05)', padding: 16, borderRadius: 8, border: '1px solid rgba(0,229,255,0.15)' }}>
                    <strong style={{ color: '#00e5ff', display: 'block', marginBottom: 6 }}>TxODDS / TxLINE — Primary Source</strong>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Real-time match clock, game state, and player events are pulled from TxLINE feeds. These are the authoritative source for fantasy point calculation and leaderboard scoring.</span>
                  </div>
                  <div style={{ background: 'rgba(255,215,0,0.05)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,215,0,0.15)' }}>
                    <strong style={{ color: '#ffd700', display: 'block', marginBottom: 6 }}>Enriched Match Data — Display Layer</strong>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Match schedules, team rosters, and completed match event histories are sourced via server-side APIs — never exposed to the browser directly — to present richer context in the match event feed.</span>
                  </div>
                  <div style={{ background: 'rgba(0,232,122,0.05)', padding: 16, borderRadius: 8, border: '1px solid rgba(0,232,122,0.15)' }}>
                    <strong style={{ color: '#00e87a', display: 'block', marginBottom: 6 }}>Solana — Settlement Layer</strong>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Entry fees are held on Solana Devnet. Final rankings and prize outcomes are computed on-chain so results are transparent and verifiable by any participant.</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Link href="/contests" className="btn btn--primary btn--lg" style={{ background: 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)', color: '#1a1a1a', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)', fontWeight: 800 }}>
                View Match Schedule
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
