'use client';
import { useState, useEffect } from 'react';

export default function MobileSplash() {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'done'>('in');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (window.innerWidth > 768) return; // desktop: skip entirely
    setIsMobile(true);
    // in: 0–500ms, hold: 500–1400ms, out: 1400–1900ms, done: 1900ms+
    const t1 = setTimeout(() => setPhase('hold'), 500);
    const t2 = setTimeout(() => setPhase('out'), 1400);
    const t3 = setTimeout(() => setPhase('done'), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (!isMobile || phase === 'done') return null;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#080f1c',
      zIndex: 99999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 20,
      opacity: phase === 'in' ? 0 : phase === 'out' ? 0 : 1,
      transition: phase === 'in' ? 'opacity 0.5s ease' : phase === 'out' ? 'opacity 0.5s ease' : 'none',
      pointerEvents: 'none',
    }}>
      <img
        src="/logo_oddsdraft.svg"
        alt="OddsDraft"
        style={{
          height: 72,
          width: 'auto',
          mixBlendMode: 'screen',
          transform: phase === 'in' ? 'scale(0.85)' : 'scale(1)',
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
  );
}
