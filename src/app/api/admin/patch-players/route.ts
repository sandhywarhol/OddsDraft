// GET /api/admin/patch-players?secret=<ADMIN_SECRET>
// Applies PLAYER_RATINGS overrides + removes EXCLUDED_PLAYERS from Supabase.
// Use after sync-players, or any time to refresh ratings on existing data.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PLAYER_RATINGS, EXCLUDED_PLAYERS } from '@/lib/player-ratings';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase env vars not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Delete excluded players
  const excludedNames = Array.from(EXCLUDED_PLAYERS);
  const { data: deleted, error: deleteErr } = await supabase
    .from('players')
    .delete()
    .in('name', excludedNames)
    .select('name');

  if (deleteErr) {
    return NextResponse.json({ error: `Delete failed: ${deleteErr.message}` }, { status: 500 });
  }

  // 2. Apply rating overrides — batch update each known player
  const ratingErrors: string[] = [];
  let updatedCount = 0;

  const names = Object.keys(PLAYER_RATINGS);
  // Process in chunks of 50
  for (let i = 0; i < names.length; i += 50) {
    const chunk = names.slice(i, i + 50);
    // Update each player by name
    for (const name of chunk) {
      const rating = PLAYER_RATINGS[name];
      const { error } = await supabase
        .from('players')
        .update({ rating })
        .eq('name', name);
      if (error) {
        ratingErrors.push(`${name}: ${error.message}`);
      } else {
        updatedCount++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    deleted: (deleted ?? []).map(r => r.name),
    ratingsApplied: updatedCount,
    ratingErrors: ratingErrors.length > 0 ? ratingErrors : undefined,
  });
}
