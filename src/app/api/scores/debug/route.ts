import { NextRequest, NextResponse } from 'next/server';

const TXLINE_ORIGIN = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet'
  ? 'https://txline-dev.txodds.com'
  : 'https://txline.txodds.com';

// Debug route — returns raw TxLINE response for a single fixture
// GET /api/scores/debug?fixture=17588316
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fixtureId = searchParams.get('fixture');
  const apiToken = req.headers.get('x-api-token');
  const authorization = req.headers.get('authorization');

  if (!fixtureId || !apiToken) {
    return NextResponse.json({ error: 'Need ?fixture= and X-Api-Token header' }, { status: 400 });
  }

  const fetchHeaders: Record<string, string> = { 'X-Api-Token': apiToken };
  if (authorization) fetchHeaders['Authorization'] = authorization;

  try {
    const res = await fetch(
      `${TXLINE_ORIGIN}/api/soccer/v2/scores?FixtureId=${fixtureId}`,
      { headers: fetchHeaders }
    );
    const text = await res.text();
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    return NextResponse.json({ status: res.status, fixtureId, data: parsed });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
