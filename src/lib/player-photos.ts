// Player photo fetching via TheSportsDB (free, no key needed)
// Results are cached in localStorage for 7 days

const CACHE_PREFIX = 'pphoto_v1_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
    if (Date.now() - c.ts > CACHE_TTL_MS) return undefined;
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
async function fetchFromSportsDB(name: string): Promise<string | null> {
  const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  const data = await res.json();
  const player = data?.player?.[0];
  if (!player) return null;
  // strCutout is a transparent PNG cutout (best for cards), strThumb is a head shot
  return player.strCutout || player.strThumb || null;
}

// In-flight dedup — prevents multiple components from fetching the same player simultaneously
const inFlight = new Map<string, Promise<string | null>>();

export async function getPlayerPhoto(playerId: string, name: string): Promise<string | null> {
  const cached = readCache(playerId);
  if (cached !== undefined) return cached;

  if (inFlight.has(playerId)) return inFlight.get(playerId)!;

  const promise = fetchFromSportsDB(name)
    .then(url => { writeCache(playerId, url); return url; })
    .catch(() => { writeCache(playerId, null); return null; })
    .finally(() => inFlight.delete(playerId));

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
