# OddsDraft — 5-Minute Pitch & Demo Script

**Event:** TxOdds Hackathon — Consumer & Fan Experiences track (Superteam Earn)
**Format:** ~2 min pitch · ~2.5 min live demo · ~30 sec close
**Speaker note:** Speak to the *feeling* first, the tech second. Keep energy high on the demo. Times are cumulative.

---

## [0:00–0:20] — The Hook

> "Every four years, a billion people watch the World Cup — and they watch it *passively*. What if every goal, every save, every red card was scored to a squad you built, with a prize riding on it, in real time?
>
> That's OddsDraft. Fantasy football meets collectible cards — live, on Solana, powered by the TxLINE feed. You pick five players before kickoff, and your points move the moment the real match does."

*(Have the live match page already open on screen, paused before kickoff.)*

---

## [0:20–1:00] — The Problem & Why Now

> "Fantasy football today is slow. You set a lineup, then wait until *next week* to see a score. There's no live tension, no moment-to-moment payoff.
>
> Two things make a real-time version possible right now. First — the World Cup: 64 matches, one global audience, daily engagement through all of July. Second — TxLINE. TxOdds gives us a low-latency stream of confirmed match events: goals, cards, saves, substitutions, within seconds of the real thing. That feed is the heartbeat of our game. Without it, none of this works."

---

## [1:00–2:00] — What We Built

> "Here's the core loop. Pick a five-a-side squad: goalkeeper, defender, midfielder, winger, attacker. Choose a captain for double points, and set a confidence rating on each player — one to five stars — that multiplies everything they earn. Five stars is high-risk, high-reward: huge upside, but a red card really stings.
>
> Scoring rewards the unlikely. A goalkeeper scoring is rare, so it pays 20 points; a striker scoring pays 10. Every value lives in one scoring bank — a single source of truth — so it's transparent and auditable.
>
> Then the part we're most excited about: **Skill Cards.** After every match you open a pack. Eight rarity tiers, from Common all the way to SSSR at a 0.3% drop rate. Cards give point bonuses, and — this is the hook — collect two of the same and you **fuse** them into the next rarity. That's the retention engine: play, earn, fuse, come back stronger. Next milestone, those cards become tradeable NFTs on Solana — a real collectible economy."

---

## [2:00–4:30] — Live Demo

**Say this, then drive the screen. If a real fixture is live, use it; otherwise use Demo Mode.**

> "Let me show you. No wallet needed — I'll hit **Demo Mode** so you see the full loop."

**Demo beats (do these in order, narrate as you click):**

1. **Lineup builder** — "I pick my five, tap a captain, set confidence stars." *(Build the squad quickly — have your picks decided in advance.)*
2. **Enter the contest** — "Entry is 0.01 SOL. I lock my lineup before kickoff."
3. **Go live** — open the live match page. "Now watch what happens when the real match moves."
4. **Trigger / show a goal event** — "TxLINE fires a confirmed goal event. Within seconds: the score updates, points are distributed across the leaderboard, a sound effect plays, and our NPC commentator reacts — a little JRPG-style dialog with seven characters calling the action."
5. **Point the leaderboard** — "My rank just moved live. This is the tension fantasy football has always been missing."
6. **Open a card pack** — "Match ends, I open a pack — and here's a rare drop. Two of these fuse into the next tier."
7. **(Optional) Telegram** — "And it follows you off the app: our Telegram bot pings you the second your player scores."

> "One thing worth calling out for the judges: TxLINE sometimes sends a goal with a valid player ID but no player name. So we built a **second detection path** — we compare the cumulative `PlayerStats` snapshot poll-over-poll, and any delta means a goal happened, even if the individual event was missing a name. Between that and filtering on the `Confirmed` flag to ignore VAR-reversed goals, our scoring stays reliable in exactly the edge cases that would otherwise break a live game."

---

## [4:30–5:00] — Roadmap & Honest Close

> "Where we are today: entry and payout run through a treasury on Solana devnet, and the full scoring engine runs on the TxLINE feed. What's next is the on-chain escrow program — it's already written — so entry and prize distribution settle trustlessly, plus the NFT card layer and a secondary marketplace, which is our revenue path.
>
> OddsDraft turns a match you're already watching into a game you're playing — and TxLINE is what makes it live. Thank you. Happy to take questions."

---

## Anticipated Q&A — Prep Answers

**Q: Is it really on-chain end-to-end?**
> "Honest answer: today, entry and payout run through a custodial treasury on devnet, and we have the on-chain escrow program written and ready to wire in — that's our immediate next milestone. We chose to ship the full game experience first and harden settlement second. The scoring engine, though, is fully driven by the live TxLINE feed."

**Q: What stops someone from faking their score?**
> "Right now scoring is computed client-side for demo speed. The production plan is server-authoritative scoring — the server recomputes every lineup's points from the confirmed TxLINE event snapshot, and on-chain settlement removes trust from payout entirely. We know exactly where that hardening goes."

**Q: How do you make money?**
> "The card economy. RNG drops plus fusion create genuine scarcity — SSSR cards are 0.3%. Once cards are NFTs, the secondary marketplace is the revenue layer, on top of an optional platform fee on prize pools."

**Q: Why is the card system stored locally?**
> "It's local for the hackathon build so we could iterate fast on the mechanics. The NFT layer moves ownership on-chain, which also makes it tamper-proof and tradeable."

**Q: What was hardest about TxLINE?**
> "Empty player names on goal events. We solved it with the dual `PlayerStats` delta path I showed. Our one ask back to TxOdds would be a guaranteed non-empty player name and a documented reference payload per event type."

---

## Delivery Checklist (before you present)

- [ ] Live match page open and pre-loaded; Demo Mode tested end to end.
- [ ] Squad picks decided in advance so the lineup build is fast on stage.
- [ ] Sound on — the goal SFX and NPC reaction land emotionally.
- [ ] A card pack ready to open with a visible rare/epic drop.
- [ ] Telegram bot open in a second window (optional beat).
- [ ] Rehearse to **4:45** so you have buffer — the demo always runs long.
- [ ] Own the "on-chain today vs. roadmap" framing *before* a judge asks.
