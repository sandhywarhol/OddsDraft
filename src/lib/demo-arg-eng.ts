// ── Guest Demo: Argentina vs England ────────────────────────────────────────
// All demo-specific data lives here. Never import this into live-match paths.
// Used exclusively when ?guest_demo=1 is present in the URL.

import type { DemoFixture } from './players';
import type { FormationPlayer } from '@/components/LiveLineupFormation';

// kickoffAt set 1 hour in the past so the live page shows a live score widget,
// not a "KICK OFF IN Xh" countdown.
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

// ── Event script: Argentina 2-1 England ─────────────────────────────────────
// Starting XI uses 1 summary dialog per team + silent awards for the rest,
// so hackathon judges only click through 2 dialogs instead of 15.
// `silent: true` = event fires and awards points but does NOT open the NPC popup.

export const ARG_ENG_EVENTS: Array<{
  id: string; minute: number; team: string; teamFlag: string;
  player: string; playerId: string; type: string; points: number;
  description: string; goalType?: string; playerOut?: string; silent?: boolean;
}> = [
  // KICK OFF — silent so match auto-flows without requiring a click
  { id: 'ae_e0', minute: 0, team: '', teamFlag: '', player: '', playerId: '', type: 'kick_off', points: 0, silent: true,
    description: 'KICK OFF! Argentina vs England — World Cup 2026 Final! The most anticipated match in football history begins!' },

  // ── Starting XI — Argentina — all silent so match flows immediately ──────
  { id: 'ae_xi_arg', minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'starting_xi', points: 2, silent: true,
    description: '🇦🇷 Argentina XI: E. Martínez · Romero · Molina · Mac Allister · Messi · Lautaro · Álvarez — Scaloni names his strongest eleven!' },
  { id: 'ae_xi_ama',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez',  playerId: 'arg-martinez',   type: 'starting_xi', points: 2, silent: true, description: 'E. Martínez starts in goal for Argentina.' },
  { id: 'ae_xi_rom',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero',        playerId: 'arg-romero',     type: 'starting_xi', points: 2, silent: true, description: 'Romero starts at centre-back for Argentina.' },
  { id: 'ae_xi_mol',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Molina',        playerId: 'arg-molina',     type: 'starting_xi', points: 2, silent: true, description: 'Molina at right-back for Argentina.' },
  { id: 'ae_xi_all',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Mac Allister',  playerId: 'arg-macallister',type: 'starting_xi', points: 2, silent: true, description: 'Mac Allister starts in midfield for Argentina.' },
  { id: 'ae_xi_lau',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Lautaro',       playerId: 'arg-lautaro',    type: 'starting_xi', points: 2, silent: true, description: 'Lautaro starts up front for Argentina.' },
  { id: 'ae_xi_alv',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez',       playerId: 'arg-alvarez',      type: 'starting_xi', points: 2, silent: true, description: 'Álvarez starts alongside Lautaro.' },
  { id: 'ae_xi_lis',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'L. Martínez',   playerId: 'arg-lisandromartinez', type: 'starting_xi', points: 2, silent: true, description: 'Lisandro Martínez anchors the centre-back partnership.' },
  { id: 'ae_xi_acu',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'Acuña',          playerId: 'arg-acuna',        type: 'starting_xi', points: 2, silent: true, description: 'Acuña starts at left-back for Argentina.' },
  { id: 'ae_xi_dep',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'De Paul',        playerId: 'arg-depaul',       type: 'starting_xi', points: 2, silent: true, description: 'De Paul starts in central midfield for Argentina.' },
  { id: 'ae_xi_gon',  minute: 0, team: 'Argentina', teamFlag: '🇦🇷', player: 'N. González',   playerId: 'arg-gonzalez',     type: 'starting_xi', points: 2, silent: true, description: 'N. González starts on the right flank for Argentina.' },

  // ── Starting XI — England — all silent ──────────────────────────────────
  { id: 'ae_xi_eng', minute: 0, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Kane', playerId: 'eng-kane', type: 'starting_xi', points: 2, silent: true,
    description: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England XI: Pickford · Stones · Walker · Trippier · Rice · Bellingham · Saka · Kane — Southgate\'s final team!' },
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
  { id: 'ae_d1', minute: 7, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'danger_attack', points: 0,
    description: 'Messi drifts inside from the left and plays a one-two with Álvarez! Argentina first to threaten.' },

  { id: 'ae_ck1', minute: 12, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Trippier', playerId: 'eng-trippier', type: 'corner_kick', points: 0,
    description: 'CORNER! Trippier wins England their first corner — curling delivery coming in towards Kane!' },
  { id: 'ae_save1', minute: 12, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goalkeeper_save', points: 1,
    description: 'E. Martínez punches the corner clear! Strong from the Argentine goalkeeper under pressure.' },

  { id: 'ae_d2', minute: 18, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Kane', playerId: 'eng-kane', type: 'danger_attack', points: 0,
    description: 'Kane drops deep, turns sharply and finds Bellingham charging into the box!' },

  { id: 'ae_asst1', minute: 22, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Saka', playerId: 'eng-saka', type: 'assist', points: 6,
    description: 'Saka cuts inside onto his left foot and whips a perfect ball across the six-yard box for Kane!' },
  { id: 'ae_goal1', minute: 22, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Kane', playerId: 'eng-kane', type: 'goal', points: 10, goalType: 'Header',
    description: 'GOAL! KANE! A towering header at the back post — England lead in the World Cup Final!' },
  { id: 'ae_conc1_ama', minute: 22, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goal_conceded', points: -1,
    description: 'E. Martínez had no chance — Kane\'s header was perfectly placed into the bottom corner.' },
  { id: 'ae_conc1_rom', minute: 22, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero', playerId: 'arg-romero', type: 'goal_conceded', points: -1,
    description: 'Romero failed to track Kane\'s run to the back post — England punish the Argentine defence.' },

  { id: 'ae_var1', minute: 24, team: '', teamFlag: '', player: '', playerId: '', type: 'var_review', points: 0,
    description: 'VAR checks Kane\'s goal for offside... The line confirms Kane was onside. The goal stands!' },

  { id: 'ae_yc1', minute: 29, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Rice', playerId: 'eng-rice', type: 'yellow_card', points: -2,
    description: 'Yellow card for Rice — clips Mac Allister late as Argentina tried to build through midfield.' },

  { id: 'ae_d3', minute: 33, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez', playerId: 'arg-alvarez', type: 'danger_attack', points: 0,
    description: 'ARGENTINA PRESSING! Álvarez bursting into the box — England under severe pressure!' },

  { id: 'ae_ck2', minute: 35, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'corner_kick', points: 0,
    description: 'Corner for Argentina! Messi to take — the whole stadium holds its breath.' },
  { id: 'ae_save2', minute: 36, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Pickford', playerId: 'eng-pickford', type: 'goalkeeper_save', points: 1,
    description: 'PICKFORD! Incredible reflex save from Romero\'s glancing header off the corner — world class!' },

  { id: 'ae_d4', minute: 41, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'danger_attack', points: 0,
    description: 'Messi receives on the edge of the box and curls just wide of the far post — so close!' },

  { id: 'ae_poss1_mes', minute: 44, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'possession_bonus', points: 1,
    description: 'Messi dominated possession in the first half — pulling England out of shape with every touch.' },
  { id: 'ae_poss1_bel', minute: 44, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Bellingham', playerId: 'eng-bellingham', type: 'possession_bonus', points: 1,
    description: 'Bellingham covered immense ground — winning headers, driving forward, a box-to-box masterclass.' },

  { id: 'ae_ht', minute: 45, team: '', teamFlag: '', player: '', playerId: '', type: 'half_time', points: 0,
    description: 'HALF TIME! England 1–0 Argentina — Kane\'s header gives England the lead. Can Argentina respond?' },

  // ── SECOND HALF ──────────────────────────────────────────────────────────
  { id: 'ae_ko2', minute: 46, team: '', teamFlag: '', player: '', playerId: '', type: 'kick_off', points: 0,
    description: 'Second half underway! Argentina need a response — Messi and Lautaro leading the charge!' },

  { id: 'ae_d5', minute: 50, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Bellingham', playerId: 'eng-bellingham', type: 'danger_attack', points: 0,
    description: 'England pressing high — Bellingham breaks forward and forces a corner off Romero!' },

  { id: 'ae_ck3', minute: 54, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'corner_kick', points: 0,
    description: 'Corner for Argentina! Messi circles the flag — dangerous delivery coming in!' },
  { id: 'ae_save3', minute: 54, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Pickford', playerId: 'eng-pickford', type: 'goalkeeper_save', points: 1,
    description: 'Pickford claws Lautaro\'s flicked header off the line! Unbelievable from the England keeper!' },

  { id: 'ae_yc2', minute: 57, team: 'Argentina', teamFlag: '🇦🇷', player: 'Romero', playerId: 'arg-romero', type: 'yellow_card', points: -2,
    description: 'Yellow card for Romero — frustration boiling over as Argentina struggle to break England down.' },

  { id: 'ae_asst2', minute: 60, team: 'Argentina', teamFlag: '🇦🇷', player: 'Mac Allister', playerId: 'arg-macallister', type: 'assist', points: 6,
    description: 'Mac Allister plays Messi in behind the England line with a disguised through ball — perfect weight!' },
  { id: 'ae_goal2', minute: 60, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'goal', points: 11, goalType: 'Shot',
    description: 'GOOOOAL! MESSI! A curling left-footed finish into the far corner — Pickford had no chance! 1–1!' },
  { id: 'ae_conc2_pic', minute: 60, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Pickford', playerId: 'eng-pickford', type: 'goal_conceded', points: -1,
    description: 'Pickford got a fingertip to Messi\'s curler but couldn\'t keep it out — unstoppable finish.' },
  { id: 'ae_conc2_sto', minute: 60, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Stones', playerId: 'eng-stones', type: 'goal_conceded', points: -1,
    description: 'Stones caught flat-footed by Mac Allister\'s pass — Messi needs no second invitation.' },

  { id: 'ae_var2', minute: 62, team: '', teamFlag: '', player: '', playerId: '', type: 'var_review', points: 0,
    description: 'VAR checks Messi\'s goal for a foul in the build-up... After a long review, the goal stands!' },

  { id: 'ae_sub1', minute: 65, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Rashford', playerId: 'eng-rashford', type: 'substitution', points: 0, playerOut: 'Saka',
    description: 'Substitution: Rashford on for Saka — England looking for fresh pace to stretch Argentina.' },
  { id: 'ae_app1', minute: 65, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Rashford', playerId: 'eng-rashford', type: 'sub_appearance', points: 1,
    description: 'Marcus Rashford enters at the biggest moment of his career — can he be England\'s match-winner?' },

  { id: 'ae_pw1', minute: 66, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'penalty_won', points: 8,
    description: 'Messi is tripped in the box by Walker! Stonewall penalty — the referee points to the spot!' },
  { id: 'ae_pc1', minute: 66, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Walker', playerId: 'eng-walker', type: 'penalty_conceded', points: -3,
    description: 'Walker clips Messi\'s heels — reckless challenge and a clear penalty. England in danger!' },
  { id: 'ae_pm1', minute: 67, team: 'Argentina', teamFlag: '🇦🇷', player: 'Álvarez', playerId: 'arg-alvarez', type: 'penalty_missed', points: -3,
    description: 'ÁLVAREZ BLAZES THE PENALTY OVER THE BAR! Unbelievable miss — Argentina fail to take the lead!' },

  { id: 'ae_d6', minute: 70, team: 'Argentina', teamFlag: '🇦🇷', player: 'Lautaro', playerId: 'arg-lautaro', type: 'danger_attack', points: 0,
    description: 'Argentina keep coming! Lautaro brushes off Stones and drives into the penalty area!' },

  { id: 'ae_asst3', minute: 72, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'assist', points: 6,
    description: 'Messi floats a delicate chip over the England defensive line — perfectly weighted for Lautaro!' },
  { id: 'ae_goal3', minute: 73, team: 'Argentina', teamFlag: '🇦🇷', player: 'Lautaro', playerId: 'arg-lautaro', type: 'goal', points: 10, goalType: 'Shot',
    description: 'GOAL! LAUTARO! A first-time volley into the roof of the net — ARGENTINA LEAD 2–1!' },
  { id: 'ae_conc3_pic', minute: 73, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Pickford', playerId: 'eng-pickford', type: 'goal_conceded', points: -1,
    description: 'Pickford had no chance — Lautaro\'s volley was absolute perfection. England trail.' },
  { id: 'ae_conc3_sto', minute: 73, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Stones', playerId: 'eng-stones', type: 'goal_conceded', points: -1,
    description: 'Stones caught under Messi\'s chip — Lautaro\'s composure finishing was extraordinary.' },

  { id: 'ae_sub2', minute: 75, team: 'Argentina', teamFlag: '🇦🇷', player: 'Di María', playerId: 'arg-dimaria', type: 'substitution', points: 0, playerOut: 'Álvarez',
    description: 'Substitution: Di María on for Álvarez — the veteran winger entering to help protect Argentina\'s lead.' },
  { id: 'ae_app2', minute: 75, team: 'Argentina', teamFlag: '🇦🇷', player: 'Di María', playerId: 'arg-dimaria', type: 'sub_appearance', points: 1,
    description: 'Ángel Di María enters — a World Cup winner\'s experience to help Argentina see this out.' },

  { id: 'ae_sub3', minute: 78, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Foden', playerId: 'eng-foden', type: 'substitution', points: 0, playerOut: 'Rice',
    description: 'Substitution: Foden on for Rice — England throw caution to the wind in search of the equaliser.' },
  { id: 'ae_app3', minute: 78, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Foden', playerId: 'eng-foden', type: 'sub_appearance', points: 1,
    description: 'Phil Foden enters — England\'s most creative player now free to attack with abandon.' },

  { id: 'ae_d7', minute: 81, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Bellingham', playerId: 'eng-bellingham', type: 'danger_attack', points: 0,
    description: 'England throwing everything forward! Bellingham surges through and tests E. Martínez!' },
  { id: 'ae_save4', minute: 81, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goalkeeper_save', points: 1,
    description: 'E. MARTÍNEZ! Spreads himself brilliantly to deny Bellingham a one-on-one — Argentina survive!' },

  { id: 'ae_ck4', minute: 85, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Trippier', playerId: 'eng-trippier', type: 'corner_kick', points: 0,
    description: 'Corner for England! Last throw of the dice — Trippier to deliver, Kane waiting at the back post!' },
  { id: 'ae_save5', minute: 85, team: 'Argentina', teamFlag: '🇦🇷', player: 'E. Martínez', playerId: 'arg-martinez', type: 'goalkeeper_save', points: 1,
    description: 'E. Martínez punches clear with two fists — commanding in the box when England needed the most!' },

  { id: 'ae_d8', minute: 87, team: 'Argentina', teamFlag: '🇦🇷', player: 'Di María', playerId: 'arg-dimaria', type: 'danger_attack', points: 0,
    description: 'Di María breaking on the counter! Argentina stretching England on their desperate push forward.' },

  { id: 'ae_poss2_mes', minute: 88, team: 'Argentina', teamFlag: '🇦🇷', player: 'Messi', playerId: 'arg-messi', type: 'possession_bonus', points: 1,
    description: 'Messi controlled this game from start to finish — a goal, two assists, and pure magic throughout.' },
  { id: 'ae_poss2_bel', minute: 88, team: 'England', teamFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', player: 'Bellingham', playerId: 'eng-bellingham', type: 'possession_bonus', points: 1,
    description: 'Bellingham gave everything in a losing cause — a performance of immense quality and heart.' },

  { id: 'ae_ft', minute: 90, team: '', teamFlag: '', player: '', playerId: '', type: 'full_time', points: 0,
    description: 'FULL TIME! Argentina 2–1 England! MESSI LIFTS THE WORLD CUP AGAIN! La Albiceleste are World Champions!' },
];

// Fake demo prize shown in SOL claim overlay after full time
export const DEMO_PRIZE_SOL = 2.5;

// ── Static team lineups injected into realLineup for guest demo ───────────
// Injected by bootstrap() when guestDemoMode is true, bypassing TxLINE API.
// Bench players (starter: false) appear in the SUBSTITUTES panel.

export const DEMO_ARG_ENG_HOME_LINEUP: FormationPlayer[] = [
  // Starters — Argentina 4-3-3
  { id: 'arg-martinez',          name: 'E. Martínez',  position: 'GK',  participant: 1, jerseyNumber: 23, starter: true },
  { id: 'arg-molina',            name: 'Molina',        position: 'DEF', participant: 1, jerseyNumber: 26, starter: true },
  { id: 'arg-romero',            name: 'Romero',        position: 'DEF', participant: 1, jerseyNumber: 13, starter: true },
  { id: 'arg-lisandromartinez',  name: 'L. Martínez',  position: 'DEF', participant: 1, jerseyNumber: 25, starter: true },
  { id: 'arg-acuna',             name: 'Acuña',         position: 'DEF', participant: 1, jerseyNumber: 8,  starter: true },
  { id: 'arg-depaul',            name: 'De Paul',       position: 'MID', participant: 1, jerseyNumber: 7,  starter: true },
  { id: 'arg-macallister',       name: 'Mac Allister', position: 'MID', participant: 1, jerseyNumber: 20, starter: true },
  { id: 'arg-messi',             name: 'Messi',         position: 'MID', participant: 1, jerseyNumber: 10, starter: true },
  { id: 'arg-gonzalez',          name: 'N. González',  position: 'ATT', participant: 1, jerseyNumber: 11, starter: true },
  { id: 'arg-lautaro',           name: 'Lautaro',       position: 'ATT', participant: 1, jerseyNumber: 22, starter: true },
  { id: 'arg-alvarez',           name: 'Álvarez',       position: 'ATT', participant: 1, jerseyNumber: 9,  starter: true },
  // Bench (7 players → 2 rows in the subs panel)
  { id: 'arg-dimaria',      name: 'Di María',      position: 'ATT', participant: 1, jerseyNumber: 11, starter: false },
  { id: 'arg-dybala',       name: 'Dybala',        position: 'ATT', participant: 1, jerseyNumber: 21, starter: false },
  { id: 'arg-otamendi',     name: 'Otamendi',      position: 'DEF', participant: 1, jerseyNumber: 19, starter: false },
  { id: 'arg-rulli',        name: 'Rulli',          position: 'GK',  participant: 1, jerseyNumber: 12, starter: false },
  { id: 'arg-medina',       name: 'Medina',         position: 'MID', participant: 1, jerseyNumber: 16, starter: false },
  { id: 'arg-enzo',         name: 'E. Fernández',   position: 'MID', participant: 1, jerseyNumber: 24, starter: false },
  { id: 'arg-locelso',      name: 'Lo Celso',       position: 'MID', participant: 1, jerseyNumber: 18, starter: false },
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
  // Bench (7 players → 2 rows in the subs panel)
  { id: 'eng-rashford',    name: 'Rashford',          position: 'ATT', participant: 2, jerseyNumber: 11, starter: false },
  { id: 'eng-foden',       name: 'Foden',             position: 'ATT', participant: 2, jerseyNumber: 20, starter: false },
  { id: 'eng-maguire',     name: 'Maguire',           position: 'DEF', participant: 2, jerseyNumber: 6,  starter: false },
  { id: 'eng-ramsdale',    name: 'Ramsdale',          position: 'GK',  participant: 2, jerseyNumber: 13, starter: false },
  { id: 'eng-mainoo',      name: 'Mainoo',            position: 'MID', participant: 2, jerseyNumber: 26, starter: false },
  { id: 'eng-white',       name: 'B. White',          position: 'DEF', participant: 2, jerseyNumber: 2,  starter: false },
  { id: 'eng-gordon',      name: 'Gordon',            position: 'ATT', participant: 2, jerseyNumber: 22, starter: false },
];
