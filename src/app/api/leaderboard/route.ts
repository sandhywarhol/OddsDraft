import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return createClient(url, key);
}

export async function GET() {
  const supabase = getSupabase();

  // Fetch all contest results
  const { data: results, error } = await supabase
    .from('contest_results')
    .select('wallet_address, rank, points, prize_sol');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate per wallet
  const agg: Record<string, { contests: number; wins: number; points: number; sol: number }> = {};
  for (const row of results ?? []) {
    const w = row.wallet_address;
    if (!w) continue;
    if (!agg[w]) agg[w] = { contests: 0, wins: 0, points: 0, sol: 0 };
    agg[w].contests++;
    if (row.rank === 1) agg[w].wins++;
    agg[w].points += row.points ?? 0;
    agg[w].sol += row.prize_sol ?? 0;
  }

  // Fetch display names/avatars from users table (best-effort)
  const wallets = Object.keys(agg);
  let profileMap: Record<string, { username?: string; avatar_url?: string }> = {};
  if (wallets.length > 0) {
    const { data: profiles } = await supabase
      .from('users')
      .select('wallet_address, username, avatar_url')
      .in('wallet_address', wallets);
    for (const p of profiles ?? []) {
      profileMap[p.wallet_address] = { username: p.username, avatar_url: p.avatar_url };
    }
  }

  const rows = Object.entries(agg)
    .map(([wallet, s]) => ({
      wallet_address: wallet,
      username: profileMap[wallet]?.username ?? null,
      avatar_url: profileMap[wallet]?.avatar_url ?? null,
      total_contests: s.contests,
      total_wins: s.wins,
      total_points: s.points,
      total_earned_sol: s.sol,
    }))
    .sort((a, b) => b.total_earned_sol - a.total_earned_sol || b.total_points - a.total_points)
    .slice(0, 20);

  return NextResponse.json(rows, { headers: { 'Cache-Control': 'no-store' } });
}
