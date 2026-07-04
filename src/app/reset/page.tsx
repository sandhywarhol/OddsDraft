'use client';
import { useEffect, useState } from 'react';

export default function ResetPage() {
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('txline_api_token') ?? '';
    setToken(t);
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    localStorage.removeItem('txline_api_token');
    localStorage.removeItem('txline_app_mode');
    localStorage.removeItem('txline_guest_jwt');
    window.location.href = '/';
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#050d18', color: '#fff', gap: 20, padding: 24,
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>TxLINE Token</div>

      {token ? (
        <>
          <div style={{
            background: '#0d1420', border: '1px solid rgba(0,229,255,0.3)',
            borderRadius: 10, padding: '14px 18px', maxWidth: 500, width: '100%',
            wordBreak: 'break-all', fontSize: '0.85rem', color: '#00e5ff', fontFamily: 'monospace',
          }}>
            {token}
          </div>
          <button onClick={copy} style={{
            padding: '12px 28px', background: copied ? '#00e87a' : '#00e5ff',
            border: 'none', borderRadius: 8, fontWeight: 800, fontSize: '1rem',
            color: '#000', cursor: 'pointer',
          }}>
            {copied ? '✅ Copied!' : '📋 Copy Token'}
          </button>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            Copy token ini lalu kirim ke Claude
          </div>
        </>
      ) : (
        <div style={{ color: '#ff6b6b' }}>Token tidak ditemukan — belum subscribe?</div>
      )}

      <button onClick={clear} style={{
        marginTop: 8, padding: '8px 20px', background: 'transparent',
        border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
        color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.8rem',
      }}>
        Clear cache & kembali ke home
      </button>
    </div>
  );
}
