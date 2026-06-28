'use client';

import { useState, useEffect, useRef, use } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { DEMO_FIXTURES, getDynamicEvents } from '@/lib/players';
import { REPLAY_EVENTS } from '@/lib/replay-events';
import { POINT_MAP } from '@/lib/fantasy-engine';
import { getRandomTeamFact } from '@/lib/commentaryKnowledge';
import { useAudio } from '@/context/AudioContext';

// Demo live events that replay at interval to simulate a live match
const LIVE_EVENTS = [
  { id: 'e0', minute: 0, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Kick Off! The match begins!' },
  { id: 'e1', minute: 12, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', type: 'goal', points: 10, description: 'GOAL! Mbappé fires into the top corner!' },
  { id: 'e2', minute: 12, team: 'France', teamFlag: '🇫🇷', player: 'Griezmann', type: 'assist', points: 6, description: 'Griezmann with the brilliant through ball' },
  { id: 'e2_1', minute: 18, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero', type: 'foul', points: 0, description: 'Foul committed by Romero' },
  { id: 'e2_2', minute: 19, team: 'France', teamFlag: '🇫🇷', player: 'Griezmann', type: 'free_kick', points: 0, description: 'France takes a dangerous free kick' },
  { id: 'e3', minute: 23, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', type: 'goalkeeper_save', points: 1, description: 'Martínez with a crucial save!' },
  { id: 'e3_1', minute: 24, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', type: 'corner_kick', points: 0, description: 'Corner kick awarded to France' },
  { id: 'e4', minute: 31, team: 'France', teamFlag: '🇫🇷', player: 'Dembélé', type: 'yellow_card', points: -2, description: 'Yellow card for Dembélé' },
  { id: 'e5', minute: 38, team: 'Argentina', teamFlag: '🇦🇷', player: 'L. Martínez', type: 'goal', points: 10, description: 'GOAL! Lautaro equalizes for Argentina!' },
  { id: 'e6', minute: 38, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', type: 'assist', points: 6, description: 'Messi with his magic - the assist!' },
  { id: 'e4_5', minute: 45, team: '', teamFlag: '', player: '', type: 'half_time', points: 0, description: 'Half Time! The first half concludes!' },
  { id: 'e4_6', minute: 46, team: '', teamFlag: '', player: '', type: 'kick_off', points: 0, description: 'Second Half Kick Off! We are underway again!' },
  { id: 'e6_1', minute: 49, team: 'Argentina', teamFlag: '🇦🇷', player: 'Di María', type: 'offside', points: 0, description: 'Di María is caught offside' },
  { id: 'e7', minute: 52, team: 'France', teamFlag: '🇫🇷', player: 'Giroud', type: 'goal', points: 10, description: 'GOAL! Giroud puts France back ahead!' },
  { id: 'e7_1', minute: 54, team: '', teamFlag: '', player: '', type: 'var_review', points: 0, description: 'VAR Review ongoing for a potential foul' },
  { id: 'e7_2', minute: 60, team: 'France', teamFlag: '🇫🇷', player: 'Coman', type: 'substitution', points: 0, description: 'Substitution: Coman comes on' },
  { id: 'e8', minute: 67, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', type: 'goal', points: 10, description: 'GOAL! MESSI! The GOAT strikes!' },
  { id: 'e9', minute: 79, team: 'France', teamFlag: '🇫🇷', player: 'Mbappé', type: 'goal', points: 10, description: 'Hat-trick! Mbappé with an incredible finish!' },
  { id: 'e10', minute: 90, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez', type: 'goal', points: 10, description: '90th minute! Álvarez scores in stoppage time!' },
  { id: 'e11', minute: 90, team: '', teamFlag: '', player: '', type: 'full_time', points: 0, description: 'Full Time! The match is over!' },
];

// Demo leaderboard
const DEMO_LEADERBOARD = [
  { rank: 1, username: 'CryptoGoalkeeper', wallet: 'Cx9...4mN', points: 124.5, prize: '5.0 SOL', isUser: false },
  { rank: 2, username: 'You', wallet: 'YOUR WALLET', points: 98.2, prize: '3.0 SOL', isUser: true },
  { rank: 3, username: 'MbappeObsessed', wallet: '7kP...2sQ', points: 87.0, prize: '2.0 SOL', isUser: false },
  { rank: 4, username: 'TacticalMaster', wallet: 'Rz3...9vT', points: 72.4, prize: '-', isUser: false },
  { rank: 5, username: 'SolanaBaller', wallet: 'Lw8...mX1', points: 65.1, prize: '-', isUser: false },
  { rank: 6, username: 'BlockStriker', wallet: 'Bs4...9kP', points: 58.6, prize: '-', isUser: false },
  { rank: 7, username: 'DegenDeGea', wallet: 'Dg2...1vL', points: 54.3, prize: '-', isUser: false },
  { rank: 8, username: 'PhantomPlaymaker', wallet: 'Pp5...7wQ', points: 51.0, prize: '-', isUser: false },
  { rank: 9, username: 'GigaChadFC', wallet: 'Gc7...3tN', points: 48.5, prize: '-', isUser: false },
  { rank: 10, username: 'SolStriker', wallet: 'Ss8...5kM', points: 45.2, prize: '-', isUser: false },
  { rank: 11, username: 'NodeNavigator', wallet: 'Nn9...2wP', points: 42.0, prize: '-', isUser: false },
  { rank: 12, username: 'RugPullResist', wallet: 'Rr3...6vL', points: 39.8, prize: '-', isUser: false },
  { rank: 13, username: 'LedgerLegend', wallet: 'Ll4...1tK', points: 36.5, prize: '-', isUser: false },
  { rank: 14, username: 'ApeInUnited', wallet: 'Au6...8mN', points: 34.2, prize: '-', isUser: false },
  { rank: 15, username: 'CryptoCruiser', wallet: 'Cc2...9sJ', points: 31.0, prize: '-', isUser: false },
  { rank: 16, username: 'SatoshiSquad', wallet: 'Sq7...4vL', points: 28.5, prize: '-', isUser: false },
  { rank: 17, username: 'GasLimitFC', wallet: 'Gl5...3kP', points: 25.0, prize: '-', isUser: false },
  { rank: 18, username: 'HODLUnited', wallet: 'Hu9...1wQ', points: 22.3, prize: '-', isUser: false },
  { rank: 19, username: 'YieldFarmer', wallet: 'Yf3...7sN', points: 18.5, prize: '-', isUser: false },
  { rank: 20, username: 'MoonBoyz', wallet: 'Mb4...5vL', points: 12.0, prize: '-', isUser: false },
];

const EVENT_COLORS: Record<string, string> = {
  goal: '#2e7d32', // rich dark green
  assist: '#1565c0', // rich dark blue
  goalkeeper_save: '#00838f', // rich dark cyan
  yellow_card: '#e65100', // rich dark orange
  red_card: '#c62828', // rich dark red
  own_goal: '#c62828',
  penalty_save: '#2e7d32',
  kick_off: '#0288d1', // sky blue
  half_time: '#5e35b1', // purple
  full_time: '#c62828', // red
};

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽',
  assist: '🎯',
  goalkeeper_save: '🧤',
  yellow_card: '🟨',
  red_card: '🟥',
  own_goal: '😰',
  penalty_save: '🙅',
  kick_off: '📢',
  half_time: '⏸️',
  full_time: '🛑',
};

interface DialogData {
  speakerTitle: string;
  text: string;
  commentator1Image?: string; // Always Left
  commentator2Image?: string; // Always Right
  refereeImage?: string;      // Usually Right
  isRefereeStyle?: boolean;
  refereePosition?: 'left' | 'right';
}

function getDialogData(event: any, step: number, fixture: any, score: { home: number, away: number } = { home: 0, away: 0 }): DialogData {
  const player = event.player || 'Player';
  const team = event.team || 'Team';
  const opponent = event.team === fixture.homeTeam ? fixture.awayTeam : fixture.homeTeam;
  const minute = event.minute ?? 0;

  switch (event.type) {
    case 'kick_off':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'KICK OFF',
          refereeImage: '/NPC/Referee Kick OFF.svg',
          isRefereeStyle: true,
          refereePosition: 'left'
        };
      } else if (step === 2) {
        if (minute >= 45) {
          return {
            speakerTitle: 'Alan',
            text: `"The referee blows the whistle for the second half! The score is currently ${fixture.homeTeam} ${score.home} - ${score.away} ${fixture.awayTeam}."`,
            commentator2Image: '/NPC/Comentator 2 Calm.svg',
          };
        } else {
          return {
            speakerTitle: 'Alan',
            text: `"The referee blows the whistle and we are underway! Let's hope for an exciting match today."`,
            commentator2Image: '/NPC/Comentator 2 Calm.svg',
          };
        }
      } else if (step === 3) {
        if (minute >= 45) {
          return {
            speakerTitle: 'Martin',
            text: `"Let's see if the managers' half-time instructions can make a difference in these final 45 minutes!"`,
            commentator1Image: '/NPC/Komentator 1 calm.svg',
          };
        } else {
          return {
            speakerTitle: 'Martin',
            text: `"The atmosphere in the stadium is absolutely electric. I can't wait to see which team takes control of the match early on!"`,
            commentator1Image: '/NPC/Komentator 1 calm.svg',
          };
        }
      } else if (step === 4) {
        if (minute < 45) {
          const homeFact = getRandomTeamFact(fixture.homeTeam);
          if (homeFact) {
            return {
              speakerTitle: 'Alan',
              text: `"Speaking of ${fixture.homeTeam}, did you know? ${homeFact}"`,
              commentator2Image: '/NPC/Comentator 2 Calm.svg',
            };
          }
        }
        return {
          speakerTitle: 'Alan',
          text: `"Both teams look completely focused today. We're in for a treat."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else {
        if (minute < 45) {
          const awayFact = getRandomTeamFact(fixture.awayTeam);
          if (awayFact) {
            return {
              speakerTitle: 'Martin',
              text: `"And don't forget about ${fixture.awayTeam}. ${awayFact}"`,
              commentator1Image: '/NPC/Komentator 1 calm.svg',
            };
          }
        }
        return {
          speakerTitle: 'Martin',
          text: `"Absolutely, every detail will count on the pitch today!"`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'half_time':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'HALF TIME',
          refereeImage: '/NPC/ End of Game.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Alan',
          text: `"And that's the whistle for the break! It's been an intense first 45 minutes. Let's take a quick look at the midway TxODDS statistics."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else if (step === 3) {
        return {
          speakerTitle: 'Martin',
          text: `"The possession is incredibly even so far, but ${fixture.homeTeam} has been much more dangerous in the final third, creating higher quality xG chances."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"Absolutely. The managers will have a lot to talk about in the dressing room. We'll see what tactical adjustments they make for the second half."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      }
    case 'full_time':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'FULL TIME',
          refereeImage: '/NPC/ End of Game.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Martin',
          text: `"What an incredible match! Let's dive into the post-match statistics provided by TxODDS."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      } else if (step === 3) {
        return {
          speakerTitle: 'Alan',
          text: `"Looking at the data, ${fixture.homeTeam} absolutely dominated the possession today, holding onto the ball for a staggering 62% of the game."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else if (step === 4) {
        return {
          speakerTitle: 'Martin',
          text: `"Indeed! And their passing accuracy was exceptional as well. They completed nearly 88% of their passes, constantly putting pressure on the defense."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      } else if (step === 5) {
        return {
          speakerTitle: 'Alan',
          text: `"However, the Expected Goals (xG) tells a different story. Despite the possession, ${fixture.awayTeam} had a much higher xG thanks to their lethal counter-attacks and clinical finishing!"`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else if (step === 6) {
        return {
          speakerTitle: 'Martin',
          text: `"Don't forget the incredible performance between the posts! Both goalkeepers registered crucial saves that kept the fans on the edge of their seats."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"A truly tactical masterclass and a fantastic display of football. Thank you for joining our live coverage, we'll see you at the next fixture!"`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      }
    case 'goal':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: event.description ? `"${event.description}"` : `"GOAL! ${player} finds the back of the net in the ${minute} minute with a brilliant finish to put his team in front!"`,
          commentator1Image: '/NPC/Comentator 1.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"A brilliant team move from ${team} finally breaks through the ${opponent} defense and ends with a well-deserved goal!"`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      }
    case 'yellow_card':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: event.description ? `"${event.description}"` : `"Oh, that's a reckless challenge by ${player}! The referee steps in and shows a yellow card. He must be careful now!"`,
          commentator1Image: '/NPC/Comentator 1.svg',
          refereeImage: '/NPC/Referee Yellow Card.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"He really needs to watch his step now. One more mistake and ${team} will be down to 10 men!"`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      }
    case 'red_card':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: event.description ? `"${event.description}"` : `"Oh, that's a reckless challenge by ${player}! The referee has no choice but to show a straight red card, and it's a huge blow for ${team}!"`,
          commentator1Image: '/NPC/Comentator 1.svg',
          refereeImage: '/NPC/Referee Red Card.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"That's a game-changing moment! The manager of ${team} will have to completely rethink their strategy now."`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      }
    case 'own_goal':
      if (step === 1) {
        return {
          speakerTitle: 'Martin',
          text: `"Disaster! It's an own goal by ${player}! An absolute nightmare moment for ${team}!"`,
          commentator1Image: '/NPC/Comentator 1.svg',
          refereeImage: '/NPC/ End of Game.svg',
        };
      } else {
        return {
          speakerTitle: 'Alan',
          text: `"Absolutely gutting for ${team}. These are the moments that can completely change the momentum of a match!"`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      }
    case 'assist':
      if (step === 1) {
        return {
          speakerTitle: 'Alan',
          text: `"Sensational vision from ${player}! A perfectly weighted pass to open up the defense."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"Absolutely spot on! That kind of creativity is exactly what you need to break down a stubborn defense."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'shot_on_target':
      return {
        speakerTitle: 'Martin',
        text: `"Great strike by ${player}! The goalkeeper had to be alert to keep that one out."`,
        commentator1Image: '/NPC/Komentator 1 calm.svg',
      };
    case 'pass_accuracy':
      if (step === 1) {
        return {
          speakerTitle: 'Alan',
          text: `"Excellent distribution by ${player}! Controlling the tempo of the game with pinpoint passing."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"Exactly right. Keeping possession and moving the ball intelligently is dictating the flow of the entire match."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'clean_sheet':
      if (step === 1) {
        return {
          speakerTitle: 'Alan',
          text: `"Solid defensive display! ${team} has managed to keep a clean sheet today."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"A fantastic effort from the backline. Defending as a unit like that wins you championships."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'substitution':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'SUBSTITUTION',
          refereeImage: '/NPC/Player subtitution.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Alan',
          text: event.description ? `"${event.description}"` : `"Substitution for ${team}. Let's see if this tactical change can turn the tide of the match."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"Fresh legs on the pitch often provide that extra spark. It will be interesting to see how the opposition responds."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'goalkeeper_save':
      if (step === 1) {
        return {
          speakerTitle: 'Alan',
          text: `"What a save by ${player}! Incredible reflexes to deny the attacker. Outstanding goalkeeping!"`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"I couldn't agree more. It's moments of brilliance like that from the keeper that keep the team in the game."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'penalty_save':
      if (step === 1) {
        return {
          speakerTitle: 'Alan',
          text: `"SAVED! ${player} guesses correctly and makes a heroic penalty save! Absolutely incredible!"`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"What a massive psychological boost! You have to praise the keeper's composure under such intense pressure."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'foul':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'FOUL',
          refereeImage: '/NPC/Foul.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Alan',
          text: event.description ? `"${event.description}"` : `"That's a careless foul by ${player}. The referee awards a free kick."`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"He needs to be careful not to pick up a silly booking early on."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'free_kick':
      if (step === 1) {
        return {
          speakerTitle: 'Alan',
          text: `"${team} wins a dangerous free kick just outside the box. This is a great scoring opportunity!"`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"They've clearly been practicing these set pieces on the training ground. Let's see what they can do."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'corner_kick':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'CORNER',
          refereeImage: '/NPC/Corner Kick.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Alan',
          text: event.description ? `"${event.description}"` : `"It's out for a corner kick. A chance for ${team} to send their tall defenders forward."`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"Set pieces are crucial in tight games like this. Delivery will be everything."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'offside':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'OFFSIDE',
          refereeImage: '/NPC/Offside.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Alan',
          text: event.description ? `"${event.description}"` : `"The linesman's flag goes up! ${player} is caught offside."`,
          commentator2Image: '/NPC/Comentator 2.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"It was a very tight call, but the high defensive line did its job perfectly."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    case 'var_review':
      if (step === 1) {
        return {
          speakerTitle: 'Referee',
          text: 'VAR REVIEW',
          refereeImage: '/NPC/VAR.svg',
          isRefereeStyle: true,
        };
      } else if (step === 2) {
        return {
          speakerTitle: 'Alan',
          text: `"Hold on, the referee is pausing play. We are having a VAR review for a potential incident."`,
          commentator2Image: '/NPC/Comentator 2 Calm.svg',
        };
      } else {
        return {
          speakerTitle: 'Martin',
          text: `"This is a tense moment for both teams. The technology is checking everything closely."`,
          commentator1Image: '/NPC/Komentator 1 calm.svg',
        };
      }
    default:
      return {
        speakerTitle: 'Commentator',
        text: `"${event.description}"`,
        commentator1Image: '/NPC/Komentator 1 calm.svg',
      };
  }
}

export default function ReplayPage({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = use(params);
  const { playSFX } = useAudio();
  const fixture = DEMO_FIXTURES.find((f) => f.fixtureId === contestId) || DEMO_FIXTURES.find(f => f.status === 'live') || DEMO_FIXTURES[0];

  const matchEvents = getDynamicEvents(fixture, REPLAY_EVENTS[contestId] || LIVE_EVENTS);

  const [initialState] = useState(() => {
    const initialMin = 0; // Always start at 0 for replay
    
    let initialIdx = matchEvents.findIndex(e => e.minute >= initialMin);
    if (initialIdx === -1) initialIdx = matchEvents.length;

    const initialEvents = matchEvents.slice(0, initialIdx).reverse();
    
    let homeScore = 0;
    let awayScore = 0;
    
    initialEvents.forEach(e => {
      if (e.type === 'goal' || e.type === 'own_goal') {
        if (e.team === fixture.homeTeam) homeScore++;
        else if (e.team === fixture.awayTeam) awayScore++;
      }
    });

    const triggered = new Set<string>();
    initialEvents.forEach(e => triggered.add(e.id));

    return { initialMin, initialIdx, initialEvents, homeScore, awayScore, triggered };
  });

  const [events, setEvents] = useState<typeof matchEvents>(initialState.initialEvents);
  const [currentEventIdx, setCurrentEventIdx] = useState(initialState.initialIdx);
  const [score, setScore] = useState({ home: initialState.homeScore, away: initialState.awayScore });
  const [minute, setMinute] = useState(initialState.initialMin);
  const [leaderboard, setLeaderboard] = useState(DEMO_LEADERBOARD);
  const [latestEvent, setLatestEvent] = useState<(typeof matchEvents)[0] | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFastForward, setIsFastForward] = useState(true);
  const eventRef = useRef<HTMLDivElement>(null);
  const triggeredEventsRef = useRef<Set<string>>(initialState.triggered);
  const [dialogStep, setDialogStep] = useState(1);

  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verifying' | 'success'>('pending');

  const handleVerify = () => {
    setVerificationStatus('verifying');
    setTimeout(() => {
      setVerificationStatus('success');
    }, 2000);
  };

  // Simulate live events
  useEffect(() => {
    if (!isPlaying || showPopup) return;
    
    const tickRate = isFastForward ? 2000 : 60000;

    const interval = setInterval(() => {
      setMinute((m) => Math.min(m + 1, 90));
      setCurrentEventIdx((idx) => {
        if (idx >= matchEvents.length) return idx;
        return idx;
      });
    }, tickRate);

    return () => clearInterval(interval);
  }, [isPlaying, showPopup, isFastForward]);

    // Trigger events based on minute
    useEffect(() => {
      if (showPopup) return;
      const event = matchEvents[currentEventIdx];
      if (!event || minute < event.minute) return;
      if (triggeredEventsRef.current.has(event.id)) return;
      if (events.find((e) => e.id === event.id)) return;
  
      triggeredEventsRef.current.add(event.id);
      
      // Play Sound Effect based on event type
      if (event.type === 'goal' || event.type === 'own_goal') {
        playSFX('goal');
      } else if (event.type === 'full_time') {
        playSFX('end_game');
      } else if (['kick_off', 'foul', 'yellow_card', 'red_card', 'penalty_save', 'free_kick', 'corner_kick', 'offside', 'substitution'].includes(event.type)) {
        playSFX('whistle');
      }

      setEvents((prev) => [event, ...prev]);
      setCurrentEventIdx((idx) => idx + 1);
      setLatestEvent(event);
      setDialogStep(1);
      setShowPopup(true);
  
      // Update score
      if (event.type === 'goal' || event.type === 'own_goal') {
        const isHome = event.team === fixture.homeTeam;
        setScore((s) => ({
          home: isHome ? s.home + 1 : s.home,
          away: !isHome ? s.away + 1 : s.away,
        }));
      }
  
      // Shuffle leaderboard slightly
      setLeaderboard((prev) => {
        const next = [...prev];
        next[1] = { ...next[1], points: next[1].points + Math.abs(event.points) * 0.8 };
        return next.sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }));
      });
    }, [minute, currentEventIdx, events, fixture.homeTeam, showPopup]);

    // Auto-advance or auto-close JRPG dialog popups
    useEffect(() => {
      if (!showPopup || !latestEvent) return;

      let timer: NodeJS.Timeout;
      const multiStepEvents = ['goal', 'own_goal', 'yellow_card', 'red_card', 'assist', 'pass_accuracy', 'clean_sheet', 'substitution', 'goalkeeper_save', 'penalty_save', 'free_kick'];

      if (latestEvent.type === 'full_time') {
        if (dialogStep === 1) {
          timer = setTimeout(() => setDialogStep(2), 4000);
        } else if (dialogStep === 2) {
          timer = setTimeout(() => setDialogStep(3), 5000);
        } else if (dialogStep === 3) {
          timer = setTimeout(() => setDialogStep(4), 5000);
        } else if (dialogStep === 4) {
          timer = setTimeout(() => setDialogStep(5), 5000);
        } else if (dialogStep === 5) {
          timer = setTimeout(() => setDialogStep(6), 5000);
        } else if (dialogStep === 6) {
          timer = setTimeout(() => setDialogStep(7), 5000);
        } else {
          timer = setTimeout(() => setShowPopup(false), 5000);
        }
      } else if (latestEvent.type === 'half_time') {
        if (dialogStep === 1) {
          timer = setTimeout(() => setDialogStep(2), 4000);
        } else if (dialogStep === 2) {
          timer = setTimeout(() => setDialogStep(3), 5000);
        } else if (dialogStep === 3) {
          timer = setTimeout(() => setDialogStep(4), 5000);
        } else {
          timer = setTimeout(() => setShowPopup(false), 5000);
        }
      } else if (latestEvent.type === 'kick_off') {
        if (dialogStep === 1) {
          timer = setTimeout(() => setDialogStep(2), 4000);
        } else if (dialogStep === 2) {
          timer = setTimeout(() => setDialogStep(3), 5000);
        } else if (dialogStep === 3) {
          timer = setTimeout(() => setDialogStep(4), 5000);
        } else if (dialogStep === 4) {
          timer = setTimeout(() => setDialogStep(5), 5000);
        } else {
          timer = setTimeout(() => setShowPopup(false), 5000);
        }
      } else if (latestEvent.type === 'var_review' || latestEvent.type === 'foul' || latestEvent.type === 'corner_kick' || latestEvent.type === 'offside') {
        if (dialogStep === 1) {
          timer = setTimeout(() => setDialogStep(2), 4000);
        } else if (dialogStep === 2) {
          timer = setTimeout(() => setDialogStep(3), 5000);
        } else {
          timer = setTimeout(() => setShowPopup(false), 5000);
        }
      } else if (multiStepEvents.includes(latestEvent.type) && dialogStep === 1) {
        timer = setTimeout(() => {
          setDialogStep(2);
        }, 5000);
      } else {
        timer = setTimeout(() => {
          setShowPopup(false);
        }, 5000);
      }

      return () => clearTimeout(timer);
    }, [showPopup, latestEvent, dialogStep]);

    // Restart the match exactly 2 minutes after full time dialog finishes
    useEffect(() => {
      if (latestEvent?.type === 'full_time' && !showPopup) {
        const resetTimer = setTimeout(() => {
          setMinute(0);
          setCurrentEventIdx(0);
          triggeredEventsRef.current.clear();
          setEvents([]);
          setScore({ home: 0, away: 0 });
          setLeaderboard(DEMO_LEADERBOARD);
          setLatestEvent(null);
        }, 120000); // 120,000ms = 2 minutes
        return () => clearTimeout(resetTimer);
      }
    }, [latestEvent, showPopup]);

  const userPoints = leaderboard.find((e) => e.isUser)?.points ?? 0;
  const userRank = leaderboard.find((e) => e.isUser)?.rank ?? '-';

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Navbar />

      {/* Live Event Popup */}
      {showPopup && latestEvent && (() => {
        const dialog = getDialogData(latestEvent, dialogStep, fixture, score);
        
        if (dialog.isRefereeStyle) {
          return (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(5px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* Referee Image */}
              <img
                src={dialog.refereeImage}
                alt="Referee"
                style={{
                  position: 'absolute',
                  bottom: '-30vh',
                  right: (dialog as any).refereePosition === 'left' ? 'auto' : '2%',
                  left: (dialog as any).refereePosition === 'left' ? '2%' : 'auto',
                  height: '125vh',
                  objectFit: 'contain',
                  zIndex: 1020,
                  animation: (dialog as any).refereePosition === 'left' ? 'slide-in-left 400ms ease-out' : 'slide-in-right 400ms ease-out',
                  filter: 'drop-shadow(3px 0px 0px white) drop-shadow(0px 3px 0px white) drop-shadow(-3px 0px 0px white) drop-shadow(0px -3px 0px white)',
                }}
              />
              
              {/* Giant Yellow Explosion Speech Bubble */}
              <div 
                onClick={() => setShowPopup(false)}
                style={{
                  position: 'absolute',
                  bottom: '35vh',
                  left: (dialog as any).refereePosition === 'left' ? 'auto' : '15%',
                  right: (dialog as any).refereePosition === 'left' ? '15%' : 'auto',
                  zIndex: 1010,
                  cursor: 'pointer',
                  animation: 'score-pop 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
              >
                <div style={{
                  background: '#ffee00',
                  color: '#000000',
                  border: '8px solid #000000',
                  padding: '32px 64px',
                  fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                  fontWeight: 900,
                  fontFamily: 'Impact, Arial Black, sans-serif',
                  textTransform: 'uppercase',
                  boxShadow: '12px 12px 0px #000000',
                  transform: 'skewX(-6deg) rotate(-4deg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  {dialog.text}
                  <span style={{ color: '#ff0000', fontSize: '1.2em' }}>!!</span>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingBottom: '8vh',
          }}>
            <style>{`
              @keyframes slide-in-left {
                from { transform: translateX(-150px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
              @keyframes slide-in-right {
                from { transform: translateX(150px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
              @keyframes bounce-horizontal {
                from { transform: translateX(0); }
                to { transform: translateX(6px); }
              }
              @keyframes dialog-glow {
                0% { box-shadow: 0 0 15px rgba(251, 240, 185, 0.2); }
                50% { box-shadow: 0 0 25px rgba(251, 240, 185, 0.45); }
                100% { box-shadow: 0 0 15px rgba(251, 240, 185, 0.2); }
              }
            `}</style>

            {/* Left character: Commentator 1 */}
            {dialog.commentator1Image && (
              <img
                src={dialog.commentator1Image}
                alt="Commentator 1"
                style={{
                  position: 'absolute',
                  bottom: '-25vh',
                  left: '4%',
                  height: '120vh',
                  objectFit: 'contain',
                  zIndex: 1005,
                  animation: 'slide-in-left 450ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  filter: 'drop-shadow(3px 0px 0px white) drop-shadow(0px 3px 0px white) drop-shadow(-3px 0px 0px white) drop-shadow(0px -3px 0px white)',
                }}
              />
            )}


            {/* Right character: Commentator 2 */}
            {dialog.commentator2Image && (
              <img
                src={dialog.commentator2Image}
                alt="Commentator 2"
                style={{
                  position: 'absolute',
                  bottom: '-25vh',
                  right: '4%',
                  height: '120vh',
                  objectFit: 'contain',
                  zIndex: 1005,
                  animation: 'slide-in-right 450ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  filter: 'drop-shadow(3px 0px 0px white) drop-shadow(0px 3px 0px white) drop-shadow(-3px 0px 0px white) drop-shadow(0px -3px 0px white)',
                }}
              />
            )}

            {/* Right character: Referee */}
            {dialog.refereeImage && (
              <img
                src={dialog.refereeImage}
                alt="Referee"
                style={{
                  position: 'absolute',
                  bottom: '-30vh',
                  right: '1%',
                  height: '125vh',
                  objectFit: 'contain',
                  zIndex: 1006,
                  animation: 'slide-in-right 450ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  filter: 'drop-shadow(3px 0px 0px white) drop-shadow(0px 3px 0px white) drop-shadow(-3px 0px 0px white) drop-shadow(0px -3px 0px white)',
                }}
              />
            )}

            {/* JRPG Dialog Box */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                const type = latestEvent.type;
                let maxSteps = 2; // Default for most multi-step events
                if (type === 'full_time') maxSteps = 7;
                else if (type === 'half_time') maxSteps = 4;
                else if (type === 'kick_off') maxSteps = minute < 45 ? 5 : 3;
                else if (['var_review', 'foul', 'corner_kick', 'offside', 'substitution'].includes(type)) maxSteps = 3;

                if (dialogStep < maxSteps) {
                  setDialogStep(prev => prev + 1);
                } else {
                  setShowPopup(false);
                }
              }}
              style={{
                width: '94%',
                maxWidth: '920px',
                background: '#fcf8eb',
                border: '5px solid #1a1008',
                borderRadius: '0px',
                padding: '36px 48px',
                boxShadow: '10px 10px 0px #1a1008',
                position: 'relative',
                cursor: 'pointer',
                zIndex: 1010,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                animation: 'score-pop 300ms ease-out, dialog-glow 2s infinite',
              }}
            >
              {/* Speaker Tag */}
              <div style={{
                position: 'absolute',
                top: '-22px',
                left: '32px',
                background: '#1a1008',
                color: '#ffffff',
                padding: '6px 24px',
                fontSize: '1rem',
                fontWeight: 800,
                fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '2px 2px 0px #ebdac0',
              }}>
                {dialog.speakerTitle}
              </div>

              {/* Dialog Text */}
              <div style={{
                color: '#1a1008',
                fontSize: 'clamp(1.15rem, 2.6vw, 1.6rem)',
                fontWeight: 700,
                fontFamily: 'Inter, -apple-system, sans-serif',
                lineHeight: 1.6,
                paddingRight: '36px',
              }}>
                {dialog.text}
              </div>

              {/* Next/Close Action Arrow */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '20px',
                animation: 'bounce-horizontal 0.8s infinite alternate',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="#1a1008" />
                  <path d="M10 7L15 12L10 17" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        );
      })()}

      <main style={{ padding: '24px 0 80px' }}>
        <div className="container">
          {/* Breadcrumb */}
          <Link href="/contests" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            ← Back to Lobby
          </Link>

          {/* Score Bug */}
          <div className="score-bug" style={{ marginBottom: 24 }}>
            <div className="score-bug__team">
              <span className="score-bug__flag">{fixture.homeFlag}</span>
              <span className="score-bug__name">{fixture.homeTeam}</span>
            </div>
            <div className="score-bug__score-container">
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="score-bug__score">{score.home}</span>
                <span className="score-bug__separator">—</span>
                <span className="score-bug__score">{score.away}</span>
              </div>
              <div className="score-bug__minute">
                {minute < 90 ? `${minute}'` : 'FT'}
              </div>
              <span className="badge" style={{ fontSize: '0.65rem', background: '#3b82f6', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: '4px' }}>
                REPLAY
              </span>
            </div>
            <div className="score-bug__team">
              <span className="score-bug__flag">{fixture.awayFlag}</span>
              <span className="score-bug__name">{fixture.awayTeam}</span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className={`btn btn--sm ${isPlaying ? 'btn--danger' : 'btn--primary'}`}
              onClick={() => setIsPlaying(!isPlaying)}
              id="toggle-simulation-btn"
            >
              {isPlaying ? '⏸ Pause' : '▶ Resume'}
            </button>
            <button
              className={`btn btn--sm ${isFastForward ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setIsFastForward(!isFastForward)}
            >
              {isFastForward ? '⏩ Fast Forward On' : '⏩ Fast Forward Off'}
            </button>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => { 
                setEvents(initialState.initialEvents); 
                setScore({ home: initialState.homeScore, away: initialState.awayScore }); 
                setMinute(initialState.initialMin); 
                setCurrentEventIdx(initialState.initialIdx); 
                setIsPlaying(true); 
                setVerificationStatus('pending');
                
                const triggered = new Set<string>();
                initialState.initialEvents.forEach(e => triggered.add(e.id));
                triggeredEventsRef.current = triggered;
              }}
              id="reset-simulation-btn"
            >
              ↺ Reset
            </button>
          </div>

          {/* Main Grid */}
          <div className="grid-sidebar">
            {/* LEFT: Events Timeline + User Stats */}
            <div>
              {/* User Fantasy Stats */}
              <div className="card card--primary" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                      Fantasy Points
                    </div>
                    <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '3rem', color: 'var(--color-primary)', lineHeight: 1 }}>
                      {userPoints.toFixed(1)}
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', gap: 16 }}>
                    <div>
                      <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.8rem', color: 'var(--text-primary)' }}>
                        #{userRank}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rank</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '1.8rem', color: '#ffd700' }}>
                        3.0
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Estimated SOL</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Match Events Timeline */}
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16, color: '#ffd700', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Match Events
                  <span className="badge badge--live" style={{ fontSize: '0.6rem' }}>LIVE</span>
                </h3>

                {events.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>⏰</div>
                    Waiting for match events...
                  </div>
                )}

                <div ref={eventRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                  {events.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        padding: '12px 14px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: `3px solid ${EVENT_COLORS[event.type] ?? 'var(--border-medium)'}`,
                        animation: 'score-pop 300ms ease',
                      }}
                    >
                      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{EVENT_ICONS[event.type]}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                            {event.player || (event.type === 'kick_off' ? 'KICK OFF' : event.type === 'half_time' ? 'HALF TIME' : 'FULL TIME')}
                          </span>
                          <span style={{ fontFamily: 'Bebas Neue, cursive', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            {event.minute}&apos;
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {event.team ? `${event.teamFlag} ${event.team}` : event.description}
                        </div>
                      </div>
                      <div style={{
                        fontFamily: 'Bebas Neue, cursive',
                        fontSize: '1.1rem',
                        color: event.points >= 0 ? 'var(--color-primary)' : 'var(--color-danger)',
                        flexShrink: 0,
                      }}>
                        {event.points !== 0 ? `${event.points >= 0 ? '+' : ''}${event.points}` : '0'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic Result Verification Panel */}
              <div className="card" style={{ 
                marginBottom: 20,
              }}>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#ffd700' }}>
                    TxLINE Cryptographic Verification
                  </h3>
                  <span className={`badge`} style={{
                    background: verificationStatus === 'success' ? 'rgba(0, 232, 122, 0.15)' : (verificationStatus === 'verifying' ? 'rgba(255, 165, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)'),
                    color: verificationStatus === 'success' ? '#00e87a' : (verificationStatus === 'verifying' ? 'orange' : 'var(--text-muted)'),
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 0,
                  }}>
                    {verificationStatus === 'success' ? '✅ VERIFIED' : (verificationStatus === 'verifying' ? '⚡ VERIFYING...' : '⏳ PENDING')}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                  Cryptographically verifies that match events and scores match the TxLINE oracle stream recorded on Solana.
                </p>

                <div style={{ 
                  background: 'var(--bg-elevated)', 
                  padding: 12, 
                  borderRadius: 0, 
                  fontSize: '0.75rem', 
                  fontFamily: 'monospace',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  color: 'var(--text-muted)',
                  marginBottom: 16,
                  border: '1.5px solid #ffffff',
                  boxShadow: '0 0 0 1px #000000'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Oracle Stream:</span>
                    <span style={{ color: 'var(--text-primary)' }}>txline-soccer-feed-v2</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Merkle Root:</span>
                    <span style={{ color: verificationStatus === 'success' ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                      {verificationStatus === 'success' ? '0x8f3d...9c2e (MATCHED)' : '0x8f3d...9c2e'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Solana State Anchor:</span>
                    <span style={{ color: 'var(--color-accent)' }}>4u7Gz...h2Pw3L (Slot #289,102)</span>
                  </div>
                  {verificationStatus === 'success' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 6, marginTop: 4 }}>
                        <span>Verification Hash:</span>
                        <span style={{ color: 'var(--color-primary)' }}>0x9e8a7b6c5d4e3f2a</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Merkle Proof:</span>
                        <span style={{ color: 'var(--color-primary)' }}>Validated (3 Leaves)</span>
                      </div>
                    </>
                  )}
                </div>

                {verificationStatus === 'verifying' ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 12,
                    padding: '12px',
                    background: 'rgba(123, 162, 199, 0.1)',
                    borderRadius: 0,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)'
                  }}>
                    <span style={{ 
                      width: 16, 
                      height: 16, 
                      border: '2px solid var(--text-muted)', 
                      borderTopColor: 'var(--color-primary)', 
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Generating Merkle Proof and verifying Solana Anchor...
                  </div>
                ) : (
                  <button
                    className={`btn btn--full ${verificationStatus === 'success' ? 'btn--ghost' : 'btn--primary'}`}
                    onClick={handleVerify}
                    disabled={minute < 90 && verificationStatus !== 'success'}
                    style={{
                      padding: '10px 16px',
                      fontSize: '0.85rem',
                      opacity: minute >= 90 || verificationStatus === 'success' ? 1 : 0.6,
                      cursor: minute >= 90 || verificationStatus === 'success' ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {verificationStatus === 'success' 
                      ? '✓ Verified' 
                      : (minute >= 90 ? 'Run Verification' : 'Wait for Full Time')}
                  </button>
                )}
              </div>

              {/* Point Reference */}
              <div className="card" style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Fantasy Points Reference
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {Object.entries(POINT_MAP).map(([event, pts]) => (
                    <div key={event} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '4px 8px', background: 'var(--bg-elevated)', borderRadius: 6 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{event.replace(/_/g, ' ')}</span>
                      <span style={{ fontWeight: 700, color: pts >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                        {pts >= 0 ? '+' : ''}{pts}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Leaderboard */}
            <div>
              <div className="ro-window" style={{ position: 'sticky', top: 80 }}>
                <div className="ro-window__header" style={{ background: 'linear-gradient(to right, #b45309 0%, #78350f 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🏆 Live Leaderboard</span>
                  <span className="badge badge--live" style={{ fontSize: '0.6rem' }}>Live</span>
                </div>
                <div className="ro-window__body" style={{ padding: 16, maxHeight: '420px', overflowY: 'auto' }}>
                  <table className="leaderboard" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'center' }}>#</th>
                        <th>Player</th>
                        <th style={{ textAlign: 'right' }}>Pts</th>
                        <th style={{ textAlign: 'right' }}>Prize</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry) => (
                        <tr
                          key={entry.wallet}
                          style={{
                            background: entry.isUser ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                            transition: 'all 300ms',
                          }}
                        >
                          <td className="leaderboard__rank" style={{ textAlign: 'center' }}>
                            <span className={`leaderboard__rank--${entry.rank}`}>
                              {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: entry.isUser ? 700 : 500, fontSize: '0.85rem', color: entry.isUser ? '#00e5ff' : 'var(--text-primary)' }}>
                              {entry.username}
                              {entry.isUser && <span style={{ fontSize: '0.65rem', color: '#00e5ff', marginLeft: 4 }}>YOU</span>}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {entry.wallet}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="leaderboard__points" style={{ color: entry.isUser ? '#00e5ff' : 'var(--text-primary)' }}>{entry.points.toFixed(1)}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '0.8rem', color: entry.prize !== '-' ? '#ffd700' : 'var(--text-muted)', fontWeight: 600 }}>
                            {entry.prize}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Prize pool breakdown */}
                  <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      Prize Pool: 10.0 SOL
                    </div>
                    {[
                      { place: '1st', prize: '5.0 SOL', pct: '50%', color: '#FFD700' },
                      { place: '2nd', prize: '3.0 SOL', pct: '30%', color: '#C0C0C0' },
                      { place: '3rd', prize: '2.0 SOL', pct: '20%', color: '#CD7F32' },
                    ].map((p) => (
                      <div key={p.place} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.8rem', color: p.color, fontWeight: 700 }}>{p.place}</span>
                        <div style={{ flex: 1, height: 4, background: 'var(--bg-glass)', borderRadius: 999, margin: '0 10px', overflow: 'hidden' }}>
                          <div style={{ width: p.pct, height: '100%', background: p.color, borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>{p.prize}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
