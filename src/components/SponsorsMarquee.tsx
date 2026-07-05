import React from 'react';

export default function SponsorsMarquee() {
  const items = [
    { type: 'sponsor_text', name: 'POWERED BY TxODDS', font: 'Arial Black, sans-serif' },
    { type: 'sponsor_text', name: 'KONAMI', font: 'Arial Black, sans-serif' },
    { type: 'ad', title: 'Get 50% Off SOL', cta: 'Trade Now', color: '#14F195' },
    { type: 'sponsor_text', name: 'txLINE DATA', font: 'Trebuchet MS, sans-serif', italic: true },
    { type: 'sponsor_img', name: 'adidas', url: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' },
    { type: 'sponsor_img', name: 'NIKE', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
    { type: 'sponsor_img', name: 'SOLANA', url: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=035' },
    { type: 'ad', title: 'New FIFA 26 Bundle', cta: 'Pre-order', color: '#00e5ff' },
    { type: 'sponsor_text', name: 'EA SPORTS', font: 'Trebuchet MS, sans-serif' },
    { type: 'sponsor_text', name: 'VISA', font: 'Arial, sans-serif', italic: true },
    { type: 'sponsor_text', name: 'PHANTOM', font: 'Impact, sans-serif' },
    { type: 'ad', title: 'Cold Wallet Deals', cta: 'Shop Ledger', color: '#f59e0b' },
    { type: 'sponsor_img', name: 'COCA-COLA', url: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Coca-Cola_logo.svg' },
    { type: 'sponsor_img', name: 'HYUNDAI', url: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg' },
    { type: 'ad', title: 'Premium Subscription', cta: 'Upgrade', color: '#ff4d6d' },
    { type: 'sponsor_text', name: 'VIVO', font: 'Tahoma, sans-serif' },
    { type: 'sponsor_img', name: "MCDONALD'S", url: 'https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg' }
  ];

  const marqueeStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    background: '#ffffff',
    padding: '4px 0',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
  };

  const trackStyle: React.CSSProperties = {
    display: 'flex',
    gap: '40px',
    animation: 'marquee-scroll 45s linear infinite',
    alignItems: 'center',
    width: 'max-content'
  };

  return (
    <div style={marqueeStyle}>
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        background: '#fbbf24',
        fontSize: '7px', 
        color: '#000000', 
        textTransform: 'uppercase', 
        letterSpacing: '0.1em', 
        padding: '2px 6px', 
        fontWeight: 800,
        zIndex: 10,
        borderBottomRightRadius: '4px'
      }}>
        Advertisement
      </div>
      <div style={trackStyle}>
        {[...items, ...items, ...items].map((item, idx) => (
          item.type === 'sponsor_img' ? (
            <img 
              key={idx}
              src={item.url}
              alt={item.name}
              style={{
                height: '16px',
                objectFit: 'contain',
                maxWidth: '80px',
                opacity: 0.9,
              }}
            />
          ) : item.type === 'sponsor_text' ? (
            <span 
              key={idx} 
              style={{ 
                fontFamily: item.font, 
                fontStyle: item.italic ? 'italic' : 'normal',
                fontWeight: 800, 
                fontSize: '0.9rem', 
                color: '#374151',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {item.name}
            </span>
          ) : (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '2px 4px 2px 8px',
              background: '#f3f4f6',
              border: `1px solid ${item.color}50`,
              borderRadius: '24px',
            }}>
              <span style={{ fontSize: '0.7rem', color: '#1f2937', fontWeight: 700 }}>{item.title}</span>
              <span style={{ 
                fontSize: '0.6rem', 
                color: '#000', 
                background: item.color, 
                padding: '2px 8px', 
                borderRadius: '20px', 
                fontWeight: 800,
                textTransform: 'uppercase'
              }}>
                {item.cta}
              </span>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
