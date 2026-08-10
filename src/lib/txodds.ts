// OddsDraft Event Utilities
// TxLINE removed — all live data now comes from ESPN free API.
// This file retains mapEventToFantasyType (used by cron + live page)
// and the TxODDS client stub for backward compatibility.

import axios, { AxiosInstance } from 'axios';

// No longer used — ESPN is free and needs no auth
const BASE_URL = '';
const GUEST_AUTH_URL = '';
const ACTIVATE_URL = '';

export interface TxODDSFixture {
  FixtureId: string;
  Participant1: string;
  Participant2: string;
  StartTime: string;
  CompetitionId: number;
  CompetitionName: string;
  Status: string;
}

export interface ScoreUpdate {
  seq: number;
  ts: number;
  fixtureId: string;
  gameState: string;
  stats: Record<string, number>;
  events?: SoccerEvent[];
}

export interface SoccerEvent {
  type: string;           // 'goal' | 'yellowcard' | 'redcard' | 'substitution'
  minute: number;
  period: string;
  participant: number;    // 1 or 2
  playerId?: string;
  playerName?: string;
  assistPlayerId?: string;
  assistPlayerName?: string;
  team?: string;
}

export interface OddsUpdate {
  fixtureId: string;
  market: string;
  selections: {
    name: string;
    price: number;
    probability?: number;
  }[];
}

class TxODDSClient {
  private httpClient: AxiosInstance;
  private jwt: string;
  private apiToken: string;

  constructor() {
    this.jwt = process.env.TXODDS_JWT || '';
    this.apiToken = process.env.TXODDS_API_TOKEN || '';
    
    this.httpClient = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.jwt && { 'Authorization': `Bearer ${this.jwt}` }),
        ...(this.apiToken && { 'X-Api-Token': this.apiToken }),
      },
    });
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.jwt}`,
      'X-Api-Token': this.apiToken,
    };
  }

  // Guest JWT (Step 1 of activation)
  async getGuestJWT(): Promise<string> {
    const res = await axios.post(GUEST_AUTH_URL);
    return res.data.token;
  }

  // Activate token after on-chain subscription (Step 3)
  async activateToken(params: {
    txSig: string;
    walletSignature: string;
    jwt: string;
    leagues?: number[];
  }): Promise<string> {
    const res = await axios.post(
      ACTIVATE_URL,
      { txSig: params.txSig, walletSignature: params.walletSignature, leagues: params.leagues || [] },
      { headers: { Authorization: `Bearer ${params.jwt}` } }
    );
    return res.data.token || res.data;
  }

  // Get all World Cup fixtures
  async getFixtures(competitionId?: number): Promise<TxODDSFixture[]> {
    try {
      const params = competitionId ? { competitionId } : {};
      const res = await this.httpClient.get('/fixtures/snapshot', {
        params,
        headers: this.getHeaders(),
      });
      return res.data || [];
    } catch (err) {
      console.error('[TxODDS] getFixtures error:', err);
      return [];
    }
  }

  // Get live score snapshot for a fixture
  async getScoreSnapshot(fixtureId: string): Promise<ScoreUpdate[]> {
    try {
      const res = await this.httpClient.get(`/scores/snapshot/${fixtureId}`, {
        headers: this.getHeaders(),
      });
      return res.data || [];
    } catch (err) {
      console.error('[TxODDS] getScoreSnapshot error:', err);
      return [];
    }
  }

  // Get live scores within current 5-min interval
  async getLiveScores(fixtureId: string): Promise<ScoreUpdate[]> {
    try {
      const res = await this.httpClient.get(`/scores/updates/${fixtureId}`, {
        headers: this.getHeaders(),
      });
      return res.data || [];
    } catch (err) {
      console.error('[TxODDS] getLiveScores error:', err);
      return [];
    }
  }

  // Get full historical scores (for demo with past matches)
  async getHistoricalScores(fixtureId: string): Promise<ScoreUpdate[]> {
    try {
      const res = await this.httpClient.get(`/scores/historical/${fixtureId}`, {
        headers: this.getHeaders(),
      });
      return res.data || [];
    } catch (err) {
      console.error('[TxODDS] getHistoricalScores error:', err);
      return [];
    }
  }

  // Get odds for a fixture
  async getOdds(fixtureId: string): Promise<OddsUpdate[]> {
    try {
      const res = await this.httpClient.get(`/odds/snapshot/${fixtureId}`, {
        headers: this.getHeaders(),
      });
      return res.data || [];
    } catch (err) {
      console.error('[TxODDS] getOdds error:', err);
      return [];
    }
  }

  // Check if credentials are configured
  isConfigured(): boolean {
    return Boolean(this.jwt && this.apiToken);
  }
}

// Singleton instance
export const txoddsClient = new TxODDSClient();

// Helper: parse soccer events from score updates
export function parseSoccerEvents(updates: ScoreUpdate[]): SoccerEvent[] {
  const events: SoccerEvent[] = [];
  for (const update of updates) {
    if (update.events) {
      events.push(...update.events);
    }
  }
  return events;
}

// Map event type string → internal fantasy event type
// Handles BOTH TxLINE legacy strings (for backward compat with any stored data)
// AND ESPN event type strings (the active data source).
export function mapEventToFantasyType(txoddsEvent: SoccerEvent, gameState?: string): string | null {
  const type = txoddsEvent.type.toLowerCase().replace(/\s+/g, '-');

  // Penalty shootout goals and misses
  if (type === 'goal' && gameState === 'Penalties') return 'penalty_scored';
  if ((type === 'penaltymiss' || type === 'penalty---missed') && gameState === 'Penalties') return 'penalty_missed_shootout';

  const map: Record<string, string> = {
    // ESPN event types (primary source, hyphen-separated)
    'goal':                    'goal',
    'penalty---scored':        'goal',
    'penalty-scored':          'goal',
    'own-goal':                'own_goal',
    'yellow-card':             'yellow_card',
    'red-card':                'red_card',
    'substitution':            'substitution',
    'halftime':                'half_time',
    'half-time':               'half_time',
    'end-regular-time':        'full_time',
    'full-time':               'full_time',
    'kickoff':                 'kick_off',
    'kick-off':                'kick_off',
    'start-2nd-half':          'kick_off',
    'second-half':             'kick_off',
    'penalty---missed':        'penalty_missed',
    'missed-penalty':          'penalty_missed',
    'penalty-save':            'penalty_save',
    'penalty---save':          'penalty_save',
    'var-review':              'var_review',
    'corner-kick':             'corner_kick',
    'corner':                  'corner_kick',
    'offside':                 'offside',
    'free-kick':               'free_kick',
    'injury':                  'injury',
    'extra-time':              'extra_time',
    // Legacy TxLINE event types (underscore-separated, kept for backward compat)
    'penalty_outcome':         'goal',
    'penaltyoutcome':          'goal',
    'penalty_goal':            'goal',
    'penaltygoal':             'goal',
    'goal_penalty':            'goal',
    'penalty_scored':          'goal',
    'penaltyscored':           'goal',
    'yellowcard':              'yellow_card',
    'yellow_card':             'yellow_card',
    'redcard':                 'red_card',
    'red_card':                'red_card',
    'owngoal':                 'own_goal',
    'own_goal':                'own_goal',
    'sub':                     'substitution',
    'sub_appearance':          'sub_appearance',
    'penaltysave':             'penalty_save',
    'penalty_save':            'penalty_save',
    'save':                    'goalkeeper_save',
    'assist':                  'assist',
    'var':                     'var_review',
    'var_review':              'var_review',
    'penalty':                 'penalty_won',
    'penaltymiss':             'penalty_missed',
    'penalty_miss':            'penalty_missed',
    'corner_kick':             'corner_kick',
    'shot':                    'shot',
    'shot_on_target':          'shot_on_target',
    'free_kick':               'free_kick',
    'kick_off':                'kick_off',
    'half_time':               'half_time',
    'secondhalf':              'kick_off',
    'full_time':               'full_time',
    'fulltime':                'full_time',
    'startingxi':              'starting_xi',
    'starting_xi':             'starting_xi',
    'hydration_break':         'hydration_break',
    'drinks_break':            'hydration_break',
    'waterbreak':              'hydration_break',
    'water_break':             'hydration_break',
    'extra_time':              'extra_time',
  };
  return map[type] || null;
}
