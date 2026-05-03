import { describe, it, expect, beforeEach } from 'vitest';
import {
  NAMED_SAVES_KEY,
  ACTIVE_NAMED_SLOT_KEY,
  putNamedSave,
  getNamedSave,
  listNamedSaves,
  deleteNamedSave,
  sanitizeNamedSaveLabel,
  getActiveNamedSlot,
  setActiveNamedSlot,
  clearActiveNamedSlot
} from './persistence';
import { migrateClickUpgradeLevels } from '../data/gameData';

const memoryStore = {};

beforeEach(() => {
  Object.keys(memoryStore).forEach(k => delete memoryStore[k]);
  globalThis.localStorage = {
    getItem: k => (Object.prototype.hasOwnProperty.call(memoryStore, k) ? memoryStore[k] : null),
    setItem: (k, v) => {
      memoryStore[k] = String(v);
    },
    removeItem: k => {
      delete memoryStore[k];
    },
    clear: () => {
      Object.keys(memoryStore).forEach(key => delete memoryStore[key]);
    }
  };
});

const minimalSnap = {
  clout: 100,
  followers: 0,
  reputation: 100,
  prestigeCount: 0,
  prestigeMultiplier: 1,
  influencers: [],
  buildings: [],
  managers: [],
  totalClicks: 0,
  lifetimeClout: 100,
  runCloutEarned: 0,
  clickUpgradeLevels: {},
  brandDealCooldown: 0,
  gems: 0,
  gemCloutMultStacks: 0,
  gemClickMultStacks: 0,
  gemPassiveMultStacks: 0,
  achievementsUnlocked: {},
  brandDealsAccepted: 0
};

describe('named browser saves', () => {
  it('sanitizes labels', () => {
    expect(sanitizeNamedSaveLabel('  hello  ')).toBe('hello');
    expect(sanitizeNamedSaveLabel('')).toBe('');
  });

  it('roundtrips put → list → get → delete', () => {
    expect(putNamedSave('Alpha Run', minimalSnap)).toBe(true);
    const list = listNamedSaves();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Alpha Run');
    expect(getNamedSave('Alpha Run')?.clout).toBe(100);
    expect(deleteNamedSave('Alpha Run')).toBe(true);
    expect(localStorage.getItem(NAMED_SAVES_KEY)).toBeNull();
    expect(listNamedSaves().length).toBe(0);
  });

  it('overwrites same label', () => {
    putNamedSave('slot-a', { ...minimalSnap, clout: 1 });
    putNamedSave('slot-a', { ...minimalSnap, clout: 2 });
    expect(getNamedSave('slot-a')?.clout).toBe(2);
  });

  it('active named slot roundtrips', () => {
    expect(getActiveNamedSlot()).toBe('');
    setActiveNamedSlot('  My Run  ');
    expect(localStorage.getItem(ACTIVE_NAMED_SLOT_KEY)).toBe('My Run');
    expect(getActiveNamedSlot()).toBe('My Run');
    clearActiveNamedSlot();
    expect(getActiveNamedSlot()).toBe('');
  });

  it('migrates legacy post upgrade ids to ladder ids', () => {
    expect(
      migrateClickUpgradeLevels({
        grip: 5,
        hook: 3,
        post_t05: 2
      })
    ).toEqual({
      post_t01: 5,
      post_t02: 3,
      post_t05: 2
    });
  });
});
