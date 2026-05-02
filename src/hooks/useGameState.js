import { useState, useEffect, useCallback } from 'react';
import {
  influencerTypes,
  buildingTypes,
  brandDealTypes,
  prestigeEras,
  clickUpgradeTypes
} from '../data/gameData';
import { scaledUnitCost, clickUpgradeNextCost } from '../utils/gameMath';
import { loadGameSnapshot, writeGameSnapshot } from '../utils/persistence';

const TICK_INTERVAL = 100; // 100ms tick rate for smooth 60fps
const GRID_SIZE = 20;

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

export const useGameState = () => {
  // Core resources
  const [clout, setClout] = useState(() => savedGame?.clout ?? 0);
  const [followers, setFollowers] = useState(() => savedGame?.followers ?? 0);
  const [reputation, setReputation] = useState(() => savedGame?.reputation ?? 100);

  // Game progression
  const [currentEra, setCurrentEra] = useState(() => savedGame?.currentEra ?? 0);
  const [prestigeCount, setPrestigeCount] = useState(() => savedGame?.prestigeCount ?? 0);
  const [prestigeMultiplier, setPrestigeMultiplier] = useState(() => savedGame?.prestigeMultiplier ?? 1);

  // Entities
  const [influencers, setInfluencers] = useState(() => savedGame?.influencers ?? []);
  const [buildings, setBuildings] = useState(() => savedGame?.buildings ?? []);
  const [managers, setManagers] = useState(() => savedGame?.managers ?? []);

  // Active events
  const [activeBrandDeal, setActiveBrandDeal] = useState(null);
  const [brandDealCooldown, setBrandDealCooldown] = useState(() => savedGame?.brandDealCooldown ?? 0);

  // UI state
  const [selectedTool, setSelectedTool] = useState(null); // 'influencer' or 'building' + type
  const [notifications, setNotifications] = useState([]);

  // Stats
  const [totalClicks, setTotalClicks] = useState(() => savedGame?.totalClicks ?? 0);
  const [lifetimeClout, setLifetimeClout] = useState(() => savedGame?.lifetimeClout ?? 0);

  const [clickUpgradeLevels, setClickUpgradeLevels] = useState(
    () => savedGame?.clickUpgradeLevels ?? {}
  );

  const getClickClout = useCallback(() => {
    let flat = 1;
    let mult = prestigeMultiplier * (1 + followers / 10000);
    clickUpgradeTypes.forEach(u => {
      const level = clickUpgradeLevels[u.id] ?? 0;
      if (level === 0) return;
      if (u.kind === 'flat') flat += level * u.perLevel;
      else mult *= Math.pow(1 + u.perLevel, level);
    });
    return flat * mult;
  }, [prestigeMultiplier, followers, clickUpgradeLevels]);

  // Manual click to earn clout
  const clickPostContent = useCallback(() => {
    const earnedClout = getClickClout();

    setClout(prev => prev + earnedClout);
    setLifetimeClout(prev => prev + earnedClout);
    setTotalClicks(prev => prev + 1);

    // Small chance to gain followers on click
    if (Math.random() < 0.1) {
      setFollowers(prev => prev + 1);
    }
  }, [getClickClout]);

  // Hire an influencer
  const hireInfluencer = useCallback((typeId, position) => {
    const type = influencerTypes.find(t => t.id === typeId);
    if (!type) return false;
    const owned = influencers.filter(i => i.typeId === typeId).length;
    const cost = scaledUnitCost(type.cost, owned);
    if (clout < cost) return false;

    const isOutOfBounds =
      position.x < 0 ||
      position.y < 0 ||
      position.x >= GRID_SIZE ||
      position.y >= GRID_SIZE;
    if (isOutOfBounds) return false;

    // Prevent placing influencers on top of each other
    const influencerOccupied = influencers.some(influencer =>
      influencer.position.x === position.x && influencer.position.y === position.y
    );
    if (influencerOccupied) return false;

    // Prevent placing influencers inside building footprints
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
  }, [clout, influencers, buildings]);

  // Build a structure
  const placeBuilding = useCallback((typeId, position) => {
    const type = buildingTypes.find(t => t.id === typeId);
    if (!type) return false;
    const owned = buildings.filter(b => b.typeId === typeId).length;
    const cost = scaledUnitCost(type.cost, owned);
    if (clout < cost) return false;

    const isOutOfBounds =
      position.x < 0 ||
      position.y < 0 ||
      position.x + type.size > GRID_SIZE ||
      position.y + type.size > GRID_SIZE;
    if (isOutOfBounds) return false;

    // Check every tile in the building footprint for collisions
    for (let y = position.y; y < position.y + type.size; y++) {
      for (let x = position.x; x < position.x + type.size; x++) {
        const buildingOccupied = buildings.some(building =>
          doesBuildingCoverTile(building, x, y)
        );
        if (buildingOccupied) return false;

        const influencerOccupied = influencers.some(influencer =>
          influencer.position.x === x && influencer.position.y === y
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
  }, [clout, buildings, influencers]);

  // Accept a brand deal
  const acceptBrandDeal = useCallback(() => {
    if (!activeBrandDeal) return;

    const deal = brandDealTypes.find(d => d.id === activeBrandDeal.typeId);
    const reputationModifier = reputation / 100;
    const earnedClout = activeBrandDeal.cloutReward * reputationModifier * prestigeMultiplier;
    const earnedFollowers = activeBrandDeal.followersReward;
    const reputationChange = activeBrandDeal.reputationChange;

    setClout(prev => prev + earnedClout);
    setLifetimeClout(prev => prev + earnedClout);
    setFollowers(prev => prev + earnedFollowers);
    setReputation(prev => Math.max(0, Math.min(100, prev + reputationChange)));

    addNotification(`Completed ${deal.name}! +${Math.floor(earnedClout)} Clout`, 'success');
    setActiveBrandDeal(null);
    setBrandDealCooldown(10000); // 10 second cooldown
  }, [activeBrandDeal, reputation, prestigeMultiplier]);

  // Prestige (reset with bonuses)
  const prestige = useCallback(() => {
    if (lifetimeClout < 100000) return false;

    const newPrestigeCount = prestigeCount + 1;
    const newMultiplier = 1 + (newPrestigeCount * 0.5); // +50% per prestige
    const newEra = Math.min(2, Math.floor(newPrestigeCount / 3)); // New era every 3 prestiges

    // Reset everything except prestige bonuses
    setClout(0);
    setFollowers(0);
    setReputation(100);
    setInfluencers([]);
    setBuildings([]);
    setManagers([]);
    setActiveBrandDeal(null);
    setBrandDealCooldown(0);
    setTotalClicks(0);
    setLifetimeClout(0);
    setClickUpgradeLevels({});

    // Apply prestige bonuses
    setPrestigeCount(newPrestigeCount);
    setPrestigeMultiplier(newMultiplier);
    setCurrentEra(newEra);

    addNotification(`Prestige ${newPrestigeCount}! Entered ${prestigeEras[newEra].name}`, 'prestige');

    return true;
  }, [lifetimeClout, prestigeCount]);

  // Calculate passive income
  const calculatePassiveIncome = useCallback(() => {
    let totalCloutPerSecond = 0;

    influencers.forEach(influencer => {
      const type = influencerTypes.find(t => t.id === influencer.typeId);
      let cloutPerSecond = type.baseCloutPerSecond;

      // Check for nearby buildings that boost output
      buildings.forEach(building => {
        const buildingType = buildingTypes.find(t => t.id === building.typeId);
        if (buildingType.effect === 'multiply') {
          const distance = Math.abs(building.position.x - influencer.position.x) +
                          Math.abs(building.position.y - influencer.position.y);
          if (distance <= buildingType.range) {
            cloutPerSecond *= buildingType.multiplier;
          }
        }
      });

      totalCloutPerSecond += cloutPerSecond;
    });

    return totalCloutPerSecond * prestigeMultiplier * (1 + followers / 100000);
  }, [influencers, buildings, prestigeMultiplier, followers]);

  // Add notification
  const addNotification = useCallback((message, type = 'info') => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      createdAt: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 3000);
  }, []);

  const declineBrandDeal = useCallback(() => {
    if (!activeBrandDeal) return;

    const deal = brandDealTypes.find(d => d.id === activeBrandDeal.typeId);
    addNotification(deal ? `Passed on ${deal.name}` : 'Brand deal declined', 'info');
    setActiveBrandDeal(null);
    setBrandDealCooldown(5000);
  }, [activeBrandDeal, addNotification]);

  const buyClickUpgrade = useCallback((upgradeId) => {
    const def = clickUpgradeTypes.find(u => u.id === upgradeId);
    if (!def) return false;

    const level = clickUpgradeLevels[upgradeId] ?? 0;
    const cost = clickUpgradeNextCost(def, level);
    if (clout < cost) return false;

    setClout(prev => prev - cost);
    setClickUpgradeLevels(prev => ({ ...prev, [upgradeId]: level + 1 }));
    addNotification(`${def.name} → Lv.${level + 1}`, 'success');
    return true;
  }, [clout, clickUpgradeLevels, addNotification]);

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
        clickUpgradeLevels,
        brandDealCooldown
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
    clickUpgradeLevels,
    brandDealCooldown
  ]);

  // Main game tick (100ms)
  useEffect(() => {
    const interval = setInterval(() => {
      // Calculate and apply passive income
      const passiveCloutPerSecond = calculatePassiveIncome();
      const passiveCloutPerTick = (passiveCloutPerSecond * TICK_INTERVAL) / 1000;

      if (passiveCloutPerTick > 0) {
        setClout(prev => prev + passiveCloutPerTick);
        setLifetimeClout(prev => prev + passiveCloutPerTick);
      }

      // Passive follower growth based on influencer count
      if (influencers.length > 0) {
        const followerGrowth = (influencers.length * 0.01 * TICK_INTERVAL) / 1000;
        setFollowers(prev => prev + followerGrowth);
      }

      // Brand deal cooldown
      if (brandDealCooldown > 0) {
        setBrandDealCooldown(prev => Math.max(0, prev - TICK_INTERVAL));
      }

      // Spawn brand deals
      if (!activeBrandDeal && brandDealCooldown === 0 && Math.random() < 0.01) {
        const availableDeals = brandDealTypes.filter(deal =>
          deal.requiredEra <= currentEra
        );

        if (availableDeals.length > 0) {
          const randomDeal = availableDeals[Math.floor(Math.random() * availableDeals.length)];
          const reputationMod = 0.5 + (reputation / 100);

          setActiveBrandDeal({
            typeId: randomDeal.id,
            cloutReward: randomDeal.baseCloutReward * (1 + Math.random()),
            followersReward: randomDeal.baseFollowersReward,
            reputationChange: randomDeal.reputationChange,
            expiresAt: Date.now() + 15000 // 15 seconds to accept
          });
        }
      }

      // Expire brand deals
      if (activeBrandDeal && Date.now() > activeBrandDeal.expiresAt) {
        setActiveBrandDeal(null);
        setBrandDealCooldown(5000); // 5 second cooldown on expiry
        addNotification('Brand deal expired!', 'warning');
      }
    }, TICK_INTERVAL);

    return () => clearInterval(interval);
  }, [calculatePassiveIncome, brandDealCooldown, activeBrandDeal, currentEra, influencers.length, reputation, addNotification]);

  return {
    // Resources
    clout,
    followers,
    reputation,

    // Progression
    currentEra,
    prestigeCount,
    prestigeMultiplier,

    // Entities
    influencers,
    buildings,
    managers,

    // Events
    activeBrandDeal,

    // UI
    selectedTool,
    setSelectedTool,
    notifications,

    // Stats
    totalClicks,
    lifetimeClout,
    passiveCloutPerSecond: calculatePassiveIncome(),
    clickCloutPerClick: getClickClout(),
    clickUpgradeLevels,

    // Actions
    clickPostContent,
    hireInfluencer,
    placeBuilding,
    buyClickUpgrade,
    acceptBrandDeal,
    declineBrandDeal,
    prestige
  };
};
