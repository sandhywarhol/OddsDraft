# OddsDraft — Pitch Script (for the 6-slide deck)

**Track:** TxOdds Hackathon — Consumer & Fan Experiences (Superteam Earn)
**Target run time:** ~4 minutes for the deck, leaving room for a live demo + Q&A.
**Delivery notes:** One slide = one idea. Say the headline in your own words, then land the one sentence in **bold**. Keep energy up; slow down only on the closing line.

---

## Slide 1 — Opening  *(~30 sec)*

> "Every four years, a billion people watch the World Cup — and they watch it *passively*.
>
> This is **OddsDraft**: fantasy football meets collectible cards, played **live and on-chain**, on top of the real match feed from TxLINE.
>
> The whole thing runs on three verbs — **Bet, Play, Own**. You pick five players, pay 0.01 SOL, and your score moves the second the real match does."

*Transition:* "So why build this now? Because today, all of that fun is split across three different apps."

---

## Slide 2 — The Problem  *(~40 sec)*

> "Fantasy football has three problems.
>
> **One — it's slow.** You set a lineup and wait until *next week* for a score. There's no live tension while the match is actually on.
>
> **Two — it's fragmented.** Betting lives in a sportsbook, gaming in a fantasy app, collectibles in an NFT marketplace. Fans juggle three products that never talk to each other.
>
> **Three — payouts are opaque.** Prize money runs through custodial black boxes; you can't verify the pool or that winners actually got paid.
>
> **Fans want to bet, play, and collect around one live match — in one place they can trust.**"

*Transition:* "That one place is OddsDraft."

---

## Slide 3 — The Solution  *(~45 sec)*

> "OddsDraft fuses all three worlds on top of a single TxLINE live feed.
>
> **Play** — build a five-a-side squad, pick a captain for double points, set confidence stars from one to five. Points update live.
>
> **Bet** — and here's what makes it addictive: **three contest modes — 50/50, Top 3, and Winner-Takes-All — and you can enter any or all of them on the same match.** Entry is 0.01 SOL; the prize pool is just the sum of every entry.
>
> **Own** — after each match you earn Skill Cards across eight rarity tiers. Combine duplicates, upgrade them with Upgrade Cards, and trade them for SOL on our marketplace.
>
> **Betting, a game, and a real economy — all around one live match.**"

*Transition:* "Under the hood, it's one clean pipeline."

---

## Slide 4 — How It Works  *(~50 sec)*

> "Four steps, from the pitch to your wallet.
>
> **One — the TxLINE live feed.** Confirmed goals, cards, saves, subs, and stats stream in. That's our single source of truth — we only ever score confirmed events, so a VAR reversal never pays out wrongly.
>
> **Two — the scoring engine.** We score on three layers: **individual performance, match events, and half-time and full-time statistics** like possession and clean sheets. Goals are position-weighted — a keeper scoring pays 20, a striker 10 — then captain doubles it and confidence stars multiply it.
>
> **Three — the live leaderboard.** Every squad re-ranks in real time, with NPC commentary and Telegram alerts firing within seconds.
>
> **Four — on-chain payout.** The prize pool is distributed on Solana devnet — **transparent and trustless, no black box.**"

*Transition:* "And this isn't just a game — it's a business."

---

## Slide 5 — Monetization  *(~40 sec)*

> "Three revenue streams, all feeding off the same engaged audience.
>
> **One — a small fee on every prize pool,** across all three contest modes. It scales directly with entries.
>
> **Two — card sales.** We take a cut of every marketplace trade. Scarcity is real — the top SSSR card drops at 0.3% — and combine-and-upgrade mechanics give cards genuine value.
>
> **Three — in-app ads.** We've built a persistent sponsor slot right below the navigation bar — brand-safe inventory in front of a live-sports crowd.
>
> **And the timing is perfect: 64 World Cup matches, three modes each, eight card tiers — a full month of built-in engagement.**"

*Transition:* "Which brings me to why this matters right now."

---

## Slide 6 — Why Now / Close  *(~30 sec)*

> "Our whole thesis in one line: **turn a match you're already watching into a game you're playing.**
>
> The World Cup gives us a global audience and 64 nights of engagement. TxLINE gives us the live heartbeat. OddsDraft turns both into betting, play, and a collectible economy — all on-chain.
>
> It's live at **oddsdraft.fun**, and you can try the full loop in Demo Mode without a wallet. Thank you — I'd love to show you a live match, or take your questions."

---

## Timing Cheat-Sheet

| Slide | Focus | Time | Cumulative |
|-------|-------|------|-----------|
| 1 | Opening hook | 0:30 | 0:30 |
| 2 | Problem | 0:40 | 1:10 |
| 3 | Solution (3 modes) | 0:45 | 1:55 |
| 4 | How it works | 0:50 | 2:45 |
| 5 | Monetization | 0:40 | 3:25 |
| 6 | Why now / close | 0:30 | 3:55 |

Leaves ~1 min of a 5-min slot for a live demo beat or the first question.

---

## Anticipated Q&A

**Q: Is it really on-chain?**
> "Yes — on Solana devnet today. Contest entry and prize distribution settle through our on-chain program, and every marketplace trade is verified on-chain before we update ownership. Mainnet is the next step."

**Q: Can one user really join all three contest modes on one match?**
> "Exactly — 50/50, Top 3, and Winner-Takes-All are independent pools. A confident manager can spread across all three, which multiplies both the engagement and the prize pools."

**Q: How is scoring kept fair?**
> "Everything derives from the TxLINE feed, and we only score events flagged Confirmed. Scoring combines individual performance, match events, and half-time/full-time stats — all from one transparent scoring bank."

**Q: What's the biggest revenue driver?**
> "The card economy has the most upside. Prize-pool fees scale with entries, but scarcity-driven card trading compounds as the collection grows — that's the long-term flywheel."

**Q: What was hardest to build on TxLINE?**
> "Goal events sometimes arrive without a player name. We solved it with a second detection path that diffs the cumulative player-stats snapshot between polls, so a goal is never missed even when the name is blank."

---

## Pre-Talk Checklist

- [ ] Deck open in presenter view; slide 1 up before you're introduced.
- [ ] Live match page (or Demo Mode) loaded in a browser tab for the closing demo.
- [ ] Know your one bold line per slide cold — everything else can be improvised.
- [ ] Rehearse to 3:55 so the demo/Q&A never gets cut off.
- [ ] Lead with "on-chain today on devnet, mainnet next" before a judge asks.
