import { NextRequest, NextResponse } from 'next/server';
import { setWebhook, getWebhookInfo } from '@/lib/telegram-bot';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// GET /api/telegram/setup — delete old webhook then re-register with all required update types
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`;
  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  // Delete first to force Telegram to accept new allowed_updates
  await fetch(`${TG_API}/deleteWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drop_pending_updates: true }),
  });

  const result = await setWebhook(webhookUrl);
  const info = await getWebhookInfo();

  return NextResponse.json({ webhook_set: result, current_info: info });
}
