/**
 * Short-scale suffixes from million upward (idle-game style).
 * Extended list so absurd values still show a label instead of reverting to scientific notation.
 */
const SCALE_SUFFIXES = [
  'mil',
  'bil',
  'tril',
  'quad',
  'quin',
  'sext',
  'sept',
  'oct',
  'non',
  'dec',
  'undec',
  'duodec',
  'tredec',
  'quatt',
  'quindec',
  'sexdec',
  'septdec',
  'octdec',
  'novdec',
  'vigint',
  'unvig',
  'duovig',
  'trevig',
  'quattvig',
  'quinvig',
  'sexvig',
  'septvig',
  'octvig',
  'nonvig',
  'trigint',
  'untrig',
  'duotrig',
  'tretrig',
  'quattrig',
  'quintrig',
  'sextrig'
];

function trimMantissaStr(mStr) {
  return mStr.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

/** Format positive mantissa in [1, 1000) with up to `decimals` fractional digits. */
function formatMantissa(v, decimals = 2) {
  if (!Number.isFinite(v)) return '0';
  const rounded = decimals <= 0 ? Math.round(v) : Math.round(v * 10 ** decimals) / 10 ** decimals;
  const s = decimals <= 0 ? String(rounded) : trimMantissaStr(rounded.toFixed(decimals));
  return s;
}

/**
 * abs ≥ 1e6 — scale down from millions by thousands until mantissa &lt; 1000 or suffix cap.
 */
function formatAbsScaledSuffix(absVal, maxDecimals = 2) {
  let v = absVal / 1_000_000;
  let i = 0;
  while (v >= 1000 && i < SCALE_SUFFIXES.length - 1) {
    v /= 1000;
    i += 1;
  }
  const suffix = SCALE_SUFFIXES[i] ?? SCALE_SUFFIXES[SCALE_SUFFIXES.length - 1];
  return `${formatMantissa(v, maxDecimals)} ${suffix}`;
}

/** Exact integer for `title` tooltips when the UI shows compact mil/bil/tril. */
export function formatIntegerExact(num) {
  if (!Number.isFinite(num)) return '';
  return Math.trunc(num).toLocaleString();
}

/** Readable float for tooltips on rates shown in compact form. */
export function formatRateExact(num) {
  if (!Number.isFinite(num)) return '';
  const abs = Math.abs(num);
  if (abs >= 1e15) return num.toExponential(6);
  return num.toLocaleString(undefined, { maximumFractionDigits: abs >= 100 ? 4 : 8 });
}

/** Whole numbers for Clout, followers, costs — full grouping under 1M, then mil / bil / tril … */
export function formatNumber(num) {
  if (!Number.isFinite(num)) return '0';
  const flo = Math.floor(num);
  const abs = Math.abs(flo);
  const sign = flo < 0 ? '−' : '';
  if (abs < 1_000_000) {
    return sign + flo.toLocaleString();
  }
  return sign + formatAbsScaledSuffix(abs, 2);
}

/**
 * Rates (per second, per click). Small values keep decimals; large ones use the same suffix ladder.
 */
export function formatRate(num) {
  if (!Number.isFinite(num) || num === 0) return '0';
  const sign = num < 0 ? '−' : '';
  const abs = Math.abs(num);

  if (abs >= 1_000_000) {
    return sign + formatAbsScaledSuffix(abs, 3);
  }
  if (abs >= 1000) return sign + Math.round(abs).toLocaleString();
  if (abs >= 10) {
    const s = (Math.round(abs * 10) / 10).toFixed(1);
    const t = s.endsWith('.0') ? s.slice(0, -2) : s;
    return sign + t;
  }
  const s = (Math.round(abs * 100) / 100).toFixed(2);
  let t = s;
  if (s.endsWith('.00')) t = s.slice(0, -3);
  else if (s.endsWith('0')) t = s.slice(0, -1);
  return sign + t;
}
