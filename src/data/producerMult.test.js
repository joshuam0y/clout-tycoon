import { describe, it, expect } from 'vitest';
import { getProducerPassiveMult } from './gameData';

describe('getProducerPassiveMult', () => {
  it('is 1 with no producers', () => {
    expect(getProducerPassiveMult(0)).toBe(1);
  });
  it('grows sub-exponentially and caps', () => {
    const m5 = getProducerPassiveMult(5);
    const m20 = getProducerPassiveMult(20);
    const m200 = getProducerPassiveMult(200);
    expect(m5).toBeGreaterThan(1.2);
    expect(m20).toBeGreaterThan(m5);
    expect(m200).toBe(2.35);
    expect(m20 / m5).toBeLessThan(3);
  });
});
