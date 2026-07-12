import { NextResponse } from 'next/server';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';

const FLAG: Record<string, string> = {
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

const ALIASES: Record<string, string> = {
  "côte d'ivoire": 'Ivory Coast', "cote d'ivoire": 'Ivory Coast',
  'cote divoire': 'Ivory Coast', 'dem. rep. congo': 'Congo DR',
  'dr congo': 'Congo DR', 'democratic republic of congo': 'Congo DR',
  'republic of korea': 'South Korea', 'korea republic': 'South Korea',
  'united states': 'USA', 'czechia': 'Czech Republic',
  'cape verde islands': 'Cape Verde',
  'bosnia and herzegovina': 'Bosnia & Herzegovina',
  'bosnia & hercegovina': 'Bosnia & Herzegovina',
};

function norm(s: string) { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }
function resolve(name: string) { return ALIASES[name.toLowerCase().trim()] ?? name; }
function flag(name: string) { return FLAG[name] ?? '🏳️'; }

const BACKUP_SCORE_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

export type RecentScore = {
  homeTeam: string; awayTeam: string;
  homeFlag: string; awayFlag: string;
  kickoffAt: string;
  scoreHome: number | null; scoreAway: number | null;
  source: 'txline' | 'backup' | 'static';
};

// GET /api/scores/recent
// Returns up to 3 recently finished WC 2026 matches with scores.
// Primary: TxLINE snapshot. Backup data source fills in any missing scores.
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app';
  const now = Date.now();
  const cutoff = now - 48 * 3_600_000;

  const results = new Map<string, RecentScore>();

  // ── Step 1: TxLINE snapshot ──────────────────────────────────────────────
  try {
    const res = await fetch(`${appUrl}/api/txline/api/fixtures/snapshot`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const raw = await res.json();
      const fixtures: any[] = Array.isArray(raw) ? raw : (raw?.fixtures ?? raw?.data ?? []);

      for (const tf of fixtures) {
        const kickoffAt = tf.StartTime ?? '';
        if (!kickoffAt) continue;
        const kickoffMs = new Date(kickoffAt).getTime();
        if (kickoffMs < cutoff || kickoffMs > now) continue;

        const rawState = tf.GameState ?? tf.gameState ?? tf.Status ?? tf.status ?? '';
        const strState = String(rawState).toLowerCase();
        const intState = typeof rawState === 'number' ? rawState : null;
        const isFinished =
          [9, 10, 11].includes(intState as number) ||
          ['fulltime', 'finished', 'postgame', 'abandoned'].some(s => strState.includes(s));
        if (!isFinished) continue;

        const comp = (tf.CompetitionName ?? '').toLowerCase();
        if (!comp.includes('world cup')) continue;

        const isP1Home = tf.Participant1IsHome !== false;
        const rawHome = isP1Home ? (tf.Participant1 ?? '') : (tf.Participant2 ?? '');
        const rawAway = isP1Home ? (tf.Participant2 ?? '') : (tf.Participant1 ?? '');
        const homeTeam = resolve(rawHome);
        const awayTeam = resolve(rawAway);
        if (!homeTeam || !awayTeam) continue;

        const p1G = tf.Score?.Participant1?.Total?.Goals ?? tf.Score?.Participant1?.Goals;
        const p2G = tf.Score?.Participant2?.Total?.Goals ?? tf.Score?.Participant2?.Goals;
        const sh = typeof p1G === 'number' ? (isP1Home ? p1G : p2G) : null;
        const sa = typeof p2G === 'number' ? (isP1Home ? p2G : p1G) : null;

        const key = `${norm(homeTeam)}__${norm(awayTeam)}`;
        results.set(key, {
          homeTeam, awayTeam,
          homeFlag: flag(homeTeam), awayFlag: flag(awayTeam),
          kickoffAt,
          scoreHome: sh as number | null,
          scoreAway: sa as number | null,
          source: 'txline',
        });
      }
    }
  } catch { /* TxLINE unavailable */ }

  // ── Step 2: Seed from static fixture list for matches TxLINE didn't report ─
  const staticFinished = WC2026_FIXTURES
    .filter(f => {
      const ms = new Date(f.kickoffAt).getTime();
      return ms >= cutoff && ms <= now;
    })
    .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime());

  for (const f of staticFinished) {
    const k1 = `${norm(f.homeTeam)}__${norm(f.awayTeam)}`;
    const k2 = `${norm(f.awayTeam)}__${norm(f.homeTeam)}`;
    if (!results.has(k1) && !results.has(k2)) {
      results.set(k1, {
        homeTeam: f.homeTeam, awayTeam: f.awayTeam,
        homeFlag: f.homeFlag, awayFlag: f.awayFlag,
        kickoffAt: f.kickoffAt,
        scoreHome: null, scoreAway: null,
        source: 'static',
      });
    }
  }

  // ── Step 3: Backup source for any entry still missing scores ─────────────
  const needScore = Array.from(results.values()).filter(r => r.scoreHome === null);

  if (needScore.length > 0) {
    const dates = new Set<string>();
    for (let i = 0; i <= 2; i++) {
      const d = new Date(now - i * 86_400_000);
      dates.add(
        `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
      );
    }

    const backupEvents: any[] = [];
    await Promise.all(
      [...dates].map(async dateStr => {
        try {
          const r = await fetch(
            `${BACKUP_SCORE_URL}?dates=${dateStr}&limit=20`,
            { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 120 } }
          );
          if (r.ok) backupEvents.push(...((await r.json()).events ?? []));
        } catch { /* backup source unavailable for this date */ }
      })
    );

    for (const ev of backupEvents) {
      const comp = ev.competitions?.[0];
      if (!comp?.status?.type?.completed) continue;

      const homeComp = comp.competitors?.find((c: any) => c.homeAway === 'home');
      const awayComp = comp.competitors?.find((c: any) => c.homeAway === 'away');
      if (!homeComp || !awayComp) continue;

      const backupHome = resolve(homeComp.team?.displayName ?? '');
      const backupAway = resolve(awayComp.team?.displayName ?? '');
      const sh = parseInt(homeComp.score ?? '', 10);
      const sa = parseInt(awayComp.score ?? '', 10);
      if (!backupHome || !backupAway || isNaN(sh) || isNaN(sa)) continue;

      for (const [, result] of results) {
        if (result.scoreHome !== null) continue;
        const matchNormal =
          norm(result.homeTeam) === norm(backupHome) && norm(result.awayTeam) === norm(backupAway);
        const matchReversed =
          norm(result.homeTeam) === norm(backupAway) && norm(result.awayTeam) === norm(backupHome);
        if (matchNormal) {
          result.scoreHome = sh; result.scoreAway = sa; result.source = 'backup';
        } else if (matchReversed) {
          result.scoreHome = sa; result.scoreAway = sh; result.source = 'backup';
        }
      }
    }
  }

  const sorted = Array.from(results.values())
    .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime())
    .slice(0, 3);

  return NextResponse.json(sorted, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
