// DEPRECATED: This route previously served TxLINE-sourced WC 2026 fixtures.
// TxLINE has been removed. All data now comes from ESPN free API.
// This route redirects to the new multi-league schedule API for backward compat.
import { NextResponse } from 'next/server';

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  // Redirect to the new multi-league route for WC
  const target = `${appUrl}/api/schedule/fifa.world?range=60`;
  const res = await fetch(target, { cache: 'no-store' });
  if (!res.ok) {
    return NextResponse.json([], {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  }
  const data = await res.json();
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
