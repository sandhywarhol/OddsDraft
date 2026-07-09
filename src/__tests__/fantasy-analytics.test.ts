// Tests for fantasy analytics system
// Verify performance bonus calculation works correctly

import {
  calculatePlayerPerformanceBonus,
  calculateTeamStats,
  applyStarMultiplier,
  calculateTotalFantasyPoints,
} from '@/lib/fantasy-analytics';

describe('Fantasy Analytics', () => {
  describe('calculatePlayerPerformanceBonus', () => {
    test('Defender with clean sheet gets bonus', () => {
      const playerStats = {
        'kane': {
          playerId: 'kane',
          goals: 1,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          saves: 0,
          ownGoals: 0,
          participant: 1 as 1 | 2,
        },
        'stones': {
          playerId: 'stones',
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          saves: 0,
          ownGoals: 0,
          participant: 1 as 1 | 2,
        },
      };

      const homeTeamStats = {
        participant: 1 as 1 | 2,
        teamName: 'England',
        goalsFor: 1,
        goalsAgainst: 0, // Clean sheet
        possession: 55,
        shotsTotal: 10,
        shotsOnTarget: 4,
        passes: 500,
        passesCompleted: 400,
        tackles: 20,
        interceptions: 5,
        fouls: 10,
      };

      const awayTeamStats = {
        participant: 2 as 1 | 2,
        teamName: 'France',
        goalsFor: 0,
        goalsAgainst: 1,
        possession: 45,
        shotsTotal: 8,
        shotsOnTarget: 2,
        passes: 450,
        passesCompleted: 350,
        tackles: 18,
        interceptions: 3,
        fouls: 12,
      };

      const bonus = calculatePlayerPerformanceBonus(
        'stones',
        playerStats['stones'],
        'DEF',
        homeTeamStats,
        awayTeamStats
      );

      console.log('Defender clean sheet bonus:', bonus);
      expect(bonus.defensiveBonus).toBeGreaterThan(0);
      expect(bonus.reason).toContain('Clean sheet defense');
    });

    test('Midfielder with high possession gets bonus', () => {
      const midfieldStats = {
        playerId: 'bruno',
        goals: 0,
        assists: 1,
        yellowCards: 0,
        redCards: 0,
        saves: 0,
        ownGoals: 0,
        participant: 1 as 1 | 2,
      };

      const homeTeamStats = {
        participant: 1 as 1 | 2,
        teamName: 'England',
        goalsFor: 2,
        goalsAgainst: 0,
        possession: 62, // High possession
        shotsTotal: 15,
        shotsOnTarget: 6,
        passes: 600,
        passesCompleted: 500,
        tackles: 20,
        interceptions: 5,
        fouls: 10,
      };

      const awayTeamStats = {
        participant: 2 as 1 | 2,
        teamName: 'France',
        goalsFor: 0,
        goalsAgainst: 2,
        possession: 38,
        shotsTotal: 6,
        shotsOnTarget: 1,
        passes: 400,
        passesCompleted: 300,
        tackles: 18,
        interceptions: 3,
        fouls: 12,
      };

      const bonus = calculatePlayerPerformanceBonus(
        'bruno',
        midfieldStats,
        'MID',
        homeTeamStats,
        awayTeamStats
      );

      console.log('Midfielder possession bonus:', bonus);
      expect(bonus.possessionBonus).toBeGreaterThan(0);
      expect(bonus.reason).toContain('High possession');
    });
  });

  describe('calculateTotalFantasyPoints', () => {
    test('Calculates total with star multiplier', () => {
      const result = calculateTotalFantasyPoints({
        basePoints: 10,
        performanceBonus: 5,
        skillCardBonus: 3,
        starRating: 4, // 1.35x multiplier
      });

      console.log('Total with star multiplier:', result);
      expect(result.totalPoints).toBe(Math.round((10 + 5 + 3) * 1.35 * 10) / 10);
      expect(result.starMultiplier).toBe(1.35);
      expect(result.details).toContain('Base: +10');
      expect(result.details).toContain('Performance: +5');
    });

    test('5 stars = 1.5x multiplier', () => {
      const result = calculateTotalFantasyPoints({
        basePoints: 20,
        performanceBonus: 8,
        skillCardBonus: 4,
        starRating: 5,
      });

      const expected = Math.round((20 + 8 + 4) * 1.5 * 10) / 10;
      expect(result.totalPoints).toBe(expected);
      expect(result.starMultiplier).toBe(1.5);
    });

    test('1 star = 1.0x multiplier (no bonus)', () => {
      const result = calculateTotalFantasyPoints({
        basePoints: 15,
        performanceBonus: 5,
        skillCardBonus: 0,
        starRating: 1,
      });

      expect(result.totalPoints).toBe(15 + 5);
      expect(result.starMultiplier).toBe(1.0);
    });
  });

  describe('applyStarMultiplier (legacy)', () => {
    test('Applies correct multiplier', () => {
      // 3 stars = 1.2x
      const result = applyStarMultiplier(50, 3);
      expect(result).toBe(Math.round(50 * 1.2 * 10) / 10);
    });
  });
});

// Manual test runner (for debugging)
if (typeof describe === 'undefined') {
  console.log('=== Fantasy Analytics Tests ===\n');

  const testDefenderBonus = () => {
    console.log('Test: Defender with clean sheet');
    const stats = {
      playerId: 'stones',
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      saves: 0,
      ownGoals: 0,
      participant: 1 as 1 | 2,
    };

    const home = {
      participant: 1 as 1 | 2,
      teamName: 'England',
      goalsFor: 1,
      goalsAgainst: 0,
      possession: 55,
      shotsTotal: 10,
      shotsOnTarget: 4,
      passes: 500,
      passesCompleted: 400,
      tackles: 20,
      interceptions: 5,
      fouls: 10,
    };

    const away = {
      participant: 2 as 1 | 2,
      teamName: 'France',
      goalsFor: 0,
      goalsAgainst: 1,
      possession: 45,
      shotsTotal: 8,
      shotsOnTarget: 2,
      passes: 450,
      passesCompleted: 350,
      tackles: 18,
      interceptions: 3,
      fouls: 12,
    };

    const bonus = calculatePlayerPerformanceBonus('stones', stats, 'DEF', home, away);
    console.log(`✓ Defensive bonus: ${bonus.defensiveBonus}pts`);
    console.log(`  Reasons: ${bonus.reason.join(', ')}\n`);
  };

  const testStarMultiplier = () => {
    console.log('Test: Star multiplier calculation');
    const result = calculateTotalFantasyPoints({
      basePoints: 20,
      performanceBonus: 10,
      skillCardBonus: 5,
      starRating: 4,
    });
    console.log(`✓ Total: ${result.totalPoints}pts (base 20 + perf 10 + skill 5 × 1.35 star)`);
    console.log(`  Breakdown: ${result.details.join(' | ')}\n`);
  };

  testDefenderBonus();
  testStarMultiplier();
  console.log('=== Tests Complete ===');
}
