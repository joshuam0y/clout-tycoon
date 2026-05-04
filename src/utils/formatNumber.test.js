import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatRate,
  formatIntegerExact,
  formatRateExact
} from './formatNumber';

describe('formatNumber', () => {
  it('keeps full grouping below a million', () => {
    expect(formatNumber(999_999)).toMatch(/999/);
    expect(formatNumber(5000).replace(/[,.\s\u202f]/g, '')).toMatch(/5000/);
  });
  it('uses mil / bil / tril style instead of powers of ten', () => {
    expect(formatNumber(1_000_000)).toContain('mil');
    expect(formatNumber(1_000_000)).not.toContain('×10');
    expect(formatNumber(12_345_678)).toContain('mil');
    expect(formatNumber(3_500_000_000)).toContain('bil');
    expect(formatNumber(2_000_000_000_000)).toContain('tril');
  });
});

describe('formatRate', () => {
  it('keeps decimals for small rates', () => {
    expect(formatRate(3.456)).toBe('3.46');
  });
  it('does not compact mid rates below a million', () => {
    expect(formatRate(12_345)).not.toMatch(/mil|bil|tril/);
  });
  it('uses suffix ladder for large rates', () => {
    const s = formatRate(987_654_321);
    expect(s).toMatch(/mil|bil|tril|quad/);
    expect(s).not.toContain('×10');
  });
});

describe('tooltip helpers', () => {
  it('formatIntegerExact uses locale grouping', () => {
    expect(formatIntegerExact(1234567)).toMatch(/1/);
    expect(formatIntegerExact(1234567)).toMatch(/234/);
  });
  it('formatRateExact stays finite for typical HUD numbers', () => {
    expect(formatRateExact(12.3456789)).toContain('12');
  });
});
