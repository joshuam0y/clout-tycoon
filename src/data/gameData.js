/** Per-unit price scaling (Cookie Clicker–style): each copy costs this much more */
export const UNIT_PRICE_GROWTH = 1.15;

// Influencer types - at least 5 different types
export const influencerTypes = [
  {
    id: 'micro',
    name: 'Micro Influencer',
    description: 'Just starting out, but authentic',
    cost: 50,
    baseCloutPerSecond: 0.5,
    color: '#00ffff',
    icon: '🌟',
    requiredEra: 0
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle Blogger',
    description: 'Daily vlogs and aesthetic posts',
    cost: 250,
    baseCloutPerSecond: 2,
    color: '#ff00ff',
    icon: '📸',
    requiredEra: 0
  },
  {
    id: 'gamer',
    name: 'Gaming Streamer',
    description: 'Live streams and gaming content',
    cost: 800,
    baseCloutPerSecond: 5,
    color: '#00ff00',
    icon: '🎮',
    requiredEra: 1
  },
  {
    id: 'viral',
    name: 'Viral Sensations',
    description: 'Trend-jacking masters',
    cost: 2500,
    baseCloutPerSecond: 15,
    color: '#ffff00',
    icon: '⚡',
    requiredEra: 1
  },
  {
    id: 'ai',
    name: 'AI Influencer',
    description: 'Generated perfection, endless content',
    cost: 10000,
    baseCloutPerSecond: 50,
    color: '#ff0080',
    icon: '🤖',
    requiredEra: 2
  }
];

// Building types - at least 4 different types
export const buildingTypes = [
  {
    id: 'desk',
    name: 'Creator Desk',
    description: 'Basic setup for content creation',
    cost: 100,
    effect: 'multiply',
    multiplier: 1.5,
    range: 1,
    color: '#0088ff',
    icon: '💻',
    size: 1,
    requiredEra: 0
  },
  {
    id: 'studio',
    name: 'Content Studio',
    description: 'Professional production environment',
    cost: 500,
    effect: 'multiply',
    multiplier: 2,
    range: 2,
    color: '#ff0088',
    icon: '🎬',
    size: 2,
    requiredEra: 0
  },
  {
    id: 'server',
    name: 'Server Rack',
    description: 'Data processing and analytics',
    cost: 2000,
    effect: 'multiply',
    multiplier: 2.5,
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
    cost: 8000,
    effect: 'multiply',
    multiplier: 3,
    range: 4,
    color: '#ff8800',
    icon: '📡',
    size: 2,
    requiredEra: 1
  }
];

// Manual click upgrades — stack forever with rising costs
export const clickUpgradeTypes = [
  {
    id: 'grip',
    name: 'Scroll Endurance',
    description: '+1 Clout per post per level',
    baseCost: 15,
    growth: 1.15,
    kind: 'flat',
    perLevel: 1
  },
  {
    id: 'trend',
    name: 'Trend Radar',
    description: '+2 Clout per post per level',
    baseCost: 120,
    growth: 1.15,
    kind: 'flat',
    perLevel: 2
  },
  {
    id: 'thumbnail',
    name: 'Thumbnail Science',
    description: '+5% post power per level (multiplicative)',
    baseCost: 600,
    growth: 1.16,
    kind: 'mult',
    perLevel: 0.05
  },
  {
    id: 'drama',
    name: 'Strategic Drama',
    description: '+8% post power per level (multiplicative)',
    baseCost: 3500,
    growth: 1.18,
    kind: 'mult',
    perLevel: 0.08
  }
];

// Brand deal types - at least 3 different event types
export const brandDealTypes = [
  {
    id: 'sponsored',
    name: 'Sponsored Post',
    description: 'Quick sponsored content deal',
    baseCloutReward: 100,
    baseFollowersReward: 50,
    reputationChange: -2,
    requiredEra: 0,
    color: '#00ddff'
  },
  {
    id: 'partnership',
    name: 'Brand Partnership',
    description: 'Ongoing brand collaboration',
    baseCloutReward: 500,
    baseFollowersReward: 200,
    reputationChange: 5,
    requiredEra: 0,
    color: '#ff00dd'
  },
  {
    id: 'controversy',
    name: 'Controversy Fuel',
    description: 'Risky but profitable drama',
    baseCloutReward: 1500,
    baseFollowersReward: 500,
    reputationChange: -15,
    requiredEra: 1,
    color: '#ff4400'
  },
  {
    id: 'exclusive',
    name: 'Exclusive Deal',
    description: 'Premium brand alignment',
    baseCloutReward: 3000,
    baseFollowersReward: 1000,
    reputationChange: 10,
    requiredEra: 1,
    color: '#ffdd00'
  },
  {
    id: 'aipartner',
    name: 'AI Brand Synthesis',
    description: 'Automated brand integration',
    baseCloutReward: 8000,
    baseFollowersReward: 2000,
    reputationChange: 0,
    requiredEra: 2,
    color: '#dd00ff'
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
