/** Per-unit price scaling (Cookie Clicker–style): each copy costs this much more */
export const UNIT_PRICE_GROWTH = 1.215;

/**
 * This-run Clout needed to prestige — base for first run; scales up each time you prestige.
 * completedPrestigeCount = current prestigeCount (0 before first prestige, 1 after first, …).
 */
export const PRESTIGE_RUN_CLOUT_BASE = 560000;
/** Linear compound per prestige (multiplies per completed prestige index). */
export const PRESTIGE_RUN_CLOUT_SCALE_PER_PRESTIGE = 1.24;
/** Extra compounding on n² — makes late prestiges much more expensive. */
export const PRESTIGE_RUN_CLOUT_SUPER_EXP = 1.017;

export function getPrestigeRunCloutRequired(completedPrestigeCount) {
  const n = Math.max(0, Math.floor(completedPrestigeCount ?? 0));
  const raw =
    PRESTIGE_RUN_CLOUT_BASE *
    Math.pow(PRESTIGE_RUN_CLOUT_SCALE_PER_PRESTIGE, n) *
    Math.pow(PRESTIGE_RUN_CLOUT_SUPER_EXP, n * n);
  return Math.min(Number.MAX_SAFE_INTEGER, Math.floor(raw));
}

/** @deprecated use getPrestigeRunCloutRequired(0) */
export const PRESTIGE_RUN_CLOUT_THRESHOLD = getPrestigeRunCloutRequired(0);

/** Minimum lifetime Clout before brand deals can ever roll (proves basic engagement). */
export const BRAND_DEALS_MIN_LIFETIME_CLOUT = 2200;

/** Usually need this many influencers hired (deals = brand attention on a roster). */
export const BRAND_DEALS_MIN_INFLUENCERS = 2;

/** Solo path: one creator + at least one building + higher lifetime Clout. */
export const BRAND_DEALS_SOLO_MIN_INFLUENCERS = 1;
export const BRAND_DEALS_SOLO_MIN_BUILDINGS = 1;
export const BRAND_DEALS_SOLO_MIN_LIFETIME_CLOUT = 7800;

/**
 * Fair unlock: lifetime gate + (roster depth OR proven grid + higher lifetime).
 * Prevents deals before the player has placed talent / structure meaningfully.
 */
export function brandDealsMaySpawn(lifetimeClout, influencerCount, buildingCount) {
  if (lifetimeClout < BRAND_DEALS_MIN_LIFETIME_CLOUT) return false;
  if (influencerCount >= BRAND_DEALS_MIN_INFLUENCERS) return true;
  if (
    influencerCount >= BRAND_DEALS_SOLO_MIN_INFLUENCERS &&
    buildingCount >= BRAND_DEALS_SOLO_MIN_BUILDINGS &&
    lifetimeClout >= BRAND_DEALS_SOLO_MIN_LIFETIME_CLOUT
  ) {
    return true;
  }
  return false;
}

/** Base gems awarded each prestige (bonus scales slightly with prestige depth) */
export const PRESTIGE_GEMS_BASE = 1;

/** Scales passive + “Post Content” output. At 100% reputation this is ×1 (HUD reads 100%). */
export const REPUTATION_INCOME_MULT_MIN = 0.55;
export const REPUTATION_INCOME_MULT_MAX = 1.0;

export function reputationIncomeMultiplierFromRep(reputation) {
  const rep = Math.max(0, Math.min(100, reputation));
  const n = rep / 100;
  return REPUTATION_INCOME_MULT_MIN + n * (REPUTATION_INCOME_MULT_MAX - REPUTATION_INCOME_MULT_MIN);
}

export const achievementDefs = [
  { id: 'first_click', name: 'First Post', gemReward: 1, description: 'Tap Post Content once.' },
  { id: 'first_influencer', name: 'Talent Scout', gemReward: 2, description: 'Hire your first influencer.' },
  { id: 'first_building', name: 'Groundbreaking', gemReward: 2, description: 'Place your first structure.' },
  { id: 'ten_k_run', name: 'Trending', gemReward: 3, description: 'Earn 10,000 clout in a single run.' },
  { id: 'hundred_k_life', name: 'Household Name', gemReward: 5, description: 'Reach 100,000 lifetime clout.' },
  { id: 'million_life', name: 'Main Character', gemReward: 10, description: 'Reach 1,000,000 lifetime clout.' },
  { id: 'first_prestige', name: 'Reboot', gemReward: 5, description: 'Prestige once.' },
  { id: 'five_prestige', name: 'Season Finale', gemReward: 15, description: 'Reach prestige level 5.' },
  { id: 'followers_10k', name: 'Verified Energy', gemReward: 4, description: 'Reach 10,000 followers.' },
  { id: 'deal_master', name: 'Brand Whisperer', gemReward: 3, description: 'Accept 25 brand deals (this save).' }
];

// Influencer types — cost and output climb sharply at the top tiers
export const influencerTypes = [
  {
    id: 'pet',
    name: 'Petfluencer',
    description:
      'Short clips, huge heart — starter passive. Synergy: ×1.06 near Creator Desk.',
    cost: 32,
    baseCloutPerSecond: 0.22,
    color: '#88ffcc',
    icon: '🐾',
    requiredEra: 0
  },
  {
    id: 'nano',
    name: 'Nano Creator',
    description:
      'Hyper-local, hyper-loyal — slow but cheap. Synergy: ×1.06 near Creator Desk.',
    cost: 52,
    baseCloutPerSecond: 0.36,
    color: '#66ffee',
    icon: '✨',
    requiredEra: 0
  },
  {
    id: 'micro',
    name: 'Micro Influencer',
    description: 'Just starting out, but authentic.',
    cost: 88,
    baseCloutPerSecond: 0.48,
    color: '#00ffff',
    icon: '🌟',
    requiredEra: 0
  },
  {
    id: 'foodie',
    name: 'Food Reviewer',
    description:
      'Local spots and reaction takes. Synergy: ×1.09 near Ring Light Bay.',
    cost: 185,
    baseCloutPerSecond: 0.78,
    color: '#ffaa66',
    icon: '🍜',
    requiredEra: 0
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle Blogger',
    description:
      'Daily vlogs and aesthetic posts. Synergy: ×1.11 near Digital Billboard.',
    cost: 380,
    baseCloutPerSecond: 1.75,
    color: '#ff00ff',
    icon: '📸',
    requiredEra: 0
  },
  {
    id: 'coach',
    name: 'Fitness Coach',
    description:
      'Programs, check-ins, steady audience. Synergy: ×1.08 near Green Screen Booth.',
    cost: 620,
    baseCloutPerSecond: 2.35,
    color: '#66ff66',
    icon: '💪',
    requiredEra: 0
  },
  {
    id: 'gamer',
    name: 'Gaming Streamer',
    description:
      'Live streams and gaming content. Synergy: ×1.13 near Server Rack.',
    cost: 1350,
    baseCloutPerSecond: 4.2,
    color: '#00ff00',
    icon: '🎮',
    requiredEra: 1
  },
  {
    id: 'viral',
    name: 'Viral Sensations',
    description:
      'Trend-jacking masters. Synergy: ×1.15 near PR War Room.',
    cost: 4100,
    baseCloutPerSecond: 13,
    color: '#ffff00',
    icon: '⚡',
    requiredEra: 1
  },
  {
    id: 'dj',
    name: 'DJ Creator',
    description:
      'Club streams and remix drops — ×1.22 synergy near Content Studio when in range.',
    cost: 9200,
    baseCloutPerSecond: 22,
    color: '#ff66dd',
    icon: '🎧',
    requiredEra: 1
  },
  {
    id: 'podcast',
    name: 'Podcast Host',
    description:
      'Long-form takes — steady clout. Synergy: ×1.17 near Podcast Nook.',
    cost: 17500,
    baseCloutPerSecond: 32,
    color: '#cc88ff',
    icon: '🎙️',
    requiredEra: 1
  },
  {
    id: 'vtuber',
    name: 'VTuber Star',
    description:
      'Motion-capture persona — huge parasocial pull. Synergy: ×1.21 near Satellite Relay.',
    cost: 52000,
    baseCloutPerSecond: 95,
    color: '#99eeff',
    icon: '🎭',
    requiredEra: 1
  },
  {
    id: 'ai',
    name: 'AI Influencer',
    description: 'Generated perfection, endless content.',
    cost: 165000,
    baseCloutPerSecond: 420,
    color: '#ff0080',
    icon: '🤖',
    requiredEra: 2
  },
  {
    id: 'celebrity',
    name: 'Red Carpet Talent',
    description:
      'Agency rates go through the roof. Synergy: ×1.23 near Agency HQ Tower.',
    cost: 620000,
    baseCloutPerSecond: 1650,
    color: '#ffd700',
    icon: '🌟',
    requiredEra: 2
  },
  {
    id: 'mogul',
    name: 'Media Mogul',
    description:
      'Owns feeds and franchises. Synergy: ×1.28 near Fan Fest Arena.',
    cost: 5200000,
    baseCloutPerSecond: 12000,
    color: '#ffaa00',
    icon: '👑',
    requiredEra: 2
  },
  {
    id: 'world_icon',
    name: 'World Icon',
    description:
      'Planetary reach — absurd passive if you can afford them. Synergy: ×1.35 near Quantum Stage.',
    cost: 42000000,
    baseCloutPerSecond: 85000,
    color: '#ffffff',
    icon: '🌍',
    requiredEra: 2
  }
];

// Building types — footprint, Manhattan buff radius (from footprint edge), base multiplier
export const buildingTypes = [
  {
    id: 'desk',
    name: 'Creator Desk',
    description:
      'Basic setup — small buff to adjacent talent. Synergy: extra ×1.06 with Nano Creator / Petfluencer in range.',
    cost: 145,
    effect: 'multiply',
    multiplier: 1.45,
    range: 1,
    color: '#0088ff',
    icon: '💻',
    size: 1,
    requiredEra: 0
  },
  {
    id: 'ringlight',
    name: 'Ring Light Bay',
    description:
      'Soft light — wider reach. Synergy: extra ×1.09 with Food Reviewer in range.',
    cost: 310,
    effect: 'multiply',
    multiplier: 1.36,
    range: 2,
    color: '#ffee88',
    icon: '💡',
    size: 1,
    requiredEra: 0
  },
  {
    id: 'greenscreen',
    name: 'Green Screen Booth',
    description:
      'Cheap effects workflow — tight radius. Synergy: extra ×1.08 with Fitness Coach in range.',
    cost: 440,
    effect: 'multiply',
    multiplier: 1.3,
    range: 1,
    color: '#44ff99',
    icon: '🟩',
    size: 1,
    requiredEra: 0
  },
  {
    id: 'studio',
    name: 'Content Studio',
    description:
      'Professional production — pairing bonus ×1.22 with DJ Creator when they’re in range.',
    cost: 780,
    effect: 'multiply',
    multiplier: 1.95,
    range: 2,
    color: '#ff0088',
    icon: '🎬',
    size: 2,
    requiredEra: 0
  },
  {
    id: 'podcast_nook',
    name: 'Podcast Nook',
    description:
      'Sound-treated corner. Synergy: extra ×1.17 with Podcast Host in range.',
    cost: 920,
    effect: 'multiply',
    multiplier: 1.44,
    range: 2,
    color: '#c9a0ff',
    icon: '📻',
    size: 1,
    requiredEra: 0
  },
  {
    id: 'server',
    name: 'Server Rack',
    description:
      'Data and ingest. Synergy: extra ×1.13 with Gaming Streamer in range.',
    cost: 3200,
    effect: 'multiply',
    multiplier: 2.38,
    range: 3,
    color: '#00ff88',
    icon: '🖥️',
    size: 1,
    requiredEra: 1
  },
  {
    id: 'warroom',
    name: 'PR War Room',
    description:
      'Crisis cell — boosts viral plays. Synergy: extra ×1.15 with Viral Sensations in range.',
    cost: 14500,
    effect: 'multiply',
    multiplier: 2.88,
    range: 4,
    color: '#ff8800',
    icon: '📡',
    size: 2,
    requiredEra: 1
  },
  {
    id: 'billboard',
    name: 'Digital Billboard',
    description:
      'City-scale visibility. Synergy: extra ×1.11 with Lifestyle Blogger in range.',
    cost: 28000,
    effect: 'multiply',
    multiplier: 2.25,
    range: 5,
    color: '#00ccff',
    icon: '🪧',
    size: 1,
    requiredEra: 1
  },
  {
    id: 'hq',
    name: 'Agency HQ Tower',
    description:
      'Glass tower — huge radius. Synergy: extra ×1.23 with Red Carpet Talent in range.',
    cost: 118000,
    effect: 'multiply',
    multiplier: 3.55,
    range: 5,
    color: '#aa66ff',
    icon: '🏢',
    size: 3,
    requiredEra: 2
  },
  {
    id: 'satellite_relay',
    name: 'Satellite Relay',
    description:
      'Orbital uplink — continent-wide buffs. Synergy: extra ×1.21 with VTuber Star in range.',
    cost: 880000,
    effect: 'multiply',
    multiplier: 4.15,
    range: 6,
    color: '#66ddff',
    icon: '🛰️',
    size: 1,
    requiredEra: 2
  },
  {
    id: 'fan_fest_arena',
    name: 'Fan Fest Arena',
    description:
      'Tour-scale footprint — insane coverage. Synergy: extra ×1.28 with Media Mogul in range.',
    cost: 6200000,
    effect: 'multiply',
    multiplier: 5.2,
    range: 7,
    color: '#ff5599',
    icon: '🏟️',
    size: 3,
    requiredEra: 2
  },
  {
    id: 'quantum_stage',
    name: 'Quantum Stage',
    description:
      'Endgame structure — maximum radius and multiplier. Synergy: extra ×1.35 with World Icon in range.',
    cost: 38000000,
    effect: 'multiply',
    multiplier: 7.5,
    range: 8,
    color: '#ddff66',
    icon: '⚛️',
    size: 2,
    requiredEra: 2
  }
];

/**
 * Extra multiplier when the talent type is in range of at least one matching building (once per rule).
 */
export const synergyRules = [
  { buildingTypeId: 'desk', influencerTypeIds: ['pet', 'nano'], bonusMultiplier: 1.06 },
  { buildingTypeId: 'ringlight', influencerTypeIds: ['foodie'], bonusMultiplier: 1.09 },
  { buildingTypeId: 'greenscreen', influencerTypeIds: ['coach'], bonusMultiplier: 1.08 },
  { buildingTypeId: 'studio', influencerTypeIds: ['dj'], bonusMultiplier: 1.22 },
  { buildingTypeId: 'podcast_nook', influencerTypeIds: ['podcast'], bonusMultiplier: 1.17 },
  { buildingTypeId: 'server', influencerTypeIds: ['gamer'], bonusMultiplier: 1.13 },
  { buildingTypeId: 'warroom', influencerTypeIds: ['viral'], bonusMultiplier: 1.15 },
  { buildingTypeId: 'billboard', influencerTypeIds: ['lifestyle'], bonusMultiplier: 1.11 },
  { buildingTypeId: 'hq', influencerTypeIds: ['celebrity'], bonusMultiplier: 1.23 },
  { buildingTypeId: 'satellite_relay', influencerTypeIds: ['vtuber'], bonusMultiplier: 1.21 },
  { buildingTypeId: 'fan_fest_arena', influencerTypeIds: ['mogul'], bonusMultiplier: 1.28 },
  { buildingTypeId: 'quantum_stage', influencerTypeIds: ['world_icon'], bonusMultiplier: 1.35 }
];

export function getSynergyMultiplierFromBuildingTypes(influencerTypeId, uniqueBuildingTypeIds) {
  const present = new Set(uniqueBuildingTypeIds);
  let m = 1;
  for (const rule of synergyRules) {
    if (!present.has(rule.buildingTypeId)) continue;
    if (!rule.influencerTypeIds.includes(influencerTypeId)) continue;
    m *= rule.bonusMultiplier;
  }
  return m;
}

// Manual click upgrades — stack forever with rising costs
export const clickUpgradeTypes = [
  {
    id: 'grip',
    name: 'Thumb Training',
    description: '+1 Clout per post per level',
    baseCost: 15,
    growth: 1.15,
    kind: 'flat',
    perLevel: 1
  },
  {
    id: 'hook',
    name: 'Opening Hook',
    description: '+2 Clout per post per level',
    baseCost: 55,
    growth: 1.15,
    kind: 'flat',
    perLevel: 2
  },
  {
    id: 'trend',
    name: 'Trend Radar',
    description: '+3 Clout per post per level',
    baseCost: 140,
    growth: 1.15,
    kind: 'flat',
    perLevel: 3
  },
  {
    id: 'thumbnail',
    name: 'Thumbnail Science',
    description: '+4% post power per level (multiplies)',
    baseCost: 420,
    growth: 1.16,
    kind: 'mult',
    perLevel: 0.04
  },
  {
    id: 'schedule',
    name: 'Content Calendar',
    description: '+5% post power per level (multiplies)',
    baseCost: 1100,
    growth: 1.16,
    kind: 'mult',
    perLevel: 0.05
  },
  {
    id: 'collab',
    name: 'Collab Engine',
    description: '+6% post power per level (multiplies)',
    baseCost: 4200,
    growth: 1.17,
    kind: 'mult',
    perLevel: 0.06
  },
  {
    id: 'drama',
    name: 'Strategic Drama',
    description: '+8% post power per level (multiplies)',
    baseCost: 9500,
    growth: 1.18,
    kind: 'mult',
    perLevel: 0.08
  },
  {
    id: 'brand_kit',
    name: 'Brand Kit',
    description: '+10% post power per level (multiplies)',
    baseCost: 24000,
    growth: 1.18,
    kind: 'mult',
    perLevel: 0.1
  },
  {
    id: 'talk_show',
    name: 'Talk Show Slot',
    description: '+12% post power per level (multiplies)',
    baseCost: 88000,
    growth: 1.19,
    kind: 'mult',
    perLevel: 0.12
  },
  {
    id: 'superbowl',
    name: 'Halftime Bid',
    description: '+15% post power per level (multiplies)',
    baseCost: 520000,
    growth: 1.2,
    kind: 'mult',
    perLevel: 0.15
  },
  {
    id: 'matrix_pr',
    name: 'Matrix PR Blitz',
    description: '+22% post power per level (multiplies)',
    baseCost: 6200000,
    growth: 1.21,
    kind: 'mult',
    perLevel: 0.22
  }
];

// Brand deal types - at least 3 different event types
export const brandDealTypes = [
  {
    id: 'sponsored',
    name: 'Sponsored Post',
    description: 'Quick sponsored content deal',
    baseCloutReward: 12,
    baseFollowersReward: 5,
    reputationChange: -2,
    requiredEra: 0,
    color: '#00ddff'
  },
  {
    id: 'partnership',
    name: 'Brand Partnership',
    description: 'Ongoing brand collaboration',
    baseCloutReward: 32,
    baseFollowersReward: 10,
    reputationChange: 5,
    requiredEra: 0,
    color: '#ff00dd'
  },
  {
    id: 'controversy',
    name: 'Controversy Fuel',
    description: 'Risky but profitable drama',
    baseCloutReward: 95,
    baseFollowersReward: 24,
    reputationChange: -15,
    requiredEra: 1,
    color: '#ff4400'
  },
  {
    id: 'exclusive',
    name: 'Exclusive Deal',
    description: 'Premium brand alignment',
    baseCloutReward: 210,
    baseFollowersReward: 48,
    reputationChange: 10,
    requiredEra: 1,
    color: '#ffdd00'
  },
  {
    id: 'aipartner',
    name: 'AI Brand Synthesis',
    description: 'Automated brand integration',
    baseCloutReward: 820,
    baseFollowersReward: 160,
    reputationChange: 0,
    requiredEra: 2,
    color: '#dd00ff'
  },
  {
    id: 'stadium',
    name: 'Stadium Naming Deal',
    description: 'Huge bag — reputation on the line',
    baseCloutReward: 2200,
    baseFollowersReward: 420,
    reputationChange: -8,
    requiredEra: 2,
    color: '#00ffaa'
  }
];

// Prestige eras
export const prestigeEras = [
  {
    id: 0,
    name: 'Web 1.0 Era',
    description: 'The early internet - blogs and forums',
    theme: {
      primary: '#00ffff',
      secondary: '#0088ff',
      accent: '#00ff88',
      background: '#000033'
    }
  },
  {
    id: 1,
    name: 'Social Media Era',
    description: 'Rise of influencers and viral content',
    theme: {
      primary: '#ff00ff',
      secondary: '#ff0088',
      accent: '#ffff00',
      background: '#110022'
    }
  },
  {
    id: 2,
    name: 'AI Influencer Era',
    description: 'Synthetic personalities and algorithmic content',
    theme: {
      primary: '#ff0080',
      secondary: '#8000ff',
      accent: '#00ff80',
      background: '#220011'
    }
  }
];

// Manager types (for future automation)
export const managerTypes = [
  {
    id: 'intern',
    name: 'Social Media Intern',
    description: 'Auto-clicks for you',
    cost: 5000,
    effect: 'autoclick',
    clicksPerSecond: 10
  },
  {
    id: 'agent',
    name: 'Talent Agent',
    description: 'Auto-accepts brand deals',
    cost: 15000,
    effect: 'autodeals'
  },
  {
    id: 'producer',
    name: 'Executive Producer',
    description: 'Boosts all influencer output',
    cost: 50000,
    effect: 'globalboost',
    multiplier: 1.5
  }
];
