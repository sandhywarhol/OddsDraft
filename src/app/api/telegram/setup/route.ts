import { NextRequest, NextResponse } from 'next/server';
import { setWebhook, getWebhookInfo } from '@/lib/telegram-bot';

// GET /api/telegram/setup — register webhook URL with Telegram
// Visit this URL once after deploying to activate the bot.
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get('host')}`;
  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  const result = await setWebhook(webhookUrl);
  const info = await getWebhookInfo();

  return NextResponse.json({ webhook_set: result, current_info: info });
}
