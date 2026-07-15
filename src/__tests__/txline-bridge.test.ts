// Tests for goal/own_goal → goal_conceded synthesis in txline-bridge.ts

import { convertTxLineUpdates, type TxLineScoreUpdate } from '@/lib/txline-bridge';

const HOME = 'Home FC';
const AWAY = 'Away FC';

function buildUpdate(rawType: string, participant: 1 | 2, seq: number): TxLineScoreUpdate {
  return {
    seq,
    gameState: 'FirstHalf',
    events: [
      {
        type: rawType,
        minute: 23,
        period: '1H',
        participant,
        playerId: 'tx-1',
        playerName: 'Test Scorer',
      },
    ],
  };
}

describe('convertTxLineUpdates — goal_conceded synthesis', () => {
  test('a regular goal synthesizes goal_conceded for the OPPOSING team', () => {
    const events = convertTxLineUpdates(
      [buildUpdate('goal', 1, 1)],
      {},
      HOME,
      AWAY,
      '🏠',
      '✈️',
      new Set<number>()
    );

    const conceded = events.find(e => e.type === 'goal_conceded');
    expect(conceded).toBeDefined();
    expect(conceded!.team).toBe(AWAY);
  });

  test('an own goal synthesizes goal_conceded for the SAME (conceding) team', () => {
    const events = convertTxLineUpdates(
      [buildUpdate('own_goal', 1, 1)],
      {},
      HOME,
      AWAY,
      '🏠',
      '✈️',
      new Set<number>()
    );

    const conceded = events.find(e => e.type === 'goal_conceded');
    expect(conceded).toBeDefined();
    // The own-goal scorer's own team (participant 1 → HOME) is the one that concedes,
    // not the opposing team — this is the fix for the previously-missing synthesis.
    expect(conceded!.team).toBe(HOME);
  });

  test('an own goal by the away team synthesizes goal_conceded for AWAY, not HOME', () => {
    const events = convertTxLineUpdates(
      [buildUpdate('own_goal', 2, 1)],
      {},
      HOME,
      AWAY,
      '🏠',
      '✈️',
      new Set<number>()
    );

    const conceded = events.find(e => e.type === 'goal_conceded');
    expect(conceded).toBeDefined();
    expect(conceded!.team).toBe(AWAY);
  });
});
