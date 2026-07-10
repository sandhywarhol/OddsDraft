import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMessage, formatMatchStats, MatchStatsPayload } from '@/lib/telegram-bot';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface StatsRequest extends MatchStatsPayload {
  contestId: string;
}

// POST /api/telegram/stats
// Sends half-time or full-time statistics to all Telegram subscribers of a contest.
// Idempotent: uses notified_events to ensure each stats type is sent at most once per fixture,
// even if multiple browser tabs or concurrent requests call this endpoint simultaneously.
export async function POST(req: NextRequest) {
  try {
    const body: StatsRequest = await req.json();
    const { contestId, ...statsPayload } = body;

    if (!contestId) {
      return NextResponse.json({ error: 'contestId required' }, { status: 400 });
    }

    // Dedup key: "stats-half_time" or "stats-full_time"
    const dedupId = `stats-${(statsPayload.label ?? '').toLowerCase().replace(/\s+/g, '_')}`;

    // INSERT ... ON CONFLICT DO NOTHING — first caller wins, all others get a unique violation.
    const { error: dedupErr } = await supabase
      .from('notified_events')
      .insert({ fixture_id: contestId, event_id: dedupId });

    if (dedupErr) {
      if (dedupErr.code === '23505') {
        // Already sent by another tab or an earlier page load
        return NextResponse.json({ ok: true, sent: 0, reason: 'already_sent' });
      }
      // Other DB error — log but don't block (better to send twice than not at all)
      console.error('[TelegramStats] dedup insert error:', dedupErr);
    }

    // Compute stats from live_match_events (authoritative — written by cron from confirmed TxLINE events).
    // The client's in-memory events array may be empty or incomplete (e.g. user just opened the page),
    // so we never trust the client-sent stats object.
    const { data: matchEvents } = await supabase
      .from('live_match_events')
      .select('event_type, team_name, home_score, away_score')
      .eq('fixture_id', contestId);

    const count = (type: string, team: string) =>
      (matchEvents ?? []).filter(e => e.event_type === type && e.team_name === team).length;

    // Derive final score from the latest home_score / away_score written by cron
    const latestRow = (matchEvents ?? []).slice(-1)[0];
    const dbScore = {
      home: latestRow?.home_score ?? statsPayload.score?.home ?? 0,
      away: latestRow?.away_score ?? statsPayload.score?.away ?? 0,
    };

    const serverStats = {
      goals:   [count('goal', statsPayload.homeTeam), count('goal', statsPayload.awayTeam)] as [number, number],
      corners: [count('corner_kick', statsPayload.homeTeam), count('corner_kick', statsPayload.awayTeam)] as [number, number],
      yellows: [count('yellow_card', statsPayload.homeTeam), count('yellow_card', statsPayload.awayTeam)] as [number, number],
      reds:    [count('red_card', statsPayload.homeTeam), count('red_card', statsPayload.awayTeam)] as [number, number],
      saves:   [count('goalkeeper_save', statsPayload.homeTeam), count('goalkeeper_save', statsPayload.awayTeam)] as [number, number],
      subs:    [count('substitution', statsPayload.homeTeam), count('substitution', statsPayload.awayTeam)] as [number, number],
      dangers: [count('danger_attack', statsPayload.homeTeam), count('danger_attack', statsPayload.awayTeam)] as [number, number],
    };

    const { data: subs, error } = await supabase
      .from('telegram_subscriptions')
      .select('chat_id')
      .eq('contest_id', contestId);

    if (error || !subs?.length) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no subscribers' });
    }

    const text = formatMatchStats({ ...statsPayload, score: dbScore, stats: serverStats });

    const results = await Promise.allSettled(
      subs.map(sub => sendMessage(sub.chat_id, text, { parse_mode: 'Markdown' }))
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[TelegramStats] ${statsPayload.label} → sent to ${sent}/${subs.length} subscribers`);

    return NextResponse.json({ ok: true, sent, total: subs.length });
  } catch (err) {
    console.error('[TelegramStats] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
