import { describe, it, expect } from 'vitest';
import { getBrandDealSeasonalWeightMult } from './gameData';

describe('brand deal seasons', () => {
  it('weight 1 when deal is not in this week’s favored set', () => {
    const t = 0;
    expect(getBrandDealSeasonalWeightMult('viral_push', t, 0)).toBe(1);
  });

  it('boosts favored deals in clean week and stacks Brand Scouts', () => {
    const t = 0;
    const base = getBrandDealSeasonalWeightMult('partnership', t, 0);
    const withScouts = getBrandDealSeasonalWeightMult('partnership', t, 2);
    expect(base).toBeGreaterThan(1);
    expect(withScouts / base).toBeCloseTo(1.12, 5);
  });
});
