import { useState, useEffect, useCallback } from 'react';
import {
  influencerTypes,
  buildingTypes,
  brandDealTypes,
  prestigeEras,
  clickUpgradeTypes,
  achievementDefs,
  PRESTIGE_RUN_CLOUT_THRESHOLD,
  PRESTIGE_GEMS_BASE,
  reputationIncomeMultiplierFromRep
} from '../data/gameData';
import {
  scaledUnitCost,
  clickUpgradeNextCost,
  getFollowerCloutMult,
  getFollowerCostMult
} from '../utils/gameMath';
import { loadGameSnapshot, writeGameSnapshot } from '../utils/persistence';

const TICK_INTERVAL = 100;
const BRAND_DEAL_SPAWN_CHANCE_PER_TICK = 0.002;
const BRAND_DEAL_COOLDOWN_ACCEPT_MS = 22000;
const BRAND_DEAL_COOLDOWN_DECLINE_MS = 14000;
const BRAND_DEAL_COOLDOWN_EXPIRE_MS = 14000;
const MIN_REPUTATION_INCOME_MULTIPLIER = 0.35;
const MAX_REPUTATION_INCOME_MULTIPLIER = 1.65;
const MAX_GEM_CLOUT_STACKS = 6;
const GEM_STACK_COST = 50;
const GEM_STACK_BONUS = 0.04;
const CLOUT_SURGE_COST = 25;
const CLOUT_SURGE_SECONDS = 72;
const GACHA_SINGLE_COST = 85;
const GACHA_MULTI_COST = 750;
const GACHA_MULTI_PULLS = 10;

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

const distanceToBuildingFootprint = (building, tileX, tileY) => {
  const buildingType = buildingTypes.find(t => t.id === building.typeId);
  if (!buildingType) return Number.POSITIVE_INFINITY;

  const minX = building.position.x;
  const maxX = building.position.x + buildingType.size - 1;
  const minY = building.position.y;
  const maxY = building.position.y + buildingType.size - 1;

  const dx = tileX < minX ? minX - tileX : tileX > maxX ? tileX - maxX : 0;
  const dy = tileY < minY ? minY - tileY : tileY > maxY ? tileY - maxY : 0;

  return dx + dy;
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
    default:
      return false;
  }
}

export const useGameState = () => {
  const [clout, setClout] = useState(() => savedGame?.clout ?? 0);
  const [followers, setFollowers] = useState(() => savedGame?.followers ?? 0);
  const [reputation, setReputation] = useState(() => savedGame?.reputation ?? 100);

  const [currentEra, setCurrentEra] = useState(() => savedGame?.currentEra ?? 0);
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
  const [achievementsUnlocked, setAchievementsUnlocked] = useState(
    () => savedGame?.achievementsUnlocked ?? {}
  );
  const [brandDealsAccepted, setBrandDealsAccepted] = useState(
    () => savedGame?.brandDealsAccepted ?? 0
  );

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

  const getReputationIncomeMultiplier = useCallback(
    () => reputationIncomeMultiplierFromRep(reputation),
    [reputation]
  );

  const calculatePassiveIncome = useCallback(() => {
    let totalCloutPerSecond = 0;

    influencers.forEach(influencer => {
      const type = influencerTypes.find(t => t.id === influencer.typeId);
      let cloutPerSecond = type.baseCloutPerSecond;

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
          }
        }
      });

      totalCloutPerSecond += cloutPerSecond;
    });

    return (
      totalCloutPerSecond *
      prestigeMultiplier *
      getFollowerCloutMult(followers) *
      getReputationIncomeMultiplier() *
      getGemCloutMult()
    );
  }, [
    influencers,
    buildings,
    prestigeMultiplier,
    followers,
    getReputationIncomeMultiplier,
    getGemCloutMult
  ]);

  const getClickClout = useCallback(() => {
    let flat = 1;
    let mult =
      prestigeMultiplier *
      getFollowerCloutMult(followers) *
      getReputationIncomeMultiplier() *
      getGemCloutMult();
    clickUpgradeTypes.forEach(u => {
      const level = clickUpgradeLevels[u.id] ?? 0;
      if (level === 0) return;
      if (u.kind === 'flat') flat += level * u.perLevel;
      else mult *= Math.pow(1 + u.perLevel, level);
    });
    return flat * mult;
  }, [
    prestigeMultiplier,
    followers,
    clickUpgradeLevels,
    getReputationIncomeMultiplier,
    getGemCloutMult
  ]);

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
    [clout, buildings, influencers, followers]
  );

  const acceptBrandDeal = useCallback(() => {
    if (!activeBrandDeal) return;

    const deal = brandDealTypes.find(d => d.id === activeBrandDeal.typeId);
    const reputationModifier = reputation / 100;
    const earnedClout =
      activeBrandDeal.cloutReward * reputationModifier * prestigeMultiplier * getGemCloutMult();
    const earnedFollowers = activeBrandDeal.followersReward;
    const reputationChange = activeBrandDeal.reputationChange;

    addCloutEarned(earnedClout);
    setFollowers(prev => prev + earnedFollowers);
    setReputation(prev => Math.max(0, Math.min(100, prev + reputationChange)));
    setBrandDealsAccepted(prev => prev + 1);

    addNotification(`Completed ${deal.name}! +${Math.floor(earnedClout)} Clout`, 'success');
    setActiveBrandDeal(null);
    setBrandDealCooldown(BRAND_DEAL_COOLDOWN_ACCEPT_MS);
  }, [
    activeBrandDeal,
    reputation,
    prestigeMultiplier,
    getGemCloutMult,
    addCloutEarned,
    addNotification
  ]);

  const prestige = useCallback(() => {
    if (runCloutEarned < PRESTIGE_RUN_CLOUT_THRESHOLD) return false;

    const newPrestigeCount = prestigeCount + 1;
    const newMultiplier = 1 + newPrestigeCount * 0.45;
    const newEra = Math.min(2, Math.floor(newPrestigeCount / 3));
    const prestigeGems = PRESTIGE_GEMS_BASE + Math.floor(newPrestigeCount / 4);

    setClout(0);
    setFollowers(0);
    setReputation(100);
    setInfluencers([]);
    setBuildings([]);
    setManagers([]);
    setActiveBrandDeal(null);
    setBrandDealCooldown(0);
    setTotalClicks(0);
    setRunCloutEarned(0);
    setClickUpgradeLevels({});

    setPrestigeCount(newPrestigeCount);
    setPrestigeMultiplier(newMultiplier);
    setCurrentEra(newEra);
    setGems(prev => prev + prestigeGems);

    addNotification(
      `Prestige ${newPrestigeCount}! +${prestigeGems} 💎 · ${prestigeEras[newEra].name}`,
      'prestige'
    );

    return true;
  }, [runCloutEarned, prestigeCount, addNotification]);

  const declineBrandDeal = useCallback(() => {
    if (!activeBrandDeal) return;

    const deal = brandDealTypes.find(d => d.id === activeBrandDeal.typeId);
    addNotification(deal ? `Passed on ${deal.name}` : 'Brand deal declined', 'info');
    setActiveBrandDeal(null);
    setBrandDealCooldown(BRAND_DEAL_COOLDOWN_DECLINE_MS);
  }, [activeBrandDeal]);

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
    [clout, clickUpgradeLevels]
  );

  const buyGemCloutStack = useCallback(() => {
    if (gemCloutMultStacks >= MAX_GEM_CLOUT_STACKS) {
      addNotification('Syndicate stacks maxed (6).', 'warning');
      return false;
    }
    if (gems < GEM_STACK_COST) {
      addNotification(`Need ${GEM_STACK_COST} 💎`, 'warning');
      return false;
    }
    setGems(g => g - GEM_STACK_COST);
    setGemCloutMultStacks(s => s + 1);
    addNotification(`Syndicate deal: +${GEM_STACK_BONUS * 100}% all Clout (permanent)`, 'success');
    return true;
  }, [gems, gemCloutMultStacks]);

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
  }, [gems, calculatePassiveIncome, addCloutEarned]);

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
        currentEra,
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
        achievementsUnlocked,
        brandDealsAccepted
      });
    }, 400);
    return () => clearTimeout(t);
  }, [
    clout,
    followers,
    reputation,
    currentEra,
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
    achievementsUnlocked,
    brandDealsAccepted
  ]);

  useEffect(() => {
    const snap = {
      totalClicks,
      influencers,
      buildings,
      runCloutEarned,
      lifetimeClout,
      prestigeCount,
      followers,
      brandDealsAccepted
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
    achievementsUnlocked
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const passiveCloutPerSecond = calculatePassiveIncome();
      const passiveCloutPerTick = (passiveCloutPerSecond * TICK_INTERVAL) / 1000;

      if (passiveCloutPerTick > 0) {
        addCloutEarned(passiveCloutPerTick);
      }

      if (influencers.length > 0) {
        const followerGrowth = (influencers.length * 0.0085 * TICK_INTERVAL) / 1000;
        setFollowers(prev => prev + followerGrowth);
      }

      if (brandDealCooldown > 0) {
        setBrandDealCooldown(prev => Math.max(0, prev - TICK_INTERVAL));
      }

      if (
        !activeBrandDeal &&
        brandDealCooldown === 0 &&
        Math.random() < BRAND_DEAL_SPAWN_CHANCE_PER_TICK * (0.4 + (reputation / 100) * 1.2)
      ) {
        const availableDeals = brandDealTypes.filter(deal => deal.requiredEra <= currentEra);

        if (availableDeals.length > 0) {
          const weightedDeals = availableDeals.map(deal => {
            const positiveFactor = deal.reputationChange >= 0 ? 1 : 0.5;
            const repQuality = 0.5 + (reputation / 100) * (deal.reputationChange >= 0 ? 1.0 : 0.32);
            return {
              deal,
              weight: Math.max(0.05, positiveFactor * repQuality)
            };
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

          const rewardQuality = 0.42 + (reputation / 100) * 1.45;
          const rewardVariance = 0.82 + Math.random() * 0.38;
          const followerDealQuality = 1 + Math.min(0.65, followers / 280000);
          const cloutMult = rewardQuality * rewardVariance * followerDealQuality;

          setActiveBrandDeal({
            typeId: picked.id,
            cloutReward: picked.baseCloutReward * cloutMult,
            followersReward: picked.baseFollowersReward * cloutMult * 0.95,
            reputationChange: picked.reputationChange,
            expiresAt: Date.now() + 15000
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
    currentEra,
    influencers.length,
    reputation,
    followers,
    addCloutEarned,
    addNotification
  ]);

  return {
    clout,
    followers,
    reputation,
    currentEra,
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
    passiveCloutPerSecond: calculatePassiveIncome(),
    clickCloutPerClick: getClickClout(),
    clickUpgradeLevels,
    reputationIncomeMultiplier: getReputationIncomeMultiplier(),
    gems,
    gemCloutMultStacks,
    maxGemCloutStacks: MAX_GEM_CLOUT_STACKS,
    achievementsUnlocked,
    achievementDefs,
    brandDealsAccepted,
    clickPostContent,
    hireInfluencer,
    placeBuilding,
    buyClickUpgrade,
    acceptBrandDeal,
    declineBrandDeal,
    prestige,
    buyGemCloutStack,
    buyCloutSurge,
    pullGacha,
    grantGemsFromPack,
    marketCloutInjection,
    gachaCosts: { single: GACHA_SINGLE_COST, multi: GACHA_MULTI_COST },
    gemEconomy: {
      stackCost: GEM_STACK_COST,
      surgeCost: CLOUT_SURGE_COST,
      stackBonus: GEM_STACK_BONUS
    },
    gemCloutMult: getGemCloutMult()
  };
};