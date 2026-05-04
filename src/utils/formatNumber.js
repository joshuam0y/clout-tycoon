const SUP_DIGITS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

/** Unicode superscript for decimal exponent (e.g. 6 → ⁶, -3 → ⁻³). */
export function exponentToSuperscript(exp) {
  const e = Math.trunc(exp);
  if (!Number.isFinite(e)) return '';
  if (e === 0) return '⁰';
  let s = '';
  let n = Math.abs(e);
  while (n > 0) {
    s = SUP_DIGITS[n % 10] + s;
    n = Math.floor(n / 10);
  }
  return e < 0 ? '⁻' + s : s;
}

/** Count digits of a non-negative integer (0 → 1). */
function integerDigitCount(n) {
  const x = Math.floor(Math.max(0, Math.abs(n)));
  if (x === 0) return 1;
  return Math.floor(Math.log10(x)) + 1;
}

function trimMantissaStr(mStr) {
  return mStr.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

/**
 * `m×10ⁿ` with mantissa rounded to `sigDigits` significant figures (closest readable order of magnitude).
 */
function formatTimesTenPower(value, sigDigits) {
  if (!Number.isFinite(value)) return '0';
  const sign = value < 0 ? '−' : '';
  const v = Math.abs(value);
  if (v === 0) return '0';
  const raw = v.toExponential(sigDigits - 1);
  const [mantStr, expPart] = raw.split('e');
  const exp = parseInt(expPart, 10);
  const mant = trimMantissaStr(mantStr);
  return `${sign}${mant}×10${exponentToSuperscript(exp)}`;
}

function formatIntegerTimesTenPower(n) {
  if (!Number.isFinite(n)) return '0';
  const sign = n < 0 ? '−' : '';
  const xi = Math.floor(Math.abs(n));
  if (xi === 0) return '0';
  const exp = Math.floor(Math.log10(xi));
  const mant = xi / 10 ** exp;
  const mantRounded = Math.round(mant * 100) / 100;
  let m = mantRounded;
  let e = exp;
  if (m >= 10) {
    m /= 10;
    e += 1;
  }
  if (m < 1 && e > 0) {
    m *= 10;
    e -= 1;
  }
  const mStr = trimMantissaStr(Number.isInteger(m) ? String(m) : m.toFixed(2));
  return `${sign}${mStr}×10${exponentToSuperscript(e)}`;
}

/** Whole numbers for Clout, followers, costs — switches to m×10ⁿ when too many digits for tight layouts. */
export function formatNumber(num) {
  if (!Number.isFinite(num)) return '0';
  const flo = Math.floor(num);
  const abs = Math.abs(flo);
  if (abs < 1_000_000 && integerDigitCount(flo) <= 6) {
    return flo.toLocaleString();
  }
  return formatIntegerTimesTenPower(flo);
}

/**
 * Rates (per second, per click). Small values keep decimals; large ones use m×10ⁿ like integers in the shop/HUD.
 */
export function formatRate(num) {
  if (!Number.isFinite(num) || num === 0) return '0';
  const abs = Math.abs(num);
  if (abs >= 100_000 || (abs >= 1 && Math.floor(Math.log10(abs)) + 1 > 6)) {
    return formatTimesTenPower(num, 3);
  }
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
