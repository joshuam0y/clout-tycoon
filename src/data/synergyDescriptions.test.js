import { describe, it, expect } from 'vitest';
import { synergyRules, buildingTypes, influencerTypes } from './gameData';

/** Avoid ×1.1 matching inside ×1.11 */
function descriptionHasMultiplier(text, mult) {
  const escaped = String(mult).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`×${escaped}(?!\\d)`).test(text);
}

/** Building blurbs use "Nano / Pet" instead of the full catalog name "Petfluencer". */
function buildingDescriptionNamesTalent(buildingDescription, influencer) {
  const d = buildingDescription;
  if (d.includes(influencer.name)) return true;
  if (influencer.id === 'pet' && d.includes('/ Pet')) return true;
  if (influencer.id === 'nano' && d.includes('Nano')) return true;
  return false;
}

describe('synergyRules vs catalog copy (bidirectional)', () => {
  it('every rule multiplier appears on both building and talent cards', () => {
    for (const rule of synergyRules) {
      const building = buildingTypes.find(t => t.id === rule.buildingTypeId);
      expect(building, `building ${rule.buildingTypeId}`).toBeTruthy();
      for (const infId of rule.influencerTypeIds) {
        const inf = influencerTypes.find(t => t.id === infId);
        expect(inf, `influencer ${infId}`).toBeTruthy();

        expect(
          descriptionHasMultiplier(building.description, rule.bonusMultiplier),
          `${building.id} lists ×${rule.bonusMultiplier} for ${infId}`
        ).toBe(true);
        expect(
          descriptionHasMultiplier(inf.description, rule.bonusMultiplier),
          `${inf.id} lists ×${rule.bonusMultiplier} for ${building.id}`
        ).toBe(true);
      }
    }
  });

  it('every pairing names the other side (building names talent, talent names building)', () => {
    for (const rule of synergyRules) {
      const building = buildingTypes.find(t => t.id === rule.buildingTypeId);
      for (const infId of rule.influencerTypeIds) {
        const inf = influencerTypes.find(t => t.id === infId);

        expect(
          buildingDescriptionNamesTalent(building.description, inf),
          `${building.id} should name ${inf.name} (or Nano/Pet shorthand)`
        ).toBe(true);

        expect(
          inf.description.toLowerCase(),
          `${inf.id} should name ${building.name}`
        ).toContain(building.name.toLowerCase());
      }
    }
  });
});
