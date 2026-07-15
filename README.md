# OddsDraft

Fantasy football meets collectible cards — live, on-chain, during FIFA World Cup 2026.

🌐 [oddsdraft.fun](https://oddsdraft.fun) &nbsp;·&nbsp; 📬 [@oddsdraftbot](https://t.me/oddsdraftbot) &nbsp;·&nbsp; ⚡ Built on Solana + TxLINE

---

![Homepage](public/homepage.webp)

Pick five players before kickoff, pay **0.1 SOL**, and watch your points move in real time as TxLINE streams goals, saves, cards, and substitutions from the actual match. The manager with the most points takes the prize pool. Everything — entry, leaderboard, payout — runs on-chain.

That's the base game. The part we're actually excited about is the card system.

---

## Skill Cards

![Skill Cards](public/Github%20Pitcture/skill%20cards.svg)

After every match you open a card pack. What drops is random:

```text
Common → Uncommon → Rare → Epic → Legendary → Mythic → SSR → SSSR
 50%        25%       12%    6.5%     4%         1.5%    0.7%  0.3%
```

Cards are position-specific and give flat point bonuses — a Legendary Striker card adds +5 pts on every goal your forward scores. You equip one card per player slot before kickoff.

The interesting mechanic: **collect two copies of the same card and you can fuse them into the next rarity**. So there's a real reason to keep playing — you're building toward a SSSR card that might not exist anywhere else.

Cards are tradeable on-chain. The marketplace is built and live — list any card for SOL, and other players can buy directly from their collection page.

---

## Schedule

![Schedule](public/Github%20Pitcture/schedule.svg)

The full FIFA World Cup 2026 fixture schedule is shown in real time, sourced entirely from TxLINE. Upcoming and recently finished results appear on the homepage.

---

## How scoring works

Five positions: **GK · DEF · MID · SWG (winger) · ATT**

Goals are worth more for riskier positions — a goalkeeper scoring is rare so it pays 20 pts, a striker scoring pays 10. Choose a captain for 2× and set a confidence rating (1–5 ⭐) that multiplies every point that player earns. Five stars is high variance: massive upside, but a red card at 5 stars really hurts.

### Point table

| Event | GK | DEF | MID | SWG | ATT | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| ⚽ Goal | **20** | **15** | **12** | **11** | **10** | Higher for unlikely scorers |
| 🎯 Assist | 6 | 6 | 6 | 6 | 6 | Uniform across positions |
| 🎯 Penalty Won | 8 | 8 | 8 | 8 | 8 | Replaces goal event — TxLINE doesn't send a goal for converted pens |
| 🧤 Penalty Save | **5** | 0 | 0 | 0 | 0 | GK only |
| 🟨 Yellow Card | −2 | −2 | −2 | −2 | −2 | |
| 🟥 Red Card | −5 | −5 | −5 | −5 | −5 | |
| 😰 Own Goal | −6 | −6 | −6 | −6 | −6 | |
| 🛡 Clean Sheet | **5** | **5** | 1 | 1 | 0 | Applied at full-time retrocompute |
| 😬 Goal Conceded | −1 | −1 | 0 | 0 | 0 | Applied real-time to GK/DEF |
| 🥅 Penalty Conceded | −3 | −3 | 0 | 0 | 0 | Synthesized from penalty_won on the opposing team |
| ⚠️ Penalty Missed | −3 | −3 | −3 | −3 | −3 | |
| 📋 Starting XI | 2 | 2 | 2 | 2 | 2 | Awarded once on match start |
| 🔄 Sub Appearance | 1 | 1 | 1 | 1 | 1 | |
| ⏱ Extra Time | 2 | 2 | 2 | 2 | 2 | All lineup players if match goes to ET |

### Halftime & full-time stat bonuses

At the end of each half, OddsDraft evaluates team-level statistics from TxLINE's per-period data (`Score.Period1` / `Score.Period2`) and awards bonuses automatically:

| Bonus | Triggers when… | GK | DEF | MID | SWG | ATT |
| --- | --- | --- | --- | --- | --- | --- |
| Possession Dominant | Team held ≥ 55% possession | +1 | +1 | **+2** | +1 | +1 |
| Possession Edge | Team held 50–54% possession | 0 | 0 | +1 | 0 | 0 |
| Attack Pressure | Team generated ≥ 5 danger attacks | 0 | 0 | +1 | +1 | +1 |
| Defensive Solid | Opponent generated ≤ 2 danger attacks | **+2** | +1 | 0 | 0 | 0 |
| Corner Threat | Team earned ≥ 4 corners | 0 | 0 | 0 | +1 | 0 |
| Team Goal Bonus | Team scored ≥ 1 goal in the half | 0 | 0 | 0 | +1 | +1 |
| Clean Half | Team conceded 0 goals in the half | +1 | +1 | 0 | 0 | 0 |

### Multipliers

| Multiplier | Effect |
| --- | --- |
| **Captain (2×)** | Designate one captain — all their points are doubled |
| **Confidence 1 ⭐** | 1.0× (no change) |
| **Confidence 2 ⭐** | 1.1× |
| **Confidence 3 ⭐** | 1.2× |
| **Confidence 4 ⭐** | 1.35× |
| **Confidence 5 ⭐** | 1.5× — high risk, high reward |
| **Equipped skill card** | Flat bonus pts for specific event types (card-dependent) |

All point values live in a single file: `src/lib/scoring-bank.ts`. No hardcoded numbers anywhere else.

---

## Lineup builder

![Lineup Builder](public/Github%20Pitcture/lineup%20builder.svg)

Build your five-player squad before kickoff. Equip skill cards to boost individual players. Set your captain and confidence ratings, then pay the 0.1 SOL entry fee to lock in.

---

## Live match page

When a goal goes in, TxLINE fires an SSE event. Within a few seconds:

- The score updates
- Points are calculated and distributed across the leaderboard
- A sound effect plays
- The NPC commentary system fires — animated JRPG-style dialog with a commentator reacting to what just happened

The NPC system has seven characters: referee (starburst bubble for KICK OFF / CORNER / HALF TIME), two commentators (one excitable, one analytical), and a guide NPC for the lineup tutorial.

Telegram bot sends live alerts too — goal notifications with who scored and what your points are at.

---

## Leaderboard

![Leaderboard](public/Github%20Pitcture/global%20leaderboard.svg)

Global leaderboard tracks total points, wins, and SOL earned across all contests. Updated after every match.

---

## TxLINE integration

We use the updates endpoint as the main event source, polling every 4 seconds:

```text
GET /api/scores/updates/{fixtureId}   — live SSE, primary source
GET /api/scores/snapshot/{fixtureId}  — full state on page load
GET /api/fixtures/snapshot            — fixture list
GET /api/fixtures/lineups/{fixtureId} — player ID resolution
POST /auth/guest/start                — guest JWT
POST /api/token/activate              — token activation
```

One thing we learned: TxLINE often sends goal events with a valid `PlayerId` but empty `PlayerName`. So we built a second detection path using the `PlayerStats` cumulative snapshot — compare each poll's per-player goal count against the previous poll, and any delta means a goal just happened regardless of whether the individual event had a name attached. This made the scoring reliable.

Half-time and full-time stats use a strict source priority: TxLINE period data (goals, corners, cards) → Supabase event counts (shots, danger attacks). No stat is ever sourced from two providers simultaneously.

---

## Stack

Next.js 16 · Solana · Supabase · TxLINE · Vercel Edge · Telegram Bot API

---

## Run locally

```bash
git clone https://github.com/sandhywarhol/OddsDraft.git
cd OddsDraft
npm install
```

`.env.local`:

```env
NEXT_PUBLIC_TXODDS_API_TOKEN=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SOLANA_NETWORK=devnet
TELEGRAM_BOT_TOKEN=
NEXT_PUBLIC_APP_URL=https://oddsdraft.fun
```

```bash
npm run dev
```

Connect a Solana wallet (Phantom / Backpack) to enter contests and open card packs. New users receive a welcome gift of 5 skill cards + 5 upgrade cards automatically on first connection.
