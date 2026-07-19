import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SCORING_EVENTS, computeParticipantPoints } from '@/lib/contest-scoring';
import { getPrizeForRank } from '@/lib/fantasy-engine';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CONTEST_TYPES = ['top3', '5050', 'wta'] as const;

// GET /api/admin/contest-diagnostic?fixtureId=18230001&secret=<CRON_SECRET>
//
// The "match recording vs wallet entries" audit tool. Returns everything needed to
// see WHERE a contest went wrong for a given fixture:
//   - the stored match recording (live_match_events), ordered by minute
//   - anomalies detected in that recording (duplicate goals, score regressions —
//     the fingerprints of a TxLINE devnet loop corrupting the feed)
//   - every wallet's lineup + the fantasy points it scores against that recording
//   - the prizes each wallet would win, per contest type
//   - the prizes actually stored in contest_results (so we can spot drift)
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') ?? req.headers.get('x-admin-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const fixtureId = req.nextUrl.searchParams.get('fixtureId');
  if (!fixtureId) {
    return NextResponse.json({ error: 'fixtureId required' }, { status: 400 });
  }

  const wcFixture = WC2026_FIXTURES.find(f => f.fixtureId === fixtureId);

  // 1. The match recording — all stored events, ordered chronologically.
  const { data: allEventRows } = await supabase
    .from('live_match_events')
    .select('event_type, player_name, team_name, minute, home_score, away_score')
    .eq('fixture_id', fixtureId)
    .order('minute', { ascending: true });
  const eventRows = allEventRows ?? [];
  const scoringEvents = eventRows.filter(e => SCORING_EVENTS.has(e.event_type));

  // 2. Anomaly detection — the fingerprints of a devnet loop corrupting the feed.
  const anomalies: string[] = [];

  //   a) Score regression across in-play events. Terminal/flow events (kick_off,
  //      half_time, full_time, game_finalised) are excluded: they can carry the final
  //      score but are stored at minute 0/90 out of chronological order, which would
  //      otherwise flood this with false positives. We count how many in-play events
  //      show a lower running score than an earlier one — the devnet loop fingerprint.
  const FLOW_EVENTS = new Set(['kick_off', 'half_time', 'full_time', 'game_finalised', 'extra_time']);
  let prevTotal = -1;
  let regressionCount = 0;
  let maxSeenTotal = 0;
  for (const e of eventRows) {
    if (FLOW_EVENTS.has(e.event_type)) continue;
    const total = (e.home_score ?? 0) + (e.away_score ?? 0);
    if (prevTotal >= 0 && total < prevTotal) regressionCount++;
    maxSeenTotal = Math.max(maxSeenTotal, total);
    prevTotal = total;
  }
  if (regressionCount > 0) {
    anomalies.push(`${regressionCount} in-play score regressions detected (peak ${maxSeenTotal} goals) — classic TxLINE devnet loop signature. The per-event score fields are unreliable, but the stored FINAL score below is what scoring uses.`);
  }

  //   b) Duplicate goals: same scorer + team appearing more times than the final
  //      score allows suggests the loop re-recorded goals at shifted minutes.
  const goalRows = scoringEvents.filter(e => e.event_type === 'goal');
  const goalByPlayer = new Map<string, number>();
  for (const g of goalRows) {
    const key = `${g.player_name ?? '?'} (${g.team_name ?? '?'})`;
    goalByPlayer.set(key, (goalByPlayer.get(key) ?? 0) + 1);
  }
  for (const [key, count] of goalByPlayer) {
    if (count >= 3) anomalies.push(`${key} recorded ${count} goals — verify this isn't a loop duplicate.`);
  }

  //   c) Completion signals present?
  const hasFullTime = eventRows.some(e => e.event_type === 'full_time');
  const hasGameFinalised = eventRows.some(e => e.event_type === 'game_finalised');
  if (!hasFullTime && !hasGameFinalised) {
    anomalies.push('No full_time or game_finalised recorded — match may not be frozen; scores can still change.');
  }

  //   d) Final score as stored (last event carrying a score).
  const lastScored = [...eventRows].reverse().find(e => e.home_score !== undefined && e.home_score !== null);
  const storedFinalScore = lastScored
    ? { home: lastScored.home_score, away: lastScored.away_score }
    : null;

  // 3. Every wallet's entry, scored against the recording.
  const { data: entries } = await supabase
    .from('contest_entries')
    .select('wallet_address, contest_type, lineup, entry_tx_sig, created_at')
    .eq('fixture_id', fixtureId)
    .order('created_at', { ascending: true });

  // 4. Prizes actually stored (what would be paid out).
  const { data: results } = await supabase
    .from('contest_results')
    .select('wallet_address, contest_type, rank, points, prize_sol')
    .eq('fixture_id', fixtureId);
  const storedResult = new Map(
    (results ?? []).map(r => [`${r.contest_type}:${r.wallet_address}`, r])
  );

  // Group entries by contest type and compute the leaderboard the SAME way
  // /api/prize/submit does — so any mismatch with contest_results is real drift.
  const byType: Record<string, any> = {};
  for (const ct of CONTEST_TYPES) {
    const ctEntries = (entries ?? []).filter(e => e.contest_type === ct);
    if (ctEntries.length === 0) continue;

    const scored = ctEntries.map(e => ({
      wallet: e.wallet_address,
      shortWallet: `${e.wallet_address.slice(0, 4)}…${e.wallet_address.slice(-4)}`,
      paid: !!e.entry_tx_sig,
      liveComputedPoints: computeParticipantPoints(e.lineup, scoringEvents),
      captain: e.lineup?.captain ?? null,
      playerCount: e.lineup?.players?.length ?? 0,
    }));
    scored.sort((a, b) => b.liveComputedPoints - a.liveComputedPoints);

    const rows = scored.map((s, i) => {
      const stored = storedResult.get(`${ct}:${s.wallet}`);
      const computedPrize = getPrizeForRank(i + 1, ct, scored.length);
      return {
        ...s,
        computedRank: i + 1,
        computedPrizeSol: computedPrize,
        storedRank: stored?.rank ?? null,
        storedPoints: stored?.points ?? null,
        storedPrizeSol: stored?.prize_sol ?? null,
        drift: stored
          ? (stored.rank !== i + 1 || Math.abs((stored.points ?? 0) - s.liveComputedPoints) > 0.01
              ? 'MISMATCH — stored result differs from recomputation'
              : 'ok')
          : 'no stored result yet',
      };
    });
    byType[ct] = { participants: rows.length, leaderboard: rows };
  }

  return NextResponse.json({
    fixtureId,
    teams: wcFixture ? `${wcFixture.homeTeam} vs ${wcFixture.awayTeam}` : 'unknown (fixture not in static list)',
    stage: wcFixture?.stage ?? 'unknown',
    recording: {
      totalEvents: eventRows.length,
      scoringEvents: scoringEvents.length,
      storedFinalScore,
      hasFullTime,
      hasGameFinalised,
      events: eventRows.map(e => ({
        minute: e.minute,
        type: e.event_type,
        player: e.player_name,
        team: e.team_name,
        score: `${e.home_score ?? '?'}-${e.away_score ?? '?'}`,
      })),
    },
    anomalies: anomalies.length ? anomalies : ['None detected — recording looks clean.'],
    contests: byType,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
