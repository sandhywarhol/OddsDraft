import { NextResponse } from 'next/server';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';
import type { WCFixture } from '@/lib/wc2026-fixtures';

// Canonical team name → flag emoji (mirrors wc2026-fixtures.ts)
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

// TxLINE name aliases → our canonical name
const TXLINE_ALIASES: Record<string, string> = {
  'côte d\'ivoire': 'Ivory Coast',
  'cote d\'ivoire': 'Ivory Coast',
  'cote divoire':   'Ivory Coast',
  'dem. rep. congo': 'Congo DR',
  'dr congo':        'Congo DR',
  'democratic republic of congo': 'Congo DR',
  'republic of korea': 'South Korea',
  'korea republic':    'South Korea',
  'united states':     'USA',
  'czechia':           'Czech Republic',
  'cape verde islands':'Cape Verde',
  'bosnia and herzegovina': 'Bosnia & Herzegovina',
  'bosnia & hercegovina':   'Bosnia & Herzegovina',
};

function resolveTeam(name: string): string {
  const lower = name.toLowerCase().trim();
  return TXLINE_ALIASES[lower] ?? name;
}

function getFlag(name: string): string {
  return FLAG[name] ?? '🏳️';
}

function normStr(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '').trim();
}

// GET /api/schedule/wc2026 — returns WCFixture[] sourced from TxLINE (no ESPN)
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app';

  try {
    const res = await fetch(`${appUrl}/api/txline/api/fixtures/snapshot`, {
      next: { revalidate: 300 }, // 5-min cache
    });

    if (!res.ok) throw new Error(`TxLINE ${res.status}`);
    const raw = await res.json();
    const txFixtures: any[] = Array.isArray(raw) ? raw : (raw?.fixtures ?? raw?.data ?? []);

    if (txFixtures.length === 0) throw new Error('Empty TxLINE response');

    // Build lookup: normalised team pair → our static WCFixture
    const staticByTeams = new Map<string, WCFixture>();
    for (const f of WC2026_FIXTURES) {
      staticByTeams.set(`${normStr(f.homeTeam)}__${normStr(f.awayTeam)}`, f);
      staticByTeams.set(`${normStr(f.awayTeam)}__${normStr(f.homeTeam)}`, f);
    }
    const staticById = new Map<string, WCFixture>(WC2026_FIXTURES.map(f => [f.fixtureId, f]));

    // Start with our full static list as the base — preserves group stage and r32/r16
    const resultMap = new Map<string, WCFixture>(WC2026_FIXTURES.map(f => [f.fixtureId, { ...f }]));

    // Enrich / add from TxLINE data
    for (const tf of txFixtures) {
      const txId = String(tf.FixtureId ?? tf.fixtureId ?? '');
      if (!txId) continue;

      const rawP1 = tf.Participant1 ?? '';
      const rawP2 = tf.Participant2 ?? '';
      const isP1Home = tf.Participant1IsHome !== false;
      const homeRaw = isP1Home ? rawP1 : rawP2;
      const awayRaw = isP1Home ? rawP2 : rawP1;
      const home = resolveTeam(homeRaw) || homeRaw;
      const away = resolveTeam(awayRaw) || awayRaw;
      const kickoffAt = tf.StartTime ?? '';

      // Find match in our static list by ID first, then by team names
      let match = staticById.get(txId);
      if (!match) {
        match = staticByTeams.get(`${normStr(home)}__${normStr(away)}`)
             ?? staticByTeams.get(`${normStr(away)}__${normStr(home)}`);
      }

      if (match) {
        // Update the existing entry with live TxLINE data
        const updated = resultMap.get(match.fixtureId)!;
        if (kickoffAt) updated.kickoffAt = kickoffAt;
        // Update team names for knockout fixtures where teams were unknown at time of writing
        if (home && home !== 'TBD' && !normStr(home).includes('winner') && !normStr(home).includes('loser')) {
          updated.homeTeam = home;
          updated.homeFlag = getFlag(home) || updated.homeFlag;
        }
        if (away && away !== 'TBD' && !normStr(away).includes('winner') && !normStr(away).includes('loser')) {
          updated.awayTeam = away;
          updated.awayFlag = getFlag(away) || updated.awayFlag;
        }
      } else if (home && away && kickoffAt) {
        // New fixture from TxLINE not in our static list — add it (e.g., SF/Final with real teams)
        const stage: WCFixture['stage'] = (() => {
          const comp = (tf.CompetitionName ?? tf.RoundName ?? '').toLowerCase();
          if (comp.includes('semi')) return 'sf';
          if (comp.includes('final')) return 'final';
          if (comp.includes('quarter')) return 'qf';
          if (comp.includes('16')) return 'r16';
          if (comp.includes('32')) return 'r32';
          return 'group';
        })();
        resultMap.set(txId, {
          fixtureId: txId,
          homeTeam: home,
          awayTeam: away,
          homeFlag: getFlag(home),
          awayFlag: getFlag(away),
          kickoffAt,
          stage,
        });
      }
    }

    const fixtures = Array.from(resultMap.values()).sort(
      (a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
    );

    return NextResponse.json(fixtures, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.warn('[schedule/wc2026] TxLINE unavailable, returning static list:', err);
    return NextResponse.json(WC2026_FIXTURES, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  }
}
