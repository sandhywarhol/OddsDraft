// ═══════════════════════════════════════════════════════════════════════════
// [GUEST_DEMO] — Configuration file for the guest demo mode (?guest_demo=1)
//
// Search keyword: [GUEST_DEMO]
//   grep -rn "\[GUEST_DEMO\]" src/   ← finds every config point in one shot
//
// HOW THE DEMO WORKS (never touches live code paths):
//   1. URL param ?guest_demo=1 activates guestDemoMode in lineup + live pages
//   2. lineup page  → skips wallet/payment, saves lineup to localStorage only
//   3. live page    → skips ALL TxLINE API calls, injects static lineup below,
//                     runs the event script (ARG_ENG_EVENTS) at 30× speed
//   4. Changing anything in THIS file ONLY affects the demo — live is untouched
//
// ENTRY POINTS (where "Try Demo" buttons link to):
//   src/app/page.tsx           line ~112   [GUEST_DEMO]
//   src/app/contests/page.tsx  line ~382   [GUEST_DEMO]
//   URL: /lineup/special-arg-eng?guest_demo=1&contestType=top3
//
// CONFIGURABLE ITEMS IN THIS FILE:
//   DEMO_ARG_ENG_FIXTURE  — match teams, fixture ID, kickoff time
//   ARG_ENG_EVENTS        — full match event script (goals, cards, subs…)
//   DEMO_ARG_ENG_HOME_LINEUP / AWAY_LINEUP — squad rosters (starters + bench)
// ═══════════════════════════════════════════════════════════════════════════

import type { DemoFixture } from './players';
import type { FormationPlayer } from '@/components/LiveLineupFormation';

// [GUEST_DEMO] Match fixture — change homeTeam/awayTeam/flags to swap the demo match.
// fixtureId must be unique and must NOT match any real WC2026 fixture ID.
// kickoffAt is set 1 hour in the past so the live page shows the score widget
// (not a "KICK OFF IN Xh" countdown). Keep status: 'live'.
export const DEMO_ARG_ENG_FIXTURE: DemoFixture = {
  fixtureId: 'special-arg-eng',
  homeTeam: 'Argentina',
  awayTeam: 'England',
  homeFlag: '🇦🇷',
  awayFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  kickoffAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  status: 'live',
  isNonDemo: true,
};

// [GUEST_DEMO] Match event script — Argentina 2-1 England.
// Edit this array to change what happens during the demo match.
// Events fire in array order, one per ~2 real seconds at 30× speed.
// silent: true  → event fires + awards points but does NOT open the NPC dialog popup.
// silent: false (or omitted) → opens the NPC popup; user must click to dismiss.

export const ARG_ENG_EVENTS: Array<{
  id: string; minute: number; team: string; teamFlag: string;
  player: string; playerId: string; type: string; points: number;
  description: string; goalType?: string; playerOut?: string; silent?: boolean;
}> = [
  // KICK OFF — show referee blowing whistle
  { id: 'ae_e0', minute: 0, team: '', teamFlag: '', player: '', playerId: '', type: 'kick_off', points: 0, silent: false,
    description: 'KICK OFF! Argentina vs England — World Cup 2026 Final! The most anticipated match in football history begins!' },

  // ── Pre-match opening: commentator history of the rivalry ────────────────
  { id: 'ae_hist_arg', minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'starting_xi', points: 0,
    description: '🇦🇷 Argentina — three-time World Champions (1978, 1986, 2022). In 1986, Maradona gave us both the Hand of God AND the Goal of the Century against England in the same match. Now in 2026, it\'s Messi\'s turn to write history. This squad has never lost a knockout match under Scaloni. Tonight, the legend continues — or ends.' },
  { id: 'ae_hist_eng', minute: 0, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Kane', playerId: 'eng-kane', type: 'starting_xi', points: 0,
    description: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England — World Champions just once, in 1966 on home soil. Sixty years of hurt. Every England fan knows 1986, 1998, 2002 — each time Argentina ended their dream. But THIS generation is different. Kane is the all-time England top scorer. Bellingham is the best midfielder in the world. Tonight, England don\'t just want to win — they want revenge.' },

  // ── Starting XI — Argentina XI summary is NON-SILENT (shows dialog); individual events silent ──
  { id: 'ae_xi_arg', minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'starting_xi', points: 2,
    description: '🇦🇷 Argentina XI: E. Martínez · Romero · Molina · Mac Allister · De Paul · N. González · Acuña · L. Martínez · Messi · Lautaro · Álvarez — Scaloni names his strongest eleven for the World Cup Final!' },
  { id: 'ae_xi_ama',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez',  playerId: 'arg-emartinez',   type: 'starting_xi', points: 2, silent: true, description: 'E. Martínez starts in goal for Argentina.' },
  { id: 'ae_xi_rom',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero',        playerId: 'arg-romero',     type: 'starting_xi', points: 2, silent: true, description: 'Romero starts at centre-back for Argentina.' },
  { id: 'ae_xi_mol',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Molina',        playerId: 'arg-molina',     type: 'starting_xi', points: 2, silent: true, description: 'Molina at right-back for Argentina.' },
  { id: 'ae_xi_all',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Mac Allister',  playerId: 'arg-allister',type: 'starting_xi', points: 2, silent: true, description: 'Mac Allister starts in midfield for Argentina.' },
  { id: 'ae_xi_lau',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Lautaro',       playerId: 'arg-lmartinez',    type: 'starting_xi', points: 2, silent: true, description: 'Lautaro starts up front for Argentina.' },
  { id: 'ae_xi_alv',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez',       playerId: 'arg-alvarez',      type: 'starting_xi', points: 2, silent: true, description: 'Álvarez starts alongside Lautaro.' },
  { id: 'ae_xi_lis',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'L. Martínez',   playerId: 'arg-martinez', type: 'starting_xi', points: 2, silent: true, description: 'Lisandro Martínez anchors the centre-back partnership.' },
  { id: 'ae_xi_acu',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Acuña',          playerId: 'arg-acuna',        type: 'starting_xi', points: 2, silent: true, description: 'Acuña starts at left-back for Argentina.' },
  { id: 'ae_xi_dep',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'De Paul',        playerId: 'arg-paul',       type: 'starting_xi', points: 2, silent: true, description: 'De Paul starts in central midfield for Argentina.' },
  { id: 'ae_xi_gon',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'N. González',   playerId: 'arg-gonzalez',     type: 'starting_xi', points: 2, silent: true, description: 'N. González starts on the right flank for Argentina.' },

  // ── Starting XI — England XI summary is NON-SILENT (shows dialog); individual events silent ──
  { id: 'ae_xi_eng', minute: 0, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Kane', playerId: 'eng-kane', type: 'starting_xi', points: 2,
    description: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England XI: Pickford · Walker · Stones · Guehi · Trippier · Rice · Gallagher · Bellingham · Saka · Palmer · Kane — Southgate\'s chosen eleven to lift the World Cup!' },
  { id: 'ae_xi_pic',  minute: 0, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Pickford',   playerId: 'eng-pickford',   type: 'starting_xi', points: 2, silent: true, description: 'Pickford starts in goal for England.' },
  { id: 'ae_xi_sto',  minute: 0, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Stones',     playerId: 'eng-stones',     type: 'starting_xi', points: 2, silent: true, description: 'Stones starts at centre-back for England.' },
  { id: 'ae_xi_wal',  minute: 0, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Walker',     playerId: 'eng-walker',     type: 'starting_xi', points: 2, silent: true, description: 'Walker starts at right-back for England.' },
  { id: 'ae_xi_tri',  minute: 0, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Trippier',   playerId: 'eng-trippier',   type: 'starting_xi', points: 2, silent: true, description: 'Trippier starts at left-back for England.' },
  { id: 'ae_xi_bel',  minute: 0, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Bellingham', playerId: 'eng-bellingham', type: 'starting_xi', points: 2, silent: true, description: 'Bellingham starts in midfield for England.' },
  { id: 'ae_xi_ric',  minute: 0, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Rice',       playerId: 'eng-rice',       type: 'starting_xi', points: 2, silent: true, description: 'Rice starts in defensive midfield for England.' },
  { id: 'ae_xi_sak',  minute: 0, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Saka',       playerId: 'eng-saka',       type: 'starting_xi', points: 2, silent: true, description: 'Saka starts on the right wing for England.' },
  { id: 'ae_xi_gue',  minute: 0, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Guehi',      playerId: 'eng-guehi',      type: 'starting_xi', points: 2, silent: true, description: 'Guehi partners Stones at centre-back for England.' },
  { id: 'ae_xi_gal',  minute: 0, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Gallagher',  playerId: 'eng-gallagher',  type: 'starting_xi', points: 2, silent: true, description: 'Gallagher completes a three-man England midfield.' },
  { id: 'ae_xi_pal',  minute: 0, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Palmer',     playerId: 'eng-palmer',     type: 'starting_xi', points: 2, silent: true, description: 'Palmer starts as England\'s creative outlet in attack.' },

  // ── FIRST HALF ───────────────────────────────────────────────────────────
  // ── FIRST HALF ───────────────────────────────────────────────────────────
  // silent = event appears in feed + awards pts, no NPC popup (keeps match flowing)
  { id: 'ae_d1',        minute: 7,  team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi',        playerId: 'arg-messi',      type: 'danger_attack',   points: 0,  silent: true,
    description: 'Messi drifts inside from the left and plays a one-two with Álvarez! Argentina first to threaten.' },

  { id: 'ae_ck1',       minute: 12, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Trippier',    playerId: 'eng-trippier',   type: 'corner_kick',     points: 0,
    description: 'Trippier 12\' — CORNER · Right-wing delivery into the six-yard box, England\'s first set piece of the game.' },
  { id: 'ae_save1',     minute: 13, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez',  playerId: 'arg-emartinez',   type: 'goalkeeper_save', points: 1,  silent: true,
    description: 'E. Martínez 13\' — SAVE · Punches Trippier\'s corner clear, strong hands under pressure from Kane.' },

  { id: 'ae_asst1',     minute: 22, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Saka',        playerId: 'eng-saka',       type: 'assist',          points: 6,
    description: 'Saka 22\' — ASSIST · Whipped low cross from right wing into the six-yard box, weighted perfectly for Kane\'s run.' },
  { id: 'ae_goal1',     minute: 22, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Kane',        playerId: 'eng-kane',       type: 'goal',            points: 10, goalType: 'Header',
    description: 'Kane 22\' — GOAL · Header from Saka cross · Back post run, met the ball at full stretch · England 1-0 Argentina.' },
  { id: 'ae_conc1_ama', minute: 22, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez',  playerId: 'arg-emartinez',   type: 'goal_conceded',   points: -1, silent: true,
    description: 'E. Martínez had no chance — Kane\'s header was perfectly placed into the bottom corner.' },
  { id: 'ae_conc1_rom', minute: 22, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero',       playerId: 'arg-romero',     type: 'goal_conceded',   points: -1, silent: true,
    description: 'Romero failed to track Kane\'s run — England punish the Argentine defence.' },
  { id: 'ae_var1',      minute: 24, team: '',          teamFlag: '',    player: '',            playerId: '',               type: 'var_review',      points: 0,
    description: '24\' — VAR REVIEW · Checking offside on Kane\'s goal · Check complete: Kane onside · GOAL CONFIRMED · England 1-0.' },

  { id: 'ae_yc1',       minute: 29, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Rice',        playerId: 'eng-rice',       type: 'yellow_card',     points: -2,
    description: 'Rice 29\' — YELLOW CARD · Cynical foul on Mac Allister, late sliding tackle as Argentina built from the back.' },

  { id: 'ae_ck2',       minute: 35, team: 'Argentina', teamFlag: '🇦🇷', player: 'De Paul',      playerId: 'arg-paul',       type: 'corner_kick',     points: 0,
    description: 'De Paul 35\' — CORNER · Right-footed delivery deflected behind by Guehi · Argentina set piece into the box.' },

  { id: 'ae_save2',     minute: 38, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Pickford',    playerId: 'eng-pickford',   type: 'goalkeeper_save', points: 1,  silent: true,
    description: 'PICKFORD! Incredible reflex save from Romero\'s glancing header — world class!' },

  { id: 'ae_poss1_mes', minute: 44, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi',        playerId: 'arg-messi',      type: 'possession_bonus', points: 1, silent: true,
    description: 'Messi dominated possession in the first half — pulling England out of shape with every touch.' },
  { id: 'ae_poss1_mac', minute: 44, team: 'Argentina', teamFlag: '🇦🇷', player: 'Mac Allister', playerId: 'arg-allister',type: 'possession_bonus', points: 1, silent: true,
    description: 'Mac Allister ran the midfield — dictating rhythm and breaking England\'s press consistently.' },

  { id: 'ae_ht', minute: 45, team: '', teamFlag: '', player: '', playerId: '', type: 'half_time', points: 0,
    description: 'HALF TIME · England 1-0 Argentina · Shots: ENG 4 (4 on target) ARG 6 (2 on target) · Possession: ENG 58% ARG 42% · Corners: ENG 1 ARG 1 · Yellow cards: Rice (ENG).' },
  { id: 'ae_ht_comm', minute: 45, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'starting_xi', points: 0,
    description: 'Half-Time Statistics: England 58% possession · 4 shots on target (Kane, Saka ×2, Bellingham). Argentina 42% possession · 6 total attempts · Messi 3 key passes. The xG says Argentina have been unlucky — expect a very different second half!' },

  // ── SECOND HALF ──────────────────────────────────────────────────────────
  { id: 'ae_ko2', minute: 46, team: '', teamFlag: '', player: '', playerId: '', type: 'kick_off', points: 0,
    description: 'KICK OFF! Second half underway — Argentina need a response. Messi and Lautaro lead the charge!' },
  { id: 'ae_ko2_comm', minute: 46, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'starting_xi', points: 0,
    description: 'Argentina are FLYING out of the blocks! Scaloni has clearly given them one instruction at half time: ATTACK. Messi is dropping deep to collect the ball, Lautaro pressing the England backline — this second half is going to be something special!' },

  { id: 'ae_d5',        minute: 51, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Bellingham',  playerId: 'eng-bellingham', type: 'danger_attack',   points: 0,  silent: true,
    description: 'England pressing high — Bellingham breaks forward and forces a corner off Romero!' },
  { id: 'ae_ck3',       minute: 52, team: 'Argentina', teamFlag: '🇦🇷', player: 'Acuña',       playerId: 'arg-acuna',      type: 'corner_kick',     points: 0,
    description: 'Acuña 52\' — CORNER · Left-foot delivery into the six-yard box, Lautaro attacks the near post.' },
  { id: 'ae_save3',     minute: 53, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Pickford',    playerId: 'eng-pickford',   type: 'goalkeeper_save', points: 1,  silent: true,
    description: 'Pickford 53\' — SAVE · Claws Lautaro\'s flicked header off the line at full stretch.' },

  { id: 'ae_rc1',       minute: 57, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero',       playerId: 'arg-romero',     type: 'red_card',        points: -4,
    description: 'Romero 57\' — RED CARD · Reckless two-footed lunge on Bellingham as he broke into the penalty area · Argentina reduced to 10 men.' },

  { id: 'ae_asst2',     minute: 60, team: 'Argentina', teamFlag: '🇦🇷', player: 'Mac Allister', playerId: 'arg-allister',type: 'assist',          points: 6,
    description: 'Mac Allister 60\' — ASSIST · Disguised through ball, splits England\'s back four, Messi clean through on goal.' },
  { id: 'ae_goal2',     minute: 60, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi',        playerId: 'arg-messi',      type: 'goal',            points: 11, goalType: 'Shot',
    description: 'Messi 60\' — GOAL · Curling left-foot shot into the top corner from 20 yards · Pickford got fingertips to it · Argentina 1-1 England.' },
  { id: 'ae_conc2_pic', minute: 60, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Pickford',    playerId: 'eng-pickford',   type: 'goal_conceded',   points: -1, silent: true,
    description: 'Pickford got a fingertip to Messi\'s curler but couldn\'t keep it out.' },
  { id: 'ae_conc2_sto', minute: 60, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Stones',      playerId: 'eng-stones',     type: 'goal_conceded',   points: -1, silent: true,
    description: 'Stones caught flat-footed by Mac Allister\'s pass — Messi needs no second invitation.' },
  { id: 'ae_var2',      minute: 62, team: '',          teamFlag: '',    player: '',            playerId: '',               type: 'var_review',      points: 0,
    description: '62\' — VAR REVIEW · Checking foul in build-up to Messi\'s goal · Check complete: No foul found · GOAL CONFIRMED · Argentina 1-1.' },

  { id: 'ae_sub1',      minute: 65, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Rashford',    playerId: 'eng-rashford',   type: 'substitution',    points: 0,  playerOut: 'Saka',
    description: '65\' — SUBSTITUTION · Saka OFF → Rashford ON · England bring fresh pace on the left flank.' },
  { id: 'ae_app1',      minute: 65, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Rashford',    playerId: 'eng-rashford',   type: 'sub_appearance',  points: 1,  silent: true,
    description: 'Marcus Rashford enters at the biggest moment of his career.' },

  { id: 'ae_pw1',       minute: 66, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi',        playerId: 'arg-messi',      type: 'penalty_won',     points: 8,
    description: 'Messi 66\' — PENALTY WON · Walker trips Messi inside the penalty area · Clear foul, referee points to the spot.' },
  { id: 'ae_pc1',       minute: 66, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Walker',      playerId: 'eng-walker',     type: 'penalty_conceded', points: -3, silent: true,
    description: 'Walker 66\' — PENALTY CONCEDED · Clips Messi\'s heels inside the box · Unavoidable decision.' },
  { id: 'ae_pm1',       minute: 67, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez',      playerId: 'arg-alvarez',    type: 'penalty_missed',  points: -3,
    description: 'Álvarez 67\' — PENALTY MISSED · Shot blazed over the crossbar · Huge miss for Argentina with the lead there to take.' },

  { id: 'ae_asst3',     minute: 72, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi',        playerId: 'arg-messi',      type: 'assist',          points: 6,
    description: 'Messi 72\' — ASSIST · Lofted chip over the England defensive line, perfectly weighted for Lautaro\'s run in behind.' },
  { id: 'ae_goal3',     minute: 73, team: 'Argentina', teamFlag: '🇦🇷', player: 'Lautaro',      playerId: 'arg-lmartinez',    type: 'goal',            points: 10, goalType: 'Shot',
    description: 'Lautaro 73\' — GOAL · First-time volley into the roof of the net from Messi\'s chip · Argentina 2-1 England.' },
  { id: 'ae_conc3_pic', minute: 73, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Pickford',    playerId: 'eng-pickford',   type: 'goal_conceded',   points: -1, silent: true,
    description: 'Pickford had no chance — Lautaro\'s volley was absolute perfection.' },
  { id: 'ae_conc3_sto', minute: 73, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Stones',      playerId: 'eng-stones',     type: 'goal_conceded',   points: -1, silent: true,
    description: 'Stones caught under Messi\'s chip — Lautaro\'s composure finishing was extraordinary.' },

  { id: 'ae_sub2',      minute: 75, team: 'Argentina', teamFlag: '🇦🇷', player: 'Di María',     playerId: 'arg-dimaria',    type: 'substitution',    points: 0,  playerOut: 'Álvarez',
    description: '75\' — SUBSTITUTION · Álvarez OFF → Di María ON · Argentina\'s veteran winger introduced to hold the lead.' },
  { id: 'ae_app2',      minute: 75, team: 'Argentina', teamFlag: '🇦🇷', player: 'Di María',     playerId: 'arg-dimaria',    type: 'sub_appearance',  points: 1,  silent: true,
    description: 'Ángel Di María enters — a World Cup winner\'s experience to help Argentina see this out.' },

  { id: 'ae_sub3',      minute: 78, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Foden',       playerId: 'eng-foden',      type: 'substitution',    points: 0,  playerOut: 'Rice',
    description: '78\' — SUBSTITUTION · Rice OFF → Foden ON · England abandon defensive shape, all-out attack for the equaliser.' },
  { id: 'ae_app3',      minute: 78, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Foden',       playerId: 'eng-foden',      type: 'sub_appearance',  points: 1,  silent: true,
    description: 'Phil Foden enters — England\'s most creative player now free to attack with abandon.' },

  { id: 'ae_ck4',       minute: 80, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Trippier',    playerId: 'eng-trippier',   type: 'corner_kick',     points: 0,
    description: 'Trippier 80\' — CORNER · Inswinging right-footed delivery, Kane attacks near post, England desperate for the equaliser.' },
  { id: 'ae_save4',     minute: 82, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez',  playerId: 'arg-emartinez',   type: 'goalkeeper_save', points: 1,  silent: true,
    description: 'E. MARTÍNEZ! Spreads himself brilliantly to deny Bellingham a one-on-one — Argentina survive!' },

  { id: 'ae_poss2_mes', minute: 88, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi',        playerId: 'arg-messi',      type: 'possession_bonus', points: 1, silent: true,
    description: 'Messi controlled this game from start to finish — a goal, two assists, and pure magic.' },
  { id: 'ae_poss2_bel', minute: 88, team: 'England',   teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Bellingham',  playerId: 'eng-bellingham', type: 'possession_bonus', points: 1, silent: true,
    description: 'Bellingham gave everything in a losing cause — a performance of immense quality and heart.' },

  { id: 'ae_ft', minute: 90, team: '', teamFlag: '', player: '', playerId: '', type: 'full_time', points: 0,
    description: 'FULL TIME · Argentina 2-1 England · Goals: Kane 22\' (ENG), Messi 60\' (ARG), Lautaro 73\' (ARG) · Shots: ARG 12 ENG 9 · Possession: ARG 54% ENG 46% · Red card: Romero 57\' (ARG) · World Cup 2026 Champions: Argentina 🇦🇷' },
];

// [GUEST_DEMO] Static squad rosters — injected by bootstrap() when guestDemoMode is true,
// bypassing TxLINE entirely. starter: true = starting XI; starter: false = bench panel.
// Add/remove players here to change what appears in the Team Lineups section.

export const DEMO_ARG_ENG_HOME_LINEUP: FormationPlayer[] = [
  // Starters — Argentina 4-3-3
  { id: 'arg-emartinez',          name: 'E. Martínez',  position: 'GK',  participant: 1, jerseyNumber: 23, starter: true },
  { id: 'arg-molina',            name: 'Molina',        position: 'DEF', participant: 1, jerseyNumber: 26, starter: true },
  { id: 'arg-romero',            name: 'Romero',        position: 'DEF', participant: 1, jerseyNumber: 13, starter: true },
  { id: 'arg-martinez',  name: 'L. Martínez',  position: 'DEF', participant: 1, jerseyNumber: 25, starter: true },
  { id: 'arg-acuna',             name: 'Acuña',         position: 'DEF', participant: 1, jerseyNumber: 8,  starter: true },
  { id: 'arg-paul',            name: 'De Paul',       position: 'MID', participant: 1, jerseyNumber: 7,  starter: true },
  { id: 'arg-allister',       name: 'Mac Allister', position: 'MID', participant: 1, jerseyNumber: 20, starter: true },
  { id: 'arg-messi',             name: 'Messi',         position: 'MID', participant: 1, jerseyNumber: 10, starter: true },
  { id: 'arg-gonzalez',          name: 'N. González',  position: 'ATT', participant: 1, jerseyNumber: 11, starter: true },
  { id: 'arg-lmartinez',           name: 'Lautaro',       position: 'ATT', participant: 1, jerseyNumber: 22, starter: true },
  { id: 'arg-alvarez',           name: 'Álvarez',       position: 'ATT', participant: 1, jerseyNumber: 9,  starter: true },
  // Bench — full 17-player bench as per screenshot
  { id: 'arg-dimaria',      name: 'Di María',              position: 'ATT', participant: 1, jerseyNumber: 11, starter: false },
  { id: 'arg-dybala',       name: 'Dybala',                position: 'ATT', participant: 1, jerseyNumber: 21, starter: false },
  { id: 'arg-otamendi',     name: 'N. Otamendi',           position: 'DEF', participant: 1, jerseyNumber: 19, starter: false },
  { id: 'arg-rulli',        name: 'G. Rulli',              position: 'GK',  participant: 1, jerseyNumber: 12, starter: false },
  { id: 'arg-medina',       name: 'F. Medina',             position: 'DEF', participant: 1, jerseyNumber: 16, starter: false },
  { id: 'arg-fernandez',         name: 'E. Fernández',          position: 'MID', participant: 1, jerseyNumber: 24, starter: false },
  { id: 'arg-celso',      name: 'G. Lo Celso',           position: 'MID', participant: 1, jerseyNumber: 18, starter: false },
  { id: 'arg-almada',       name: 'T. Almada',             position: 'MID', participant: 1, jerseyNumber: 17, starter: false },
  { id: 'arg-barco',        name: 'V. Barco',              position: 'DEF', participant: 1, jerseyNumber: 14, starter: false },
  { id: 'arg-simeone',      name: 'G. Simeone',            position: 'ATT', participant: 1, jerseyNumber: 15, starter: false },
  { id: 'arg-montiel',      name: 'G. Montiel',            position: 'DEF', participant: 1, jerseyNumber: 4,  starter: false },
  { id: 'arg-palacios',     name: 'E. Palacios',           position: 'MID', participant: 1, jerseyNumber: 5,  starter: false },
  { id: 'arg-talavera',     name: 'D. Talavera',           position: 'GK',  participant: 1, jerseyNumber: 22, starter: false },
  { id: 'arg-balerdi',      name: 'L. Balerdi',            position: 'DEF', participant: 1, jerseyNumber: 2,  starter: false },
  { id: 'arg-ngonzalez',    name: 'N. González',           position: 'ATT', participant: 1, jerseyNumber: 11, starter: false },
  { id: 'arg-jlopez',       name: 'J. López',              position: 'MID', participant: 1, jerseyNumber: 8,  starter: false },
  { id: 'arg-senesi',       name: 'M. Senesi',             position: 'DEF', participant: 1, jerseyNumber: 3,  starter: false },
  { id: 'arg-pazm',         name: 'N. Paz Martínez',       position: 'MID', participant: 1, jerseyNumber: 20, starter: false },
  { id: 'arg-musso',        name: 'J. Musso',              position: 'GK',  participant: 1, jerseyNumber: 1,  starter: false },
];

export const DEMO_ARG_ENG_AWAY_LINEUP: FormationPlayer[] = [
  // Starters — England 4-3-3
  { id: 'eng-pickford',    name: 'Pickford',   position: 'GK',  participant: 2, jerseyNumber: 1,  starter: true },
  { id: 'eng-walker',      name: 'Walker',     position: 'DEF', participant: 2, jerseyNumber: 2,  starter: true },
  { id: 'eng-stones',      name: 'Stones',     position: 'DEF', participant: 2, jerseyNumber: 5,  starter: true },
  { id: 'eng-guehi',       name: 'Guehi',      position: 'DEF', participant: 2, jerseyNumber: 6,  starter: true },
  { id: 'eng-trippier',    name: 'Trippier',   position: 'DEF', participant: 2, jerseyNumber: 12, starter: true },
  { id: 'eng-rice',        name: 'Rice',        position: 'MID', participant: 2, jerseyNumber: 4,  starter: true },
  { id: 'eng-bellingham',  name: 'Bellingham', position: 'MID', participant: 2, jerseyNumber: 10, starter: true },
  { id: 'eng-gallagher',   name: 'Gallagher',  position: 'MID', participant: 2, jerseyNumber: 8,  starter: true },
  { id: 'eng-saka',        name: 'Saka',        position: 'ATT', participant: 2, jerseyNumber: 7,  starter: true },
  { id: 'eng-kane',        name: 'Kane',        position: 'ATT', participant: 2, jerseyNumber: 9,  starter: true },
  { id: 'eng-palmer',      name: 'Palmer',      position: 'ATT', participant: 2, jerseyNumber: 14, starter: true },
  // Bench — full 17-player bench as per screenshot
  { id: 'eng-rashford',    name: 'M. Rashford',        position: 'ATT', participant: 2, jerseyNumber: 11, starter: false },
  { id: 'eng-foden',       name: 'P. Foden',           position: 'ATT', participant: 2, jerseyNumber: 20, starter: false },
  { id: 'eng-maguire',     name: 'H. Maguire',         position: 'DEF', participant: 2, jerseyNumber: 6,  starter: false },
  { id: 'eng-ramsdale',    name: 'A. Ramsdale',        position: 'GK',  participant: 2, jerseyNumber: 13, starter: false },
  { id: 'eng-mainoo',      name: 'K. Mainoo',          position: 'MID', participant: 2, jerseyNumber: 26, starter: false },
  { id: 'eng-white',       name: 'B. White',           position: 'DEF', participant: 2, jerseyNumber: 2,  starter: false },
  { id: 'eng-gordon',      name: 'A. Gordon',          position: 'ATT', participant: 2, jerseyNumber: 22, starter: false },
  { id: 'eng-toney',       name: 'I. Toney',           position: 'ATT', participant: 2, jerseyNumber: 18, starter: false },
  { id: 'eng-eze',         name: 'E. Eze',             position: 'MID', participant: 2, jerseyNumber: 17, starter: false },
  { id: 'eng-henderson',   name: 'J. Henderson',       position: 'MID', participant: 2, jerseyNumber: 8,  starter: false },
  { id: 'eng-watkins',     name: 'O. Watkins',         position: 'ATT', participant: 2, jerseyNumber: 9,  starter: false },
  { id: 'eng-chalobah',    name: 'T. Chalobah',        position: 'DEF', participant: 2, jerseyNumber: 16, starter: false },
  { id: 'eng-trafford',    name: 'J. Trafford',        position: 'GK',  participant: 2, jerseyNumber: 22, starter: false },
  { id: 'eng-burn',        name: 'D. Burn',            position: 'DEF', participant: 2, jerseyNumber: 5,  starter: false },
  { id: 'eng-dhenderson',  name: 'D. Henderson',       position: 'GK',  participant: 2, jerseyNumber: 1,  starter: false },
  { id: 'eng-rjames',      name: 'R. James',           position: 'DEF', participant: 2, jerseyNumber: 12, starter: false },
  { id: 'eng-quansah',     name: 'J. Quansah',         position: 'DEF', participant: 2, jerseyNumber: 4,  starter: false },
  { id: 'eng-rogers',      name: 'M. Rogers',          position: 'MID', participant: 2, jerseyNumber: 15, starter: false },
  { id: 'eng-spence',      name: 'D. Spence',          position: 'DEF', participant: 2, jerseyNumber: 23, starter: false },
];
