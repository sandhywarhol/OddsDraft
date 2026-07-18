import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mergeEvents } from '@/lib/txline';
import { matchPlayerName, buildPlayerIdMap } from '@/lib/txline-bridge';
import { WC2026_PLAYERS } from '@/lib/wc2026-players-static';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ACTION_MAP: Record<string, string> = {
  goal: 'goal', scored: 'goal',
  penalty_outcome: 'goal', penaltyoutcome: 'goal',
  penalty_goal: 'goal', penaltygoal: 'goal', goal_penalty: 'goal',
  penalty_scored: 'goal', penaltyscored: 'goal',
  own_goal: 'own_goal', owngoal: 'own_goal',
  yellowcard: 'yellow_card', yellow_card: 'yellow_card',
  redcard: 'red_card', red_card: 'red_card',
  substitution: 'substitution', sub: 'substitution',
  penalty_save: 'penalty_save', penaltysave: 'penalty_save',
  half_time: 'half_time', halftime: 'half_time', halftime_finalised: 'half_time',
  full_time: 'full_time', fulltime: 'full_time',
  game_finalised: 'game_finalised',
  kick_off: 'kick_off', kickoff: 'kick_off', secondhalf: 'kick_off',
  corner: 'corner_kick', corner_kick: 'corner_kick',
  var: 'var_review', var_review: 'var_review',
  penalty: 'penalty_won', penaltymiss: 'penalty_missed', penalty_miss: 'penalty_missed',
  shot: 'shot',
  high_danger_possession: 'danger_attack', danger_possession: 'danger_attack',
};

// Scoring event types that should be stored for leaderboard scoring
const SCORING_EVENTS = new Set([
  'goal', 'own_goal', 'red_card', 'yellow_card', 'penalty_save',
  'penalty_won', 'penalty_missed', 'goalkeeper_save',
  'corner_kick', 'substitution', 'shot', 'danger_attack',
  'half_time', 'full_time', 'game_finalised', 'kick_off',
]);

/**
 * POST /api/admin/backfill-events
 * Body: { fixtureId: string, txlineFixtureId?: string, homeTeam: string, awayTeam: string }
 * Header: x-admin-secret: <CRON_SECRET>
 *
 * Reads the TxLINE snapshot for the given fixture, then upserts all scoring events
 * into live_match_events — recovering records that were missed because no Telegram
 * subscriber was present when the cron ran.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { fixtureId, txlineFixtureId, homeTeam, awayTeam } = body as {
    fixtureId: string;
    txlineFixtureId?: string;
    homeTeam: string;
    awayTeam: string;
  };

  if (!fixtureId || !homeTeam || !awayTeam) {
    return NextResponse.json({ error: 'fixtureId, homeTeam, awayTeam are required' }, { status: 400 });
  }

  const resolvedTxId = txlineFixtureId ?? fixtureId;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app';

  // Fetch snapshot from TxLINE (via server proxy)
  const snapRes = await fetch(`${appUrl}/api/txline/api/scores/snapshot/${resolvedTxId}`, { cache: 'no-store' });
  // Also try updates endpoint as fallback
  const updRes = await fetch(`${appUrl}/api/txline/api/scores/updates/${resolvedTxId}`, { cache: 'no-store' });

  const snapArr = snapRes.ok ? await snapRes.json() : [];
  const updArr = updRes.ok ? await updRes.json() : [];

  const combined = [...(Array.isArray(snapArr) ? snapArr : []), ...(Array.isArray(updArr) ? updArr : [])];
  if (combined.length === 0) {
    return NextResponse.json({ error: 'No data from TxLINE for this fixture ID', txlineFixtureId: resolvedTxId }, { status: 404 });
  }

  const raw = mergeEvents(combined);
  const allEvents: any[] = Array.isArray((raw as any)?._allEvents) ? (raw as any)._allEvents : [];

  if (allEvents.length === 0) {
    return NextResponse.json({ ok: true, message: 'No events in snapshot', upserted: 0 });
  }

  // Build player ID map
  const apiToken = process.env.TXODDS_API_TOKEN ?? process.env.NEXT_PUBLIC_TXODDS_API_TOKEN ?? '';
  const playerIdMap: Record<string, string> = apiToken
    ? await buildPlayerIdMap(apiToken, resolvedTxId, homeTeam, awayTeam)
    : {};

  // Score from snapshot
  const scoreHome: number = (raw as any)?.Score?.Participant1?.Total?.Goals ?? 0;
  const scoreAway: number = (raw as any)?.Score?.Participant2?.Total?.Goals ?? 0;

  // Filter confirmed scoring events, deduplicate by content key (keep last/richest)
  const confirmedEvents = allEvents.filter(ev => ev.Confirmed !== false);
  const contentMap = new Map<string, any>();
  for (const ev of confirmedEvents) {
    const rawType = (ev.Action ?? ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
    const mapped = ACTION_MAP[rawType] ?? rawType;
    if (!SCORING_EVENTS.has(mapped)) continue;
    const min = ev.Clock?.Seconds ? Math.floor(ev.Clock.Seconds / 60) : parseInt(ev.minute) || 0;
    const d = ev.Data?.New ?? ev.Data ?? {};
    const participant: number = (typeof d === 'object' ? (d as any).Participant : null) ?? ev.Participant ?? 0;
    const contentKey = `${mapped}-${min}-${participant}`;
    contentMap.set(contentKey, ev); // keep last (richest) version
  }

  if (contentMap.size === 0) {
    return NextResponse.json({ ok: true, message: 'No scoring events to backfill', upserted: 0 });
  }

  // Build upsert rows
  const rows = Array.from(contentMap.entries()).map(([contentKey, ev]) => {
    const rawType = (ev.Action ?? ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
    const eventType = ACTION_MAP[rawType] ?? rawType;
    const minSec = ev.Clock?.Seconds ? Math.floor(ev.Clock.Seconds / 60) : parseInt(ev.minute) || 0;
    const d = ev.Data?.New ?? ev.Data ?? {};
    const rawPName = d.PlayerName ?? ev.Player ?? ev.player ?? '';
    const participant: number = d.Participant ?? ev.Participant ?? 1;
    const tName = participant === 2 ? awayTeam : homeTeam;
    const txPId = String(d.PlayerId ?? d.Player1Id ?? '');
    const rId = rawPName
      ? matchPlayerName(rawPName, tName)
      : (txPId ? playerIdMap[txPId] : null);
    const rPlayer = rId ? WC2026_PLAYERS.find(p => p.id === rId) : null;
    return {
      fixture_id: fixtureId,
      event_id: contentKey,
      minute: minSec,
      event_type: eventType,
      player_name: rPlayer?.name ?? rawPName,
      team_name: tName,
      home_score: scoreHome,
      away_score: scoreAway,
    };
  });

  const { error: upsertErr } = await supabase
    .from('live_match_events')
    .upsert(rows, { onConflict: 'fixture_id,event_id' });

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  console.log(`[BackfillEvents] Upserted ${rows.length} events for fixture ${fixtureId}`);
  return NextResponse.json({
    ok: true,
    upserted: rows.length,
    fixtureId,
    txlineFixtureId: resolvedTxId,
    scoreHome,
    scoreAway,
    events: rows.map(r => ({ event_id: r.event_id, event_type: r.event_type, player_name: r.player_name, minute: r.minute })),
  });
}
