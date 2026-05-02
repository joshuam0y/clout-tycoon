export const SAVE_VERSION = 1;
export const SAVE_KEY = 'clout-tycoon-save';

export function loadGameSnapshot() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.v !== SAVE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeGameSnapshot(payload) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: SAVE_VERSION, ...payload }));
  } catch {
    // ignore quota / private mode
  }
}
