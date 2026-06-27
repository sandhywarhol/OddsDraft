import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { DEMO_FIXTURES, type DemoFixture } from '@/lib/players';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contests — OddsDraft | World Cup 2026 Fantasy Football',
  description: 'Join World Cup 2026 fantasy contests. Build your lineup, pick your captain, and win SOL prizes.',
};

export default function ContestsPage() {
  const upcoming = DEMO_FIXTURES.filter((f) => f.status === 'upcoming');
  const live = DEMO_FIXTURES.filter((f) => f.status === 'live');
  const finished = DEMO_FIXTURES.filter((f) => f.status === 'finished');

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      <main style={{ padding: '48px 0 80px' }}>
        <div className="container">
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span className="badge badge--primary">2026 World Cup</span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 8 }}>
              Fantasy Contests
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Pick a match, build your lineup, and compete for SOL prizes.
            </p>
          </div>

          {/* Entry Fee Info */}
          <div className="card card--glass" style={{ marginBottom: 32, padding: 'var(--space-4) var(--space-6)' }}>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Entry Fee', value: '0.1 SOL (Devnet)', icon: '💰' },
                { label: 'Prize Split', value: '50% / 30% / 20%', icon: '🏆' },
                { label: 'Network', value: 'Solana Devnet', icon: '🔗' },
                { label: 'Data', value: 'TxODDS Live', icon: '⚡' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LIVE Contests */}
          {live.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Live Now</h2>
                <span className="badge badge--live">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                  {live.length} match{live.length > 1 ? 'es' : ''}
                </span>
              </div>
              <div className="grid-contests">
                {live.map((fixture) => (
                  <ContestCard key={fixture.fixtureId} fixture={fixture} />
                ))}
              </div>
            </section>
          )}

          {/* UPCOMING Contests */}
          {upcoming.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>Upcoming</h2>
              <div className="grid-contests">
                {upcoming.map((fixture) => (
                  <ContestCard key={fixture.fixtureId} fixture={fixture} />
                ))}
              </div>
            </section>
          )}

          {/* FINISHED Contests */}
          {finished.length > 0 && (
            <section>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-secondary)' }}>
                Completed
              </h2>
              <div className="grid-contests">
                {finished.map((fixture) => (
                  <ContestCard key={fixture.fixtureId} fixture={fixture} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function ContestCard({ fixture }: { fixture: DemoFixture }) {
  const kickoff = new Date(fixture.kickoffAt);
  const isLive = fixture.status === 'live';
  const isFinished = fixture.status === 'finished';
  const isUpcoming = fixture.status === 'upcoming';

  // Simulated participant count & prize pool
  const participants = isLive ? 47 : isFinished ? 83 : Math.floor(Math.random() * 30) + 10;
  const prizePool = (participants * 0.1).toFixed(1);

  return (
    <div
      className="ro-window card--hoverable"
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
      id={`contest-card-${fixture.fixtureId}`}
    >
      {/* Live pulse bg */}
      {isLive && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at top right, rgba(255, 77, 109, 0.08), transparent 60%)',
          pointerEvents: 'none',
        }} />
      )}

      {/* RO Window Header */}
      <div className="ro-window__header" style={{
        background: isLive 
          ? 'linear-gradient(to right, #ea6b6b 0%, #b71c1c 100%)'
          : (isFinished ? 'linear-gradient(to right, #4f5f70 0%, #2c353f 100%)' : 'linear-gradient(to right, var(--color-ro-blue-header) 0%, var(--color-ro-blue-header-light) 100%)'),
      }}>
        <span>{fixture.homeTeam} vs {fixture.awayTeam}</span>
        <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>
          {isLive ? '🔴 LIVE' : isUpcoming ? '⏳ UPCOMING' : '🏁 COMPLETED'}
        </span>
      </div>

      <div className="ro-window__body">
        {/* Time info */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {isUpcoming
              ? `Starts in ${formatDistanceToNow(kickoff)}`
              : isLive
              ? `Started ${formatDistanceToNow(kickoff)} ago`
              : format(kickoff, 'MMM d, yyyy')}
          </span>
        </div>

        {/* Teams */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>{fixture.homeFlag}</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fixture.homeTeam}</div>
            {isLive && (
              <div style={{
                fontFamily: 'Bebas Neue, cursive',
                fontSize: '2.5rem',
                color: 'var(--text-primary)',
                marginTop: 4,
              }}>
                {fixture.homeScore ?? 0}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', padding: '0 16px' }}>
            {isLive ? (
              <div style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.8rem' }}>VS</div>
            ) : isFinished ? (
              <div style={{
                fontFamily: 'Bebas Neue, cursive',
                fontSize: '1.8rem',
                color: 'var(--text-secondary)',
                letterSpacing: '0.08em',
              }}>
                {fixture.homeScore} — {fixture.awayScore}
              </div>
            ) : (
              <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.5rem', color: 'var(--text-muted)' }}>
                VS
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>{fixture.awayFlag}</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fixture.awayTeam}</div>
            {isLive && (
              <div style={{
                fontFamily: 'Bebas Neue, cursive',
                fontSize: '2.5rem',
                color: 'var(--text-primary)',
                marginTop: 4,
              }}>
                {fixture.awayScore ?? 0}
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.3rem', color: 'var(--color-primary)' }}>
              {prizePool}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Prize Pool
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.3rem', color: 'var(--text-primary)' }}>
              {participants}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Players
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.3rem', color: 'var(--color-accent)' }}>
              0.1
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Entry SOL
            </div>
          </div>
        </div>

        {/* Capacity Bar (EXP styled) */}
        {!isFinished && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: '700' }}>
              <span>LOBBY EXP CAPACITY</span>
              <span>{participants} / 100 players</span>
            </div>
            <div className="ro-bar">
              <div 
                className="ro-bar__fill ro-bar__fill--exp" 
                style={{ width: `${Math.min((participants / 100) * 100, 100)}%` }} 
              />
              <div className="ro-bar__text">EXP: {Math.min((participants / 100) * 100, 100).toFixed(0)}%</div>
            </div>
          </div>
        )}

        {/* CTA */}
        {isUpcoming && (
          <Link
            href={`/lineup/${fixture.fixtureId}`}
            className="btn btn--primary btn--full"
            id={`join-${fixture.fixtureId}`}
          >
            Build Lineup →
          </Link>
        )}
        {isLive && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/live/${fixture.fixtureId}`} className="btn btn--danger btn--full" id={`live-${fixture.fixtureId}`}>
              🔴 Watch Live
            </Link>
            <Link href={`/lineup/${fixture.fixtureId}`} className="btn btn--secondary" id={`join-live-${fixture.fixtureId}`} style={{ whiteSpace: 'nowrap' }}>
              Join
            </Link>
          </div>
        )}
        {isFinished && (
          <Link
            href={`/contest/${fixture.fixtureId}`}
            className="btn btn--ghost btn--full"
            id={`results-${fixture.fixtureId}`}
          >
            View Results
          </Link>
        )}
      </div>
    </div>
  );
}
