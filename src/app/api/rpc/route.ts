import { NextRequest, NextResponse } from 'next/server';

// Centralized RPC for all users — keeps API keys server-side, not in browser bundles.
// Set SERVER_SOLANA_RPC in Vercel env vars to your Alchemy/Helius endpoint.
// Fallback to publicnode is intentionally slow — configure SERVER_SOLANA_RPC in production.
const RPC_URL = process.env.SERVER_SOLANA_RPC ?? 'https://solana-rpc.publicnode.com';

if (!process.env.SERVER_SOLANA_RPC) {
  console.warn('[rpc] SERVER_SOLANA_RPC not set — using slow public fallback. Set it in Vercel env vars.');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      console.error(`[rpc] Upstream error ${response.status} from ${RPC_URL}`);
      return NextResponse.json({ error: 'RPC upstream error' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[rpc] Proxy error:', error?.message ?? error);
    return NextResponse.json({ error: 'RPC proxy error' }, { status: 500 });
  }
}
