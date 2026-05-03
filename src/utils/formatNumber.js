/** Whole numbers for Clout, followers, and costs — full value, no K/M/B shorthand. */
export function formatNumber(num) {
  if (!Number.isFinite(num)) return '0';
  return Math.floor(num).toLocaleString();
}

/** Rates (per second, per click); large values show full integers. */
export function formatRate(num) {
  if (!Number.isFinite(num) || num === 0) return '0';
  const abs = Math.abs(num);
  if (abs >= 1000) return Math.round(num).toLocaleString();
  if (abs >= 10) {
    const s = (Math.round(num * 10) / 10).toFixed(1);
    return s.endsWith('.0') ? s.slice(0, -2) : s;
  }
  const s = (Math.round(num * 100) / 100).toFixed(2);
  if (s.endsWith('.00')) return s.slice(0, -3);
  if (s.endsWith('0')) return s.slice(0, -1);
  return s;
}
