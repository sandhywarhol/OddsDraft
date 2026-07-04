'use client';

import { useState, useEffect } from 'react';
import { getPlayerPhoto } from '@/lib/player-photos';

// Team color palette for initials fallback
const TEAM_COLORS: Record<string, string> = {
  Brazil: '#009c3b', Argentina: '#74acdf', France: '#003189',
  England: '#cf081f', Portugal: '#006600', Spain: '#c60b1e',
  Germany: '#1a1a1a', Netherlands: '#e77200', Belgium: '#000080',
  Uruguay: '#5ba4cf', Colombia: '#ffd700', Mexico: '#006847',
  USA: '#002868', Japan: '#bc002d', Switzerland: '#ff0000',
  Morocco: '#006233', Egypt: '#ce1126', Norway: '#ef2b2d',
  Canada: '#ff0000', Paraguay: '#0038a8',
};

function getInitials(name: string): string {
  const parts = name.replace(/[^\w\s]/gi, '').split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface PlayerAvatarProps {
  playerId: string;
  name: string;
  team: string;
  /** Width = height in px */
  size?: number;
  style?: React.CSSProperties;
  /** 'circle' (default) or 'fill' — fill stretches the photo to cover the parent element */
  variant?: 'circle' | 'fill';
  /** Extra class for the outer wrapper */
  className?: string;
}

export default function PlayerAvatar({
  playerId, name, team, size = 60, style, variant = 'circle', className,
}: PlayerAvatarProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [imgOk, setImgOk] = useState(false);

  useEffect(() => {
    let active = true;
    getPlayerPhoto(playerId, name).then(url => { if (active) setPhotoUrl(url); });
    return () => { active = false; };
  }, [playerId, name]);

  const initials = getInitials(name);
  const bgColor = TEAM_COLORS[team] ?? '#1e3a5f';
  const showPhoto = photoUrl && imgOk;

  if (variant === 'fill') {
    return (
      <div className={className} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', ...style }}>
        {showPhoto ? null : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${bgColor}22`,
            fontSize: size ? size * 0.25 : '1rem', color: bgColor, fontWeight: 800, opacity: 0.6,
          }}>
            {initials}
          </div>
        )}
        {photoUrl && (
          <img
            src={photoUrl}
            alt={name}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'top center',
              opacity: imgOk ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
            onLoad={() => setImgOk(true)}
            onError={() => setImgOk(false)}
          />
        )}
      </div>
    );
  }

  // Default: circle avatar
  return (
    <div
      className={className}
      style={{
        width: size, height: size, flexShrink: 0,
        borderRadius: '50%', overflow: 'hidden',
        background: showPhoto ? 'transparent' : bgColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        ...style,
      }}
    >
      {!showPhoto && (
        <span style={{ color: '#fff', fontWeight: 800, fontSize: size * 0.35, lineHeight: 1, userSelect: 'none' }}>
          {initials}
        </span>
      )}
      {photoUrl && (
        <img
          src={photoUrl}
          alt={name}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'top center',
            opacity: imgOk ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          onLoad={() => setImgOk(true)}
          onError={() => setImgOk(false)}
        />
      )}
    </div>
  );
}
