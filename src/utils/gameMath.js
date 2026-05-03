import { UNIT_PRICE_GROWTH, buildingTypes } from '../data/gameData';

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

/** Followers scale all clout sources (meaningful but capped) */
export const getFollowerCloutMult = followers => {
  const f = Number(followers) || 0;
  return 1 + Math.min(3.5, f / 2200);
};

/** Hiring/building gets cheaper as audience grows (max ~22% off) */
export const getFollowerCostMult = followers => {
  const f = Number(followers) || 0;
  return Math.max(0.78, 1 - Math.min(0.22, f / 420000));
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
  return Math.ceil(baseCost * Math.pow(growth, owned));
}

export function clickUpgradeNextCost(upgrade, currentLevel) {
  return Math.ceil(upgrade.baseCost * Math.pow(upgrade.growth, currentLevel));
}
