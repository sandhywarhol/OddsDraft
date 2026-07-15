// Tests for the centralized fantasy-point formula (fantasy-engine.ts)

import {
  calculateEventPoints,
  calculateFantasyPoints,
  resolvePlayerDelta,
  CONFIDENCE_MULTIPLIER,
} from '@/lib/fantasy-engine';

describe('resolvePlayerDelta', () => {
  test('applies each confidence tier to a positive raw total', () => {
    expect(resolvePlayerDelta(10, { isCaptain: false, confidenceStars: 1 })).toBe(10);
    expect(resolvePlayerDelta(10, { isCaptain: false, confidenceStars: 2 })).toBe(11);
    expect(resolvePlayerDelta(10, { isCaptain: false, confidenceStars: 3 })).toBe(12);
    expect(resolvePlayerDelta(10, { isCaptain: false, confidenceStars: 4 })).toBe(13.5);
    expect(resolvePlayerDelta(10, { isCaptain: false, confidenceStars: 5 })).toBe(15);
  });

  test('applies each confidence tier to a negative raw total (amplifies the penalty)', () => {
    expect(resolvePlayerDelta(-10, { isCaptain: false, confidenceStars: 1 })).toBe(-10);
    expect(resolvePlayerDelta(-10, { isCaptain: false, confidenceStars: 5 })).toBe(-15);
  });

  test('captain doubles points before the confidence multiplier is applied', () => {
    // 10 * 2 (captain) * 1.2 (3-star) = 24
    expect(resolvePlayerDelta(10, { isCaptain: true, confidenceStars: 3 })).toBe(24);
  });

  test('appearance bonus and card bonus are added pre-multiplier', () => {
    // (10 + 2 appearance + 3 card) * 1.1 (2-star) = 16.5
    expect(
      resolvePlayerDelta(10, { isCaptain: false, confidenceStars: 2, appearanceBonus: 2, cardBonus: 3 })
    ).toBe(16.5);
  });

  test('rounds to 2 decimal places', () => {
    // 7 * 1.35 = 9.45
    expect(resolvePlayerDelta(7, { isCaptain: false, confidenceStars: 4 })).toBe(9.45);
  });

  test('out-of-range confidence stars fall back to a 1x multiplier', () => {
    expect(resolvePlayerDelta(10, { isCaptain: false, confidenceStars: 0 })).toBe(10);
    expect(resolvePlayerDelta(10, { isCaptain: false, confidenceStars: 9 })).toBe(10);
  });

  test('CONFIDENCE_MULTIPLIER exposes the full 1-5 star table', () => {
    expect(CONFIDENCE_MULTIPLIER).toEqual({ 1: 1.0, 2: 1.1, 3: 1.2, 4: 1.35, 5: 1.5 });
  });
});

describe('calculateEventPoints', () => {
  test('goal points scale up for unlikely scorers', () => {
    expect(calculateEventPoints('goal', 'GK')).toBe(20);
    expect(calculateEventPoints('goal', 'DEF')).toBe(15);
    expect(calculateEventPoints('goal', 'ATT')).toBe(10);
  });

  test('unknown event type returns 0', () => {
    expect(calculateEventPoints('not_a_real_event', 'ATT')).toBe(0);
  });
});

describe('calculateFantasyPoints', () => {
  const lineup = {
    players: [
      { id: 'p1', name: 'Player One', position: 'ATT', team: 'Home' },
      { id: 'p2', name: 'Player Two', position: 'MID', team: 'Home' },
    ],
    captainPlayerId: 'p1',
    confidence: { p1: 3, p2: 3 },
  };

  test('applies implicit appearance bonus, captain doubling, and confidence multiplier end-to-end', () => {
    const result = calculateFantasyPoints(
      [{ playerId: 'p1', playerName: 'Player One', eventType: 'goal', minute: 10 }],
      lineup
    );

    // base = 10 (goal, ATT) + 2 (implicit appearance) = 12
    // captain: 12 * 2 = 24; confidence 3-star: 24 * 1.2 = 28.8
    expect(result.playerScores.p1.finalPoints).toBe(28.8);
    expect(result.playerScores.p2.finalPoints).toBe(0);
    expect(result.totalPoints).toBe(28.8);
  });

  test('does not double-count appearance when starting_xi event precedes match events', () => {
    const result = calculateFantasyPoints(
      [
        { playerId: 'p2', playerName: 'Player Two', eventType: 'starting_xi', minute: 0 },
        { playerId: 'p2', playerName: 'Player Two', eventType: 'yellow_card', minute: 30 },
      ],
      lineup
    );

    // starting_xi base = 2, yellow_card = -2 → base total 0; no implicit +2 added on top
    expect(result.playerScores.p2.basePoints).toBe(0);
  });
});
