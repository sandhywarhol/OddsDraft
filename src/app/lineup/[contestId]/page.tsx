'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { DEMO_FIXTURES, type Player, type DemoFixture, getPlayersByTeam } from '@/lib/players';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';
import { type LineupPlayer, MAX_PLAYERS } from '@/types';
import { calculateFantasyPoints } from '@/lib/fantasy-engine';
import { getCardsForLineupPosition, getCardById, type OwnedCard } from '@/lib/card-collection';
import { RARITY_COLOR } from '@/lib/skill-cards';
import { formatDistanceToNow } from 'date-fns';
import { useTxLine } from '@/context/TxLineContext';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import PlayerAvatar from '@/components/PlayerAvatar';
import { prefetchPlayerPhotos } from '@/lib/player-photos';
// Demo score events for showing fantasy points in action
const DEMO_EVENTS = [
  { playerId: 'fra-mbappe', playerName: 'Mbappé', eventType: 'goal', minute: 23, points: 10 },
  { playerId: 'arg-messi', playerName: 'Messi', eventType: 'assist', minute: 23, points: 6 },
  { playerId: 'arg-martinez', playerName: 'E. Martínez', eventType: 'goalkeeper_save', minute: 35, points: 1 },
  { playerId: 'fra-griezmann', playerName: 'Griezmann', eventType: 'yellow_card', minute: 41, points: -2 },
  { playerId: 'arg-lautaro', playerName: 'L. Martínez', eventType: 'goal', minute: 57, points: 10 },
  { playerId: 'fra-mbappe', playerName: 'Mbappé', eventType: 'goal', minute: 78, points: 10 },
];

const SLOTS = [
  { label: 'GK', filter: 'GK' },
  { label: 'DEF (CB/LB/RB)', filter: 'DEF' },
  { label: 'MID (CMF/AMF)', filter: 'MID' },
  { label: 'FLEX DEF', filter: 'DEF' },
  { label: 'FWD (CF/SS/RW)', filter: 'ATT' },
];

const getPositionColor = (label: string) => {
  if (label.includes('GK')) return '#1d4ed8'; // Blue
  if (label.includes('DEF (CB')) return '#15803d'; // Green
  if (label.includes('MID')) return '#b45309'; // Amber/Orange
  if (label.includes('FLEX')) return '#6d28d9'; // Purple
  if (label.includes('FWD')) return '#b91c1c'; // Red
  return '#36220f';
};
const getShortLabel = (label: string) => {
  if (label.includes('GK')) return 'GK';
  if (label.includes('DEF (CB')) return 'DEF';
  if (label.includes('MID')) return 'MID';
  if (label.includes('FLEX')) return 'FLEX';
  if (label.includes('FWD')) return 'FWD';
  return label;
};

const getPositionFullName = (label: string) => {
  if (label.includes('GK')) return 'Goalkeeper';
  if (label.includes('FLEX')) return 'Flex';
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
  const { appMode, liveFixtures } = useTxLine();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();

  const isDemo = appMode === 'demo';

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
    : DEMO_FIXTURES.find(f => f.fixtureId === contestId);

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
  const enteredContestsKey = `txodds_entered_contests_${contestId}`;
  const alreadyEntered = typeof window !== 'undefined'
    ? (JSON.parse(localStorage.getItem(enteredContestsKey) ?? '[]') as string[]).includes(contestType)
    : false;
  const [submitted, setSubmitted] = useState(alreadyEntered);
  const [submitting, setSubmitting] = useState(false);
  const [airdropping, setAirdropping] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [equippedCards, setEquippedCards] = useState<Record<string, string>>({});
  const [equipModalPlayerId, setEquipModalPlayerId] = useState<string | null>(null);

  // Fetch wallet SOL balance in live mode
  useEffect(() => {
    if (isDemo || !publicKey) return;
    connection.getBalance(publicKey).then(lamports => {
      setWalletBalance(lamports / LAMPORTS_PER_SOL);
    }).catch(() => {});
  }, [publicKey, isDemo, connection]);

  // Prefetch player photos for both teams when fixture loads
  useEffect(() => {
    if (!fixture) return;
    const { homeTeam, awayTeam } = fixture;
    import('@/lib/players').then(({ getPlayersByTeam }) => {
      const players = [...getPlayersByTeam(homeTeam), ...getPlayersByTeam(awayTeam)];
      prefetchPlayerPhotos(players.map(p => ({ id: p.id, name: p.name })));
    });
  }, [fixture?.homeTeam, fixture?.awayTeam]);

  const handleAirdrop = async () => {
    if (!publicKey) return;
    setAirdropping(true);
    try {
      const sig = await connection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
      const lamports = await connection.getBalance(publicKey);
      setWalletBalance(lamports / LAMPORTS_PER_SOL);
    } catch (e) {
      console.error('[Airdrop] failed:', e);
      alert('Airdrop failed. Try again or visit https://faucet.solana.com');
    } finally {
      setAirdropping(false);
    }
  };

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
    const hasSeenTutorial = localStorage.getItem('hasSeenLineupTutorial');
    if (!hasSeenTutorial) {
      setTutorialStep(1);
    }
  }, []);

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

    if (tutorialStep < 6) {
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
                  const targetCenterX = nextData?.position === 'left' ? viewportWidth * 0.78 : viewportWidth * 0.22;
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
                    translateY = -340;
                  } else if (targetId === 'recruitment-terminal') {
                    translateY = -420;
                  } else if (targetId === 'lineup-grid' && nextStep === 4) {
                    translateY = -300;
                  } else if (targetId === 'lineup-grid' && nextStep === 2) {
                    translateY = -220;
                  } else if (targetId === 'lineup-header') {
                    translateY = -150;
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Reset demo lineup
      setLineup([null, null, null, null, null]);
      setCaptain('');
      setConfidence({});
    }
  };

  useEffect(() => {
    if (tutorialStep === 4) {
      const team = fixture.homeTeam;
      const allPlayers = getPlayersByTeam(team);
      const gk = allPlayers.find(p => p.position === 'GK');
      const cb = allPlayers.find(p => p.position === 'DEF');
      const mf = allPlayers.find(p => p.position === 'MID');
      const sw = allPlayers.filter(p => p.position === 'DEF')[1] || allPlayers.find(p => p.position === 'DEF');
      const cf = allPlayers.find(p => p.position === 'ATT');
      
      if (gk && cb && mf && sw && cf) {
        setLineup([
          { id: gk.id, name: gk.name, position: gk.position, team: gk.team, teamFlag: gk.teamFlag, rating: gk.rating },
          { id: cb.id, name: cb.name, position: cb.position, team: cb.team, teamFlag: cb.teamFlag, rating: cb.rating },
          { id: mf.id, name: mf.name, position: mf.position, team: mf.team, teamFlag: mf.teamFlag, rating: mf.rating },
          { id: sw.id, name: sw.name, position: sw.position, team: sw.team, teamFlag: sw.teamFlag, rating: sw.rating },
          { id: cf.id, name: cf.name, position: cf.position, team: cf.team, teamFlag: cf.teamFlag, rating: cf.rating },
        ]);
        setCaptain(mf.id);
        setConfidence({ [gk.id]: 2, [cb.id]: 3, [mf.id]: 4, [sw.id]: 3, [cf.id]: 5 });
      }
    }
  }, [tutorialStep, fixture]);

  const tutorialData = getTutorialData(tutorialStep);

  const filledPlayers = lineup.filter((p): p is LineupPlayer => p !== null);
  const totalPlayers = filledPlayers.length;
  const isLineupFull = totalPlayers === MAX_PLAYERS;

  // Get available players for the currently active slot
  const teamName = activeTeam === 'home' ? fixture.homeTeam : fixture.awayTeam;
  const availablePlayers = getPlayersByTeam(teamName)
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
    setSubmitting(true);

    const lineupData = { players: filledPlayers, captain, confidence, equippedCards };

    // Save to localStorage for live/replay pages
    try {
      localStorage.setItem(`txodds_user_lineup_${contestId}`, JSON.stringify(lineupData));
    } catch (e) {
      console.error('Failed to save lineup to localStorage', e);
    }

    let entryTxSig: string | null = null;

    if (!isDemo && publicKey) {
      // ── Balance check — use devnet RPC directly to avoid stale wallet state
      let balanceSol: number | null = null;
      try {
        const lamports = await connection.getBalance(publicKey, 'confirmed');
        balanceSol = lamports / LAMPORTS_PER_SOL;
        setWalletBalance(balanceSol);
      } catch {
        // RPC failed — don't gate on balance; let sendTransaction surface the error
      }

      if (balanceSol !== null && balanceSol < 0.015) {
        setSubmitting(false);
        return; // UI already shows the insufficient balance warning
      }

      // ── Solana payment: 0.01 SOL → treasury ────────────────────────────
      const treasuryAddr = process.env.NEXT_PUBLIC_TREASURY_WALLET;
      if (treasuryAddr) {
        const treasury = new PublicKey(treasuryAddr);
        const MAX_ATTEMPTS = 5;
        let paid = false;
        let lastSig: string | null = null;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          try {
            // Fetch a fresh blockhash immediately before each send attempt so it
            // doesn't expire while the wallet popup is open.
            const { blockhash, lastValidBlockHeight } =
              await connection.getLatestBlockhash('confirmed');

            const tx = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: treasury,
                lamports: Math.floor(0.01 * LAMPORTS_PER_SOL),
              })
            );
            tx.recentBlockhash = blockhash;
            tx.feePayer = publicKey;

            const sig = await sendTransaction(tx, connection, {
              skipPreflight: true,
              preflightCommitment: 'confirmed',
              maxRetries: 5,
            });
            lastSig = sig;
            await connection.confirmTransaction(
              { signature: sig, blockhash, lastValidBlockHeight },
              'confirmed'
            );
            entryTxSig = sig;
            paid = true;
            console.log('[Payment] 0.01 SOL sent:', sig);
            break;
          } catch (payErr: any) {
            const errMsg: string = payErr?.message ?? '';
            const isBlockhashExpiry =
              errMsg.includes('block height exceeded') ||
              errMsg.includes('Blockhash not found') ||
              errMsg.includes('expired');

            if (isBlockhashExpiry && lastSig) {
              // confirmTransaction may time out even when tx actually landed —
              // verify on-chain before deciding to retry or fail.
              try {
                const statuses = await connection.getSignatureStatuses([lastSig]);
                const status = statuses?.value?.[0];
                if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
                  entryTxSig = lastSig;
                  paid = true;
                  console.log('[Payment] tx landed despite timeout:', lastSig);
                  break;
                }
              } catch { /* ignore status check failure, fall through to retry */ }
            }

            if (isBlockhashExpiry && attempt < MAX_ATTEMPTS) {
              console.warn(`[Payment] Blockhash expired, retrying (${attempt}/${MAX_ATTEMPTS})…`);
              lastSig = null;
              continue;
            }

            console.error('[Payment] Failed:', payErr);
            const isInsufficientFunds =
              errMsg.includes('no record of a prior credit') ||
              errMsg.includes('insufficient funds') ||
              errMsg.includes('Attempt to debit');
            if (isInsufficientFunds) {
              try {
                const lamports = await connection.getBalance(publicKey, 'confirmed');
                setWalletBalance(lamports / LAMPORTS_PER_SOL);
              } catch { setWalletBalance(0); }
            } else {
              alert(`Payment failed: ${errMsg || 'Unknown error'}. Please try again.`);
            }
            setSubmitting(false);
            return;
          }
        }

        if (!paid) {
          alert('Payment failed: transaction expired after 3 attempts. Please try again.');
          setSubmitting(false);
          return;
        }
      }

      // ── Persist entry to Supabase ───────────────────────────────────────
      try {
        await fetch('/api/contest/enter', {
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
      } catch (e) {
        console.error('Failed to save entry to Supabase', e);
      }
    } else {
      // Demo: simulate tx delay
      await new Promise(r => setTimeout(r, 1000));
    }

    // Mark this contest type as entered so the user can't re-enter the same category
    try {
      const entered: string[] = JSON.parse(localStorage.getItem(enteredContestsKey) ?? '[]');
      if (!entered.includes(contestType)) {
        entered.push(contestType);
        localStorage.setItem(enteredContestsKey, JSON.stringify(entered));
      }
    } catch { /* ignore */ }

    setSubmitted(true);
    setSubmitting(false);

    // Redirect to live page after brief success flash
    setTimeout(() => {
      router.push(`/live/${contestId}?contestType=${contestType}`);
    }, 1800);
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
            <Link href={`/live/${fixture.fixtureId}?contestType=${contestType}`} className="btn btn--primary btn--lg">
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

  const shouldBlurLineupBg = tutorialStep === 1;
  return (
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
            {/* NPC Character Image (Female - Left) */}
            {tutorialData?.position === 'left' && (
              <img
                src="/NPC/NPC Guide Female.svg"
                alt="Guide"
                className="npc-commentator1-img"
                style={{
                  bottom: '-25vh',
                  left: tutorialData?.shiftEdge ? '-18%' : '2%',
                  height: '105vh',
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
                src="/NPC/NPC Guide Male.svg"
                alt="Guide"
                className="npc-commentator2-img"
                style={{
                  bottom: '-25vh',
                  right: tutorialData?.shiftEdge ? '-18%' : '2%',
                  height: '105vh',
                  zIndex: 10005,
                  transition: 'opacity 0.4s ease-out, transform 0.4s ease-out, right 0.4s ease-out',
                  opacity: 1,
                  transform: 'translateX(0)',
                }}
              />
            )}

            {/* Dialog Bubble */}
            <div 
              className="npc-jrpg-dialog-box"
              style={{
                position: 'absolute',
                bottom: '12vh',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000010,
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
                  <span style={{ marginLeft: 8 }}>({tutorialStep}/6)</span>
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
                    {fixture.homeFlag} {fixture.homeTeam} vs {fixture.awayTeam} {fixture.awayFlag}
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
                      <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '0.7rem', color: '#ffaa00', fontWeight: 700, textDecoration: 'underline', marginLeft: 4 }}>
                        Get SOL
                      </a>
                    )}
                  </div>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
                Pick your 5-a-side lineup (GK, DEF, MID, DEF, ATT) • Select a captain (2× pts) • Set confidence
              </p>
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
              <div style={{ opacity: isLocked ? 0.5 : 1, pointerEvents: isLocked ? 'none' : 'auto' }}>
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
                                  <span style={{
                                    display: 'inline-block',
                                    transform: 'scale(1.5)',
                                    transformOrigin: 'center',
                                    lineHeight: 1,
                                  }}>
                                    {player.teamFlag}
                                  </span>
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
                margin: '0 auto',
                width: '100%'
              }}>

                {/* ── Skill Card Equipment panel ────────────────────────── */}
                {filledPlayers.length > 0 && !isLocked && (() => {
                  const collectionCards = filledPlayers.map(p => ({
                    player: p,
                    cards: getCardsForLineupPosition(p.position),
                    equippedInstanceId: equippedCards[p.id] ?? null,
                  }));

                  return (
                    <div className="ro-window">
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

                        {availableCards.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                            No cards yet. Earn them by playing matches!
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {availableCards.map(({ instance, card }) => (
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
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 800, color: RARITY_COLOR[card.rarity] }}>{card.name}</div>
                                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{card.effectText}</div>
                                </div>
                                <span style={{
                                  fontSize: 10, fontWeight: 700,
                                  color: RARITY_COLOR[card.rarity],
                                  border: `1px solid ${RARITY_COLOR[card.rarity]}55`,
                                  borderRadius: 4, padding: '2px 6px',
                                  textTransform: 'uppercase', letterSpacing: 1,
                                }}>{card.rarity}</span>
                              </button>
                            ))}
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
                            <span style={{ fontSize: '0.8rem' }}>{p.teamFlag}</span>
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
                                {fixture.homeFlag} {fixture.homeTeam}
                              </button>
                              <button
                                className={`btn btn--sm ${activeTeam === 'away' ? 'btn--primary' : 'btn--ghost'}`}
                                onClick={() => setActiveTeam('away')}
                              >
                                {fixture.awayFlag} {fixture.awayTeam}
                              </button>
                            </div>
                            <input
                              className="input"
                              placeholder={`Search ${SLOTS[activeSlot].label}...`}
                              value={playerSearch}
                              onChange={(e) => setPlayerSearch(e.target.value)}
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                            {availablePlayers.length === 0 && (
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
                                <span style={{ fontSize: '1.2rem' }}>{player.teamFlag}</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', fontStyle: 'italic', fontFamily: 'Bebas Neue, cursive' }}>{player.name}</div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{player.team} • {player.position}</div>
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

                {/* Devnet balance warning */}
                {!isDemo && publicKey && walletBalance !== null && walletBalance < 0.015 && (
                  <div className="card" style={{ padding: 16, background: 'rgba(255, 60, 60, 0.08)', border: '1px solid rgba(255,60,60,0.35)', borderRadius: 0 }}>
                    <div style={{ fontSize: '0.85rem', color: '#ff6b6b', marginBottom: 10, fontWeight: 700 }}>
                      Insufficient balance: {walletBalance.toFixed(4)} SOL
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                      You need at least 0.015 SOL (0.01 entry fee + network fees).
                    </div>
                    <button
                      className="btn btn--secondary"
                      onClick={handleAirdrop}
                      disabled={airdropping}
                      style={{ width: '100%' }}
                    >
                      {airdropping ? '⏳ Airdropping...' : '⛽ Get 2 Devnet SOL (Free)'}
                    </button>
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
                    {submitting ? '⏳ Processing...' : isLineupFull ? (captain ? '🔒 Lock Lineup & Pay 0.01 SOL' : '⭐ Select a Captain First') : `Fill ${MAX_PLAYERS - totalPlayers} More Slots`}
                  </button>
                  {isLineupFull && captain && (
                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Entry fee: 0.01 SOL • {contestType === '5050' ? 'Top 50% Double Up' : contestType === 'wta' ? 'Winner Takes All' : 'Top 3 win prizes'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
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
        image: '/NPC/NPC Guide Female.svg',
        position: 'left',
        targetId: 'lineup-header',
      };
    case 2:
      return {
        speakerTitle: 'Guide',
        text: `"You need to fill these 5 specific positions: Goalkeeper, 2 Defenders, 1 Midfielder, and 1 Attacker."`,
        image: '/NPC/NPC Guide Male.svg',
        position: 'right',
        targetId: 'lineup-grid',
      };
    case 3:
      return {
        speakerTitle: 'Guide',
        text: `"To recruit a player, simply click an empty slot, and the Recruitment Terminal will show you available players."`,
        image: '/NPC/NPC Guide Female.svg',
        position: 'left',
        targetId: 'recruitment-terminal',
      };
    case 4:
      return {
        speakerTitle: 'Guide',
        text: `"Let me show you! I've automatically recruited a full demo squad for you. Notice how we also assigned a Captain (2x points)."`,
        image: '/NPC/NPC Guide Male.svg',
        position: 'right',
        targetId: 'lineup-grid',
      };
    case 5:
      return {
        speakerTitle: 'Guide',
        text: `"We also set Confidence ratings (⭐1-5). A 5-star rating gives a huge multiplier, but also amplifies negative points for mistakes like Red Cards!"`,
        image: '/NPC/NPC Guide Female.svg',
        position: 'left',
        targetId: 'confidence-panel',
      };
    case 6:
      return {
        speakerTitle: 'Guide',
        text: `"Once your squad is ready, lock it in by paying the 0.01 SOL entry fee. Then, head to the Live Match screen to watch your points update! Good luck!"`,
        image: '/NPC/NPC Guide Male.svg',
        position: 'right',
        targetId: 'submit-button',
      };
    default:
      return null;
  }
}

