// Replay events for completed matches
// Only events available from TxLINE API: goal, goal_conceded, yellow_card, red_card,
// own_goal, penalty_won, penalty_conceded, penalty_missed, corner_kick, substitution,
// var_review, kick_off, half_time, full_time

export const REPLAY_EVENTS: Record<string, any[]> = {
  'wc2026-spa-ger': [
    { id: 'e0', minute: 0, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Kick Off! Spain vs Germany has begun!' },
    { id: 'e1', minute: 21, team: 'Spain', teamFlag: '🇪🇸', player: 'Olmo', playerId: 'esp-olmo', type: 'goal', points: 10, description: 'GOAL! Dani Olmo slots it home for Spain!' },
    { id: 're1_concede', minute: 21, team: 'Germany', teamFlag: '🇩🇪', player: 'M. Neuer', playerId: 'ger-neuer', type: 'goal_conceded', points: -2, description: 'Goal conceded by Neuer.' },
    { id: 'e2', minute: 35, team: 'Germany', teamFlag: '🇩🇪', player: 'Kroos', playerId: 'ger-kroos', type: 'yellow_card', points: -2, description: 'Yellow card for Toni Kroos after a tactical foul' },
    { id: 'e3', minute: 45, team: '', teamFlag: '', player: '', type: 'half_time', points: 0, description: 'Half Time! Spain leads 1-0.' },
    { id: 'e4', minute: 46, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Second Half begins!' },
    { id: 'e5', minute: 58, team: 'Germany', teamFlag: '🇩🇪', player: 'Wirtz', playerId: 'ger-wirtz', type: 'goal', points: 10, description: 'GOAL! Florian Wirtz equalizes for Germany!' },
    { id: 're3_concede', minute: 58, team: 'Spain', teamFlag: '🇪🇸', player: 'U. Simón', playerId: 'esp-simon', type: 'goal_conceded', points: -2, description: 'Goal conceded by Simón.' },
    { id: 'e8', minute: 82, team: 'Spain', teamFlag: '🇪🇸', player: 'Merino', playerId: 'esp-merino', type: 'goal', points: 10, description: 'GOAL! Mikel Merino heads Spain back in front!' },
    { id: 'e8_concede', minute: 82, team: 'Germany', teamFlag: '🇩🇪', player: 'Neuer', playerId: 'ger-neuer', type: 'goal_conceded', points: -2, description: 'Goal conceded by Neuer.' },
    { id: 'e10', minute: 90, team: '', teamFlag: '', player: '', type: 'full_time', points: 0, description: 'Full Time! Spain wins 2-1!' }
  ],
  'wc2026-jpn-cro': [
    { id: 'e0', minute: 0, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Kick Off! Japan vs Croatia begins!' },
    { id: 'e1', minute: 43, team: 'Japan', teamFlag: '🇯🇵', player: 'Maeda', playerId: 'jpn-maeda', type: 'goal', points: 10, description: 'GOAL! Maeda puts Japan ahead right before half time!' },
    { id: 'jc3_concede', minute: 43, team: 'Croatia', teamFlag: '🇭🇷', player: 'D. Livaković', playerId: 'cro-livakovic', type: 'goal_conceded', points: -2, description: 'Goal conceded by Livaković.' },
    { id: 'e2', minute: 45, team: '', teamFlag: '', player: '', type: 'half_time', points: 0, description: 'Half Time! Japan leads 1-0.' },
    { id: 'e3', minute: 46, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Second Half under way!' },
    { id: 'e4', minute: 55, team: 'Croatia', teamFlag: '🇭🇷', player: 'Perišić', playerId: 'cro-perisic', type: 'goal', points: 10, description: 'GOAL! Perišić equalizes with a brilliant header!' },
    { id: 'jc1_concede', minute: 55, team: 'Japan', teamFlag: '🇯🇵', player: 'S. Gonda', playerId: 'jpn-gonda', type: 'goal_conceded', points: -2, description: 'Goal conceded by Gonda.' },
    { id: 'e7', minute: 90, team: '', teamFlag: '', player: '', type: 'full_time', points: 0, description: 'Full Time! The match ends in a 1-1 draw.' }
  ]
};

