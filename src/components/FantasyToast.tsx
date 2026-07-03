'use client';

import React, { useEffect, useState } from 'react';

export interface FantasyNotificationItem {
  id: string;
  // Only event types available from TxLINE Soccer API
  type:
    | 'goal'                    // dataSoccer.Goal
    | 'goal_conceded'           // inferred from opponent goal
    | 'own_goal'                // dataSoccer.GoalType = OwnGoal
    | 'assist'                  // dataSoccer.assistPlayerId (embedded in goal event)
    | 'goalkeeper_save'         // dataSoccer.save
    | 'penalty_save'            // dataSoccer.penaltysave
    | 'yellow_card'             // dataSoccer.YellowCard
    | 'red_card'                // dataSoccer.RedCard
    | 'penalty_won'             // dataSoccer.Penalty (attacker's team)
    | 'penalty_conceded'        // dataSoccer.Penalty (defender)
    | 'penalty_missed'          // dataSoccer.Penalty outcome (regular)
    | 'penalty_scored'          // dataSoccer.Goal during gameState=Penalties
    | 'penalty_missed_shootout' // miss during gameState=Penalties
    | 'corner_kick'             // dataSoccer.Corner
    | 'substitution'            // dataSoccer.PlayerInId / PlayerOutId
    | 'var_review'              // dataSoccer.VAR
    | 'danger_attack'           // inferred from possessionType=Danger/HighDanger
    | 'starting_xi'             // lineups[].starter = true
    | 'sub_appearance'          // dataSoccer.PlayerInId matches user lineup
    | 'extra_time'              // gameState transitions to ExtraTime
    | 'possession_bonus'        // inferred from possession dominance per half
    | 'clean_sheet'             // inferred from scoreSoccer.Total.Goals = 0
    | 'captain_bonus'           // game mechanic
    | 'rank_up'                 // game mechanic
    | 'achievement';            // game mechanic
  title: string;
  subtitle?: string;
  value?: string;
}

interface FantasyToastProps {
  notification: FantasyNotificationItem;
  index: number;
  onDismiss: () => void;
}

export default function FantasyToast({ notification, index, onDismiss }: FantasyToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Exit animation after 2.7 seconds
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2700);

    // Completely dismiss after 2.95 seconds
    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, 2950);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(dismissTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine colors and icon based on event type
  let accentColor = '#00ff73'; // default positive green
  let valueColor = '#00ff73';
  let icon = '📢';
  let cardTitle = notification.title;

  switch (notification.type) {
    // Goal events
    case 'goal':
      icon = '⚽';
      accentColor = '#00ff73';
      valueColor = '#00ff73';
      break;
    case 'goal_conceded':
      icon = '😓';
      accentColor = '#ff4d6d';
      valueColor = '#ff4d6d';
      break;
    case 'own_goal':
      icon = '💥';
      accentColor = '#ff4d6d';
      valueColor = '#ff4d6d';
      break;
    // Assist / Save events
    case 'assist':
      icon = '🎯';
      accentColor = '#1565c0';
      valueColor = '#00e5ff';
      break;
    case 'goalkeeper_save':
      icon = '🧤';
      accentColor = '#00838f';
      valueColor = '#00e87a';
      break;
    case 'penalty_save':
      icon = '🧤';
      accentColor = '#ffd700';
      valueColor = '#ffd700';
      break;
    // Card events
    case 'yellow_card':
      icon = '🟨';
      accentColor = '#ffbb00';
      valueColor = '#ff4d6d';
      break;
    case 'red_card':
      icon = '🟥';
      accentColor = '#ff4d6d';
      valueColor = '#ff4d6d';
      break;
    // Penalty events
    case 'penalty_won':
      icon = '✅';
      accentColor = '#00ff73';
      valueColor = '#00ff73';
      break;
    case 'penalty_conceded':
      icon = '⚠️';
      accentColor = '#ff4d6d';
      valueColor = '#ff4d6d';
      break;
    case 'penalty_missed':
      icon = '❌';
      accentColor = '#ff4d6d';
      valueColor = '#ff4d6d';
      break;
    case 'penalty_scored':
      icon = '🥅';
      accentColor = '#00ff73';
      valueColor = '#00ff73';
      break;
    case 'penalty_missed_shootout':
      icon = '❌';
      accentColor = '#ff4d6d';
      valueColor = '#ff4d6d';
      break;
    // Appearance events
    case 'starting_xi':
      icon = '🌟';
      accentColor = '#ffd700';
      valueColor = '#ffd700';
      break;
    case 'sub_appearance':
      icon = '🔄';
      accentColor = '#00e5ff';
      valueColor = '#00e5ff';
      break;
    case 'extra_time':
      icon = '⏱️';
      accentColor = '#5e35b1';
      valueColor = '#00e87a';
      break;
    // TxLINE possession stream bonus
    case 'possession_bonus':
      icon = '🎮';
      accentColor = '#00e5ff';
      valueColor = '#00e5ff';
      break;
    // Clean sheet
    case 'clean_sheet':
      icon = '🛡️';
      accentColor = '#00ff73';
      valueColor = '#00ff73';
      break;
    // Display-only
    case 'corner_kick':
      icon = '⛳';
      accentColor = '#00838f';
      valueColor = '#00838f';
      break;
    case 'substitution':
      icon = '🔄';
      accentColor = '#fbc02d';
      valueColor = '#fbc02d';
      break;
    case 'var_review':
      icon = '📺';
      accentColor = '#616161';
      valueColor = '#616161';
      break;
    case 'danger_attack':
      icon = '⚡';
      accentColor = '#ff6d00';
      valueColor = '#ff6d00';
      break;
    // Game mechanics
    case 'captain_bonus':
      icon = '👑';
      accentColor = '#ffd700';
      valueColor = '#ffd700';
      break;
    case 'rank_up':
      icon = '📈';
      accentColor = '#00e5ff';
      valueColor = '#00e5ff';
      break;
    case 'achievement':
      icon = '🏆';
      accentColor = '#bc6cff';
      valueColor = '#bc6cff';
      break;
    default:
      break;
  }

  const scale = Math.max(1 - index * 0.08, 0.6);
  const opacity = isExiting ? 0 : Math.max(1 - index * 0.25, 0);
  const topPosition = 80 + index * 85;
  const mobileTop = 74 + index * 75;

  return (
    <div
      style={{
        position: 'fixed',
        top: `${topPosition}px`,
        right: '24px',
        width: '320px',
        background: '#090f1a',
        borderLeft: `5px solid ${accentColor}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        borderRadius: '8px',
        padding: '16px',
        color: '#ffffff',
        zIndex: 99999 - index,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        boxSizing: 'border-box',
        fontFamily: 'Inter, sans-serif',
        opacity: opacity,
        transform: `scale(${scale})`,
        transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        animation: index === 0 ? 'toast-slide-in 300ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        '--scale-val': scale,
        '--top-val': `${mobileTop}px`,
      } as React.CSSProperties}
      className="fantasy-toast"
    >
      <style>{`
        @keyframes toast-slide-in {
          from {
            transform: translateX(50px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        @media (max-width: 768px) {
          .fantasy-toast {
            right: 50% !important;
            transform: translate(50%, 0) scale(var(--scale-val)) !important;
            width: 90% !important;
            max-width: 360px !important;
            top: var(--top-val) !important;
            animation: ${index === 0 ? 'toast-slide-in-mobile 300ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none'} !important;
          }
        }
        @keyframes toast-slide-in-mobile {
          from {
            transform: translate(50%, -20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translate(50%, 0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
      
      {/* Icon Badge */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem',
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)', fontWeight: 800 }}>
          {cardTitle}
        </span>
        {notification.subtitle && (
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
            {notification.subtitle}
          </span>
        )}
      </div>

      {/* Points / Value */}
      {notification.value && (
        <div style={{ fontSize: '1rem', fontWeight: 900, color: valueColor, textAlign: 'right', whiteSpace: 'nowrap' }}>
          {notification.value}
        </div>
      )}
    </div>
  );
}
