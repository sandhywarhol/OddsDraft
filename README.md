# OddsDraft

Fantasy football meets collectible cards — live, on-chain, during FIFA World Cup 2026.

🌐 [oddsdraft.fun](https://oddsdraft.fun) &nbsp;·&nbsp; 📬 [@oddsdraftbot](https://t.me/oddsdraftbot) &nbsp;·&nbsp; ⚡ Built on Solana + TxLINE

---

![Homepage](public/homepage.webp)

Pick five players before kickoff, pay **0.1 SOL**, and watch your points move in real time as TxLINE streams goals, saves, cards, and substitutions from the actual match. The manager with the most points takes the prize pool. Everything — entry, leaderboard, payout — runs on-chain.

That's the base game. The part we're actually excited about is the card system.

---

## Skill Cards

![Cards](public/card_skill.webp)

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

![Schedule](public/schedule.webp)

The full FIFA World Cup 2026 fixture schedule is shown in real time. Data comes from TxLINE (primary) with ESPN as a cross-check for any TBD team slots. Upcoming and recently finished results appear on the homepage.

---

## How scoring works

Five positions: **GK · DEF · MID · SWG (winger) · ATT**

Goals are worth more for riskier positions — a goalkeeper scoring is rare so it pays 20 pts, a striker scoring pays 10. Choose a captain for 2× and set a confidence rating (1–5 ⭐) that multiplies every point that player earns. Five stars is high variance: massive upside, but a red card at 5 stars really hurts.

---

## Lineup builder

![Lineup](public/lineup.jpg)

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

![Leaderboard](public/leaderboard.webp)

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

Half-time and full-time stats use a strict source priority: TxLINE period data (goals, corners, cards) → Supabase event counts (shots, danger attacks) → ESPN boxscore totals as fallback only for any field still at zero. No stat is ever sourced from two providers simultaneously.

---

## Stack

Next.js 16 · Solana · Supabase · TxLINE · ESPN API · Vercel Edge · Telegram Bot API

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
