'use client';
import { useState, useEffect } from 'react';

export default function MobileSplash() {
  const [phase, setPhase] = useState<'hold' | 'out' | 'done'>('hold');

  useEffect(() => {
    // hold: 0–1400ms, out: 1400–1900ms, done: 1900ms+
    const t2 = setTimeout(() => setPhase('out'), 1400);
    const t3 = setTimeout(() => setPhase('done'), 1900);
    return () => { clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (phase === 'done') return null;

  return (
    <>
      <style>{`
        .mobile-splash { display: none; }
        @media (max-width: 768px) {
          .mobile-splash { display: flex !important; }
        }
      `}</style>
      <div className="mobile-splash" style={{
        position: 'fixed', inset: 0,
        background: '#080f1c',
        zIndex: 99999,
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 20,
        opacity: phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 0.5s ease' : 'none',
        pointerEvents: 'none',
      }}>
        <img
          src="/logo_oddsdraft.svg"
          alt="OddsDraft"
          style={{
            height: 72,
            width: 'auto',
            transform: 'scale(1)',
          }}
        />
        <div style={{
          display: 'flex', gap: 6, alignItems: 'center',
          opacity: phase === 'hold' ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#ffd700',
              animation: `splash-dot 1s ease-in-out ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
        <style>{`
          @keyframes splash-dot {
            0%, 100% { opacity: 0.3; transform: translateY(0); }
            50% { opacity: 1; transform: translateY(-4px); }
          }
        `}</style>
      </div>
    </>
  );
}
