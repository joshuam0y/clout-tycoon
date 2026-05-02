export function formatNumber(num) {
  if (!Number.isFinite(num)) return '0';
  const n = num;
  const abs = Math.abs(n);
  if (abs >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  if (abs >= 1) return Math.floor(n).toLocaleString();
  return n.toFixed(2);
}

/** CPS / click power: readable at small and mid scales */
export function formatRate(num) {
  if (!Number.isFinite(num) || num === 0) return '0';
  if (num > 0 && num < 0.01) return num.toFixed(3);
  if (num < 1) return num.toFixed(2);
  if (num < 1000) return Number.isInteger(num) ? String(num) : num.toFixed(1);
  return formatNumber(num);
}
