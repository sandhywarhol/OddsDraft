// ESPN backup source for match completion status.
// Used when TxLINE (the primary live feed) stays silent on a fixture that
// should already be over — without this, matches TxLINE never reports as
// finished would block users from claiming SOL/card rewards forever.

const ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

const TEAM_ALIASES: Record<string, string> = {
  "côte d'ivoire": 'Ivory Coast', "cote d'ivoire": 'Ivory Coast',
  'cote divoire': 'Ivory Coast', 'dem. rep. congo': 'Congo DR',
  'dr congo': 'Congo DR', 'democratic republic of congo': 'Congo DR',
  'republic of korea': 'South Korea', 'korea republic': 'South Korea',
  'united states': 'USA', 'czechia': 'Czech Republic',
  'cape verde islands': 'Cape Verde',
  'bosnia and herzegovina': 'Bosnia & Herzegovina',
  'bosnia & hercegovina': 'Bosnia & Herzegovina',
};

function resolveTeam(name: string): string {
  return TEAM_ALIASES[name.toLowerCase().trim()] ?? name;
}

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

function dateStr(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

export type EspnMatchStatus = {
  completed: boolean;
  scoreHome: number;
  scoreAway: number;
};

// Looks up a fixture on ESPN's WC 2026 scoreboard by team names + kickoff time
// and reports whether ESPN considers the match finished. Checks the kickoff
// date and the following UTC date to cover matches that cross midnight UTC.
export async function checkEspnMatchStatus(
  homeTeam: string,
  awayTeam: string,
  kickoffAt: string
): Promise<EspnMatchStatus | null> {
  const kickoffMs = new Date(kickoffAt).getTime();
  if (!kickoffMs) return null;

  const dates = [dateStr(kickoffMs), dateStr(kickoffMs + 24 * 3_600_000)];
  const home = norm(resolveTeam(homeTeam));
  const away = norm(resolveTeam(awayTeam));

  for (const d of dates) {
    try {
      const r = await fetch(`${ESPN_SCOREBOARD_URL}?dates=${d}&limit=50`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        cache: 'no-store',
      });
      if (!r.ok) continue;
      const events: any[] = (await r.json()).events ?? [];

      for (const ev of events) {
        const comp = ev.competitions?.[0];
        const homeComp = comp?.competitors?.find((c: any) => c.homeAway === 'home');
        const awayComp = comp?.competitors?.find((c: any) => c.homeAway === 'away');
        if (!homeComp || !awayComp) continue;

        const espnHome = norm(resolveTeam(homeComp.team?.displayName ?? ''));
        const espnAway = norm(resolveTeam(awayComp.team?.displayName ?? ''));
        const matchNormal = espnHome === home && espnAway === away;
        const matchReversed = espnHome === away && espnAway === home;
        if (!matchNormal && !matchReversed) continue;

        // Kickoff times must be within a few hours of each other to avoid
        // matching a rematch/friendly between the same two teams.
        const evTime = new Date(ev.date ?? '').getTime();
        if (evTime && Math.abs(evTime - kickoffMs) > 4 * 3_600_000) continue;

        const completed = !!comp?.status?.type?.completed;
        const sh = parseInt(homeComp.score ?? '', 10);
        const sa = parseInt(awayComp.score ?? '', 10);
        if (isNaN(sh) || isNaN(sa)) return { completed, scoreHome: 0, scoreAway: 0 };

        return {
          completed,
          scoreHome: matchReversed ? sa : sh,
          scoreAway: matchReversed ? sh : sa,
        };
      }
    } catch { /* ESPN unavailable for this date — try next / give up */ }
  }

  return null;
}
