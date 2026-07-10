import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPrizeForRank, calculateEventPoints } from '@/lib/fantasy-engine';
import { matchPlayerName } from '@/lib/txline-bridge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CONFIDENCE_MULT: Record<number, number> = { 1: 1.0, 2: 1.1, 3: 1.2, 4: 1.35, 5: 1.5 };
const SCORING_EVENTS = new Set([
  'goal', 'own_goal', 'red_card', 'yellow_card', 'penalty_save',
  'assist', 'penalty_won', 'penalty_missed', 'goalkeeper_save',
]);

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

    // 1. Fetch all entries for this contest from DB
    const { data: entries, error: entriesErr } = await supabase
      .from('contest_entries')
      .select('wallet_address, lineup')
      .eq('fixture_id', fixtureId)
      .eq('contest_type', contestType);

    if (entriesErr) {
      console.error('[prize/submit] entries fetch:', entriesErr);
      return NextResponse.json({ error: entriesErr.message }, { status: 500 });
    }
    if (!entries?.length) {
      return NextResponse.json({ success: true, inserted: 0, reason: 'no entries' });
    }

    // 2. Fetch scoring events stored by the cron job
    const { data: dbEvents } = await supabase
      .from('live_match_events')
      .select('event_type, player_name, team_name, minute')
      .eq('fixture_id', fixtureId)
      .order('minute', { ascending: true });

    const events = (dbEvents ?? []).filter(e => SCORING_EVENTS.has(e.event_type));

    // 3. Compute points for each entry server-side
    const scored = entries.map(entry => {
      const lineup = entry.lineup;
      if (!lineup?.players?.length) return { walletAddress: entry.wallet_address, points: 0 };

      let total = 0;
      for (const ev of events) {
        const resolvedId = matchPlayerName(ev.player_name ?? '', ev.team_name ?? '');
        let matched = resolvedId
          ? lineup.players.find((p: any) => p.id === resolvedId)
          : null;

        if (!matched && ev.player_name) {
          const parts = (ev.player_name as string).toLowerCase().split(/\s+/).filter((p: string) => p.length >= 3);
          matched = lineup.players.find((p: any) =>
            parts.some((part: string) => (p.name ?? '').toLowerCase().includes(part))
          );
        }
        if (!matched) continue;

        let pts = calculateEventPoints(ev.event_type, matched.position ?? 'ATT');
        if (pts === 0) continue;

        const isCaptain = lineup.captain === matched.id;
        const stars = (lineup.confidence ?? {})[matched.id] ?? 3;
        const mult = CONFIDENCE_MULT[Math.min(stars, 5)] ?? 1.2;
        pts = Math.round(pts * mult * (isCaptain ? 2 : 1) * 10) / 10;
        total += pts;
      }

      return { walletAddress: entry.wallet_address, points: Math.round(total * 10) / 10 };
    });

    // 4. Sort descending, assign ranks (ties share the higher rank)
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
