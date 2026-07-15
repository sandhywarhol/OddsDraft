import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkEspnMatchStatus } from '@/lib/espn';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/espn/status?fixtureId=&homeTeam=&awayTeam=&kickoffAt=
// Client-side fallback for when TxLINE never reports full_time/game_finalised.
// Cross-checks ESPN directly; if it confirms the match is over, persists the
// same synthetic game_finalised row the cron job writes (same event_id, so
// the two never double-write) so the live page can unblock claims immediately
// instead of waiting for the next cron tick.
export async function GET(req: NextRequest) {
  const fixtureId = req.nextUrl.searchParams.get('fixtureId');
  const homeTeam = req.nextUrl.searchParams.get('homeTeam');
  const awayTeam = req.nextUrl.searchParams.get('awayTeam');
  const kickoffAt = req.nextUrl.searchParams.get('kickoffAt');

  if (!fixtureId || !homeTeam || !awayTeam || !kickoffAt) {
    return NextResponse.json({ error: 'fixtureId, homeTeam, awayTeam, kickoffAt required' }, { status: 400 });
  }

  const espn = await checkEspnMatchStatus(homeTeam, awayTeam, kickoffAt);
  if (!espn?.completed) {
    return NextResponse.json({ completed: false });
  }

  await supabase.from('live_match_events').upsert({
    fixture_id: fixtureId,
    event_id: 'espn-game_finalised',
    minute: 90,
    event_type: 'game_finalised',
    player_name: '',
    team_name: '',
    home_score: espn.scoreHome,
    away_score: espn.scoreAway,
  }, { onConflict: 'fixture_id,event_id' });

  return NextResponse.json({ completed: true, scoreHome: espn.scoreHome, scoreAway: espn.scoreAway });
}
