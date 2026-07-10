import { createClient } from '@supabase/supabase-js';

// Fallback used when Supabase is unreachable — keeps the cron + live page working
// even during a DB outage. Update this alongside the Supabase table when adding matches.
const FALLBACK: Record<string, string> = {
  '18210002': '18218149', // Spain vs Belgium QF
  '18210003': '18213979', // Norway vs England QF
  '18210004': '18222446', // Argentina vs Switzerland QF
};

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
