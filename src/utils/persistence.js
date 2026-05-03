import { SFX_MUTE_STORAGE_KEY } from './sound';

export const SAVE_VERSION = 3;
export const SAVE_KEY = 'clout-tycoon-save';

/**
 * Blocks autosave while reset runs (debounced writes could otherwise fire after clear() and repopulate localStorage).
 * Same-origin sessionStorage survives navigation within the tab.
 */
const RESET_SAVE_GUARD_KEY = 'clout-tycoon-reset-save-guard';

export function markResetSaveGuard() {
  try {
    sessionStorage.setItem(RESET_SAVE_GUARD_KEY, '1');
  } catch {
    /* storage denied */
  }
}

/** Call once after app mounts so normal autosave works again. */
export function clearResetSaveGuard() {
  try {
    sessionStorage.removeItem(RESET_SAVE_GUARD_KEY);
  } catch {
    /* ignore */
  }
}

function isResetSaveGuardActive() {
  try {
    return sessionStorage.getItem(RESET_SAVE_GUARD_KEY) === '1';
  } catch {
    return false;
  }
}

/** Removes main save + local preferences (SFX mute). Reload after calling for a clean session. */
export function clearAllLocalGameData() {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SFX_MUTE_STORAGE_KEY);
  } catch {
    /* private mode / quota */
  }
}

/**
 * Normalize persisted snapshot (forward-compatible defaults).
 */
export function normalizeSnapshot(raw) {
  if (!raw || typeof raw !== 'object') return null;

  return {
    clout: Math.max(0, Number(raw.clout) || 0),
    followers: Math.max(0, Number(raw.followers) || 0),
    reputation: (() => {
      const v = raw.reputation;
      if (v === undefined || v === null) return 100;
      const n = Number(v);
      return Math.min(100, Math.max(0, Number.isFinite(n) ? n : 100));
    })(),
    prestigeCount: Math.max(0, Number(raw.prestigeCount) || 0),
    prestigeMultiplier: Math.max(1, Number(raw.prestigeMultiplier) || 1),
    influencers: Array.isArray(raw.influencers) ? raw.influencers : [],
    buildings: Array.isArray(raw.buildings) ? raw.buildings : [],
    managers: Array.isArray(raw.managers) ? raw.managers : [],
    totalClicks: Math.max(0, Number(raw.totalClicks) || 0),
    lifetimeClout: Math.max(0, Number(raw.lifetimeClout) || 0),
    runCloutEarned: Math.max(0, Number(raw.runCloutEarned) || 0),
    clickUpgradeLevels:
      raw.clickUpgradeLevels && typeof raw.clickUpgradeLevels === 'object'
        ? raw.clickUpgradeLevels
        : {},
    brandDealCooldown: Math.max(0, Number(raw.brandDealCooldown) || 0),
    gems: Math.max(0, Number(raw.gems) || 0),
    gemCloutMultStacks: Math.max(0, Number(raw.gemCloutMultStacks) || 0),
    gemClickMultStacks: Math.max(0, Number(raw.gemClickMultStacks) || 0),
    gemPassiveMultStacks: Math.max(0, Number(raw.gemPassiveMultStacks) || 0),
    achievementsUnlocked:
      raw.achievementsUnlocked && typeof raw.achievementsUnlocked === 'object'
        ? raw.achievementsUnlocked
        : {},
    brandDealsAccepted: Math.max(0, Number(raw.brandDealsAccepted) || 0)
  };
}

export function loadGameSnapshot() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version === SAVE_VERSION && parsed.snapshot) {
      return normalizeSnapshot(parsed.snapshot);
    }
    /* Legacy / raw snapshot shape */
    if (parsed.clout !== undefined || parsed.prestigeCount !== undefined) {
      return normalizeSnapshot(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

export function writeGameSnapshot(payload) {
  try {
    if (isResetSaveGuardActive()) return;
    const normalized = normalizeSnapshot(payload);
    if (!normalized) return;
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: SAVE_VERSION,
        savedAt: Date.now(),
        snapshot: normalized
      })
    );
  } catch {
    /* quota / private mode */
  }
}

/** Browser download of full save file (backup / transfer). */
export function downloadSaveFile(payload) {
  const normalized = normalizeSnapshot(payload);
  if (!normalized) return;
  const body = JSON.stringify(
    { version: SAVE_VERSION, exportedAt: Date.now(), snapshot: normalized },
    null,
    2
  );
  const blob = new Blob([body], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `clout-tycoon-save-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Parse exported JSON; returns normalized snapshot or null.
 * On success, caller may writeGameSnapshot + reload.
 */
export function importSaveFromJsonText(text) {
  try {
    const data = JSON.parse(text);
    const snap = data.snapshot ?? data;
    return normalizeSnapshot(snap);
  } catch {
    return null;
  }
}
