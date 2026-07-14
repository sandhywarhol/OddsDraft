import { createClient } from '@supabase/supabase-js';

// Fallback used when Supabase is unreachable — keep only current unknowns.
// Spain vs Belgium QF (18210002→18218149) is done; Norway/Argentina QFs now
// have correct TxLINE IDs directly in wc2026-fixtures.ts. Only SF/Final
// placeholder IDs need remapping — filled in automatically by discoverAndSync().
const FALLBACK: Record<string, string> = {};

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
      .select('our_id, txline_id');

    if (!error && data?.length) {
      _cache = Object.fromEntries(data.map((r: { our_id: string; txline_id: string }) => [r.our_id, r.txline_id]));
      _cacheTime = Date.now();
      return _cache;
    }
  } catch { /* fall through to hardcoded fallback */ }

  return FALLBACK;
}

/** Resolve a single ID — returns ourId unchanged if no mapping exists. */
export async function getTxLineId(ourId: string): Promise<string> {
  const remap = await getFixtureIdRemap();
  return remap[ourId] ?? ourId;
}

/** Invalidate the server-side cache (call after a POST /api/fixture-remap). */
export function invalidateRemapCache() {
  _cache = null;
  _cacheTime = 0;
}

/**
 * Discover the real TxLINE fixture ID for a match we only know by kickoff time.
 * Matches any TxLINE fixture whose StartTime is within ±40 minutes of kickoffISO.
 * If found and different from ourId, writes the mapping to Supabase and returns the TxLINE ID.
 * Returns null when nothing is found (TxLINE may not have the fixture yet).
 */
export async function discoverAndSync(
  ourId: string,
  kickoffISO: string,
  appUrl: string,
): Promise<string | null> {
  try {
    const kickoffMs = new Date(kickoffISO).getTime();
    if (!kickoffMs) return null;
    const WINDOW = 90 * 60 * 1000; // ±90 min tolerance (SF kickoffs can be ≥1h off from our static time)

    const res = await fetch(`${appUrl}/api/txline/api/fixtures/snapshot`, { cache: 'no-store' });
    if (!res.ok) return null;
    const raw = await res.json();
    const fixtures: any[] = Array.isArray(raw) ? raw : (raw?.fixtures ?? raw?.data ?? []);

    const match = fixtures.find(f => {
      const startMs = new Date(f.StartTime ?? '').getTime();
      return startMs > 0 && Math.abs(startMs - kickoffMs) < WINDOW;
    });
    if (!match) return null;

    const txlineId = String(match.FixtureId ?? match.fixtureId ?? '');
    if (!txlineId || txlineId === ourId) return txlineId || null;

    // Persist to Supabase so all subsequent requests use the correct ID without re-discovery
    try {
      await makeClient()
        .from('fixture_id_remap')
        .upsert({ our_id: ourId, txline_id: txlineId }, { onConflict: 'our_id' });
      invalidateRemapCache();
      console.log(`[fixture-remap] Auto-synced: ${ourId} → ${txlineId} (${match.Participant1} vs ${match.Participant2})`);
    } catch (dbErr) {
      console.warn('[fixture-remap] Supabase write failed (continuing anyway):', dbErr);
    }

    return txlineId;
  } catch { return null; }
}
