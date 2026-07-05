import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMessage, formatMatchEvent } from '@/lib/telegram-bot';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface NotifyPayload {
  contestId: string;
  eventType: string;
  playerName: string;
  teamName: string;
  minute: number;
  homeTeam: string;
  awayTeam: string;
  score?: { home: number; away: number };
}

// POST /api/telegram/notify
// Called from the live page when a significant match event is detected.
// Sends a Telegram notification to all users subscribed to this contest.
export async function POST(req: NextRequest) {
  try {
    const payload: NotifyPayload = await req.json();
    const { contestId, eventType, playerName, teamName, minute, homeTeam, awayTeam, score } = payload;

    if (!contestId || !eventType) {
      return NextResponse.json({ error: 'contestId and eventType required' }, { status: 400 });
    }

    // Only notify for significant events
    const significant = ['goal', 'penalty_outcome', 'own_goal', 'red_card', 'penalty_save', 'half_time', 'full_time'];
    if (!significant.includes(eventType)) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'non-significant event' });
    }

    // Fetch all subscribers for this contest
    const { data: subs, error } = await supabase
      .from('telegram_subscriptions')
      .select('chat_id')
      .eq('contest_id', contestId);

    if (error || !subs?.length) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no subscribers' });
    }

    const text = formatMatchEvent(eventType, playerName, teamName, minute, homeTeam, awayTeam, score);

    // Send to all subscribers in parallel (fire and forget per message)
    const results = await Promise.allSettled(
      subs.map(sub => sendMessage(sub.chat_id, text, { parse_mode: 'Markdown' }))
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[TelegramNotify] ${eventType} @ ${minute}' → sent to ${sent}/${subs.length} subscribers`);

    return NextResponse.json({ ok: true, sent, total: subs.length });
  } catch (err) {
    console.error('[TelegramNotify] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
