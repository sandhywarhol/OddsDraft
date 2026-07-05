// GET /api/admin/sync-players?secret=<ADMIN_SECRET>
// Fetches WC2026 squads from football-data.org and upserts into Supabase.
// Run once to populate, then re-run any time squads change.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchWC2026Squads } from '@/lib/football-data-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  // Require admin secret to prevent public access
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const squads = await fetchWC2026Squads();
    let totalPlayers = 0;
    const errors: string[] = [];

    for (const { team, players } of squads) {
      if (players.length === 0) continue;

      const rows = players.map(p => ({
        id: p.id,
        name: p.name,
        team: p.team,
        team_flag: p.teamFlag,
        position: p.position,
        jersey_number: p.jerseyNumber,
        rating: p.rating,
        synced_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('players')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        errors.push(`${team}: ${error.message}`);
      } else {
        totalPlayers += players.length;
      }
    }

    return NextResponse.json({
      success: true,
      teams: squads.length,
      players: totalPlayers,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
