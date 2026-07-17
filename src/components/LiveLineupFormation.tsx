'use client';

import { useState } from 'react';

export interface FormationPlayer {
  id?: string;
  name: string;
  jerseyNumber?: number;
  position: string;
  participant: 1 | 2;
  starter?: boolean;
}

interface Props {
  homePlayers: FormationPlayer[];
  awayPlayers: FormationPlayer[];
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeCoach?: string;
  awayCoach?: string;
  playerPoints?: Record<string, number>;
  userLineupIds?: string[];
}

function posGroup(pos: string): 'GK' | 'DEF' | 'MID' | 'FWD' {
  const p = pos.toUpperCase().trim();
  if (!p || p === '0') return 'MID';
  if (p === 'GK' || p === '1' || p === 'G' || p === 'PO' || p === 'PT'
    || p.startsWith('GOAL') || p === 'PORTERO' || p === 'GOLEIRO') return 'GK';
  if (p.includes('DEF') || p.includes('BACK') || p.includes('CENTR')
    || ['CB', 'LB', 'RB', 'LWB', 'RWB', 'SW', 'D', '2', '3', '4', '5'].includes(p)) return 'DEF';
  if (p.includes('MID') || p.includes('FIELD') || p.includes('MEDIO') || p.includes('CENTRO')
    || p.includes('VOLANTE') || p === 'MEIA'
    || ['CM', 'CDM', 'CAM', 'DM', 'AM', 'LM', 'RM', 'M', 'DMF', 'AMF', 'CMF',
      '6', '7', '8', '10'].includes(p)) return 'MID';
  if (p.includes('FORW') || p.includes('ATT') || p.includes('STRIK') || p.includes('WING')
    || p.includes('DELAN') || p === 'PUNTA'
    || ['ST', 'CF', 'LW', 'RW', 'LWF', 'RWF', 'SS', 'FW', 'F', 'ATT',
      '9', '11'].includes(p)) return 'FWD';
  return 'FWD';
}

// Use actual abbreviation if it's a known short code, otherwise use group name
const KNOWN_ABBRS = new Set(['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'SW',
  'CM', 'CDM', 'CAM', 'DM', 'AM', 'LM', 'RM', 'DMF', 'AMF', 'CMF',
  'ST', 'CF', 'LW', 'RW', 'LWF', 'RWF', 'SS', 'FW']);

function posLabel(pos: string, group: 'GK' | 'DEF' | 'MID' | 'FWD'): string {
  const p = pos.toUpperCase().trim();
  return KNOWN_ABBRS.has(p) ? p : group;
}

function shortName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return full.slice(0, 11).toUpperCase();
  const last = parts[parts.length - 1];
  return (last.length > 11 ? last.slice(0, 11) : last).toUpperCase();
}

function distributeByJersey(players: FormationPlayer[]): FormationPlayer[] {
  const sorted = [...players].sort((a, b) => (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99));
  if (sorted.length === 0) return players;
  const gi = sorted.findIndex(p => p.jerseyNumber === 1);
  const gkI = gi >= 0 ? gi : 0;
  const outfield = sorted.filter((_, i) => i !== gkI);
  const o = outfield.length;
  const defN = Math.min(4, Math.max(3, Math.floor(o * 0.4)));
  const fwdN = Math.max(2, Math.min(3, o - defN - 3));
  const midN = o - defN - fwdN;
  const result: FormationPlayer[] = [{ ...sorted[gkI], position: 'GK' }];
  outfield.slice(0, defN).forEach(p => result.push({ ...p, position: 'DEF' }));
  outfield.slice(defN, defN + midN).forEach(p => result.push({ ...p, position: 'MID' }));
  outfield.slice(defN + midN).forEach(p => result.push({ ...p, position: 'FWD' }));
  return result;
}

function buildRows(players: FormationPlayer[]) {
  const g = {
    GK: players.filter(p => posGroup(p.position) === 'GK'),
    DEF: players.filter(p => posGroup(p.position) === 'DEF'),
    MID: players.filter(p => posGroup(p.position) === 'MID'),
    FWD: players.filter(p => posGroup(p.position) === 'FWD'),
  };
  const filled = Object.values(g).filter(arr => arr.length > 0).length;
  const processed = filled < 3 ? distributeByJersey(players) : players;
  const gk = processed.filter(p => posGroup(p.position) === 'GK');
  const def = processed.filter(p => posGroup(p.position) === 'DEF');
  const mid = processed.filter(p => posGroup(p.position) === 'MID');
  const fwd = processed.filter(p => posGroup(p.position) === 'FWD');
  const formation = [def.length, mid.length, fwd.length].filter(n => n > 0).join('-');
  return { gk, def, mid, fwd, formation };
}

// ── Pitch viewBox ─────────────────────────────────────────────────────────
const PW = 280;
const PH = 420;
// Y positions: FWD attacks at top, GK defends at bottom
// Full pitch: spread across entire height
const LINE_Y = { GK: 372, DEF: 298, MID: 210, FWD: 90 };

// Full pitch geometry constants
const ATK_Y = 8;    // attacking goal line (top, with padding)
const MID_Y = 210;  // center/halfway line
const DEF_Y = 412;  // defending goal line (bottom, with padding)
const CX = PW / 2;

// Real-world proportional soccer field dimensions scaled to fit:
const PB_H = 64;       // Penalty area depth (16.5m)
const PB_W = 160;      // Penalty area width (40.32m)
const PB_L = (PW - PB_W) / 2;
const PB_T = DEF_Y - PB_H;

const SY_H = 21;       // 6-yard box depth (5.5m)
const SY_W = 72;       // 6-yard box width (18.32m)
const SY_L = (PW - SY_W) / 2;
const SY_T = DEF_Y - SY_H;

const PS_DIST = 42;    // Penalty spot distance from goal line (11m)
const PS_DEF = DEF_Y - PS_DIST;
const PA_R = 36;       // Penalty arc radius (9.15m)

// Center circle radius (9.15m)
const CC_R = 36;

const PA_DX = Math.sqrt(Math.max(0, PA_R * PA_R - (PS_DEF - PB_T) * (PS_DEF - PB_T)));

function Pitch() {
  const ls = { fill: 'none' as const, stroke: 'rgba(255,255,255,0.6)' as const, strokeWidth: 1.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const lsDim = { fill: 'none' as const, stroke: 'rgba(255,255,255,0.35)' as const, strokeWidth: 0.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <>
      {/* Attacking goal (top, outside goal line) */}
      <rect x={126} y={0} width={28} height={8} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
      {/* Defending goal (bottom, outside goal line) */}
      <rect x={126} y={412} width={28} height={8} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />

      {/* Attacking goal line (top) */}
      <line x1={6} y1={ATK_Y} x2={PW - 6} y2={ATK_Y} {...ls} />

      {/* Halfway/center line */}
      <line x1={6} y1={MID_Y} x2={PW - 6} y2={MID_Y} {...ls} />

      {/* Defending goal line (bottom) */}
      <line x1={6} y1={DEF_Y} x2={PW - 6} y2={DEF_Y} {...ls} />

      {/* Side lines */}
      <line x1={6} y1={ATK_Y} x2={6} y2={DEF_Y} {...ls} />
      <line x1={PW - 6} y1={ATK_Y} x2={PW - 6} y2={DEF_Y} {...ls} />

      {/* Full center circle */}
      <circle cx={CX} cy={MID_Y} r={CC_R} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={CX} cy={MID_Y} r={2.0} fill="rgba(255,255,255,0.6)" />

      {/* Attacking half: Penalty area */}
      <rect x={PB_L} y={ATK_Y} width={PB_W} height={PB_H} {...ls} />
      {/* Attacking half: 6-yard box */}
      <rect x={SY_L} y={ATK_Y} width={SY_W} height={SY_H} {...lsDim} />
      {/* Attacking half: Penalty spot */}
      <circle cx={CX} cy={ATK_Y + PS_DIST} r={1.8} fill="rgba(255,255,255,0.6)" />
      {/* Attacking half: Penalty arc */}
      {PA_DX > 0 && (
        <path
          d={`M ${CX - PA_DX} ${ATK_Y + PB_H} A ${PA_R} ${PA_R} 0 0 1 ${CX + PA_DX} ${ATK_Y + PB_H}`}
          fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.0} strokeLinecap="round" strokeLinejoin="round"
        />
      )}
      {/* Attacking half: Corner arcs */}
      <path d={`M 6 ${ATK_Y + 8} A 8 8 0 0 1 14 ${ATK_Y}`}
        fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${PW - 14} ${ATK_Y} A 8 8 0 0 1 ${PW - 6} ${ATK_Y + 8}`}
        fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round" />

      {/* Defending half: Penalty area */}
      <rect x={PB_L} y={PB_T} width={PB_W} height={PB_H} {...ls} />
      {/* Defending half: 6-yard box */}
      <rect x={SY_L} y={SY_T} width={SY_W} height={SY_H} {...lsDim} />
      {/* Defending half: Penalty spot */}
      <circle cx={CX} cy={PS_DEF} r={1.8} fill="rgba(255,255,255,0.6)" />
      {/* Defending half: Penalty arc */}
      {PA_DX > 0 && (
        <path
          d={`M ${CX - PA_DX} ${PB_T} A ${PA_R} ${PA_R} 0 0 0 ${CX + PA_DX} ${PB_T}`}
          fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1.0} strokeLinecap="round" strokeLinejoin="round"
        />
      )}
      {/* Defending half: Corner arcs */}
      <path d={`M 6 ${DEF_Y - 8} A 8 8 0 0 0 14 ${DEF_Y}`}
        fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${PW - 14} ${DEF_Y} A 8 8 0 0 0 ${PW - 6} ${DEF_Y - 8}`}
        fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

// Spread N players evenly across a row at fixed Y
function rowPos(count: number, y: number, xMin = 16, xMax = 264): { x: number; y: number }[] {
  if (count === 0) return [];
  const step = (xMax - xMin) / (count + 1);
  return Array.from({ length: count }, (_, i) => ({ x: xMin + step * (i + 1), y }));
}

// Measure approximate text width (monospace estimate)
function labelWidth(pos: string, name: string): number {
  return Math.max(52, (pos.length + name.length + 2) * 5.5 + 16);
}

// ── Broadcast-style card ──────────────────────────────────────────────────
interface TeamCardProps {
  players: FormationPlayer[];
  team: string;
  flag: string;
  coach?: string;
  color: string;
  userSet: Set<string>;
  playerPoints: Record<string, number>;
}

function TeamCard({ players, team, flag, coach, color, userSet, playerPoints }: TeamCardProps) {
  // If the API returned all squad members without starter flags, fall back to jersey ≤ 11 = starter
  const allStarterUnset = players.length > 11 && players.every(p => p.starter === undefined);
  const resolvedPlayers = allStarterUnset
    ? players.map(p => ({ ...p, starter: p.jerseyNumber !== undefined ? p.jerseyNumber <= 11 : undefined }))
    : players;
  const starters = resolvedPlayers.filter(p => p.starter !== false);
  const bench = resolvedPlayers.filter(p => p.starter === false);
  const rows = buildRows(starters);

  type RowKey = 'gk' | 'def' | 'mid' | 'fwd';
  const rowKeys: RowKey[] = ['gk', 'def', 'mid', 'fwd'];

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${color}28`, position: 'relative' }}>

      {/* ── Blurred stadium background — spans entire card ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'url(/lineup.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center 60%',
        filter: 'blur(5px)',
        transform: 'scale(1.1)',
      }} />
      {/* Dark overlay for readability */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'rgba(0,0,0,0.32)' }} />

      {/* All content sits above the background */}
      <div style={{ position: 'relative', zIndex: 2 }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 14px',
          background: 'rgba(0,0,0,0.72)',
          borderBottom: `2px solid ${color}50`,
        }}>
          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{flag}</span>
          <span style={{
            fontWeight: 900, fontSize: '1rem', letterSpacing: '0.09em',
            color: 'white', textTransform: 'uppercase', flex: 1,
          }}>
            {team}
          </span>
          {rows.formation && (
            <span style={{
              padding: '2px 11px', borderRadius: 5,
              background: `${color}20`, border: `1px solid ${color}55`,
              color, fontWeight: 800, fontSize: '0.95rem',
              fontFamily: 'Bebas Neue, cursive', letterSpacing: '0.15em',
            }}>
              {rows.formation}
            </span>
          )}
        </div>

        {/* ── Body ── */}
        <div className="lineup-body">

          {/* Left: Subs + Coach */}
          <div className="lineup-subs" style={{
            background: 'rgba(0,0,0,0.5)',
            borderRight: `1px solid ${color}30`,
            padding: '12px 14px',
            overflowY: 'auto',
          }}>
            <div style={{
              fontSize: '0.65rem', fontWeight: 800, color,
              textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10,
            }}>
              Substitutes
            </div>
            <div className="lineup-subs-grid">
              {bench.length === 0 && (
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.22)', fontStyle: 'italic' }}>—</span>
              )}
              {bench.map((p, i) => {
                const inUser = !!(p.id && userSet.has(p.id));
                return (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    background: inUser ? 'rgba(255, 215, 0, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    border: inUser ? '1px solid rgba(255, 215, 0, 0.25)' : '1px solid rgba(255, 255, 255, 0.04)',
                    borderLeft: inUser ? '3px solid #ffd700' : `3px solid ${color}80`,
                    borderRadius: 4,
                    padding: '5px 8px',
                    transition: 'all 0.15s ease-in-out',
                  }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      color: inUser ? '#ffd700' : `${color}`,
                      minWidth: 14,
                      textAlign: 'center',
                      marginTop: 1,
                    }}>
                      {p.jerseyNumber ?? '•'}
                    </span>
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: inUser ? 700 : 500,
                      color: inUser ? '#ffd700' : 'rgba(255, 255, 255, 0.8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      lineHeight: '1.2',
                    }}>
                      {p.name.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
            {coach && (
              <div style={{
                marginTop: 'auto',
                paddingTop: 12,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: `${color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${color}40`,
                }}>
                  <span style={{ fontSize: '0.75rem', lineHeight: 1 }}>👔</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.52rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 1 }}>
                    Head Coach
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.1 }}>
                    {coach}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Pitch — flat view, no perspective */}
          <div className="lineup-pitch-container">
            <svg
              viewBox={`0 0 ${PW} ${PH}`}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              }}
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
            >
              <Pitch />

              {rowKeys.map(key => {
                const group = rows[key] as FormationPlayer[];
                if (!group.length) return null;
                const lineY = LINE_Y[key.toUpperCase() as keyof typeof LINE_Y];
                const positions = rowPos(group.length, lineY);
                const grp = key.toUpperCase() as 'GK' | 'DEF' | 'MID' | 'FWD';

                return group.map((player, i) => {
                  const isUser = !!(player.id && userSet.has(player.id));
                  const pts = player.id ? playerPoints[player.id] : undefined;
                  const abbr = posLabel(player.position, grp);
                  const sname = shortName(player.name).slice(0, 12); // Limit to 12 chars

                  // Larger card dimensions to accommodate larger fonts
                  const lw = Math.max(48, Math.min(sname.length * 6.0 + 8, 64));
                  const lh = 28;

                  // Adjust positions for defenders (LB/RB) and wingers (LW/RW) to avoid collision and look tactical
                  const pos = positions[i];
                  let adjX = pos.x;
                  let adjY = pos.y;

                  // Horizontal adjustments to widen gaps
                  if (group.length === 3) {
                    if (i === 0) adjX -= 10;
                    if (i === 2) adjX += 10;
                  } else if (group.length === 4) {
                    if (i === 0) adjX -= 12;
                    if (i === 1) adjX -= 4;
                    if (i === 2) adjX += 4;
                    if (i === 3) adjX += 12;
                  } else if (group.length === 5) {
                    if (i === 0) adjX -= 14;
                    if (i === 1) adjX -= 6;
                    if (i === 3) adjX += 6;
                    if (i === 4) adjX += 14;
                  }

                  if (grp === 'DEF') {
                    if (group.length >= 4) {
                      // Fullbacks (outermost) go higher up (smaller Y)
                      if (i === 0 || i === group.length - 1) {
                        adjY -= 20;
                      }
                    } else if (group.length === 3) {
                      // Outer centerbacks go slightly higher
                      if (i === 0 || i === group.length - 1) {
                        adjY -= 12;
                      }
                    }
                  } else if (grp === 'FWD') {
                    if (group.length >= 3) {
                      // Wingers (outermost) go higher up (smaller Y)
                      if (i === 0 || i === group.length - 1) {
                        adjY -= 20;
                      }
                    }
                  }

                  const lx = adjX - lw / 2;
                  const ly = adjY - lh / 2;

                  return (
                    <g key={`${key}-${i}`}>
                      {/* Label background */}
                      <rect x={lx} y={ly} width={lw} height={lh} rx={3}
                        fill={isUser ? 'rgba(55,35,0,0.95)' : 'rgba(10,18,12,0.92)'}
                        stroke={isUser ? '#ffd700' : 'rgba(255,255,255,0.2)'}
                        strokeWidth={isUser ? 1.5 : 0.6}
                        filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.4))"
                      />
                      {/* Position abbreviation — top line, small, colored */}
                      <text x={adjX} y={ly + 8.5}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={7.2} fontWeight="800" letterSpacing="0.05em"
                        fill={isUser ? '#ffd700' : color}
                        fontFamily="Inter, sans-serif">
                        {abbr}
                      </text>
                      {/* Thin divider */}
                      <line x1={lx + 4} y1={ly + 14} x2={lx + lw - 4} y2={ly + 14}
                        stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} />
                      {/* Player name — bottom line, very compact, white/gold */}
                      <text x={adjX} y={ly + 21.5}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={6.8} fontWeight="800" letterSpacing="0.02em"
                        fill={isUser ? '#ffd700' : 'white'}
                        fontFamily="Inter, sans-serif">
                        {sname}
                      </text>
                      {/* Checkmark or badge for user picks */}
                      {isUser && (
                        <g>
                          <circle cx={lx + lw - 1} cy={ly + 1} r={3.5}
                            fill="#ffd700" stroke="#3a2000" strokeWidth={0.5} />
                          <text x={lx + lw - 1} y={ly + 2}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize={5} fontWeight="900" fill="#3a2000" fontFamily="Inter, sans-serif">
                            ✓
                          </text>
                        </g>
                      )}
                      {/* Points badge */}
                      {pts !== undefined && pts !== 0 && (
                        <>
                          <rect x={adjX - 15} y={ly - 16} width={30} height={11} rx={2}
                            fill={pts > 0 ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}
                            stroke={pts > 0 ? '#4ade80' : '#f87171'} strokeWidth={0.6} />
                          <text x={adjX} y={ly - 10.5}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize={6.5} fontWeight="bold"
                            fill={pts > 0 ? '#4ade80' : '#f87171'}
                            fontFamily="Inter, sans-serif">
                            {pts > 0 ? `+${pts.toFixed(1)}` : pts.toFixed(1)}
                          </text>
                        </>
                      )}
                    </g>
                  );
                });
              })}
            </svg>
          </div>
        </div>
      </div>{/* end zIndex wrapper */}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function LiveLineupFormation({
  homePlayers, awayPlayers,
  homeTeam, awayTeam, homeFlag, awayFlag,
  homeCoach, awayCoach,
  playerPoints = {},
  userLineupIds = [],
}: Props) {
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('away');
  const userSet = new Set(userLineupIds);
  const loading = homePlayers.length === 0 && awayPlayers.length === 0;
  const isHome = activeTeam === 'home';
  const color = isHome ? '#00e5ff' : '#ff6b6b';

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      {/* Title + team toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#ffd700' }}>
          Team Lineups
        </h3>
        <div style={{
          marginLeft: 'auto', display: 'flex', gap: 3,
          background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 3,
        }}>
          {(['away', 'home'] as const).map(team => {
            const t = team === 'home';
            const fc = t ? homeFlag : awayFlag;
            const tn = t ? homeTeam : awayTeam;
            const c = t ? '#00e5ff' : '#ff6b6b';
            const active = activeTeam === team;
            return (
              <button key={team} onClick={() => setActiveTeam(team)} style={{
                padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: '0.7rem', fontWeight: 700,
                background: active ? `${c}22` : 'transparent',
                color: active ? c : 'rgba(255,255,255,0.35)',
                outline: active ? `1px solid ${c}45` : 'none',
                transition: 'all 0.15s',
              }}>
                {fc} {tn}
              </button>
            );
          })}
        </div>
        {userLineupIds.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ffd700', display: 'inline-block' }} />
            Your pick
          </span>
        )}
      </div>

      {loading ? (
        <div style={{
          height: 120, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'rgba(26,92,26,0.15)', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: '1rem' }}>⚽</span>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)' }}>Lineup not yet available</span>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>Released ~1 hr before kickoff</span>
        </div>
      ) : (
        <TeamCard
          players={isHome ? homePlayers : awayPlayers}
          team={isHome ? homeTeam : awayTeam}
          flag={isHome ? homeFlag : awayFlag}
          coach={isHome ? homeCoach : awayCoach}
          color={color}
          userSet={userSet}
          playerPoints={playerPoints}
        />
      )}
    </div>
  );
}
