/** Whole numbers for Clout, followers, and costs (no fractional display). */
export function formatNumber(num) {
  if (!Number.isFinite(num)) return '0';
  const n = num;
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${Math.floor(n / 1e12)}T`;
  if (abs >= 1e9) return `${Math.floor(n / 1e9)}B`;
  if (abs >= 1e6) return `${Math.floor(n / 1e6)}M`;
  if (abs >= 1e3) return `${Math.floor(n / 1e3)}K`;
  return Math.floor(n).toLocaleString();
}

/** Rates (per second, per click): one decimal place. */
export function formatRate(num) {
  if (!Number.isFinite(num) || num === 0) return '0';
  const abs = Math.abs(num);
  if (abs >= 1000) return formatNumber(num);
  const s = (Math.round(num * 10) / 10).toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}
