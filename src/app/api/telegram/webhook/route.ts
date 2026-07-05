import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMessage, answerCallbackQuery, formatKickoff } from '@/lib/telegram-bot';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const HELP_TEXT = `
🏆 *OddsDraft Bot*

/matches — live & upcoming matches _(tap to subscribe)_
/timezone +7 — set your timezone _(e.g. +7, -4, +3)_
/register <wallet> — link your Solana wallet
/points <matchId> — your fantasy points
/leaderboard <matchId> — top 5 ranking
/help — show this message
`.trim();

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
      } else if (data.startsWith('unsub_')) {
        const contestId = data.replace('unsub_', '');
        const fixture = WC2026_FIXTURES.find(f => f.fixtureId === contestId);
        await supabase.from('telegram_subscriptions').delete().eq('chat_id', chatId).eq('contest_id', contestId);
        const matchName = fixture ? `${fixture.homeTeam} vs ${fixture.awayTeam}` : contestId;
        await answerCallbackQuery(cq.id, `🔕 Unsubscribed from ${matchName}`);
        await sendMessage(chatId, `🔕 Unsubscribed from *${matchName}*.`, { parse_mode: 'Markdown' });
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
          const contestId = arg.replace('subscribe_', '');
          const fixture = WC2026_FIXTURES.find(f => f.fixtureId === contestId);
          await supabase.from('telegram_subscriptions').upsert({ chat_id: chatId, contest_id: contestId });
          const matchName = fixture ? `${fixture.homeTeam} vs ${fixture.awayTeam}` : contestId;
          await sendMessage(chatId,
            `✅ Subscribed to *${matchName}*!\n\nYou'll receive live notifications for goals, cards, and match events.\n\n${HELP_TEXT}`,
            { parse_mode: 'Markdown' }
          );
          break;
        }
        await sendMessage(chatId, HELP_TEXT, { parse_mode: 'Markdown' });
        break;
      }

      case '/register': {
        if (!arg) {
          await sendMessage(chatId, '❌ Usage: /register <your_wallet_address>');
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
          `✅ Registered!\nWallet: \`${arg}\`\n\nNow subscribe to a match:\n/subscribe <matchId>`,
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
        if (!arg) { await sendMessage(chatId, '❌ Usage: /points <matchId>'); break; }
        const { data: user } = await supabase
          .from('telegram_users')
          .select('wallet_address')
          .eq('chat_id', chatId)
          .single();

        if (!user?.wallet_address) {
          await sendMessage(chatId, '❌ Please register first: /register <wallet>');
          break;
        }
        // Points are stored in the leaderboard — fetch from our contest API
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app'}/api/contest/leaderboard?contestId=${arg}`);
          if (res.ok) {
            const data = await res.json();
            const entry = data?.find((e: any) =>
              e.wallet?.toLowerCase() === user.wallet_address.toLowerCase()
            );
            if (entry) {
              await sendMessage(chatId, `📊 *Your Points — Match ${arg}*\n\nPoints: *${entry.points}*\nRank: #${entry.rank}\nPrize: ${entry.prize ?? '–'}`, { parse_mode: 'Markdown' });
            } else {
              await sendMessage(chatId, `📊 No lineup found for match \`${arg}\`.\nJoin at odds-draft.vercel.app`, { parse_mode: 'Markdown' });
            }
          }
        } catch {
          await sendMessage(chatId, '❌ Could not fetch points right now. Try again later.');
        }
        break;
      }

      case '/leaderboard': {
        if (!arg) { await sendMessage(chatId, '❌ Usage: /leaderboard <matchId>'); break; }
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app'}/api/contest/leaderboard?contestId=${arg}`);
          if (res.ok) {
            const data: Array<{ wallet: string; points: number; rank: number; prize?: string }> = await res.json();
            const top5 = data.slice(0, 5);
            if (top5.length === 0) {
              await sendMessage(chatId, 'No leaderboard data yet for this match.');
              break;
            }
            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
            const lines = top5.map((e, i) => {
              const short = `${e.wallet.slice(0, 4)}...${e.wallet.slice(-4)}`;
              return `${medals[i]} ${short} — *${e.points} pts* ${e.prize ? `| ${e.prize}` : ''}`;
            });
            const fixture = WC2026_FIXTURES.find(f => f.fixtureId === arg);
            const matchName = fixture ? `${fixture.homeTeam} vs ${fixture.awayTeam}` : arg;
            await sendMessage(chatId, `🏆 *Leaderboard — ${matchName}*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
          }
        } catch {
          await sendMessage(chatId, '❌ Could not fetch leaderboard right now.');
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
