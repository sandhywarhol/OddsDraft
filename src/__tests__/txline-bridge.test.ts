// Tests for goal/own_goal → goal_conceded synthesis in txline-bridge.ts

import { convertEspnEvents } from '@/lib/espn-bridge';
import type { EspnMatchEvent } from '@/lib/espn';

const HOME = 'Home FC';
const AWAY = 'Away FC';

function buildEvent(rawType: string, isHome: boolean, id: string): EspnMatchEvent {
  return {
    id,
    type: rawType,
    clockSeconds: 23 * 60,
    period: 1,
    teamId: isHome ? '1' : '2',
    participants: [{ athleteId: 'espn-1', displayName: 'Test Scorer' }],
  } as EspnMatchEvent;
}

describe('convertEspnEvents — goal_conceded synthesis', () => {
  test('a regular goal synthesizes goal_conceded for the OPPOSING team', () => {
    const events = convertEspnEvents(
      [buildEvent('goal', true, 'ev-1')],
      {},
      HOME,
      AWAY,
      '1',
      '2',
      'homeFlag',
      'awayFlag',
      new Set()
    );

    const gc = events.find(e => e.type === 'goal_conceded');
    expect(gc).toBeDefined();
    expect(gc?.team).toBe(AWAY);
    expect(gc?.points).toBe(-2);
  });

  test('an own goal synthesizes goal_conceded for the SAME team', () => {
    const events = convertEspnEvents(
      [buildEvent('own-goal', true, 'ev-2')],
      {},
      HOME,
      AWAY,
      '1',
      '2',
      'homeFlag',
      'awayFlag',
      new Set()
    );

    const gc = events.find(e => e.type === 'goal_conceded');
    expect(gc).toBeDefined();
    // The team that scored the own goal concedes the goal
    expect(gc?.team).toBe(HOME);
    expect(gc?.points).toBe(-2);
  });
});
