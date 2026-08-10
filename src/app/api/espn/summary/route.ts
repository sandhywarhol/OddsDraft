import { NextResponse } from 'next/server';
import { fetchEspnMatchSummary } from '@/lib/espn';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  const leagueId = searchParams.get('leagueId') || 'eng.1';

  if (!eventId) {
    return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
  }

  try {
    const summary = await fetchEspnMatchSummary(leagueId, eventId);
    if (!summary) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
