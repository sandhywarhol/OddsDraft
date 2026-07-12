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

    // Track which fixture IDs and stages TxLINE confirms with real (non-TBD) teams
    const txLineIds = new Set<string>();
    const txLineStagesWithRealTeams = new Set<WCFixture['stage']>();
    const isTbd = (t: string) => !t || t.toLowerCase() === 'tbd' || normStr(t).includes('winner') || normStr(t).includes('loser');

    // Enrich / add from TxLINE data
    for (const tf of txFixtures) {
      const txId = String(tf.FixtureId ?? tf.fixtureId ?? '');
      if (!txId) continue;
      txLineIds.add(txId);

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
        if (!isTbd(home)) { updated.homeTeam = home; updated.homeFlag = getFlag(home) || updated.homeFlag; }
        if (!isTbd(away)) { updated.awayTeam = away; updated.awayFlag = getFlag(away) || updated.awayFlag; }
      } else if (!isTbd(home) && !isTbd(away) && kickoffAt) {
        // New fixture from TxLINE not in our static list — add it (e.g., SF/Final with real teams)
        const comp = (tf.CompetitionName ?? tf.RoundName ?? '').toLowerCase();
        const stage: WCFixture['stage'] = (() => {
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

      // Track stages where TxLINE has confirmed real (non-TBD) teams
      if (!isTbd(home) && !isTbd(away)) {
        const comp = (tf.CompetitionName ?? tf.RoundName ?? '').toLowerCase();
        if (comp.includes('semi')) txLineStagesWithRealTeams.add('sf');
        else if (comp.includes('final')) txLineStagesWithRealTeams.add('final');
        else if (comp.includes('quarter')) txLineStagesWithRealTeams.add('qf');
        else if (comp.includes('16')) txLineStagesWithRealTeams.add('r16');
        else if (comp.includes('32')) txLineStagesWithRealTeams.add('r32');
      }
    }

    // Purge static placeholder entries for stages TxLINE has confirmed real fixtures for.
    // Static entries with fake IDs (e.g. 18220001 for SF) have wrong/guessed team names —
    // TxLINE's real fixtures for those stages were already added via the else branch above.
    const idsToRemove: string[] = [];
    for (const [id, fixture] of resultMap) {
      if (!txLineIds.has(id) && txLineStagesWithRealTeams.has(fixture.stage)) {
        idsToRemove.push(id);
      }
    }
    for (const id of idsToRemove) resultMap.delete(id);

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
