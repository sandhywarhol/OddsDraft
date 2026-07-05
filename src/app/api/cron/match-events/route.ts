import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchLiveScoreUpdates, fetchGuestToken } from '@/lib/txline';
import { sendMessage, formatMatchEvent } from '@/lib/telegram-bot';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SIGNIFICANT = new Set(['goal', 'penalty_outcome', 'own_goal', 'red_card', 'penalty_save', 'half_time', 'full_time']);

const ACTION_MAP: Record<string, string> = {
  goal: 'goal', scored: 'goal', penalty_outcome: 'goal', penaltyoutcome: 'goal',
  own_goal: 'own_goal', owngoal: 'own_goal',
  yellowcard: 'yellow_card', yellow_card: 'yellow_card',
  redcard: 'red_card', red_card: 'red_card',
  substitution: 'substitution', sub: 'substitution',
  penalty_save: 'penalty_save', penaltysave: 'penalty_save',
  half_time: 'half_time', halftime: 'half_time',
  full_time: 'full_time', fulltime: 'full_time',
};

// GET /api/cron/match-events?secret=<CRON_SECRET>
// Called by an external cron service (e.g. cron-job.org) every 60 seconds.
// Polls TxLINE for live match events and sends Telegram notifications to subscribers.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiToken = process.env.TXODDS_API_TOKEN ?? '';
  if (!apiToken) return NextResponse.json({ error: 'No API token' }, { status: 500 });

  // Find matches that are currently live (started within last 2.5h, not yet finished)
  const now = Date.now();
  const liveFixtures = WC2026_FIXTURES.filter(f => {
    if (!f.kickoffAt) return false;
    const ko = new Date(f.kickoffAt).getTime();
    return now > ko && now < ko + 2.5 * 3600 * 1000;
  });

  if (liveFixtures.length === 0) {
    return NextResponse.json({ ok: true, message: 'No live matches right now' });
  }

  let guestJwt: string | null = null;
  try { guestJwt = await fetchGuestToken(); } catch { /* continue without guest token */ }

  const results: Record<string, number> = {};

  for (const fixture of liveFixtures) {
    try {
      const raw = await fetchLiveScoreUpdates(apiToken, fixture.fixtureId, guestJwt);
      const allEvents: any[] = Array.isArray((raw as any)?._allEvents) ? (raw as any)._allEvents : [];
      if (allEvents.length === 0) continue;

      // Score from authoritative TxLINE source
      const scoreHome: number = (raw as any)?.Score?.Participant1?.Total?.Goals ?? 0;
      const scoreAway: number = (raw as any)?.Score?.Participant2?.Total?.Goals ?? 0;

      // Filter only significant events we haven't notified about yet
      const candidateEvents = allEvents.filter(ev => {
        const rawType = (ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
        const mapped = ACTION_MAP[rawType] ?? rawType;
        return SIGNIFICANT.has(mapped);
      });

      if (candidateEvents.length === 0) continue;

      // Build event IDs to check against notified_events table
      const eventIds = candidateEvents.map(ev => {
        const rawType = (ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
        const mapped = ACTION_MAP[rawType] ?? rawType;
        const min = parseInt(ev.minute) || 0;
        const player = (ev.player ?? '').replace(/\s+/g, '');
        return `${mapped}-${min}-${player}`;
      });

      const { data: alreadyNotified } = await supabase
        .from('notified_events')
        .select('event_id')
        .eq('fixture_id', fixture.fixtureId)
        .in('event_id', eventIds);

      const notifiedSet = new Set((alreadyNotified ?? []).map((r: { event_id: string }) => r.event_id));
      const newEvents = candidateEvents.filter((ev, i) => !notifiedSet.has(eventIds[i]));

      if (newEvents.length === 0) continue;

      // Fetch subscribers for this match
      const { data: subs } = await supabase
        .from('telegram_subscriptions')
        .select('chat_id')
        .eq('contest_id', fixture.fixtureId);

      if (!subs?.length) {
        // Still mark as notified so we don't reprocess
        await supabase.from('notified_events').upsert(
          newEvents.map((_, i) => ({ fixture_id: fixture.fixtureId, event_id: eventIds[candidateEvents.indexOf(newEvents[i])] }))
        );
        continue;
      }

      // ── Write all new events to live_match_events (for browser fallback) ──
      await supabase.from('live_match_events').upsert(
        newEvents.map((ev, i) => {
          const rawType = (ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
          const eventType = ACTION_MAP[rawType] ?? rawType;
          return {
            fixture_id: fixture.fixtureId,
            event_id: eventIds[candidateEvents.indexOf(newEvents[i])],
            minute: parseInt(ev.minute) || 0,
            event_type: eventType,
            player_name: ev.player ?? '',
            team_name: ev.team ?? '',
            home_score: scoreHome,
            away_score: scoreAway,
          };
        }),
        { onConflict: 'fixture_id,event_id' }
      );

      let sent = 0;
      for (let i = 0; i < newEvents.length; i++) {
        const ev = newEvents[i];
        const rawType = (ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
        const eventType = ACTION_MAP[rawType] ?? rawType;
        const minute = parseInt(ev.minute) || 0;
        const playerName = ev.player ?? '';
        const teamName = ev.team ?? '';

        const text = formatMatchEvent(eventType, playerName, teamName, minute, fixture.homeTeam, fixture.awayTeam, { home: scoreHome, away: scoreAway });

        await Promise.allSettled(subs.map(sub => sendMessage(sub.chat_id, text, { parse_mode: 'Markdown' })));
        sent += subs.length;
      }

      // Mark all new events as notified
      const newEventIds = newEvents.map((_, i) => candidateEvents.indexOf(newEvents[i])).map(i => eventIds[i]);
      await supabase.from('notified_events').upsert(
        newEventIds.map(id => ({ fixture_id: fixture.fixtureId, event_id: id }))
      );

      results[fixture.fixtureId] = sent;
    } catch (err) {
      console.error(`[CronMatchEvents] Error for fixture ${fixture.fixtureId}:`, err);
    }
  }

  return NextResponse.json({ ok: true, liveFixtures: liveFixtures.length, results });
}
