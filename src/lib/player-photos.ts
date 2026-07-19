// Player photo fetching via TheSportsDB (free, no key needed)
// Results are cached in localStorage:
//   - 7 days when a photo URL is found
//   - 1 hour when no photo is found (so we retry later, not 7 days stuck with "no photo")
//   - Network errors are NOT cached at all (retry on every page load)

const CACHE_PREFIX      = 'pphoto_v2_';
const CACHE_TTL_MS      = 7 * 24 * 60 * 60 * 1000; // 7 days — found photo
const CACHE_NULL_TTL_MS =           60 * 60 * 1000; // 1 hour  — no photo found

interface PhotoCache {
  url: string | null;
  ts: number;
}

function readCache(playerId: string): string | null | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + playerId);
    if (!raw) return undefined;
    const c: PhotoCache = JSON.parse(raw);
    const ttl = c.url ? CACHE_TTL_MS : CACHE_NULL_TTL_MS;
    if (Date.now() - c.ts > ttl) return undefined; // expired — retry
    return c.url;
  } catch { return undefined; }
}

function writeCache(playerId: string, url: string | null) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_PREFIX + playerId, JSON.stringify({ url, ts: Date.now() }));
  } catch {}
}

// TheSportsDB free tier — search by player name, return best photo URL
async function fetchFromSportsDB(name: string, attempt = 0): Promise<string | null> {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const player = data?.player?.[0];
    if (!player) return null; // resolved, but genuinely no such player — caller caches null
    // strCutout is a transparent PNG cutout (best for cards), strThumb is a head shot
    return player.strCutout || player.strThumb || null;
  } catch (err) {
    // Retry once on a transient failure — the free tier throttles bursts, e.g. a whole
    // starting XI mounting at once on an incognito cold load with no cache.
    if (attempt < 1) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 500));
      return fetchFromSportsDB(name, attempt + 1);
    }
    throw err; // exhausted — let the caller treat it as a network error (not cached)
  }
}

// Some squad/demo players carry abbreviated or accented display names that TheSportsDB's
// name search can't resolve (verified: "N. González" and "Acuña" return nothing). Map those
// player ids to a full ASCII search name so their photo always resolves.
const SEARCH_NAME_OVERRIDES: Record<string, string> = {
  'arg-gonzalez':  'Nicolas Gonzalez',
  'arg-acuna':     'Marcos Acuna',
  'arg-emartinez': 'Emiliano Martinez',
  'arg-martinez':  'Lisandro Martinez',
  'arg-lmartinez': 'Lautaro Martinez',
  'arg-allister':  'Alexis Mac Allister',
  'arg-molina':    'Nahuel Molina',
  'arg-romero':    'Cristian Romero',
  'arg-dimaria':   'Angel Di Maria',
  'arg-paul':      'Rodrigo De Paul',
};

// Cap concurrent TheSportsDB requests so a cold page load (a full starting XI mounting at
// once with an empty cache — the exact incognito case) doesn't burst-throttle the free tier
// and silently lose a few photos. A released slot is handed straight to the next waiter.
const MAX_CONCURRENT = 4;
let activeFetches = 0;
const slotWaiters: Array<() => void> = [];
function acquireSlot(): Promise<void> {
  if (activeFetches < MAX_CONCURRENT) { activeFetches++; return Promise.resolve(); }
  return new Promise<void>(resolve => slotWaiters.push(resolve));
}
function releaseSlot() {
  const next = slotWaiters.shift();
  if (next) next();           // transfer the slot (count unchanged)
  else activeFetches--;       // nobody waiting — free the slot
}

// In-flight dedup — prevents multiple components from fetching the same player simultaneously
const inFlight = new Map<string, Promise<string | null>>();

export async function getPlayerPhoto(playerId: string, name: string): Promise<string | null> {
  const cached = readCache(playerId);
  if (cached !== undefined) return cached;

  if (inFlight.has(playerId)) return inFlight.get(playerId)!;

  const searchName = SEARCH_NAME_OVERRIDES[playerId] ?? name;
  const promise = (async () => {
    await acquireSlot();
    try {
      const url = await fetchFromSportsDB(searchName);
      writeCache(playerId, url); // cache the result (null = genuinely no photo; short TTL)
      return url;
    } catch {
      return null;               // network/throttle error — do NOT cache, retry next load
    } finally {
      releaseSlot();
      inFlight.delete(playerId);
    }
  })();

  inFlight.set(playerId, promise);
  return promise;
}

// Batch prefetch — call early (e.g., when lineup loads) to warm cache
export function prefetchPlayerPhotos(players: Array<{ id: string; name: string }>) {
  for (const p of players) {
    if (readCache(p.id) === undefined) {
      getPlayerPhoto(p.id, p.name).catch(() => {});
    }
  }
}
