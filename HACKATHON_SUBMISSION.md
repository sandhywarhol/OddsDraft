# OddsDraft — Technical Documentation & TxLINE API Experience

> **Hackathon Submission · World Cup 2026 · July 2026**

OddsDraft is a Web3 fantasy football platform for World Cup 2026. Users build a 5-player lineup for any fixture, pay a SOL entry fee on-chain, and earn fantasy points in real-time as the match unfolds. Points are calculated from live TxLINE match events — goals, cards, penalty saves, and stat-based bonuses — and the top three finishers share the prize pool automatically via Solana.

---

## Table of Contents

**Part I — Project Documentation**
1. [Tech Stack](#1-tech-stack)
2. [System Architecture](#2-system-architecture)
3. [Live Data Flow](#3-live-data-flow)
4. [Fantasy Points Engine](#4-fantasy-points-engine)
5. [Full Scoring Reference](#5-full-scoring-reference)
6. [Halftime & Fulltime Stats Engine](#6-halftime--fulltime-stats-engine)
7. [Fixture ID Remap System](#7-fixture-id-remap-system)
8. [Cron Job & Telegram Notifications](#8-cron-job--telegram-notifications)
9. [Live Page Architecture](#9-live-page-architecture)
10. [Solana Integration](#10-solana-integration)

**Part II — TxLINE API Experience**
11. [Our Integration](#11-our-integration)
12. [What We Liked](#12-what-we-liked)
13. [Where We Hit Friction](#13-where-we-hit-friction)
14. [Workarounds We Built](#14-workarounds-we-built)
15. [Wishlist for TxLINE](#15-wishlist-for-txline)

---

# Part I — Project Documentation

## 1. Tech Stack

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | Next.js 16.2.9 App Router · React 19 · TypeScript | Full-stack framework; server actions + API routes |
| **Styling** | Tailwind CSS · Custom CSS modules | Responsive layout, dark theme, live UI |
| **Blockchain** | Solana (devnet) · Anchor · `@solana/web3.js` · Phantom wallet | On-chain payments, subscription gating, prize distribution |
| **Database** | Supabase (PostgreSQL) | Lineups, contest records, event dedup, fixture ID remap |
| **Live Data** | TxLINE / TxODDS API | Real-time match events, scores, lineups, player stats |
| **Notifications** | Telegram Bot API | Personal fantasy point alerts per subscriber |
| **Cron** | Vercel Cron (60s interval) | Polls TxLINE, processes events, dispatches Telegram messages |

### Key Files

| Path | Purpose |
|---|---|
| `src/lib/scoring-bank.ts` | Single source of truth for all fantasy point values. **169 lines** — any scoring change goes here only. |
| `src/lib/txline-bridge.ts` | Converts raw TxLINE event stream into typed `LiveEvent[]`. Handles event normalization, synthesis of secondary events (e.g. `penalty_conceded` from `penalty_won`). **564 lines.** |
| `src/lib/fixture-remap.ts` | `discoverAndSync()` — resolves stale static fixture IDs against the TxLINE schedule API using kickoff time matching. Persists remaps to Supabase. |
| `src/app/api/cron/match-events/route.ts` | Vercel Cron handler. Polls TxLINE, deduplicates events via Supabase, calculates fantasy points per user lineup, sends Telegram notifications. **562 lines.** |
| `src/app/live/[contestId]/page.tsx` | Real-time live match page. Manages game state machine, applies event-by-event and stats-based fantasy points, drives leaderboard. **5,066 lines.** |
| `src/lib/players.ts` | Registry of 330+ World Cup 2026 players with positions, teams, and demo event data. |
| `src/lib/wc2026-fixtures.ts` | Static WC2026 fixture schedule with TxLINE slot IDs (QF/SF/Final) used as primary keys. |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        OddsDraft Platform                           │
│                                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────────────┐ │
│  │  User's  │    │   Next.js    │    │       TxLINE API          │ │
│  │  Browser │◄──►│  App Router  │◄──►│  /scores/snapshot/{id}   │ │
│  │          │    │  (Vercel)    │    │  /scores/updates/{id}     │ │
│  └──────────┘    └──────────────┘    │  /fixtures/snapshot       │ │
│       │                │             └───────────────────────────┘ │
│       │ Phantom        │ Supabase                                   │
│       ▼ Wallet         ▼                                            │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────────────┐ │
│  │  Solana  │    │  PostgreSQL  │    │    Vercel Cron (60s)       │ │
│  │ Devnet   │    │  (Supabase)  │    │  /api/cron/match-events   │ │
│  │ Program  │    │  • lineups   │    │  → poll TxLINE            │ │
│  │ 9ExbZj.. │    │  • contests  │    │  → calc fantasy pts       │ │
│  └──────────┘    │  • notified_ │    │  → Telegram notify        │ │
│                  │    events    │    └───────────────────────────┘ │
│                  │  • fixture_  │                                   │
│                  │    id_remap  │                                   │
│                  └──────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
```

The platform operates in two modes:

- **Live Mode** — Connects to TxLINE real-time API. Users must hold a valid on-chain subscription (activated via the TxLINE Anchor program). Match events stream every 60 seconds via Vercel Cron. Telegram notifications deliver personal fantasy scoring updates to each subscriber.
- **Demo Mode** — Hardcoded replay events simulating a full match (73+ events). No API key required. Designed to let users experience the full scoring lifecycle without a live fixture.

---

## 3. Live Data Flow

Every 60 seconds, the Vercel Cron job executes this pipeline for each live fixture:

```
1. LOOKUP FIXTURE ID
   └─ Check fixture_id_remap table (Supabase)
   └─ Fallback: static WC2026_FIXTURES

2. FETCH LIVE EVENTS
   └─ GET /api/scores/updates/{txlineId}
   └─ 403/empty → trigger discoverAndSync()

3. PARSE & FILTER
   └─ Normalize via ACTION_MAP
   └─ Deduplicate via notified_events table (Supabase)
   └─ Drop Confirmed=false (tentative) events

4. SCORE PER LINEUP
   └─ Load user lineups from Supabase
   └─ Apply POSITION_SCORING × confidence × captain multiplier
   └─ Apply NFT card bonuses

5. NOTIFY USERS
   └─ Telegram Bot → personal fantasy score update per subscriber
```

Simultaneously, the client-side **live page** polls TxLINE directly every 60 seconds, building its own event stream for the real-time UI. Both paths use the same `scoring-bank.ts` values.

---

## 4. Fantasy Points Engine

All point values live in `src/lib/scoring-bank.ts` as a single `POSITION_SCORING` record. No hardcoded numbers exist anywhere else in the codebase. Every scoring change requires modifying exactly one file.

```typescript
export const POSITION_SCORING: Record<string, PositionRow> = {
  // Direct events
  goal:            { GK: 20, DEF: 15, MID: 12, SWG: 11, ATT: 10 },
  assist:          { GK:  6, DEF:  6, MID:  6, SWG:  6, ATT:  6 },
  yellow_card:     { GK: -2, DEF: -2, MID: -2, SWG: -2, ATT: -2 },
  red_card:        { GK: -5, DEF: -5, MID: -5, SWG: -5, ATT: -5 },

  // TxLINE doesn't send goal events for in-play penalties —
  // penalty_won IS the scoring event (+8 pts reflects winning AND likely converting).
  penalty_won:     { GK:  8, DEF:  8, MID:  8, SWG:  8, ATT:  8 },
  penalty_conceded:{ GK: -3, DEF: -3, MID:  0, SWG:  0, ATT:  0 },
  penalty_save:    { GK:  5, DEF:  0, MID:  0, SWG:  0, ATT:  0 },

  clean_sheet:     { GK:  5, DEF:  5, MID:  1, SWG:  1, ATT:  0 },
  goal_conceded:   { GK: -1, DEF: -1, MID:  0, SWG:  0, ATT:  0 },
  starting_xi:     { GK:  2, DEF:  2, MID:  2, SWG:  2, ATT:  2 },
};
```

### Multipliers

| Multiplier | Effect |
|---|---|
| **Captain (2×)** | User designates one captain; all their points are doubled |
| **Confidence 1★** | 1.0× base points |
| **Confidence 2★** | 1.1× base points |
| **Confidence 3★** | 1.2× base points |
| **Confidence 4★** | 1.35× base points |
| **Confidence 5★** | 1.5× base points |
| **NFT Card bonus** | Flat point bonus for specific event types; upgradeable on-chain |

**Effective point formula:**
```
effectivePts = round(
  POSITION_SCORING[eventType][position]
  × confidenceMultiplier(stars)
  × (isCaptain ? 2 : 1)
  + cardBonus(eventType)
, 2)
```

---

## 5. Full Scoring Reference

| Event | GK | DEF | MID | SWG | ATT | Notes |
|---|---|---|---|---|---|---|
| ⚽ Goal | 20 | 15 | 12 | 11 | 10 | Higher for unlikely scorers |
| 🎯 Assist | 6 | 6 | 6 | 6 | 6 | Uniform across positions |
| 🎯 Penalty Won | 8 | 8 | 8 | 8 | 8 | Replaces goal event (TxLINE doesn't send goal for pens) |
| 🧤 Penalty Save | 5 | 0 | 0 | 0 | 0 | GK only |
| 🟨 Yellow Card | −2 | −2 | −2 | −2 | −2 | |
| 🟥 Red Card | −5 | −5 | −5 | −5 | −5 | |
| 😰 Own Goal | −6 | −6 | −6 | −6 | −6 | |
| 🛡 Clean Sheet | 5 | 5 | 1 | 1 | 0 | Applied at full-time retrocompute |
| 😬 Goal Conceded | −1 | −1 | 0 | 0 | 0 | Real-time for GK/DEF |
| 🥅 Penalty Conceded | −3 | −3 | 0 | 0 | 0 | Synthesized from penalty_won on opposing team |
| 📋 Starting XI | 2 | 2 | 2 | 2 | 2 | Awarded once on match start |
| 🔄 Sub Appearance | 1 | 1 | 1 | 1 | 1 | |
| ⏱ Extra Time | 2 | 2 | 2 | 2 | 2 | All lineup players if match goes to ET |
| 🏆 Penalty Missed | −3 | −3 | −3 | −3 | −3 | |

---

## 6. Halftime & Fulltime Stats Engine

Beyond individual events, OddsDraft awards team-wide **stat bonuses** at the end of each half, evaluated using `evaluateHalfStats()` from `scoring-bank.ts`. These draw on per-period data from TxLINE's `Score.Participant1.Period1/Period2` fields.

| Bonus | Trigger Condition | GK | DEF | MID | SWG | ATT |
|---|---|---|---|---|---|---|
| Possession Dominant | Team possession ≥ 55% | +1 | +1 | +2 | +1 | +1 |
| Possession Edge | Team possession 50–54% | 0 | 0 | +1 | 0 | 0 |
| Attack Pressure | Team ≥ 5 danger attacks in half | 0 | 0 | +1 | +1 | +1 |
| Defensive Solid | Opponent ≤ 2 danger attacks | +2 | +1 | 0 | 0 | 0 |
| Corner Threat | Team ≥ 4 corners in half | 0 | 0 | 0 | +1 | 0 |
| Team Goal Bonus | Team scored ≥ 1 goal in half | 0 | 0 | 0 | +1 | +1 |
| Clean Half | Team conceded 0 goals in half | +1 | +1 | 0 | 0 | 0 |

Data sources:
- **Goals per half** → `Score.Participant1.Period1.Goals` (authoritative)
- **Corners per half** → `Score.Participant1.Period1.Corners` (authoritative)
- **Danger attacks** → rate-limited count of `danger_possession` / `high_danger_possession` events
- **Possession %** → ratio of possession action events per team (proxy; resets at halftime)

### Late-Joiner Retroactive Application

A user opening the live page after halftime misses the `HalfTime` game-state transition entirely. We solve this with a retroactive catch-up block in the polling loop:

```typescript
// Fires once when period stats + lineup are both available AND game is already past halftime.
// Prevents H1 stat bonuses from being silently skipped for users who joined mid-second-half.
if (!halftimePossAwardedRef.current && hasLineup && ps && isMounted &&
    ['HalfTime','SecondHalf','ExtraTime','Penalties','FullTime'].includes(catchUpGs ?? '')) {
  halftimePossAwardedRef.current = true;
  const htStats: HalfStats = {
    homeGoals:   ps.home.h1.goals,   // from Score.Participant1.Period1
    awayGoals:   ps.away.h1.goals,
    homeCorners: Math.max(halfCornerCountRef.current[1], ps.home.h1.corners),
    awayCorners: Math.max(halfCornerCountRef.current[2], ps.away.h1.corners),
    homeDangers: halfDangerCountRef.current[1],
    awayDangers: halfDangerCountRef.current[2],
    homePossessionPct: homePct,
    awayPossessionPct: 100 - homePct,
  };
  applyStatsBonuses(htStats, 45);
}
```

---

## 7. Fixture ID Remap System

TxLINE uses internal fixture IDs that don't match any public schedule data. We maintain a static mapping for WC2026 slot IDs:

| Round | Slot IDs |
|---|---|
| Quarter-Finals | `18210001`, `18210002`, `18210003`, `18210004` |
| Semi-Finals | `18220001`, `18220002` |
| 3rd Place | `18230001` |
| Final | `18240001` |

These IDs can be stale — TxLINE may have different IDs for the actual fixture on match day.

### discoverAndSync()

`src/lib/fixture-remap.ts` implements automatic fixture ID discovery. When our static ID returns a 403, we call `discoverAndSync()`, which fetches the full TxLINE fixtures list and finds the correct ID by matching kickoff time within a **±90 minute window**:

```typescript
const WINDOW = 90 * 60 * 1000; // ±90 min — SF kickoffs can be ≥1h off from our estimate

const match = fixtures.find(f => {
  const startMs = new Date(f.StartTime).getTime();
  return startMs > 0 && Math.abs(startMs - kickoffMs) < WINDOW;
});

if (match) {
  // Persist to Supabase so all future cron runs use the correct ID
  await supabase.from('fixture_id_remap')
    .upsert({ our_id: ourFixtureId, txline_id: match.FixtureId });
}
```

The discovered ID is persisted in Supabase's `fixture_id_remap` table so subsequent cron runs don't re-discover every time.

---

## 8. Cron Job & Telegram Notifications

The cron endpoint (`/api/cron/match-events`) runs every 60 seconds on Vercel. For each live fixture, it executes the full match-event pipeline and delivers personal Telegram notifications to subscribed users.

### Event Deduplication

TxLINE often re-sends the same event across multiple poll windows. We prevent duplicate notifications using a Supabase `notified_events` table, keyed by `(fixture_id, event_id)`. Only genuinely new events pass through to scoring and notification.

### Penalty Scoring Adaptation

> **TxLINE behavior:** Sends `penalty_won` when a penalty is awarded, but does **not** send a `goal` event when the penalty is converted. The score updates silently.

**Our adaptation:** `penalty_won` is promoted to the primary scoring event (+8 pts). When a `penalty_won` fires, we synthesize a `penalty_conceded` event for the opposing team's GK/DEF (−3 pts). This ensures:
- The player who won the penalty receives fair scoring credit
- The opposing goalkeeper and defenders are penalized appropriately
- Both events appear in the match events feed

### Event Dedup Pipeline

```typescript
// TxLINE sends 2–3 events per logical action (tentative → partial → full)
// We keep only the last Confirmed:true entry per Id
const idToEvent = new Map();
for (const e of rawAll.filter(e => e.Confirmed !== false)) {
  idToEvent.set(e.Id ?? e.Seq, e); // later (higher Seq) overwrites earlier
}
```

### Telegram Notification Format

```
⚽ *Kylian Mbappé* — GOAL (34')
*+18.0 pts* (🌟🌟🌟 conf · captain 2×)

🏆 *Your team*: 38.5 pts | Rank: 1st / 24
```

---

## 9. Live Page Architecture

The live match page (`/live/[contestId]`) is a 5,066-line React component managing the full lifecycle of a live football match. Key responsibilities:

- **Game state machine** — tracks transitions: `null → FirstHalf → HalfTime → SecondHalf → FullTime` (with `ExtraTime` and `Penalties` branches)
- **Event stream** — fetches snapshot on load (catches missed events), then polls TxLINE every 60s for updates. All events normalized through `convertTxLineUpdates()`
- **Fantasy scoring** — applies points per event in real-time, including deferred retrocompute at full-time (clean sheets, goals against)
- **Stats bonuses** — calls `applyStatsBonuses()` at halftime and full-time using `Score.Period1/Period2` data
- **Leaderboard** — maintains a live-sorted leaderboard of all contest participants
- **Anti-double-count guards** — ref-based flags (`halftimePossAwardedRef`, `fulltimePossAwardedRef`, `retroComputedRef`) prevent duplicate point application across re-renders and re-polls

### Retrocompute at Full-Time

Clean sheets cannot be determined until the match ends. At full-time, the live page runs a retrocompute pass over all GK/DEF players:

```typescript
// Subtract penalty goals from goalsAgainst (penalty_conceded already applied real-time)
const penGoals = penConcededByTeam[p.team] ?? 0;
const goalsAgainst = Math.max(0, totalGoalsAgainst - penGoals);

if (goalsAgainst === 0) {
  // Award clean sheet bonus — skip if 'goal conceded' already in history (real-time path)
  if (!alreadyHasGC) applyCleanSheet(p);
} else {
  // Deduct goal_conceded — skip if already applied real-time
  if (!alreadyHasGC) applyGoalsConceded(p, goalsAgainst);
}
```

---

## 10. Solana Integration

| Operation | Description |
|---|---|
| **Subscription Gating** | Users interact with the TxLINE Anchor program (`9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA`) to subscribe on-chain. The resulting tx signature activates a real-time API token. |
| **Contest Entry** | Users pay a SOL entry fee into the contest treasury wallet. Entry recorded in Supabase with wallet address and lineup. |
| **Prize Distribution** | At full-time, the platform auto-distributes: 50% to 1st, 30% to 2nd, 20% to 3rd. Signed server-side transaction transfers SOL from treasury to each winner. |
| **NFT Boost Cards** | On-chain NFT cards can be equipped to lineup players. Cards grant bonus points for specific event types and can be upgraded with on-chain credits. |

---

# Part II — TxLINE API Experience

## 11. Our Integration

We built OddsDraft on top of TxLINE as our sole source of real-time match data. During the World Cup 2026 semi-final between France and Spain, we had our first real production stress-test — a live audience, actual SOL prize pools, and every edge case revealing itself in real-time.

This section is our honest account of integrating TxLINE: the moments that impressed us, the pain points that required creative workarounds, and the behaviors we had to reverse-engineer from live responses because no documentation covered them.

---

## 12. What We Liked

### ✅ 1. Action-based event stream with rich granularity

TxLINE sends each match event as a top-level `Action` field on the event object. This made parsing straightforward: one `ACTION_MAP` lookup normalizes any event type to our fantasy type. The range of supported action types is genuinely impressive — `safe_possession`, `attack_possession`, `danger_possession`, `high_danger_possession`, `penalty_won`, `penalty_save`, `halftime_finalised`, `game_finalised` and dozens more.

We built a full danger attack feed and possession tracking purely from these granular events, which no traditional odds API provides.

### ✅ 2. Period-keyed score data (Period1 / Period2 / Total)

The `Score.Participant1.Period1.{Goals, Corners, YellowCards, RedCards}` structure was the backbone of our halftime stats engine. Being able to know exactly how many corners each team earned in the first half — separate from the second half — let us award possession/corner bonuses at halftime with real data rather than approximations.

This is the detail that made our stats fantasy engine genuinely meaningful rather than cosmetic.

### ✅ 3. Definitive game-state action events

`halftime_finalised` and `game_finalised` are the most reliable signals in the TxLINE stream. Unlike the `GameState` field (which can lag or be absent), these action events definitively mark the end of a period.

We prioritize them in `normalizeUpdate()`:
```typescript
if (action === 'halftime_finalised') return 'HalfTime';
if (action === 'game_finalised') return 'FullTime';
```

They never fired late or incorrectly during live matches.

### ✅ 4. Snapshot endpoint for late joiners

The `/scores/snapshot/{id}` endpoint returning the full accumulated match history was crucial. Users opening the live page mid-second-half get a complete event replay from kick-off: all goals, cards, and possession events that preceded them. We merge the snapshot into the event feed on page load, then switch to `/scores/updates/{id}` for incremental polling.

### ✅ 5. Clock.Running and Clock.Seconds for precise timing

`Clock.Running` transitions (`true → false` at half-time, `false → true` at second-half kick-off) served as a reliable fallback for game-state detection when `GameState` was unreliable. `Clock.Seconds` drives our live match clock display with real precision — users see the actual elapsed time, not a guess based on wall clock.

### ✅ 6. Danger possession events enabling real-time attack visualization

`danger_possession` and `high_danger_possession` events let us build a live "danger attack" feed visible to all users during the match. No other API we evaluated provides this level of real-time spatial context. It transforms the UI from a scoreboard into something that feels like watching the match.

---

## 13. Where We Hit Friction

### ⚠️ 1. Fixture IDs return 403, not 404, when wrong

**This was our biggest operational surprise on match day.**

Our static fixture ID for the SF1 slot (`18220001`) returned `HTTP 403` from `/scores/updates/`. A 403 normally means "authenticated but not authorized" — so we initially assumed a token/subscription issue and spent time debugging credentials. It was actually TxLINE returning 403 as a generic "fixture not found or inaccessible" response.

We couldn't distinguish "wrong ID" from "bad token" without checking the fixture list independently. We ended up treating any 403 on the scores endpoint as a trigger for our `discoverAndSync()` auto-discovery flow.

### ⚠️ 2. No goal event when a penalty is converted

TxLINE sends `penalty_won` when a penalty is awarded, but when the penalty is scored, the only feedback is a silent score increment. **No `goal` or `penalty_goal` event arrives.**

We discovered this live during France vs Spain's first-half penalty: Spain's score went from 0 to 1, but our fantasy engine showed no goal event and awarded no scoring points.

Our fix: redesign the scoring system so `penalty_won` is treated as the definitive scoring event (+8 pts), and synthesize a `penalty_conceded` event for the opposing GK/DEF (−3 pts).

### ⚠️ 3. GameState field is unreliable — can stay "Scheduled" during live matches

We observed cases where `GameState` remained `"Scheduled"` even when `Clock.Running === true` and goals were being scored. Our `normalizeUpdate()` function now overrides: if `Clock.Running` is true and `GameState` is `"Scheduled"`/`"NotStarted"`, we return `"FirstHalf"`.

Game-state synthesis that drives halftime stats and clean sheet logic depends entirely on accurate state transitions — silent `Scheduled` states would have meant zero fantasy point awards for the entire match.

### ⚠️ 4. Each logical event fires 2–3 times (Confirmed false → true partial → true full)

TxLINE sends up to three sequential updates for a single goal:
1. `Confirmed: false` — tentative, empty `Data`
2. `Confirmed: true` — partial data (no PlayerId)
3. `Confirmed: true` — full data (PlayerId present)

Without deduplication, a single goal would trigger three separate Telegram notifications and award points three times. We deduplicate by event Id, keeping only the last (highest Seq) `Confirmed: true` entry.

### ⚠️ 5. `penalty_won` often arrives without player attribution

`penalty_won` frequently lacks `PlayerId` and `PlayerName` in the `Data` field — we cannot identify who won or converted the penalty for Telegram messaging. We fall back to team-level messaging: *"Spain PENALTY WON — fantasy points awarded to all eligible players."*

For a fantasy product where player attribution is the core mechanic, this gap significantly hurts the user experience.

### ⚠️ 6. Zero public documentation — everything reverse-engineered from live responses

We had no reference document for:
- Event Action types and their fields
- Score object schema (`Participant1` vs `Participant` naming)
- Period1/Period2 field names
- Clock structure
- The difference between snapshot and updates response shapes

Every data field was discovered by logging raw API responses during live fixtures and analyzing the JSON structure. This added significant development overhead and introduced risk — we may still be missing event types or fields that exist but haven't appeared in our observed production responses.

### ⚠️ 7. Snapshot and updates endpoints have divergent response shapes

The `/scores/snapshot/` endpoint returns an array of individual event objects that must be merged into a state object. The `/scores/updates/` endpoint returns what appears to be a pre-merged state with `_allEvents`. The two require completely different parsing paths.

Our `normalizeUpdate()` function handles both, but it took significant trial-and-error on live data to identify which fields existed in which response type.

### ⚠️ 8. Possession events are extremely high-frequency (every 2–3 seconds)

During a 90-minute match, TxLINE streams hundreds of `safe_possession`, `attack_possession`, and similar events. Naively rendering each as a feed event would create an unusable UI.

We implemented cooldown rate-limiting:
- `danger_possession` → max 1 UI event per team per **150 seconds**
- `high_danger_possession` → max 1 UI event per team per **90 seconds**

The raw events are still counted for possession statistics, but only a rate-limited subset appears in the feed.

---

## 14. Workarounds We Built

| Problem | Workaround | File |
|---|---|---|
| Static fixture ID returns 403 | `discoverAndSync()` — fetches full fixture list, matches by kickoff time ±90 min, persists to Supabase | `fixture-remap.ts` |
| No goal event for penalty conversions | `penalty_won` promoted to scoring event (+8 pts); `penalty_conceded` synthesized for opposing GK/DEF (−3 pts) | `txline-bridge.ts`, `scoring-bank.ts` |
| 2–3 duplicate events per action | Deduplicate by `Id`, keep highest `Seq` entry; only `Confirmed: true` events processed | `page.tsx` (normalizeUpdate) |
| GameState stuck on "Scheduled" | Override with `"FirstHalf"` when `Clock.Running === true`; `halftime_finalised` / `game_finalised` take precedence | `page.tsx` (normalizeUpdate) |
| User joins after halftime, misses H1 stats bonuses | Retroactive catch-up block in poll loop: fires once when period stats + lineup are both available | `page.tsx` |
| Possession data unreliable from event counts | Count all possession action types as proxy; supplement corners/goals from `Score.Period1` which is authoritative | `page.tsx`, `scoring-bank.ts` |
| Cron event deduplication | Supabase `notified_events` table with `(fixture_id, event_id)` unique key prevents re-notification | `match-events/route.ts` |

---

## 15. Wishlist for TxLINE

> **If we could change one thing:** Publish an OpenAPI schema or even a simple JSON example of every event Action type with all possible fields. Half of our integration complexity was defensive coding against fields that might or might not be present. A 2-page reference doc would have cut our development time by 30%.

1. **API documentation** — An event Action type reference with example payloads. Even a Markdown file would have saved days of reverse-engineering.

2. **Goal event for penalty conversions** — A `penalty_goal` or `penalty_outcome: scored` event would close the biggest gap in our scoring logic. Currently impossible to distinguish a converted penalty from a missed one at the API level (we infer from score change).

3. **Proper 404 for unknown fixture IDs** — 403 on an unknown fixture ID causes ambiguity with authentication errors. A 404 would allow cleaner error routing.

4. **Player ID on penalty events** — `penalty_won.Data.PlayerId` populated consistently, so we can attribute points to the player who won (and presumably converted) the penalty.

5. **Per-period danger attack counts in Score object** — `Score.Participant1.Period1.DangerAttacks` alongside Goals and Corners would let us compute accurate halftime attack bonuses without relying on rate-limited event counting.

6. **Unified snapshot + updates schema** — Both endpoints returning the same shape with the same field names would eliminate the dual parsing paths in our codebase.

---

*OddsDraft Technical Documentation · World Cup 2026 · Built with TxLINE API · July 2026*
