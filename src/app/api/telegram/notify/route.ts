import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMessage, formatMatchEvent, MatchEventPayload } from '@/lib/telegram-bot';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface NotifyPayload extends MatchEventPayload {
  contestId: string;
}

// POST /api/telegram/notify
// Called from the live page when a match event fires.
// Sends a Telegram notification to all users subscribed to this contest.
export async function POST(req: NextRequest) {
  try {
    const payload: NotifyPayload = await req.json();
    const { contestId, eventType } = payload;

    if (!contestId || !eventType) {
      return NextResponse.json({ error: 'contestId and eventType required' }, { status: 400 });
    }

    // Fetch all subscribers for this contest
    const { data: subs, error } = await supabase
      .from('telegram_subscriptions')
      .select('chat_id')
      .eq('contest_id', contestId);

    if (error || !subs?.length) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no subscribers' });
    }

    const text = formatMatchEvent(payload);

    // Send to all subscribers in parallel
    const results = await Promise.allSettled(
      subs.map(sub => sendMessage(sub.chat_id, text, { parse_mode: 'Markdown' }))
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const min = payload.minute ?? 0;
    console.log(`[TelegramNotify] ${eventType} @ ${min}' → sent to ${sent}/${subs.length} subscribers`);

    return NextResponse.json({ ok: true, sent, total: subs.length });
  } catch (err) {
    console.error('[TelegramNotify] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
