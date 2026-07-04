import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet'
      ? 'https://api.devnet.solana.com'
      : (process.env.SERVER_SOLANA_RPC ?? 'https://solana-rpc.publicnode.com');

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('RPC Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy RPC request' },
      { status: 500 }
    );
  }
}
