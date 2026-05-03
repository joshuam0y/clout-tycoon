import { describe, it, expect } from 'vitest';
import {
  scaledUnitCost,
  getFollowerCloutMult,
  getFollowerCostMult,
  clickUpgradeNextCost
} from './gameMath';
import {
  getPrestigeRunCloutRequired,
  PRESTIGE_RUN_CLOUT_BASE,
  PRESTIGE_RUN_CLOUT_MULT_PER_STEP,
  UNIT_PRICE_GROWTH,
  UNIT_PRICE_DUPLICATE_EXP,
  CLOUT_PRICE_MULTIPLIER
} from '../data/gameData';

describe('scaledUnitCost', () => {
  it('returns price-scaled base for zero owned', () => {
    expect(scaledUnitCost(100, 0)).toBe(Math.ceil(100 * CLOUT_PRICE_MULTIPLIER));
  });
  it('scales with growth (first duplicate still ^1)', () => {
    expect(scaledUnitCost(100, 1)).toBe(
      Math.ceil(100 * UNIT_PRICE_GROWTH * CLOUT_PRICE_MULTIPLIER)
    );
  });
  it('accelerates faster than linear owned exponent', () => {
    const exp2 = Math.pow(2, UNIT_PRICE_DUPLICATE_EXP);
    expect(scaledUnitCost(100, 2)).toBe(
      Math.ceil(100 * Math.pow(UNIT_PRICE_GROWTH, exp2) * CLOUT_PRICE_MULTIPLIER)
    );
  });
});

describe('followers', () => {
  it('clout mult caps', () => {
    expect(getFollowerCloutMult(0)).toBe(1);
    expect(getFollowerCloutMult(1_000_000)).toBeCloseTo(1 + 2.2, 5);
  });
  it('cost mult: no followers = full price', () => {
    expect(getFollowerCostMult(0)).toBe(1);
  });
  it('cost mult: mid followers meaningfully discounts hires/builds', () => {
    expect(getFollowerCostMult(4_000)).toBeCloseTo(1 - 4000 / 80000, 10);
    expect(getFollowerCostMult(12_000)).toBeCloseTo(0.85, 10);
  });
  it('cost mult floors at 15% discount', () => {
    expect(getFollowerCostMult(100_000)).toBeCloseTo(0.85, 10);
    expect(getFollowerCostMult(10_000_000)).toBeCloseTo(0.85, 10);
  });
});

describe('getPrestigeRunCloutRequired', () => {
  it('matches price-scaled base at zero prestige', () => {
    expect(getPrestigeRunCloutRequired(0)).toBe(
      Math.floor(PRESTIGE_RUN_CLOUT_BASE * CLOUT_PRICE_MULTIPLIER)
    );
  });
  it('multiplies each prestige step', () => {
    expect(getPrestigeRunCloutRequired(1)).toBe(
      Math.floor(PRESTIGE_RUN_CLOUT_BASE * CLOUT_PRICE_MULTIPLIER * PRESTIGE_RUN_CLOUT_MULT_PER_STEP)
    );
  });
});

describe('clickUpgradeNextCost', () => {
  it('uses growth from level', () => {
    const u = { baseCost: 50, growth: 1.5 };
    expect(clickUpgradeNextCost(u, 0)).toBe(Math.ceil(50 * CLOUT_PRICE_MULTIPLIER));
    expect(clickUpgradeNextCost(u, 2)).toBe(
      Math.ceil(50 * 1.5 * 1.5 * CLOUT_PRICE_MULTIPLIER)
    );
  });
});

describe('getPrestigeRunCloutRequired scaling', () => {
  it('steps by PRESTIGE_RUN_CLOUT_MULT_PER_STEP each prestige', () => {
    expect(getPrestigeRunCloutRequired(2)).toBe(
      Math.floor(
        PRESTIGE_RUN_CLOUT_BASE * CLOUT_PRICE_MULTIPLIER * Math.pow(PRESTIGE_RUN_CLOUT_MULT_PER_STEP, 2)
      )
    );
  });
});
