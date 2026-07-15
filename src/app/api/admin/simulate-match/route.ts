/**
 * POST /api/admin/simulate-match
 * Dev-only endpoint: inserts fake match events (full_time + 1-0 result) for a
 * given fixture, then runs the prize/submit logic so contest_results are ready
 * to test the full join_contest → resolve_contest flow without a real match.
 *
 * Protected by CRON_SECRET. Never usable in production (returns 403 when
 * NEXT_PUBLIC_SOLANA_NETWORK !== 'devnet').
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPrizeForRank, calculateEventPoints, resolvePlayerDelta } from '@/lib/fantasy-engine';
import { matchPlayerName } from '@/lib/txline-bridge';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SCORING_EVENTS = new Set([
  'goal', 'own_goal', 'red_card', 'yellow_card', 'penalty_save',
  'assist', 'penalty_won', 'penalty_missed', 'goalkeeper_save',
]);

export async function POST(req: NextRequest) {
  // Only available on devnet
  if (process.env.NEXT_PUBLIC_SOLANA_NETWORK !== 'devnet') {
    return NextResponse.json({ error: 'Only available on devnet' }, { status: 403 });
  }

  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fixtureId, contestType } = await req.json();
  if (!fixtureId || !contestType) {
    return NextResponse.json({ error: 'fixtureId and contestType required' }, { status: 400 });
  }

  // Refuse to simulate on real WC2026 fixtures — only allow test fixtures like special-arg-ger.
  // This prevents stale simulate-match data from polluting real match pages.
  const fixture = WC2026_FIXTURES.find(f => f.fixtureId === fixtureId);
  if (fixture) {
    return NextResponse.json(
      { error: `Cannot simulate a real WC2026 fixture (${fixtureId}). Use a test fixture like "special-arg-ger" instead.` },
      { status: 400 }
    );
  }

  // ── 1. Insert fake match events ──────────────────────────────────────────────
  // home team scores at minute 45, full_time at minute 90 (1-0)
  const fakeEvents = [
    {
      fixture_id: fixtureId,
      event_id: `sim_${fixtureId}_goal`,
      event_type: 'goal',
      player_name: 'Simulated Goal',
      team_name: 'Home',
      minute: 45,
      home_score: 1,
      away_score: 0,
    },
    {
      fixture_id: fixtureId,
      event_id: `sim_${fixtureId}_ft`,
      event_type: 'full_time',
      player_name: null,
      team_name: null,
      minute: 90,
      home_score: 1,
      away_score: 0,
    },
  ];

  // Delete any previous simulated events then re-insert (idempotent)
  await supabase.from('live_match_events').delete().eq('fixture_id', fixtureId);
  const { error: insertErr } = await supabase.from('live_match_events').insert(fakeEvents);
  if (insertErr) {
    return NextResponse.json({ error: `Event insert failed: ${insertErr.message}` }, { status: 500 });
  }

  // ── 2. Fetch contest entries ─────────────────────────────────────────────────
  const { data: entries, error: entriesErr } = await supabase
    .from('contest_entries')
    .select('wallet_address, lineup')
    .eq('fixture_id', fixtureId)
    .eq('contest_type', contestType);

  if (entriesErr) {
    return NextResponse.json({ error: entriesErr.message }, { status: 500 });
  }
  if (!entries?.length) {
    return NextResponse.json({ success: true, message: 'Events inserted, but no entries found for this contest yet.' });
  }

  // ── 3. Compute points (reuses prize/submit logic) ────────────────────────────
  const dbEvents = fakeEvents.filter(e => SCORING_EVENTS.has(e.event_type));

  const scored = entries.map(entry => {
    const lineup = entry.lineup;
    if (!lineup?.players?.length) return { walletAddress: entry.wallet_address, points: 0 };

    let total = 0;
    for (const ev of dbEvents) {
      const resolvedId = matchPlayerName(ev.player_name ?? '', ev.team_name ?? '');
      let matched = resolvedId
        ? lineup.players.find((p: any) => p.id === resolvedId)
        : null;

      if (!matched && ev.player_name) {
        const parts = ev.player_name.toLowerCase().split(/\s+/).filter((p: string) => p.length >= 3);
        matched = lineup.players.find((p: any) =>
          parts.some((part: string) => (p.name ?? '').toLowerCase().includes(part))
        );
      }
      if (!matched) continue;

      const basePts = calculateEventPoints(ev.event_type, matched.position ?? 'ATT');
      if (basePts === 0) continue;

      const isCaptain = lineup.captain === matched.id;
      const stars = (lineup.confidence ?? {})[matched.id] ?? 3;
      total += resolvePlayerDelta(basePts, { isCaptain, confidenceStars: stars });
    }

    return { walletAddress: entry.wallet_address, points: Math.round(total * 100) / 100 };
  });

  scored.sort((a, b) => b.points - a.points);
  const participantCount = scored.length;

  const rows = scored.map((e, i) => ({
    fixture_id: fixtureId,
    contest_type: contestType,
    wallet_address: e.walletAddress,
    rank: i + 1,
    points: e.points,
    prize_sol: getPrizeForRank(i + 1, contestType, participantCount),
  }));

  // ── 4. Upsert results ────────────────────────────────────────────────────────
  const { error: resultsErr } = await supabase
    .from('contest_results')
    .upsert(rows, { onConflict: 'fixture_id,contest_type,wallet_address', ignoreDuplicates: false });

  if (resultsErr) {
    return NextResponse.json({ error: resultsErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Match simulated: 1-0 full time. ${rows.length} participant(s) ranked.`,
    results: rows,
  });
}
