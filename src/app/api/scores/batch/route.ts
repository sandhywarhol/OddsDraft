import { NextRequest, NextResponse } from 'next/server';

// Always use mainnet TxLINE — txline-dev.txodds.com is broken.
// NEXT_PUBLIC_TXLINE_ENV=devnet is the only override; absent = mainnet.
const TXLINE_ORIGIN = process.env.NEXT_PUBLIC_TXLINE_ENV === 'devnet'
  ? 'https://txline-dev.txodds.com'
  : 'https://txline.txodds.com';

// TxLINE uses multiple score field shapes across endpoints — try all known variants.
function extractScore(u: any): { home: number; away: number } | null {
  // Shape 1: { score: { home, away } }
  if (u?.score?.home !== undefined && u?.score?.away !== undefined) {
    return { home: Number(u.score.home), away: Number(u.score.away) };
  }
  // Shape 2: { Score: { Home, Away } }
  if (u?.Score?.Home !== undefined && u?.Score?.Away !== undefined) {
    return { home: Number(u.Score.Home), away: Number(u.Score.Away) };
  }
  // Shape 3: { HomeScore, AwayScore } flat
  if (u?.HomeScore !== undefined && u?.AwayScore !== undefined) {
    return { home: Number(u.HomeScore), away: Number(u.AwayScore) };
  }
  return null;
}

// For a finished match, take the last update that has a score (final score).
function extractFinalScore(data: unknown): { home: number; away: number } | null {
  const updates: any[] = Array.isArray(data)
    ? data
    : data && typeof data === 'object' ? [data] : [];

  let finalScore: { home: number; away: number } | null = null;

  // If the top-level object itself has a score (single-object response)
  if (!Array.isArray(data) && data && typeof data === 'object') {
    const s = extractScore(data);
    if (s) finalScore = s;
  }

  for (const u of updates) {
    const s = extractScore(u);
    if (s) finalScore = s;
    // Also scan nested events array for goal events to infer score
  }

  return finalScore;
}

// GET /api/scores/batch?fixtures=id1,id2,id3
// Requires X-Api-Token header (the caller's TxLINE subscription token).
// Forwards Authorization header if present (guestJwt Bearer token).
// Returns { [fixtureId]: { home: number; away: number } | null }
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fixturesParam = searchParams.get('fixtures');
  const apiToken = req.headers.get('x-api-token');
  const authorization = req.headers.get('authorization');

  if (!fixturesParam) {
    return NextResponse.json({ error: 'Missing fixtures param' }, { status: 400 });
  }
  if (!apiToken) {
    return NextResponse.json({ error: 'Missing X-Api-Token header' }, { status: 401 });
  }

  const fixtureIds = fixturesParam.split(',').filter(Boolean).slice(0, 100);
  const results: Record<string, { home: number; away: number } | null> = {};

  const fetchHeaders: Record<string, string> = { 'X-Api-Token': apiToken };
  if (authorization) fetchHeaders['Authorization'] = authorization;

  let firstSampleLogged = false;

  await Promise.allSettled(
    fixtureIds.map(async (fixtureId) => {
      try {
        const res = await fetch(
          `${TXLINE_ORIGIN}/api/soccer/v2/scores?FixtureId=${fixtureId}`,
          { headers: fetchHeaders }
        );
        if (!res.ok) {
          console.warn(`[scores/batch] ${fixtureId} → HTTP ${res.status}`);
          results[fixtureId] = null;
          return;
        }
        const data = await res.json();
        // Log a single sample so we can see the actual response shape
        if (!firstSampleLogged) {
          firstSampleLogged = true;
          console.log(`[scores/batch] sample fixture=${fixtureId} response:`, JSON.stringify(data).slice(0, 500));
        }
        const score = extractFinalScore(data);
        results[fixtureId] = score;
      } catch (err) {
        console.error(`[scores/batch] ${fixtureId} error:`, err);
        results[fixtureId] = null;
      }
    })
  );

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
  });
}
