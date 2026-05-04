import {
  influencerTypes,
  PASSIVE_GLOBAL_MULT,
  reputationIncomeMultiplierFromRep,
  getProducerPassiveMult,
  getWeeklyTalentMetaBoostTypeId,
  WEEKLY_TALENT_META_MULT
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
  gemPassiveTimedMult = 1,
  nowMs = Date.now(),
  /** Test hook: skip weekly lane multiplier (algorithm spotlight). */
  disableWeeklyTalentMeta = false
}) {
  const metaTypeId = disableWeeklyTalentMeta ? null : getWeeklyTalentMetaBoostTypeId(nowMs);

  let totalRaw = 0;
  const rawByTalentType = {};
  const rawByInfluencerId = {};

  for (const inf of influencers) {
    const type = influencerTypes.find(t => t.id === inf.typeId);
    if (!type) continue;
    const laneMult = metaTypeId && type.id === metaTypeId ? WEEKLY_TALENT_META_MULT : 1;
    const raw =
      type.baseCloutPerSecond * getLocalGridBuffMultiplier(inf, buildings) * laneMult;
    totalRaw += raw;
    rawByTalentType[type.id] = (rawByTalentType[type.id] ?? 0) + raw;
    rawByInfluencerId[inf.id] = raw;
  }

  const frenzyPassiveMult =
    activeFrenzy?.kind === 'passive_frenzy' && nowMs < activeFrenzy.endsAt
      ? activeFrenzy.multiplier
      : 1;

  const producerMult = getProducerPassiveMult(managers.filter(m => m.typeId === 'producer').length);

  const timedPassive = Number(gemPassiveTimedMult);
  const passiveTimedFactor = Number.isFinite(timedPassive) && timedPassive > 0 ? timedPassive : 1;

  const globalMult =
    producerMult *
    prestigeMultiplier *
    getFollowerCloutMult(followers) *
    reputationIncomeMultiplierFromRep(reputation) *
    gemCloutMult *
    gemPassiveMult *
    passiveTimedFactor *
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
