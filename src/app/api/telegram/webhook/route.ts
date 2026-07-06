import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMessage, answerCallbackQuery, formatKickoff } from '@/lib/telegram-bot';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';
import { mergeEvents } from '@/lib/txline';
import { calculateEventPoints } from '@/lib/fantasy-engine';
import { matchPlayerName } from '@/lib/txline-bridge';
import { WC2026_PLAYERS } from '@/lib/wc2026-players-static';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const HELP_TEXT = `
🏆 *OddsDraft Bot*

/matches — live & upcoming matches _(tap to subscribe)_
/recap — last 5 events for your subscribed match
/points — your fantasy points _(select match from list)_
/leaderboard — top 5 ranking _(select match from list)_
/register <wallet> — link your Solana wallet
/timezone +7 — set your timezone _(e.g. +7, -4, +3)_
/help — show this message
`.trim();

const EVENT_EMOJI: Record<string, string> = {
  goal: '⚽', penalty_outcome: '⚽', own_goal: '😬',
  yellow_card: '🟨', red_card: '🟥',
  penalty_save: '🧤', goalkeeper_save: '🧤',
  half_time: '⏱', full_time: '🏁',
  substitution: '🔄', corner_kick: '🚩', var_review: '📺',
  kick_off: '🟢', penalty_won: '🎯', penalty_missed: '❌',
};

const RECAP_ACTION_MAP: Record<string, string> = {
  goal: 'goal', scored: 'goal', penalty_outcome: 'goal', penaltyoutcome: 'goal',
  own_goal: 'own_goal', owngoal: 'own_goal',
  yellowcard: 'yellow_card', yellow_card: 'yellow_card',
  redcard: 'red_card', red_card: 'red_card',
  substitution: 'substitution', sub: 'substitution',
  corner_kick: 'corner_kick', cornerkick: 'corner_kick',
  penalty_save: 'penalty_save', penaltysave: 'penalty_save',
  half_time: 'half_time', halftime: 'half_time',
  full_time: 'full_time', fulltime: 'full_time',
  kick_off: 'kick_off', kickoff: 'kick_off',
};

function parseTxLineEvents(rawArr: any[], fixtureName?: { homeTeam?: string; awayTeam?: string }) {
  const arr: any[] = Array.isArray(rawArr) ? rawArr : [];
  return arr.map((e: any) => {
    const rawType = (e.Action ?? e.type ?? '').toLowerCase().replace(/\s+/g, '_');
    return {
      event_type: RECAP_ACTION_MAP[rawType] ?? rawType,
      minute: e.Clock?.Seconds ? Math.floor(e.Clock.Seconds / 60) : (parseInt(e.minute) || 0),
      player_name: e.Player ?? e.PlayerName ?? e.player ?? '',
      team_name: e.Participant === 2 ? fixtureName?.awayTeam : fixtureName?.homeTeam,
    };
  }).filter((e: any) => e.event_type && e.event_type !== 'coverage_update' && e.event_type !== 'connected');
}

async function fetchAndSendRecap(chatId: number, contestId: string) {
  const fixture = WC2026_FIXTURES.find(f => f.fixtureId === contestId);
  const matchName = fixture ? `${fixture.homeTeam} vs ${fixture.awayTeam}` : contestId;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app';

  try {
    let events: any[] = [];

    // Source 1: live_match_events DB (written by cron — most reliable if table exists)
    const dbRes = await fetch(`${appUrl}/api/live/events?fixtureId=${contestId}`, { cache: 'no-store' });
    if (dbRes.ok) events = await dbRes.json();

    // Source 2: TxLINE snapshot (full match history; may be empty during live match)
    if (!events?.length) {
      const snapRes = await fetch(`${appUrl}/api/txline/api/scores/snapshot/${contestId}`, { cache: 'no-store' });
      if (snapRes.ok) {
        const snapArr = await snapRes.json();
        const merged = Array.isArray(snapArr) && snapArr.length > 0 ? mergeEvents(snapArr) : (snapArr ?? {});
        const allEvts: any[] = Array.isArray((merged as any)?._allEvents)
          ? (merged as any)._allEvents
          : (Array.isArray(snapArr) ? snapArr : []);
        // No Confirmed filter — snapshot events may all be Confirmed:false during live match
        events = parseTxLineEvents(allEvts, fixture);
      }
    }

    // Source 3: TxLINE updates (real-time stream — same endpoint cron uses; works during live)
    if (!events?.length) {
      const updRes = await fetch(`${appUrl}/api/txline/api/scores/updates/${contestId}`, { cache: 'no-store' });
      if (updRes.ok) {
        const updArr = await updRes.json();
        const merged = Array.isArray(updArr) && updArr.length > 0 ? mergeEvents(updArr) : (updArr ?? {});
        const allEvts: any[] = Array.isArray((merged as any)?._allEvents)
          ? (merged as any)._allEvents
          : (Array.isArray(updArr) ? updArr : []);
        events = parseTxLineEvents(allEvts, fixture);
      }
    }

    const SIGNIFICANT_RECAP = ['goal','penalty_outcome','own_goal','yellow_card','red_card','penalty_save','half_time','full_time','kick_off','substitution','corner_kick','var_review','penalty_won','penalty_missed'];
    // Deduplicate by (event_type, minute, player_name) to avoid TxLINE double-delivery artifacts
    const seenKeys = new Set<string>();
    const dedupedEvents = (events ?? []).filter(e => {
      const key = `${e.event_type ?? e.type}-${e.minute}-${e.player_name ?? e.player ?? ''}`;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });
    const filtered = dedupedEvents
      .filter(e => SIGNIFICANT_RECAP.includes(e.event_type ?? e.type ?? ''))
      .slice(-8)
      .reverse();

    const display = filtered.length ? filtered : dedupedEvents.slice(-8).reverse();

    if (!display?.length) {
      await sendMessage(chatId,
        `📋 *${matchName}*\n\nNo events recorded yet — the match may not have started.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const lines = display.map(e => {
      const type = e.event_type ?? e.type ?? '';
      const emoji = EVENT_EMOJI[type] ?? '📣';
      const min = (e.minute ?? 0) > 0 ? ` (${e.minute}')` : '';
      const player = e.player_name ?? e.player ?? '';
      const team = e.team_name ?? e.team ?? '';
      const label = type.replace(/_/g, ' ').toUpperCase();
      const playerPart = player ? ` — ${player}` : '';
      const teamPart = team ? ` \\(${team}\\)` : '';
      return `${emoji} *${label}*${min}${playerPart}${teamPart}`;
    });

    await sendMessage(chatId,
      `📋 *Recent Events — ${matchName}*\n\n${lines.join('\n')}`,
      { parse_mode: 'Markdown' }
    );
  } catch {
    await sendMessage(chatId, '❌ Could not fetch match events right now. Try again in a moment.');
  }
}

async function fetchAndSendLeaderboard(chatId: number, contestId: string) {
  const fixture = WC2026_FIXTURES.find(f => f.fixtureId === contestId);
  const matchName = fixture ? `${fixture.homeTeam} vs ${fixture.awayTeam}` : contestId;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app';
  try {
    // contest/leaderboard returns {participants:[{wallet_address,contest_type}]} — no live points
    // (points are tracked client-side during match, submitted to DB at full-time)
    const res = await fetch(`${appUrl}/api/contest/leaderboard?fixture=${contestId}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const participants: Array<{ wallet_address: string; contest_type: string }> = data?.participants ?? [];
    if (participants.length === 0) {
      await sendMessage(chatId,
        `🏆 *${matchName}*\n\nNo entries yet for this match.\n\nJoin at ${appUrl}/lineup/${contestId}`,
        { parse_mode: 'Markdown' }
      );
      return;
    }
    const lines = participants.slice(0, 10).map((p, i) => {
      const w = p.wallet_address ?? '';
      const short = w.length > 8 ? `${w.slice(0, 4)}...${w.slice(-4)}` : w;
      return `${i + 1}. ${short} _(${p.contest_type})_`;
    });
    await sendMessage(chatId,
      `🏆 *${matchName}* — ${participants.length} entries\n\n${lines.join('\n')}\n\n_Live points update in real\\-time on the app_\n[Watch Live ↗](${appUrl}/live/${contestId})`,
      { parse_mode: 'Markdown' }
    );
  } catch {
    await sendMessage(chatId, '❌ Could not fetch leaderboard right now.');
  }
}

const ACTION_MAP_POINTS: Record<string, string> = {
  goal: 'goal', scored: 'goal', penalty_outcome: 'goal', penaltyoutcome: 'goal',
  own_goal: 'own_goal', owngoal: 'own_goal',
  yellowcard: 'yellow_card', yellow_card: 'yellow_card',
  redcard: 'red_card', red_card: 'red_card',
  penalty_save: 'penalty_save', penaltysave: 'penalty_save',
  assist: 'assist',
  penalty: 'penalty_won', penalty_won: 'penalty_won',
  penaltymiss: 'penalty_missed', penalty_miss: 'penalty_missed', penalty_missed: 'penalty_missed',
  save: 'goalkeeper_save', goalkeeper_save: 'goalkeeper_save',
};
const SCORING_EVENTS = new Set(['goal', 'own_goal', 'red_card', 'yellow_card', 'penalty_save', 'assist', 'penalty_won', 'penalty_missed', 'goalkeeper_save']);

async function fetchAndSendPoints(chatId: number, contestId: string, walletAddress: string) {
  const fixture = WC2026_FIXTURES.find(f => f.fixtureId === contestId);
  const matchName = fixture ? `${fixture.homeTeam} vs ${fixture.awayTeam}` : contestId;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app';
  try {
    // Get user's lineup
    const { data: entries } = await supabase
      .from('contest_entries')
      .select('lineup, contest_type')
      .eq('fixture_id', contestId)
      .ilike('wallet_address', walletAddress);

    const entryRow = entries?.[0] ?? null;
    if (!entryRow?.lineup?.players?.length) {
      await sendMessage(chatId,
        `📊 *${matchName}*\n\n❌ No lineup found for your wallet.\n\n[Join the contest ↗](${appUrl}/lineup/${contestId})`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Try events from DB first (stored by cron job)
    const { data: dbEvents } = await supabase
      .from('live_match_events')
      .select('event_type, player_name, team_name, minute')
      .eq('fixture_id', contestId)
      .order('minute', { ascending: true });

    // Build a unified event list — either from DB (has names) or live from TxLINE
    type PointsEvent = { event_type: string; player_name: string; team_name: string; minute: number };
    let eventList: PointsEvent[] = [];

    const dbUsable = (dbEvents ?? []).filter(e => e.player_name);
    if (dbUsable.length > 0) {
      eventList = dbUsable as PointsEvent[];
    } else {
      // Fall back to live TxLINE data — fetch directly
      try {
        const txRes = await fetch(`${appUrl}/api/txline/api/scores/updates/${contestId}`, { cache: 'no-store' });
        if (txRes.ok) {
          const txArr = await txRes.json();
          const raw = Array.isArray(txArr) && txArr.length > 0 ? mergeEvents(txArr) : (txArr ?? {});
          const allEvents: any[] = Array.isArray((raw as any)?._allEvents) ? (raw as any)._allEvents : [];
          for (const ev of allEvents) {
            if (ev.Confirmed === false) continue;
            const d = ev.Data?.New ?? ev.Data ?? {};
            const rawType = (ev.Action ?? ev.type ?? '').toLowerCase().replace(/\s+/g, '_');
            const eventType = ACTION_MAP_POINTS[rawType];
            if (!eventType || !SCORING_EVENTS.has(eventType)) continue;
            const rawPName = d.PlayerName ?? ev.Player ?? ev.player ?? '';
            if (!rawPName) continue;
            const participant: number = d.Participant ?? ev.Participant ?? 1;
            const teamName = participant === 2 ? (fixture?.awayTeam ?? '') : (fixture?.homeTeam ?? '');
            const resolvedId = matchPlayerName(rawPName, teamName);
            const resolved = resolvedId ? WC2026_PLAYERS.find(p => p.id === resolvedId) : null;
            const minute = ev.Clock?.Seconds ? Math.floor(ev.Clock.Seconds / 60) : parseInt(ev.minute) || 0;
            eventList.push({ event_type: eventType, player_name: resolved?.name ?? rawPName, team_name: teamName, minute });
          }
        }
      } catch { /* TxLINE unavailable — proceed with empty list */ }
    }

    const lineup = entryRow.lineup;
    let totalPts = 0;
    const breakdown: string[] = [];

    for (const ev of eventList) {
      if (!SCORING_EVENTS.has(ev.event_type)) continue;
      const rawName = ev.player_name ?? '';
      if (!rawName) continue;

      const resolvedId = matchPlayerName(rawName, ev.team_name ?? '');
      let matched = resolvedId ? lineup.players.find((p: any) => p.id === resolvedId) : null;
      if (!matched) {
        const parts = rawName.toLowerCase().split(/\s+/).filter((p: string) => p.length >= 3);
        matched = lineup.players.find((p: any) =>
          parts.some((part: string) => (p.name ?? '').toLowerCase().includes(part))
        );
      }
      if (!matched) continue;

      let pts = calculateEventPoints(ev.event_type, matched.position ?? 'ATT');
      if (pts === 0) continue;

      const isCaptain = lineup.captain === matched.id;
      const stars = (lineup.confidence ?? {})[matched.id] ?? 3;
      const confMult = [1, 1.1, 1.2, 1.35, 1.5][Math.min(stars, 5) - 1] ?? 1.2;
      pts = Math.round(pts * confMult * (isCaptain ? 2 : 1) * 10) / 10;
      totalPts += pts;

      const evEmoji: Record<string, string> = { goal:'⚽', own_goal:'😰', red_card:'🟥', yellow_card:'🟨', penalty_save:'🧤', assist:'🎯', penalty_won:'🎯', penalty_missed:'❌', goalkeeper_save:'🧤' };
      const capNote = isCaptain ? ' *(C)×2*' : '';
      breakdown.push(`${evEmoji[ev.event_type] ?? '📣'} ${rawName} — ${ev.event_type.replace(/_/g,' ').toUpperCase()} (${ev.minute}') *+${pts}pts*${capNote}`);
    }

    const totalStr = totalPts > 0 ? `+${Math.round(totalPts * 10) / 10}` : `${Math.round(totalPts * 10) / 10}`;
    const bdText = breakdown.length > 0 ? `\n\n${breakdown.join('\n')}` : '\n\n_No scoring events from your lineup yet_';
    await sendMessage(chatId,
      `📊 *${matchName}* _(${entryRow.contest_type ?? 'standard'})_\n\n*Total: ${totalStr} pts*${bdText}\n\n[Full live score ↗](${appUrl}/live/${contestId})`,
      { parse_mode: 'Markdown' }
    );
  } catch {
    await sendMessage(chatId, '❌ Could not fetch points right now. Try again later.');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Inline button taps ────────────────────────────────────────────────────
    if (body.callback_query) {
      const cq = body.callback_query;
      const chatId: number = cq.message.chat.id;
      const data: string = cq.data ?? '';

      if (data.startsWith('sub_')) {
        const contestId = data.replace('sub_', '');
        const fixture = WC2026_FIXTURES.find(f => f.fixtureId === contestId);
        await supabase.from('telegram_subscriptions').upsert({ chat_id: chatId, contest_id: contestId });
        const matchName = fixture ? `${fixture.homeTeam} vs ${fixture.awayTeam}` : contestId;
        await answerCallbackQuery(cq.id, `✅ Subscribed to ${matchName}!`);
        await sendMessage(chatId, `✅ You'll receive live notifications for *${matchName}*.\n\nUse /matches to manage more subscriptions.`, { parse_mode: 'Markdown' });
      } else if (data.startsWith('lb_')) {
        const contestId = data.replace('lb_', '');
        await answerCallbackQuery(cq.id);
        await fetchAndSendLeaderboard(chatId, contestId);
      } else if (data.startsWith('pts_')) {
        const contestId = data.replace('pts_', '');
        const { data: u } = await supabase.from('telegram_users').select('wallet_address').eq('chat_id', chatId).single();
        if (!u?.wallet_address) {
          await answerCallbackQuery(cq.id, '❌ Register your wallet first with /register');
        } else {
          await answerCallbackQuery(cq.id);
          await fetchAndSendPoints(chatId, contestId, u.wallet_address);
        }
      } else if (data.startsWith('unsub_')) {
        const contestId = data.replace('unsub_', '');
        const fixture = WC2026_FIXTURES.find(f => f.fixtureId === contestId);
        await supabase.from('telegram_subscriptions').delete().eq('chat_id', chatId).eq('contest_id', contestId);
        const matchName = fixture ? `${fixture.homeTeam} vs ${fixture.awayTeam}` : contestId;
        await answerCallbackQuery(cq.id, `🔕 Unsubscribed from ${matchName}`);
        await sendMessage(chatId, `🔕 Unsubscribed from *${matchName}*.`, { parse_mode: 'Markdown' });
      } else if (data.startsWith('recap_')) {
        const contestId = data.replace('recap_', '');
        await answerCallbackQuery(cq.id);
        await fetchAndSendRecap(chatId, contestId);
      } else {
        await answerCallbackQuery(cq.id);
      }
      return NextResponse.json({ ok: true });
    }

    // ── Text commands ─────────────────────────────────────────────────────────
    const message = body.message;
    if (!message?.text) return NextResponse.json({ ok: true });

    const chatId: number = message.chat.id;
    const username: string = message.from?.username ?? '';
    const firstName: string = message.from?.first_name ?? '';
    const text: string = message.text.trim();
    const parts = text.split(/\s+/);
    const cmd = parts[0].toLowerCase().split('@')[0]; // strip @botname suffix
    const arg = parts[1] ?? '';

    switch (cmd) {
      case '/start':
      case '/help': {
        // Deep link: /start subscribe_18188721 → auto-subscribe to that match
        if (cmd === '/start' && arg?.startsWith('subscribe_')) {
          // Format: subscribe_{contestId} or subscribe_{contestId}_{walletAddress}
          const parts = arg.replace('subscribe_', '').split('_');
          const contestId = parts[0];
          const walletAddress = parts.slice(1).join('_') || null; // wallet may contain underscores? unlikely but safe
          const fixture = WC2026_FIXTURES.find(f => f.fixtureId === contestId);
          const matchName = fixture ? `${fixture.homeTeam} vs ${fixture.awayTeam}` : contestId;

          await supabase.from('telegram_subscriptions').upsert({ chat_id: chatId, contest_id: contestId });

          // Auto-register wallet if passed via deep link
          if (walletAddress) {
            await supabase.from('telegram_users').upsert({
              chat_id: chatId, username, first_name: firstName,
              wallet_address: walletAddress, tz_offset: 0,
            });
          }

          const walletNote = walletAddress
            ? `\n✅ Wallet linked automatically — use /points to check your score.`
            : `\n💡 Use /register <wallet> to link your Solana wallet for fantasy points.`;

          await sendMessage(chatId,
            `✅ Subscribed to *${matchName}*!\n\nYou'll receive live notifications for goals, cards, and match events.${walletNote}\n\n${HELP_TEXT}`,
            { parse_mode: 'Markdown' }
          );
          break;
        }
        await sendMessage(chatId, HELP_TEXT, { parse_mode: 'Markdown' });
        break;
      }

      case '/register': {
        if (!arg) {
          await sendMessage(chatId,
            `❌ *Wallet address required*\n\nUsage: /register <your_wallet_address>\n\nExample:\n\`/register 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU\`\n\n💡 Tip: Connect your wallet in the app and tap the Telegram Subscribe button on any live match — your wallet links automatically.`,
            { parse_mode: 'Markdown' }
          );
          break;
        }
        await supabase.from('telegram_users').upsert({
          chat_id: chatId,
          wallet_address: arg,
          username,
          first_name: firstName,
        });
        await sendMessage(
          chatId,
          `✅ *Wallet linked!*\n\nAddress: \`${arg}\`\n\nUse /points to check your fantasy points, or /matches to subscribe to upcoming games.`,
          { parse_mode: 'Markdown' }
        );
        break;
      }

      case '/subscribe': {
        if (!arg) {
          await sendMessage(chatId, '❌ Usage: /subscribe <matchId>\n\nSee /matches for available IDs.');
          break;
        }
        const fixture = WC2026_FIXTURES.find(f => f.fixtureId === arg);
        await supabase.from('telegram_subscriptions').upsert({ chat_id: chatId, contest_id: arg });
        const matchName = fixture ? `${fixture.homeTeam} vs ${fixture.awayTeam}` : arg;
        await sendMessage(chatId, `✅ Subscribed to *${matchName}*!\nYou'll receive live goal, card, and match event notifications.`, { parse_mode: 'Markdown' });
        break;
      }

      case '/unsubscribe': {
        if (!arg) {
          await sendMessage(chatId, '❌ Usage: /unsubscribe <matchId>');
          break;
        }
        await supabase.from('telegram_subscriptions').delete().eq('chat_id', chatId).eq('contest_id', arg);
        await sendMessage(chatId, `🔕 Unsubscribed from match \`${arg}\`.`, { parse_mode: 'Markdown' });
        break;
      }

      case '/timezone': {
        if (!arg) {
          const { data: u } = await supabase.from('telegram_users').select('tz_offset').eq('chat_id', chatId).single();
          const current = u?.tz_offset ?? 0;
          await sendMessage(chatId,
            `🕐 Your current timezone: *UTC${current >= 0 ? '+' : ''}${current}*\n\nTo change it, send:\n/timezone +7 _(Indonesia/WIB)_\n/timezone -4 _(US East/EDT)_\n/timezone +3 _(Saudi Arabia/AST)_\n/timezone 0 _(UTC)_`,
            { parse_mode: 'Markdown' }
          );
          break;
        }
        const parsed = parseInt(arg.replace(/^\+/, ''), 10);
        if (isNaN(parsed) || parsed < -12 || parsed > 14) {
          await sendMessage(chatId, '❌ Invalid offset. Use a value between -12 and +14, e.g. /timezone +7');
          break;
        }
        await supabase.from('telegram_users').upsert({ chat_id: chatId, username, first_name: firstName, tz_offset: parsed });
        await sendMessage(chatId,
          `✅ Timezone set to *UTC${parsed >= 0 ? '+' : ''}${parsed}*\nMatch times in /matches will now use your timezone.`,
          { parse_mode: 'Markdown' }
        );
        break;
      }

      case '/matches': {
        const now = Date.now();
        const upcoming = WC2026_FIXTURES
          .filter(f => {
            const ko = f.kickoffAt ? new Date(f.kickoffAt).getTime() : 0;
            return ko > now - 3 * 3600 * 1000; // within last 3h or future
          })
          .slice(0, 8);

        if (upcoming.length === 0) {
          await sendMessage(chatId, 'No upcoming matches found.');
          break;
        }

        // Fetch user's timezone preference + subscriptions in parallel
        const [{ data: userRow }, { data: subs }] = await Promise.all([
          supabase.from('telegram_users').select('tz_offset').eq('chat_id', chatId).single(),
          supabase.from('telegram_subscriptions').select('contest_id').eq('chat_id', chatId),
        ]);
        const tzOffset: number = userRow?.tz_offset ?? 0;
        const subscribedIds = new Set((subs ?? []).map((s: { contest_id: string }) => s.contest_id));
        const tzLabel = tzOffset >= 0 ? `UTC+${tzOffset}` : `UTC${tzOffset}`;

        const lines = upcoming.map(f => {
          const ko = f.kickoffAt ? formatKickoff(f.kickoffAt, tzOffset) : 'TBD';
          const koMs = new Date(f.kickoffAt).getTime();
          const isLive = Date.now() > koMs && Date.now() < koMs + 2 * 3600 * 1000;
          const status = isLive ? ' 🔴 LIVE' : '';
          return `${f.homeFlag} *${f.homeTeam} vs ${f.awayTeam}* ${f.awayFlag}${status}\n  🕐 ${ko}`;
        });

        const inlineKeyboard = upcoming.map(f => {
          const isSubscribed = subscribedIds.has(f.fixtureId);
          return [{
            text: isSubscribed ? `🔕 Unsubscribe — ${f.homeTeam} vs ${f.awayTeam}` : `🔔 Subscribe — ${f.homeTeam} vs ${f.awayTeam}`,
            callback_data: isSubscribed ? `unsub_${f.fixtureId}` : `sub_${f.fixtureId}`,
          }];
        });

        await sendMessage(
          chatId,
          `🗓 *Upcoming & Live Matches* _(${tzLabel} — use /timezone to change)_\n\n${lines.join('\n\n')}`,
          { parse_mode: 'Markdown', reply_markup: { inline_keyboard: inlineKeyboard } }
        );
        break;
      }

      case '/points': {
        const { data: user } = await supabase
          .from('telegram_users')
          .select('wallet_address')
          .eq('chat_id', chatId)
          .single();

        if (!user?.wallet_address) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app';
          await sendMessage(chatId,
            `🔗 *Wallet not linked yet*\n\n*Easiest way — auto link:*\n1. Open OddsDraft App\n2. Connect your Solana wallet\n3. On any live match page, tap the blue Telegram Subscribe button — your wallet links automatically\n\n*Or link manually:*\n/register <your_wallet_address>`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [[{ text: '🚀 Open OddsDraft App', url: appUrl }]],
              },
            }
          );
          break;
        }

        // No matchId — show subscribed matches as inline buttons
        if (!arg) {
          const { data: userSubs } = await supabase
            .from('telegram_subscriptions')
            .select('contest_id')
            .eq('chat_id', chatId);

          if (!userSubs?.length) {
            await sendMessage(chatId, '📊 You have no subscribed matches.\n\nUse /matches to subscribe to a match first.');
            break;
          }

          const keyboard = userSubs.map((s: { contest_id: string }) => {
            const f = WC2026_FIXTURES.find(x => x.fixtureId === s.contest_id);
            const label = f ? `📊 ${f.homeTeam} vs ${f.awayTeam}` : `📊 Match ${s.contest_id}`;
            return [{ text: label, callback_data: `pts_${s.contest_id}` }];
          });

          await sendMessage(chatId, '📊 *Select a match to see your points:*', {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard },
          });
          break;
        }

        // matchId provided directly — fetch points
        await fetchAndSendPoints(chatId, arg, user.wallet_address);
        break;
      }

      case '/leaderboard': {
        if (!arg) {
          // Show subscribed matches as inline buttons
          const { data: lbSubs } = await supabase
            .from('telegram_subscriptions')
            .select('contest_id')
            .eq('chat_id', chatId);

          if (!lbSubs?.length) {
            await sendMessage(chatId, '🏆 You have no subscribed matches.\n\nUse /matches to subscribe first.');
            break;
          }

          const keyboard = lbSubs.map((s: { contest_id: string }) => {
            const f = WC2026_FIXTURES.find(x => x.fixtureId === s.contest_id);
            const label = f ? `🏆 ${f.homeTeam} vs ${f.awayTeam}` : `🏆 Match ${s.contest_id}`;
            return [{ text: label, callback_data: `lb_${s.contest_id}` }];
          });

          await sendMessage(chatId, '🏆 *Select a match to see the leaderboard:*', {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard },
          });
          break;
        }

        await fetchAndSendLeaderboard(chatId, arg);
        break;
      }

      case '/recap': {
        // Get user's subscribed matches
        const { data: recapSubs } = await supabase
          .from('telegram_subscriptions')
          .select('contest_id')
          .eq('chat_id', chatId);

        if (!recapSubs?.length) {
          await sendMessage(chatId, '📋 You have no subscribed matches.\n\nUse /matches to subscribe to a match first.');
          break;
        }

        if (recapSubs.length === 1 || arg) {
          const contestId = arg || recapSubs[0].contest_id;
          await fetchAndSendRecap(chatId, contestId);
        } else {
          // Multiple subscriptions — show selection buttons
          const keyboard = recapSubs.map((s: { contest_id: string }) => {
            const f = WC2026_FIXTURES.find(x => x.fixtureId === s.contest_id);
            const label = f ? `📋 ${f.homeTeam} vs ${f.awayTeam}` : `📋 Match ${s.contest_id}`;
            return [{ text: label, callback_data: `recap_${s.contest_id}` }];
          });
          await sendMessage(chatId, '📋 *Select a match for the event recap:*', {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard },
          });
        }
        break;
      }

      default: {
        await sendMessage(chatId, `❓ Unknown command. Type /help for available commands.`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[TelegramWebhook] Error:', err);
    return NextResponse.json({ ok: true }); // always 200 to Telegram
  }
}
