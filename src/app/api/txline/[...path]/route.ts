import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// NEXT_PUBLIC_TXLINE_ENV=production overrides the Solana network setting,
// allowing production TxLINE data on devnet Solana (no real SOL needed).
const useProdTxLine =
  process.env.NEXT_PUBLIC_TXLINE_ENV === 'production' ||
  process.env.NEXT_PUBLIC_SOLANA_NETWORK !== 'devnet';

const TXLINE_ORIGIN = useProdTxLine
  ? 'https://txline.txodds.com'
  : 'https://txline-dev.txodds.com';

// Server-side token — never exposed to browser. Falls back to public token.
const SERVER_TOKEN =
  process.env.TXODDS_API_TOKEN ??
  process.env.NEXT_PUBLIC_TXODDS_API_TOKEN ??
  '';

// Cache guest JWT in module scope (edge instance lifetime, typically minutes)
let _cachedJwt: string | null = null;
let _jwtExpiry = 0;

async function getServerJwt(): Promise<string | null> {
  if (_cachedJwt && Date.now() < _jwtExpiry) return _cachedJwt;
  try {
    const r = await fetch(`${TXLINE_ORIGIN}/auth/guest/start`, { method: 'POST' });
    if (!r.ok) return null;
    const d = await r.json();
    _cachedJwt = d.token ?? null;
    _jwtExpiry = Date.now() + 25 * 60 * 1000; // 25 min
    return _cachedJwt;
  } catch { return null; }
}

async function proxy(req: NextRequest, path: string[]) {
  const url = `${TXLINE_ORIGIN}/${path.join('/')}`;
  const browserAuth = req.headers.get('authorization');
  const browserToken = req.headers.get('x-api-token');

  // Prefer server token for score data; browser credentials for auth/activation flows
  const isAuthPath = path[0] === 'auth' || (path[0] === 'api' && path[1] === 'token');
  const apiToken = isAuthPath ? (browserToken ?? SERVER_TOKEN) : (SERVER_TOKEN || browserToken || '');
  const serverJwt = (!isAuthPath && SERVER_TOKEN) ? await getServerJwt() : null;
  const auth = isAuthPath ? browserAuth : (browserAuth ?? (serverJwt ? `Bearer ${serverJwt}` : null));

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = auth;
  if (apiToken) headers['X-Api-Token'] = apiToken;

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text();
  }

  try {
    const res = await fetch(url, init);
    const ct = res.headers.get('content-type') ?? '';
    // Preserve response faithfully — activation endpoint returns a plain string token
    let data: unknown;
    if (ct.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      const text = await res.text();
      // TxLINE score endpoints return Server-Sent Events (text/event-stream).
      // Parse each "data: {...}" line and return all events as an array.
      if (ct.includes('text/event-stream') || text.startsWith('data:')) {
        const events: unknown[] = [];
        for (const line of text.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          try { events.push(JSON.parse(json)); } catch { /* skip malformed line */ }
        }
        data = events.length > 0 ? events : null;
      } else {
        // Try to parse as JSON anyway in case Content-Type is wrong
        try { data = JSON.parse(text); } catch { data = text || null; }
      }
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[TxLINE proxy] error:', err);
    return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
