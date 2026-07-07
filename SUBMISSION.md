# OddsDraft — Hackathon Submission
## TxODDS Consumer & Fan Experiences · Superteam Earn

---

## 1. Application Access

**Live App:** https://odds-draft.vercel.app

**How to test (no wallet needed):**
- Visit any match on the **Match Schedule** page
- Click **Demo Mode** to play through the full game loop without a wallet
- Or connect a **Phantom Wallet** (Solana devnet) to enter with real on-chain transactions
- Use **Replay Tutorial** on the Match Schedule page for a guided walkthrough

**GitHub:** https://github.com/sandhywarhol/OddsDraft

---

## 2. Brief Technical Documentation

### Core Idea

OddsDraft is a **real-time fantasy football game** on Solana for the FIFA World Cup 2026. Managers build a 5-a-side squad, pay 0.01 SOL on-chain, and earn fantasy points as TxLINE streams live match events. The top manager wins SOL from the prize pool — all transparent, all on-chain.

The key differentiator is the **Skill Card system**: after every match, players earn a random collectible card (8 rarity tiers, RNG-based) that boosts their fantasy scores. Two identical cards can be fused into a rarer version. Cards will become NFT-tradeable in the next milestone — making OddsDraft both a game and a collectible economy.

### Business Highlights

- **Network effect**: prize pools grow with more entrants; higher pools attract better managers
- **Skill Card economy**: RNG drops + combinability creates a collectible market with real scarcity (SSSR cards: 0.3% drop rate). Secondary marketplace is the planned revenue layer
- **Retention loop**: earn cards → combine for better cards → equip for bigger edge → re-enter next match
- **World Cup timing**: 64 matches, global audience, natural daily engagement throughout July 2026

### Technical Highlights

| Feature | Implementation |
|---------|---------------|
| Live event parsing | TxLINE SSE stream → `mapEventToFantasyType()` → per-position scoring |
| Dual detection | SSE events + `PlayerStats` cumulative snapshot — goals never missed |
| NPC commentary | JRPG-style dialog system, 8 NPCs, event-priority trigger logic |
| On-chain entry | Native SOL transfer via `@solana/web3.js`, validated server-side |
| Prize distribution | Automatic leaderboard → prize calculation → on-chain claim flow |
| Skill Cards | 8-tier RNG system, `localStorage` collection, card combining engine |
| Edge proxy | TxLINE tokens never exposed to browser; Vercel Edge Function proxy |
| Telegram bot | Live event alerts, `/points` command, match notifications |

### TxLINE Endpoints Used

| # | Endpoint | Purpose |
|---|----------|---------|
| 1 | `POST /auth/guest/start` | Obtain guest JWT for unauthenticated sessions |
| 2 | `POST /api/token/activate` | Activate API token for authenticated flows |
| 3 | `GET /api/fixtures/snapshot` | List all WC2026 fixtures; detect live matches |
| 4 | `GET /api/scores/snapshot/{fixtureId}` | Full historical state on page load |
| 5 | `GET /api/scores/updates/{fixtureId}` | **Primary** — SSE stream polled every 4s for live events, score, clock, game state |
| 6 | `GET /api/fixtures/lineups/{fixtureId}` | Official lineups for player-ID resolution and starting-XI appearance points |

The updates endpoint is the heart of the experience — every goal, card, save, and substitution flows from it to the fantasy engine, sound effects, NPC dialog system, and Telegram notifications within seconds.

---

## 3. Feedback: Our Experience with TxLINE API

### What We Liked Most

**The `PlayerStats` cumulative snapshot** was a game-changer. When we first built purely on SSE events, some goals from TxLINE appeared without a `PlayerName` or slipped past our `Confirmed` filter. The `PlayerStats` object — a per-player running tally of goals, assists, saves, cards — gave us a completely independent detection path. When we compare each poll's stats to the previous poll's stats, any delta immediately reveals a goal that individual events may have missed. This dual-path architecture made the scoring reliable even in edge cases.

**The `Confirmed` flag on events** was extremely thoughtful. Being able to filter out unconfirmed goals (pending VAR review) and only process `Confirmed: true` events means we never showed a goal that got reversed — crucial for a game where incorrect points could mean incorrectly distributed prizes.

**Low latency and reliability.** Across dozens of test matches, the SSE stream was consistently fast. Events arrived within 2–5 seconds of real-world actions. For a live game this is everything.

### Where We Hit Friction

**Empty `PlayerName` on goal and card events.** This was our biggest challenge. Many events arrive with a valid `PlayerId` but an empty `PlayerName`. We had to build a full `buildPlayerIdMap()` layer: fetch the lineups endpoint, map TxLINE player IDs to our internal player database, and fall back to that for any event missing a name. This works, but it adds latency and complexity. A guaranteed non-empty `PlayerName` (or a `displayName` fallback) would eliminate this entirely.

**`GameState` field inconsistency.** The field often reads `"scheduled"` even when the match is clearly in the first half. We ended up using `Clock.Running === true` as the ground-truth signal for "match is live," and only falling back to `GameState` for halftime/fulltime detection. Worth documenting this pattern explicitly.

**`Participant` field absent on most goal events.** Determining which team scored required a three-step fallback: check `Participant` → look up the player in our DB → default to home team. A consistently populated `Participant` field would simplify a lot of downstream logic.

**SSE response format needed reverse-engineering.** The updates endpoint returns `text/event-stream` with `data: {...}` lines, but each line's shape varies by action type. A reference document showing one complete payload per action type (goal, yellowcard, substitution, etc.) with all possible fields would have saved 2–3 days of trial and error.

**No documented rate limit.** We discovered empirically that polling every 4 seconds is safe. A documented maximum polling frequency would let us tune this confidently rather than guessing.

---

*Submitted for the TxODDS Consumer & Fan Experiences track — Superteam Earn, July 2026*
