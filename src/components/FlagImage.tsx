import React from 'react';

interface FlagImageProps {
  flag: string;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

function emojiToCode(emoji: string): string | null {
  const pts = [...(emoji ?? '')].map(c => c.codePointAt(0) ?? 0);
  if (
    pts.length === 2 &&
    pts[0] >= 0x1F1E6 && pts[0] <= 0x1F1FF &&
    pts[1] >= 0x1F1E6 && pts[1] <= 0x1F1FF
  ) {
    return (
      String.fromCharCode(pts[0] - 0x1F1E6 + 65) +
      String.fromCharCode(pts[1] - 0x1F1E6 + 65)
    ).toLowerCase();
  }
  return null;
}

export default function FlagImage({ flag, size = 20, style, className }: FlagImageProps) {
  if (!flag) return null;
  const code = emojiToCode(flag);
  if (!code) return <span style={style} className={className}>{flag}</span>;
  const cdnW = size <= 10 ? 20 : size <= 20 ? 40 : size <= 40 ? 80 : 160;
  return (
    <img
      src={`https://flagcdn.com/w${cdnW}/${code}.png`}
      width={Math.round(size * 1.5)}
      height={size}
      alt={code.toUpperCase()}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        objectFit: 'cover',
        borderRadius: 2,
        flexShrink: 0,
        ...style,
      }}
      className={className}
    />
  );
}
