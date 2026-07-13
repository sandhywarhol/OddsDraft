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

    case 'hydration_break':
      return `💧 *Hydration / Drinks Break*${min ? ` ⏱ ${min}` : ''}`;

    default:
      return `📣 *${eventType.replace(/_/g, ' ')}*${team ? ` — ${team}` : ''}${playerName ? ` | ${playerName}` : ''}${min ? ` ⏱ ${min}` : ''}`;
  }
}

export interface MatchStatsPayload {
  label: string;             // 'Half Time' | 'Full Time'
  homeTeam: string;
  awayTeam: string;
  homeFlag?: string;
  awayFlag?: string;
  score: { home: number; away: number };
  stats: {
    goals:    [number, number];
    corners:  [number, number];
    yellows:  [number, number];
    reds:     [number, number];
    saves:    [number, number];
    subs:     [number, number];
    dangers:  [number, number];
  };
}

// ── Leaderboard formatters ────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  displayName?: string;   // Telegram @username or truncated wallet
  points: number;
}

export interface LeaderboardPayload {
  homeTeam: string;
  awayTeam: string;
  homeFlag?: string;
  awayFlag?: string;
  score?: { home: number; away: number };
  label: string;           // 'Half Time' | 'Full Time' | 'Live Update'
  entries: LeaderboardEntry[];
  totalParticipants: number;
}

export function formatLeaderboard(p: LeaderboardPayload): string {
  const hf = p.homeFlag ?? '';
  const af = p.awayFlag ?? '';
  const matchLine = p.score != null
    ? `${hf} ${p.homeTeam} *${p.score.home}–${p.score.away}* ${p.awayTeam} ${af}`
    : `${hf} ${p.homeTeam} vs ${p.awayTeam} ${af}`;

  const labelEmoji = p.label === 'Full Time' ? '🏁' : p.label === 'Half Time' ? '⏱' : '📡';
  const top = p.entries.slice(0, 10);
  const medals = ['🥇', '🥈', '🥉'];

  const rows = top.map((e, i) => {
    const prefix = medals[i] ?? `${e.rank}.`;
    const name = e.displayName ?? `${e.walletAddress.slice(0, 4)}…${e.walletAddress.slice(-4)}`;
    return `${prefix} ${name} — *${e.points} pts*`;
  });

  return [
    `🏆 *LEADERBOARD — ${p.homeTeam} vs ${p.awayTeam}*`,
    `${labelEmoji} ${p.label} | ${matchLine}`,
    '',
    ...rows,
    '',
    `_${p.totalParticipants} contestant${p.totalParticipants !== 1 ? 's' : ''} competing_`,
  ].join('\n');
}

export function formatPersonalPoints(p: {
  homeTeam: string;
  awayTeam: string;
  homeFlag?: string;
  awayFlag?: string;
  label: string;
  points: number;
  rank: number;
  totalParticipants: number;
}): string {
  const hf = p.homeFlag ?? '';
  const af = p.awayFlag ?? '';
  const labelEmoji = p.label === 'Full Time' ? '🏁' : p.label === 'Half Time' ? '⏱' : '📡';
  const rankEmoji = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : '📊';

  return [
    `🎮 *Your Fantasy Points*`,
    `${hf} ${p.homeTeam} vs ${p.awayTeam} ${af} | ${labelEmoji} ${p.label}`,
    '',
    `${rankEmoji} Rank: *#${p.rank}* of ${p.totalParticipants}`,
    `⭐ Score: *${p.points} pts*`,
  ].join('\n');
}

export function formatMatchStats(p: MatchStatsPayload): string {
  const hf = p.homeFlag ?? '';
  const af = p.awayFlag ?? '';
  const scoreStr = `${hf} *${p.homeTeam} ${p.score.home}–${p.score.away} ${p.awayTeam}* ${af}`;

  const bar = (h: number, a: number) => {
    const total = h + a || 1;
    const hPct = Math.round((h / total) * 8);
    const aPct = 8 - hPct;
    return `${'█'.repeat(hPct)}${'░'.repeat(aPct)}`;
  };

  const row = (emoji: string, label: string, h: number, a: number) =>
    `${emoji} ${label}: *${h}* ${bar(h, a)} *${a}*`;

  const { goals, corners, yellows, reds, saves, subs, dangers } = p.stats;

  return [
    p.label === 'Half Time' ? `⏱ *HALF TIME STATISTICS*` : `🏁 *FULL TIME STATISTICS*`,
    scoreStr,
    '',
    `_${p.homeTeam}  ░░░░░░░░░░  ${p.awayTeam}_`,
    row('⚽', 'Goals   ', goals[0], goals[1]),
    row('⛳', 'Corners ', corners[0], corners[1]),
    row('🧤', 'Saves   ', saves[0], saves[1]),
    row('⚡', 'Attacks ', dangers[0], dangers[1]),
    row('🟨', 'Yellows ', yellows[0], yellows[1]),
    reds[0] + reds[1] > 0 ? row('🟥', 'Reds    ', reds[0], reds[1]) : '',
    row('🔄', 'Subs    ', subs[0], subs[1]),
  ].filter(s => s !== undefined).join('\n');
}
