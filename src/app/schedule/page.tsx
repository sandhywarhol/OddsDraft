'use client';

import { DEMO_FIXTURES } from '@/lib/players';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function SchedulePage() {
  const matches = DEMO_FIXTURES;
  
  return (
    <div style={{ minHeight: '100vh', background: '#080f1c', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '60px 0', background: '#111827' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>Match Schedule</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Upcoming, live, and completed matches.</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800, margin: '0 auto' }}>
            {matches.map(match => {
              const date = new Date(match.kickoffAt);
              const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
              
              return (
                <div key={match.fixtureId} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                      {dateStr} • {timeStr}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: '1.5rem' }}>{match.homeFlag}</span>
                      <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#f8fafc' }}>{match.homeTeam}</span>
                      <span style={{ margin: '0 12px', color: 'var(--text-secondary)' }}>vs</span>
                      <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#f8fafc' }}>{match.awayTeam}</span>
                      <span style={{ fontSize: '1.5rem' }}>{match.awayFlag}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    {match.status === 'live' && (
                      <Link href={`/contest/demo-live`} className="btn btn--danger btn--sm">
                        Join Live Contest
                      </Link>
                    )}
                    {match.status === 'upcoming' && (
                      <button className="btn btn--secondary btn--sm" disabled>
                        Upcoming
                      </button>
                    )}
                    {match.status === 'finished' && (
                      <Link href={`/replay/${match.fixtureId}`} className="btn btn--primary btn--sm">
                        Watch Replay
                      </Link>
                    )}
                    
                    {match.status !== 'upcoming' && (
                      <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.5rem', letterSpacing: '0.1em', color: '#f8fafc' }}>
                        {match.homeScore ?? 0} — {match.awayScore ?? 0}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
