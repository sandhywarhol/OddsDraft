'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { DEMO_FIXTURES, type Player, type DemoFixture } from '@/lib/players';
import { getStaticPlayersByTeam, WC2026_PLAYERS } from '@/lib/wc2026-players-static';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';
import { type LineupPlayer, MAX_PLAYERS } from '@/types';
import { calculateFantasyPoints } from '@/lib/fantasy-engine';
import { getCardsForLineupPosition, getCardById, addCardToCollection, type OwnedCard } from '@/lib/card-collection';
import { RARITY_COLOR, SKILL_CARDS, type SkillCard, getUpgradedEffectText } from '@/lib/skill-cards';
import { formatDistanceToNow } from 'date-fns';
import { useTxLine } from '@/context/TxLineContext';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { buildJoinContestIx } from '@/lib/oddsdraft-anchor';
import PlayerAvatar from '@/components/PlayerAvatar';
import FlagImage from '@/components/FlagImage';
import { prefetchPlayerPhotos } from '@/lib/player-photos';
import SkillCardDisplay from '@/components/SkillCardDisplay';
// ── AI Recommendation badges ──────────────────────────────────────────────────
// Rule-based picks derived from rating + position. Called per-player with the
// full list so we can identify the single "top pick" relative to peers.
type AIBadge = { label: string; color: string; bg: string };

function getAIBadge(player: Player, peers: Player[]): AIBadge | null {
  const { position, rating = 0 } = player;
  // Captain Suggestion — best ATT or MID in the current list by rating
  if (position === 'ATT' || position === 'MID') {
    const topRating = Math.max(...peers.filter(p => p.position === 'ATT' || p.position === 'MID').map(p => p.rating ?? 0));
    if (rating === topRating && rating >= 84) {
      return { label: '⭐ Captain Pick', color: '#ffd700', bg: 'rgba(255,215,0,0.12)' };
    }
  }
  // Safe Pick — GK or DEF with solid rating
  if ((position === 'GK' || position === 'DEF') && rating >= 85) {
    return { label: '🛡 Safe Pick', color: '#00e87a', bg: 'rgba(0,232,122,0.10)' };
  }
  // Undervalued — ATT/MID with decent rating but not the top pick
  if ((position === 'ATT' || position === 'MID') && rating >= 82 && rating <= 85) {
    return { label: '💎 Undervalued', color: '#a78bfa', bg: 'rgba(167,139,250,0.10)' };
  }
  // High Risk — lower-rated ATT (upside but unreliable)
  if (position === 'ATT' && rating < 82) {
    return { label: '⚡ High Risk', color: '#f87171', bg: 'rgba(248,113,113,0.10)' };
  }
  return null;
}

// Demo score events for showing fantasy points in action
const DEMO_EVENTS = [
  { playerId: 'fra-mbappe', playerName: 'Mbappé', eventType: 'goal', minute: 23, points: 10 },
  { playerId: 'arg-messi', playerName: 'Messi', eventType: 'assist', minute: 23, points: 6 },
  { playerId: 'arg-martinez', playerName: 'E. Martínez', eventType: 'goalkeeper_save', minute: 35, points: 1 },
  { playerId: 'fra-griezmann', playerName: 'Griezmann', eventType: 'yellow_card', minute: 41, points: -2 },
  { playerId: 'arg-lautaro', playerName: 'L. Martínez', eventType: 'goal', minute: 57, points: 10 },
  { playerId: 'fra-mbappe', playerName: 'Mbappé', eventType: 'goal', minute: 78, points: 10 },
];

// Demo skill cards equipped on the tutorial squad
const DEMO_CARDS: OwnedCard[] = [
  { instanceId: 'tutorial-demo-gk',  cardId: 'gk-common',     obtainedAt: new Date().toISOString() },
  { instanceId: 'tutorial-demo-def', cardId: 'def-uncommon',  obtainedAt: new Date().toISOString() },
  { instanceId: 'tutorial-demo-mid', cardId: 'mid-rare',      obtainedAt: new Date().toISOString() },
  { instanceId: 'tutorial-demo-swg', cardId: 'win-epic',      obtainedAt: new Date().toISOString() },
  { instanceId: 'tutorial-demo-att', cardId: 'str-legendary', obtainedAt: new Date().toISOString() },
];

const SLOTS = [
  { label: 'GK', filter: 'GK' },
  { label: 'DEF (CB/LB/RB)', filter: 'DEF' },
  { label: 'MID (CMF/AMF)', filter: 'MID' },
  { label: 'SWINGER (LW/RW)', filter: 'SWG' },
  { label: 'FWD (CF/SS)', filter: 'ATT' },
];

const getPositionColor = (label: string) => {
  if (label.includes('GK')) return '#1d4ed8'; // Blue
  if (label.includes('DEF')) return '#15803d'; // Green
  if (label.includes('MID')) return '#b45309'; // Amber/Orange
  if (label.includes('SWINGER')) return '#c2410c'; // Orange-red — dynamic wide player
  if (label.includes('FWD')) return '#b91c1c'; // Red
  return '#36220f';
};
const getShortLabel = (label: string) => {
  if (label.includes('GK')) return 'GK';
  if (label.includes('DEF')) return 'DEF';
  if (label.includes('MID')) return 'MID';
  if (label.includes('SWINGER')) return 'SWG';
  if (label.includes('FWD')) return 'FWD';
  return label;
};

const getPositionFullName = (label: string) => {
  if (label.includes('GK')) return 'Goalkeeper';
  if (label.includes('SWINGER')) return 'Swinger';
  if (label.includes('DEF')) return 'Defender';
  if (label.includes('MID')) return 'Midfielder';
  if (label.includes('FWD')) return 'Forward';
  return label;
};


const TEAM_FLAG_CODES: Record<string, string> = {
  'Brazil': 'br', 'Argentina': 'ar', 'France': 'fr', 'England': 'gb-eng',
  'Portugal': 'pt', 'Spain': 'es', 'Germany': 'de', 'Italy': 'it',
  'Netherlands': 'nl', 'Belgium': 'be', 'Croatia': 'hr', 'Uruguay': 'uy',
  'Colombia': 'co', 'Mexico': 'mx', 'USA': 'us', 'Japan': 'jp',
  'South Korea': 'kr', 'Senegal': 'sn', 'Morocco': 'ma', 'Ivory Coast': 'ci',
  'Austria': 'at', 'Algeria': 'dz', 'Norway': 'no', 'Canada': 'ca',
  'Switzerland': 'ch', 'Turkey': 'tr', 'Ecuador': 'ec', 'Australia': 'au',
  'Egypt': 'eg', 'Saudi Arabia': 'sa', 'Ghana': 'gh', 'Sweden': 'se',
  'Scotland': 'gb-sct', 'Iran': 'ir', 'Paraguay': 'py', 'Qatar': 'qa',
  'Uzbekistan': 'uz', 'Congo DR': 'cd', 'Bosnia & Herzegovina': 'ba',
  'Czech Republic': 'cz', 'South Africa': 'za', 'Panama': 'pa',
  'New Zealand': 'nz', 'Tunisia': 'tn', 'Iraq': 'iq', 'Jordan': 'jo',
  'Cape Verde': 'cv', 'Curacao': 'cw', 'Haiti': 'ht',
};

const getPositionDescription = (label: string) => {
  switch (label) {
    case 'GK': return 'Goalkeeper';
    case 'CB': return 'Center Back';
    case 'MF': return 'Midfielder';
    case 'SW': return 'Sweeper';
    case 'CF': return 'Center Forward';
    default: return '';
  }
};

export default function LineupBuilderPage({ params, searchParams }: { params: Promise<{ contestId: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { contestId } = use(params);
  const searchParamsObj = use(searchParams);
  const contestType = (searchParamsObj.contestType as string) || 'top3';
  const isReplayTutorial = searchParamsObj.replay === '1';
  const { appMode, liveFixtures } = useTxLine();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();

  const isDemo = appMode === 'demo';
  const isDevnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet';

  // Always prefer WC2026 real fixture; fall back to demo fixtures, then placeholder
  const wcMatch = WC2026_FIXTURES.find(f => f.fixtureId === contestId);
  let fixture: DemoFixture | undefined = wcMatch
    ? {
        fixtureId: wcMatch.fixtureId,
        kickoffAt: wcMatch.kickoffAt,
        homeTeam: wcMatch.homeTeam,
        homeFlag: wcMatch.homeFlag,
        awayTeam: wcMatch.awayTeam,
        awayFlag: wcMatch.awayFlag,
        status: 'upcoming' as const,
      }
    // In live mode: never fall back to demo fixtures — demo team names must not
    // appear on a real lineup page. The generic placeholder below handles undefined.
    : !isDemo ? undefined : DEMO_FIXTURES.find(f => f.fixtureId === contestId);

  if (!fixture) fixture = {
    fixtureId: contestId,
    kickoffAt: new Date().toISOString(),
    homeTeam: 'Home', homeFlag: '🏳️',
    awayTeam: 'Away', awayFlag: '🏳️',
    status: 'upcoming' as const,
  };

  const isTxLineLive = !isDemo && liveFixtures?.some(f => 
    f.homeTeam?.name === fixture.homeTeam || f.awayTeam?.name === fixture.awayTeam
  );
  const kickoffTime = new Date(fixture.kickoffAt);
  const isPastKickoff = !isDemo && Date.now() > kickoffTime.getTime();
  const isLocked = !isDemo && (isTxLineLive || isPastKickoff || fixture.status === 'finished');

  const [lineup, setLineup] = useState<(LineupPlayer | null)[]>([null, null, null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [captain, setCaptain] = useState<string>('');
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [playerSearch, setPlayerSearch] = useState('');
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home');

  const [dynamicPlayers, setDynamicPlayers] = useState<import('@/lib/players').Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);

  type MatchOdds = { home: number | null; draw: number | null; away: number | null; ts?: number };
  const [matchOdds, setMatchOdds] = useState<MatchOdds | null>(null);

  const getPlayers = (team: string): import('@/lib/players').Player[] => {
    const fromApi = dynamicPlayers.filter(p => p.team === team);
    if (fromApi.length > 0) return fromApi;
    return getStaticPlayersByTeam(team) as import('@/lib/players').Player[];
  };

  useEffect(() => {
    if (!fixture.homeTeam || !fixture.awayTeam) return;
    fetch(`/api/players?team=${encodeURIComponent(fixture.homeTeam)}&team=${encodeURIComponent(fixture.awayTeam)}`)
      .then(r => r.json())
      .then((data: import('@/lib/players').Player[]) => {
        if (Array.isArray(data) && data.length > 0) setDynamicPlayers(data);
      })
      .catch(() => {})
      .finally(() => setPlayersLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixture.homeTeam, fixture.awayTeam]);
  const enteredContestsKey = `txodds_entered_contests_${contestId}`;
  const alreadyEntered = typeof window !== 'undefined'
    ? (JSON.parse(localStorage.getItem(enteredContestsKey) ?? '[]') as string[]).includes(contestType)
    : false;
  const [submitted, setSubmitted] = useState(isReplayTutorial ? false : alreadyEntered);
  const [submitting, setSubmitting] = useState(false);

  type PayStep = { label: string; status: 'pending' | 'loading' | 'ok' | 'error'; detail?: string };
  const [paySteps, setPaySteps] = useState<PayStep[]>([]);
  const [payError, setPayError] = useState<string | null>(null);

  const setStep = (index: number, patch: Partial<PayStep>) =>
    setPaySteps(prev => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  // Verify against Supabase on load — catches cases where localStorage was lost
  // (page refresh during payment) so the user can't accidentally pay twice.
  useEffect(() => {
    if (submitted || isDemo || !publicKey || isReplayTutorial) return;
    fetch(`/api/contest/check-entry?fixtureId=${contestId}&walletAddress=${publicKey.toString()}&contestType=${contestType}`)
      .then(r => r.json())
      .then(({ entered }) => {
        if (entered) {
          // Mark localStorage too so future loads are instant
          try {
            const list: string[] = JSON.parse(localStorage.getItem(enteredContestsKey) ?? '[]');
            if (!list.includes(contestType)) { list.push(contestType); localStorage.setItem(enteredContestsKey, JSON.stringify(list)); }
          } catch { /* ignore */ }
          setSubmitted(true);
        }
      })
      .catch(() => { /* non-blocking — localStorage is the fallback */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey, isDemo]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [equippedCards, setEquippedCards] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(`txodds_user_lineup_${contestId}_${contestType}`)
        ?? localStorage.getItem(`txodds_user_lineup_${contestId}`);
      if (saved) return JSON.parse(saved).equippedCards ?? {};
    } catch { /* ignore */ }
    return {};
  });
  const [equipModalPlayerId, setEquipModalPlayerId] = useState<string | null>(null);

  // Fetch wallet SOL balance in live mode
  useEffect(() => {
    if (isDemo || !publicKey) return;
    connection.getBalance(publicKey).then(lamports => {
      setWalletBalance(lamports / LAMPORTS_PER_SOL);
    }).catch(() => {});
  }, [publicKey, isDemo, connection]);

  // Prefetch player photos once dynamic players are loaded
  useEffect(() => {
    if (playersLoading) return;
    const players = [...getPlayers(fixture.homeTeam), ...getPlayers(fixture.awayTeam)];
    prefetchPlayerPhotos(players.map(p => ({ id: p.id, name: p.name })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playersLoading]);

  // Poll TxODDS for live match odds every 60s
  useEffect(() => {
    if (!fixture.fixtureId || isDemo) return;
    let cancelled = false;

    const parseOdds = (data: any[]): MatchOdds | null => {
      if (!Array.isArray(data) || data.length === 0) return null;
      // Try structure: array of market objects each with Selections[]
      for (const market of data) {
        const sels: any[] = market?.Selections ?? market?.selections ?? [];
        if (sels.length >= 3) {
          const byId = (id: number) => sels.find((s: any) => (s.SelectionId ?? s.selectionId) === id);
          const byName = (n: string) => sels.find((s: any) => (s.Name ?? s.name ?? '').toLowerCase() === n.toLowerCase());
          const h = byId(1) ?? byName('1') ?? byName('home') ?? sels[0];
          const d = byId(2) ?? byName('x') ?? byName('draw') ?? sels[1];
          const a = byId(3) ?? byName('2') ?? byName('away') ?? sels[2];
          const val = (o: any) => o?.Odds ?? o?.odds ?? o?.Price ?? o?.price ?? null;
          if (val(h) !== null) return { home: val(h), draw: val(d), away: val(a), ts: data[0]?.Ts ?? data[0]?.ts };
        }
        // Flat object with Odds1/OddsX/Odds2
        if (market?.Odds1 != null) return { home: market.Odds1, draw: market.OddsX ?? market.OddsDraw, away: market.Odds2, ts: market.Ts };
      }
      // Single flat object in array
      const f = data[0];
      if (f?.Odds1 != null) return { home: f.Odds1, draw: f.OddsX ?? f.OddsDraw, away: f.Odds2, ts: f.Ts };
      return null;
    };

    const fetchOdds = async () => {
      try {
        const res = await fetch(`/api/txline/odds/snapshot/${fixture.fixtureId}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const odds = parseOdds(Array.isArray(data) ? data : [data]);
        if (!cancelled) setMatchOdds(odds);
      } catch { /* silent — odds are optional */ }
    };

    fetchOdds();
    const id = setInterval(fetchOdds, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixture.fixtureId, isDemo]);

  const [tutorialStep, setTutorialStep] = useState(0);
  const [zoomedElementId, setZoomedElementId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [wrapperTransform, setWrapperTransform] = useState('none');
  const [transformOrigin, setTransformOrigin] = useState('center center');

  const customSmoothScroll = (element: HTMLElement, duration = 800) => {
    const targetY = element.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.35 + element.offsetHeight / 2;
    const startY = window.scrollY;
    const distance = targetY - startY;
    let startTime: number | null = null;

    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  useEffect(() => {
    if (isReplayTutorial) {
      localStorage.removeItem('hasSeenLineupTutorial');
      setTutorialStep(1);
      return;
    }
    const hasSeenTutorial = localStorage.getItem('hasSeenLineupTutorial');
    if (!hasSeenTutorial) {
      setTutorialStep(1);
    }
  }, [isReplayTutorial]);

  const handleNextTutorialStep = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransitioning) return;
    
    if (zoomedElementId) {
      const prevEl = document.getElementById(zoomedElementId);
      if (prevEl) {
        prevEl.style.position = '';
        prevEl.style.zIndex = '';
        prevEl.style.transition = '';
        prevEl.style.transform = '';
        prevEl.style.background = '';
        prevEl.style.pointerEvents = '';
        prevEl.style.boxShadow = '';
        prevEl.style.maxWidth = '';
        prevEl.style.width = '';
      }
    }

    if (tutorialStep < 8) {
      const nextStep = tutorialStep + 1;
      const nextData = getTutorialData(nextStep);
      const targetId = nextData?.targetId;
      
      setZoomedElementId(null);
      
      if (targetId) {
        setIsTransitioning(true);
        setTransformOrigin(`center ${window.scrollY + window.innerHeight / 2}px`);
        
        setWrapperTransform('scale(1)');
        setTimeout(() => {
           setWrapperTransform('scale(0.94)');
        }, 20);
        
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            customSmoothScroll(element, 700);
            setTutorialStep(nextStep);
            
            setTimeout(() => {
              setWrapperTransform('scale(1)');
              
              setTimeout(() => {
                setWrapperTransform('none');
                setIsTransitioning(false);
                
                const isMobile = window.innerWidth <= 768;
                if (isMobile && targetId !== 'submit-button' && targetId !== 'lineup-header') {
                  element.style.width = '90vw';
                }
                
                const rect = element.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const currentCenterX = rect.left + rect.width / 2;
                
                let shift = 0;
                if (isMobile) {
                  shift = (viewportWidth / 2) - currentCenterX;
                } else {
                  let targetRatio = nextData?.position === 'left' ? 0.78 : 0.22;
                  if (targetId === 'submit-button') {
                    targetRatio = nextData?.position === 'left' ? 0.58 : 0.42;
                  }
                  const targetCenterX = viewportWidth * targetRatio;
                  shift = targetCenterX - currentCenterX;
                }
                
                const padding = 24;
                if (rect.left + shift < padding) shift = padding - rect.left;
                if (rect.right + shift > viewportWidth - padding) shift = viewportWidth - padding - rect.right;
                
                element.style.position = 'relative';
                element.style.zIndex = '99999';
                element.style.transition = 'transform 0.5s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.5s ease';
                element.style.background = 'rgba(8, 15, 28, 1)';
                element.style.borderRadius = '16px';
                element.style.pointerEvents = 'none';
                if (targetId === 'recruitment-terminal' || targetId === 'confidence-panel' || targetId === 'submit-button') {
                  element.style.maxWidth = '560px';
                }
                
                void element.offsetWidth; // Force reflow
                
                let translateY = -50;
                if (isMobile) {
                  if (targetId === 'submit-button') {
                    translateY = -560;
                  } else if (targetId === 'confidence-panel') {
                    translateY = -180;
                  } else if (targetId === 'recruitment-terminal') {
                    translateY = -420;
                  } else if (targetId === 'lineup-grid' && nextStep === 4) {
                    translateY = -300;
                  } else if (targetId === 'lineup-grid' && nextStep === 2) {
                    translateY = -160;
                  } else if (targetId === 'lineup-header') {
                    translateY = -150;
                  } else if (targetId === 'skill-card-section') {
                    translateY = 80;
                  }
                } else {
                  if (targetId === 'submit-button') {
                    translateY = -230;
                  } else if (targetId === 'confidence-panel') {
                    translateY = -120;
                  } else if (targetId === 'lineup-grid' && nextStep === 4) {
                    translateY = -140;
                  } else if (targetId === 'lineup-grid' && nextStep === 2) {
                    translateY = -35;
                  } else if (targetId === 'skill-card-section') {
                    translateY = 30;
                  }
                }
                
                const scaleVal = isMobile ? (targetId !== 'submit-button' && targetId !== 'lineup-header' ? 1 : 0.88) : 1.02;
                element.style.transform = `translate(${shift}px, ${translateY}px) scale(${scaleVal})`;
                element.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.85), 0 0 40px rgba(255,255,255,0.2)';
                
                setZoomedElementId(targetId);
              }, 400); // wait for zoom in
            }, 750); // wait for scroll
          } else {
            setWrapperTransform('none');
            setIsTransitioning(false);
            setTutorialStep(nextStep);
          }
        }, 400); // wait for zoom out
      } else {
        setTutorialStep(nextStep);
      }
    } else {
      localStorage.setItem('hasSeenLineupTutorial', 'true');
      setTutorialStep(0);
      if (isReplayTutorial) {
        router.push('/contests');
        return;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Reset demo lineup
      setLineup([null, null, null, null, null]);
      setCaptain('');
      setConfidence({});
    }
  };

  useEffect(() => {
    if (tutorialStep === 4) {
      // Use Argentina and Germany players so the tutorial feels real and matches the Argentina vs Germany match
      const allWC = WC2026_PLAYERS as unknown as Player[];
      const gk = allWC.find(p => p.id === 'ger-neuer');
      const cb = allWC.find(p => p.id === 'ger-rudiger' || p.id === 'ger-tah');
      const mf = allWC.find(p => p.id === 'arg-paul' || p.id === 'arg-depaul');
      const sw = allWC.find(p => p.id === 'arg-messi');
      const cf = allWC.find(p => p.id === 'arg-alvarez');

      if (gk && cb && mf && sw && cf) {
        setLineup([
          { id: gk.id, name: gk.name, position: gk.position, team: gk.team, teamFlag: gk.teamFlag, rating: gk.rating },
          { id: cb.id, name: cb.name, position: cb.position, team: cb.team, teamFlag: cb.teamFlag, rating: cb.rating },
          { id: mf.id, name: mf.name, position: mf.position, team: mf.team, teamFlag: mf.teamFlag, rating: mf.rating },
          { id: sw.id, name: sw.name, position: sw.position, team: sw.team, teamFlag: sw.teamFlag, rating: sw.rating },
          { id: cf.id, name: cf.name, position: cf.position, team: cf.team, teamFlag: cf.teamFlag, rating: cf.rating },
        ]);
        setCaptain(sw.id); // Messi as captain
        setConfidence({ [gk.id]: 3, [cb.id]: 3, [mf.id]: 4, [sw.id]: 5, [cf.id]: 4 });

        // Seed demo skill cards so the Skill Card section shows equipped cards during tutorial
        const demoCards: OwnedCard[] = [
          { instanceId: 'tutorial-demo-gk',  cardId: 'gk-rare',       obtainedAt: new Date().toISOString() },
          { instanceId: 'tutorial-demo-def', cardId: 'def-rare',      obtainedAt: new Date().toISOString() },
          { instanceId: 'tutorial-demo-mid', cardId: 'mid-rare',      obtainedAt: new Date().toISOString() },
          { instanceId: 'tutorial-demo-swg', cardId: 'win-epic',      obtainedAt: new Date().toISOString() },
          { instanceId: 'tutorial-demo-att', cardId: 'str-legendary', obtainedAt: new Date().toISOString() },
        ];
        demoCards.forEach(c => {
          // Only add if not already present (idempotent for multiple replays)
          const existing = JSON.parse(localStorage.getItem('oddsdraft_card_collection') || '{"cards":[]}');
          if (!existing.cards.find((x: OwnedCard) => x.instanceId === c.instanceId)) {
            addCardToCollection(c);
          }
        });
        setEquippedCards({
          [gk.id]: 'tutorial-demo-gk',
          [cb.id]: 'tutorial-demo-def',
          [mf.id]: 'tutorial-demo-mid',
          [sw.id]: 'tutorial-demo-swg',
          [cf.id]: 'tutorial-demo-att',
        });
      }
    }
  }, [tutorialStep]);

  const tutorialData = getTutorialData(tutorialStep);

  const filledPlayers = lineup.filter((p): p is LineupPlayer => p !== null);
  const totalPlayers = filledPlayers.length;
  const isLineupFull = totalPlayers === MAX_PLAYERS;

  // Get available players for the currently active slot
  const teamName = activeTeam === 'home' ? fixture.homeTeam : fixture.awayTeam;
  const availablePlayers = getPlayers(teamName)
    .filter((p) => {
      // Must match slot filter
      if (activeSlot !== null && p.position !== SLOTS[activeSlot].filter) return false;
      // Exclude already selected
      return !filledPlayers.find((lp) => lp.id === p.id);
    })
    .filter((p) => !playerSearch || p.name.toLowerCase().includes(playerSearch.toLowerCase()));

  // Calculate current fantasy points (demo events)
  const fantasyPoints = isLineupFull && captain
    ? calculateFantasyPoints(
        DEMO_EVENTS.map((e) => ({ playerId: e.playerId, playerName: e.playerName, eventType: e.eventType })),
        {
          players: filledPlayers,
          captainPlayerId: captain,
          confidence,
        }
      )
    : null;

  const addPlayer = (player: Player) => {
    if (activeSlot === null) return;

    const lp: LineupPlayer = {
      id: player.id,
      name: player.name,
      position: player.position,
      team: player.team,
      teamFlag: player.teamFlag,
      rating: player.rating,
    };

    setLineup((prev) => {
      const next = [...prev];
      next[activeSlot] = lp;
      return next;
    });

    // Auto set confidence to 3
    setConfidence((prev) => ({ ...prev, [player.id]: 3 }));
    setPlayerSearch('');
    setActiveSlot(null);
  };

  const removePlayer = (index: number) => {
    const player = lineup[index];
    if (!player) return;

    setLineup((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });

    if (captain === player.id) setCaptain('');
    setConfidence((prev) => {
      const next = { ...prev };
      delete next[player.id];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!isLineupFull || !captain) return;

    const lineupData = { players: filledPlayers, captain, confidence, equippedCards };
    let entryTxSig: string | null = null;

    // ── Save lineup to localStorage immediately ────────────────────────────
    try {
      localStorage.setItem(`txodds_user_lineup_${contestId}_${contestType}`, JSON.stringify(lineupData));
    } catch { /* ignore */ }

    if (!isDemo && publicKey) {
      // Set up payment steps UI
      const STEPS: PayStep[] = [
        { label: 'Checking wallet balance', status: 'pending' },
        { label: 'Fetching latest blockhash', status: 'pending' },
        { label: 'Waiting for wallet approval', status: 'pending' },
        { label: 'Broadcasting transaction', status: 'pending' },
        { label: 'Confirming on-chain', status: 'pending' },
        { label: 'Saving lineup', status: 'pending' },
      ];
      setPaySteps(STEPS);
      setPayError(null);
      setSubmitting(true);

      const fail = (stepIdx: number, msg: string) => {
        setStep(stepIdx, { status: 'error', detail: msg });
        setPayError(msg);
        // Roll back pessimistic localStorage lock so user can retry
        try {
          const list: string[] = JSON.parse(localStorage.getItem(enteredContestsKey) ?? '[]');
          localStorage.setItem(enteredContestsKey, JSON.stringify(list.filter(t => t !== contestType)));
        } catch { /* ignore */ }
        setSubmitting(false);
      };

      // ── Step 0: Balance check ─────────────────────────────────────────
      setStep(0, { status: 'loading' });
      let balanceSol: number | null = null;
      try {
        const lamports = await connection.getBalance(publicKey, 'confirmed');
        balanceSol = lamports / LAMPORTS_PER_SOL;
        setWalletBalance(balanceSol);
      } catch { /* non-blocking */ }

      if (balanceSol !== null && balanceSol < 0.015) {
        setStep(0, { status: 'error', detail: `Insufficient balance: ${balanceSol.toFixed(4)} SOL (need ≥ 0.015)` });
        setPayError(`Insufficient SOL balance. You have ${balanceSol.toFixed(4)} SOL but need at least 0.015 SOL.`);
        setSubmitting(false);
        return;
      }
      setStep(0, { status: 'ok', detail: balanceSol !== null ? `${balanceSol.toFixed(4)} SOL available` : 'Balance check skipped (RPC error)' });

      // Pessimistic lock: mark entered before wallet popup so a refresh doesn't allow re-entry
      try {
        const list: string[] = JSON.parse(localStorage.getItem(enteredContestsKey) ?? '[]');
        if (!list.includes(contestType)) { list.push(contestType); localStorage.setItem(enteredContestsKey, JSON.stringify(list)); }
      } catch { /* ignore */ }

      // ── Steps 1-4: Payment ────────────────────────────────────────────
      if (process.env.NEXT_PUBLIC_SMART_CONTRACT_ENABLED === 'true') {
        // Smart contract path: call join_contest on the Anchor program.
        // Step 1: ensure Contest PDA exists on-chain, then get blockhash.
        setStep(1, { status: 'loading', detail: 'Preparing contest on-chain…' });
        try {
          const prepRes = await fetch(`/api/contest/prepare?fixtureId=${contestId}&contestType=${contestType}`);
          if (!prepRes.ok) {
            const err = await prepRes.json().catch(() => ({ error: 'Prepare failed' }));
            fail(1, err.error || `Prepare contest failed (HTTP ${prepRes.status})`);
            return;
          }
        } catch (e: any) {
          fail(1, `Failed to prepare contest: ${e?.message ?? 'Network error'}`);
          return;
        }

        const MAX_ATTEMPTS = 3;
        let paid = false;
        let lastSig: string | null = null;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          let blockhash = '';
          let lastValidBlockHeight = 0;
          try {
            ({ blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed'));
          } catch (e: any) {
            fail(1, `Failed to fetch blockhash: ${e?.message ?? 'RPC error'}`);
            return;
          }
          setStep(1, { status: 'ok', detail: `${blockhash.slice(0, 8)}…` });

          // Step 2: build join_contest tx and get wallet approval
          setStep(2, { status: 'loading', detail: attempt > 1 ? `Approve in wallet (attempt ${attempt}/${MAX_ATTEMPTS})…` : 'Approve in your wallet…' });
          const joinIx = buildJoinContestIx(contestId, contestType, publicKey);
          const tx = new Transaction().add(joinIx);
          tx.recentBlockhash = blockhash;
          tx.feePayer = publicKey;

          let sig = '';
          try {
            sig = await sendTransaction(tx, connection, {
              skipPreflight: true,
              preflightCommitment: 'confirmed',
              maxRetries: 5,
            });
          } catch (signErr: any) {
            const msg: string = signErr?.message ?? '';
            if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('cancelled') || msg.toLowerCase().includes('denied')) {
              fail(2, 'Transaction rejected in wallet.');
            } else {
              fail(2, msg || 'Wallet signing failed.');
            }
            return;
          }
          lastSig = sig;
          setStep(2, { status: 'ok' });

          // Step 3: broadcast
          setStep(3, { status: 'ok', detail: `${sig.slice(0, 8)}…${sig.slice(-6)}` });

          // Step 4: confirm
          setStep(4, { status: 'loading', detail: 'Waiting for network confirmation…' });
          try {
            await connection.confirmTransaction(
              { signature: sig, blockhash, lastValidBlockHeight },
              'confirmed'
            );
            entryTxSig = sig;
            paid = true;
            setStep(4, { status: 'ok', detail: sig.slice(0, 8) + '…' + sig.slice(-6) });
            break;
          } catch (confErr: any) {
            const errMsg: string = confErr?.message ?? '';
            const isExpiry =
              errMsg.includes('block height exceeded') ||
              errMsg.includes('Blockhash not found') ||
              errMsg.includes('expired');

            if (isExpiry && lastSig) {
              try {
                const statuses = await connection.getSignatureStatuses([lastSig]);
                const st = statuses?.value?.[0];
                if (st?.confirmationStatus === 'confirmed' || st?.confirmationStatus === 'finalized') {
                  entryTxSig = lastSig;
                  paid = true;
                  setStep(4, { status: 'ok', detail: `Confirmed (on-chain verify) ${lastSig.slice(0, 8)}…` });
                  break;
                }
              } catch { /* fall through */ }
            }

            if (isExpiry && attempt < MAX_ATTEMPTS) {
              setStep(4, { status: 'pending', detail: `Blockhash expired — retrying (${attempt}/${MAX_ATTEMPTS})…` });
              lastSig = null;
              continue;
            }

            fail(4, errMsg || 'Transaction confirmation failed.');
            return;
          }
        }

        if (!paid) {
          fail(4, 'Transaction expired after all retry attempts. Please try again.');
          return;
        }
      } else {
        // Legacy path: direct SOL transfer to treasury wallet.
        const treasuryAddr = process.env.NEXT_PUBLIC_TREASURY_WALLET;
        if (treasuryAddr) {
          const treasury = new PublicKey(treasuryAddr);
          const MAX_ATTEMPTS = 3;
          let paid = false;
          let lastSig: string | null = null;

          for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            // Step 1: blockhash
            setStep(1, { status: 'loading', detail: attempt > 1 ? `Attempt ${attempt}/${MAX_ATTEMPTS}` : undefined });
            let blockhash = '';
            let lastValidBlockHeight = 0;
            try {
              ({ blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed'));
            } catch (e: any) {
              fail(1, `Failed to fetch blockhash: ${e?.message ?? 'RPC error'}`);
              return;
            }
            setStep(1, { status: 'ok', detail: `${blockhash.slice(0, 8)}…` });

            // Step 2: wallet approval
            setStep(2, { status: 'loading', detail: 'Approve in your wallet…' });
            const tx = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: treasury,
                lamports: Math.floor(0.1 * LAMPORTS_PER_SOL),
              })
            );
            tx.recentBlockhash = blockhash;
            tx.feePayer = publicKey;

            let sig = '';
            try {
              sig = await sendTransaction(tx, connection, {
                skipPreflight: true,
                preflightCommitment: 'confirmed',
                maxRetries: 5,
              });
            } catch (signErr: any) {
              const msg: string = signErr?.message ?? '';
              if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('cancelled') || msg.toLowerCase().includes('denied')) {
                fail(2, 'Transaction rejected in wallet.');
              } else {
                fail(2, msg || 'Wallet signing failed.');
              }
              return;
            }
            lastSig = sig;
            setStep(2, { status: 'ok' });

            // Step 3: broadcast
            setStep(3, { status: 'ok', detail: `${sig.slice(0, 8)}…${sig.slice(-6)}` });

            // Step 4: confirm
            setStep(4, { status: 'loading', detail: 'Waiting for network confirmation…' });
            try {
              await connection.confirmTransaction(
                { signature: sig, blockhash, lastValidBlockHeight },
                'confirmed'
              );
              entryTxSig = sig;
              paid = true;
              setStep(4, { status: 'ok', detail: sig.slice(0, 8) + '…' + sig.slice(-6) });
              break;
            } catch (confErr: any) {
              const errMsg: string = confErr?.message ?? '';
              const isExpiry =
                errMsg.includes('block height exceeded') ||
                errMsg.includes('Blockhash not found') ||
                errMsg.includes('expired');

              if (isExpiry && lastSig) {
                try {
                  const statuses = await connection.getSignatureStatuses([lastSig]);
                  const st = statuses?.value?.[0];
                  if (st?.confirmationStatus === 'confirmed' || st?.confirmationStatus === 'finalized') {
                    entryTxSig = lastSig;
                    paid = true;
                    setStep(4, { status: 'ok', detail: `Confirmed (on-chain verify) ${lastSig.slice(0, 8)}…` });
                    break;
                  }
                } catch { /* fall through */ }
              }

              if (isExpiry && attempt < MAX_ATTEMPTS) {
                setStep(4, { status: 'pending', detail: `Blockhash expired — retrying (${attempt}/${MAX_ATTEMPTS})…` });
                lastSig = null;
                continue;
              }

              fail(4, errMsg || 'Transaction confirmation failed.');
              return;
            }
          }

          if (!paid) {
            fail(4, 'Transaction expired after all retry attempts. Please try again.');
            return;
          }
        }
      }

      // ── Step 5: Save to Supabase ──────────────────────────────────────
      setStep(5, { status: 'loading' });
      try {
        const res = await fetch('/api/contest/enter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fixtureId: contestId,
            walletAddress: publicKey.toString(),
            contestType,
            lineup: lineupData,
            entryTxSig,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setStep(5, { status: 'ok', detail: 'Lineup saved' });
      } catch (e: any) {
        // Payment already went through — don't block the user, just log
        setStep(5, { status: 'ok', detail: 'Saved locally (server sync will retry)' });
        console.error('[contest/enter] Supabase save failed:', e);
      }

    } else {
      // Demo mode — no payment, just show a brief loading animation
      setPaySteps([{ label: 'Saving demo lineup…', status: 'loading' }]);
      setPayError(null);
      setSubmitting(true);
      await new Promise(r => setTimeout(r, 900));
      setPaySteps([{ label: 'Demo lineup saved', status: 'ok' }]);
    }

    // Ensure localStorage is set
    try {
      const entered: string[] = JSON.parse(localStorage.getItem(enteredContestsKey) ?? '[]');
      if (!entered.includes(contestType)) { entered.push(contestType); localStorage.setItem(enteredContestsKey, JSON.stringify(entered)); }
    } catch { /* ignore */ }

    await new Promise(r => setTimeout(r, 700)); // brief pause so user sees all steps complete
    setSubmitted(true);
    setSubmitting(false);

    setTimeout(() => {
      const demoParam = isDemo ? '&mode=demo' : '';
      router.push(`/live/${contestId}?contestType=${contestType}${demoParam}`);
    }, 1500);
  };

  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    const compute = () => {
      const diff = kickoffTime.getTime() - Date.now();
      if (diff <= 0) { setCountdown('Kickoff!'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(h > 0
        ? `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`
        : `${m}m ${String(s).padStart(2,'0')}s`
      );
    };
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [kickoffTime]);
  const timeToKickoff = formatDistanceToNow(kickoffTime, { addSuffix: true });

  if (submitted) {
    const contestLabel = contestType === '5050' ? 'Double Up (50/50)' : contestType === 'wta' ? 'Winner Takes All' : 'Top 3 Classic';
    return (
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 24, padding: '0 24px', textAlign: 'center' }}>
          {alreadyEntered ? (
            <>
              <div style={{ fontSize: '3rem' }}>✅</div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Already Entered</h1>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
                You have already submitted a lineup for <strong>{contestLabel}</strong> in this match. Head to the live page to track your points, or choose a different prize pool from the contests lobby.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Lineup Submitted!</h1>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
                Your 5-player lineup is locked in for <strong>{contestLabel}</strong>. Watch the live match to see your fantasy points update in real-time!
              </p>
            </>
          )}
          <div className="card" style={{ padding: 24, display: 'flex', gap: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '2rem', color: 'var(--color-primary)' }}>
                {MAX_PLAYERS}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Players</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '2rem', color: 'var(--color-accent)' }}>
                {captain ? filledPlayers.find(p => p.id === captain)?.name.split(' ').pop() : '-'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Captain</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '2rem', color: 'var(--text-primary)' }}>
                0.01
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SOL Paid</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href={`/live/${fixture.fixtureId}?contestType=${contestType}${isDemo ? '&mode=demo' : ''}`} className="btn btn--primary btn--lg">
              🔴 Watch Live
            </Link>
            <Link href="/contests" className="btn btn--secondary btn--lg">
              Back to Contests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Wallet gate — non-demo users must connect wallet before building a lineup
  if (!isDemo && !publicKey) {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
        <Navbar />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 20, padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>🔒</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Connect Wallet to Play</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 380, margin: 0 }}>
            You need a Solana wallet to build a lineup and enter this contest. Entry fee is <strong>0.1 SOL</strong>.
          </p>
          <WalletMultiButton style={{ borderRadius: 8, fontWeight: 700, fontSize: '1rem', padding: '12px 28px' }} />
          {isDevnet && (
            <div style={{ background: 'rgba(255, 170, 0, 0.08)', border: '1px solid rgba(255,170,0,0.35)', borderRadius: 8, padding: '10px 16px', maxWidth: 400, textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', color: '#ffaa00', fontWeight: 700, marginBottom: 4 }}>Devnet Mode — Switch Your Wallet</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                This app runs on <strong>Solana Devnet</strong>. In Phantom, go to <strong>Settings → Developer Settings → Change Network → Devnet</strong> before connecting.
              </div>
            </div>
          )}
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>— or —</div>
          <Link href={`/lineup/${fixture.fixtureId}?mode=demo&contestType=${contestType}`} className="btn btn--secondary">
            Try Demo Mode (no wallet needed)
          </Link>
        </div>
      </div>
    );
  }

  const shouldBlurLineupBg = tutorialStep === 1;
  return (
    <>
    {/* Floating Replay Tutorial button — always visible bottom-right */}
    {tutorialStep === 0 && (
      <button
        onClick={() => {
          localStorage.removeItem('hasSeenLineupTutorial');
          setTutorialStep(1);
        }}
        style={{
          position: 'fixed',
          bottom: 88,
          right: 16,
          zIndex: 9980,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px',
          fontSize: '0.72rem', fontWeight: 700,
          color: '#fbf0b9',
          background: 'rgba(20,16,8,0.92)',
          border: '1px solid rgba(251,240,185,0.35)',
          borderRadius: 20,
          cursor: 'pointer',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
        }}
      >
        ▶ Tutorial
      </button>
    )}
    <div style={{ minHeight: '100vh', paddingBottom: '100px', background: 'transparent', overflowX: 'hidden' }}>
      <Navbar />

      <div style={{
        transform: wrapperTransform,
        transition: wrapperTransform === 'none' ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transformOrigin: transformOrigin,
        willChange: wrapperTransform === 'none' ? 'auto' : 'transform'
      }}>
        <style jsx global>{`
          @keyframes dialog-glow {
            0% { box-shadow: 10px 10px 0px #1a1008; }
            50% { box-shadow: 10px 10px 0px #1a1008, 0 0 25px rgba(251, 240, 185, 0.45); }
            100% { box-shadow: 10px 10px 0px #1a1008; }
          }
          @keyframes blink-text {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
          }
        `}</style>

        {/* Background Blur Overlay */}
        {tutorialStep > 0 && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: shouldBlurLineupBg ? 'blur(8px)' : 'none',
            zIndex: 9990, 
            pointerEvents: 'none',
            opacity: isTransitioning ? 0 : 1,
            transition: 'opacity 0.4s ease',
          }} />
        )}

        {/* Onboarding Tutorial Popup */}
        {tutorialStep > 0 && tutorialData && (
          <div 
            onClick={handleNextTutorialStep}
            className="npc-dialog-overlay"
            style={{
              backgroundColor: 'transparent',
              zIndex: 999999,
              backdropFilter: shouldBlurLineupBg ? 'blur(5px)' : 'none',
              WebkitBackdropFilter: shouldBlurLineupBg ? 'blur(5px)' : 'none',
            }}
          >
            {/* Step 8 Skill Cards Display (Responsive) */}
            {tutorialStep === 8 && (
              <div className="tutorial-step-8-cards" style={{
                position: 'fixed',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1004,
                display: 'flex',
                gap: '15px',
                pointerEvents: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100vw',
                flexWrap: 'wrap',
                padding: '0 20px',
              }}>
                <style>{`
                  .tutorial-step-8-cards { top: 25%; }
                  @media (min-width: 769px) {
                    .tutorial-step-8-cards { top: 38%; }
                  }
                `}</style>
                {DEMO_CARDS.map((card, i) => {
                  const def = SKILL_CARDS.find(c => c.id === card.cardId);
                  return (
                    <div key={card.instanceId} style={{
                      width: 'clamp(100px, 18vw, 230px)',
                      aspectRatio: '1086/1448',
                      transform: 'scale(1)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 30px rgba(255,255,255,0.1)',
                      borderRadius: 16,
                    }}>
                      {def ? <SkillCardDisplay card={def} /> : <div style={{color:'white', padding:'10px', fontSize:'0.7rem'}}>Missing {card.cardId}</div>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* NPC Smooth Desktop Animations */}
            {tutorialData && (
              <style>{`
                @media (min-width: 769px) {
                  .smooth-npc-left {
                    animation: npc-desktop-fade-slide-left 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
                  }
                  .smooth-npc-right {
                    animation: npc-desktop-fade-slide-right 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
                  }
                  @keyframes npc-desktop-fade-slide-left {
                    0% { opacity: 0; transform: translateX(-40px); }
                    100% { opacity: 1; transform: translateX(0); }
                  }
                  @keyframes npc-desktop-fade-slide-right {
                    0% { opacity: 0; transform: translateX(40px); }
                    100% { opacity: 1; transform: translateX(0); }
                  }
                }
              `}</style>
            )}

            {/* NPC Character Image (Female - Left) */}
            {tutorialData?.position === 'left' && (
              <img
                src="/NPC/NPC%20Guide%20Female.svg"
                alt="Guide"
                className="npc-commentator1-img smooth-npc-left"
                style={{
                  bottom: '0',
                  left: tutorialData?.shiftEdge ? '-18%' : '2%',
                  height: '85vh',
                  maxHeight: '700px',
                  zIndex: 10005,
                  transition: 'opacity 0.4s ease-out, transform 0.4s ease-out, left 0.4s ease-out',
                  opacity: 1,
                  transform: 'translateX(0)',
                }}
              />
            )}

            {/* NPC Character Image (Male - Right) */}
            {tutorialData?.position === 'right' && (
              <img
                src="/NPC/NPC%20Guide%20Male.svg"
                alt="Guide"
                className="npc-commentator2-img smooth-npc-right"
                style={{
                  bottom: '0',
                  right: tutorialData?.shiftEdge ? '-18%' : '2%',
                  height: '85vh',
                  maxHeight: '700px',
                  zIndex: 10005,
                  transition: 'opacity 0.4s ease-out, transform 0.4s ease-out, right 0.4s ease-out',
                  opacity: 1,
                  transform: 'translateX(0)',
                }}
              />
            )}

            {/* Dialog Bubble */}
            <div style={{
              position: 'absolute',
              bottom: '12vh',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              zIndex: 1000010,
              pointerEvents: 'none',
            }}>
              <style>{`
                @keyframes dialog-smooth-fade {
                  0% { opacity: 0; transform: translateY(15px) scale(0.98); }
                  100% { opacity: 1; transform: translateY(0) scale(1); }
                }
              `}</style>
              <div 
                className="npc-jrpg-dialog-box"
                style={{
                  pointerEvents: 'auto',
                  animation: 'dialog-smooth-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  margin: '0 auto',
                }}
              >
              <div 
                className="npc-jrpg-speaker-tag"
                style={{
                  alignSelf: 'flex-start',
                }}
              >
                {tutorialData.speakerTitle}
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
              }}>
                <div className="npc-jrpg-dialog-text">
                  {tutorialData.text}
                </div>
              </div>
              
              <div className="npc-jrpg-dialog-footer">
                <div style={{ 
                  color: 'rgba(26,16,8,0.5)', 
                  fontSize: '0.7rem', 
                  fontWeight: 800, 
                  textTransform: 'uppercase',
                  animation: 'blink-text 1.5s infinite',
                  letterSpacing: '0.05em'
                }}>
                  Click anywhere to continue 
                  <span style={{ marginLeft: 8 }}>({tutorialStep}/8)</span>
                </div>
              </div>
              
            </div>
            </div>
          </div>
        )}
        
        <main style={{ padding: '32px 0 80px' }}>
          <div className="container">
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <Link href="/contests" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                ← Back to Contests
              </Link>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div id="lineup-header" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                    <><FlagImage flag={fixture.homeFlag} size={16} /> {fixture.homeTeam} vs {fixture.awayTeam} <FlagImage flag={fixture.awayFlag} size={16} /></>
                  </h1>
                  <span className="badge badge--upcoming" style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                    ⏱ {countdown || timeToKickoff}
                  </span>
                </div>
                {/* SOL balance widget */}
                {!isDemo && publicKey && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 12px',
                    background: walletBalance !== null && walletBalance < 0.015 ? 'rgba(255,170,0,0.08)' : 'rgba(0,232,122,0.06)',
                    border: `1px solid ${walletBalance !== null && walletBalance < 0.015 ? 'rgba(255,170,0,0.3)' : 'rgba(0,232,122,0.2)'}`,
                    borderRadius: 8,
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '1rem' }}>◎</span>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wallet</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: walletBalance !== null && walletBalance < 0.015 ? '#ffaa00' : '#00e87a' }}>
                        {walletBalance !== null ? `${walletBalance.toFixed(3)} SOL` : '...'}
                      </div>
                    </div>
                    {walletBalance !== null && walletBalance < 0.015 && (
                      <span style={{ fontSize: '0.7rem', color: '#ffaa00', fontWeight: 700, marginLeft: 4 }}>
                        Low
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                Pick your 5-a-side lineup (GK, DEF, MID, SWG, FWD) • Select a captain (2× pts) • Set confidence
              </p>

              {/* Live odds strip — only shown when TxODDS returns data */}
              {matchOdds && (matchOdds.home !== null || matchOdds.draw !== null || matchOdds.away !== null) && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 0,
                  marginTop: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  fontSize: '0.78rem',
                }}>
                  <div style={{ padding: '5px 10px', color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                    Live Odds
                  </div>
                  {[
                    { label: fixture.homeTeam.split(' ').pop()!, value: matchOdds.home, color: '#60a5fa' },
                    { label: 'Draw', value: matchOdds.draw, color: 'rgba(255,255,255,0.5)' },
                    { label: fixture.awayTeam.split(' ').pop()!, value: matchOdds.away, color: '#f87171' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '5px 14px',
                      borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    }}>
                      <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</span>
                      <span style={{ fontWeight: 800, color: item.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                        {item.value != null ? item.value.toFixed(2) : '—'}
                      </span>
                    </div>
                  ))}
                  <div style={{ padding: '5px 8px', color: 'rgba(255,255,255,0.18)', fontSize: '0.6rem', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                    TxODDS
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {isLocked && (
                <div className="card" style={{ padding: '24px', textAlign: 'center', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.3)' }}>
                  <h2 style={{ color: '#ff4444', marginBottom: '8px', fontSize: '1.4rem' }}>⚠️ Match is Live (Locked)</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>You cannot build a lineup for a match that has already started. You can only watch the live stats.</p>
                  <Link href={`/live/${fixture.fixtureId}`} className="btn btn--primary" style={{ marginTop: '16px', display: 'inline-block' }}>
                    🔴 Go to Live Tracker
                  </Link>
                </div>
              )}

              {/* TOP: Fantasy Points Preview & Player Cards (Full Width) */}
              <div style={{ opacity: isLocked && tutorialStep === 0 ? 0.5 : 1, pointerEvents: isLocked && tutorialStep === 0 ? 'none' : 'auto' }}>
                {/* Fantasy Points Preview (if lineup filled) */}
                {fantasyPoints && (
                  <div className="card card--primary" style={{ marginBottom: 24, padding: 20 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Demo Fantasy Points Preview
                    </div>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '3rem', color: 'var(--color-primary)', lineHeight: 1 }}>
                          {fantasyPoints.totalPoints}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Points</div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{fantasyPoints.breakdown.base}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Base</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-accent)' }}>+{fantasyPoints.breakdown.captainBonus}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Captain Bonus</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>+{fantasyPoints.breakdown.confidenceBonus.toFixed(1)}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Confidence Bonus</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                      ⚡ Based on demo World Cup match events
                    </div>
                  </div>
                )}

                {/* 5-Player Horizontal Grid (Centered & Enlarged) */}
                <div id="lineup-grid" style={{ 
                  display: 'flex', 
                  gap: 12, 
                  width: '100%',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}>
                  {lineup.map((player, i) => {
                    const slotConfig = SLOTS[i];
                    const isActive = activeSlot === i;
                    const scoreTop  = '16%';
                    const nameTop   = '67%';
                    const nationTop = '77%';
                    const posTop    = '86%';

                    return (
                      <div 
                        key={i}
                        onClick={() => {
                          if (player) {
                            setCaptain(player.id);
                          } else {
                            setActiveSlot(isActive ? null : i);
                          }
                        }}
                        style={{
                          flex: '1 1 0px',
                          maxWidth: 220,
                          aspectRatio: '120/165',
                          backgroundImage: player ? "url('/card/Player%20Card%20(3).svg')" : 'none',
                          backgroundSize: '100% 100%',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          backgroundColor: player ? 'transparent' : (isActive ? 'rgba(123, 162, 199, 0.15)' : 'rgba(255,255,255,0.01)'),
                          border: player 
                            ? 'none'
                            : `${isActive ? '2px solid #ffd700' : '1.5px dashed rgba(255, 255, 255, 0.25)'}`,
                          borderRadius: '0px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 200ms',
                          boxShadow: player 
                            ? (captain === player.id 
                                ? '0px 0px 12px #ffd700' 
                                : '2px 2px 6px rgba(0,0,0,0.4)')
                            : (isActive ? '0px 0px 8px rgba(255, 215, 0, 0.3)' : 'none'),
                        }}
                      >
                        {player ? (
                          <>
                            {/* Player photo — upper zone of card, behind rating/name */}
                            <PlayerAvatar
                              playerId={player.id}
                              name={player.name}
                              team={player.team}
                              variant="fill"
                              style={{ top: '25%', bottom: '38%', left: '8%', right: '8%', zIndex: 1 }}
                            />
                            {/* Score / Rating */}
                            <div style={{
                              position: 'absolute',
                              top: scoreTop,
                              right: '12%',
                              width: '18%',
                              textAlign: 'center',
                              color: player.rating && player.rating >= 90
                                ? '#ca8a04'
                                : (player.rating && player.rating >= 85 ? '#15803d' : '#1e293b'),
                              fontFamily: 'Inter, sans-serif',
                              fontStyle: 'normal',
                              fontSize: 'clamp(0.6rem, 1.5vw, 0.95rem)',
                              fontWeight: 800,
                              lineHeight: 1,
                              zIndex: 2,
                              textShadow: player.rating && player.rating >= 90
                                ? '0px 1px 2px rgba(202, 138, 4, 0.4)'
                                : (player.rating && player.rating >= 85 ? '0px 1px 1px rgba(0, 0, 0, 0.15)' : 'none'),
                            }}>
                              {player.rating ?? '-'}
                            </div>

                            {/* Nama Pemain (Nama) row */}
                            <div style={{
                              position: 'absolute',
                              top: nameTop,
                              left: '43%',
                              width: '52%',
                              textAlign: 'left',
                              color: '#36220f',
                              fontSize: player.name.length > 15
                                ? 'clamp(0.36rem, 0.82vw, 0.46rem)'
                                : (player.name.length > 10
                                  ? 'clamp(0.4rem, 0.92vw, 0.52rem)'
                                  : 'clamp(0.44rem, 1vw, 0.58rem)'),
                              fontWeight: 700,
                              fontFamily: 'Inter, sans-serif',
                              fontStyle: 'normal',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              zIndex: 2,
                            }}>
                              {player.name}
                            </div>

                            {/* Negara (Flag & Name) (国籍) row */}
                            <div style={{
                              position: 'absolute',
                              top: nationTop,
                              left: '43%',
                              width: '52%',
                              textAlign: 'left',
                              color: '#36220f',
                              fontSize: 'clamp(0.38rem, 0.88vw, 0.5rem)',
                              fontWeight: 700,
                              fontFamily: 'Inter, sans-serif',
                              fontStyle: 'normal',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              zIndex: 2,
                            }}>
                              <span>{player.team}</span>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#ffffff',
                                border: '1px solid #36220f',
                                borderRadius: '0px',
                                width: '18px',
                                height: '13px',
                                overflow: 'hidden',
                                boxShadow: '1px 1px 0px #36220f',
                                lineHeight: 1,
                                transform: 'translateY(-1px)',
                              }}>
                                {TEAM_FLAG_CODES[player.team] ? (
                                  <img
                                    src={`https://flagcdn.com/w40/${TEAM_FLAG_CODES[player.team]}.png`}
                                    alt={player.team}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                  />
                                ) : (
                                  <FlagImage flag={player.teamFlag} size={16} />
                                )}
                              </span>
                            </div>

                            {/* Posisi (ポジション) row */}
                            <div style={{
                              position: 'absolute',
                              top: posTop,
                              left: '42%',
                              width: '56%',
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              overflow: 'hidden',
                            }}>
                              <span style={{
                                color: '#36220f',
                                fontSize: 'clamp(0.28rem, 0.62vw, 0.36rem)',
                                fontWeight: 700,
                                fontFamily: 'Inter, sans-serif',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                flexShrink: 1,
                              }}>
                                {getPositionFullName(slotConfig.label)}
                              </span>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: getPositionColor(slotConfig.label),
                                color: '#ffffff',
                                border: '1.5px solid #36220f',
                                borderRadius: '0px',
                                padding: '1px 3px',
                                fontSize: 'clamp(0.3rem, 0.75vw, 0.42rem)',
                                fontWeight: 900,
                                fontFamily: 'Inter, sans-serif',
                                fontStyle: 'normal',
                                textTransform: 'uppercase',
                                boxShadow: '1px 1px 0px #36220f',
                                lineHeight: 1,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}>
                                {getShortLabel(slotConfig.label)}
                              </span>
                            </div>

                            {/* Captain Tag */}
                            {captain === player.id && (
                               <div style={{
                                 position: 'absolute',
                                 top: '-8%',
                                 left: '50%',
                                 transform: 'translateX(-50%)',
                                 background: 'linear-gradient(to bottom, #d32f2f 0%, #8b1e1e 100%)',
                                 border: '2px solid #ffffff',
                                 padding: '2px 6px',
                                 borderRadius: '0px',
                                 fontWeight: 700,
                                 fontFamily: 'Inter, -apple-system, sans-serif',
                                 fontStyle: 'normal',
                                 fontSize: 'clamp(0.55rem, 1.4vw, 0.8rem)',
                                 color: '#fff',
                                 textShadow: '0px 1px 1px rgba(0, 0, 0, 0.5)',
                                 boxShadow: '0 0 0 1px #000000, 1px 2px 4px rgba(0,0,0,0.30)',
                                 zIndex: 10,
                               }}>CAPTAIN</div>
                             )}

                            {/* Close / Remove button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); removePlayer(i); }}
                              style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '0px',
                                background: '#ea6b6b',
                                color: '#ffffff',
                                border: '2px solid #36220f',
                                boxShadow: '1px 1px 0px #36220f',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: '12px',
                                zIndex: 10,
                              }}
                            >×</button>
                          </>
                        ) : (
                          <>
                            <div style={{ opacity: isActive ? 1 : 0.3, fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', color: isActive ? '#ffd700' : 'inherit', fontWeight: 900 }}>+</div>
                            <div style={{ 
                              marginTop: 4, 
                              fontSize: 'clamp(0.75rem, 1.6vw, 0.95rem)', 
                              fontWeight: 800, 
                              fontFamily: 'Bebas Neue, cursive',
                              fontStyle: 'italic',
                              textAlign: 'center',
                            }}>
                              {slotConfig.label}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>


              {/* BOTTOM: Stacked Content below player cards */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                maxWidth: 800,
                margin: '60px auto 0 auto', /* added 60px top margin */
                width: '100%'
              }}>

                {/* ── Skill Card Equipment panel ────────────────────────── */}
                {filledPlayers.length > 0 && (() => {
                  const collectionCards = filledPlayers.map(p => ({
                    player: p,
                    cards: getCardsForLineupPosition(p.position),
                    equippedInstanceId: equippedCards[p.id] ?? null,
                  }));

                  return (
                    <div className="ro-window" id="skill-card-section">
                      <div className="ro-window__header">
                        <span>🎴 Skill Card Equipment</span>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Equip before kickoff — locked at match start</span>
                      </div>
                      <div className="ro-window__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4, lineHeight: 1.5 }}>
                          Equip a Skill Card to each player for bonus points. Cards are applied after the Fantasy Engine calculation.
                          {' '}<a href="/cards" style={{ color: '#ffd700', fontWeight: 700 }}>View My Collection →</a>
                        </div>

                        {collectionCards.map(({ player, cards, equippedInstanceId }) => {
                          const equippedInstance = equippedInstanceId ? cards.find(c => c.instance.instanceId === equippedInstanceId) : null;
                          const equippedCardDef = equippedInstance?.card ?? null;

                          return (
                            <div key={player.id} style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 12px',
                              background: equippedCardDef ? `${RARITY_COLOR[equippedCardDef.rarity]}0d` : 'rgba(255,255,255,0.03)',
                              border: equippedCardDef ? `1px solid ${RARITY_COLOR[equippedCardDef.rarity]}33` : '1px solid rgba(255,255,255,0.06)',
                              borderRadius: 8,
                              flexWrap: 'wrap',
                            }}>
                              <div style={{ flex: 1, minWidth: 80 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{player.name}</div>
                                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{player.position}</div>
                              </div>

                              {equippedCardDef ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 2 }}>
                                  <div style={{
                                    background: `${RARITY_COLOR[equippedCardDef.rarity]}22`,
                                    border: `1px solid ${RARITY_COLOR[equippedCardDef.rarity]}55`,
                                    borderRadius: 6, padding: '4px 10px',
                                    display: 'flex', flexDirection: 'column', gap: 1,
                                  }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: RARITY_COLOR[equippedCardDef.rarity] }}>{equippedCardDef.name}</span>
                                    <span style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.45)' }}>{equippedCardDef.effectText}</span>
                                  </div>
                                  <button
                                    onClick={() => setEquippedCards(prev => { const n = { ...prev }; delete n[player.id]; return n; })}
                                    style={{
                                      padding: '4px 10px', background: 'rgba(244,67,54,0.12)',
                                      border: '1px solid rgba(244,67,54,0.3)', borderRadius: 6,
                                      color: '#ef9a9a', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                                    }}
                                  >✕</button>
                                </div>
                              ) : cards.length > 0 ? (
                                <button
                                  onClick={() => setEquipModalPlayerId(player.id)}
                                  style={{
                                    padding: '6px 14px', background: 'rgba(255,215,0,0.08)',
                                    border: '1px solid rgba(255,215,0,0.25)', borderRadius: 6,
                                    color: '#ffd700', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                  }}
                                >
                                  🎴 Equip Card ({cards.length})
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                                  No cards available — earn one after a match
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Equip-card inline modal */}
                {equipModalPlayerId && (() => {
                  const targetPlayer = filledPlayers.find(p => p.id === equipModalPlayerId);
                  if (!targetPlayer) return null;
                  const availableCards = getCardsForLineupPosition(targetPlayer.position);
                  
                  const groups = new Map<string, { instances: OwnedCard[], card: SkillCard }>();
                  availableCards.forEach(item => {
                    const key = `${item.card.id}-${item.instance.upgradeCredits || 0}`;
                    if (!groups.has(key)) {
                      groups.set(key, { instances: [item.instance], card: item.card });
                    } else {
                      groups.get(key)!.instances.push(item.instance);
                    }
                  });
                  const groupedAvailableCards = Array.from(groups.values());

                  return (
                    <div style={{
                      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
                      backdropFilter: 'blur(6px)', zIndex: 8000,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
                    }}>
                      <div style={{
                        background: '#0f1929', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16, padding: 24, maxWidth: 480, width: '100%', maxHeight: '80vh', overflowY: 'auto',
                      }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                          Equip Card for {targetPlayer.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
                          {targetPlayer.position} cards — select one to equip
                        </div>

                        {groupedAvailableCards.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                            No cards yet. Earn them by playing matches!
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {groupedAvailableCards.map(({ instances, card }) => {
                              const instance = instances[0];
                              const count = instances.length;
                              return (
                                <button
                                  key={instance.instanceId}
                                  onClick={() => {
                                    setEquippedCards(prev => ({ ...prev, [equipModalPlayerId]: instance.instanceId }));
                                    setEquipModalPlayerId(null);
                                  }}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 14px', textAlign: 'left',
                                    background: `${RARITY_COLOR[card.rarity]}0d`,
                                    border: `1px solid ${RARITY_COLOR[card.rarity]}33`,
                                    borderRadius: 8, cursor: 'pointer', width: '100%',
                                    position: 'relative'
                                  }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <div style={{ fontSize: 13, fontWeight: 800, color: RARITY_COLOR[card.rarity] }}>{card.name}</div>
                                      {count > 1 && (
                                        <div style={{
                                          background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 900,
                                          padding: '2px 6px', borderRadius: 4, fontFamily: '"Impact", "Arial Black", sans-serif',
                                          letterSpacing: 0.5, border: '1px solid #000'
                                        }}>
                                          x{count}
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                                      {instance.upgradeCredits && instance.upgradeCredits > 0 
                                        ? getUpgradedEffectText(card, instance.upgradeCredits) 
                                        : card.effectText}
                                    </div>
                                  </div>
                                  <span style={{
                                    fontSize: 10, fontWeight: 700,
                                    color: RARITY_COLOR[card.rarity],
                                    border: `1px solid ${RARITY_COLOR[card.rarity]}55`,
                                    borderRadius: 4, padding: '2px 6px',
                                    textTransform: 'uppercase', letterSpacing: 1,
                                  }}>{card.rarity}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <button
                          onClick={() => setEquipModalPlayerId(null)}
                          style={{
                            marginTop: 16, width: '100%', padding: '10px 0',
                            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 8, color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer',
                          }}
                        >Cancel</button>
                      </div>
                    </div>
                  );
                })()}

                {/* Progress */}
                <div className="ro-window" id="progress-bar">
                  <div className="ro-window__header">
                    <span>Lineup Build Progress</span>
                    <span>{totalPlayers}/{MAX_PLAYERS} Slots</span>
                  </div>
                  <div className="ro-window__body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: '700' }}>
                      <span>LINEUP EXP</span>
                      <span>{((totalPlayers / MAX_PLAYERS) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="ro-bar" style={{ height: 16 }}>
                      <div 
                        className="ro-bar__fill ro-bar__fill--exp" 
                        style={{ width: `${(totalPlayers / MAX_PLAYERS) * 100}%` }} 
                      />
                      <div className="ro-bar__text">EXP: {((totalPlayers / MAX_PLAYERS) * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>

                {/* Confidence Rating Panel */}
                {filledPlayers.length > 0 && (
                  <div className="ro-window" id="confidence-panel">
                    <div className="ro-window__header">
                      <span>Confidence Rating</span>
                      <span>⭐</span>
                    </div>
                    <div className="ro-window__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Tooltip info */}
                      <div style={{
                        padding: '10px 14px',
                        background: 'rgba(255,215,0,0.06)',
                        border: '1px solid rgba(255,215,0,0.2)',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                        color: 'rgba(255,255,255,0.55)',
                        lineHeight: 1.6,
                      }}>
                        <span style={{ color: '#ffd700', fontWeight: 700 }}>⭐ Confidence Multiplier:</span>{' '}
                        Rate your confidence in each player (1–5 stars). The higher the rating, the more points you earn — but also the bigger the penalty if the player underperforms (red card, etc.).
                        <br />
                        <span style={{ color: '#94a3b8' }}>1★ = ×1.0 &nbsp;|&nbsp; 3★ = ×1.2 &nbsp;|&nbsp; 5★ = ×1.5</span>
                      </div>
                      {filledPlayers.map((p) => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FlagImage flag={p.teamFlag} size={16} />
                            <span style={{ fontSize: '0.85rem', fontWeight: p.id === captain ? 700 : 400 }}>
                              {p.name}
                              {p.id === captain && <span style={{ color: '#ffd700', marginLeft: 6, fontSize: '0.75rem', fontWeight: 700 }}>© CAPTAIN</span>}
                            </span>
                          </div>
                          <StarRating
                            value={confidence[p.id] ?? 3}
                            onChange={(stars) => setConfidence((prev) => ({ ...prev, [p.id]: stars }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Player Picker */}
                {!isLineupFull && (
                  <div className="ro-window" id="recruitment-terminal">
                    {activeSlot === null ? (
                      <>
                        <div className="ro-window__header">
                          <span>Recruitment Terminal</span>
                          <span>👥</span>
                        </div>
                        <div className="ro-window__body" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                          <div style={{ fontSize: '2rem', marginBottom: 12 }}>👆</div>
                          Click an empty slot to select a player
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="ro-window__header">
                          <span>Recruiting {SLOTS[activeSlot].label}</span>
                          <span>🔍</span>
                        </div>
                        <div className="ro-window__body">
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                              <button
                                className={`btn btn--sm ${activeTeam === 'home' ? 'btn--primary' : 'btn--ghost'}`}
                                onClick={() => setActiveTeam('home')}
                              >
                                <><FlagImage flag={fixture.homeFlag} size={16} /> {fixture.homeTeam}</>
                              </button>
                              <button
                                className={`btn btn--sm ${activeTeam === 'away' ? 'btn--primary' : 'btn--ghost'}`}
                                onClick={() => setActiveTeam('away')}
                              >
                                <><FlagImage flag={fixture.awayFlag} size={16} /> {fixture.awayTeam}</>
                              </button>
                            </div>
                            <input
                              className="input"
                              placeholder={`Search ${SLOTS[activeSlot].label}...`}
                              value={playerSearch}
                              onChange={(e) => setPlayerSearch(e.target.value)}
                            />
                          </div>

                          {availablePlayers.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#64748b', letterSpacing: '0.08em' }}>SYS_AI</span>
                              <span style={{ fontSize: '0.65rem', color: '#64748b' }}>—</span>
                              <span style={{ fontSize: '0.65rem', color: '#64748b' }}>badges auto-assigned by rating + position</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                            {playersLoading && availablePlayers.length === 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none"/>
                                  <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" fill="none"/>
                                </svg>
                                Loading squad data…
                              </div>
                            )}
                            {!playersLoading && availablePlayers.length === 0 && (
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 16 }}>
                                No players available
                              </p>
                            )}
                            {availablePlayers.map((player) => (
                              <button
                                key={player.id}
                                onClick={() => addPlayer(player)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  padding: '10px 14px',
                                  background: 'rgba(8, 15, 28, 0.94)',
                                  border: '2px solid #ffffff',
                                  borderRadius: '0px',
                                  cursor: 'pointer',
                                  transition: 'all 150ms',
                                  textAlign: 'left',
                                  width: '100%',
                                  color: 'var(--text-primary)',
                                  boxShadow: '0 0 0 2px #000000, inset 0 0 0 1px rgba(255,255,255,0.05)',
                                }}
                                onMouseEnter={(e) => { 
                                  (e.currentTarget as HTMLElement).style.borderColor = '#ffd700';
                                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px #000000, inset 0 0 0 1px rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={(e) => { 
                                  (e.currentTarget as HTMLElement).style.borderColor = '#ffffff';
                                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px #000000, inset 0 0 0 1px rgba(255,255,255,0.05)';
                                }}
                              >
                                <FlagImage flag={player.teamFlag} size={22} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', fontStyle: 'italic', fontFamily: 'Bebas Neue, cursive' }}>{player.name}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{player.team} • {player.position}</span>
                                    {(() => {
                                      const badge = getAIBadge(player, availablePlayers);
                                      if (!badge) return null;
                                      return (
                                        <span style={{
                                          fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.03em',
                                          padding: '1px 5px', borderRadius: 3,
                                          color: badge.color, background: badge.bg,
                                          border: `1px solid ${badge.color}55`,
                                        }}>
                                          {badge.label}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                                <div style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  fontFamily: 'Bebas Neue, cursive',
                                  fontStyle: 'italic',
                                  padding: '2px 6px',
                                  borderRadius: '0px',
                                  border: '2px solid #ffffff',
                                  boxShadow: '0 0 0 1px #000000',
                                  background: player.rating && player.rating >= 88 ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.08)',
                                  color: player.rating && player.rating >= 88 ? '#000000' : 'var(--text-secondary)',
                                }}>
                                  {player.rating}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Captain Hint */}
                {totalPlayers > 0 && !captain && (
                  <div className="card card--gold" style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>👑</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#ffd700', fontWeight: 700, marginBottom: 4 }}>
                        Pick Your Captain!
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,215,0,0.7)', lineHeight: 1.5 }}>
                        Tap a selected player card to make them your Captain. The Captain gets a <strong style={{ color: '#ffd700' }}>2× multiplier</strong> — all points from that player are doubled. Pick the player you trust most to perform!
                      </div>
                    </div>
                  </div>
                )}

                {/* Devnet network reminder */}
                {!isDemo && publicKey && isDevnet && (
                  <div style={{ background: 'rgba(255,170,0,0.06)', border: '1px solid rgba(255,170,0,0.25)', borderRadius: 0, padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#ffaa00', fontWeight: 700, marginBottom: 3 }}>Devnet Mode</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Make sure your Phantom is on <strong>Devnet</strong> (Settings → Developer Settings → Change Network). Mainnet SOL won't work here.
                    </div>
                  </div>
                )}

                {/* Low balance warning */}
                {!isDemo && publicKey && walletBalance !== null && walletBalance < 0.015 && (
                  <div className="card" style={{ padding: 16, background: 'rgba(255, 60, 60, 0.08)', border: '1px solid rgba(255,60,60,0.35)', borderRadius: 0 }}>
                    <div style={{ fontSize: '0.85rem', color: '#ff6b6b', marginBottom: 6, fontWeight: 700 }}>
                      Insufficient SOL — {walletBalance.toFixed(4)} SOL
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      You need at least 0.015 SOL (0.01 entry + network fees). Top up your wallet via Phantom or buy SOL from an exchange.
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div id="submit-button" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  {/* Balance indicator */}
                  {!isDemo && publicKey && walletBalance !== null && walletBalance >= 0.015 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'flex-end' }}>
                      Balance: <span style={{ color: '#4ade80', fontWeight: 700 }}>{walletBalance.toFixed(3)} SOL</span>
                    </div>
                  )}
                  <button
                    className="btn btn--primary btn--lg"
                    onClick={handleSubmit}
                    disabled={!isLineupFull || !captain || submitting || (!isDemo && publicKey !== null && walletBalance !== null && walletBalance < 0.015)}
                    style={{
                      opacity: isLineupFull && captain && (isDemo || walletBalance === null || walletBalance >= 0.015) ? 1 : 0.5,
                      cursor: isLineupFull && captain ? 'pointer' : 'not-allowed',
                      width: '100%',
                      maxWidth: '400px',
                    }}
                  >
                    {submitting ? '⏳ Processing...' : isLineupFull ? (captain ? '🔒 Lock Lineup & Pay 0.1 SOL' : '⭐ Select a Captain First') : `Fill ${MAX_PLAYERS - totalPlayers} More Slots`}
                  </button>
                  {isLineupFull && captain && (
                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Entry fee: 0.1 SOL • {contestType === '5050' ? 'Top 50% Double Up' : contestType === 'wta' ? 'Winner Takes All' : 'Top 3 win prizes'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>

    {/* ── Payment Progress Modal ─────────────────────────────────────────── */}
    {submitting && paySteps.length > 0 && (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{
          background: '#111827', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '28px 32px', width: '100%', maxWidth: 420,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              🔒
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>Locking Lineup</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Do not close or refresh this page</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {paySteps.map((step, i) => {
              const isLoading = step.status === 'loading';
              const isOk = step.status === 'ok';
              const isErr = step.status === 'error';
              const isPending = step.status === 'pending';
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '10px 12px', borderRadius: 10,
                  background: isLoading ? 'rgba(99,102,241,0.08)' : isOk ? 'rgba(74,222,128,0.06)' : isErr ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isLoading ? 'rgba(99,102,241,0.25)' : isOk ? 'rgba(74,222,128,0.2)' : isErr ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  transition: 'all 0.25s',
                }}>
                  <div style={{ width: 20, height: 20, flexShrink: 0, marginTop: 1 }}>
                    {isLoading && (
                      <svg viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite', width: 20, height: 20 }}>
                        <circle cx="12" cy="12" r="10" stroke="rgba(99,102,241,0.3)" strokeWidth="3" fill="none"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" fill="none"/>
                      </svg>
                    )}
                    {isOk && <span style={{ color: '#4ade80', fontSize: 16 }}>✓</span>}
                    {isErr && <span style={{ color: '#f87171', fontSize: 16 }}>✕</span>}
                    {isPending && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>○</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: isLoading || isOk || isErr ? 600 : 400, color: isPending ? 'rgba(255,255,255,0.3)' : isErr ? '#f87171' : isOk ? '#e2e8f0' : '#c7d2fe' }}>
                      {step.label}
                    </div>
                    {step.detail && (
                      <div style={{ fontSize: '0.72rem', color: isErr ? '#fca5a5' : 'rgba(255,255,255,0.45)', marginTop: 2, wordBreak: 'break-all' }}>
                        {step.detail}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {payError && (
            <div style={{ marginTop: 20, padding: '12px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)' }}>
              <div style={{ fontSize: '0.8rem', color: '#fca5a5', fontWeight: 600, marginBottom: 6 }}>Payment failed</div>
              <div style={{ fontSize: '0.75rem', color: '#f87171' }}>{payError}</div>
              <button
                onClick={() => { setPaySteps([]); setPayError(null); setSubmitting(false); }}
                style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)', color: '#fca5a5', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}
              >
                Dismiss &amp; Try Again
              </button>
            </div>
          )}

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )}
    </>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (stars: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className={`star ${star <= (hover || value) ? 'star--filled' : ''}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '1rem' }}
          aria-label={`${star} stars`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function getTutorialData(step: number): { speakerTitle: string, text: string, image: string, position: 'left' | 'right', shiftEdge?: boolean, targetId: string } | null {
  switch (step) {
    case 1:
      return {
        speakerTitle: 'Guide',
        text: `"Welcome to the Lineup Builder! Here you'll draft your 5-a-side team for this match."`,
        image: '/NPC/NPC%20Guide%20Female.svg',
        position: 'left',
        targetId: 'lineup-header',
      };
    case 2:
      return {
        speakerTitle: 'Guide',
        text: `"You need to fill 5 positions: Goalkeeper, Defender, Midfielder, Swinger (wing player LW/RW), and Forward. Each position earns points differently!"`,
        image: '/NPC/NPC%20Guide%20Male.svg',
        position: 'right',
        targetId: 'lineup-grid',
      };
    case 3:
      return {
        speakerTitle: 'Guide',
        text: `"To recruit a player, simply click an empty slot, and the Recruitment Terminal will show you available players."`,
        image: '/NPC/NPC%20Guide%20Female.svg',
        position: 'left',
        targetId: 'recruitment-terminal',
      };
    case 4:
      return {
        speakerTitle: 'Guide',
        text: `"Let me show you! I've automatically recruited a full demo squad for you. Notice how we also assigned a Captain (2x points)."`,
        image: '/NPC/NPC%20Guide%20Male.svg',
        position: 'right',
        targetId: 'lineup-grid',
      };
    case 5:
      return {
        speakerTitle: 'Guide',
        text: `"We also set Confidence ratings (⭐1-5). A 5-star rating gives a huge multiplier, but also amplifies negative points for mistakes like Red Cards!"`,
        image: '/NPC/NPC%20Guide%20Female.svg',
        position: 'left',
        targetId: 'confidence-panel',
      };
    case 6:
      return {
        speakerTitle: 'Guide',
        text: `"Once your squad is ready, lock it in by paying the 0.1 SOL entry fee. Then, head to the Live Match screen to watch your points update! Good luck!"`,

        image: '/NPC/NPC%20Guide%20Male.svg',
        position: 'right',
        targetId: 'submit-button',
      };
    case 7:
      return {
        speakerTitle: 'Guide',
        text: `"Bonus tip! Equip a Skill Card to each player for extra points — I've already equipped demo cards so you can see how it looks. Earn your own cards after every match!"`,
        image: '/NPC/NPC%20Guide%20Female.svg',
        position: 'left',
        targetId: 'skill-card-section',
      };
    case 8:
      return {
        speakerTitle: 'Guide',
        text: `"Visit 'My Cards' (top menu) to manage your full collection. Collect 2 copies of the same card to combine them into a higher rarity for even stronger bonuses. Legendary cards give massive point multipliers! Good luck, manager!"`,
        image: '/NPC/NPC%20Guide%20Male.svg',
        position: 'right',
        targetId: 'lineup-header',
      };
    default:
      return null;
  }
}

