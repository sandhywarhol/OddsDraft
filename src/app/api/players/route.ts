// GET /api/players?team=Brazil&team=Norway
// Returns players for the requested teams from Supabase.
// Falls back gracefully if the players table is empty (returns empty array so caller uses static fallback).

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const teams = req.nextUrl.searchParams.getAll('team');

  if (teams.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  const { data, error } = await supabase
    .from('players')
    .select('id, name, team, team_flag, position, jersey_number, rating')
    .in('team', teams)
    .order('position')
    .order('rating', { ascending: false });

  if (error) {
    console.error('[/api/players]', error.message);
    return NextResponse.json([], { status: 200 }); // graceful degradation
  }

  // Map DB column names to Player interface
  const players = (data ?? []).map(row => ({
    id: row.id,
    name: row.name,
    team: row.team,
    teamFlag: row.team_flag ?? '',
    position: row.position as 'GK' | 'DEF' | 'MID' | 'ATT',
    jerseyNumber: row.jersey_number ?? undefined,
    rating: row.rating ?? 78,
  }));

  return NextResponse.json(players);
}
