'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { type DemoFixture } from '@/lib/players';
import { WC2026_FIXTURES, getFixtureStatus } from '@/lib/wc2026-fixtures';
import { formatDistanceToNow, format } from 'date-fns';
import { useTxLine } from '@/context/TxLineContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { MatchResult } from '@/app/api/match/result/route';
import { hasOpenedPack, openCardPack } from '@/lib/card-collection';
import CardPackOpener from '@/components/CardPackOpener';
import FlagImage from '@/components/FlagImage';

type FixtureScore = { home: number; away: number; completed?: boolean };

export default function ContestsPage() {
  const { appMode, liveFixtures, allFixtures } = useTxLine();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const handleReplayTutorial = useCallback(() => {
    // Pick first upcoming/live match — ?replay=1 forces tutorial even if already entered
    const upcoming = WC2026_FIXTURES.find(f => f.kickoffAt && new Date(f.kickoffAt).getTime() > Date.now() - 4 * 3600 * 1000);
    const targetId = liveFixtures?.[0]?.fixtureId ?? upcoming?.fixtureId ?? WC2026_FIXTURES[0]?.fixtureId;
    if (targetId) router.push(`/lineup/${targetId}?replay=1`);
  }, [liveFixtures, router]);
  const [enteredContests, setEnteredContests] = useState<Record<string, string[]>>({});
  const [selectedFixture, setSelectedFixture] = useState<DemoFixture | null>(null);
  const [contestCounts, setContestCounts] = useState<Record<string, { total: number; prizePool: number; top3: number; '5050': number; wta: number; top3Pool: number; fiftyFiftyPool: number; wtaPool: number }>>({});
  const [finishedScores, setFinishedScores] = useState<Record<string, FixtureScore>>({});
  const [matchResult, setMatchResult] = useState<{ fixture: DemoFixture; data: MatchResult | null; loading: boolean } | null>(null);

  const openMatchResult = (fixture: DemoFixture) => {
    setMatchResult({ fixture, data: null, loading: true });
    fetch(`/api/match/result?fixtureId=${fixture.fixtureId}`)
      .then(r => r.json())
      .then((data: MatchResult) => setMatchResult({ fixture, data, loading: false }))
      .catch(() => setMatchResult({ fixture, data: null, loading: false }));
  };

  useEffect(() => {
    setMounted(true);
    // Load which fixtures the user has entered — check both the contest entry flag AND
    // the saved lineup (the lineup key is written even when the entry flag is missing,
    // e.g. if localStorage was partially cleared or the session was on devnet).
    const map: Record<string, string[]> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('txodds_entered_contests_')) {
        const fixtureId = key.replace('txodds_entered_contests_', '');
        try { map[fixtureId] = JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { /* */ }
      }
      // Fallback: if a saved lineup exists for a fixture, treat it as entered.
      // New key format: txodds_user_lineup_{fixtureId}_{contestType}
      // Old key format: txodds_user_lineup_{fixtureId}
      if (key?.startsWith('txodds_user_lineup_')) {
        const rest = key.replace('txodds_user_lineup_', '');
        const knownTypes = ['top3', '5050', 'wta'];
        const matchedType = knownTypes.find(ct => rest.endsWith(`_${ct}`));
        const fixtureId = matchedType ? rest.slice(0, -(matchedType.length + 1)) : rest;
        const ct = matchedType ?? 'top3';
        if (!map[fixtureId]) map[fixtureId] = [];
        if (!map[fixtureId].includes(ct)) map[fixtureId].push(ct);
      }
    }
    setEnteredContests(map);
  }, []);

  const isDemo = appMode === 'demo';

  // Fetch real participant counts from Supabase for visible fixtures
  useEffect(() => {
    if (isDemo) return;
    const ids = WC2026_FIXTURES.map(f => f.fixtureId).join(',');
    fetch(`/api/contest/counts?fixtures=${ids}`)
      .then(r => r.json())
      .then(data => setContestCounts(data))
      .catch(() => {});
  }, [isDemo]);

  // Try to extract scores from allFixtures (already fetched, no extra API call needed)
  useEffect(() => {
    if (isDemo || allFixtures.length === 0) return;
    const scores: Record<string, { home: number; away: number }> = {};
    for (const f of allFixtures) {
      const id = String(f.FixtureId ?? f.fixtureId ?? f.fixture_id ?? f.id ?? '');
      if (!id) continue;
      const h = f.score?.home ?? f.Score?.Home ?? f.HomeScore ?? f.home_score;
      const a = f.score?.away ?? f.Score?.Away ?? f.AwayScore ?? f.away_score;
      if (h !== undefined && a !== undefined) scores[id] = { home: Number(h), away: Number(a) };
    }
    if (Object.keys(scores).length > 0) setFinishedScores(prev => ({ ...scores, ...prev }));
  }, [isDemo, allFixtures]);

  // Fetch real final scores for finished WC2026 matches from public sports data
  useEffect(() => {
    if (isDemo) return;
    fetch('/api/scores/wc2026')
      .then(r => r.json())
      .then((data: Record<string, { home: number; away: number }>) => {
        setFinishedScores(prev => ({ ...prev, ...data }));
      })
      .catch(() => {});
  }, [isDemo]);

  // Always show real WC2026 fixture schedule (demo mode = simulated gameplay, live mode = real data)
  // Status computed from current time; live scores overlaid from TxLINE API when available
  const mappedFixtures: DemoFixture[] = WC2026_FIXTURES.map(f => {
    // Check if this fixture is currently live from TxLINE API
    // TxLINE uses different field names depending on endpoint — try all known variants
    const fid = String(f.fixtureId);
    const apiLiveMatch = liveFixtures?.find((lf: any) => {
      const lfId = String(lf.FixtureId ?? lf.fixtureId ?? lf.fixture_id ?? lf.id ?? '');
      return lfId === fid;
    });

    // Status: prefer API live data (authoritative), fallback to time-based calculation
    const timeStatus = getFixtureStatus(f);
    // Check allFixtures for clock-based finished detection
    // TxLINE devnet always reports GameState:"scheduled" so we use Clock.Running + Clock.Seconds
    const apiAllMatch = allFixtures?.find((lf: any) => {
      const lfId = String(lf.FixtureId ?? lf.fixtureId ?? lf.fixture_id ?? lf.id ?? '');
      return lfId === fid;
    });
    const apiClockSeconds: number | null = apiAllMatch?.Clock?.Seconds ?? apiAllMatch?.clock?.seconds ?? null;
    const apiClockRunning: boolean = apiAllMatch?.Clock?.Running === true || apiAllMatch?.clock?.running === true;
    // If clock stopped and ≥90 min elapsed → match is over regardless of GameState field
    const apiIsFinished = !apiClockRunning && apiClockSeconds !== null && apiClockSeconds >= 90 * 60;
    // timeStatus is wall-clock based and always reliable.
    // It takes priority over TxLINE liveFixtures so TxLINE devnet bugs
    // (Clock.Running stuck true, late GameState updates) can't override a match
    // that has clearly run past its time window.
    // Sports data source marks completed=true once final whistle is confirmed.
    // This is the most reliable finished signal — overrides time window + TxLINE quirks.
    const sourceCompleted = !isDemo && !!finishedScores[fid]?.completed;
    const status: 'upcoming' | 'live' | 'finished' =
      (sourceCompleted) ? 'finished' :                     // sports data confirmed finished → highest priority
      (timeStatus === 'finished') ? 'finished' :           // wall-clock window expired → always finished
      (!isDemo && apiIsFinished) ? 'finished' :            // TxLINE clock ≥90 min stopped
      (!isDemo && apiLiveMatch) ? 'live' :                 // TxLINE says live
      timeStatus;                                          // upcoming (or live within window)

    // Scores: TxLINE devnet returns Score:{} (empty) so we supplement with match data API.
    let homeScore: number | undefined;
    let awayScore: number | undefined;
    if (!isDemo && finishedScores[f.fixtureId]) {
      // Authoritative scores — covers regular time, ET, and penalty shootout goals
      homeScore = finishedScores[f.fixtureId].home;
      awayScore = finishedScores[f.fixtureId].away;
    } else if (!isDemo && apiLiveMatch) {
      // Fallback: TxLINE live data (empty on devnet but correct on prod)
      homeScore = apiLiveMatch.score?.home ?? apiLiveMatch.Score?.Home ?? apiLiveMatch.HomeScore;
      awayScore = apiLiveMatch.score?.away ?? apiLiveMatch.Score?.Away ?? apiLiveMatch.AwayScore;
    }

    return {
      fixtureId: f.fixtureId,
      kickoffAt: f.kickoffAt,
      homeTeam: f.homeTeam,
      homeFlag: f.homeFlag,
      awayTeam: f.awayTeam,
      awayFlag: f.awayFlag,
      status,
      homeScore,
      awayScore,
    };
  });

  const upcoming = mappedFixtures.filter((f) => f.status === 'upcoming');
  const live = mappedFixtures.filter((f) => f.status === 'live');
  // Newest match first — most recently finished at the top
  const finished = mappedFixtures
    .filter((f) => f.status === 'finished')
    .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime());

  if (!mounted) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      <main style={{ padding: '48px 0 80px' }}>
        <div className="container">
          {/* DEMO mode banner */}
          {isDemo && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.35)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.1rem' }}>🎮</span>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffaa00', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Demo Mode Active</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Match data is simulated. Switch to Live Mode to play with real-time WC2026 data.</div>
                </div>
              </div>
              <SwitchToLiveButton />
            </div>
          )}



          {/* Telegram Subscribe Banner */}
          <a
            href="https://t.me/OddsDraftBot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, marginBottom: 20, padding: '12px 18px',
              background: 'linear-gradient(135deg, rgba(42,171,238,0.12) 0%, rgba(42,171,238,0.05) 100%)',
              border: '1px solid rgba(42,171,238,0.35)', borderRadius: 10,
              textDecoration: 'none', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="12" fill="#2AABEE"/>
                <path d="M17.5 7.9l-2 9.4c-.15.63-.53.79-1.07.49l-2.94-2.16-1.42 1.37c-.16.16-.29.29-.59.29l.21-2.98 5.46-4.93c.24-.21-.05-.33-.37-.12L7.1 13.97 4.27 13.1c-.62-.19-.63-.62.13-.92L16.9 7.45c.52-.18.98.13.6.45z" fill="white"/>
              </svg>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2AABEE' }}>Get Live Match Notifications</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>Subscribe on Telegram — goals, cards &amp; score updates</div>
              </div>
            </div>
            <div style={{ padding: '6px 14px', background: '#2AABEE', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, color: '#fff', flexShrink: 0, whiteSpace: 'nowrap' }}>
              Subscribe
            </div>
          </a>

          {/* Header */}
          <div className="contests-header-banner" style={{
            marginBottom: 40,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20,
            position: 'relative',
            padding: '54px 40px',
            border: '2px solid #ffd700',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            {/* Background Image without blur */}
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              backgroundImage: 'url("/schedule.webp")',
              backgroundSize: 'cover',
              backgroundPosition: 'bottom',
              opacity: 1,
              pointerEvents: 'none',
            }} />

            {/* Light gradient overlay to ensure text readability without being too dark */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
              background: 'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 60%)',
            }} />

            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{
                  background: '#ffd700',
                  color: '#000000',
                  padding: '3px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderRadius: 0
                }}>
                  2026 World Cup
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: 8, lineHeight: 1.1 }}>
                Match Schedule
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                Pick a match, build your lineup, and compete for SOL prizes.
              </p>
            </div>
            <img 
              src="/fifa_world_cup_2026_logo.webp" 
              alt="FIFA World Cup 2026 Logo" 
              style={{ height: '120px', objectFit: 'contain', opacity: 0.95, margin: 0, position: 'relative', zIndex: 2 }}
            />
          </div>

          {/* Replay Tutorial */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, marginTop: -8 }}>
            <button
              onClick={handleReplayTutorial}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px',
                fontSize: '0.72rem', fontWeight: 700,
                color: '#fbf0b9',
                background: 'rgba(251,240,185,0.07)',
                border: '1px solid rgba(251,240,185,0.3)',
                borderRadius: 20,
                cursor: 'pointer',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              ▶ Replay Tutorial
            </button>
          </div>

          {/* Entry Fee Info */}
          <div className="card card--glass" style={{ marginBottom: 32, padding: 'var(--space-4) var(--space-6)' }}>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Entry Fee', value: '0.1 SOL', icon: '💰' },
                { label: 'Prize Modes', value: 'Top 3, 50/50, WTA', icon: '🏆' },
                { label: 'Network', value: 'Solana', icon: 'SOL' },
                { label: 'Data', value: 'TxODDS Live', icon: '⚡' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {item.icon === 'SOL' ? (
                    <svg width="22" height="18" viewBox="0 0 397.7 311.7" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                      <defs>
                        <linearGradient id="solG1" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#9945FF"/>
                          <stop offset="100%" stopColor="#14F195"/>
                        </linearGradient>
                      </defs>
                      <path fill="url(#solG1)" d="M64.6 237.9a10.76 10.76 0 017.5-3.1h314.9c4.7 0 7.1 5.7 3.7 9.1l-62.7 62.7a10.76 10.76 0 01-7.5 3.1H4.6c-4.7 0-7.1-5.7-3.7-9.1z"/>
                      <path fill="url(#solG1)" d="M64.6 3.1A10.76 10.76 0 0172.1 0h314.9c4.7 0 7.1 5.7 3.7 9.1L328 71.8a10.76 10.76 0 01-7.5 3.1H4.6c-4.7 0-7.1-5.7-3.7-9.1z"/>
                      <path fill="url(#solG1)" d="M333.1 120.1a10.76 10.76 0 00-7.5-3.1H10.7c-4.7 0-7.1 5.7-3.7 9.1l62.7 62.7a10.76 10.76 0 007.5 3.1h314.9c4.7 0 7.1-5.7 3.7-9.1z"/>
                    </svg>
                  ) : (
                    <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  )}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LIVE Contests */}
          {live.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Live Now</h2>
                <span className="badge badge--live">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                  {live.length} match{live.length > 1 ? 'es' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
                
                {/* 1. Live Matches Cards (Left) */}
                <div style={{ flex: '1 1 35%', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {live.map((fixture) => (
                    <ContestCard key={fixture.fixtureId} fixture={fixture} onSelect={setSelectedFixture} counts={contestCounts[fixture.fixtureId]} firstContestType={enteredContests[fixture.fixtureId]?.[0]} />
                  ))}
                </div>

                {/* 2 & 3. Demo-only side panels — fake events and fake leaderboard */}
                {isDemo && (
                  <>
                    {/* Demo Live Match Events (Middle) */}
                    <div style={{ flex: '1 1 35%', minWidth: 300 }}>
                      <div className="ro-window" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div className="ro-window__header" style={{ background: 'linear-gradient(to right, #ea6b6b 0%, #b71c1c 100%)' }}>
                          <span>⚡ Live Updates</span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>🟡 SIMULATED</span>
                        </div>
                        <div className="ro-window__body" style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
                          {[
                            { id: '1', minute: 42, teamFlag: '🇦🇷', player: 'Messi', points: 10, description: 'GOAL! Messi curls a stunning shot into the top corner!' },
                            { id: '2', minute: 38, teamFlag: '🇦🇷', player: 'Messi', points: 0, description: 'TxLINE: HighDanger possession for Argentina in the box!' },
                            { id: '3', minute: 33, teamFlag: '🇦🇷', player: 'Mac Allister', points: 1, description: 'Argentina dominant in possession. Mac Allister controls midfield.' },
                            { id: '4', minute: 28, teamFlag: '🇫🇷', player: 'Mbappé', points: 3, description: 'Mbappé is brought down in the box — penalty awarded!' },
                            { id: '5', minute: 21, teamFlag: '🇫🇷', player: 'Griezmann', points: -2, description: 'Yellow card for Griezmann after a late challenge.' },
                            { id: '6', minute: 12, teamFlag: '🇫🇷', player: 'Mbappé', points: 10, description: 'GOAL! Mbappé fires into the top corner on the counter!' },
                            { id: '7', minute: 8, teamFlag: '🇫🇷', player: 'Mbappé', points: 0, description: 'TxLINE: HighDanger — France pressing high, Mbappé causing havoc.' },
                            { id: '8', minute: 3, teamFlag: '🇫🇷', player: 'Dembélé', points: 0, description: 'Corner kick awarded to France.' },
                            { id: '9', minute: 1, teamFlag: '', player: '', points: 0, description: 'Kick Off! Argentina vs France has begun!' },
                          ].map((event) => (
                            <div key={event.id} style={{ display: 'flex', gap: 12 }}>
                              <div style={{ width: 28, fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', paddingTop: 2 }}>
                                {event.minute}&apos;
                              </div>
                              <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '10px 12px', border: '1px solid #4f6382', boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.5)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <strong style={{ fontSize: '0.85rem', color: '#e2e8f0' }}><FlagImage flag={event.teamFlag} size={14} /> {event.player}</strong>
                                  {event.points !== 0 && (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: event.points > 0 ? '#00e87a' : '#ff4d6d' }}>
                                      {event.points > 0 ? '+' : ''}{event.points} pts
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{event.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Demo Live Leaderboard (Right) */}
                    <div style={{ flex: '1 1 25%', minWidth: 260 }}>
                      <div className="ro-window" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div className="ro-window__header" style={{ background: 'linear-gradient(to right, #b45309 0%, #78350f 100%)' }}>
                          <span>🏆 Live Leaderboard</span>
                          <span style={{ fontSize: '0.65rem', opacity: 0.75 }}>SIMULATED</span>
                        </div>
                        <div className="ro-window__body" style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
                          {[
                            { rank: 1, user: 'CryptoKing', pts: 86, prize: '1.2' },
                            { rank: 2, user: 'SatoshiStriker', pts: 78, prize: '0.85' },
                            { rank: 3, user: 'Web3Winner', pts: 72, prize: '0.6' },
                            { rank: 4, user: 'BlockBetter', pts: 68, prize: '0.45' },
                            { rank: 5, user: 'NFTNinja', pts: 64, prize: '0.35' },
                            { rank: 6, user: 'SolanaSurfer', pts: 59, prize: '0.2' },
                            { rank: 7, user: 'DefiDon', pts: 55, prize: '0.1' },
                            { rank: 8, user: 'TokenTactician', pts: 51, prize: '0.1' },
                            { rank: 9, user: 'MetaManager', pts: 48, prize: '0.05' },
                            { rank: 10, user: 'AlphaApe', pts: 45, prize: '0.05' },
                            { rank: 11, user: 'BetBros', pts: 42, prize: '-' },
                            { rank: 12, user: 'ChainChamp', pts: 40, prize: '-' },
                          ].map((entry) => (
                            <div key={entry.rank} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '10px 12px', border: '1px solid #4f6382', boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.5)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 800, color: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : '#cd7f32' }}>#{entry.rank}</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>{entry.user}</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                                <span style={{ fontSize: '0.8rem', color: '#00e87a' }}>{entry.pts} pts</span>
                                <span style={{ fontSize: '0.75rem', color: '#ffd700', fontWeight: 700 }}>{entry.prize} SOL</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* UPCOMING Contests */}
          {upcoming.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>Upcoming</h2>
              <div className="grid-contests">
                {upcoming.map((fixture) => (
                  <ContestCard key={fixture.fixtureId} fixture={fixture} onSelect={setSelectedFixture} counts={contestCounts[fixture.fixtureId]} firstContestType={enteredContests[fixture.fixtureId]?.[0]} />
                ))}
              </div>
            </section>
          )}

          {/* FINISHED Contests */}
          {finished.length > 0 && (
            <section>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-secondary)' }}>
                Completed
              </h2>
              <div className="grid-contests">
                {finished.map((fixture) => (
                  <ContestCard
                    key={fixture.fixtureId}
                    fixture={fixture}
                    onSelect={setSelectedFixture}
                    counts={contestCounts[fixture.fixtureId]}
                    onViewResult={finishedScores[fixture.fixtureId] ? openMatchResult : undefined}
                    hasEntered={!!(enteredContests[fixture.fixtureId]?.length)}
                    firstContestType={enteredContests[fixture.fixtureId]?.[0]}
                    enteredTypes={enteredContests[fixture.fixtureId] ?? []}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* LOBBY MODAL */}
      {selectedFixture && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div className="ro-window" style={{ width: '100%', maxWidth: 500, animation: 'slide-in-bottom 0.2s ease-out' }}>
            <div className="ro-window__header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Select Contest Type</span>
              <button onClick={() => setSelectedFixture(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            <div className="ro-window__body" style={{ padding: 24 }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedFixture.homeTeam} vs {selectedFixture.awayTeam}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>Choose a prize structure to compete in</p>
              </div>

              {/* Demo mode notice inside modal */}
              {isDemo && (
                <div style={{ marginBottom: 16, padding: '8px 12px', background: 'rgba(255,170,0,0.07)', border: '1px solid rgba(255,170,0,0.25)', borderRadius: 6, fontSize: '0.75rem', color: 'rgba(255,170,0,0.85)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🎮</span>
                  <span>Demo Mode — this lineup is a simulation and requires no SOL. <button onClick={() => setSelectedFixture(null)} style={{ background: 'none', border: 'none', color: '#ffaa00', cursor: 'pointer', fontWeight: 700, padding: 0, textDecoration: 'underline', fontSize: 'inherit' }}>Switch to Live</button> to play for real.</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { id: 'top3',  title: 'Top 3 Classic',      desc: '50% / 30% / 20% split to ranks 1, 2, 3.', icon: '🏆', poolKey: 'top3Pool'  as const, ctKey: 'top3'  as const },
                  { id: '5050',  title: 'Double Up (50/50)',   desc: 'Top 50% of the leaderboard splits the prize pool equally.', icon: '⚖️', poolKey: 'fiftyFiftyPool' as const, ctKey: '5050' as const },
                  { id: 'wta',   title: 'Winner Takes All',    desc: 'Rank 1 takes 100% of the prize pool. High risk, high reward.', icon: '💀', poolKey: 'wtaPool' as const, ctKey: 'wta' as const },
                ].map(ct => {
                  const fixtureCount = contestCounts[selectedFixture.fixtureId];
                  const ctPlayers = fixtureCount?.[ct.ctKey] ?? 0;
                  const ctPool = fixtureCount?.[ct.poolKey] ?? 0;
                  const showCount = !isDemo && ctPlayers > 0;
                  const joined = (enteredContests[selectedFixture.fixtureId] ?? []).includes(ct.id);
                  const card = (
                    <div className={joined ? 'card' : 'card card--hoverable'} style={{
                      padding: 16, display: 'flex', gap: 16, alignItems: 'center',
                      background: joined ? 'rgba(255,255,255,0.03)' : 'var(--bg-elevated)',
                      border: joined ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.1)',
                      cursor: joined ? 'default' : 'pointer',
                      opacity: joined ? 0.85 : 1,
                    }}>
                      <div style={{ fontSize: '2rem' }}>{joined ? '✅' : ct.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {ct.title}
                          {joined && <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,215,0,0.15)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)', fontWeight: 700 }}>JOINED</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{joined ? 'You have already entered this contest.' : ct.desc}</div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                        {joined ? (
                          <Link href={`/live/${selectedFixture.fixtureId}?contestType=${ct.id}`} className="btn btn--sm btn--primary" onClick={e => e.stopPropagation()} style={{ fontSize: '0.7rem', padding: '4px 10px' }}>
                            Watch Live →
                          </Link>
                        ) : (
                          <>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Entry</div>
                              <div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>0.1 SOL</div>
                            </div>
                            {showCount ? (
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{ctPlayers} joined</div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ffd700' }}>Pool: {ctPool.toFixed(2)} SOL</div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                {isDemo ? 'Demo mode' : 'Be first!'}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                  return joined
                    ? <div key={ct.id}>{card}</div>
                    : <Link href={`/lineup/${selectedFixture.fixtureId}?contestType=${ct.id}`} key={ct.id} style={{ textDecoration: 'none' }}>{card}</Link>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MATCH RESULT MODAL */}
      {matchResult && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setMatchResult(null)}
        >
          <div
            className="ro-window"
            style={{ width: '100%', maxWidth: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'slide-in-bottom 0.2s ease-out' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="ro-window__header" style={{ background: 'linear-gradient(to right, #4f5f70 0%, #2c353f 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🏁 Match Result</span>
              <button onClick={() => setMatchResult(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
            </div>

            <div className="ro-window__body" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {/* Score header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}><FlagImage flag={matchResult.fixture.homeFlag} size={32} /></div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{matchResult.fixture.homeTeam}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0 16px' }}>
                  <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '2.5rem', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                    {matchResult.fixture.homeScore ?? '?'} — {matchResult.fixture.awayScore ?? '?'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Full Time</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}><FlagImage flag={matchResult.fixture.awayFlag} size={32} /></div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{matchResult.fixture.awayTeam}</div>
                </div>
              </div>

              {/* Loading */}
              {matchResult.loading && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Loading match details...
                </div>
              )}

              {/* No data */}
              {!matchResult.loading && !matchResult.data && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Match details not available.
                </div>
              )}

              {/* Events */}
              {!matchResult.loading && matchResult.data && (
                <>
                  {matchResult.data.events.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No key events recorded.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      {matchResult.data.events.map((ev, i) => {
                        const isHome = ev.team === matchResult.fixture.homeTeam ||
                          matchResult.fixture.homeTeam.toLowerCase().includes(ev.team.toLowerCase()) ||
                          ev.team.toLowerCase().includes(matchResult.fixture.homeTeam.toLowerCase());
                        const icon =
                          ev.type === 'goal' ? '⚽' :
                          ev.type === 'own_goal' ? '⚽' :
                          ev.type === 'penalty' ? '⚽ (P)' :
                          ev.type === 'yellow_card' ? '🟨' :
                          ev.type === 'red_card' ? '🟥' :
                          ev.type === 'yellow_red_card' ? '🟨🟥' :
                          ev.type === 'sub' ? '🔄' : '•';
                        const label =
                          ev.type === 'own_goal' ? 'Own Goal' :
                          ev.type === 'penalty' ? 'Penalty' :
                          ev.type === 'yellow_card' ? 'Yellow Card' :
                          ev.type === 'red_card' ? 'Red Card' :
                          ev.type === 'yellow_red_card' ? '2nd Yellow' :
                          ev.type === 'sub' ? 'Sub' : '';
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6 }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', width: 32, flexShrink: 0, textAlign: 'right' }}>{ev.minute}&apos;</span>
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FlagImage flag={isHome ? matchResult.fixture.homeFlag : matchResult.fixture.awayFlag} size={16} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.player}</span>
                                {label && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>({label})</span>}
                              </div>
                              {ev.assist && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>Assist: {ev.assist}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Venue */}
                  {matchResult.data.venue && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
                      📍 {matchResult.data.venue}{matchResult.data.attendance ? ` · ${matchResult.data.attendance} attendance` : ''}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SwitchToLiveButton() {
  const { appMode, toggleAppMode, apiToken, isSubscribing, subscribeAndActivate } = useTxLine();
  const { connected } = useWallet();
  const [err, setErr] = useState('');

  const handleSwitch = async () => {
    if (appMode === 'live') return;
    if (apiToken) { toggleAppMode(); return; }
    if (!connected) { setErr('Connect wallet first'); setTimeout(() => setErr(''), 3000); return; }
    try {
      await subscribeAndActivate();
      toggleAppMode();
    } catch {
      setErr('Failed — try again');
      setTimeout(() => setErr(''), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {err && <span style={{ fontSize: '0.75rem', color: '#ff6b6b' }}>{err}</span>}
      <button
        onClick={handleSwitch}
        disabled={isSubscribing}
        style={{
          padding: '7px 16px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700,
          background: 'linear-gradient(135deg, #ffaa00, #ff8800)', color: '#1a1008',
          border: 'none', cursor: isSubscribing ? 'wait' : 'pointer',
          opacity: isSubscribing ? 0.7 : 1, whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(255,170,0,0.3)',
        }}
      >
        {isSubscribing ? 'Connecting...' : '⚡ Switch to Live Mode'}
      </button>
    </div>
  );
}

function ContestCard({ fixture, onSelect, counts, onViewResult, hasEntered, firstContestType, enteredTypes }: {
  fixture: DemoFixture;
  onSelect?: (f: DemoFixture) => void;
  counts?: { total: number; prizePool: number; top3: number; '5050': number; wta: number; top3Pool: number; fiftyFiftyPool: number; wtaPool: number };
  onViewResult?: (f: DemoFixture) => void;
  hasEntered?: boolean;
  firstContestType?: string;
  enteredTypes?: string[];
}) {
  const [claimingType, setClaimingType] = useState<string | null>(null);
  const [claimedTypes, setClaimedTypes] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const s = new Set<string>();
    for (const ct of enteredTypes ?? []) {
      if (hasOpenedPack(`${fixture.fixtureId}_${ct}`)) s.add(ct);
    }
    return s;
  });

  const kickoff = new Date(fixture.kickoffAt);
  const isLive = fixture.status === 'live';
  const isFinished = fixture.status === 'finished';
  const isUpcoming = fixture.status === 'upcoming';

  const participants = counts?.total ?? 0;
  const prizePool = counts?.prizePool?.toFixed(2) ?? '0.00';

  return (
    <div
      className="ro-window card--hoverable"
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
      id={`contest-card-${fixture.fixtureId}`}
    >
      {/* Live pulse bg */}
      {isLive && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at top right, rgba(255, 77, 109, 0.08), transparent 60%)',
          pointerEvents: 'none',
        }} />
      )}

      {/* RO Window Header */}
      <div className="ro-window__header" style={{
        background: isLive 
          ? 'linear-gradient(to right, #ea6b6b 0%, #b71c1c 100%)'
          : (isFinished ? 'linear-gradient(to right, #4f5f70 0%, #2c353f 100%)' : 'linear-gradient(to right, var(--color-ro-blue-header) 0%, var(--color-ro-blue-header-light) 100%)'),
      }}>
        <span>{fixture.homeTeam} vs {fixture.awayTeam}</span>
        <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>
          {isLive ? '🔴 LIVE' : isUpcoming ? '⏳ UPCOMING' : '🏁 COMPLETED'}
        </span>
      </div>

      <div className="ro-window__body">
        {/* Time info */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {isUpcoming
              ? `Starts in ${formatDistanceToNow(kickoff)}`
              : isLive
              ? `Started ${formatDistanceToNow(kickoff)} ago`
              : format(kickoff, 'MMM d, yyyy')}
          </span>
        </div>

        {/* Teams */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'center' }}><FlagImage flag={fixture.homeFlag} size={40} /></div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fixture.homeTeam}</div>
            {isLive && (
              <div style={{
                fontFamily: 'Bebas Neue, cursive',
                fontSize: '2.5rem',
                color: 'var(--text-primary)',
                marginTop: 4,
              }}>
                {fixture.homeScore ?? 0}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', padding: '0 16px' }}>
            {isLive ? (
              <div style={{ color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.8rem' }}>VS</div>
            ) : isFinished ? (
              <div style={{
                fontFamily: 'Bebas Neue, cursive',
                fontSize: '1.8rem',
                color: 'var(--text-secondary)',
                letterSpacing: '0.08em',
              }}>
                {fixture.homeScore ?? '?'} — {fixture.awayScore ?? '?'}
              </div>
            ) : (
              <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.5rem', color: 'var(--text-muted)' }}>
                VS
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'center' }}><FlagImage flag={fixture.awayFlag} size={40} /></div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fixture.awayTeam}</div>
            {isLive && (
              <div style={{
                fontFamily: 'Bebas Neue, cursive',
                fontSize: '2.5rem',
                color: 'var(--text-primary)',
                marginTop: 4,
              }}>
                {fixture.awayScore ?? 0}
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.3rem', color: participants > 0 ? 'var(--color-primary)' : 'var(--text-muted)' }}>
              {participants > 0 ? `${prizePool} SOL` : '–'}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Prize Pool
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.3rem', color: participants > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {participants > 0 ? participants : '–'}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Players
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.3rem', color: 'var(--color-accent)' }}>
              0.1 SOL
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Entry Fee
            </div>
          </div>
        </div>



        {/* CTA */}
        {isUpcoming && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onSelect?.(fixture)}
              className="btn btn--primary"
              id={`join-${fixture.fixtureId}`}
              style={{ flex: 1 }}
            >
              Build Lineup →
            </button>
            <Link
              href={`/live/${fixture.fixtureId}${firstContestType ? `?contestType=${firstContestType}` : ''}`}
              className="btn btn--ghost"
              id={`watch-${fixture.fixtureId}`}
              style={{ whiteSpace: 'nowrap' }}
            >
              👁 Watch
            </Link>
          </div>
        )}
        {isLive && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/live/${fixture.fixtureId}${firstContestType ? `?contestType=${firstContestType}` : ''}`} className="btn btn--danger btn--full" id={`live-${fixture.fixtureId}`}>
              🔴 Watch Live
            </Link>
            <button
              onClick={() => onSelect?.(fixture)}
              className="btn btn--secondary"
              id={`join-live-${fixture.fixtureId}`}
              style={{ whiteSpace: 'nowrap' }}
            >
              Join
            </button>
          </div>
        )}
        {isFinished && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hasEntered && (
              <Link
                href={`/live/${fixture.fixtureId}${firstContestType ? `?contestType=${firstContestType}` : ''}`}
                className="btn btn--primary btn--full"
              >
                🏆 My Results
              </Link>
            )}
            {/* Claim pack buttons — one per entered contest type */}
            {(enteredTypes ?? []).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(enteredTypes ?? []).map(ct => {
                  const claimed = claimedTypes.has(ct);
                  const label = ct === 'top3' ? 'Top 3' : ct === '5050' ? '50/50' : 'Winner Takes All';
                  return (
                    <button
                      key={ct}
                      disabled={claimed}
                      onClick={() => !claimed && setClaimingType(ct)}
                      className="btn btn--full"
                      style={{
                        background: claimed ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                        color: claimed ? 'var(--text-muted)' : '#fff',
                        border: claimed ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(168,85,247,0.4)',
                        cursor: claimed ? 'default' : 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        gap: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {claimed ? `✅ Pack Claimed (${label})` : `🎴 Claim Pack — ${label}`}
                    </button>
                  );
                })}
              </div>
            )}
            {onViewResult && (
              <button
                onClick={() => onViewResult(fixture)}
                className={`btn btn--full ${hasEntered ? 'btn--ghost' : 'btn--secondary'}`}
              >
                📊 Match Details
              </button>
            )}
          </div>
        )}
        {/* Card pack opener modal */}
        {claimingType && (
          <CardPackOpener
            contestId={`${fixture.fixtureId}_${claimingType}`}
            onOpen={() => openCardPack(`${fixture.fixtureId}_${claimingType!}`)}
            onClose={() => {
              setClaimedTypes(prev => new Set([...prev, claimingType!]));
              setClaimingType(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
