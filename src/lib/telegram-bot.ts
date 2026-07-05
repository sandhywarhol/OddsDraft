const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendMessage(
  chatId: number | string,
  text: string,
  options: { parse_mode?: 'Markdown' | 'HTML' } = {}
) {
  if (!BOT_TOKEN) return null;
  const res = await fetch(`${TG_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, ...options }),
  });
  return res.json();
}

export async function setWebhook(webhookUrl: string) {
  const res = await fetch(`${TG_API}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message'] }),
  });
  return res.json();
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
    default:
      return `📣 ${eventType.replace(/_/g, ' ')} — ${playerName}${min}`;
  }
}
