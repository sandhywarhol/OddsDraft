import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computePrizesWithTies } from '@/lib/fantasy-engine';
import { SCORING_EVENTS, computeParticipantPoints } from '@/lib/contest-scoring';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/prize/submit
// Triggered by the live page at full time. The server re-derives the
// leaderboard from contest_entries + live_match_events in the DB — no
// client-supplied scores are trusted.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fixtureId, contestType } = body as { fixtureId: string; contestType: string };

    if (!fixtureId || !contestType) {
      return NextResponse.json({ error: 'fixtureId and contestType required' }, { status: 400 });
    }

    // 1. Fetch all entries for this contest from DB.
    // created_at is the deterministic tie-breaker (earliest entry ranks higher),
    // so re-running this endpoint always produces the same ordering.
    const { data: entries, error: entriesErr } = await supabase
      .from('contest_entries')
      .select('wallet_address, lineup, created_at')
      .eq('fixture_id', fixtureId)
      .eq('contest_type', contestType);

    if (entriesErr) {
      console.error('[prize/submit] entries fetch:', entriesErr);
      return NextResponse.json({ error: entriesErr.message }, { status: 500 });
    }
    if (!entries?.length) {
      return NextResponse.json({ success: true, inserted: 0, reason: 'no entries' });
    }

    // 2. Fetch scoring events stored by the cron job (incl. score fields for the
    //    authoritative final score used by the team-level conceding/clean-sheet math).
    const { data: dbEvents } = await supabase
      .from('live_match_events')
      .select('event_type, player_name, team_name, minute, home_score, away_score')
      .eq('fixture_id', fixtureId)
      .order('minute', { ascending: true });

    const allRows = dbEvents ?? [];
    const events = allRows.filter(e => SCORING_EVENTS.has(e.event_type));

    // Build the team-level match context. Final score = the MAX score seen across all
    // rows: real scores only ever climb, so max survives the devnet loop that pushes
    // lower replayed scores into the feed. This endpoint only runs at match end, so
    // final = true (clean-sheet bonus eligible).
    const wcFixture = WC2026_FIXTURES.find(f => f.fixtureId === fixtureId);
    const homeGoals = allRows.reduce((mx, r) => Math.max(mx, r.home_score ?? 0), 0);
    const awayGoals = allRows.reduce((mx, r) => Math.max(mx, r.away_score ?? 0), 0);
    const matchCtx = wcFixture
      ? { homeTeam: wcFixture.homeTeam, awayTeam: wcFixture.awayTeam, homeGoals, awayGoals, started: true, final: true }
      : null;

    // 3. Compute points for each entry server-side
    const scored = entries.map(entry => ({
      walletAddress: entry.wallet_address,
      points: computeParticipantPoints(entry.lineup, events, null, matchCtx),
      createdAt: entry.created_at ?? '',
    }));

    // 4. Sort by points DESC, breaking ties deterministically by entry time (earliest
    //    first). Deterministic ordering means re-running this never reshuffles a tie.
    scored.sort((a, b) => (b.points - a.points) || String(a.createdAt).localeCompare(String(b.createdAt)));
    const participantCount = scored.length;

    // 5. Prizes with split-pot tie handling: players on equal points share the pooled
    //    prize for the ranks they occupy, so nobody wins/loses a tie by sort order alone.
    const prizeByIndex = computePrizesWithTies(scored.map(s => s.points), contestType, participantCount);

    // Display rank: tied players share the SAME rank number (the position of the first
    // member of their tie group), so the leaderboard never implies an order between
    // equal scores.
    const rankByIndex: number[] = [];
    for (let i = 0; i < scored.length; i++) {
      rankByIndex[i] = (i > 0 && scored[i - 1].points === scored[i].points)
        ? rankByIndex[i - 1]
        : i + 1;
    }

    const rows = scored.map((e, i) => ({
      fixture_id: fixtureId,
      contest_type: contestType,
      wallet_address: e.walletAddress,
      rank: rankByIndex[i],
      points: e.points,
      prize_sol: prizeByIndex[i],
    }));

    // 5. Upsert — allow updates if called again (more events may have arrived)
    const { error } = await supabase
      .from('contest_results')
      .upsert(rows, { onConflict: 'fixture_id,contest_type,wallet_address', ignoreDuplicates: false });

    if (error) {
      console.error('[prize/submit]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, inserted: rows.length, participants: participantCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
