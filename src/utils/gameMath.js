import {
  UNIT_PRICE_GROWTH,
  buildingTypes,
  getSynergyMultiplierFromBuildingTypes,
  CLOUT_PRICE_MULTIPLIER
} from '../data/gameData';

/** Manhattan distance from tile to rectangular building footprint (0 = inside/on edge). */
export function distanceToBuildingFootprint(building, tileX, tileY) {
  const buildingType = buildingTypes.find(t => t.id === building.typeId);
  if (!buildingType) return Number.POSITIVE_INFINITY;

  const minX = building.position.x;
  const maxX = building.position.x + buildingType.size - 1;
  const minY = building.position.y;
  const maxY = building.position.y + buildingType.size - 1;

  const dx = tileX < minX ? minX - tileX : tileX > maxX ? tileX - maxX : 0;
  const dy = tileY < minY ? minY - tileY : tileY > maxY ? tileY - maxY : 0;

  return dx + dy;
}

/**
 * Buff from structures + pairings on the grid for one talent (matches passive math;
 * excludes prestige, followers, reputation, gems).
 */
export function getLocalGridBuffMultiplier(influencer, buildings) {
  if (!influencer) return 1;
  const inRangeTypeIds = [];
  let product = 1;
  for (const building of buildings) {
    const bt = buildingTypes.find(t => t.id === building.typeId);
    if (!bt || bt.effect !== 'multiply') continue;
    const d = distanceToBuildingFootprint(building, influencer.position.x, influencer.position.y);
    if (d <= bt.range) {
      product *= bt.multiplier;
      inRangeTypeIds.push(bt.id);
    }
  }
  const uniqueTypes = [...new Set(inRangeTypeIds)];
  return product * getSynergyMultiplierFromBuildingTypes(influencer.typeId, uniqueTypes);
}

/** Followers scale all clout sources (meaningful but capped) */
export const getFollowerCloutMult = followers => {
  const f = Number(followers) || 0;
  return 1 + Math.min(2.2, f / 2750);
};

/** Hiring/building gets cheaper as audience grows (max ~15% off) */
export const getFollowerCostMult = followers => {
  const f = Number(followers) || 0;
  return Math.max(0.85, 1 - Math.min(0.15, f / 480000));
};

/** Whole-number % for HUD copy */
export function getFollowerBonusSummary(followers) {
  const cloutMult = getFollowerCloutMult(followers);
  const costMult = getFollowerCostMult(followers);
  return {
    cloutBonusPct: Math.max(0, Math.round((cloutMult - 1) * 100)),
    hireDiscountPct: Math.max(0, Math.round((1 - costMult) * 100))
  };
}

export function scaledUnitCost(baseCost, owned, growth = UNIT_PRICE_GROWTH) {
  return Math.ceil(baseCost * Math.pow(growth, owned) * CLOUT_PRICE_MULTIPLIER);
}

export function clickUpgradeNextCost(upgrade, currentLevel) {
  return Math.ceil(
    upgrade.baseCost * Math.pow(upgrade.growth, currentLevel) * CLOUT_PRICE_MULTIPLIER
  );
}
