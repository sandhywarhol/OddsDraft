import { NextRequest, NextResponse } from 'next/server';
import { setWebhook, getWebhookInfo } from '@/lib/telegram-bot';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const BOT_COMMANDS = [
  { command: 'matches', description: 'Live & upcoming matches (tap to subscribe)' },
  { command: 'recap', description: 'Last events for your subscribed match' },
  { command: 'points', description: 'Your fantasy points for subscribed matches' },
  { command: 'leaderboard', description: 'Top 5 ranking (select match from list)' },
  { command: 'register', description: 'Link your Solana wallet' },
  { command: 'timezone', description: 'Set your timezone e.g. +7, -4, +3' },
  { command: 'help', description: 'Show all commands' },
];

// GET /api/telegram/setup — re-register webhook and update command menu
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`;
  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  // Delete first to force Telegram to accept new allowed_updates
  await fetch(`${TG_API}/deleteWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drop_pending_updates: true }),
  });

  const [webhookResult, commandsResult] = await Promise.all([
    setWebhook(webhookUrl),
    fetch(`${TG_API}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: BOT_COMMANDS }),
    }).then(r => r.json()),
  ]);

  const info = await getWebhookInfo();

  return NextResponse.json({ webhook_set: webhookResult, commands_set: commandsResult, current_info: info });
}
