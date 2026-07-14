// TxODDS API Client — OddsDraft
// Free tier: SERVICE_LEVEL_ID=12 (World Cup real-time, no TxL tokens needed)

import axios, { AxiosInstance } from 'axios';

const BASE_URL = process.env.TXODDS_BASE_URL || 'https://txline.txodds.com/api';
const GUEST_AUTH_URL = 'https://txline.txodds.com/auth/guest/start';
const ACTIVATE_URL = 'https://txline.txodds.com/api/token/activate';

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

// Map TxODDS event type to fantasy event type
// All keys come directly from TxLINE dataSoccer field names (lowercased)
export function mapEventToFantasyType(txoddsEvent: SoccerEvent, gameState?: string): string | null {
  const type = txoddsEvent.type.toLowerCase();

  // Penalty shootout goals and misses — distinguished by gameState
  if (type === 'goal' && gameState === 'Penalties') return 'penalty_scored';
  if (type === 'penaltymiss' && gameState === 'Penalties') return 'penalty_missed_shootout';

  const map: Record<string, string> = {
    goal:              'goal',
    penalty_outcome:   'goal',   // TxLINE sends penalty_outcome instead of goal for penalties
    penaltyoutcome:    'goal',
    penalty_goal:      'goal',
    penaltygoal:       'goal',
    goal_penalty:      'goal',
    penalty_scored:    'goal',
    penaltyscored:     'goal',
    yellowcard:        'yellow_card',
    yellow_card:    'yellow_card',
    redcard:        'red_card',
    red_card:       'red_card',
    owngoal:        'own_goal',
    own_goal:       'own_goal',
    substitution:   'substitution',
    sub:            'substitution',
    sub_appearance: 'sub_appearance',
    penaltysave:    'penalty_save',
    penalty_save:   'penalty_save',
    save:           'goalkeeper_save',
    assist:         'assist',
    var:            'var_review',
    var_review:     'var_review',
    penalty:        'penalty_won',
    penaltymiss:    'penalty_missed',
    penalty_miss:   'penalty_missed',
    corner:         'corner_kick',
    corner_kick:    'corner_kick',
    // Non-fantasy-scoring events — shown in feed with 0 pts, usable for future stat-based scoring
    shot:           'shot',
    shot_on_target: 'shot_on_target',
    free_kick:      'free_kick',
    offside:        'offside',
    // Match flow events — synthesized from GameState but also handle if TxLINE sends them explicitly
    kickoff:           'kick_off',
    kick_off:          'kick_off',
    halftime:          'half_time',
    half_time:         'half_time',
    secondhalf:        'kick_off',
    fulltime:          'full_time',
    full_time:         'full_time',
    startingxi:        'starting_xi',
    starting_xi:       'starting_xi',
    hydration_break:   'hydration_break',
    drinks_break:      'hydration_break',
    waterbreak:        'hydration_break',
    water_break:       'hydration_break',
  };
  return map[type] || null;
}
