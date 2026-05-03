import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import {
  influencerTypes,
  buildingTypes,
  brandDealTypes,
  prestigeEras,
  clickUpgradeTypes,
  achievementDefs,
  managerTypes,
  getPrestigeRunCloutRequired,
  PRESTIGE_GEMS_BASE,
  brandDealsMaySpawn,
  reputationIncomeMultiplierFromRep,
  getSynergyMultiplierFromBuildingTypes,
  computeBrandDealPayouts,
  getBrandDealSeasonalWeightMult,
  AGENT_AUTO_ACCEPT_DELAY_MS,
  AGENT_MIN_REP_AFTER_DEAL,
  PASSIVE_GLOBAL_MULT,
  CLICK_OUTPUT_GLOBAL_MULT,
  PRESTIGE_MULT_PER_LEVEL,
  getProducerPassiveMult,
  CLICK_UPGRADE_MULT_SOFTEN
} from '../data/gameData';
import {
  scaledUnitCost,
  clickUpgradeNextCost,
  getFollowerCloutMult,
  getFollowerCostMult,
  distanceToBuildingFootprint
} from '../utils/gameMath';
import {
  loadGameSnapshot,
  writeGameSnapshot,
  downloadSaveFile,
  importSaveFromJsonText
} from '../utils/persistence';
import { playPrestigeChime } from '../utils/sound';

const TICK_INTERVAL = 100;
const BRAND_DEAL_SPAWN_CHANCE_PER_TICK = 0.00052;
const BRAND_DEAL_COOLDOWN_ACCEPT_MS = 32000;
const BRAND_DEAL_COOLDOWN_DECLINE_MS = 22000;
const BRAND_DEAL_COOLDOWN_EXPIRE_MS = 20000;
const BRAND_DEAL_DURATION_MS = 20000;
const MAX_GEM_CLOUT_STACKS = 10;
const GEM_STACK_COST_BASE = 48;
const GEM_STACK_COST_PER_OWNED = 14;
const GEM_STACK_BONUS = 0.04;
const MAX_GEM_CLICK_STACKS = 12;
const GEM_CLICK_BONUS = 0.045;
const GEM_CLICK_COST_BASE = 38;
const GEM_CLICK_COST_PER_OWNED = 12;
const MAX_GEM_PASSIVE_STACKS = 12;
const GEM_PASSIVE_BONUS = 0.05;
const GEM_PASSIVE_COST_BASE = 44;
const GEM_PASSIVE_COST_PER_OWNED = 11;
const CLOUT_SURGE_COST = 25;
const CLOUT_SURGE_SECONDS = 72;
const GACHA_SINGLE_COST = 85;
const GACHA_MULTI_COST = 750;
const GACHA_MULTI_PULLS = 10;

const FRENZY_COOLDOWN_MS = 72_000;
const FRENZY_DURATION_MIN_MS = 12_000;
const FRENZY_DURATION_MAX_MS = 22_000;
const FRENZY_SPAWN_CHANCE_PER_TICK = 0.0003;

const savedGame = loadGameSnapshot();

const doesBuildingCoverTile = (building, tileX, tileY) => {
  const buildingType = buildingTypes.find(t => t.id === building.typeId);
  if (!buildingType) return false;

  return (
    tileX >= building.position.x &&
    tileX < building.position.x + buildingType.size &&
    tileY >= building.position.y &&
    tileY < building.position.y + buildingType.size
  );
};

function achievementMet(id, snap) {
  switch (id) {
    case 'first_click':
      return snap.totalClicks >= 1;
    case 'first_influencer':
      return snap.influencers.length >= 1;
    case 'first_building':
      return snap.buildings.length >= 1;
    case 'ten_k_run':
      return snap.runCloutEarned >= 10000;
    case 'hundred_k_life':
      return snap.lifetimeClout >= 100000;
    case 'million_life':
      return snap.lifetimeClout >= 1_000_000;
    case 'first_prestige':
      return snap.prestigeCount >= 1;
    case 'five_prestige':
      return snap.prestigeCount >= 5;
    case 'followers_10k':
      return snap.followers >= 10000;
    case 'deal_master':
      return snap.brandDealsAccepted >= 25;
    case 'first_staff':
      return (snap.managers?.length ?? 0) >= 1;
    case 'big_developer':
      return snap.buildings.length >= 10;
    case 'deep_bench':
      return snap.influencers.length >= 10;
    case 'prestige_x':
      return snap.prestigeCount >= 10;
    case 'billion_life':
      return snap.lifetimeClout >= 1_000_000_000;
    case 'gem_bank':
      return (snap.gems ?? 0) >= 500;
    case 'brand_navigator':
      return (snap.managers?.filter(m => m.typeId === 'scout').length ?? 0) >= 2;
    case 'million_run':
      return snap.runCloutEarned >= 1_000_000;
    case 'click_machine':
      return snap.totalClicks >= 100_000;
    case 'deal_century':
      return snap.brandDealsAccepted >= 100;
    case 'full_agency': {
      const ids = new Set((snap.managers ?? []).map(m => m.typeId));
      return ids.has('intern') && ids.has('agent') && ids.has('producer') && ids.has('scout');
    }
    default:
      return false;
  }
}

export const useGameState = () => {
  const acceptBrandDealRef = useRef(() => {});
  const internClickRemainderRef = useRef(0);

  const [clout, setClout] = useState(() => savedGame?.clout ?? 0);
  const [followers, setFollowers] = useState(() => savedGame?.followers ?? 0);
  const [reputation, setReputation] = useState(() => savedGame?.reputation ?? 100);

  const [prestigeCount, setPrestigeCount] = useState(() => savedGame?.prestigeCount ?? 0);
  const [prestigeMultiplier, setPrestigeMultiplier] = useState(() => savedGame?.prestigeMultiplier ?? 1);

  const [influencers, setInfluencers] = useState(() => savedGame?.influencers ?? []);
  const [buildings, setBuildings] = useState(() => savedGame?.buildings ?? []);
  const [managers, setManagers] = useState(() => savedGame?.managers ?? []);

  const [activeBrandDeal, setActiveBrandDeal] = useState(null);
  const [brandDealCooldown, setBrandDealCooldown] = useState(() => savedGame?.brandDealCooldown ?? 0);

  const [selectedTool, setSelectedTool] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const [totalClicks, setTotalClicks] = useState(() => savedGame?.totalClicks ?? 0);
  const [lifetimeClout, setLifetimeClout] = useState(() => savedGame?.lifetimeClout ?? 0);
  const [runCloutEarned, setRunCloutEarned] = useState(() => savedGame?.runCloutEarned ?? 0);

  const [clickUpgradeLevels, setClickUpgradeLevels] = useState(
    () => savedGame?.clickUpgradeLevels ?? {}
  );

  const [gems, setGems] = useState(() => savedGame?.gems ?? 0);
  const [gemCloutMultStacks, setGemCloutMultStacks] = useState(
    () => savedGame?.gemCloutMultStacks ?? 0
  );
  const [gemClickMultStacks, setGemClickMultStacks] = useState(
    () => savedGame?.gemClickMultStacks ?? 0
  );
  const [gemPassiveMultStacks, setGemPassiveMultStacks] = useState(
    () => savedGame?.gemPassiveMultStacks ?? 0
  );
  const [achievementsUnlocked, setAchievementsUnlocked] = useState(
    () => savedGame?.achievementsUnlocked ?? {}
  );
  const [brandDealsAccepted, setBrandDealsAccepted] = useState(
    () => savedGame?.brandDealsAccepted ?? 0
  );

  const [activeFrenzy, setActiveFrenzy] = useState(null);
  const [frenzyCooldownEndAt, setFrenzyCooldownEndAt] = useState(0);
  /** Bumps during active frenzy so HUD countdown repaints even when passive Clout/tick is 0 */
  const [, setFrenzyUiTick] = useState(0);

  const prestigeRunCloutRequired = getPrestigeRunCloutRequired(prestigeCount);

  const addNotification = useCallback((message, type = 'info') => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      createdAt: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 3200);
  }, []);

  const getGemCloutMult = useCallback(
    () => 1 + gemCloutMultStacks * GEM_STACK_BONUS,
    [gemCloutMultStacks]
  );

  const getGemClickMult = useCallback(
    () => 1 + gemClickMultStacks * GEM_CLICK_BONUS,
    [gemClickMultStacks]
  );

  const getGemPassiveMult = useCallback(
    () => 1 + gemPassiveMultStacks * GEM_PASSIVE_BONUS,
    [gemPassiveMultStacks]
  );

  const getReputationIncomeMultiplier = useCallback(
    () => reputationIncomeMultiplierFromRep(reputation),
    [reputation]
  );

  const calculatePassiveIncome = useCallback(() => {
    let totalCloutPerSecond = 0;

    influencers.forEach(influencer => {
      const type = influencerTypes.find(t => t.id === influencer.typeId);
      let cloutPerSecond = type.baseCloutPerSecond;
      const buildingTypesInRange = [];

      buildings.forEach(building => {
        const buildingType = buildingTypes.find(t => t.id === building.typeId);
        if (buildingType?.effect === 'multiply') {
          const distance = distanceToBuildingFootprint(
            building,
            influencer.position.x,
            influencer.position.y
          );
          if (distance <= buildingType.range) {
            cloutPerSecond *= buildingType.multiplier;
            buildingTypesInRange.push(buildingType.id);
          }
        }
      });

      const uniqueBuildingTypes = [...new Set(buildingTypesInRange)];
      cloutPerSecond *= getSynergyMultiplierFromBuildingTypes(influencer.typeId, uniqueBuildingTypes);

      totalCloutPerSecond += cloutPerSecond;
    });

    const frenzyPassiveMult =
      activeFrenzy?.kind === 'passive_frenzy' && Date.now() < activeFrenzy.endsAt
        ? activeFrenzy.multiplier
        : 1;

    const producerCount = managers.filter(m => m.typeId === 'producer').length;
    const producerMult = getProducerPassiveMult(producerCount);

    return (
      totalCloutPerSecond *
      producerMult *
      prestigeMultiplier *
      getFollowerCloutMult(followers) *
      getReputationIncomeMultiplier() *
      getGemCloutMult() *
      getGemPassiveMult() *
      frenzyPassiveMult *
      PASSIVE_GLOBAL_MULT
    );
  }, [
    influencers,
    buildings,
    managers,
    prestigeMultiplier,
    followers,
    getReputationIncomeMultiplier,
    getGemCloutMult,
    getGemPassiveMult,
    activeFrenzy
  ]);

  const computePostClout = useCallback(
    applyClickFrenzy => {
      let flat = 1;
      let mult =
        prestigeMultiplier *
        getFollowerCloutMult(followers) *
        getReputationIncomeMultiplier() *
        getGemCloutMult() *
        getGemClickMult();
      if (applyClickFrenzy) {
        const frenzyClickMult =
          activeFrenzy?.kind === 'click_frenzy' && Date.now() < activeFrenzy.endsAt
            ? activeFrenzy.multiplier
            : 1;
        mult *= frenzyClickMult;
      }
      clickUpgradeTypes.forEach(u => {
        const level = clickUpgradeLevels[u.id] ?? 0;
        if (level === 0) return;
        if (u.kind === 'flat') flat += level * u.perLevel;
        else {
          const eff = u.perLevel * CLICK_UPGRADE_MULT_SOFTEN;
          mult *= Math.pow(1 + eff, level);
        }
      });
      return flat * mult * CLICK_OUTPUT_GLOBAL_MULT;
    },
    [
      prestigeMultiplier,
      followers,
      clickUpgradeLevels,
      getReputationIncomeMultiplier,
      getGemCloutMult,
      getGemClickMult,
      activeFrenzy
    ]
  );

  const getClickClout = useCallback(() => computePostClout(true), [computePostClout]);

  /** Interns automate posting — does not stack viral click frenzy (you still spike harder manually). */
  const getInternAutoClickClout = useCallback(() => computePostClout(false), [computePostClout]);

  const addCloutEarned = useCallback(delta => {
    if (delta <= 0) return;
    setClout(prev => prev + delta);
    setLifetimeClout(prev => prev + delta);
    setRunCloutEarned(prev => prev + delta);
  }, []);

  const clickPostContent = useCallback(() => {
    const earnedClout = getClickClout();
    addCloutEarned(earnedClout);
    setTotalClicks(prev => prev + 1);

    if (Math.random() < 0.07) {
      setFollowers(prev => prev + 1);
    }
  }, [getClickClout, addCloutEarned]);

  const hireInfluencer = useCallback(
    (typeId, position) => {
      const type = influencerTypes.find(t => t.id === typeId);
      if (!type) return false;
      const owned = influencers.filter(i => i.typeId === typeId).length;
      const rawCost = scaledUnitCost(type.cost, owned);
      const cost = Math.ceil(rawCost * getFollowerCostMult(followers));
      if (clout < cost) return false;

      const influencerOccupied = influencers.some(
        influencer => influencer.position.x === position.x && influencer.position.y === position.y
      );
      if (influencerOccupied) return false;

      const buildingOccupied = buildings.some(building =>
        doesBuildingCoverTile(building, position.x, position.y)
      );
      if (buildingOccupied) return false;

      const newInfluencer = {
        id: Date.now() + Math.random(),
        typeId,
        position,
        cloutPerSecond: type.baseCloutPerSecond,
        level: 1,
        hiredAt: Date.now()
      };

      setInfluencers(prev => [...prev, newInfluencer]);
      setClout(prev => prev - cost);
      addNotification(`Hired ${type.name}!`, 'success');

      return true;
    },
    [clout, influencers, buildings, followers, addNotification]
  );

  const placeBuilding = useCallback(
    (typeId, position) => {
      const type = buildingTypes.find(t => t.id === typeId);
      if (!type) return false;
      const owned = buildings.filter(b => b.typeId === typeId).length;
      const rawCost = scaledUnitCost(type.cost, owned);
      const cost = Math.ceil(rawCost * getFollowerCostMult(followers));
      if (clout < cost) return false;

      for (let y = position.y; y < position.y + type.size; y++) {
        for (let x = position.x; x < position.x + type.size; x++) {
          const buildingOccupied = buildings.some(building => doesBuildingCoverTile(building, x, y));
          if (buildingOccupied) return false;

          const influencerOccupied = influencers.some(
            influencer => influencer.position.x === x && influencer.position.y === y
          );
          if (influencerOccupied) return false;
        }
      }

      const newBuilding = {
        id: Date.now() + Math.random(),
        typeId,
        position,
        level: 1,
        builtAt: Date.now()
      };

      setBuildings(prev => [...prev, newBuilding]);
      setClout(prev => prev - cost);
      addNotification(`Built ${type.name}!`, 'success');

      return true;
    },
    [clout, buildings, influencers, followers, addNotification]
  );

  const buyManager = useCallback(
    typeId => {
      const def = managerTypes.find(m => m.id === typeId);
      if (!def) return false;
      const owned = managers.filter(m => m.typeId === typeId).length;
      const rawCost = scaledUnitCost(def.cost, owned);
      const cost = Math.ceil(rawCost * getFollowerCostMult(followers));
      if (clout < cost) return false;
      setClout(c => c - cost);
      setManagers(prev => [...prev, { id: Date.now() + Math.random(), typeId }]);
      addNotification(`Hired ${def.name}!`, 'success');
      return true;
    },
    [clout, managers, followers, addNotification]
  );

  const acceptBrandDeal = useCallback(() => {
    if (!activeBrandDeal) return;

    const deal = brandDealTypes.find(d => d.id === activeBrandDeal.typeId);
    if (!deal) return;

    const { earnedClout, followerGain, reputationDelta } = computeBrandDealPayouts(deal, {
      clout,
      followers,
      lifetimeClout,
      prestigeMultiplier,
      gemCloutMult: getGemCloutMult()
    });

    addCloutEarned(earnedClout);
    setFollowers(prev => prev + followerGain);
    setReputation(prev => Math.max(0, Math.min(100, prev + reputationDelta)));
    setBrandDealsAccepted(prev => prev + 1);

    addNotification(
      `Completed ${deal.name}! +${Math.floor(earnedClout)} Clout · +${Math.floor(followerGain)} followers`,
      'success'
    );
    setActiveBrandDeal(null);
    setBrandDealCooldown(BRAND_DEAL_COOLDOWN_ACCEPT_MS);
  }, [
    activeBrandDeal,
    clout,
    followers,
    lifetimeClout,
    prestigeMultiplier,
    getGemCloutMult,
    addCloutEarned,
    addNotification
  ]);

  const prestige = useCallback(() => {
    const required = getPrestigeRunCloutRequired(prestigeCount);
    if (runCloutEarned < required) return false;

    const newPrestigeCount = prestigeCount + 1;
    const newMultiplier = 1 + newPrestigeCount * PRESTIGE_MULT_PER_LEVEL;
    const themeEra = Math.min(2, Math.floor(newPrestigeCount / 3));
    const prestigeGems = PRESTIGE_GEMS_BASE + Math.floor(newPrestigeCount / 4);

    /* Full run reset — gems & Premium Shop stacks persist (not touched here). */
    setClout(0);
    setFollowers(0);
    setReputation(100);
    setInfluencers([]);
    setBuildings([]);
    setManagers([]);
    setActiveBrandDeal(null);
    setBrandDealCooldown(0);
    setActiveFrenzy(null);
    setFrenzyCooldownEndAt(0);
    setTotalClicks(0);
    setRunCloutEarned(0);
    setClickUpgradeLevels({});

    setPrestigeCount(newPrestigeCount);
    setPrestigeMultiplier(newMultiplier);
    setGems(prev => prev + prestigeGems);

    addNotification(
      `Prestige ${newPrestigeCount}! +${prestigeGems} 💎 · ${prestigeEras[themeEra].name}`,
      'prestige'
    );
    playPrestigeChime();

    return true;
  }, [runCloutEarned, prestigeCount, addNotification]);

  const declineBrandDeal = useCallback(() => {
    if (!activeBrandDeal) return;

    const deal = brandDealTypes.find(d => d.id === activeBrandDeal.typeId);
    addNotification(deal ? `Passed on ${deal.name}` : 'Brand deal declined', 'info');
    setActiveBrandDeal(null);
    setBrandDealCooldown(BRAND_DEAL_COOLDOWN_DECLINE_MS);
  }, [activeBrandDeal, addNotification]);

  const buyClickUpgrade = useCallback(
    upgradeId => {
      const def = clickUpgradeTypes.find(u => u.id === upgradeId);
      if (!def) return false;

      const level = clickUpgradeLevels[upgradeId] ?? 0;
      const cost = clickUpgradeNextCost(def, level);
      if (clout < cost) return false;

      setClout(prev => prev - cost);
      setClickUpgradeLevels(prev => ({ ...prev, [upgradeId]: level + 1 }));
      addNotification(`${def.name} → Lv.${level + 1}`, 'success');
      return true;
    },
    [clout, clickUpgradeLevels, addNotification]
  );

  const buyGemCloutStack = useCallback(() => {
    if (gemCloutMultStacks >= MAX_GEM_CLOUT_STACKS) {
      addNotification(`Syndicate stacks maxed (${MAX_GEM_CLOUT_STACKS}).`, 'warning');
      return false;
    }
    const cost = GEM_STACK_COST_BASE + gemCloutMultStacks * GEM_STACK_COST_PER_OWNED;
    if (gems < cost) {
      addNotification(`Need ${cost} 💎`, 'warning');
      return false;
    }
    setGems(g => g - cost);
    setGemCloutMultStacks(s => s + 1);
    addNotification(`Syndicate: +${GEM_STACK_BONUS * 100}% all Clout (permanent)`, 'success');
    return true;
  }, [gems, gemCloutMultStacks, addNotification]);

  const buyGemClickStack = useCallback(() => {
    if (gemClickMultStacks >= MAX_GEM_CLICK_STACKS) {
      addNotification(`Creator stacks maxed (${MAX_GEM_CLICK_STACKS}).`, 'warning');
      return false;
    }
    const cost = GEM_CLICK_COST_BASE + gemClickMultStacks * GEM_CLICK_COST_PER_OWNED;
    if (gems < cost) {
      addNotification(`Need ${cost} 💎`, 'warning');
      return false;
    }
    setGems(g => g - cost);
    setGemClickMultStacks(s => s + 1);
    addNotification(`Creator Kit: +${GEM_CLICK_BONUS * 100}% post Clout (permanent)`, 'success');
    return true;
  }, [gems, gemClickMultStacks, addNotification]);

  const buyGemPassiveStack = useCallback(() => {
    if (gemPassiveMultStacks >= MAX_GEM_PASSIVE_STACKS) {
      addNotification(`Spotlight stacks maxed (${MAX_GEM_PASSIVE_STACKS}).`, 'warning');
      return false;
    }
    const cost = GEM_PASSIVE_COST_BASE + gemPassiveMultStacks * GEM_PASSIVE_COST_PER_OWNED;
    if (gems < cost) {
      addNotification(`Need ${cost} 💎`, 'warning');
      return false;
    }
    setGems(g => g - cost);
    setGemPassiveMultStacks(s => s + 1);
    addNotification(`Spotlight: +${GEM_PASSIVE_BONUS * 100}% passive Clout (permanent)`, 'success');
    return true;
  }, [gems, gemPassiveMultStacks, addNotification]);

  const buyCloutSurge = useCallback(() => {
    const rate = calculatePassiveIncome();
    if (rate <= 0) {
      addNotification('Hire talent first — no passive to surge.', 'warning');
      return false;
    }
    if (gems < CLOUT_SURGE_COST) {
      addNotification(`Need ${CLOUT_SURGE_COST} 💎`, 'warning');
      return false;
    }
    const burst = rate * CLOUT_SURGE_SECONDS;
    setGems(g => g - CLOUT_SURGE_COST);
    addCloutEarned(burst);
    addNotification(`Clout Surge: +${Math.floor(burst)} (~${CLOUT_SURGE_SECONDS}s passive)`, 'success');
    return true;
  }, [gems, calculatePassiveIncome, addCloutEarned, addNotification]);

  const pullGacha = useCallback(
    (multi = false) => {
      const cost = multi ? GACHA_MULTI_COST : GACHA_SINGLE_COST;
      if (gems < cost) {
        addNotification(`Need ${cost} 💎`, 'warning');
        return;
      }
      const rate = calculatePassiveIncome();
      const pulls = multi ? GACHA_MULTI_PULLS : 1;
      let total = 0;
      for (let i = 0; i < pulls; i++) {
        const seconds = 38 + Math.random() * 95;
        total += Math.max(120, rate * seconds);
      }
      setGems(g => g - cost);
      addCloutEarned(total);
      addNotification(
        multi
          ? `10× Viral Drop: +${Math.floor(total)} Clout`
          : `Viral Drop: +${Math.floor(total)} Clout`,
        'success'
      );
    },
    [gems, calculatePassiveIncome, addCloutEarned, addNotification]
  );

  const grantGemsFromPack = useCallback((amount = 120) => {
    setGems(g => g + amount);
    addNotification(`+${amount} 💎 (simulated purchase)`, 'success');
  }, [addNotification]);

  const marketCloutInjection = useCallback(
    (gemCost, label) => {
      if (gems < gemCost) {
        addNotification(`Need ${gemCost} 💎`, 'warning');
        return;
      }
      const rate = calculatePassiveIncome();
      const injection = Math.max(800, rate * (38 + gemCost * 0.35));
      setGems(g => g - gemCost);
      addCloutEarned(injection);
      addNotification(`${label}: +${Math.floor(injection)} Clout`, 'success');
    },
    [gems, calculatePassiveIncome, addCloutEarned, addNotification]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      writeGameSnapshot({
        clout,
        followers,
        reputation,
        prestigeCount,
        prestigeMultiplier,
        influencers,
        buildings,
        managers,
        totalClicks,
        lifetimeClout,
        runCloutEarned,
        clickUpgradeLevels,
        brandDealCooldown,
        gems,
        gemCloutMultStacks,
        gemClickMultStacks,
        gemPassiveMultStacks,
        achievementsUnlocked,
        brandDealsAccepted
      });
    }, 400);
    return () => clearTimeout(t);
  }, [
    clout,
    followers,
    reputation,
    prestigeCount,
    prestigeMultiplier,
    influencers,
    buildings,
    managers,
    totalClicks,
    lifetimeClout,
    runCloutEarned,
    clickUpgradeLevels,
    brandDealCooldown,
    gems,
    gemCloutMultStacks,
    gemClickMultStacks,
    gemPassiveMultStacks,
    achievementsUnlocked,
    brandDealsAccepted
  ]);

  useEffect(() => {
    const snap = {
      totalClicks,
      influencers,
      buildings,
      managers,
      runCloutEarned,
      lifetimeClout,
      prestigeCount,
      followers,
      brandDealsAccepted,
      gems
    };
    achievementDefs.forEach(def => {
      if (achievementsUnlocked[def.id]) return;
      if (!achievementMet(def.id, snap)) return;
      setAchievementsUnlocked(prev => ({ ...prev, [def.id]: true }));
      setGems(prev => prev + def.gemReward);
      addNotification(`Achievement: ${def.name} (+${def.gemReward} 💎)`, 'success');
    });
  }, [
    totalClicks,
    influencers,
    buildings,
    runCloutEarned,
    lifetimeClout,
    prestigeCount,
    followers,
    brandDealsAccepted,
    managers,
    gems,
    achievementsUnlocked,
    addNotification
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      if (activeFrenzy && now >= activeFrenzy.endsAt) {
        setActiveFrenzy(null);
        setFrenzyCooldownEndAt(now + FRENZY_COOLDOWN_MS);
      } else if (activeFrenzy && now < activeFrenzy.endsAt) {
        setFrenzyUiTick(t => (t + 1) % 1_000_000);
      }

      const passiveCloutPerSecond = calculatePassiveIncome();
      const passiveCloutPerTick = (passiveCloutPerSecond * TICK_INTERVAL) / 1000;

      if (passiveCloutPerTick > 0) {
        addCloutEarned(passiveCloutPerTick);
      }

      if (influencers.length > 0) {
        const followerGrowth = (influencers.length * 0.0062 * TICK_INTERVAL) / 1000;
        setFollowers(prev => prev + followerGrowth);
      }

      const internN = managers.filter(m => m.typeId === 'intern').length;
      if (internN > 0) {
        const cps = internN * (managerTypes.find(m => m.id === 'intern')?.clicksPerSecond ?? 10);
        internClickRemainderRef.current += (cps * TICK_INTERVAL) / 1000;
        while (internClickRemainderRef.current >= 1) {
          internClickRemainderRef.current -= 1;
          const earned = getInternAutoClickClout();
          addCloutEarned(earned);
          setTotalClicks(tc => tc + 1);
          if (Math.random() < 0.07) {
            setFollowers(f => f + 1);
          }
        }
      }

      if (activeBrandDeal && managers.some(m => m.typeId === 'agent')) {
        const startedAt = activeBrandDeal.startedAt ?? now - BRAND_DEAL_DURATION_MS;
        if (now - startedAt >= AGENT_AUTO_ACCEPT_DELAY_MS) {
          const dealType = brandDealTypes.find(d => d.id === activeBrandDeal.typeId);
          const repDelta = dealType?.reputationDelta ?? 0;
          const projectedRep = Math.max(0, Math.min(100, reputation + repDelta));
          if (projectedRep >= AGENT_MIN_REP_AFTER_DEAL) {
            const fn = acceptBrandDealRef.current;
            if (typeof fn === 'function') fn();
          }
        }
      }

      if (brandDealCooldown > 0) {
        setBrandDealCooldown(prev => Math.max(0, prev - TICK_INTERVAL));
      }

      if (
        !activeFrenzy &&
        now >= frenzyCooldownEndAt &&
        (influencers.length >= 1 || totalClicks > 35) &&
        Math.random() < FRENZY_SPAWN_CHANCE_PER_TICK * (0.48 + (reputation / 100) * 0.95)
      ) {
        const passiveRoll = Math.random() < 0.5;
        const mult = passiveRoll ? 2.05 + Math.random() * 2.2 : 1.9 + Math.random() * 1.95;
        const duration =
          FRENZY_DURATION_MIN_MS + Math.random() * (FRENZY_DURATION_MAX_MS - FRENZY_DURATION_MIN_MS);
        setActiveFrenzy({
          kind: passiveRoll ? 'passive_frenzy' : 'click_frenzy',
          multiplier: mult,
          endsAt: now + duration
        });
        addNotification(
          passiveRoll
            ? `📈 Feed surge — passive ×${mult.toFixed(1)} (~${Math.round(duration / 1000)}s)`
            : `🔥 Viral frenzy — posts ×${mult.toFixed(1)} (~${Math.round(duration / 1000)}s)`,
          'success'
        );
      }

      if (
        !activeBrandDeal &&
        brandDealCooldown === 0 &&
        brandDealsMaySpawn(lifetimeClout, influencers.length, buildings.length) &&
        Math.random() < BRAND_DEAL_SPAWN_CHANCE_PER_TICK * (0.28 + (reputation / 100) * 0.85)
      ) {
        const availableDeals = brandDealTypes;

        if (availableDeals.length > 0) {
          const scoutN = managers.filter(m => m.typeId === 'scout').length;
          const weightedDeals = availableDeals.map(deal => {
            const risky = deal.reputationDelta < 0;
            const repPct = reputation / 100;
            let weight = risky ? 0.42 + (1 - repPct) * 0.85 : 0.65 + repPct * 0.55;
            if (risky && reputation < 35) weight *= 1.35;
            if (!risky && reputation < 25) weight *= 0.65;
            weight *= getBrandDealSeasonalWeightMult(deal.id, now, scoutN);
            return { deal, weight: Math.max(0.06, weight) };
          });

          const totalWeight = weightedDeals.reduce((sum, entry) => sum + entry.weight, 0);
          let roll = Math.random() * totalWeight;
          let picked = weightedDeals[0].deal;
          for (const entry of weightedDeals) {
            roll -= entry.weight;
            if (roll <= 0) {
              picked = entry.deal;
              break;
            }
          }

          setActiveBrandDeal({
            typeId: picked.id,
            startedAt: now,
            expiresAt: now + BRAND_DEAL_DURATION_MS
          });
        }
      }

      if (activeBrandDeal && Date.now() > activeBrandDeal.expiresAt) {
        setActiveBrandDeal(null);
        setBrandDealCooldown(BRAND_DEAL_COOLDOWN_EXPIRE_MS);
        addNotification('Brand deal expired!', 'warning');
      }
    }, TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [
    calculatePassiveIncome,
    brandDealCooldown,
    activeBrandDeal,
    influencers.length,
    buildings.length,
    reputation,
    followers,
    clout,
    runCloutEarned,
    lifetimeClout,
    activeFrenzy,
    frenzyCooldownEndAt,
    totalClicks,
    addCloutEarned,
    addNotification,
    managers,
    getClickClout,
    getInternAutoClickClout
  ]);

  const importSaveFromFileText = useCallback(
    text => {
      const snap = importSaveFromJsonText(text);
      if (!snap) {
        addNotification('Could not read that save file.', 'warning');
        return false;
      }
      writeGameSnapshot(snap);
      addNotification('Save imported — reloading…', 'success');
      window.setTimeout(() => window.location.reload(), 120);
      return true;
    },
    [addNotification]
  );

  const exportSaveToFile = useCallback(() => {
    downloadSaveFile({
      clout,
      followers,
      reputation,
      prestigeCount,
      prestigeMultiplier,
      influencers,
      buildings,
      managers,
      totalClicks,
      lifetimeClout,
      runCloutEarned,
      clickUpgradeLevels,
      brandDealCooldown,
      gems,
      gemCloutMultStacks,
      gemClickMultStacks,
      gemPassiveMultStacks,
      achievementsUnlocked,
      brandDealsAccepted
    });
  }, [
    clout,
    followers,
    reputation,
    prestigeCount,
    prestigeMultiplier,
    influencers,
    buildings,
    managers,
    totalClicks,
    lifetimeClout,
    runCloutEarned,
    clickUpgradeLevels,
    brandDealCooldown,
    gems,
    gemCloutMultStacks,
    gemClickMultStacks,
    gemPassiveMultStacks,
    achievementsUnlocked,
    brandDealsAccepted
  ]);

  useLayoutEffect(() => {
    acceptBrandDealRef.current = acceptBrandDeal;
  }, [acceptBrandDeal]);

  return {
    clout,
    followers,
    reputation,
    prestigeCount,
    prestigeMultiplier,
    influencers,
    buildings,
    managers,
    activeBrandDeal,
    selectedTool,
    setSelectedTool,
    notifications,
    totalClicks,
    lifetimeClout,
    runCloutEarned,
    prestigeRunCloutRequired,
    passiveCloutPerSecond: calculatePassiveIncome(),
    clickCloutPerClick: getClickClout(),
    activeFrenzy,
    clickUpgradeLevels,
    reputationIncomeMultiplier: getReputationIncomeMultiplier(),
    gems,
    gemCloutMultStacks,
    gemClickMultStacks,
    gemPassiveMultStacks,
    maxGemCloutStacks: MAX_GEM_CLOUT_STACKS,
    maxGemClickStacks: MAX_GEM_CLICK_STACKS,
    maxGemPassiveStacks: MAX_GEM_PASSIVE_STACKS,
    achievementsUnlocked,
    achievementDefs,
    brandDealsAccepted,
    clickPostContent,
    hireInfluencer,
    placeBuilding,
    buyManager,
    buyClickUpgrade,
    acceptBrandDeal,
    declineBrandDeal,
    prestige,
    buyGemCloutStack,
    buyGemClickStack,
    buyGemPassiveStack,
    buyCloutSurge,
    pullGacha,
    grantGemsFromPack,
    marketCloutInjection,
    gachaCosts: { single: GACHA_SINGLE_COST, multi: GACHA_MULTI_COST },
    gemEconomy: {
      syndicateCostBase: GEM_STACK_COST_BASE,
      syndicateCostPerOwned: GEM_STACK_COST_PER_OWNED,
      clickCostBase: GEM_CLICK_COST_BASE,
      clickCostPerOwned: GEM_CLICK_COST_PER_OWNED,
      passiveCostBase: GEM_PASSIVE_COST_BASE,
      passiveCostPerOwned: GEM_PASSIVE_COST_PER_OWNED,
      surgeCost: CLOUT_SURGE_COST,
      stackBonus: GEM_STACK_BONUS,
      clickBonus: GEM_CLICK_BONUS,
      passiveBonus: GEM_PASSIVE_BONUS
    },
    gemCloutMult: getGemCloutMult(),
    gemClickMult: getGemClickMult(),
    gemPassiveMult: getGemPassiveMult(),
    exportSaveToFile,
    importSaveFromFileText
  };
};