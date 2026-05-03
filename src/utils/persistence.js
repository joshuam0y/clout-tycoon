import { SFX_MUTE_STORAGE_KEY } from './sound';

export const SAVE_VERSION = 3;
export const SAVE_KEY = 'clout-tycoon-save';

/** Multiple named snapshots stored in-browser (same origin); keys are user-chosen labels. */
export const NAMED_SAVES_KEY = 'clout-tycoon-named-saves';

/** Which named slot receives periodic backups while playing (`''` = none). */
export const ACTIVE_NAMED_SLOT_KEY = 'clout-tycoon-active-named-slot';

const MAX_NAMED_SAVE_LABEL_LENGTH = 80;

export function sanitizeNamedSaveLabel(raw) {
  if (typeof raw !== 'string') return '';
  const t = raw.trim().slice(0, MAX_NAMED_SAVE_LABEL_LENGTH);
  return t;
}

export function getActiveNamedSlot() {
  try {
    const raw = localStorage.getItem(ACTIVE_NAMED_SLOT_KEY);
    if (!raw) return '';
    return sanitizeNamedSaveLabel(raw);
  } catch {
    return '';
  }
}

export function setActiveNamedSlot(label) {
  const name = sanitizeNamedSaveLabel(label);
  try {
    if (!name) {
      localStorage.removeItem(ACTIVE_NAMED_SLOT_KEY);
      return;
    }
    localStorage.setItem(ACTIVE_NAMED_SLOT_KEY, name);
  } catch {
    /* ignore */
  }
}

export function clearActiveNamedSlot() {
  try {
    localStorage.removeItem(ACTIVE_NAMED_SLOT_KEY);
  } catch {
    /* ignore */
  }
}

export function listNamedSaves() {
  try {
    const raw = localStorage.getItem(NAMED_SAVES_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return [];
    return Object.entries(data)
      .map(([name, entry]) => ({
        name,
        savedAt: typeof entry?.savedAt === 'number' ? entry.savedAt : 0
      }))
      .sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

export function putNamedSave(label, payload) {
  const name = sanitizeNamedSaveLabel(label);
  if (!name) return false;
  const normalized = normalizeSnapshot(payload);
  if (!normalized) return false;
  let bucket = {};
  try {
    const raw = localStorage.getItem(NAMED_SAVES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') bucket = parsed;
    }
  } catch {
    bucket = {};
  }
  bucket[name] = {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    snapshot: normalized
  };
  try {
    localStorage.setItem(NAMED_SAVES_KEY, JSON.stringify(bucket));
    return true;
  } catch {
    return false;
  }
}

export function getNamedSave(label) {
  const name = sanitizeNamedSaveLabel(label);
  if (!name) return null;
  try {
    const raw = localStorage.getItem(NAMED_SAVES_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const entry = data?.[name];
    if (!entry?.snapshot) return null;
    return normalizeSnapshot(entry.snapshot);
  } catch {
    return null;
  }
}

export function deleteNamedSave(label) {
  const name = sanitizeNamedSaveLabel(label);
  if (!name) return false;
  try {
    const raw = localStorage.getItem(NAMED_SAVES_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !(name in data)) return false;
    delete data[name];
    if (Object.keys(data).length === 0) {
      localStorage.removeItem(NAMED_SAVES_KEY);
    } else {
      localStorage.setItem(NAMED_SAVES_KEY, JSON.stringify(data));
    }
    return true;
  } catch {
    return false;
  }
}

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

