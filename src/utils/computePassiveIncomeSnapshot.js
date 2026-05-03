import {
  influencerTypes,
  PASSIVE_GLOBAL_MULT,
  reputationIncomeMultiplierFromRep,
  getProducerPassiveMult
} from '../data/gameData';
import { getLocalGridBuffMultiplier, getFollowerCloutMult } from './gameMath';

/**
 * Single source of truth for passive Clout/s (matches HUD + talent shop “to agency” buckets).
 */
export function computePassiveIncomeSnapshot({
  influencers,
  buildings,
  managers,
  prestigeMultiplier,
  followers,
  reputation,
  gemCloutMult,
  gemPassiveMult,
  activeFrenzy,
  nowMs = Date.now()
}) {
  let totalRaw = 0;
  const rawByTalentType = {};
  const rawByInfluencerId = {};

  for (const inf of influencers) {
    const type = influencerTypes.find(t => t.id === inf.typeId);
    if (!type) continue;
    const raw = type.baseCloutPerSecond * getLocalGridBuffMultiplier(inf, buildings);
    totalRaw += raw;
    rawByTalentType[type.id] = (rawByTalentType[type.id] ?? 0) + raw;
    rawByInfluencerId[inf.id] = raw;
  }

  const frenzyPassiveMult =
    activeFrenzy?.kind === 'passive_frenzy' && nowMs < activeFrenzy.endsAt
      ? activeFrenzy.multiplier
      : 1;

  const producerMult = getProducerPassiveMult(managers.filter(m => m.typeId === 'producer').length);

  const globalMult =
    producerMult *
    prestigeMultiplier *
    getFollowerCloutMult(followers) *
    reputationIncomeMultiplierFromRep(reputation) *
    gemCloutMult *
    gemPassiveMult *
    frenzyPassiveMult *
    PASSIVE_GLOBAL_MULT;

  const total = totalRaw * globalMult;
  const passiveByTalentType = {};
  for (const k of Object.keys(rawByTalentType)) {
    passiveByTalentType[k] = rawByTalentType[k] * globalMult;
  }
  const passiveByInfluencerId = {};
  for (const k of Object.keys(rawByInfluencerId)) {
    passiveByInfluencerId[k] = rawByInfluencerId[k] * globalMult;
  }

  return {
    total,
    passiveByTalentType,
    passiveByInfluencerId,
    totalRaw,
    globalMult
  };
}
