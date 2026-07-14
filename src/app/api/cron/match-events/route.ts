import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMessage, formatMatchEvent, formatMatchStats } from '@/lib/telegram-bot';
import { WC2026_FIXTURES } from '@/lib/wc2026-fixtures';
import { mergeEvents } from '@/lib/txline';
import { calculateEventPoints } from '@/lib/fantasy-engine';
import { matchPlayerName, buildPlayerIdMap } from '@/lib/txline-bridge';
import { WC2026_PLAYERS } from '@/lib/wc2026-players-static';
import { getFixtureIdRemap, discoverAndSync } from '@/lib/fixture-remap';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SIGNIFICANT = new Set([
  'goal', 'penalty_outcome', 'own_goal', 'red_card', 'penalty_save',
  'half_time', 'full_time', 'game_finalised',
  'yellow_card', 'substitution', 'corner_kick', 'var_review', 'extra_time',
  'penalty_won', 'penalty_missed', 'kick_off',
]);

// These events are stored in live_match_events and marked as notified,
// but NOT sent as individual Telegram messages — a rich stats block is
// sent by the cron instead (same dedup key as /api/telegram/stats).
// game_finalised = true end for knockout matches (after ET/pens).
const STATS_ONLY = new Set(['half_time', 'full_time', 'game_finalised']);

const ACTION_MAP: Record<string, string> = {
  goal: 'goal', scored: 'goal', penalty_outcome: 'goal', penaltyoutcome: 'goal',
  own_goal: 'own_goal', owngoal: 'own_goal',
  yellowcard: 'yellow_card', yellow_card: 'yellow_card',
  redcard: 'red_card', red_card: 'red_card',
  substitution: 'substitution', sub: 'substitution',
  penalty_save: 'penalty_save', penaltysave: 'penalty_save',
  half_time: 'half_time', halftime: 'half_time', halftime_finalised: 'half_time',
  full_time: 'full_time', fulltime: 'full_time',
  // game_finalised = definitive match end (after ET/pens for knockout matches)
  game_finalised: 'game_finalised',
  kick_off: 'kick_off', kickoff: 'kick_off', secondhalf: 'kick_off',
  // TxLINE raw event type names (from txodds.ts mapEventToFantasyType):
  corner: 'corner_kick', corner_kick: 'corner_kick',
  var: 'var_review', var_review: 'var_review',
  penalty: 'penalty_won', penaltymiss: 'penalty_missed', penalty_miss: 'penalty_missed',
};

// GET /api/cron/match-events?secret=<CRON_SECRET>
// Called by an external cron service (e.g. cron-job.org) every 60 seconds.
// Polls TxLINE for live match events and sends Telegram notifications to subscribers.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://odds-draft.vercel.app';

  // Find matches that are currently live (started within last 4h to handle delays).
  // Use TxLINE-enriched schedule as the source of truth for kickoff times so that
  // placeholder dates in WC2026_FIXTURES never cause the cron to miss a live match.
  const now = Date.now();
  let fixtureSource = WC2026_FIXTURES as typeof WC2026_FIXTURES;
  try {
    const schedRes = await fetch(`${appUrl}/api/schedule/wc2026`, { cache: 'no-store' });
    if (schedRes.ok) {
      const enriched = await schedRes.json();
      if (Array.isArray(enriched) && enriched.length > 0) fixtureSource = enriched;
    }
  } catch { /* fall through to static */ }

  const liveFixtures = fixtureSource.filter(f => {
    if (!f.kickoffAt) return false;
    const ko = new Date(f.kickoffAt).getTime();
    return now > ko - 90 * 60 * 1000 && now < ko + 4 * 3600 * 1000;
  });

  if (liveFixtures.length === 0) {
    return NextResponse.json({ ok: true, message: 'No live matches right now' });
  }

  const results: Record<string, number> = {};
  const debug: Record<string, any> = {};

  // Fetch once per cron run — result is cached server-side for 5 min
  const fixtureRemap = await getFixtureIdRemap();

  for (const fixture of liveFixtures) {
    const dbg: Record<string, any> = { ourId: fixture.fixtureId, kickoffAt: fixture.kickoffAt };
    debug[fixture.fixtureId] = dbg;
    try {
      // Remap our placeholder fixture IDs to the ones TxLINE actually uses.
      // DB operations (notified_events, contest_entries) keep using fixture.fixtureId.
      let txlineFixtureId = fixtureRemap[fixture.fixtureId] ?? fixture.fixtureId;
      dbg.txlineId = txlineFixtureId;

      // Use server-side proxy — injects auth, no client token needed.
      // Path matches live page: /api/txline/api/scores/updates/{id}
      // Proxy returns a raw SSE array; mergeEvents() merges it into a state object with _allEvents.
      let scoreRes = await fetch(`${appUrl}/api/txline/api/scores/updates/${txlineFixtureId}`, { cache: 'no-store' });
      dbg.scoresStatus = scoreRes.status;

      // 403/404 means TxLINE doesn't know this fixture ID — our static ID is a placeholder.
      // Also run discovery when events come back empty (ID known but no data yet).
      const needsDiscovery = (!scoreRes.ok && (scoreRes.status === 403 || scoreRes.status === 404)) || scoreRes.ok;
      let scoreArr: any = scoreRes.ok ? await scoreRes.json() : [];
      let raw: any = Array.isArray(scoreArr) && scoreArr.length > 0 ? mergeEvents(scoreArr) : (scoreArr ?? {});
      let allEvents: any[] = Array.isArray((raw as any)?._allEvents) ? (raw as any)._allEvents : [];
      dbg.allEvents = allEvents.length;

      // Attempt auto-discovery by kickoff time when our ID is unrecognised or returns nothing.
      if (needsDiscovery && allEvents.length === 0 && fixture.kickoffAt) {
        const discovered = await discoverAndSync(fixture.fixtureId, fixture.kickoffAt, appUrl);
        dbg.discovered = discovered;
        if (discovered && discovered !== txlineFixtureId) {
          txlineFixtureId = discovered;
          dbg.txlineId = txlineFixtureId;
          scoreRes = await fetch(`${appUrl}/api/txline/api/scores/updates/${txlineFixtureId}`, { cache: 'no-store' });
          dbg.scoresStatusAfterRemap = scoreRes.status;
          if (scoreRes.ok) {
            scoreArr = await scoreRes.json();
            raw = Array.isArray(scoreArr) && scoreArr.length > 0 ? mergeEvents(scoreArr) : (scoreArr ?? {});
            allEvents = Array.isArray((raw as any)?._allEvents) ? (raw as any)._allEvents : [];
            dbg.allEventsAfterRemap = allEvents.length;
          }
        }
      }

      if (!scoreRes.ok && allEvents.length === 0) { dbg.skip = 'scores_not_ok'; continue; }
      if (allEvents.length === 0) { dbg.skip = 'no_events'; continue; }

      // Score from authoritative TxLINE source
      const scoreHome: number = (raw as any)?.Score?.Participant1?.Total?.Goals ?? 0;
      const scoreAway: number = (raw as any)?.Score?.Participant2?.Total?.Goals ?? 0;

      // Filter confirmed events only — TxLINE sends Confirmed=false first, then Confirmed=true.
      const confirmedEvents = allEvents.filter(ev => ev.Confirmed !== false);

      // Filter only significant events we haven't notified about yet
      const sigConfirmed = confirmedEvents.filter(ev => {
        const rawType = (ev.Action ?? ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
        const mapped = ACTION_MAP[rawType] ?? rawType;
        return SIGNIFICANT.has(mapped);
      });

      dbg.confirmedEvents = confirmedEvents.length;
      dbg.sigConfirmed = sigConfirmed.length;
      if (sigConfirmed.length === 0) { dbg.skip = 'no_sig_confirmed'; continue; }

      // TxLINE sometimes sends two Confirmed=true events for the same moment
      // (consecutive Seq numbers, same action/minute/participant). Deduplicate by
      // content key before hitting the notified_events table so we never send twice.
      const seenContentKeys = new Set<string>();
      const candidateEvents: typeof sigConfirmed = [];
      for (const ev of sigConfirmed) {
        const rawType = (ev.Action ?? ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
        const mapped = ACTION_MAP[rawType] ?? rawType;
        const min = ev.Clock?.Seconds ? Math.floor(ev.Clock.Seconds / 60) : parseInt(ev.minute) || 0;
        const d = ev.Data?.New ?? ev.Data ?? {};
        const participant: number = (typeof d === 'object' ? (d as any).Participant : null) ?? ev.Participant ?? 0;
        const contentKey = `${mapped}-${min}-${participant}`;
        if (!seenContentKeys.has(contentKey)) {
          seenContentKeys.add(contentKey);
          candidateEvents.push(ev);
        }
      }

      // Event IDs use content key (not raw Seq) so that TxLINE double-sends of the
      // same logical event always map to the same ID in notified_events.
      const eventIds = candidateEvents.map(ev => {
        const rawType = (ev.Action ?? ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
        const mapped = ACTION_MAP[rawType] ?? rawType;
        const min = ev.Clock?.Seconds ? Math.floor(ev.Clock.Seconds / 60) : parseInt(ev.minute) || 0;
        const d = ev.Data?.New ?? ev.Data ?? {};
        const participant: number = (typeof d === 'object' ? (d as any).Participant : null) ?? ev.Participant ?? 0;
        return `${mapped}-${min}-${participant}`;
      });

      const { data: alreadyNotified } = await supabase
        .from('notified_events')
        .select('event_id')
        .eq('fixture_id', fixture.fixtureId)
        .in('event_id', eventIds);

      const notifiedSet = new Set((alreadyNotified ?? []).map((r: { event_id: string }) => r.event_id));
      const newEvents = candidateEvents.filter((ev, i) => !notifiedSet.has(eventIds[i]));

      dbg.newEvents = newEvents.length;
      dbg.alreadyNotified = notifiedSet.size;
      if (newEvents.length === 0) { dbg.skip = 'all_already_notified'; continue; }

      // Build TxLINE PlayerId → internal player ID map for name resolution
      const apiToken = process.env.TXODDS_API_TOKEN ?? process.env.NEXT_PUBLIC_TXODDS_API_TOKEN ?? '';
      const playerIdMap: Record<string, string> = apiToken
        ? await buildPlayerIdMap(apiToken, txlineFixtureId, fixture.homeTeam, fixture.awayTeam)
        : {};

      // Fetch subscribers for this match
      const { data: subs } = await supabase
        .from('telegram_subscriptions')
        .select('chat_id')
        .eq('contest_id', fixture.fixtureId);

      if (!subs?.length) {
        // Still mark as notified so we don't reprocess
        await supabase.from('notified_events').upsert(
          newEvents.map((ev, i) => {
            const idx = candidateEvents.indexOf(newEvents[i]);
            return { fixture_id: fixture.fixtureId, event_id: eventIds[idx] };
          })
        );
        continue;
      }

      // ── Write all new events to live_match_events (for /points command) ──
      await supabase.from('live_match_events').upsert(
        newEvents.map((ev, i) => {
          const idx = candidateEvents.indexOf(newEvents[i]);
          const rawType = (ev.Action ?? ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
          const eventType = ACTION_MAP[rawType] ?? rawType;
          const minSec = ev.Clock?.Seconds ? Math.floor(ev.Clock.Seconds / 60) : parseInt(ev.minute) || 0;
          // TxLINE native format: player info lives in Data.New, not top-level
          const d = ev.Data?.New ?? ev.Data ?? {};
          const rawPName = d.PlayerName ?? ev.Player ?? ev.player ?? '';
          const participant: number = d.Participant ?? ev.Participant ?? 1;
          const tName = participant === 2 ? fixture.awayTeam : fixture.homeTeam;
          const txPId = String(d.PlayerId ?? d.Player1Id ?? '');
          const rId = rawPName
            ? matchPlayerName(rawPName, tName)
            : (txPId ? playerIdMap[txPId] : null);
          const rPlayer = rId ? WC2026_PLAYERS.find(p => p.id === rId) : null;
          return {
            fixture_id: fixture.fixtureId,
            event_id: eventIds[idx],
            minute: minSec,
            event_type: eventType,
            player_name: rPlayer?.name ?? rawPName,
            team_name: tName,
            home_score: scoreHome,
            away_score: scoreAway,
          };
        }),
        { onConflict: 'fixture_id,event_id' }
      );

      let sent = 0;
      for (let i = 0; i < newEvents.length; i++) {
        const ev = newEvents[i];
        const rawType = (ev.Action ?? ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
        const eventType = ACTION_MAP[rawType] ?? rawType;

        // HT/FT stats: send rich stats block even when no browser tab is open.
        // For knockout matches (QF/SF/Final), TxLINE sends full_time at 90 min
        // but the match may continue to ET/pens. We skip full_time stats for
        // knockout stages and wait for game_finalised (the definitive end signal).
        // For group/r32/r16 there is no ET, so full_time is always the real end.
        if (STATS_ONLY.has(eventType)) {
          const isKnockoutStage = ['qf', 'sf', 'final'].includes(fixture.stage as string);
          // Knockout: defer FT stats until game_finalised arrives
          if (eventType === 'full_time' && isKnockoutStage) { continue; }
          // Non-knockout: full_time already handled stats, skip game_finalised
          if (eventType === 'game_finalised' && !isKnockoutStage) { continue; }

          const statsLabel = eventType === 'half_time' ? 'Half Time' : 'Full Time';
          // game_finalised (knockout) shares the same dedup key as full_time so
          // if somehow both fire we never double-send.
          const dedupId = eventType === 'half_time' ? 'stats-half_time' : 'stats-full_time';
          const { error: dedupErr } = await supabase
            .from('notified_events')
            .insert({ fixture_id: fixture.fixtureId, event_id: dedupId });
          if (!dedupErr) {
            // Build stats from live_match_events — same approach as /api/telegram/stats
            const { data: matchEvRows } = await supabase
              .from('live_match_events')
              .select('event_type, team_name, home_score, away_score')
              .eq('fixture_id', fixture.fixtureId);
            const cnt = (type: string, team: string) =>
              (matchEvRows ?? []).filter(e => e.event_type === type && e.team_name === team).length;
            const latestRow = (matchEvRows ?? []).slice(-1)[0];
            const dbScore = { home: latestRow?.home_score ?? scoreHome, away: latestRow?.away_score ?? scoreAway };
            const serverStats = {
              goals:   [cnt('goal',             fixture.homeTeam), cnt('goal',             fixture.awayTeam)] as [number,number],
              corners: [cnt('corner_kick',      fixture.homeTeam), cnt('corner_kick',      fixture.awayTeam)] as [number,number],
              yellows: [cnt('yellow_card',      fixture.homeTeam), cnt('yellow_card',      fixture.awayTeam)] as [number,number],
              reds:    [cnt('red_card',         fixture.homeTeam), cnt('red_card',         fixture.awayTeam)] as [number,number],
              saves:   [cnt('goalkeeper_save',  fixture.homeTeam), cnt('goalkeeper_save',  fixture.awayTeam)] as [number,number],
              subs:    [cnt('substitution',     fixture.homeTeam), cnt('substitution',     fixture.awayTeam)] as [number,number],
              dangers: [cnt('danger_attack',    fixture.homeTeam), cnt('danger_attack',    fixture.awayTeam)] as [number,number],
            };
            const { data: tgSubs } = await supabase
              .from('telegram_subscriptions')
              .select('chat_id')
              .eq('contest_id', fixture.fixtureId);
            if (tgSubs?.length) {
              const text = formatMatchStats({
                label: statsLabel, score: dbScore, stats: serverStats,
                homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam,
                homeFlag: fixture.homeFlag ?? '', awayFlag: fixture.awayFlag ?? '',
              });
              await Promise.allSettled(tgSubs.map(s => sendMessage(s.chat_id, text, { parse_mode: 'Markdown' })));
              console.log(`[CronMatchEvents] ${statsLabel} stats → ${tgSubs.length} subscribers (${fixture.fixtureId})`);
            }

            // Push live leaderboard + personal points to subscribers at the same HT/FT moment
            fetch(`${appUrl}/api/telegram/leaderboard`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contestId: fixture.fixtureId,
                contestType: 'all',
                label: statsLabel,
                homeTeam: fixture.homeTeam,
                awayTeam: fixture.awayTeam,
                homeFlag: fixture.homeFlag ?? '',
                awayFlag: fixture.awayFlag ?? '',
                score: dbScore,
              }),
            }).catch(e => console.error('[CronMatchEvents] leaderboard push failed:', e));
          }
          // else: 23505 = already sent by browser tab or earlier cron run — skip
          continue;
        }

        const minute = ev.Clock?.Seconds ? Math.floor(ev.Clock.Seconds / 60) : parseInt(ev.minute) || 0;
        const evData = ev.Data?.New ?? ev.Data ?? {};

        // Determine team participant (1 = home, 2 = away)
        const participant: number = evData.Participant ?? ev.Participant ?? 1;
        const isHome = participant === 1;
        const teamName = isHome ? fixture.homeTeam : fixture.awayTeam;
        const teamFlag = isHome ? (fixture.homeFlag ?? '') : (fixture.awayFlag ?? '');

        // Resolve primary player name
        const rawPlayerName = evData.PlayerName ?? ev.Player ?? ev.player ?? '';
        const txPId2 = String(evData.PlayerId ?? evData.Player1Id ?? '');
        const resolvedId = rawPlayerName
          ? matchPlayerName(rawPlayerName, teamName)
          : (txPId2 ? playerIdMap[txPId2] : null);
        const resolvedPlayer = resolvedId ? WC2026_PLAYERS.find(p => p.id === resolvedId) : null;
        const playerName = resolvedPlayer?.name ?? rawPlayerName;

        // For substitutions: resolve both the player going IN and OUT
        let playerOut: string | undefined;
        if (eventType === 'substitution') {
          const outRaw = evData.PlayerOutName ?? evData.Player1Name ?? '';
          const inRaw  = evData.PlayerInName  ?? evData.Player2Name ?? '';
          const outId = outRaw ? matchPlayerName(outRaw, teamName) : null;
          const inId  = inRaw  ? matchPlayerName(inRaw,  teamName) : null;
          playerOut = (outId ? WC2026_PLAYERS.find(p => p.id === outId)?.name : null) ?? outRaw ?? undefined;
          const playerIn = (inId ? WC2026_PLAYERS.find(p => p.id === inId)?.name : null) ?? inRaw ?? playerName ?? undefined;
          const text = formatMatchEvent({
            eventType,
            playerName: playerIn ?? '',
            playerOut,
            teamName, teamFlag,
            minute,
            homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam,
            homeFlag: fixture.homeFlag ?? '', awayFlag: fixture.awayFlag ?? '',
            score: { home: scoreHome, away: scoreAway },
          });
          await Promise.allSettled(subs.map(sub => sendMessage(sub.chat_id, text, { parse_mode: 'Markdown' })));
          sent += subs.length;
          continue;
        }

        const text = formatMatchEvent({
          eventType, playerName, teamName, teamFlag,
          minute,
          homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam,
          homeFlag: fixture.homeFlag ?? '', awayFlag: fixture.awayFlag ?? '',
          score: { home: scoreHome, away: scoreAway },
        });

        await Promise.allSettled(subs.map(sub => sendMessage(sub.chat_id, text, { parse_mode: 'Markdown' })));
        sent += subs.length;
      }

      // Mark all new events as notified
      const newEventIds = newEvents.map(ev => eventIds[candidateEvents.indexOf(ev)]);
      await supabase.from('notified_events').upsert(
        newEventIds.map(id => ({ fixture_id: fixture.fixtureId, event_id: id }))
      );

      // ── Fantasy points notifications ────────────────────────────────────────
      // For scoring events (goal, card, etc.), find subscribers whose lineup
      // contains the scoring player and send them a personal "you earned X pts" message.
      const FANTASY_EVENTS = new Set(['goal', 'own_goal', 'red_card', 'yellow_card', 'penalty_save']);
      const scoringEvents = newEvents.filter(ev => {
        const rt = (ev.Action ?? ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
        return FANTASY_EVENTS.has(ACTION_MAP[rt] ?? rt);
      });

      if (scoringEvents.length > 0 && subs.length > 0) {
        const chatIds = subs.map((s: { chat_id: number }) => s.chat_id);

        // chat_id → wallet_address
        const { data: tgUsers } = await supabase
          .from('telegram_users')
          .select('chat_id, wallet_address')
          .in('chat_id', chatIds);

        if (tgUsers?.length) {
          const wallets = tgUsers.map((u: any) => u.wallet_address).filter(Boolean);
          const { data: entries } = await supabase
            .from('contest_entries')
            .select('wallet_address, lineup')
            .eq('fixture_id', fixture.fixtureId)
            .in('wallet_address', wallets);

          if (entries?.length) {
            const walletToChat = new Map(tgUsers.map((u: any) => [u.wallet_address, u.chat_id]));

            for (const entry of entries) {
              const chatId = walletToChat.get(entry.wallet_address);
              if (!chatId || !entry.lineup?.players?.length) continue;

              const msgs: string[] = [];
              for (const ev of scoringEvents) {
                const rt = (ev.Action ?? ev.type ?? ev.action ?? '').toLowerCase().replace(/\s+/g, '_');
                const eventType = ACTION_MAP[rt] ?? rt;
                const evData3 = ev.Data?.New ?? ev.Data ?? {};
                const rawPName = (evData3.PlayerName ?? ev.Player ?? ev.player ?? '').trim();
                const evParticipant: number = evData3.Participant ?? ev.Participant ?? 1;
                const evTeam = evParticipant === 2 ? fixture.awayTeam : fixture.homeTeam;
                const txPId3 = String(evData3.PlayerId ?? evData3.Player1Id ?? '');
                const txResolvedId = rawPName
                  ? matchPlayerName(rawPName, evTeam)
                  : (txPId3 ? playerIdMap[txPId3] : null);
                if (!txResolvedId && !rawPName) continue;
                const displayName = txResolvedId
                  ? (WC2026_PLAYERS.find(p => p.id === txResolvedId)?.name ?? rawPName)
                  : rawPName;

                let matched = txResolvedId
                  ? entry.lineup.players.find((p: any) => p.id === txResolvedId)
                  : null;
                if (!matched) {
                  // Fallback: fuzzy last name match on display name
                  const nameParts = displayName.toLowerCase().split(/\s+/).filter((p: string) => p.length >= 3);
                  matched = entry.lineup.players.find((p: any) =>
                    nameParts.some((part: string) => (p.name ?? '').toLowerCase().includes(part))
                  );
                }
                if (!matched) continue;
                const playerName = displayName;

                let pts = calculateEventPoints(eventType, matched.position ?? 'ATT');
                if (pts === 0) continue;

                const isCaptain = entry.lineup.captain === matched.id;
                const stars = (entry.lineup.confidence ?? {})[matched.id] ?? 3;
                const confMult = [1, 1.1, 1.2, 1.35, 1.5][Math.min(stars, 5) - 1] ?? 1.2;
                pts = Math.round(pts * confMult * (isCaptain ? 2 : 1) * 10) / 10;

                const ptsStr = pts > 0 ? `+${pts}` : `${pts}`;
                const evEmoji: Record<string, string> = { goal:'⚽', own_goal:'😰', red_card:'🟥', yellow_card:'🟨', penalty_save:'🧤' };
                const emoji = evEmoji[eventType] ?? '📊';
                const min = ev.Clock?.Seconds ? Math.floor(ev.Clock.Seconds / 60) : parseInt(ev.minute) || 0;
                const capNote = isCaptain ? ' *(C) ×2*' : '';
                msgs.push(`${emoji} *${playerName}* — ${eventType.replace(/_/g, ' ').toUpperCase()} (${min}')\n*${ptsStr} pts*${capNote}`);
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
      // ── End fantasy points notifications ────────────────────────────────────

      results[fixture.fixtureId] = sent;
    } catch (err) {
      console.error(`[CronMatchEvents] Error for fixture ${fixture.fixtureId}:`, err);
    }
  }

  return NextResponse.json({ ok: true, liveFixtures: liveFixtures.length, results, debug });
}
