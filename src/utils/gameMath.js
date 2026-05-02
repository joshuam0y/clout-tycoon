import { UNIT_PRICE_GROWTH } from '../data/gameData';

export function scaledUnitCost(baseCost, owned, growth = UNIT_PRICE_GROWTH) {
  return Math.ceil(baseCost * Math.pow(growth, owned));
}

export function clickUpgradeNextCost(upgrade, currentLevel) {
  return Math.ceil(upgrade.baseCost * Math.pow(upgrade.growth, currentLevel));
}
