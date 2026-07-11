import { NextResponse } from 'next/server';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';

// GET /api/scores/txline
// Returns { [contestId]: { home, away, completed } } — same shape as /api/scores/wc2026
// but sourced entirely from TxLINE fixture snapshot (no ESPN dependency).
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app';

  try {
    const res = await fetch(`${appUrl}/api/txline/api/fixtures/snapshot`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`TxLINE snapshot ${res.status}`);

    const raw = await res.json();
    const txFixtures: any[] = Array.isArray(raw) ? raw : (raw?.fixtures ?? raw?.data ?? []);

    // Build lookup: TxLINE FixtureId → score + state
    const results: Record<string, { home: number; away: number; completed: boolean }> = {};

    for (const tf of txFixtures) {
      const txId = String(tf.FixtureId ?? tf.fixtureId ?? '');
      if (!txId) continue;

      // Score from TxLINE Score.Participant1.Total.Goals format
      const p1Score = tf.Score?.Participant1?.Total?.Goals ?? tf.Score?.Participant1?.Goals;
      const p2Score = tf.Score?.Participant2?.Total?.Goals ?? tf.Score?.Participant2?.Goals;
      if (typeof p1Score !== 'number') continue;

      const home = p1Score;
      const away = typeof p2Score === 'number' ? p2Score : 0;

      // Completed: GameState 9=FullTime, 10=PostGame/Abandoned, 11=Cancelled
      const gs = tf.GameState ?? tf.gameState ?? tf.Status ?? '';
      const gsNum = typeof gs === 'number' ? gs : 0;
      const gsStr = typeof gs === 'string' ? gs.toLowerCase() : '';
      const completed = [9, 10, 11].includes(gsNum) ||
        ['fulltime', 'full_time', 'postgame', 'finished', 'abandoned'].some(s => gsStr.includes(s));

      // Map to our contest ID — direct match (most QF/SF/Final fixture IDs are the same)
      const ourFixture = WC2026_FIXTURES.find(f => f.fixtureId === txId);
      const contestId = ourFixture?.fixtureId ?? txId;

      results[contestId] = { home, away, completed };
    }

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30' },
    });
  } catch (err) {
    console.error('[scores/txline] Error:', err);
    return NextResponse.json({}, { status: 502 });
  }
}
