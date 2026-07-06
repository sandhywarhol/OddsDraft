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
    GK:  players.filter(p => posGroup(p.position) === 'GK'),
    DEF: players.filter(p => posGroup(p.position) === 'DEF'),
    MID: players.filter(p => posGroup(p.position) === 'MID'),
    FWD: players.filter(p => posGroup(p.position) === 'FWD'),
  };
  const filled = Object.values(g).filter(arr => arr.length > 0).length;
  const processed = filled < 3 ? distributeByJersey(players) : players;
  const gk  = processed.filter(p => posGroup(p.position) === 'GK');
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
const ATK_Y  = 8;    // attacking goal line (top, with padding)
const MID_Y  = 210;  // center/halfway line
const DEF_Y  = 412;  // defending goal line (bottom, with padding)
const CX     = PW / 2;
// Defending half penalty box
const PB_H = 120, PB_W = 170, PB_L = (PW - 170) / 2, PB_T = 292; // DEF_Y - 120
// Defending 6-yard box
const SY_H = 44,  SY_W = 85,  SY_L = (PW - 85)  / 2, SY_T = 368; // DEF_Y - 44
// Defending penalty spot & arc
const PS_DEF = 312; // DEF_Y - 100
const PA_R = 100;
const PA_DX = Math.sqrt(Math.max(0, PA_R * PA_R - (PS_DEF - PB_T) * (PS_DEF - PB_T)));

function Pitch() {
  const ls = { fill: 'none' as const, stroke: 'rgba(255,255,255,0.7)' as const, strokeWidth: 1.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const lsDim = { fill: 'none' as const, stroke: 'rgba(255,255,255,0.4)' as const, strokeWidth: 0.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <>
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
      <circle cx={CX} cy={MID_Y} r={100} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={CX} cy={MID_Y} r={2.5} fill="rgba(255,255,255,0.65)" />

      {/* Attacking half: Penalty area */}
      <rect x={PB_L} y={ATK_Y} width={PB_W} height={PB_H} {...ls} opacity={0.5} />
      {/* Attacking half: 6-yard box */}
      <rect x={SY_L} y={ATK_Y} width={SY_W} height={SY_H} {...lsDim} opacity={0.5} />
      {/* Attacking half: Penalty spot */}
      <circle cx={CX} cy={ATK_Y + 100} r={1.8} fill="rgba(255,255,255,0.4)" opacity={0.5} />
      {/* Attacking half: Penalty arc */}
      {PA_DX > 0 && (
        <path
          d={`M ${CX - PA_DX} ${ATK_Y + 120} A ${PA_R} ${PA_R} 0 0 1 ${CX + PA_DX} ${ATK_Y + 120}`}
          fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" opacity={0.5}
        />
      )}
      {/* Attacking half: Corner arcs */}
      <path d={`M 6 ${ATK_Y + 8} A 8 8 0 0 1 14 ${ATK_Y}`}
        fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
      <path d={`M ${PW - 14} ${ATK_Y} A 8 8 0 0 1 ${PW - 6} ${ATK_Y + 8}`}
        fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />

      {/* Defending half: Penalty area */}
      <rect x={PB_L} y={PB_T} width={PB_W} height={PB_H} {...ls} />
      {/* Defending half: 6-yard box */}
      <rect x={SY_L} y={SY_T} width={SY_W} height={SY_H} {...lsDim} />
      {/* Defending half: Penalty spot */}
      <circle cx={CX} cy={PS_DEF} r={1.8} fill="rgba(255,255,255,0.65)" />
      {/* Defending half: Penalty arc */}
      {PA_DX > 0 && (
        <path
          d={`M ${CX - PA_DX} ${PB_T} A ${PA_R} ${PA_R} 0 0 0 ${CX + PA_DX} ${PB_T}`}
          fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round"
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
  const starters = players.filter(p => p.starter !== false);
  const bench    = players.filter(p => p.starter === false);
  const rows     = buildRows(starters);

  type RowKey = 'gk' | 'def' | 'mid' | 'fwd';
  const rowKeys: RowKey[] = ['gk', 'def', 'mid', 'fwd'];

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${color}28`, position: 'relative' }}>

      {/* ── Blurred stadium background — spans entire card ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'url(/lineup.png)',
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
      <div style={{ display: 'flex', alignItems: 'stretch', height: 440 }}>

        {/* Left: Subs + Coach */}
        <div style={{
          width: '36%', flexShrink: 0,
          background: 'rgba(0,0,0,0.5)',
          borderRight: `1px solid ${color}30`,
          display: 'flex', flexDirection: 'column',
          padding: '10px 10px 10px 12px',
          overflowY: 'auto', maxHeight: 420,
        }}>
          <div style={{
            fontSize: '0.58rem', fontWeight: 800, color,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7,
          }}>
            Substitutes
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {bench.length === 0 && (
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.22)', fontStyle: 'italic' }}>—</span>
            )}
            {bench.map((p, i) => {
              const inUser = !!(p.id && userSet.has(p.id));
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  borderLeft: inUser ? `2px solid #ffd700` : `2px solid transparent`,
                  paddingLeft: 4,
                }}>
                  <span style={{
                    minWidth: 18, textAlign: 'right', flexShrink: 0,
                    fontSize: '0.65rem', fontWeight: 700,
                    color: inUser ? '#ffd700' : `${color}cc`,
                  }}>
                    {p.jerseyNumber ?? '·'}
                  </span>
                  <span style={{
                    fontSize: '0.6rem',
                    color: inUser ? '#ffd700' : 'rgba(255,255,255,0.72)',
                    fontWeight: inUser ? 700 : 500,
                    textTransform: 'uppercase', letterSpacing: '0.02em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.name.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
          {coach && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid rgba(255,255,255,0.1)` }}>
              <div style={{ fontSize: '0.52rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                Head Coach
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.2 }}>
                {coach}
              </div>
            </div>
          )}
        </div>

        {/* Right: Pitch — flat view, no perspective */}
        <div style={{
          flex: 1, minWidth: 0, position: 'relative',
          overflow: 'hidden',
        }}>
          <svg
            viewBox={`0 0 ${PW} ${PH}`}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            }}
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
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
                const pts    = player.id ? playerPoints[player.id] : undefined;
                const abbr  = posLabel(player.position, grp);
                const sname = shortName(player.name).slice(0, 12); // Limit to 12 chars
                // Stacked label: pos on top, name below — extra compact to avoid collisions
                const lw = Math.max(40, Math.min(sname.length * 5.8 + 6, 64));
                const lh = 22; // two-line height, very compact
                const lx = positions[i].x - lw / 2;
                const ly = positions[i].y - lh / 2;

                return (
                  <g key={`${key}-${i}`}>
                    {/* Label background */}
                    <rect x={lx} y={ly} width={lw} height={lh} rx={2}
                      fill={isUser ? 'rgba(55,35,0,0.93)' : 'rgba(6,14,8,0.87)'}
                      stroke={isUser ? '#ffd700' : 'rgba(255,255,255,0.16)'}
                      strokeWidth={isUser ? 2 : 0.5}
                    />
                    {/* Position abbreviation — top line, small, colored */}
                    <text x={positions[i].x} y={ly + 7}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={5.5} fontWeight="700" letterSpacing="0.04em"
                      fill={isUser ? '#ffd700' : color}
                      fontFamily="Inter, sans-serif">
                      {abbr}
                    </text>
                    {/* Thin divider */}
                    <line x1={lx + 2} y1={ly + 12} x2={lx + lw - 2} y2={ly + 12}
                      stroke="rgba(255,255,255,0.08)" strokeWidth={0.3} />
                    {/* Player name — bottom line, very compact, white/gold */}
                    <text x={positions[i].x} y={ly + 17.5}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={5.2} fontWeight="800" letterSpacing="0.01em"
                      fill={isUser ? '#ffd700' : 'white'}
                      fontFamily="Inter, sans-serif">
                      {sname}
                    </text>
                    {/* Checkmark or badge for user picks */}
                    {isUser && (
                      <g>
                        <circle cx={lx + lw - 2.5} cy={ly + 2} r={3.5}
                          fill="#ffd700" stroke="#3a2000" strokeWidth={0.5} />
                        <text x={lx + lw - 2.5} y={ly + 3}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize={5} fontWeight="900" fill="#3a2000" fontFamily="Inter, sans-serif">
                          ✓
                        </text>
                      </g>
                    )}
                    {/* Points badge */}
                    {pts !== undefined && pts !== 0 && (
                      <>
                        <rect x={positions[i].x - 14} y={ly - 15} width={28} height={12} rx={3}
                          fill={pts > 0 ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}
                          stroke={pts > 0 ? '#4ade80' : '#f87171'} strokeWidth={0.6} />
                        <text x={positions[i].x} y={ly - 9}
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
  const isHome  = activeTeam === 'home';
  const color   = isHome ? '#00e5ff' : '#ff6b6b';

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
            const t  = team === 'home';
            const fc = t ? homeFlag : awayFlag;
            const tn = t ? homeTeam : awayTeam;
            const c  = t ? '#00e5ff' : '#ff6b6b';
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
