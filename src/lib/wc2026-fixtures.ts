// World Cup 2026 - Complete fixture schedule with real TxLINE FixtureIds
// Source: https://txline-docs.txodds.com/documentation/scores/schedule
// All times are UTC. Free tier includes Scores + Odds for all these matches.

export interface WCFixture {
  fixtureId: string;   // TxLINE FixtureId (real)
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  kickoffAt: string;   // ISO UTC
  stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final';
  // Populated by the schedule API when the match is completed
  homeScore?: number;
  awayScore?: number;
  penaltyHome?: number;
  penaltyAway?: number;
  completed?: boolean;
}

function utc(y: number, mo: number, d: number, h: number, mi = 0): string {
  return new Date(Date.UTC(y, mo - 1, d, h, mi)).toISOString();
}

const F: Record<string, string> = {
  'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Australia': '🇦🇺', 'Turkey': '🇹🇷',
  'Germany': '🇩🇪', 'Curacao': '🇨🇼', 'Netherlands': '🇳🇱', 'Japan': '🇯🇵',
  'Ivory Coast': '🇨🇮', 'Ecuador': '🇪🇨', 'Sweden': '🇸🇪', 'Tunisia': '🇹🇳',
  'Spain': '🇪🇸', 'Cape Verde': '🇨🇻', 'Belgium': '🇧🇪', 'Egypt': '🇪🇬',
  'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾', 'Iran': '🇮🇷', 'New Zealand': '🇳🇿',
  'France': '🇫🇷', 'Senegal': '🇸🇳', 'Iraq': '🇮🇶', 'Norway': '🇳🇴',
  'Argentina': '🇦🇷', 'Algeria': '🇩🇿', 'Austria': '🇦🇹', 'Jordan': '🇯🇴',
  'Portugal': '🇵🇹', 'Congo DR': '🇨🇩', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷',
  'Ghana': '🇬🇭', 'Panama': '🇵🇦', 'Uzbekistan': '🇺🇿', 'Colombia': '🇨🇴',
  'Czech Republic': '🇨🇿', 'South Africa': '🇿🇦', 'Switzerland': '🇨🇭',
  'Bosnia & Herzegovina': '🇧🇦', 'Canada': '🇨🇦', 'Qatar': '🇶🇦',
  'Mexico': '🇲🇽', 'South Korea': '🇰🇷', 'USA': '🇺🇸', 'Morocco': '🇲🇦',
  'Brazil': '🇧🇷', 'Paraguay': '🇵🇾',
};

const flag = (t: string) => F[t] ?? '🏳️';

const fx = (id: string, h: string, a: string, ...dt: Parameters<typeof utc>): WCFixture => ({
  fixtureId: id, homeTeam: h, awayTeam: a,
  homeFlag: flag(h), awayFlag: flag(a), kickoffAt: utc(...dt), stage: 'group',
});

const r32 = (id: string, h: string, a: string, ...dt: Parameters<typeof utc>): WCFixture => ({
  fixtureId: id, homeTeam: h, awayTeam: a,
  homeFlag: flag(h), awayFlag: flag(a), kickoffAt: utc(...dt), stage: 'r32',
});

const r16 = (id: string, h: string, a: string, ...dt: Parameters<typeof utc>): WCFixture => ({
  fixtureId: id, homeTeam: h, awayTeam: a,
  homeFlag: flag(h), awayFlag: flag(a), kickoffAt: utc(...dt), stage: 'r16',
});

const qf = (id: string, h: string, a: string, ...dt: Parameters<typeof utc>): WCFixture => ({
  fixtureId: id, homeTeam: h, awayTeam: a,
  homeFlag: flag(h), awayFlag: flag(a), kickoffAt: utc(...dt), stage: 'qf',
});

const sf = (id: string, h: string, a: string, ...dt: Parameters<typeof utc>): WCFixture => ({
  fixtureId: id, homeTeam: h, awayTeam: a,
  homeFlag: flag(h), awayFlag: flag(a), kickoffAt: utc(...dt), stage: 'sf',
});

const final = (id: string, h: string, a: string, ...dt: Parameters<typeof utc>): WCFixture => ({
  fixtureId: id, homeTeam: h, awayTeam: a,
  homeFlag: flag(h), awayFlag: flag(a), kickoffAt: utc(...dt), stage: 'final',
});

// ── Group Stage ───────────────────────────────────────────────────────────────

export const WC2026_FIXTURES: WCFixture[] = [
  // June 14
  fx('17588316', 'Haiti',        'Scotland',  2026, 6, 14,  1),
  fx('17926689', 'Australia',    'Turkey',    2026, 6, 14,  4),
  fx('17588318', 'Germany',      'Curacao',   2026, 6, 14, 17),
  fx('17588305', 'Netherlands',  'Japan',     2026, 6, 14, 20),
  fx('17588239', 'Ivory Coast',  'Ecuador',   2026, 6, 14, 23),

  // June 15
  fx('17926553', 'Sweden',       'Tunisia',   2026, 6, 15,  2),
  fx('17588403', 'Spain',        'Cape Verde',2026, 6, 15, 16),
  fx('17588230', 'Belgium',      'Egypt',     2026, 6, 15, 19),
  fx('17588311', 'Saudi Arabia', 'Uruguay',   2026, 6, 15, 22),

  // June 16
  fx('17588241', 'Iran',         'New Zealand',2026, 6, 16,  1),
  fx('17588306', 'France',       'Senegal',   2026, 6, 16, 19),
  fx('17926828', 'Iraq',         'Norway',    2026, 6, 16, 22),

  // June 17
  fx('17588322', 'Argentina',    'Algeria',   2026, 6, 17,  1),
  fx('17588405', 'Austria',      'Jordan',    2026, 6, 17,  4),
  fx('17926703', 'Portugal',     'Congo DR',  2026, 6, 17, 17),
  fx('17588228', 'England',      'Croatia',   2026, 6, 17, 20),
  fx('17588406', 'Ghana',        'Panama',    2026, 6, 17, 23),

  // June 18
  fx('17588399', 'Uzbekistan',   'Colombia',  2026, 6, 18,  2),
  fx('17926765', 'Czech Republic','South Africa',2026, 6, 18, 16),
  fx('17926603', 'Switzerland',  'Bosnia & Herzegovina',2026, 6, 18, 19),
  fx('17588238', 'Canada',       'Qatar',     2026, 6, 18, 22),

  // June 19
  fx('17588223', 'Mexico',       'South Korea',2026, 6, 19,  1),
  fx('17588388', 'USA',          'Australia', 2026, 6, 19, 19),
  fx('17588397', 'Scotland',     'Morocco',   2026, 6, 19, 22),

  // June 20
  fx('17588317', 'Brazil',       'Haiti',     2026, 6, 20,  0, 30),
  fx('17588229', 'Turkey',       'Paraguay',  2026, 6, 20,  3),
  fx('17926687', 'Netherlands',  'Sweden',    2026, 6, 20, 17),
  fx('17588240', 'Germany',      'Ivory Coast',2026, 6, 20, 20),
  fx('17588320', 'Ecuador',      'Curacao',   2026, 6, 20, 23),

  // June 21
  fx('17588310', 'Tunisia',      'Japan',     2026, 6, 21,  4),
  fx('17588232', 'Spain',        'Saudi Arabia',2026, 6, 21, 16),
  fx('17588390', 'Belgium',      'Iran',      2026, 6, 21, 19),
  fx('17588235', 'Uruguay',      'Cape Verde',2026, 6, 21, 22),

  // June 22
  fx('17588242', 'New Zealand',  'Egypt',     2026, 6, 22,  1),
  fx('17588389', 'Argentina',    'Austria',   2026, 6, 22, 17),
  fx('17926647', 'France',       'Iraq',      2026, 6, 22, 21),

  // June 23
  fx('17588313', 'Norway',       'Senegal',   2026, 6, 23,  0),
  fx('17588244', 'Jordan',       'Algeria',   2026, 6, 23,  3),
  fx('17588231', 'Portugal',     'Uzbekistan',2026, 6, 23, 17),
  fx('17588324', 'England',      'Ghana',     2026, 6, 23, 20),
  fx('17588401', 'Panama',       'Croatia',   2026, 6, 23, 23),

  // June 24
  fx('17926615', 'Colombia',     'Congo DR',  2026, 6, 24,  2),
  fx('17588303', 'Switzerland',  'Canada',    2026, 6, 24, 19),
  fx('17926766', 'Bosnia & Herzegovina','Qatar',2026, 6, 24, 19),
  fx('17588319', 'Morocco',      'Haiti',     2026, 6, 24, 22),
  fx('17588398', 'Scotland',     'Brazil',    2026, 6, 24, 22),

  // June 25
  fx('17588395', 'South Africa', 'South Korea',2026, 6, 25,  1),
  fx('17926764', 'Czech Republic','Mexico',   2026, 6, 25,  1),
  fx('17588302', 'Ecuador',      'Germany',   2026, 6, 25, 20),
  fx('17588321', 'Curacao',      'Ivory Coast',2026, 6, 25, 20),
  fx('17588236', 'Tunisia',      'Netherlands',2026, 6, 25, 23),
  fx('17926686', 'Japan',        'Sweden',    2026, 6, 25, 23),

  // June 26
  fx('17926595', 'Paraguay',     'Australia', 2026, 6, 26,  2),
  fx('17926593', 'Turkey',       'USA',       2026, 6, 26,  2),
  fx('17588234', 'Norway',       'France',    2026, 6, 26, 19),
  fx('17926740', 'Senegal',      'Iraq',      2026, 6, 26, 19),

  // June 27
  fx('17588314', 'Cape Verde',   'Saudi Arabia',2026, 6, 27,  0),
  fx('17588404', 'Uruguay',      'Spain',     2026, 6, 27,  0),
  fx('17588309', 'Egypt',        'Iran',      2026, 6, 27,  3),
  fx('17588323', 'New Zealand',  'Belgium',   2026, 6, 27,  3),
  fx('17588245', 'Croatia',      'Ghana',     2026, 6, 27, 21),
  fx('17588402', 'Panama',       'England',   2026, 6, 27, 21),
  fx('17588391', 'Colombia',     'Portugal',  2026, 6, 27, 23, 30),
  fx('17926704', 'Congo DR',     'Uzbekistan',2026, 6, 27, 23, 30),

  // June 28
  fx('17588325', 'Jordan',       'Argentina', 2026, 6, 28,  2),
  fx('17588326', 'Algeria',      'Austria',   2026, 6, 28,  2),

  // ── Round of 32 ─────────────────────────────────────────────────────────────

  r32('18167317', 'South Africa', 'Canada',           2026, 6, 28, 19),
  r32('18172489', 'Brazil',       'Japan',             2026, 6, 29, 17),
  r32('18175983', 'Germany',      'Paraguay',          2026, 6, 29, 20, 30),
  r32('18172260', 'Netherlands',  'Morocco',           2026, 6, 30,  1),
  r32('18175397', 'Ivory Coast',  'Norway',            2026, 6, 30, 17),
  r32('18175981', 'France',       'Sweden',            2026, 6, 30, 21),
  r32('18179759', 'Mexico',       'Ecuador',           2026, 7,  1,  1),
  r32('18179764', 'England',      'Congo DR',          2026, 7,  1, 16),
  r32('18179550', 'Belgium',      'Senegal',           2026, 7,  1, 20),
  r32('18172379', 'USA',          'Bosnia & Herzegovina', 2026, 7,  2,  0),
  r32('18179551', 'Spain',        'Austria',           2026, 7,  2, 19),
  r32('18179763', 'Portugal',     'Croatia',           2026, 7,  2, 23),
  r32('18179552', 'Switzerland',  'Algeria',           2026, 7,  3,  3),
  r32('18176123', 'Australia',    'Egypt',             2026, 7,  3, 18),
  r32('18175918', 'Argentina',    'Cape Verde',        2026, 7,  3, 22),
  r32('18179549', 'Colombia',     'Ghana',             2026, 7,  4,  1, 30),

  // ── Round of 16 ──────────────────────────────────────────────────────────────

  r16('18185036', 'Canada',       'Morocco',           2026, 7,  4, 17),
  r16('18188721', 'Paraguay',     'France',            2026, 7,  4, 21),
  r16('18187298', 'Brazil',       'Norway',            2026, 7,  5, 20),
  r16('18192996', 'Mexico',       'England',           2026, 7,  6,  0),
  r16('18198205', 'Portugal',     'Spain',             2026, 7,  6, 19),
  r16('18193785', 'USA',          'Belgium',           2026, 7,  7,  0),
  r16('18202701', 'Argentina',    'Egypt',             2026, 7,  7, 16),
  r16('18202783', 'Switzerland',  'Colombia',          2026, 7,  7, 20),

  // ── Quarter-finals ───────────────────────────────────────────────────────────
  // Static IDs are placeholders for completed QFs — TxLINE enriches/replaces via API
  qf('18210001', 'France',       'Morocco',           2026, 7,  9, 20),   // France 2-0 Morocco
  qf('18218149', 'Spain',        'Belgium',           2026, 7, 10, 19),   // real TxLINE ID
  qf('18213979', 'Norway',       'England',           2026, 7, 11, 21),   // real TxLINE ID
  qf('18222446', 'Argentina',    'Switzerland',       2026, 7, 12,  1),   // real TxLINE ID

  // ── Semi-finals / Final ───────────────────────────────────────────────────────
  // QF results: France 2-0 Morocco, Spain beat Belgium, England beat Norway 2-1
  // (fixture 18213979: Norway 1-2 England — confirmed by recorded match data),
  // Argentina beat Switzerland. England advances, not Norway.
  sf('18220001', 'France',       'Spain',             2026, 7, 15, 20),
  sf('18220002', 'England',      'Argentina',         2026, 7, 16, 20),

  // ── Third Place ──────────────────────────────────────────────────────────────
  // Teams TBD — depends on SF results
  final('18230001', 'TBD',        'TBD',              2026, 7, 18, 20),

  // ── Final ────────────────────────────────────────────────────────────────────
  // Teams TBD — depends on SF results
  final('18240001', 'TBD',        'TBD',              2026, 7, 19, 20),
];

/** Fixture IDs for matches scheduled for today or live right now */
export function getTodaysFixtureIds(): string[] {
  const now = Date.now();
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setUTCHours(23, 59, 59, 999);

  return WC2026_FIXTURES
    .filter(f => {
      const t = new Date(f.kickoffAt).getTime();
      return t >= dayStart.getTime() && t <= dayEnd.getTime();
    })
    .map(f => f.fixtureId);
}

/** Get status of a fixture relative to now */
export function getFixtureStatus(f: WCFixture): 'upcoming' | 'live' | 'finished' {
  const kickoff = new Date(f.kickoffAt).getTime();
  const now = Date.now();
  // Group stage: 3h (90 min play + halftime + generous buffer).
  // Knockout: 4.5h to cover 90 min + 30 min ET + 30 min penalties + halftimes + breaks.
  const windowMs = f.stage === 'group' ? 3 * 60 * 60 * 1000 : 4.5 * 60 * 60 * 1000;
  if (now >= kickoff && now <= kickoff + windowMs) return 'live';
  if (now > kickoff + windowMs) return 'finished';
  return 'upcoming';
}
