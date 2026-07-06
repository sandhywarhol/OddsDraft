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

export interface MatchEventPayload {
  eventType: string;
  playerName?: string;
  playerOut?: string;       // substitution: player being replaced
  assistPlayer?: string;    // goal: player who assisted
  teamName?: string;
  teamFlag?: string;
  minute?: number;
  homeTeam: string;
  awayTeam: string;
  homeFlag?: string;
  awayFlag?: string;
  score?: { home: number; away: number };
  description?: string;     // raw description from live feed
}

export function formatMatchEvent(p: MatchEventPayload): string {
  const {
    eventType, playerName = '', playerOut = '', assistPlayer = '',
    teamName = '', teamFlag = '', minute = 0,
    homeTeam, awayTeam, homeFlag = '', awayFlag = '',
    score, description,
  } = p;

  const scoreStr = score != null ? `${homeFlag} ${homeTeam} *${score.home}–${score.away}* ${awayTeam} ${awayFlag}` : `${homeTeam} vs ${awayTeam}`;
  const min = minute > 0 ? `${minute}'` : '';
  const team = teamFlag ? `${teamFlag} ${teamName}` : teamName;

  switch (eventType) {
    case 'goal':
      return [
        `⚽ *GOAL! ${team}*`,
        playerName ? `👤 Scorer: *${playerName}*` : '',
        assistPlayer ? `🎯 Assist: ${assistPlayer}` : '',
        min ? `⏱ ${min}` : '',
        `📊 ${scoreStr}`,
      ].filter(Boolean).join('\n');

    case 'penalty_scored':
      return [
        `⚽ *PENALTY SCORED! ${team}*`,
        playerName ? `👤 ${playerName}` : '',
        min ? `⏱ ${min}` : '',
        `📊 ${scoreStr}`,
      ].filter(Boolean).join('\n');

    case 'own_goal':
      return [
        `😬 *OWN GOAL — ${team}*`,
        playerName ? `👤 ${playerName}` : '',
        min ? `⏱ ${min}` : '',
        `📊 ${scoreStr}`,
      ].filter(Boolean).join('\n');

    case 'yellow_card':
      return `🟨 *Yellow Card* — ${playerName || 'Unknown'} (${team}) ${min ? `⏱ ${min}` : ''}`;

    case 'red_card':
      return [
        `🟥 *RED CARD! ${team}*`,
        playerName ? `👤 ${playerName}` : '',
        min ? `⏱ ${min}` : '',
      ].filter(Boolean).join('\n');

    case 'substitution':
      return [
        `🔄 *Substitution — ${team}*`,
        playerName ? `🟢 On: *${playerName}*` : '',
        playerOut  ? `🔴 Off: *${playerOut}*` : '',
        min ? `⏱ ${min}` : '',
      ].filter(Boolean).join('\n');

    case 'corner_kick':
      return `⛳ *Corner kick* — ${team}${min ? ` ⏱ ${min}` : ''}`;

    case 'penalty_save':
      return [
        `🧤 *PENALTY SAVED!*`,
        playerName ? `👤 Goalkeeper: *${playerName}* (${team})` : `${team}`,
        min ? `⏱ ${min}` : '',
        `📊 ${scoreStr}`,
      ].filter(Boolean).join('\n');

    case 'penalty_missed':
    case 'penalty_missed_shootout':
      return `❌ *Penalty missed* — ${playerName || team}${min ? ` ⏱ ${min}` : ''}`;

    case 'penalty_won':
    case 'penalty_conceded':
      return `🎯 *Penalty awarded to ${team}*${min ? ` ⏱ ${min}` : ''}${playerName ? `\n👤 Won by: ${playerName}` : ''}`;

    case 'var_review':
      return `📺 *VAR Review* — ${team || `${homeTeam} vs ${awayTeam}`}${min ? ` ⏱ ${min}` : ''}`;

    case 'kick_off':
      return `🟢 *Kick Off!*\n${homeFlag} ${homeTeam} vs ${awayTeam} ${awayFlag}`;

    case 'half_time':
      return `⏱ *Half Time*\n📊 ${scoreStr}`;

    case 'full_time':
      return `🏁 *FULL TIME!*\n📊 ${scoreStr}`;

    case 'extra_time':
      return `⏰ *Extra Time begins!*\n📊 ${scoreStr}`;

    case 'danger_attack':
      return `⚡ *Danger Attack — ${team}*${min ? ` ⏱ ${min}` : ''}\n${description ? `_${description}_` : ''}`;

    case 'assist':
      return `🎯 *Assist* — ${playerName} (${team})${min ? ` ⏱ ${min}` : ''}`;

    case 'goalkeeper_save':
      return `🧤 *Save* — ${playerName} (${team})${min ? ` ⏱ ${min}` : ''}`;

    case 'starting_xi':
      return `📋 *${team} Starting XI confirmed*`;

    default:
      return `📣 *${eventType.replace(/_/g, ' ')}*${team ? ` — ${team}` : ''}${playerName ? ` | ${playerName}` : ''}${min ? ` ⏱ ${min}` : ''}`;
  }
}
