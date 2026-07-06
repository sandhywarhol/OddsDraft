const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

type InlineKeyboardButton = { text: string; callback_data?: string; url?: string };
type SendOptions = {
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: { inline_keyboard: InlineKeyboardButton[][] };
};

export async function sendMessage(
  chatId: number | string,
  text: string,
  options: SendOptions = {}
) {
  if (!BOT_TOKEN) return null;
  const res = await fetch(`${TG_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, ...options }),
  });
  return res.json();
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  if (!BOT_TOKEN) return null;
  const res = await fetch(`${TG_API}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: false }),
  });
  return res.json();
}

export async function setWebhook(webhookUrl: string) {
  const res = await fetch(`${TG_API}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message', 'callback_query'] }),
  });
  return res.json();
}

// Format a UTC ISO timestamp in the user's local offset.
// tzOffset = hours from UTC, e.g. 7 = WIB, -4 = EDT, 3 = AST
export function formatKickoff(isoUtc: string, tzOffset: number): string {
  const d = new Date(new Date(isoUtc).getTime() + tzOffset * 3600 * 1000);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const sign = tzOffset >= 0 ? '+' : '';
  return `${dd} ${months[d.getUTCMonth()]} ${hh}:${mm} (UTC${sign}${tzOffset})`;
}

export async function getWebhookInfo() {
  const res = await fetch(`${TG_API}/getWebhookInfo`);
  return res.json();
}

export function formatMatchEvent(
  eventType: string,
  playerName: string,
  teamName: string,
  minute: number,
  homeTeam: string,
  awayTeam: string,
  score?: { home: number; away: number }
): string {
  const scoreStr = score ? ` | ${score.home}–${score.away}` : '';
  const min = minute > 0 ? ` (${minute}')` : '';

  switch (eventType) {
    case 'goal':
    case 'penalty_outcome':
      return `⚽ *GOAL!* ${playerName} — ${teamName}${min}${scoreStr}`;
    case 'own_goal':
      return `😬 *Own goal* — ${playerName} (${teamName})${min}${scoreStr}`;
    case 'yellow_card':
      return `🟨 Yellow card — ${playerName} (${teamName})${min}`;
    case 'red_card':
      return `🟥 *RED CARD!* ${playerName} (${teamName})${min}`;
    case 'substitution':
      return `🔄 Substitution — ${teamName}${min}`;
    case 'penalty_save':
      return `🧤 *PENALTY SAVED!* ${playerName}${min}`;
    case 'half_time':
      return `⏱ *Half Time* — ${homeTeam} ${score?.home ?? 0}–${score?.away ?? 0} ${awayTeam}`;
    case 'full_time':
      return `🏁 *FULL TIME!*\n${homeTeam} ${score?.home ?? 0}–${score?.away ?? 0} ${awayTeam}`;
    case 'var_review':
      return `📺 VAR Review in progress${min}`;
    case 'penalty_won':
      return `🎯 *Penalty!* ${playerName ? `Won by ${playerName}` : teamName}${min}`;
    case 'penalty_missed':
      return `❌ *Penalty missed!* ${playerName}${min}`;
    default:
      return `📣 ${eventType.replace(/_/g, ' ')} — ${playerName}${min}`;
  }
}
