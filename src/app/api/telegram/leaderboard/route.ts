import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendMessage,
  formatLeaderboard,
  formatPersonalPoints,
  type LeaderboardEntry,
} from '@/lib/telegram-bot';
import { calculateEventPoints } from '@/lib/fantasy-engine';
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

// POST /api/telegram/leaderboard
// Broadcasts the live leaderboard to all contest subscribers and sends each
// subscriber their personal rank + total points as a separate message.
// Called from the live page at HT / FT, or from the cron job.
// Deduplication: HT and FT each send at most once per fixture (same key pattern as /stats).
// "Live Update" label bypasses dedup — used for on-demand mid-match pushes.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contestId,
      contestType = 'top3',
      label = 'Live Update',
      homeTeam = '',
      awayTeam = '',
      homeFlag = '',
      awayFlag = '',
      score,
    } = body as {
      contestId: string;
      contestType?: string;
      label?: string;
      homeTeam?: string;
      awayTeam?: string;
      homeFlag?: string;
      awayFlag?: string;
      score?: { home: number; away: number };
    };

    if (!contestId) {
      return NextResponse.json({ error: 'contestId required' }, { status: 400 });
    }

    // Dedup for HT and FT — "Live Update" always sends.
    if (label === 'Half Time' || label === 'Full Time') {
      const dedupId = `leaderboard-${label.toLowerCase().replace(/\s+/g, '_')}`;
      const { error: dedupErr } = await supabase
        .from('notified_events')
        .insert({ fixture_id: contestId, event_id: dedupId });

      if (dedupErr?.code === '23505') {
        return NextResponse.json({ ok: true, sent: 0, reason: 'already_sent' });
      }
    }

    // 1. Fetch all contest entries
    let entryQuery = supabase
      .from('contest_entries')
      .select('wallet_address, lineup')
      .eq('fixture_id', contestId);
    if (contestType !== 'all') entryQuery = entryQuery.eq('contest_type', contestType);

    const { data: entries, error: entriesErr } = await entryQuery;
    if (entriesErr || !entries?.length) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no entries' });
    }

    // 2. Fetch all scoring events written by the cron
    const { data: dbEvents } = await supabase
      .from('live_match_events')
      .select('event_type, player_name, team_name, minute')
      .eq('fixture_id', contestId)
      .order('minute', { ascending: true });

    const events = (dbEvents ?? []).filter(e => SCORING_EVENTS.has(e.event_type));

    // 3. Calculate total points per wallet (server-authoritative, same algorithm as prize/submit)
    const scored: { walletAddress: string; points: number }[] = entries.map(entry => {
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

    // 4. Sort descending → ranked leaderboard
    scored.sort((a, b) => b.points - a.points);
    const totalParticipants = scored.length;

    const rankedEntries: LeaderboardEntry[] = scored.map((e, i) => ({
      rank: i + 1,
      walletAddress: e.walletAddress,
      points: e.points,
    }));

    // 5. Fetch Telegram subscribers for this contest
    const { data: subs } = await supabase
      .from('telegram_subscriptions')
      .select('chat_id')
      .eq('contest_id', contestId);

    if (!subs?.length) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no subscribers' });
    }

    // 6. Link chat_id → wallet_address for personal messages
    const chatIds = subs.map((s: any) => s.chat_id);
    const { data: tgUsers } = await supabase
      .from('telegram_users')
      .select('chat_id, wallet_address, username')
      .in('chat_id', chatIds);

    const walletToChat = new Map<string, { chatId: number; username?: string }>();
    for (const u of tgUsers ?? []) {
      if (u.wallet_address) walletToChat.set(u.wallet_address, { chatId: u.chat_id, username: u.username });
    }

    // Attach display names (Telegram @username or truncated wallet) to leaderboard entries
    const enrichedEntries: LeaderboardEntry[] = rankedEntries.map(e => {
      const tg = walletToChat.get(e.walletAddress);
      return {
        ...e,
        displayName: tg?.username ? `@${tg.username}` : undefined,
      };
    });

    // 7. Broadcast leaderboard to all subscribers
    const leaderboardText = formatLeaderboard({
      homeTeam, awayTeam, homeFlag, awayFlag, score, label,
      entries: enrichedEntries,
      totalParticipants,
    });

    const broadcastResults = await Promise.allSettled(
      subs.map((sub: any) => sendMessage(sub.chat_id, leaderboardText, { parse_mode: 'Markdown' }))
    );
    const broadcastSent = broadcastResults.filter(r => r.status === 'fulfilled').length;

    // 8. Send personal rank message to each subscriber who has a linked wallet
    let personalSent = 0;
    for (const [wallet, { chatId }] of walletToChat) {
      const myEntry = rankedEntries.find(e => e.walletAddress === wallet);
      if (!myEntry) continue;

      const personalText = formatPersonalPoints({
        homeTeam, awayTeam, homeFlag, awayFlag, label,
        points: myEntry.points,
        rank: myEntry.rank,
        totalParticipants,
      });

      const result = await sendMessage(chatId, personalText, { parse_mode: 'Markdown' });
      if (result) personalSent++;
    }

    console.log(`[TelegramLeaderboard] ${label} — broadcast: ${broadcastSent}/${subs.length}, personal: ${personalSent}`);

    return NextResponse.json({
      ok: true,
      label,
      totalParticipants,
      broadcastSent,
      personalSent,
    });
  } catch (err: any) {
    console.error('[TelegramLeaderboard] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
