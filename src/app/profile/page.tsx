'use client';

import Navbar from '@/components/Navbar';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import { User, Shield, Camera, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { connected, publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (connected && publicKey) {
      const stored = localStorage.getItem(`profile_${publicKey.toString()}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUsername(parsed.username);
        setAvatar(parsed.avatar);
      } else {
        setUsername(`User_${publicKey.toString().substring(0, 4)}`);
        setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${publicKey.toString()}`);
      }
    }
  }, [connected, publicKey]);

  const handleSave = () => {
    if (!publicKey) return;
    setIsSaving(true);
    
    const profileData = {
      username,
      avatar,
      updatedAt: new Date().toISOString()
    };
    
    // Save to local storage for demo mode
    localStorage.setItem(`profile_${publicKey.toString()}`, JSON.stringify(profileData));
    
    // Simulate network delay
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      
      // Dispatch custom event to trigger navbar update
      window.dispatchEvent(new Event('storage'));
      
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    }, 600);
  };

  if (!mounted) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      <main style={{ padding: '48px 0 80px' }}>
        <div className="container-sm" style={{ maxWidth: '600px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: 32 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
          </div>

          <div style={{ textAlign: 'left', marginBottom: 40 }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 8, color: '#fff' }}>
              Player Profile
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Customize your manager identity for the global leaderboard.
            </p>
          </div>

          <div className="ro-window">
            <div className="ro-window__header">
              <span>Identity Settings</span>
              <SettingsIcon />
            </div>
            
            <div className="ro-window__body" style={{ padding: '32px' }}>
              {!connected ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Shield size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '1.25rem', marginBottom: 16 }}>Wallet Not Connected</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                    Please connect your Solana wallet to view and edit your profile.
                  </p>
                  <WalletMultiButton style={{ 
                    height: '40px', borderRadius: '8px',
                    fontSize: '0.9rem', fontWeight: 700,
                    padding: '0 20px', margin: '0 auto',
                    background: 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)', 
                    color: '#1a1a1a', border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 1px 8px rgba(255, 215, 0, 0.2)'
                  }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  {/* Avatar Section */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
                    <div style={{ 
                      position: 'relative',
                      width: '100px', height: '100px', 
                      borderRadius: '50%',
                      background: 'var(--bg-elevated)',
                      border: '2px solid var(--border-medium)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {avatar ? (
                        <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#fff' }} />
                      ) : (
                        <User size={40} color="var(--text-muted)" />
                      )}
                      
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'rgba(0,0,0,0.6)',
                        padding: '4px',
                        display: 'flex', justifyContent: 'center',
                        backdropFilter: 'blur(4px)'
                      }}>
                        <Camera size={14} color="#fff" />
                      </div>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Avatar Display (Auto-Generated)
                      </label>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
                        In Demo Mode, avatars are automatically generated based on your wallet address using Dicebear.
                      </p>
                      <button 
                        className="btn btn--secondary btn--sm"
                        onClick={() => setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random().toString()}`)}
                      >
                        🎲 Reroll Avatar
                      </button>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

                  {/* Form Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Wallet Address
                      </label>
                      <div style={{ 
                        padding: '12px 16px', 
                        background: 'rgba(0,0,0,0.2)', 
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: 'var(--text-muted)',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem'
                      }}>
                        {publicKey?.toString()}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Manager Username
                      </label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your display name"
                        style={{ 
                          width: '100%',
                          padding: '12px 16px', 
                          background: 'var(--bg-elevated)', 
                          border: '1px solid var(--border-medium)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '1rem',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-medium)'}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button 
                      className="btn btn--primary"
                      onClick={handleSave}
                      disabled={isSaving}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: isSaving ? 0.7 : 1 }}
                    >
                      <Save size={16} />
                      {isSaving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save Profile'}
                    </button>
                  </div>
                  
                </div>
              )}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}
