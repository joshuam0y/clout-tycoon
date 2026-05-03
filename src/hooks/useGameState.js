import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  useMemo
} from 'react';
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
  brandDealOfferableAtReputation,
  reputationIncomeMultiplierFromRep,
  computeBrandDealPayouts,
  getBrandDealSeasonalWeightMult,
  AGENT_AUTO_ACCEPT_DELAY_MS,
  AGENT_MIN_REP_AFTER_DEAL,
  CLICK_OUTPUT_GLOBAL_MULT,
  INTERN_AUTO_POST_OUTPUT_MULT,
  INTERN_BASE_POSTS_PER_SEC,
  INTERN_STACKING_EXP,
  BASE_POST_CLOUT,
  CLOUT_PRICE_MULTIPLIER,
  PRESTIGE_MULT_PER_LEVEL,
  getMinPrestige
} from '../data/gameData';
import {
  scaledUnitCost,
  scaledBuildingPlacementCost,
  clickUpgradeNextCost,
  getFollowerCloutMult,
  getFollowerCostMult
} from '../utils/gameMath';
import {
  loadGameSnapshot,
  writeGameSnapshot,
  clearAllLocalGameData,
  markResetSaveGuard,
  clearResetSaveGuard,
  putNamedSave,
  getNamedSave,
  listNamedSaves,
  deleteNamedSave,
  sanitizeNamedSaveLabel,
  getActiveNamedSlot,
  setActiveNamedSlot,
  clearActiveNamedSlot,
  importNamedSaveFromExportJson
} from '../utils/persistence';
import { playPrestigeChime, playAchievementPing, playBrandDealAcceptChime } from '../utils/sound';
import { computePassiveIncomeSnapshot } from '../utils/computePassiveIncomeSnapshot';
import { formatNumber } from '../utils/formatNumber';

const TICK_INTERVAL = 100;
/** Backup active named slot on this interval while playing */
const NAMED_PROFILE_AUTOSAVE_MS = 5000;
const BRAND_DEAL_SPAWN_CHANCE_PER_TICK = 0.00052;
const BRAND_DEAL_COOLDOWN_ACCEPT_MS = 32000;
const BRAND_DEAL_COOLDOWN_DECLINE_MS = 22000;
const BRAND_DEAL_COOLDOWN_EXPIRE_MS = 20000;
const BRAND_DEAL_DURATION_MS = 20000;
const MAX_GEM_CLOUT_STACKS = 10;
const GEM_STACK_COST_BASE = Math.round(48 * CLOUT_PRICE_MULTIPLIER);
const GEM_STACK_COST_PER_OWNED = Math.round(14 * CLOUT_PRICE_MULTIPLIER);
const GEM_STACK_BONUS = 0.04;
const MAX_GEM_CLICK_STACKS = 12;
const GEM_CLICK_BONUS = 0.045;
const GEM_CLICK_COST_BASE = Math.round(38 * CLOUT_PRICE_MULTIPLIER);
const GEM_CLICK_COST_PER_OWNED = Math.round(12 * CLOUT_PRICE_MULTIPLIER);
const MAX_GEM_PASSIVE_STACKS = 12;
const GEM_PASSIVE_BONUS = 0.05;
const GEM_PASSIVE_COST_BASE = Math.round(44 * CLOUT_PRICE_MULTIPLIER);
const GEM_PASSIVE_COST_PER_OWNED = Math.round(11 * CLOUT_PRICE_MULTIPLIER);
const CLOUT_SURGE_COST = Math.round(25 * CLOUT_PRICE_MULTIPLIER);
const CLOUT_SURGE_SECONDS = 72;
const GACHA_SINGLE_COST = Math.round(85 * CLOUT_PRICE_MULTIPLIER);
const GACHA_MULTI_COST = Math.round(750 * CLOUT_PRICE_MULTIPLIER);
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
  const [namedSaveListTick, setNamedSaveListTick] = useState(0);
  const [activeProfileName, setActiveProfileName] = useState(() => getActiveNamedSlot());
  const [lastProfileSyncAt, setLastProfileSyncAt] = useState(null);

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

  const addNotification = useCallback((message, type = 'info', durationMs) => {
    const defaultMs =
      type === 'warning' ? 5200 : type === 'prestige' ? 5600 : type === 'success' ? 3800 : 3400;
    const ms = durationMs ?? defaultMs;
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      createdAt: Date.now()
    };

    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, ms);
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

  const passiveIncomeSnapshot = useMemo(
    () =>
      computePassiveIncomeSnapshot({
        influencers,
        buildings,
        managers,
        prestigeMultiplier,
        followers,
        reputation,
        gemCloutMult: 1 + gemCloutMultStacks * GEM_STACK_BONUS,
        gemPassiveMult: 1 + gemPassiveMultStacks * GEM_PASSIVE_BONUS,
        activeFrenzy,
        nowMs: Date.now()
      }),
    [
      influencers,
      buildings,
      managers,
      prestigeMultiplier,
      followers,
      reputation,
      gemCloutMultStacks,
      gemPassiveMultStacks,
      activeFrenzy
    ]
  );

  const calculatePassiveIncome = useCallback(
    () => passiveIncomeSnapshot.total,
    [passiveIncomeSnapshot]
  );

  const computePostClout = useCallback(
    applyClickFrenzy => {
      let flat = BASE_POST_CLOUT;
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
          mult *= Math.pow(1 + u.perLevel, level);
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
      const minP = getMinPrestige(type);
      if (prestigeCount < minP) {
        addNotification(`Requires prestige ${minP}+ (currently ${prestigeCount}).`, 'warning');
        return false;
      }
      const owned = influencers.filter(i => i.typeId === typeId).length;
      const rawCost = scaledUnitCost(type.cost, owned);
      const cost = Math.ceil(rawCost * getFollowerCostMult(followers));
      if (clout < cost) {
        addNotification(
          `Need ${formatNumber(cost)} Clout to hire (you have ${formatNumber(clout)}).`,
          'warning'
        );
        return false;
      }

      const influencerOccupied = influencers.some(
        influencer => influencer.position.x === position.x && influencer.position.y === position.y
      );
      if (influencerOccupied) {
        addNotification('That tile already has talent on it.', 'warning');
        return false;
      }

      const buildingOccupied = buildings.some(building =>
        doesBuildingCoverTile(building, position.x, position.y)
      );
      if (buildingOccupied) {
        addNotification('That tile is covered by a structure.', 'warning');
        return false;
      }

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
    [clout, influencers, buildings, followers, prestigeCount, addNotification]
  );

  const placeBuilding = useCallback(
    (typeId, position) => {
      const type = buildingTypes.find(t => t.id === typeId);
      if (!type) return false;
      const minP = getMinPrestige(type);
      if (prestigeCount < minP) {
        addNotification(`Requires prestige ${minP}+ (currently ${prestigeCount}).`, 'warning');
        return false;
      }
      const owned = buildings.filter(b => b.typeId === typeId).length;
      const rawCost = scaledBuildingPlacementCost(type.cost, owned, type.requiredEra ?? 0);
      const cost = Math.ceil(rawCost * getFollowerCostMult(followers));
      if (clout < cost) {
        addNotification(
          `Need ${formatNumber(cost)} Clout to build (you have ${formatNumber(clout)}).`,
          'warning'
        );
        return false;
      }

      for (let y = position.y; y < position.y + type.size; y++) {
        for (let x = position.x; x < position.x + type.size; x++) {
          const buildingOccupied = buildings.some(building => doesBuildingCoverTile(building, x, y));
          if (buildingOccupied) {
            addNotification('Footprint overlaps another structure.', 'warning');
            return false;
          }

          const influencerOccupied = influencers.some(
            influencer => influencer.position.x === x && influencer.position.y === y
          );
          if (influencerOccupied) {
            addNotification('Footprint overlaps talent — move them first.', 'warning');
            return false;
          }
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
    [clout, buildings, influencers, followers, prestigeCount, addNotification]
  );

  const buyManager = useCallback(
    typeId => {
      const def = managerTypes.find(m => m.id === typeId);
      if (!def) return false;
      const minP = getMinPrestige(def);
      if (prestigeCount < minP) {
        addNotification(`Requires prestige ${minP}+ (currently ${prestigeCount}).`, 'warning');
        return false;
      }
      const owned = managers.filter(m => m.typeId === typeId).length;
      const rawCost = scaledUnitCost(def.cost, owned);
      const cost = Math.ceil(rawCost * getFollowerCostMult(followers));
      if (clout < cost) {
        addNotification(
          `Need ${formatNumber(cost)} Clout to hire (you have ${formatNumber(clout)}).`,
          'warning'
        );
        return false;
      }
      setClout(c => c - cost);
      setManagers(prev => [...prev, { id: Date.now() + Math.random(), typeId }]);
      addNotification(`Hired ${def.name}!`, 'success');
      return true;
    },
    [clout, managers, followers, prestigeCount, addNotification]
  );

  const acceptBrandDeal = useCallback(() => {
    if (!activeBrandDeal) return;

    const deal = brandDealTypes.find(d => d.id === activeBrandDeal.typeId);
    if (!deal) return;

    if (!brandDealOfferableAtReputation(deal, reputation)) {
      addNotification('At 100% reputation, image-only sponsor deals are unavailable.', 'warning');
      setActiveBrandDeal(null);
      setBrandDealCooldown(BRAND_DEAL_COOLDOWN_DECLINE_MS);
      return;
    }

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
      `Completed ${deal.name}! +${formatNumber(Math.floor(earnedClout))} Clout · +${formatNumber(Math.floor(followerGain))} followers`,
      'success'
    );
    playBrandDealAcceptChime();
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
    addNotification,
    reputation
  ]);

  useEffect(() => {
    const onOffline = () =>
      addNotification('Browser went offline — saves may not sync until you reconnect.', 'warning');
    const onOnline = () => addNotification('Back online.', 'success');
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [addNotification]);

  const prestige = useCallback(() => {
    const required = getPrestigeRunCloutRequired(prestigeCount);
    if (runCloutEarned < required) {
      addNotification(
        `Need ${formatNumber(required)} run Clout to prestige (have ${formatNumber(Math.floor(runCloutEarned))}).`,
        'info'
      );
      return false;
    }

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
      const minP = getMinPrestige(def);
      if (prestigeCount < minP) {
        addNotification(`Requires prestige ${minP}+ (currently ${prestigeCount}).`, 'warning');
        return false;
      }

      const level = clickUpgradeLevels[upgradeId] ?? 0;
      const cost = clickUpgradeNextCost(def, level);
      if (clout < cost) {
        addNotification(
          `Need ${formatNumber(cost)} Clout for this upgrade (you have ${formatNumber(clout)}).`,
          'warning'
        );
        return false;
      }

      setClout(prev => prev - cost);
      setClickUpgradeLevels(prev => ({ ...prev, [upgradeId]: level + 1 }));
      addNotification(`${def.name} → Lv.${level + 1}`, 'success');
      return true;
    },
    [clout, clickUpgradeLevels, prestigeCount, addNotification]
  );

  const buyGemCloutStack = useCallback(() => {
    if (gemCloutMultStacks >= MAX_GEM_CLOUT_STACKS) {
      addNotification(`Syndicate stacks maxed (${MAX_GEM_CLOUT_STACKS}).`, 'warning');
      return false;
    }
    const cost = GEM_STACK_COST_BASE + gemCloutMultStacks * GEM_STACK_COST_PER_OWNED;
    if (gems < cost) {
      addNotification(`Need ${formatNumber(cost)} 💎`, 'warning');
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
      addNotification(`Need ${formatNumber(cost)} 💎`, 'warning');
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
      addNotification(`Need ${formatNumber(cost)} 💎`, 'warning');
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
      addNotification(`Need ${formatNumber(CLOUT_SURGE_COST)} 💎`, 'warning');
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
        addNotification(`Need ${formatNumber(cost)} 💎`, 'warning');
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
          ? `10× Viral Drop (−${formatNumber(cost)} 💎): +${formatNumber(Math.floor(total))} Clout`
          : `Viral Drop (−${formatNumber(cost)} 💎): +${formatNumber(Math.floor(total))} Clout`,
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
        addNotification(`Need ${formatNumber(gemCost)} 💎`, 'warning');
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
      addNotification(`Achievement: ${def.name} (+${formatNumber(def.gemReward)} 💎)`, 'success');
      playAchievementPing();
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
        const cps = INTERN_BASE_POSTS_PER_SEC * Math.pow(internN, INTERN_STACKING_EXP);
        internClickRemainderRef.current += (cps * TICK_INTERVAL) / 1000;
        while (internClickRemainderRef.current >= 1) {
          internClickRemainderRef.current -= 1;
          const earned = getInternAutoClickClout();
          addCloutEarned(earned);
          if (Math.random() < 0.07) {
            setFollowers(f => f + 1);
          }
        }
      }

      if (activeBrandDeal && managers.some(m => m.typeId === 'agent')) {
        const startedAt = activeBrandDeal.startedAt ?? now - BRAND_DEAL_DURATION_MS;
        if (now - startedAt >= AGENT_AUTO_ACCEPT_DELAY_MS) {
          const dealType = brandDealTypes.find(d => d.id === activeBrandDeal.typeId);
          if (dealType && brandDealOfferableAtReputation(dealType, reputation)) {
            const repDelta = dealType.reputationDelta ?? 0;
            const projectedRep = Math.max(0, Math.min(100, reputation + repDelta));
            if (projectedRep >= AGENT_MIN_REP_AFTER_DEAL) {
              const fn = acceptBrandDealRef.current;
              if (typeof fn === 'function') fn();
            }
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
        const availableDeals = brandDealTypes.filter(d => brandDealOfferableAtReputation(d, reputation));

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

  const namedSaveSlots = useMemo(() => listNamedSaves(), [namedSaveListTick]);

  const buildCurrentSnapshot = useCallback(
    () => ({
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
    }),
    [
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
    ]
  );

  const buildCurrentSnapshotRef = useRef(buildCurrentSnapshot);
  buildCurrentSnapshotRef.current = buildCurrentSnapshot;

  /** Tab close / switch — persist immediately (debounced save may not have fired yet). */
  useEffect(() => {
    const persistNow = () => {
      const snap = buildCurrentSnapshotRef.current?.();
      if (snap) writeGameSnapshot(snap);
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') persistNow();
    };
    window.addEventListener('pagehide', persistNow);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', persistNow);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    if (!activeProfileName) return;
    const name = activeProfileName;
    const tick = () => {
      if (putNamedSave(name, buildCurrentSnapshotRef.current())) {
        setLastProfileSyncAt(Date.now());
        setNamedSaveListTick(t => t + 1);
      }
    };
    tick();
    const id = window.setInterval(tick, NAMED_PROFILE_AUTOSAVE_MS);
    return () => clearInterval(id);
  }, [activeProfileName]);

  const clearProfileBackup = useCallback(() => {
    clearActiveNamedSlot();
    setActiveProfileName('');
    setLastProfileSyncAt(null);
  }, []);

  const saveGameNamed = useCallback(
    label => {
      const name = sanitizeNamedSaveLabel(label);
      if (!name) {
        addNotification('Type a name for this save first.', 'warning');
        return false;
      }
      const snap = buildCurrentSnapshot();
      if (!putNamedSave(name, snap)) {
        addNotification('Could not save (browser storage full or blocked).', 'warning');
        return false;
      }
      const mainOk = writeGameSnapshot(snap);
      setActiveNamedSlot(name);
      setActiveProfileName(name);
      setLastProfileSyncAt(Date.now());
      addNotification(
        mainOk
          ? `Profile “${name}” saved — session file updated; auto-backup every few seconds.`
          : `Profile “${name}” stored, but this browser blocked updating the live session file (private mode or storage full).`,
        mainOk ? 'success' : 'warning'
      );
      setNamedSaveListTick(t => t + 1);
      return true;
    },
    [buildCurrentSnapshot, addNotification]
  );

  const loadGameNamed = useCallback(
    label => {
      const name = sanitizeNamedSaveLabel(label);
      if (!name) {
        addNotification('Pick a saved game name to load.', 'warning');
        return false;
      }
      const snap = getNamedSave(name);
      if (!snap) {
        addNotification(`No save named “${name}” found.`, 'warning');
        return false;
      }
      setActiveNamedSlot(name);
      writeGameSnapshot(snap);
      markResetSaveGuard();
      addNotification('Loading your agency…', 'success');
      window.setTimeout(() => window.location.reload(), 100);
      return true;
    },
    [addNotification]
  );

  const deleteNamedSaveSlot = useCallback(
    label => {
      const name = sanitizeNamedSaveLabel(label);
      if (!name) return false;
      if (!deleteNamedSave(name)) {
        addNotification('Could not delete that save.', 'warning');
        return false;
      }
      if (name === activeProfileName) {
        clearActiveNamedSlot();
        setActiveProfileName('');
        setLastProfileSyncAt(null);
      }
      addNotification(`Deleted “${name}”.`, 'success');
      setNamedSaveListTick(t => t + 1);
      return true;
    },
    [addNotification, activeProfileName]
  );

  const importNamedSaveJson = useCallback(
    text => {
      const result = importNamedSaveFromExportJson(text);
      if (!result.ok) {
        addNotification(result.error ?? 'Import failed.', 'warning');
        return false;
      }
      addNotification(`Imported profile “${result.name}”. Load it from Manage saves when ready.`, 'success');
      setNamedSaveListTick(t => t + 1);
      return true;
    },
    [addNotification]
  );

  const resetAllLocalProgress = useCallback(() => {
    markResetSaveGuard();
    clearActiveNamedSlot();
    clearAllLocalGameData();
    window.location.reload();
  }, []);

  useLayoutEffect(() => {
    clearResetSaveGuard();
  }, []);

  useLayoutEffect(() => {
    acceptBrandDealRef.current = acceptBrandDeal;
  }, [acceptBrandDeal]);

  useEffect(() => {
    const devToolsOn =
      import.meta.env.DEV ||
      import.meta.env.VITE_CT_DEV_TOOLS === 'true' ||
      import.meta.env.VITE_CT_DEV_TOOLS === '1';
    if (!devToolsOn) return undefined;
    const api = {
      setClout: n => setClout(Math.max(0, Math.floor(Number(n) || 0))),
      addClout: n => setClout(prev => prev + Math.max(0, Math.floor(Number(n) || 0))),
      /** Enough Clout to buy any single shop line in practice */
      unlimitedClout: () => setClout(Number.MAX_SAFE_INTEGER),
      setGems: n => setGems(Math.max(0, Math.floor(Number(n) || 0))),
      addGems: n => setGems(prev => prev + Math.max(0, Math.floor(Number(n) || 0))),
      maxCloutAndGems: () => {
        setClout(Number.MAX_SAFE_INTEGER);
        setGems(Number.MAX_SAFE_INTEGER);
      },
      help: () =>
        console.info(
          '[clout-tycoon dev] __CT_DEV__: addClout(1e15), setClout(n), unlimitedClout(), setGems(n), addGems(9999), maxCloutAndGems()'
        )
    };
    window.__CT_DEV__ = api;
    console.info(
      '[clout-tycoon] Test cheats on window.__CT_DEV__ — __CT_DEV__.help() (enable on Vercel: env VITE_CT_DEV_TOOLS=true)'
    );
    return () => {
      delete window.__CT_DEV__;
    };
  }, [setClout, setGems]);

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
    passiveByTalentType: passiveIncomeSnapshot.passiveByTalentType,
    passiveByInfluencerId: passiveIncomeSnapshot.passiveByInfluencerId,
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
    namedSaveSlots,
    activeProfileName,
    lastProfileSyncAt,
    saveGameNamed,
    loadGameNamed,
    deleteNamedSaveSlot,
    importNamedSaveJson,
    clearProfileBackup,
    resetAllLocalProgress
  };
};