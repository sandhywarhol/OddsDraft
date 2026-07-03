import { NextRequest, NextResponse } from 'next/server';

const TXLINE_ORIGIN = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet'
  ? 'https://txline-dev.txodds.com'
  : 'https://txline.txodds.com';

export async function GET(req: NextRequest) {
  const withTimeout = (ms: number) => {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), ms);
    return ctrl.signal;
  };

  // Accept pre-obtained X-Api-Token via query param or header for testing
  const queryToken = req.nextUrl.searchParams.get('token');
  const headerToken = req.headers.get('x-api-token');
  const providedToken = queryToken || headerToken;

  try {
    if (providedToken) {
      // Always get a fresh guest JWT — required alongside X-Api-Token for data endpoints
      const authRes = await fetch(`${TXLINE_ORIGIN}/auth/guest/start`, {
        method: 'POST',
        signal: withTimeout(8000),
      });
      if (!authRes.ok) {
        return NextResponse.json({ status: 'error', step: 'auth', code: authRes.status }, { status: 502 });
      }
      const { token: guestJwt } = await authRes.json();

      const dataHeaders = {
        'X-Api-Token': providedToken,
        'Authorization': `Bearer ${guestJwt}`,
      };

      // Test the provided token directly against fixtures and scores
      const fixRes = await fetch(`${TXLINE_ORIGIN}/api/soccer/v2/fixtures`, {
        headers: dataHeaders,
        signal: withTimeout(10000),
      });

      if (!fixRes.ok) {
        return NextResponse.json({
          status: 'error', step: 'fixtures', code: fixRes.status,
          note: '403 = api_token invalid/not found; 401 = auth issue',
          token_preview: `${providedToken.substring(0, 20)}...`,
        }, { status: 502 });
      }

      const fixturesRaw = await fixRes.json();
      const fixtures = Array.isArray(fixturesRaw) ? fixturesRaw : (fixturesRaw?.fixtures ?? []);

      const liveRes = await fetch(`${TXLINE_ORIGIN}/api/soccer/v2/fixtures/live`, {
        headers: dataHeaders,
        signal: withTimeout(8000),
      });
      const liveRaw = liveRes.ok ? await liveRes.json() : [];
      const live = Array.isArray(liveRaw) ? liveRaw : (liveRaw?.fixtures ?? []);

      return NextResponse.json({
        status: 'ok',
        mode: 'provided_token',
        token_preview: `${providedToken.substring(0, 20)}...`,
        total_fixtures: fixtures.length,
        live_now: live.length,
        sample_fixtures: fixtures.slice(0, 5).map((f: any) => ({
          id: f.FixtureId || f.id,
          home: f.Participant1 || f.homeTeam,
          away: f.Participant2 || f.awayTeam,
          start: f.StartTime || f.date,
          status: f.Status || f.status,
        })),
        live_fixtures: live.slice(0, 3),
      });
    }

    // No token provided — just test auth endpoint and return status
    const authRes = await fetch(`${TXLINE_ORIGIN}/auth/guest/start`, {
      method: 'POST',
      signal: withTimeout(8000),
    });
    if (!authRes.ok) {
      return NextResponse.json({ status: 'error', step: 'auth', code: authRes.status }, { status: 502 });
    }
    const { token: guestJwt } = await authRes.json();

    // Try fixtures without X-Api-Token to confirm 403
    const fixProbeRes = await fetch(`${TXLINE_ORIGIN}/api/soccer/v2/fixtures`, {
      signal: withTimeout(8000),
    });

    return NextResponse.json({
      status: 'needs_subscription',
      mode: 'no_token',
      guest_jwt_ok: true,
      guest_jwt_preview: `${guestJwt.substring(0, 30)}...`,
      fixtures_without_token_status: fixProbeRes.status,
      note: 'X-Api-Token required for data. Complete on-chain subscription via LIVE button, then test with ?token=YOUR_TOKEN',
      network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet',
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err.message }, { status: 502 });
  }
}
