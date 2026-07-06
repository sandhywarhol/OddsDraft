import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMessage, formatMatchEvent } from '@/lib/telegram-bot';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';
import { mergeEvents } from '@/lib/txline';
import { calculateEventPoints } from '@/lib/fantasy-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SIGNIFICANT = new Set([
  'goal', 'penalty_outcome', 'own_goal', 'red_card', 'penalty_save',
  'half_time', 'full_time',
  'yellow_card', 'substitution', 'corner_kick', 'var_review', 'extra_time',
]);

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app';

  // Find matches that are currently live (started within last 4h to handle delays)
  const now = Date.now();
  const liveFixtures = WC2026_FIXTURES.filter(f => {
    if (!f.kickoffAt) return false;
    const ko = new Date(f.kickoffAt).getTime();
    return now > ko - 10 * 60 * 1000 && now < ko + 4 * 3600 * 1000;
  });

  if (liveFixtures.length === 0) {
    return NextResponse.json({ ok: true, message: 'No live matches right now' });
  }

  const results: Record<string, number> = {};

  for (const fixture of liveFixtures) {
    try {
      // Use server-side proxy — injects auth, no client token needed.
      // Path matches live page: /api/txline/api/scores/updates/{id}
      // Proxy returns a raw SSE array; mergeEvents() merges it into a state object with _allEvents.
      const scoreRes = await fetch(`${appUrl}/api/txline/api/scores/updates/${fixture.fixtureId}`, { cache: 'no-store' });
      if (!scoreRes.ok) continue;
      const scoreArr = await scoreRes.json();
      const raw = Array.isArray(scoreArr) && scoreArr.length > 0 ? mergeEvents(scoreArr) : (scoreArr ?? {});
      const allEvents: any[] = Array.isArray((raw as any)?._allEvents) ? (raw as any)._allEvents : [];
      if (allEvents.length === 0) continue;

      // Score from authoritative TxLINE source
      const scoreHome: number = (raw as any)?.Score?.Participant1?.Total?.Goals ?? 0;
      const scoreAway: number = (raw as any)?.Score?.Participant2?.Total?.Goals ?? 0;

      // Filter confirmed events only — TxLINE sends every event twice
      // (Confirmed=false then Confirmed=true). Process only confirmed to avoid duplicates.
      const confirmedEvents = allEvents.filter(ev => ev.Confirmed !== false);

      // Filter only significant events we haven't notified about yet
      const candidateEvents = confirmedEvents.filter(ev => {
        const rawType = (ev.Action ?? ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
        const mapped = ACTION_MAP[rawType] ?? rawType;
        return SIGNIFICANT.has(mapped);
      });

      if (candidateEvents.length === 0) continue;

      // Build event IDs using Seq (unique per TxLINE event) when available,
      // otherwise fall back to type+minute (no player — player name varies between
      // Confirmed=false and Confirmed=true stages causing false duplicates).
      const eventIds = candidateEvents.map(ev => {
        const rawType = (ev.Action ?? ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
        const mapped = ACTION_MAP[rawType] ?? rawType;
        const min = parseInt(ev.Clock?.Seconds ? String(Math.floor(ev.Clock.Seconds / 60)) : ev.minute) || 0;
        const seq = ev.Seq ?? ev.seq;
        return seq ? `seq-${seq}` : `${mapped}-${min}`;
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
          const rawType = (ev.Action ?? ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
          const eventType = ACTION_MAP[rawType] ?? rawType;
          const minSec = ev.Clock?.Seconds ? Math.floor(ev.Clock.Seconds / 60) : parseInt(ev.minute) || 0;
          return {
            fixture_id: fixture.fixtureId,
            event_id: eventIds[candidateEvents.indexOf(newEvents[i])],
            minute: minSec,
            event_type: eventType,
            player_name: ev.Player ?? ev.player ?? '',
            team_name: ev.Team ?? ev.team ?? '',
            home_score: scoreHome,
            away_score: scoreAway,
          };
        }),
        { onConflict: 'fixture_id,event_id' }
      );

      let sent = 0;
      for (let i = 0; i < newEvents.length; i++) {
        const ev = newEvents[i];
        const rawType = (ev.Action ?? ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
        const eventType = ACTION_MAP[rawType] ?? rawType;
        const minute = ev.Clock?.Seconds ? Math.floor(ev.Clock.Seconds / 60) : parseInt(ev.minute) || 0;
        const playerName = ev.Player ?? ev.player ?? '';
        const teamName = ev.Team ?? ev.team ?? '';

        const text = formatMatchEvent(eventType, playerName, teamName, minute, fixture.homeTeam, fixture.awayTeam, { home: scoreHome, away: scoreAway });

        await Promise.allSettled(subs.map(sub => sendMessage(sub.chat_id, text, { parse_mode: 'Markdown' })));
        sent += subs.length;
      }

      // Mark all new events as notified
      const newEventIds = newEvents.map((_, i) => candidateEvents.indexOf(newEvents[i])).map(i => eventIds[i]);
      await supabase.from('notified_events').upsert(
        newEventIds.map(id => ({ fixture_id: fixture.fixtureId, event_id: id }))
      );

      // ── Fantasy points notifications ────────────────────────────────────────
      // For scoring events (goal, card, etc.), find subscribers whose lineup
      // contains the scoring player and send them a personal "you earned X pts" message.
      const FANTASY_EVENTS = new Set(['goal', 'own_goal', 'red_card', 'yellow_card', 'penalty_save']);
      const scoringEvents = newEvents.filter(ev => {
        const rt = (ev.Action ?? ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
        return FANTASY_EVENTS.has(ACTION_MAP[rt] ?? rt);
      });

      if (scoringEvents.length > 0 && subs.length > 0) {
        const chatIds = subs.map((s: { chat_id: number }) => s.chat_id);

        // chat_id → wallet_address
        const { data: tgUsers } = await supabase
          .from('telegram_users')
          .select('chat_id, wallet_address')
          .in('chat_id', chatIds);

        if (tgUsers?.length) {
          const wallets = tgUsers.map((u: any) => u.wallet_address).filter(Boolean);
          const { data: entries } = await supabase
            .from('contest_entries')
            .select('wallet_address, lineup')
            .eq('fixture_id', fixture.fixtureId)
            .in('wallet_address', wallets);

          if (entries?.length) {
            const walletToChat = new Map(tgUsers.map((u: any) => [u.wallet_address, u.chat_id]));

            for (const entry of entries) {
              const chatId = walletToChat.get(entry.wallet_address);
              if (!chatId || !entry.lineup?.players?.length) continue;

              const msgs: string[] = [];
              for (const ev of scoringEvents) {
                const rt = (ev.Action ?? ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
                const eventType = ACTION_MAP[rt] ?? rt;
                const playerName = (ev.Player ?? ev.player ?? '').trim();
                if (!playerName || playerName.toLowerCase() === 'unknown') continue;

                // Fuzzy match by last name segment (≥3 chars)
                const nameParts = playerName.toLowerCase().split(/\s+/).filter((p: string) => p.length >= 3);
                const matched = entry.lineup.players.find((p: any) =>
                  nameParts.some((part: string) => (p.name ?? '').toLowerCase().includes(part))
                );
                if (!matched) continue;

                let pts = calculateEventPoints(eventType, matched.position ?? 'ATT');
                if (pts === 0) continue;

                const isCaptain = entry.lineup.captain === matched.id;
                const stars = (entry.lineup.confidence ?? {})[matched.id] ?? 3;
                const confMult = [1, 1.1, 1.2, 1.35, 1.5][Math.min(stars, 5) - 1] ?? 1.2;
                pts = Math.round(pts * confMult * (isCaptain ? 2 : 1) * 10) / 10;

                const ptsStr = pts > 0 ? `+${pts}` : `${pts}`;
                const evEmoji: Record<string, string> = { goal:'⚽', own_goal:'😰', red_card:'🟥', yellow_card:'🟨', penalty_save:'🧤' };
                const emoji = evEmoji[eventType] ?? '📊';
                const min = ev.Clock?.Seconds ? Math.floor(ev.Clock.Seconds / 60) : parseInt(ev.minute) || 0;
                const capNote = isCaptain ? ' *(C) ×2*' : '';
                msgs.push(`${emoji} *${playerName}* — ${eventType.replace(/_/g, ' ').toUpperCase()} (${min}')\n*${ptsStr} pts*${capNote}`);
              }

              if (msgs.length > 0) {
                await sendMessage(chatId,
                  `🎮 *Fantasy Points Update*\n\n${msgs.join('\n\n')}\n\n_Open app to see your full score_`,
                  { parse_mode: 'Markdown' }
                );
              }
            }
          }
        }
      }
      // ── End fantasy points notifications ────────────────────────────────────

      results[fixture.fixtureId] = sent;
    } catch (err) {
      console.error(`[CronMatchEvents] Error for fixture ${fixture.fixtureId}:`, err);
    }
  }

  return NextResponse.json({ ok: true, liveFixtures: liveFixtures.length, results });
}
