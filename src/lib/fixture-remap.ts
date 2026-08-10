import { createClient } from '@supabase/supabase-js';
import { resolveEspnEventId } from './espn';
import { LEAGUES } from './leagues';

// fixture_id_remap table now stores: our_id → espn_id (was: our_id → txline_id)
// If you have old rows with txline_id, they can coexist — we only look up espn_id here.

// Server-side process-level cache — survives across requests, invalidates every 5 min
let _cache: Record<string, string> | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

function makeClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function getFixtureIdRemap(): Promise<Record<string, string>> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL_MS) return _cache;

  try {
    const { data, error } = await makeClient()
      .from('fixture_id_remap')
      .select('our_id, espn_id');

    if (!error && data?.length) {
      _cache = Object.fromEntries(
        data
          .filter((r: { our_id: string; espn_id: string | null }) => r.espn_id)
          .map((r: { our_id: string; espn_id: string }) => [r.our_id, r.espn_id])
      );
      _cacheTime = Date.now();
      return _cache!;
    }
  } catch { /* fall through */ }

  return {};
}

/** Resolve a single ID — returns ourId unchanged if no mapping exists. */
export async function getTxLineId(ourId: string): Promise<string> {
  const remap = await getFixtureIdRemap();
  return remap[ourId] ?? ourId;
}

/** Invalidate the server-side cache. */
export function invalidateRemapCache() {
  _cache = null;
  _cacheTime = 0;
}

/**
 * Discover the real ESPN Event ID for a match we only know by kickoff time.
 * Searches all tracked leagues for a fixture with matching teams or timing.
 * If found and different from ourId, writes the espn_id to Supabase.
 * Returns null when nothing is found.
 */
export async function discoverAndSync(
  ourId: string,
  kickoffISO: string,
  _appUrl: string,   // kept for backward compat but not used — we call ESPN directly
  leagueSlug?: string,
): Promise<string | null> {
  try {
    const kickoffMs = new Date(kickoffISO).getTime();
    if (!kickoffMs) return null;

    // Try the provided league first, then all leagues
    const slugsToTry = leagueSlug
      ? [leagueSlug, ...LEAGUES.map(l => l.espnSlug).filter(s => s !== leagueSlug)]
      : LEAGUES.map(l => l.espnSlug);

    // We don't have team names here, so we use resolveEspnEventId differently:
    // Scan the scoreboard for each league and find by kickoff time proximity.
    const { fetchEspnFixtures } = await import('./espn');
    const dateStr = (ms: number) => {
      const d = new Date(ms);
      return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
    };
    const dates = [dateStr(kickoffMs), dateStr(kickoffMs + 24 * 3_600_000)].join(',');
    const WINDOW = 90 * 60 * 1000; // ±90 min

    for (const slug of slugsToTry) {
      try {
        const fixtures = await fetchEspnFixtures(slug, dates, slug);
        const match = fixtures.find(f => {
          const fMs = new Date(f.kickoffAt).getTime();
          return fMs > 0 && Math.abs(fMs - kickoffMs) < WINDOW;
        });
        if (!match) continue;

        const espnId = match.espnId;
        if (!espnId || espnId === ourId) return espnId || null;

        // Persist to Supabase
        try {
          await makeClient()
            .from('fixture_id_remap')
            .upsert({ our_id: ourId, espn_id: espnId }, { onConflict: 'our_id' });
          invalidateRemapCache();
          console.log(`[fixture-remap] Auto-synced: ${ourId} → ESPN ${espnId} (${match.homeTeam} vs ${match.awayTeam})`);
        } catch (dbErr) {
          console.warn('[fixture-remap] Supabase write failed (continuing):', dbErr);
        }

        return espnId;
      } catch { /* try next league */ }
    }

    return null;
  } catch { return null; }
}

// ── Backward compat alias ─────────────────────────────────────────────────────
export { discoverAndSync as discoverAndSyncEspn };
