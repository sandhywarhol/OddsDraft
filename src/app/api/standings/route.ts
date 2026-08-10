import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('league') || 'eng.1';

  try {
    // Adding ?season=2023 because the current season hasn't started yet,
    // so all teams naturally have 0 points. Using 2023 ensures we have valid demo data.
    const res = await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${leagueId}/standings?season=2023`);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch standings for ${leagueId}`);
    }

    const data = await res.json();
    
    // ESPN V2 API format
    const standingsEntries = data?.children?.[0]?.standings?.entries || [];

    const standings = standingsEntries.map((entry: any) => {
      const getStat = (name: string) => {
        const stat = entry.stats?.find((s: any) => s.name === name);
        return stat ? stat.displayValue : '0';
      };

      return {
        id: entry.team.id,
        teamName: entry.team.name,
        abbreviation: entry.team.abbreviation,
        logo: entry.team.logos?.[0]?.href || null,
        rank: getStat('rank'),
        gamesPlayed: getStat('gamesPlayed'),
        wins: getStat('wins'),
        draws: getStat('ties'),
        losses: getStat('losses'),
        goalsFor: getStat('pointsFor'),
        goalsAgainst: getStat('pointsAgainst'),
        goalDifference: getStat('pointDifferential'),
        points: getStat('points'),
      };
    });

    return NextResponse.json({ standings });
  } catch (error: any) {
    console.error(`Error fetching ESPN standings for ${leagueId}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
