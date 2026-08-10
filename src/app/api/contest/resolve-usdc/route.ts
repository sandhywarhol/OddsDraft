/**
 * POST /api/contest/resolve-usdc
 * Admin-only route. Computes proportional prizes and returns a payload
 * ready for the admin to build + sign the resolve_usdc_contest transaction.
 *
 * Body: { fixtureId, adminWallet }
 *
 * Returns:
 *   totalPool        — total micro-USDC staked
 *   distributable    — 95% of total (platform takes 5%)
 *   platformFee      — 5% in micro-USDC
 *   prizes           — array of { wallet, prizeUsdc, rank, sharePercent, score }
 *   vaultPDA         — vault token account (for the on-chain instruction)
 *   usdcContestPDA   — contest account PDA
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeProportionalPrizes } from '@/lib/usdc';
import { deriveUsdcContestPDA, deriveUsdcVaultPDA } from '@/lib/oddsdraft-anchor';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_WALLETS = (process.env.ADMIN_WALLETS ?? '').split(',').map(s => s.trim()).filter(Boolean);

export async function POST(req: NextRequest) {
  try {
    const { fixtureId, adminWallet } = await req.json();

    if (!fixtureId) return NextResponse.json({ error: 'fixtureId required' }, { status: 400 });
    if (!adminWallet || !ADMIN_WALLETS.includes(adminWallet)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all entries for this fixture
    const { data: entries, error } = await supabase
      .from('usdc_entries')
      .select('wallet, usdc_amount, score')
      .eq('fixture_id', fixtureId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: 'No entries found for this fixture.' }, { status: 404 });
    }

    // Compute prizes
    const usdcEntries = entries.map(e => ({
      wallet:     e.wallet as string,
      usdcStaked: BigInt(e.usdc_amount ?? '0'),
      score:      Number(e.score ?? 0),
    }));

    const prizes = computeProportionalPrizes(usdcEntries);
    const totalPool = usdcEntries.reduce((s, e) => s + e.usdcStaked, BigInt(0));
    const platformFee = (totalPool * BigInt(500)) / BigInt(10000);
    const distributable = totalPool - platformFee;

    // Derive PDAs for the frontend to construct the tx
    const [usdcContestPDA] = deriveUsdcContestPDA(fixtureId);
    const [vaultPDA] = deriveUsdcVaultPDA(usdcContestPDA);

    // Update Supabase with calculated ranks + prizes (preview — admin confirms before on-chain)
    for (const prize of prizes) {
      await supabase
        .from('usdc_entries')
        .update({ rank: prize.rank, prize_usdc: String(prize.prizeUsdc) })
        .eq('fixture_id', fixtureId)
        .eq('wallet', prize.wallet);
    }

    return NextResponse.json({
      ok: true,
      fixtureId,
      totalPool: String(totalPool),
      distributable: String(distributable),
      platformFee: String(platformFee),
      usdcContestPDA: usdcContestPDA.toBase58(),
      vaultPDA: vaultPDA.toBase58(),
      prizes: prizes.map(p => ({
        wallet:       p.wallet,
        prizeUsdc:    String(p.prizeUsdc),
        rank:         p.rank,
        sharePercent: p.sharePercent,
        score:        usdcEntries.find(e => e.wallet === p.wallet)?.score ?? 0,
      })),
    });
  } catch (err) {
    console.error('[resolve-usdc]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
