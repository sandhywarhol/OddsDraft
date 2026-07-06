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
export async function POST(req: NextRequest) {
  try {
    const body: StatsRequest = await req.json();
    const { contestId, ...statsPayload } = body;

    if (!contestId) {
      return NextResponse.json({ error: 'contestId required' }, { status: 400 });
    }

    const { data: subs, error } = await supabase
      .from('telegram_subscriptions')
      .select('chat_id')
      .eq('contest_id', contestId);

    if (error || !subs?.length) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no subscribers' });
    }

    const text = formatMatchStats(statsPayload);

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
