import React from 'react';

export default function SponsorsMarquee() {
  const items = [
    { type: 'sponsor_text', name: 'POWERED BY TxODDS', font: 'Arial Black, sans-serif' },
    { type: 'sponsor_img', name: 'CHAINVOLIO', url: '/logo/Letter_Logo_White.png' },
    { type: 'ad', title: 'Put Your Ads Here', cta: 'Contact Us', color: '#14F195' },
    { type: 'sponsor_text', name: 'txLINE DATA', font: 'Trebuchet MS, sans-serif', italic: true },
    { type: 'sponsor_img', name: 'SOLANA', url: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=035' },
    { type: 'sponsor_img', name: 'SUPERTEAM', url: '/logo/logo superteam.png' },
    { type: 'sponsor_img', name: 'SUPERTEAM HUB', url: '/logo/logo superteam hub.png' },
    { type: 'sponsor_img', name: 'SUPERTEAM EARN', url: 'https://unavatar.io/twitter/SuperteamEarn' },
    { type: 'ad', title: 'Get 50% Off SOL', cta: 'Trade Now', color: '#14F195' },
    { type: 'ad', title: 'Your Brand Here', cta: 'Advertise', color: '#f59e0b' },
    { type: 'ad', title: 'New FIFA 26 Bundle', cta: 'Pre-order', color: '#00e5ff' },
    { type: 'sponsor_text', name: 'PROOF OF WORK', font: 'Arial Black, sans-serif' },
    { type: 'ad', title: 'Put Your Ads Here', cta: 'Contact Us', color: '#ff4d6d' },
    { type: 'sponsor_img', name: 'SOLANA', url: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=035' }
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
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img 
                src={item.url}
                alt={item.name}
                style={{
                  height: (item.name === 'SUPERTEAM' || item.name === 'SUPERTEAM HUB') ? '32px' : item.name === 'CHAINVOLIO' ? '24px' : '16px',
                  objectFit: 'contain',
                  maxWidth: '120px',
                  opacity: 0.9,
                  filter: (item.name === 'CHAINVOLIO' || item.name === 'SUPERTEAM HUB') ? 'brightness(0)' : 'none',
                }}
              />
              {(item.name === 'SOLANA' || item.name === 'SUPERTEAM EARN') && (
                <span style={{ 
                  fontFamily: 'Trebuchet MS, sans-serif', 
                  fontWeight: 800, 
                  fontSize: '0.9rem', 
                  color: '#374151',
                  letterSpacing: '0.05em',
                }}>
                  {item.name}
                </span>
              )}
            </div>
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
