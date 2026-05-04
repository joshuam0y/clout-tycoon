import { describe, it, expect } from 'vitest';
import { formatNumber, formatRate, exponentToSuperscript } from './formatNumber';

describe('exponentToSuperscript', () => {
  it('maps small integers', () => {
    expect(exponentToSuperscript(0)).toBe('⁰');
    expect(exponentToSuperscript(6)).toBe('⁶');
    expect(exponentToSuperscript(12)).toBe('¹²');
  });
  it('maps negative exponents', () => {
    expect(exponentToSuperscript(-3)).toBe('⁻³');
  });
});

describe('formatNumber', () => {
  it('keeps full grouping for six-digit magnitudes', () => {
    expect(formatNumber(999_999)).not.toContain('×10');
  });
  it('uses times-ten power for 7+ digit integers', () => {
    expect(formatNumber(1_000_000)).toContain('×10');
    expect(formatNumber(1_000_000)).toContain('⁶');
    expect(formatNumber(12_345_678)).toContain('×10');
  });
});

describe('formatRate', () => {
  it('keeps decimals for small rates', () => {
    expect(formatRate(3.456)).toBe('3.46');
  });
  it('does not compact mid rates below threshold', () => {
    expect(formatRate(12_345)).not.toContain('×10');
  });
  it('uses times-ten power for large rates', () => {
    expect(formatRate(987_654)).toContain('×10');
  });
});
