export const SAVE_VERSION = 2;
export const SAVE_KEY = 'clout-tycoon-save';

/**
 * Sessions do not persist: each full reload starts a new game.
 */

try {
  localStorage.removeItem(SAVE_KEY);
} catch {
  /* ignore blocked storage */
}

export function loadGameSnapshot() {
  return null;
}

export function writeGameSnapshot(_payload) {
  /* intentionally no-op */
}
