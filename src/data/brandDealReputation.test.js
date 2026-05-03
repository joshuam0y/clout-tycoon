import { describe, expect, it } from 'vitest';
import { brandDealTypes, brandDealOfferableAtReputation } from './gameData';

describe('brandDealOfferableAtReputation', () => {
  const positiveRepDeal = brandDealTypes.find(d => d.reputationDelta > 0);
  const negativeRepDeal = brandDealTypes.find(d => d.reputationDelta < 0);

  it('blocks reputation-gain deals at 100% rep', () => {
    expect(positiveRepDeal).toBeDefined();
    expect(brandDealOfferableAtReputation(positiveRepDeal, 100)).toBe(false);
    expect(brandDealOfferableAtReputation(positiveRepDeal, 101)).toBe(false);
  });

  it('allows reputation-gain deals below 100% rep', () => {
    expect(brandDealOfferableAtReputation(positiveRepDeal, 99)).toBe(true);
    expect(brandDealOfferableAtReputation(positiveRepDeal, 0)).toBe(true);
  });

  it('still allows risky deals at max rep', () => {
    expect(negativeRepDeal).toBeDefined();
    expect(brandDealOfferableAtReputation(negativeRepDeal, 100)).toBe(true);
  });
});
