import { NextRequest, NextResponse } from 'next/server';

export interface MatchEvent {
  minute: string;
  type: 'goal' | 'own_goal' | 'penalty' | 'yellow_card' | 'red_card' | 'yellow_red_card' | 'sub';
  player: string;
  assist?: string;
  team: string;
  teamFlag?: string;
}

export interface MatchResult {
  events: MatchEvent[];
  venue?: string;
  attendance?: string;
}

// Maps ESPN event type text → our internal type
function parseEventType(text: string, scoringType?: string): MatchEvent['type'] {
  const t = (text ?? '').toLowerCase();
  const st = (scoringType ?? '').toLowerCase();
  if (st.includes('own goal') || t.includes('own goal')) return 'own_goal';
  if (st.includes('penalty') || t.includes('penalty')) return 'penalty';
  if (t.includes('goal')) return 'goal';
  if (t.includes('red card')) return 'red_card';
  if (t.includes('yellow-red') || t.includes('second yellow')) return 'yellow_red_card';
  if (t.includes('yellow card')) return 'yellow_card';
  if (t.includes('substitution') || t.includes('sub')) return 'sub';
  return 'goal';
}

// GET /api/match/result?espnId=696484
// Fetches match details from ESPN summary endpoint.
export async function GET(req: NextRequest) {
  const espnId = new URL(req.url).searchParams.get('espnId');
  if (!espnId) {
    return NextResponse.json({ error: 'Missing espnId' }, { status: 400 });
  }

  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${espnId}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `ESPN returned ${res.status}` }, { status: res.status });
    }
    const data = await res.json();

    const events: MatchEvent[] = [];

    // Scoring plays (goals, own goals, penalties)
    const scoringPlays: any[] = data.scoringPlays ?? [];
    for (const play of scoringPlays) {
      const type = parseEventType(play.type?.text ?? '', play.scoringPlay?.scoringType ?? '');
      const text: string = play.text ?? '';
      // ESPN format: "Player Name (Assist Name)" or just "Player Name"
      const assistMatch = text.match(/\(([^)]+)\)/);
      const player = text.replace(/\s*\([^)]*\)/, '').trim();
      const assist = assistMatch?.[1];
      events.push({
        minute: play.clock?.displayValue ?? '?',
        type,
        player,
        assist,
        team: play.team?.displayName ?? play.team?.name ?? '',
      });
    }

    // Key plays for cards (ESPN sometimes puts these in `plays` or `keyPlays`)
    const keyPlays: any[] = data.keyEvents ?? data.keyPlays ?? [];
    for (const play of keyPlays) {
      const typeText = play.type?.text ?? '';
      if (!typeText.toLowerCase().includes('card')) continue;
      const type = parseEventType(typeText);
      events.push({
        minute: play.clock?.displayValue ?? '?',
        type,
        player: play.participants?.[0]?.athlete?.displayName ?? play.text ?? '',
        team: play.team?.displayName ?? play.team?.name ?? '',
      });
    }

    // Sort all events by minute (extract numeric part)
    events.sort((a, b) => {
      const mA = parseInt(a.minute.replace(/[^0-9]/g, '')) || 0;
      const mB = parseInt(b.minute.replace(/[^0-9]/g, '')) || 0;
      return mA - mB;
    });

    // Venue info
    const gameInfo = data.gameInfo ?? data.header?.competitions?.[0];
    const venue = gameInfo?.venue?.fullName ?? gameInfo?.venue?.name;
    const attendance = gameInfo?.attendance != null ? Number(gameInfo.attendance).toLocaleString() : undefined;

    const result: MatchResult = { events, venue, attendance };
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (err) {
    console.error('[match/result]', err);
    return NextResponse.json({ error: 'Failed to fetch match result' }, { status: 500 });
  }
}
