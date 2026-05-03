import {
  UNIT_PRICE_GROWTH,
  UNIT_PRICE_DUPLICATE_EXP,
  buildingTypes,
  getSynergyMultiplierFromBuildingTypes,
  CLOUT_PRICE_MULTIPLIER,
  BUILDING_SAME_TYPE_STACK_EXP_PER_EXTRA,
  BUILDING_SAME_TYPE_STACK_EXP_CAP,
  BUILDING_ERA_GROWTH_FACTOR,
  BUILDING_ERA_DUPLICATE_EXP_BONUS,
  BUILDING_ERA_FLAT_COST_MULT
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

/** Effective exponent for n copies of the same ×m aura (n ≥ 1). */
export function buildingSameTypeStackExponent(n) {
  const k = Math.max(1, Math.floor(Number(n) || 0));
  if (k <= 1) return 1;
  return Math.min(
    BUILDING_SAME_TYPE_STACK_EXP_CAP,
    1 + (k - 1) * BUILDING_SAME_TYPE_STACK_EXP_PER_EXTRA
  );
}

/** Combined multiplier from n same-type auras each ×m (sublinear stack + cap on exponent). */
export function combinedSameTypeBuildingMult(baseMult, count) {
  const m = Number(baseMult);
  if (!Number.isFinite(m) || m <= 0) return 1;
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (n <= 0) return 1;
  const exp = buildingSameTypeStackExponent(n);
  return Math.pow(m, exp);
}

/**
 * Buff from structures + pairings on the grid for one talent (matches passive math;
 * excludes prestige, followers, reputation, gems).
 */
export function getLocalGridBuffMultiplier(influencer, buildings) {
  if (!influencer) return 1;
  const countsByType = new Map();
  const inRangeTypeIds = [];

  for (const building of buildings) {
    const bt = buildingTypes.find(t => t.id === building.typeId);
    if (!bt || bt.effect !== 'multiply') continue;
    const d = distanceToBuildingFootprint(building, influencer.position.x, influencer.position.y);
    if (d <= bt.range) {
      const prev = countsByType.get(bt.id) ?? 0;
      countsByType.set(bt.id, prev + 1);
      inRangeTypeIds.push(bt.id);
    }
  }

  let product = 1;
  for (const bt of buildingTypes) {
    const n = countsByType.get(bt.id);
    if (!n || bt.effect !== 'multiply') continue;
    product *= combinedSameTypeBuildingMult(bt.multiplier, n);
  }

  const uniqueTypes = [...new Set(inRangeTypeIds)];
  return product * getSynergyMultiplierFromBuildingTypes(influencer.typeId, uniqueTypes);
}

/** Followers scale all clout sources (meaningful but capped) */
export const getFollowerCloutMult = followers => {
  const f = Number(followers) || 0;
  return 1 + Math.min(2.2, f / 2750);
};

/**
 * Hiring / builds / staff get cheaper as audience grows (max ~15% off).
 * Linear to the cap so discounts are felt well before late game (full discount ≈12k followers).
 */
export const getFollowerCostMult = followers => {
  const f = Number(followers) || 0;
  const discount = Math.min(0.15, f / 80000);
  return Math.max(0.85, 1 - discount);
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
  const n = Math.max(0, Math.floor(owned));
  const exponent = n === 0 ? 0 : Math.pow(n, UNIT_PRICE_DUPLICATE_EXP);
  return Math.ceil(baseCost * Math.pow(growth, exponent) * CLOUT_PRICE_MULTIPLIER);
}

/**
 * Placement cost for structures — steeper than generic hires for late-era catalog (early era 0 unchanged).
 */
export function scaledBuildingPlacementCost(baseCost, owned, requiredEra = 0) {
  const era = Math.max(0, Math.min(2, Math.floor(Number(requiredEra) || 0)));
  const n = Math.max(0, Math.floor(owned));
  const growth = UNIT_PRICE_GROWTH * (1 + era * BUILDING_ERA_GROWTH_FACTOR);
  const dupExp = UNIT_PRICE_DUPLICATE_EXP + (BUILDING_ERA_DUPLICATE_EXP_BONUS[era] ?? 0);
  const exponent = n === 0 ? 0 : Math.pow(n, dupExp);
  const flat = BUILDING_ERA_FLAT_COST_MULT[era] ?? 1;
  return Math.ceil(baseCost * Math.pow(growth, exponent) * CLOUT_PRICE_MULTIPLIER * flat);
}

export function clickUpgradeNextCost(upgrade, currentLevel) {
  return Math.ceil(
    upgrade.baseCost * Math.pow(upgrade.growth, currentLevel) * CLOUT_PRICE_MULTIPLIER
  );
}
