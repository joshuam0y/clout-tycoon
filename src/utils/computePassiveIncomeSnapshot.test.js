import { describe, it, expect } from 'vitest';
import { computePassiveIncomeSnapshot } from './computePassiveIncomeSnapshot';
import { influencerTypes, PASSIVE_GLOBAL_MULT } from '../data/gameData';
import { getLocalGridBuffMultiplier } from './gameMath';

describe('computePassiveIncomeSnapshot', () => {
  const petBase = influencerTypes.find(t => t.id === 'pet').baseCloutPerSecond;

  it('sums talent-type buckets to total passive (HUD)', () => {
    const influencers = [
      { id: 1, typeId: 'pet', position: { x: 0, y: 0 } },
      { id: 2, typeId: 'pet', position: { x: 1, y: 0 } },
      { id: 3, typeId: 'pet', position: { x: 2, y: 0 } }
    ];
    const snap = computePassiveIncomeSnapshot({
      influencers,
      buildings: [],
      managers: [],
      prestigeMultiplier: 1,
      followers: 0,
      reputation: 100,
      gemCloutMult: 1,
      gemPassiveMult: 1,
      activeFrenzy: null,
      nowMs: 0
    });

    const expectedRaw = 3 * petBase;
    expect(snap.totalRaw).toBeCloseTo(expectedRaw, 8);

    const globalMult =
      1 * 1 * 1 * 1 * 1 * 1 * 1 * PASSIVE_GLOBAL_MULT;
    expect(snap.globalMult).toBeCloseTo(PASSIVE_GLOBAL_MULT, 8);
    expect(snap.total).toBeCloseTo(expectedRaw * globalMult, 8);

    const petLine = snap.passiveByTalentType.pet ?? 0;
    expect(petLine).toBeCloseTo(snap.total, 8);
    expect(Object.values(snap.passiveByTalentType).reduce((a, b) => a + b, 0)).toBeCloseTo(snap.total, 8);
  });

  it('per-instance shares sum to type total (3 petfluencers)', () => {
    const influencers = [
      { id: 101, typeId: 'pet', position: { x: 0, y: 0 } },
      { id: 102, typeId: 'pet', position: { x: 1, y: 0 } },
      { id: 103, typeId: 'pet', position: { x: 2, y: 0 } }
    ];
    const snap = computePassiveIncomeSnapshot({
      influencers,
      buildings: [],
      managers: [],
      prestigeMultiplier: 1,
      followers: 0,
      reputation: 100,
      gemCloutMult: 1,
      gemPassiveMult: 1,
      activeFrenzy: null,
      nowMs: 0
    });
    const sumInstances = Object.values(snap.passiveByInfluencerId).reduce((a, b) => a + b, 0);
    expect(sumInstances).toBeCloseTo(snap.passiveByTalentType.pet, 8);
    expect(sumInstances).toBeCloseTo(snap.total, 8);
  });

  it('matches manual grid buff × base for one pet near Creator Desk', () => {
    const inf = { id: 1, typeId: 'pet', position: { x: 0, y: 0 } };
    const buildings = [
      { id: 10, typeId: 'desk', position: { x: 1, y: 0 } }
    ];
    const grid = getLocalGridBuffMultiplier(inf, buildings);
    const snap = computePassiveIncomeSnapshot({
      influencers: [inf],
      buildings,
      managers: [],
      prestigeMultiplier: 1,
      followers: 0,
      reputation: 100,
      gemCloutMult: 1,
      gemPassiveMult: 1,
      activeFrenzy: null,
      nowMs: 0
    });
    expect(snap.totalRaw).toBeCloseTo(petBase * grid, 8);
    expect(snap.total).toBeCloseTo(petBase * grid * PASSIVE_GLOBAL_MULT, 8);
  });

  it('same-type building auras stack sublinearly (two desks < desk^2)', () => {
    const inf = { id: 1, typeId: 'pet', position: { x: 0, y: 0 } };
    const oneDesk = [{ id: 10, typeId: 'desk', position: { x: 1, y: 0 } }];
    const twoDesks = [
      { id: 10, typeId: 'desk', position: { x: 1, y: 0 } },
      { id: 11, typeId: 'desk', position: { x: 0, y: 1 } }
    ];
    const g1 = getLocalGridBuffMultiplier(inf, oneDesk);
    const g2 = getLocalGridBuffMultiplier(inf, twoDesks);
    expect(g2).toBeLessThan(g1 * g1 - 1e-9);
    expect(g2).toBeGreaterThan(g1);
  });
});
