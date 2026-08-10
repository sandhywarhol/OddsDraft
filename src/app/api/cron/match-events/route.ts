import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMessage, formatMatchEvent, formatMatchStats } from '@/lib/telegram-bot';
import { fetchEspnMatchSummary, fetchAllLeaguesFixtures, type EspnMatchEvent } from '@/lib/espn';
import { LEAGUES } from '@/lib/leagues';
import { calculateEventPoints, resolvePlayerDelta } from '@/lib/fantasy-engine';
import {
  matchPlayerName,
  buildEspnPlayerIdMapFromRosters,
  convertEspnEvents,
  type LiveEvent,
} from '@/lib/espn-bridge';
import { WC2026_PLAYERS } from '@/lib/wc2026-players-static';
import { mapEspnEventType } from '@/lib/espn';
import { getTeamFlag } from '@/lib/fixtures';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SIGNIFICANT = new Set([
  'goal', 'own_goal', 'red_card', 'penalty_save',
  'half_time', 'full_time', 'game_finalised',
  'yellow_card', 'substitution', 'corner_kick', 'var_review', 'extra_time',
  'penalty_won', 'penalty_missed', 'kick_off', 'shot', 'danger_attack',
]);

const STATS_ONLY = new Set(['half_time', 'full_time', 'game_finalised']);
const SILENT_DB_ONLY = new Set(['shot', 'danger_attack', 'corner_kick', 'kick_off']);

const CONTEST_TYPES = ['top3', '5050', 'wta'] as const;

// GET /api/cron/match-events?secret=<CRON_SECRET>
// Polls ESPN summary endpoint for all live matches across all tracked leagues.
// Processes keyEvents and writes to live_match_events, sends Telegram notifications.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const querySecret = req.nextUrl.searchParams.get('secret');
  const authHeader = req.headers.get('authorization');
  const authorized = !!cronSecret && (querySecret === cronSecret || authHeader === `Bearer ${cronSecret}`);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app';
  const now = Date.now();

  // ── 1. Find live/upcoming fixtures from ESPN across all leagues ──────────────
  const leagueSlugs = LEAGUES.map(l => l.espnSlug);

  let allEspnFixtures;
  try {
    allEspnFixtures = await fetchAllLeaguesFixtures(leagueSlugs);
  } catch (err) {
    console.error('[CronMatchEvents] Failed to fetch ESPN fixtures:', err);
    return NextResponse.json({ ok: false, error: 'ESPN fetch failed' }, { status: 502 });
  }

  // Filter for live + recently started matches (within 4h of kickoff)
  const liveFixtures = allEspnFixtures.filter(f => {
    if (!f.kickoffAt) return false;
    const ko = new Date(f.kickoffAt).getTime();
    const WINDOW_START = ko - 15 * 60_000;   // 15 min before
    const WINDOW_END   = ko + 4 * 3_600_000; // 4h after
    return now >= WINDOW_START && now <= WINDOW_END;
  });

  if (liveFixtures.length === 0) {
    return NextResponse.json({ ok: true, message: 'No live matches right now', checked: allEspnFixtures.length });
  }

  console.log(`[CronMatchEvents] Processing ${liveFixtures.length} live/upcoming fixtures`);
  const results: Record<string, number> = {};

  for (const fixture of liveFixtures) {
    const fixtureId = fixture.espnId;
    const leagueSlug = fixture.leagueId;

    try {
      // ── 2. Check if already finalized ─────────────────────────────────────
      const { data: existingFinal } = await supabase
        .from('live_match_events')
        .select('event_id')
        .eq('fixture_id', fixtureId)
        .eq('event_type', 'game_finalised')
        .limit(1);

      if (existingFinal?.length) {
        continue; // Already processed — skip
      }

      // ── 3. Fetch ESPN match summary ─────────────────────────────────────────
      const summary = await fetchEspnMatchSummary(leagueSlug, fixtureId);
      if (!summary) {
        console.warn(`[CronMatchEvents] No ESPN summary for ${fixtureId} (${leagueSlug})`);
        continue;
      }

      const { events: espnEvents, rosters, homeTeamId, awayTeamId,
              homeScore, awayScore, completed, statusState } = summary;

      // ── 4. Build player ID map from rosters ──────────────────────────────
      const playerIdMap = buildEspnPlayerIdMapFromRosters(
        rosters, fixture.homeTeam, fixture.awayTeam
      );

      // ── 5. Filter new significant events ─────────────────────────────────
      const significantEvents = espnEvents.filter(ev => {
        const fantasyType = mapEspnEventType(ev.type, undefined, ev.shootout);
        return fantasyType && SIGNIFICANT.has(fantasyType);
      });

      if (significantEvents.length === 0 && !completed) continue;

      // Build event IDs using ESPN event id for dedup
      const eventIds = significantEvents.map(ev => `espn-${ev.id}`);

      const { data: alreadyNotified } = await supabase
        .from('notified_events')
        .select('event_id')
        .eq('fixture_id', fixtureId)
        .in('event_id', eventIds);

      const notifiedSet = new Set((alreadyNotified ?? []).map((r: { event_id: string }) => r.event_id));
      const newEspnEvents = significantEvents.filter(ev => !notifiedSet.has(`espn-${ev.id}`));

      // ── 6. Handle match completion (ESPN confirms it) ─────────────────────
      if (completed) {
        const { data: hasFinalized } = await supabase
          .from('live_match_events')
          .select('event_id')
          .eq('fixture_id', fixtureId)
          .eq('event_type', 'game_finalised')
          .limit(1);

        if (!hasFinalized?.length) {
          await supabase.from('live_match_events').upsert({
            fixture_id: fixtureId,
            event_id: 'espn-game_finalised',
            minute: 90,
            event_type: 'game_finalised',
            player_name: '',
            team_name: '',
            home_score: homeScore ?? 0,
            away_score: awayScore ?? 0,
          }, { onConflict: 'fixture_id,event_id' });

          console.log(`[CronMatchEvents] ESPN confirmed finish: ${fixture.homeTeam} vs ${fixture.awayTeam} (${fixtureId}) ${homeScore}-${awayScore}`);

          // Compute rewards server-side
          for (const ct of CONTEST_TYPES) {
            fetch(`${appUrl}/api/prize/submit`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fixtureId, contestType: ct }),
            }).catch(e => console.error('[CronMatchEvents] prize/submit failed:', e));
          }
        }
      }

      if (newEspnEvents.length === 0) continue;

      // ── 7. Write new events to live_match_events ──────────────────────────
      const upsertRows = newEspnEvents.map(ev => {
        const fantasyType = mapEspnEventType(ev.type, undefined, ev.shootout) ?? ev.type;
        const primary = ev.participants[0];
        const espnPlayerId = primary?.athleteId ?? '';
        const ourPlayerId = playerIdMap[espnPlayerId] ?? '';
        const playerInfo = ourPlayerId ? WC2026_PLAYERS.find(p => p.id === ourPlayerId) : null;
        const playerName = primary?.displayName || playerInfo?.name || '';

        const isHome = ev.teamId === homeTeamId || ev.teamName === fixture.homeTeam;
        const teamName = isHome ? fixture.homeTeam : fixture.awayTeam;

        // Compute minute
        const minute = ev.period === 1
          ? Math.floor(ev.clockSeconds / 60)
          : ev.period === 2
            ? 45 + Math.floor(Math.max(0, ev.clockSeconds - 2700) / 60)
            : Math.floor(ev.clockSeconds / 60);

        return {
          fixture_id: fixtureId,
          event_id: `espn-${ev.id}`,
          minute: Math.max(0, minute),
          event_type: fantasyType,
          player_name: playerName,
          team_name: teamName,
          home_score: homeScore ?? 0,
          away_score: awayScore ?? 0,
        };
      });

      await supabase.from('live_match_events')
        .upsert(upsertRows, { onConflict: 'fixture_id,event_id' });

      // ── 8. Telegram notifications ─────────────────────────────────────────
      const { data: subs } = await supabase
        .from('telegram_subscriptions')
        .select('chat_id')
        .eq('contest_id', fixtureId);

      if (!subs?.length) {
        // Mark as notified even without subscribers
        await supabase.from('notified_events').upsert(
          eventIds
            .filter(id => !notifiedSet.has(id))
            .map(id => ({ fixture_id: fixtureId, event_id: id }))
        );
        continue;
      }

      let sent = 0;

      for (const ev of newEspnEvents) {
        const fantasyType = mapEspnEventType(ev.type, undefined, ev.shootout) ?? ev.type;
        if (!fantasyType || !SIGNIFICANT.has(fantasyType)) continue;
        if (SILENT_DB_ONLY.has(fantasyType)) continue;

        // HT/FT stats block
        if (STATS_ONLY.has(fantasyType)) {
          const dedupId = fantasyType === 'half_time' ? 'stats-half_time' : 'stats-full_time';
          const { error: dedupErr } = await supabase
            .from('notified_events')
            .insert({ fixture_id: fixtureId, event_id: dedupId });

          if (!dedupErr) {
            const { data: matchEvRows } = await supabase
              .from('live_match_events')
              .select('event_type, team_name, home_score, away_score')
              .eq('fixture_id', fixtureId);

            const cnt = (type: string, team: string) =>
              (matchEvRows ?? []).filter(e => e.event_type === type && e.team_name === team).length;

            const latestRow = (matchEvRows ?? []).slice(-1)[0];
            const dbScore = {
              home: latestRow?.home_score ?? (homeScore ?? 0),
              away: latestRow?.away_score ?? (awayScore ?? 0),
            };

            const statsLabel = fantasyType === 'half_time' ? 'Half Time' : 'Full Time';
            const serverStats = {
              goals:   [cnt('goal', fixture.homeTeam), cnt('goal', fixture.awayTeam)] as [number, number],
              corners: [cnt('corner_kick', fixture.homeTeam), cnt('corner_kick', fixture.awayTeam)] as [number, number],
              yellows: [cnt('yellow_card', fixture.homeTeam), cnt('yellow_card', fixture.awayTeam)] as [number, number],
              reds:    [cnt('red_card', fixture.homeTeam), cnt('red_card', fixture.awayTeam)] as [number, number],
              saves:   [cnt('goalkeeper_save', fixture.homeTeam), cnt('goalkeeper_save', fixture.awayTeam)] as [number, number],
              subs:    [cnt('substitution', fixture.homeTeam), cnt('substitution', fixture.awayTeam)] as [number, number],
              dangers: [cnt('danger_attack', fixture.homeTeam), cnt('danger_attack', fixture.awayTeam)] as [number, number],
            };

            const homeFlag = getTeamFlag(fixture.homeTeam);
            const awayFlag = getTeamFlag(fixture.awayTeam);
            const text = formatMatchStats({
              label: statsLabel, score: dbScore, stats: serverStats,
              homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam,
              homeFlag, awayFlag,
            });
            await Promise.allSettled(subs.map(s => sendMessage(s.chat_id, text, { parse_mode: 'Markdown' })));

            fetch(`${appUrl}/api/telegram/leaderboard`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contestId: fixtureId, contestType: 'all', label: statsLabel,
                homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam,
                homeFlag, awayFlag, score: dbScore,
              }),
            }).catch(e => console.error('[CronMatchEvents] leaderboard push failed:', e));
          }
          continue;
        }

        // Individual event notification
        const primary = ev.participants[0];
        const espnPlayerId = primary?.athleteId ?? '';
        const ourPlayerId = playerIdMap[espnPlayerId] ?? '';
        const playerInfo = ourPlayerId ? WC2026_PLAYERS.find(p => p.id === ourPlayerId) : null;
        const playerName = primary?.displayName || playerInfo?.name || '';
        const isHome = ev.teamId === homeTeamId || ev.teamName === fixture.homeTeam;
        const teamName = isHome ? fixture.homeTeam : fixture.awayTeam;
        const homeFlag = getTeamFlag(fixture.homeTeam);
        const awayFlag = getTeamFlag(fixture.awayTeam);
        const teamFlag = isHome ? homeFlag : awayFlag;
        const minute = ev.period === 1
          ? Math.floor(ev.clockSeconds / 60)
          : 45 + Math.floor(Math.max(0, ev.clockSeconds - 2700) / 60);

        // Substitution: player in vs out
        let playerOut: string | undefined;
        if (fantasyType === 'substitution' && ev.participants[1]) {
          playerOut = ev.participants[1].displayName || 'Unknown';
        }

        const text = formatMatchEvent({
          eventType: fantasyType, playerName, playerOut, teamName, teamFlag, minute,
          homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam,
          homeFlag, awayFlag,
          score: { home: homeScore ?? 0, away: awayScore ?? 0 },
        });

        await Promise.allSettled(subs.map(sub => sendMessage(sub.chat_id, text, { parse_mode: 'Markdown' })));
        sent += subs.length;
      }

      // ── 9. Fantasy points personal notifications ──────────────────────────
      const FANTASY_EVENTS = new Set(['goal', 'own_goal', 'red_card', 'yellow_card', 'penalty_save', 'penalty_won']);
      const scoringEspnEvents = newEspnEvents.filter(ev => {
        const ft = mapEspnEventType(ev.type, undefined, ev.shootout);
        return ft && FANTASY_EVENTS.has(ft);
      });

      if (scoringEspnEvents.length > 0 && subs.length > 0) {
        const chatIds = subs.map((s: { chat_id: number }) => s.chat_id);
        const { data: tgUsers } = await supabase
          .from('telegram_users')
          .select('chat_id, wallet_address')
          .in('chat_id', chatIds);

        if (tgUsers?.length) {
          const wallets = tgUsers.map((u: any) => u.wallet_address).filter(Boolean);
          const { data: entries } = await supabase
            .from('contest_entries')
            .select('wallet_address, lineup')
            .eq('fixture_id', fixtureId)
            .in('wallet_address', wallets);

          if (entries?.length) {
            const walletToChat = new Map(tgUsers.map((u: any) => [u.wallet_address, u.chat_id]));
            for (const entry of entries) {
              const chatId = walletToChat.get(entry.wallet_address);
              if (!chatId || !entry.lineup?.players?.length) continue;

              const msgs: string[] = [];
              for (const ev of scoringEspnEvents) {
                const fantasyType = mapEspnEventType(ev.type, undefined, ev.shootout);
                if (!fantasyType) continue;

                const primary = ev.participants[0];
                const espnPlayerId = primary?.athleteId ?? '';
                const ourId = playerIdMap[espnPlayerId] ?? matchPlayerName(primary?.displayName ?? '', fixture.homeTeam) ?? matchPlayerName(primary?.displayName ?? '', fixture.awayTeam);
                const displayName = primary?.displayName || (ourId ? WC2026_PLAYERS.find(p => p.id === ourId)?.name ?? '' : '');
                if (!displayName) continue;

                let matched = ourId
                  ? entry.lineup.players.find((p: any) => p.id === ourId)
                  : null;
                if (!matched) {
                  const nameParts = displayName.toLowerCase().split(/\s+/).filter((p: string) => p.length >= 3);
                  matched = entry.lineup.players.find((p: any) =>
                    nameParts.some((part: string) => (p.name ?? '').toLowerCase().includes(part))
                  );
                }
                if (!matched) continue;

                const basePts = calculateEventPoints(fantasyType, matched.position ?? 'ATT');
                if (basePts === 0) continue;

                const isCaptain = entry.lineup.captain === matched.id;
                const stars = (entry.lineup.confidence ?? {})[matched.id] ?? 3;
                const pts = resolvePlayerDelta(basePts, { isCaptain, confidenceStars: stars });
                const ptsStr = pts > 0 ? `+${pts}` : `${pts}`;
                const evEmoji: Record<string, string> = {
                  goal: '⚽', own_goal: '😰', red_card: '🟥', yellow_card: '🟨',
                  penalty_save: '🧤', penalty_won: '🎯',
                };
                const emoji = evEmoji[fantasyType] ?? '📊';
                const minute = ev.period === 1
                  ? Math.floor(ev.clockSeconds / 60)
                  : 45 + Math.floor(Math.max(0, ev.clockSeconds - 2700) / 60);
                const capNote = isCaptain ? ' *(C) ×2*' : '';
                msgs.push(`${emoji} *${displayName}* — ${fantasyType.replace(/_/g, ' ').toUpperCase()} (${minute}')\n*${ptsStr} pts*${capNote}`);
              }

              if (msgs.length > 0) {
                await sendMessage(chatId,
                  `🎮 *Fantasy Points Update*\n\n${msgs.join('\n\n')}\n\n_Open app to see your full score_`,
                  { parse_mode: 'Markdown' }
                );
              }
            }
          }
        }
      }

      // Mark events as notified
      const newEventIds = newEspnEvents.map(ev => `espn-${ev.id}`);
      await supabase.from('notified_events').upsert(
        newEventIds.map(id => ({ fixture_id: fixtureId, event_id: id }))
      );

      results[fixtureId] = sent;
    } catch (err) {
      console.error(`[CronMatchEvents] Error for fixture ${fixtureId}:`, err);
    }
  }

  return NextResponse.json({
    ok: true,
    liveFixtures: liveFixtures.length,
    results,
  });
}
