/** Per-unit price scaling (Cookie Clicker–style): each copy costs this much more */
export const UNIT_PRICE_GROWTH = 1.18;

/** Clout earned this run required before prestige (lifetime clout is all-time and never resets) */
export const PRESTIGE_RUN_CLOUT_THRESHOLD = 420000;

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

// Influencer types - at least 5 different types
export const influencerTypes = [
  {
    id: 'pet',
    name: 'Petfluencer',
    description: 'Short clips, huge heart — starter passive',
    cost: 28,
    baseCloutPerSecond: 0.22,
    color: '#88ffcc',
    icon: '🐾',
    requiredEra: 0
  },
  {
    id: 'nano',
    name: 'Nano Creator',
    description: 'Hyper-local, hyper-loyal — slow but cheap',
    cost: 45,
    baseCloutPerSecond: 0.35,
    color: '#66ffee',
    icon: '✨',
    requiredEra: 0
  },
  {
    id: 'micro',
    name: 'Micro Influencer',
    description: 'Just starting out, but authentic',
    cost: 75,
    baseCloutPerSecond: 0.45,
    color: '#00ffff',
    icon: '🌟',
    requiredEra: 0
  },
  {
    id: 'foodie',
    name: 'Food Reviewer',
    description: 'Local spots and reaction takes',
    cost: 165,
    baseCloutPerSecond: 0.72,
    color: '#ffaa66',
    icon: '🍜',
    requiredEra: 0
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle Blogger',
    description: 'Daily vlogs and aesthetic posts',
    cost: 320,
    baseCloutPerSecond: 1.6,
    color: '#ff00ff',
    icon: '📸',
    requiredEra: 0
  },
  {
    id: 'coach',
    name: 'Fitness Coach',
    description: 'Programs, check-ins, steady audience',
    cost: 520,
    baseCloutPerSecond: 2.15,
    color: '#66ff66',
    icon: '💪',
    requiredEra: 0
  },
  {
    id: 'gamer',
    name: 'Gaming Streamer',
    description: 'Live streams and gaming content',
    cost: 1100,
    baseCloutPerSecond: 4,
    color: '#00ff00',
    icon: '🎮',
    requiredEra: 1
  },
  {
    id: 'viral',
    name: 'Viral Sensations',
    description: 'Trend-jacking masters',
    cost: 3400,
    baseCloutPerSecond: 12,
    color: '#ffff00',
    icon: '⚡',
    requiredEra: 1
  },
  {
    id: 'podcast',
    name: 'Podcast Host',
    description: 'Long-form takes — slower burn, steady clout',
    cost: 9500,
    baseCloutPerSecond: 28,
    color: '#cc88ff',
    icon: '🎙️',
    requiredEra: 1
  },
  {
    id: 'ai',
    name: 'AI Influencer',
    description: 'Generated perfection, endless content',
    cost: 14500,
    baseCloutPerSecond: 38,
    color: '#ff0080',
    icon: '🤖',
    requiredEra: 2
  },
  {
    id: 'celebrity',
    name: 'Red Carpet Talent',
    description: 'Agency rates go through the roof',
    cost: 62000,
    baseCloutPerSecond: 140,
    color: '#ffd700',
    icon: '🎭',
    requiredEra: 2
  }
];

// Building types - at least 4 different types
export const buildingTypes = [
  {
    id: 'desk',
    name: 'Creator Desk',
    description: 'Basic setup — small buff to adjacent talent',
    cost: 130,
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
    description: 'Soft light — wider reach, modest bump',
    cost: 280,
    effect: 'multiply',
    multiplier: 1.35,
    range: 2,
    color: '#ffee88',
    icon: '💡',
    size: 1,
    requiredEra: 0
  },
  {
    id: 'greenscreen',
    name: 'Green Screen Booth',
    description: 'Cheap effects workflow — tight radius',
    cost: 395,
    effect: 'multiply',
    multiplier: 1.28,
    range: 1,
    color: '#44ff99',
    icon: '🟩',
    size: 1,
    requiredEra: 0
  },
  {
    id: 'studio',
    name: 'Content Studio',
    description: 'Professional production environment',
    cost: 620,
    effect: 'multiply',
    multiplier: 1.9,
    range: 2,
    color: '#ff0088',
    icon: '🎬',
    size: 2,
    requiredEra: 0
  },
  {
    id: 'podcast_nook',
    name: 'Podcast Nook',
    description: 'Sound-treated corner — mid-range synergy',
    cost: 720,
    effect: 'multiply',
    multiplier: 1.42,
    range: 2,
    color: '#c9a0ff',
    icon: '🎧',
    size: 1,
    requiredEra: 0
  },
  {
    id: 'server',
    name: 'Server Rack',
    description: 'Data processing and analytics',
    cost: 2600,
    effect: 'multiply',
    multiplier: 2.35,
    range: 3,
    color: '#00ff88',
    icon: '🖥️',
    size: 1,
    requiredEra: 1
  },
  {
    id: 'warroom',
    name: 'PR War Room',
    description: 'Crisis management and reputation control',
    cost: 11000,
    effect: 'multiply',
    multiplier: 2.85,
    range: 4,
    color: '#ff8800',
    icon: '📡',
    size: 2,
    requiredEra: 1
  },
  {
    id: 'billboard',
    name: 'Digital Billboard',
    description: 'City-scale visibility for nearby talent',
    cost: 22000,
    effect: 'multiply',
    multiplier: 2.2,
    range: 5,
    color: '#00ccff',
    icon: '🪧',
    size: 1,
    requiredEra: 1
  },
  {
    id: 'hq',
    name: 'Agency HQ Tower',
    description: 'Glass tower — massive synergy radius',
    cost: 88000,
    effect: 'multiply',
    multiplier: 3.4,
    range: 5,
    color: '#aa66ff',
    icon: '🏢',
    size: 3,
    requiredEra: 2
  }
];

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
