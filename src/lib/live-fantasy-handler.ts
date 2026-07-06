// Live Fantasy Handler — Coordinate base points, performance bonuses, and skill card bonuses
// Called at halftime and fulltime to calculate final points

import { calculateTotalFantasyPoints, type PointsBreakdown } from './fantasy-analytics';
import { applySkillModifier } from './card-collection';
import { getCardDefByInstanceId } from './card-collection';

export interface PlayerPointsState {
  playerId: string;
  basePoints: number;
  performanceBonus: number;
  skillCardBonus: number;
  starRating: number;
  totalPoints: number;
  breakdown: PointsBreakdown;
}

// Fetch performance bonus from API and calculate final points
export async function calculateHalftimePoints(params: {
  fixtureId: string;
  contestId?: string;
  walletAddress?: string;
  playerPositions: Record<string, string>; // playerId → position
  basePoints: Record<string, number>; // playerId → base points so far
  lineupData?: {
    players: Array<{ id: string; name: string; position: string }>;
    captain?: string;
    confidence?: Record<string, number>;
    equippedCards?: Record<string, { cardId: string; instanceId: string }>;
  };
}): Promise<Record<string, PlayerPointsState>> {
  const { fixtureId, contestId, walletAddress, playerPositions, basePoints, lineupData } = params;

  try {
    // Fetch performance bonus from API
    const perfRes = await fetch('/api/fantasy/performance-bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fixtureId,
        timepoint: 'halftime',
        contestId,
        walletAddress,
        playerPositions,
      }),
    });

    if (!perfRes.ok) {
      console.warn('[LiveFantasy] Performance bonus API error:', perfRes.status);
      return {};
    }

    const { bonuses } = await perfRes.json();

    // Calculate final points per player
    const results: Record<string, PlayerPointsState> = {};

    for (const [playerId, rawData] of Object.entries(bonuses as Record<string, any>)) {
      const perfData = rawData as { performanceBonus?: number; skillCard?: { cardId: string; instanceId: string } };
      const base = basePoints[playerId] ?? 0;
      const perfBonus = perfData.performanceBonus ?? 0;

      // Get skill card bonus if equipped
      let skillCardBonus = 0;
      let skillCardId = '';
      if (perfData.skillCard?.instanceId) {
        const skillCard = getCardDefByInstanceId(perfData.skillCard.instanceId);
        if (skillCard) {
          skillCardId = skillCard.id;
          // Calculate skill card bonus — would need player events
          // For now, placeholder: will be calculated on frontend
          skillCardBonus = 0;
        }
      }

      const playerLineup = lineupData?.players.find(p => p.id === playerId);
      const position = playerLineup?.position ?? playerPositions[playerId] ?? 'MID';
      const starRating = lineupData?.confidence?.[playerId] ?? 3;
      const isCaptain = lineupData?.captain === playerId;

      // Calculate with all bonuses
      const breakdown = calculateTotalFantasyPoints({
        basePoints: base,
        performanceBonus: perfBonus,
        skillCardBonus,
        starRating: isCaptain ? starRating : 3, // Captain doesn't get skill bonus multiplier, handled separately
      });

      results[playerId] = {
        playerId,
        basePoints: base,
        performanceBonus: perfBonus,
        skillCardBonus,
        starRating,
        totalPoints: breakdown.totalPoints,
        breakdown,
      };
    }

    return results;
  } catch (err) {
    console.error('[LiveFantasy] Error calculating halftime points:', err);
    return {};
  }
}

// Same as halftime but for fulltime
export async function calculateFulltimePoints(
  params: Parameters<typeof calculateHalftimePoints>[0]
): Promise<Record<string, PlayerPointsState>> {
  return calculateHalftimePoints({
    ...params,
    // timepoint would be 'fulltime' in API call if we refactor
  });
}
