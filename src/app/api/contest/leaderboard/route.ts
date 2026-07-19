import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SCORING_EVENTS, computeParticipantPoints } from '@/lib/contest-scoring';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';
import { matchPlayerName } from '@/lib/txline-bridge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Build a Set of our internal player IDs who are confirmed starters in the real match.
 * Fetches the TxLINE lineup for the resolved fixture ID, then resolves each player name
 * to an internal ID via matchPlayerName.  Returns null when data is unavailable so the
 * caller can fall back gracefully (give appearance bonus to all lineup players).
 */
async function fetchStarterIds(
  fixtureId: string,
  homeTeam: string,
  awayTeam: string,
): Promise<Set<string> | null> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app';

    // Resolve our contest fixture ID → TxLINE fixture ID
    const remapRes = await fetch(`${appUrl}/api/fixture-remap`, { cache: 'no-store' });
    const remap: Record<string, string> = remapRes.ok ? await remapRes.json() : {};
    const txlineId = remap[fixtureId] ?? fixtureId;

    // Fetch lineup from TxLINE (same proxy the browser uses)
    const lineupRes = await fetch(`${appUrl}/api/txline/api/fixtures/lineups/${txlineId}`, { cache: 'no-store' });
    if (!lineupRes.ok) return null;

    const raw = await lineupRes.json();
    // TxLINE lineup payload varies — flatten all participant player arrays
    const allPlayers: any[] = [];
    const addPlayers = (arr: any[], participant: number) => {
      for (const p of arr) allPlayers.push({ ...p, _participant: participant });
    };
    if (Array.isArray(raw)) {
      for (const item of raw) {
        addPlayers(item?.Data?.Participants?.[0]?.Players ?? item?.Participants?.[0]?.Players ?? [], 1);
        addPlayers(item?.Data?.Participants?.[1]?.Players ?? item?.Participants?.[1]?.Players ?? [], 2);
      }
    } else {
      addPlayers(raw?.Data?.Participants?.[0]?.Players ?? raw?.Participants?.[0]?.Players ?? [], 1);
      addPlayers(raw?.Data?.Participants?.[1]?.Players ?? raw?.Participants?.[1]?.Players ?? [], 2);
    }

    if (allPlayers.length === 0) return null;

    // Only include confirmed starters (Starter === true; skip bench where Starter === false)
    const hasStarterFlags = allPlayers.some(p => p.Starter === true || p.starter === true);
    if (!hasStarterFlags) return null; // flags not yet populated — don't penalise

    const ids: string[] = [];
    for (const p of allPlayers) {
      const isStarter = p.Starter === true || p.starter === true;
      if (!isStarter) continue;
      const rawName: string = p.PlayerName ?? p.playerName ?? '';
      const name = rawName.includes(',')
        ? rawName.split(',').map((s: string) => s.trim()).reverse().join(' ')
        : rawName;
      if (!name) continue;
      const ptcp: number = p.Participant ?? p.participant ?? p._participant ?? 1;
      const team = ptcp === 2 ? awayTeam : homeTeam;
      const id = matchPlayerName(name, team);
      if (id) ids.push(id);
    }

    return ids.length > 0 ? new Set(ids) : null;
  } catch {
    return null; // non-critical — fall back gracefully
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fixtureId = searchParams.get('fixture');
  const contestType = searchParams.get('contestType');

  if (!fixtureId) {
    return NextResponse.json({ error: 'Missing fixture' }, { status: 400 });
  }

  let query = supabase
    .from('contest_entries')
    .select('wallet_address, contest_type, created_at, lineup')
    .eq('fixture_id', fixtureId)
    .order('created_at', { ascending: true });

  if (contestType) {
    query = query.eq('contest_type', contestType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[contest/leaderboard]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Live in-progress points — same scoring source (live_match_events) and scoring
  // function as /api/prize/submit so this preview never silently drifts from payouts.
  const { data: dbEvents } = await supabase
    .from('live_match_events')
    .select('event_type, player_name, team_name, minute, home_score, away_score')
    .eq('fixture_id', fixtureId)
    .order('minute', { ascending: true });
  const allRows = dbEvents ?? [];
  const events = allRows.filter(e => SCORING_EVENTS.has(e.event_type));

  // Fetch real starting XI from TxLINE so bench players are excluded from appearance bonus.
  // Look up home/away team names from the static fixture list.
  const wcFixture = WC2026_FIXTURES.find(f => f.fixtureId === fixtureId);
  const starterIds = wcFixture?.homeTeam && wcFixture?.awayTeam
    ? await fetchStarterIds(fixtureId, wcFixture.homeTeam, wcFixture.awayTeam)
    : null;

  // Team-level match context — same as prize/submit so the live board matches payouts.
  // Score = max seen (survives devnet loop). final = a completion event is present, so
  // the clean-sheet bonus only appears once the match is actually over.
  const matchFinal = allRows.some(r => r.event_type === 'game_finalised' || r.event_type === 'full_time');
  const homeGoals = allRows.reduce((mx, r) => Math.max(mx, r.home_score ?? 0), 0);
  const awayGoals = allRows.reduce((mx, r) => Math.max(mx, r.away_score ?? 0), 0);
  const matchCtx = wcFixture
    ? { homeTeam: wcFixture.homeTeam, awayTeam: wcFixture.awayTeam, homeGoals, awayGoals, started: allRows.length > 0, final: matchFinal }
    : null;

  const participants = (data ?? []).map(entry => ({
    wallet_address: entry.wallet_address,
    contest_type: entry.contest_type,
    created_at: entry.created_at,
    points: computeParticipantPoints(entry.lineup, events, starterIds, matchCtx),
  }));

  // Deterministic order: points DESC, ties broken by entry time (earliest first).
  // Without a stable tie-break the leaderboard visibly reshuffles equal-score rows on
  // every 20s poll — exactly the "leaderboard keeps changing" the users reported.
  participants.sort((a, b) =>
    (b.points - a.points) || String(a.created_at).localeCompare(String(b.created_at))
  );

  return NextResponse.json({ participants }, { headers: { 'Cache-Control': 'no-store' } });
}
