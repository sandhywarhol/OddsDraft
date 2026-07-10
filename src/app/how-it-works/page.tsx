import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      <main style={{ padding: '48px 0 80px' }}>
        <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Header */}
          <div style={{
            marginBottom: 40,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20,
            position: 'relative',
            padding: '54px 40px',
            border: '2px solid #ffd700',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            {/* Background Image without blur */}
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              backgroundImage: 'url("/how_it_work.webp")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 1,
              pointerEvents: 'none',
            }} />

            {/* Light gradient overlay to ensure text readability without being too dark */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
              background: 'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 60%)',
            }} />

            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{
                  background: '#ffd700',
                  color: '#000000',
                  padding: '3px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderRadius: 0
                }}>
                  Guide
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 8, lineHeight: 1.1 }}>
                How OddsDraft Works
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                Everything you need to know to start building lineups and winning SOL.
              </p>
            </div>
            <img 
              src="/fifa_world_cup_2026_logo.webp" 
              alt="FIFA World Cup 2026 Logo" 
              style={{ height: '120px', objectFit: 'contain', opacity: 0.95, margin: 0, position: 'relative', zIndex: 2 }}
            />
          </div>
        </div>

        <div className="container" style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
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
                  <li style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}><strong>DEF:</strong> Defender (CB / LB / RB)</li>
                  <li style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}><strong>MID:</strong> Midfielder (CMF / AMF)</li>
                  <li style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}><strong>SWG:</strong> Swinger — wing player (LW / RW)</li>
                  <li style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}><strong>FWD:</strong> Forward (CF / SS)</li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="ro-window" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="ro-window__header" style={{ background: 'linear-gradient(to right, #b45309 0%, #78350f 100%)' }}>
                <span>2 // Multipliers & Boosts</span>
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
                    <span style={{ color: '#94a3b8' }}>Assign a confidence rating to each player (up to 1.5x points). A higher rating increases their positive points but also heavily penalizes negative points. High risk, high reward!</span>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 8, border: '1px solid rgba(255,77,109,0.2)' }}>
                    <strong style={{ color: '#ff4d6d', display: 'block', marginBottom: 8, fontSize: '1.1rem' }}>Skill Card Equipment</strong>
                    <span style={{ color: '#94a3b8' }}>Equip a Skill Card to boost a specific event type for that player — e.g. a Legendary Striker card adds +1.5 pts per goal on top of the base score. Upgrade cards increase this bonus further (up to +30%). Applied before captain and confidence multipliers.</span>
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
                  Points are awarded based on real-time TxODDS data. Different positions earn different points:
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table className="leaderboard" style={{ width: '100%', marginBottom: 16, border: 'none', minWidth: '500px' }}>
                    <thead style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px 8px 0 0' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1', textAlign: 'left' }}>Event</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1', textAlign: 'center' }}>GK</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1', textAlign: 'center' }}>DEF</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1', textAlign: 'center' }}>MID</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1', textAlign: 'center' }}>SWG</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1', textAlign: 'center' }}>ATT</th>
                      </tr>
                    </thead>
                    <tbody style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '0 0 8px 8px' }}>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '12px 16px', color: '#cbd5e1' }}>Goal</td><td style={{ color: '#00e87a', textAlign: 'center', fontWeight: 700 }}>+20</td><td style={{ color: '#00e87a', textAlign: 'center', fontWeight: 700 }}>+15</td><td style={{ color: '#00e87a', textAlign: 'center', fontWeight: 700 }}>+12</td><td style={{ color: '#00e87a', textAlign: 'center', fontWeight: 700 }}>+11</td><td style={{ color: '#00e87a', textAlign: 'center', fontWeight: 700 }}>+10</td></tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '12px 16px', color: '#cbd5e1' }}>Assist / Pen Scored</td><td style={{ color: '#00e87a', textAlign: 'center', fontWeight: 700 }}>+6 / +5</td><td colSpan={4} style={{ color: '#00e87a', textAlign: 'center', fontWeight: 700 }}>+6 / +5 (All)</td></tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '12px 16px', color: '#cbd5e1' }}>Clean Sheet</td><td style={{ color: '#00e87a', textAlign: 'center', fontWeight: 700 }}>+5</td><td style={{ color: '#00e87a', textAlign: 'center', fontWeight: 700 }}>+5</td><td style={{ color: '#00e87a', textAlign: 'center', fontWeight: 700 }}>+1</td><td style={{ color: '#00e87a', textAlign: 'center', fontWeight: 700 }}>+1</td><td style={{ color: '#cbd5e1', textAlign: 'center' }}>0</td></tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}><td style={{ padding: '12px 16px', color: '#cbd5e1' }}>Yellow / Red Card</td><td colSpan={5} style={{ color: '#ff4d6d', textAlign: 'center', fontWeight: 700 }}>-2 / -5 (All)</td></tr>
                      <tr><td style={{ padding: '12px 16px', color: '#cbd5e1' }}>Own Goal / Pen Miss</td><td colSpan={5} style={{ color: '#ff4d6d', textAlign: 'center', fontWeight: 700 }}>-6 / -3 (All)</td></tr>
                    </tbody>
                  </table>
                </div>
                <p style={{ color: '#cbd5e1', marginBottom: 16, lineHeight: 1.6 }}>
                  Plus, get <strong>Stats-Based Bonuses</strong> evaluated twice per match (Half-Time & Full-Time) based on:
                </p>
                <ul style={{ color: '#94a3b8', paddingLeft: 20, marginBottom: 0, lineHeight: 1.8 }}>
                  <li><strong>Possession Dominance:</strong> Team possession ≥ 50% (+1 to +2 pts based on position)</li>
                  <li><strong>Attack Pressure:</strong> Team achieves ≥ 5 danger attacks or ≥ 4 corners</li>
                  <li><strong>Defensive Solidity:</strong> Opponent limited to ≤ 2 danger attacks (+2 for GK, +1 for DEF)</li>
                  <li><strong>Indirect Contributions:</strong> If a team scores, players on that team (even if they didn't score) get +1</li>
                </ul>
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
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Entry fees are sent to a Solana treasury wallet. Final rankings are computed server-side from live TxLINE event data, then prize SOL is distributed on-chain — verifiable on Solana Explorer by any participant.</span>
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
