import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      <main style={{ padding: '48px 0 80px' }}>
        <div className="container-sm">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16 }}>
              How OddsDraft Works
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Everything you need to know to start building lineups and winning SOL.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <section className="card card--yellow">
              <h2 style={{ fontSize: '1.5rem', marginBottom: 16, color: 'var(--color-primary)' }}>1. Building Your Lineup</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                For each contest (match), you must select <strong>5 players</strong> from the two competing teams. 
                Your lineup must strictly follow this 5-a-side positional structure:
              </p>
              <ul style={{ color: 'var(--text-secondary)', paddingLeft: 24, marginBottom: 16, lineHeight: 2 }}>
                <li><strong>GK:</strong> Goalkeeper</li>
                <li><strong>CB:</strong> Center Back</li>
                <li><strong>MF:</strong> Midfielder</li>
                <li><strong>SW:</strong> Sweeper</li>
                <li><strong>CF:</strong> Center Forward</li>
              </ul>
            </section>

            <section className="card card--yellow">
              <h2 style={{ fontSize: '1.5rem', marginBottom: 16, color: '#ffd700' }}>2. Captain & Confidence</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                After selecting 5 players, you must assign your strategic multipliers:
              </p>
              <div style={{ background: 'var(--bg-elevated)', padding: 16, border: '1.5px solid #5c4028', boxShadow: '0 0 0 1px #000000', marginBottom: 16 }}>
                <strong style={{ color: '#ffd700', display: 'block', marginBottom: 8 }}>The Captain (2x Multiplier)</strong>
                Choose one player as your captain. Their total points (positive or negative) will be doubled.
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: 16, border: '1.5px solid #5c4028', boxShadow: '0 0 0 1px #000000' }}>
                <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: 8 }}>Confidence Rating (⭐1-5)</strong>
                Assign a confidence rating to each player. A higher rating increases their positive points but also heavily penalizes negative points. High risk, high reward!
              </div>
            </section>

            <section className="card card--yellow">
              <h2 style={{ fontSize: '1.5rem', marginBottom: 16, color: 'var(--color-info)' }}>3. Scoring System</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                Points are awarded based on real-time TxODDS data during the match:
              </p>
              <table className="leaderboard" style={{ width: '100%', marginBottom: 16 }}>
                <tbody>
                  <tr><td>Goal</td><td style={{ color: 'var(--color-primary)', textAlign: 'right', fontWeight: 700 }}>+10 pts</td></tr>
                  <tr><td>Assist</td><td style={{ color: 'var(--color-primary)', textAlign: 'right', fontWeight: 700 }}>+6 pts</td></tr>
                  <tr><td>Shot on Target</td><td style={{ color: 'var(--color-primary)', textAlign: 'right', fontWeight: 700 }}>+2 pts</td></tr>
                  <tr><td>Clean Sheet (GK/DEF)</td><td style={{ color: 'var(--color-primary)', textAlign: 'right', fontWeight: 700 }}>+5 pts</td></tr>
                  <tr><td>Penalty Save</td><td style={{ color: 'var(--color-primary)', textAlign: 'right', fontWeight: 700 }}>+8 pts</td></tr>
                  <tr><td>Goalkeeper Save</td><td style={{ color: 'var(--color-primary)', textAlign: 'right', fontWeight: 700 }}>+1 pt</td></tr>
                  <tr><td>Yellow Card</td><td style={{ color: '#ffd700', textAlign: 'right', fontWeight: 700 }}>-2 pts</td></tr>
                  <tr><td>Red Card</td><td style={{ color: 'var(--color-danger)', textAlign: 'right', fontWeight: 700 }}>-5 pts</td></tr>
                  <tr><td>Own Goal</td><td style={{ color: 'var(--color-danger)', textAlign: 'right', fontWeight: 700 }}>-6 pts</td></tr>
                </tbody>
              </table>
            </section>

            <section className="card card--yellow">
              <h2 style={{ fontSize: '1.5rem', marginBottom: 16, color: '#A855F7' }}>4. Prizes & Payouts</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                Every contest requires an entry fee (e.g., 0.1 SOL on devnet). The total collected forms the Prize Pool. When the match finishes, the smart contract automatically distributes the prize pool to the top 3 managers:
              </p>
              <ul style={{ color: 'var(--text-secondary)', paddingLeft: 24, lineHeight: 2 }}>
                <li><strong style={{ color: '#FFD700' }}>1st Place:</strong> 50% of Prize Pool</li>
                <li><strong style={{ color: '#C0C0C0' }}>2nd Place:</strong> 30% of Prize Pool</li>
                <li><strong style={{ color: '#CD7F32' }}>3rd Place:</strong> 20% of Prize Pool</li>
              </ul>
            </section>
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/contests" className="btn btn--primary btn--lg">
              🏆 Start Playing Now
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
