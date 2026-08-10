import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('league') || 'eng.1'; // default to premier league

  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/teams`);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch teams for ${leagueId}`);
    }

    const data = await res.json();
    
    // ESPN structure: data.sports[0].leagues[0].teams
    const teamsData = data?.sports?.[0]?.leagues?.[0]?.teams || [];
    
    const teams = teamsData.map((t: any) => {
      const team = t.team;
      return {
        id: team.id,
        name: team.displayName || team.name,
        abbreviation: team.abbreviation,
        logo: team.logos?.[0]?.href || '',
        slug: team.slug,
        color: `#${team.color || '3b82f6'}`, // ESPN provides hex without #
      };
    });

    return NextResponse.json({ teams });
  } catch (error: any) {
    console.error('Error fetching ESPN teams:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
