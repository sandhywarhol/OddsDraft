import { type UpgradeCard, UPGRADE_RARITY_COLOR, UPGRADE_CREDITS } from '@/lib/upgrade-cards';

interface UpgradeCardDisplayProps {
  card: UpgradeCard;
  width?: number;
}

export default function UpgradeCardDisplay({ card, width = 220 }: UpgradeCardDisplayProps) {
  const height = Math.round(width * (1448 / 1086));
  const rarityColor = UPGRADE_RARITY_COLOR[card.rarity];
  const posColor =
    card.position === 'Goalkeeper' ? '#1565c0' :
    card.position === 'Defender'   ? '#2e7d32' :
    card.position === 'Midfielder' ? '#e65100' :
    card.position === 'Winger'     ? '#00838f' : '#6a1b9a';
  const fs = (base: number) => `calc(${base / 220} * 100cqw)`;

  // Colorize +number green and -number red inside effect text
  const colorizeEffect = (text: string) =>
    text.split(/(\+[\d.]+%?|-[\d.]+%?)/).map((chunk, i) => {
      if (/^\+[\d.]+%?/.test(chunk)) return <span key={i} style={{ color: '#2e7d32', fontWeight: 900 }}>{chunk}</span>;
      if (/^-[\d.]+%?/.test(chunk))  return <span key={i} style={{ color: '#d32f2f', fontWeight: 900 }}>{chunk}</span>;
      return chunk;
    });

  return (
    <div style={{
      containerType: 'inline-size',
      position: 'relative',
      width: '100%',
      maxWidth: width,
      aspectRatio: '1086 / 1448',
      height: 'auto',
      flexShrink: 0,
      borderRadius: '16px',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes upgrade-card-sweep-shine {
          0% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
          15% { opacity: 0.6; }
          30% { transform: translateX(200%) skewX(-25deg); opacity: 0; }
          100% { transform: translateX(200%) skewX(-25deg); opacity: 0; }
        }
      `}</style>

      <img
        src={card.imageUrl}
        alt={card.name}
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          display: 'block',
        }}
      />

      {/* Continuous Shine Overlay */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        width: '55%',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
        animation: 'upgrade-card-sweep-shine 4s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 5,
        borderRadius: '16px',
      }} />

      <div style={{
        position: 'absolute', top: '4%', right: '4%',
        background: posColor,
        color: '#fff', fontWeight: 900, fontSize: fs(9),
        padding: `${fs(4)} ${fs(8)}`, borderRadius: 6,
        letterSpacing: '0.08em',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
      }}>
        {card.position === 'Goalkeeper' ? 'GK' : card.position === 'Defender' ? 'DEF' : card.position === 'Midfielder' ? 'MID' : card.position === 'Winger' ? 'WIN' : 'STR'}
      </div>

      {/* 1. Name Box (Cube icon) */}
      <div style={{
        position: 'absolute',
        top: '55.5%',
        left: '12%',
        width: '76%',
        height: '7%',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '11%',
      }}>
        <span style={{ 
          fontSize: fs(8.5), 
          fontWeight: 900, 
          color: '#fff',
          background: posColor,
          padding: `${fs(3)} ${fs(8)}`,
          borderRadius: 6,
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        }}>
          {card.name}
        </span>
      </div>

      {/* 2. Status Box (Wrench icon) */}
      <div style={{
        position: 'absolute',
        top: '63.5%',
        left: '12%',
        width: '76%',
        height: '7%',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '11%',
      }}>
        <span style={{ fontSize: fs(9), fontWeight: 800, color: '#444' }}>
          {colorizeEffect(`+${UPGRADE_CREDITS[card.level]} credits · Max = +30%`)}
        </span>
      </div>

      {/* 3. Description Box */}
      <div style={{
        position: 'absolute',
        top: '69%',
        left: '8%',
        width: '84%',
        height: '24%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5%',
        textAlign: 'center',
      }}>
        <span style={{ fontSize: fs(7), fontWeight: 600, color: '#444', lineHeight: 1.4 }}>
          {card.description}
        </span>
      </div>
    </div>
  );
}
