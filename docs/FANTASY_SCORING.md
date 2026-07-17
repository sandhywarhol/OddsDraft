# OddsDraft — Fantasy Points System

Complete reference for how fantasy points are earned and deducted.  
Source of truth: `src/lib/scoring-bank.ts`

---

## 1. Position Overview

Every lineup has exactly **5 players**, one per slot:

| Slot | Code | Description |
|------|------|-------------|
| Goalkeeper | GK | Last line of defence |
| Defender | DEF | Centre-back / full-back |
| Midfielder | MID | Central / defensive mid |
| Swinger | SWG | Winger (LW / RW) |
| Attacker | ATT | Striker / second striker |

Higher-risk positions earn more for rare achievements (e.g. a GK goal is worth 20 pts, an ATT goal is 10 pts).

---

## 2. Direct Player Events

These are awarded immediately when a specific player in your lineup triggers the event.

### Scoring

| Event | GK | DEF | MID | SWG | ATT |
|-------|----|-----|-----|-----|-----|
| **Goal** | +20 | +15 | +12 | +11 | +10 |
| **Assist** | +6 | +6 | +6 | +6 | +6 |
| **Penalty Scored** | +5 | +5 | +5 | +5 | +5 |

### Goalkeeper

| Event | GK | Others |
|-------|----|--------|
| **Save** | +1 | — |
| **Penalty Save** | +5 | — |

### Penalties

| Event | GK | DEF | MID | SWG | ATT |
|-------|----|-----|-----|-----|-----|
| **Penalty Won** | +6 | +6 | +3 | +4 | +3 |
| **Penalty Missed** | −3 | −3 | −3 | −3 | −3 |
| **Penalty Conceded** | −3 | −3 | 0 | 0 | 0 |
| **Penalty Missed (Shootout)** | −3 | −3 | −3 | −3 | −3 |

### Discipline

| Event | All Positions |
|-------|---------------|
| **Yellow Card** | −2 |
| **Red Card** | −5 |
| **Own Goal** | −6 |

### Appearance

| Event | All Positions |
|-------|---------------|
| **Starting XI** | +2 |
| **Substitute Appearance** | +1 |
| **Extra Time** | +2 (all lineup players) |

---

## 3. Team Events

Applied to **all eligible players on the team**, not just the individual who triggered the action.

| Event | GK | DEF | MID | SWG | ATT | Trigger |
|-------|----|-----|-----|-----|-----|---------|
| **Goal Conceded** | −1 | −1 | 0 | 0 | 0 | Each goal shipped |
| **Clean Sheet** | +5 | +5 | +1 | +1 | 0 | No goals conceded at full time |

---

## 4. Indirect Contribution

When a goal is scored by a player **not in your lineup**, teammates from the same team still benefit.

| Event | GK | DEF | MID | SWG | ATT | Trigger |
|-------|----|-----|-----|-----|-----|---------|
| **Team Contribution** | 0 | 0 | +1 | +1 | 0 | Goal by team, scorer not in lineup |

> Example: France scores via Giroud (not in your lineup), but you have Griezmann (MID) and Coman (SWG) from France → both get +1.

---

## 5. Stats-Based Bonuses (Half-Time & Full-Time)

Evaluated **twice per match** — once at half-time (H1 stats) and once at full-time (H2 stats).  
Based on match statistics tracked throughout each half.

### Possession

| Result | Threshold | GK | DEF | MID | SWG | ATT |
|--------|-----------|-----|-----|-----|-----|-----|
| **Possession Dominant** | Team ≥ 55% poss. | +1 | +1 | +2 | +1 | +1 |
| **Possession Edge** | Team 50–54% poss. | 0 | 0 | +1 | 0 | 0 |

### Attack Activity

| Result | Threshold | GK | DEF | MID | SWG | ATT |
|--------|-----------|-----|-----|-----|-----|-----|
| **Attack Pressure** | Team ≥ 5 danger attacks | 0 | 0 | +1 | +1 | +1 |
| **Corner Threat** | Team ≥ 4 corners | 0 | 0 | 0 | +1 | 0 |
| **Team Goal Bonus** | Team scored ≥ 1 goal | 0 | 0 | 0 | +1 | +1 |

### Defensive

| Result | Threshold | GK | DEF | MID | SWG | ATT |
|--------|-----------|-----|-----|-----|-----|-----|
| **Defensive Solid** | Opponent ≤ 2 danger attacks | +2 | +1 | 0 | 0 | 0 |
| **Clean Half** | No goals conceded this half | +1 | +1 | 0 | 0 | 0 |

> **Note:** A player can receive both Clean Half (+1) at half-time AND Clean Sheet (+5) at full-time if their team keeps a clean sheet for the full match.

---

## 6. Multipliers

### Captain (×2)

Designate one player as captain before submitting your lineup.  
**All points earned (positive and negative) are doubled for the captain.**

> Example: Captain scores → normally +10 pts → becomes +20 pts.  
> Captain gets a red card → normally −5 → becomes −10.

### Confidence Stars (×1.0 – ×1.5)

Rate each player 1–5 stars when building your lineup.  
Stars multiply both **positive gains** and **negative losses**.

| Stars | Multiplier |
|-------|-----------|
| ★☆☆☆☆ (1) | ×1.0 |
| ★★☆☆☆ (2) | ×1.1 |
| ★★★☆☆ (3) | ×1.2 |
| ★★★★☆ (4) | ×1.35 |
| ★★★★★ (5) | ×1.5 |

### Skill Card Bonus

Equip a Skill Card to a player for an extra flat bonus on specific events.  
Applied **before** captain and confidence multipliers.  
See the My Cards page for each card's bonus breakdown.

### Final Formula

```
raw_pts       = base_event_pts + skill_card_bonus
after_captain = isCaptain ? raw_pts × 2 : raw_pts
final_pts     = after_captain × confidence_multiplier
```

---

## 7. Scoring Flow Timeline

```
Match Start
    │
    ▼
Kick-off → all starters: +2 (Starting XI)
    │
    ├── Goal scored (scorer in lineup)
    │       scorer          → +10 to +20 (position)
    │       assister        → +6
    │       opposing GK/DEF → −1 each (goal conceded)
    │
    ├── Goal scored (scorer NOT in lineup)
    │       MID from scoring team → +1 (team contribution)
    │       SWG from scoring team → +1 (team contribution)
    │       opposing GK/DEF      → −1 each (goal conceded)
    │
    ├── Cards, saves, penalties → per table above
    │
Half-Time
    │
    ├── Possession stats evaluated → MID/DEF/SWG/ATT bonuses
    ├── Danger attack count evaluated → MID/SWG/ATT bonus
    ├── Corner count evaluated → SWG bonus
    ├── H1 goals evaluated → ATT/SWG team goal bonus
    ├── H1 clean evaluated → GK/DEF half_clean bonus
    └── Defensive solidity evaluated → GK/DEF defensive_solid bonus
    │
Second Half (same real-time events as above)
    │
Full-Time
    │
    ├── Same stats evaluation for H2
    ├── Clean Sheet check → GK/DEF (if no goals conceded full match)
    └── Retroactive check → any goal_conceded missed in real-time
```

---

## 8. Point Caps & Notes

- **No cap** on total points per match.
- Stats bonuses apply **per half**, so a dominant team can earn stats bonuses at both HT and FT.
- The **Defensive Solid** bonus (opponent ≤ 2 danger attacks) and the **Attack Pressure** bonus (≥ 5 danger attacks) can both apply to different teams in the same half.
- A player can **only** receive a `goal_conceded` penalty if their team actually conceded — possession stats don't double-penalise.
- `extra_time` bonus is awarded to **all 5 lineup players** if the match goes to extra time.

---

## 9. Example Match Scenario

**Lineup**: Alisson (GK/Brazil), Militão (DEF/Brazil), Casemiro (MID/Brazil), Vini Jr (SWG/Brazil), Lewandowski (ATT/Poland)  
**Match**: Brazil 2–1 Poland · Half-time: 1–0  
**Captain**: Vini Jr · **Stars**: Vini Jr = 5★, others = 3★

| Minute | Event | Player | Raw | Captain? | Stars | Final |
|--------|-------|--------|-----|----------|-------|-------|
| 1 | Starting XI | All 5 | +2 each | Vini ×2 | varies | +10.6 total |
| 35 | Goal (not in lineup scorer) | Casemiro (MID) | +1 | No | ×1.2 | +1.2 |
| 35 | Goal (not in lineup scorer) | Vini Jr (SWG) | +1 | ×2 | ×1.5 | +3.0 |
| 37 | Goal Conceded | Alisson (GK) | −1 | No | ×1.2 | −1.2 |
| 37 | Goal Conceded | Militão (DEF) | −1 | No | ×1.2 | −1.2 |
| 45 | **HT Stats**: Brazil possession 60% | Casemiro (MID) | +2 | No | ×1.2 | +2.4 |
| 45 | HT Stats: possession dominant | Vini Jr (SWG) | +1 | ×2 | ×1.5 | +3.0 |
| 45 | HT Stats: attack pressure (6 dangers) | Vini Jr (SWG) | +1 | ×2 | ×1.5 | +3.0 |
| 45 | HT Stats: clean half (0 goals conceded H1) — wait, Poland scored → no bonus | — | — | — | — | — |
| 80 | Goal by Vini Jr (in lineup) | Vini Jr (SWG) | +11 | ×2 | ×1.5 | +33.0 |
| 80 | Goal Conceded | Alisson (GK) | −1 | No | ×1.2 | −1.2 |
| 80 | Goal Conceded | Militão (DEF) | −1 | No | ×1.2 | −1.2 |
| 90 | **FT Stats**: Brazil possession 58% | Casemiro +2, Vini +1 | ... | ... | ... | +6.0 |
| FT | **Clean Sheet** | — | 0 conceded? No | — | — | — |

---

*Generated from `src/lib/scoring-bank.ts` · OddsDraft v1.0 · WC2026*
