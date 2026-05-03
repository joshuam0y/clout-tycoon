import { describe, it, expect } from 'vitest';
import {
  scaledUnitCost,
  getFollowerCloutMult,
  getFollowerCostMult,
  clickUpgradeNextCost
} from './gameMath';
import { getPrestigeRunCloutRequired, PRESTIGE_RUN_CLOUT_BASE } from '../data/gameData';

describe('scaledUnitCost', () => {
  it('returns base for zero owned', () => {
    expect(scaledUnitCost(100, 0)).toBe(100);
  });
  it('scales with growth', () => {
    expect(scaledUnitCost(100, 1)).toBe(Math.ceil(100 * 1.215));
  });
});

describe('followers', () => {
  it('clout mult caps', () => {
    expect(getFollowerCloutMult(0)).toBe(1);
    expect(getFollowerCloutMult(1_000_000)).toBeCloseTo(1 + 3.5, 5);
  });
  it('cost mult floors at discount cap', () => {
    expect(getFollowerCostMult(0)).toBe(1);
    expect(getFollowerCostMult(10_000_000)).toBe(0.78);
  });
});

describe('getPrestigeRunCloutRequired', () => {
  it('matches base at zero prestige', () => {
    expect(getPrestigeRunCloutRequired(0)).toBe(PRESTIGE_RUN_CLOUT_BASE);
  });
  it('multiplies each prestige step', () => {
    expect(getPrestigeRunCloutRequired(1)).toBe(PRESTIGE_RUN_CLOUT_BASE * 10);
  });
});

describe('clickUpgradeNextCost', () => {
  it('uses growth from level', () => {
    const u = { baseCost: 50, growth: 1.5 };
    expect(clickUpgradeNextCost(u, 0)).toBe(50);
    expect(clickUpgradeNextCost(u, 2)).toBe(Math.ceil(50 * 1.5 * 1.5));
  });
});

describe('getPrestigeRunCloutRequired scaling', () => {
  it('steps by 10× each prestige', () => {
    expect(getPrestigeRunCloutRequired(2)).toBe(getPrestigeRunCloutRequired(1) * 10);
  });
});
