// Replay events for completed matches

export const REPLAY_EVENTS: Record<string, any[]> = {
  'wc2026-spa-ger': [
    { id: 'e0', minute: 0, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Kick Off! Spain vs Germany has begun!' },
    { id: 'e1', minute: 21, team: 'Spain', teamFlag: '🇪🇸', player: 'Olmo', type: 'goal', points: 10, description: 'GOAL! Dani Olmo slots it home for Spain!' },
    { id: 'e2', minute: 35, team: 'Germany', teamFlag: '🇩🇪', player: 'Kroos', type: 'yellow_card', points: -2, description: 'Yellow card for Toni Kroos after a tactical foul' },
    { id: 'e3', minute: 45, team: '', teamFlag: '', player: '', type: 'half_time', points: 0, description: 'Half Time! Spain leads 1-0.' },
    { id: 'e4', minute: 46, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Second Half begins!' },
    { id: 'e5', minute: 58, team: 'Germany', teamFlag: '🇩🇪', player: 'Wirtz', type: 'goal', points: 10, description: 'GOAL! Florian Wirtz equalizes for Germany!' },
    { id: 'e6', minute: 58, team: 'Germany', teamFlag: '🇩🇪', player: 'Kimmich', type: 'assist', points: 6, description: 'Kimmich with a precise cross for the assist' },
    { id: 'e7', minute: 73, team: 'Spain', teamFlag: '🇪🇸', player: 'Unai Simón', type: 'goalkeeper_save', points: 1, description: 'Stunning save by Simón to deny Germany!' },
    { id: 'e8', minute: 82, team: 'Spain', teamFlag: '🇪🇸', player: 'Merino', type: 'goal', points: 10, description: 'GOAL! Mikel Merino heads Spain back in front!' },
    { id: 'e9', minute: 82, team: 'Spain', teamFlag: '🇪🇸', player: 'Olmo', type: 'assist', points: 6, description: 'Olmo assists with a perfect cross!' },
    { id: 'e10', minute: 90, team: '', teamFlag: '', player: '', type: 'full_time', points: 0, description: 'Full Time! Spain wins 2-1!' }
  ],
  'wc2026-jpn-cro': [
    { id: 'e0', minute: 0, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Kick Off! Japan vs Croatia begins!' },
    { id: 'e1', minute: 43, team: 'Japan', teamFlag: '🇯🇵', player: 'Maeda', type: 'goal', points: 10, description: 'GOAL! Maeda puts Japan ahead right before half time!' },
    { id: 'e2', minute: 45, team: '', teamFlag: '', player: '', type: 'half_time', points: 0, description: 'Half Time! Japan leads 1-0.' },
    { id: 'e3', minute: 46, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Second Half under way!' },
    { id: 'e4', minute: 55, team: 'Croatia', teamFlag: '🇭🇷', player: 'Perišić', type: 'goal', points: 10, description: 'GOAL! Perišić equalizes with a brilliant header!' },
    { id: 'e5', minute: 55, team: 'Croatia', teamFlag: '🇭🇷', player: 'Lovren', type: 'assist', points: 6, description: 'Lovren with a deep cross to setup the goal' },
    { id: 'e6', minute: 77, team: 'Japan', teamFlag: '🇯🇵', player: 'Gonda', type: 'goalkeeper_save', points: 1, description: 'Gonda saves a powerful long-range shot!' },
    { id: 'e7', minute: 90, team: '', teamFlag: '', player: '', type: 'full_time', points: 0, description: 'Full Time! The match ends in a 1-1 draw.' }
  ]
};
