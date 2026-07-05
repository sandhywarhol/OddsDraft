// GET /api/players?team=Brazil&team=Norway
// Returns players from the official FIFA WC2026 static dataset.

import { NextRequest, NextResponse } from 'next/server';
import { getStaticPlayersByTeam } from '@/lib/wc2026-players-static';

export async function GET(req: NextRequest) {
  const teams = req.nextUrl.searchParams.getAll('team');

  if (teams.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  const players = teams.flatMap(team => getStaticPlayersByTeam(team));

  return NextResponse.json(players);
}
