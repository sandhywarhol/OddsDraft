import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('league') || 'eng.1';
  const { teamId } = await params;

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/teams/${teamId}/roster`);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch roster for team ${teamId} in ${leagueId}`);
    }

    const data = await res.json();
    
    const athletes = data?.athletes || [];
    
    const players = athletes.map((athlete: any) => ({
      id: athlete.id,
      name: athlete.displayName || athlete.fullName,
      shortName: athlete.shortName,
      jersey: athlete.jersey || '-',
      position: athlete.position?.displayName || athlete.position?.name || 'Unknown',
      positionAbbr: athlete.position?.abbreviation || 'U',
      age: athlete.age || null,
      nationality: athlete.citizenship || 'Unknown',
      flagUrl: athlete.flag?.href || '',
      headshotUrl: athlete.headshot?.href || '',
    }));

    return NextResponse.json({ players });
  } catch (error: any) {
    console.error(`Error fetching ESPN roster for team ${teamId}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
