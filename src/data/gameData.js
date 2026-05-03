/** Base multiplier per duplicate tier before acceleration (see UNIT_PRICE_DUPLICATE_EXP). */
export const UNIT_PRICE_GROWTH = 1.248;

/**
 * Duplicate Clout cost uses: base × growth^(owned ** DUPLICATE_EXP) × CLOUT_PRICE_MULTIPLIER.
 * > 1 makes each extra copy of the same item ramp faster than fixed-% geometric stacking.
 */
export const UNIT_PRICE_DUPLICATE_EXP = 1.32;

/**
 * Legacy economy applied 0.48× to manual posts; baseline is now 1 Clout per post (before upgrades).
 * Hire costs, click-upgrade prices, and prestige bars scale by this so pacing matches the old curve.
 */
export const CLOUT_PRICE_MULTIPLIER = 25 / 12;

/**
 * This-run Clout needed to prestige — base for first run; multiplies by STEP each completed prestige.
 * completedPrestigeCount = current prestigeCount (0 before first prestige, 1 after first, …).
 */
export const PRESTIGE_RUN_CLOUT_BASE = 800000;
/** Next run’s prestige bar is this × the previous tier’s requirement. */
export const PRESTIGE_RUN_CLOUT_MULT_PER_STEP = 14;

export function getPrestigeRunCloutRequired(completedPrestigeCount) {
  const n = Math.max(0, Math.floor(completedPrestigeCount ?? 0));
  const raw =
    PRESTIGE_RUN_CLOUT_BASE * CLOUT_PRICE_MULTIPLIER * Math.pow(PRESTIGE_RUN_CLOUT_MULT_PER_STEP, n);
  return Math.min(Number.MAX_SAFE_INTEGER, Math.floor(raw));
}

/**
 * `prestigeCount` in save = completed prestiges. minPrestige 1 = need at least one prestige on the counter.
 * Omit or 0 = always unlocked (aside from era/cost).
 */
export function getMinPrestige(def) {
  return Math.max(0, Math.floor(def?.minPrestige ?? 0));
}

/** @deprecated use getPrestigeRunCloutRequired(0) */
export const PRESTIGE_RUN_CLOUT_THRESHOLD = getPrestigeRunCloutRequired(0);

/** Minimum lifetime Clout before brand deals can ever roll (proves basic engagement). */
export const BRAND_DEALS_MIN_LIFETIME_CLOUT = Math.ceil(2200 * CLOUT_PRICE_MULTIPLIER);

/** Usually need this many influencers hired (deals = brand attention on a roster). */
export const BRAND_DEALS_MIN_INFLUENCERS = 2;

/** Solo path: one creator + at least one building + higher lifetime Clout. */
export const BRAND_DEALS_SOLO_MIN_INFLUENCERS = 1;
export const BRAND_DEALS_SOLO_MIN_BUILDINGS = 1;
export const BRAND_DEALS_SOLO_MIN_LIFETIME_CLOUT = Math.ceil(7800 * CLOUT_PRICE_MULTIPLIER);

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
export const REPUTATION_INCOME_MULT_MIN = 0.4;
export const REPUTATION_INCOME_MULT_MAX = 1.0;

/** Applied to passive Clout/s after all other passive math (anti-runaway). */
export const PASSIVE_GLOBAL_MULT = 0.42;

/** Flat Clout per manual post before upgrades (Thumb Training etc.) and reputation/gem/prestige mults. */
export const BASE_POST_CLOUT = 1;

/** Applied to manual + intern post Clout after upgrades; keep at 1 so an undressed post = BASE_POST_CLOUT at ×1 mults. */
export const CLICK_OUTPUT_GLOBAL_MULT = 1;

/**
 * Intern “scheduled posts” use a slice of your post-math so they stay a convenience, not the main engine.
 * (Still scales a bit with upgrades — just much weaker than manual.)
 */
export const INTERN_AUTO_POST_OUTPUT_MULT = 0.18;
/** First intern’s baseline rate; extra interns add sublinear speed (see INTERN_STACKING_EXP). */
export const INTERN_BASE_POSTS_PER_SEC = 0.38;
/** Total auto-post rate ∝ (intern count) ** this — stacks softer than linear. */
export const INTERN_STACKING_EXP = 0.58;

/** Permanent prestige mult: 1 + prestigeLevel × this (linear, gentler than old curves). */
export const PRESTIGE_MULT_PER_LEVEL = 0.24;

/** Softens % post-upgrade stacking so levels aren’t pure exponentials */
export const CLICK_UPGRADE_MULT_SOFTEN = 0.76;

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
  { id: 'deal_master', name: 'Brand Whisperer', gemReward: 3, description: 'Accept 25 brand deals (this save).' },
  { id: 'first_staff', name: 'People Ops', gemReward: 2, description: 'Hire your first staff member.' },
  { id: 'big_developer', name: 'Big Developer', gemReward: 4, description: 'Place 10 buildings on the grid.' },
  { id: 'deep_bench', name: 'Deep Bench', gemReward: 4, description: 'Have 10 influencers on the roster at once.' },
  { id: 'prestige_x', name: 'Series Regular', gemReward: 12, description: 'Reach prestige level 10.' },
  { id: 'billion_life', name: 'Nine Zeros', gemReward: 12, description: 'Reach 1 billion lifetime Clout.' },
  { id: 'gem_bank', name: 'Gem Vault', gemReward: 5, description: 'Hold 500 gems at once.' },
  {
    id: 'brand_navigator',
    name: 'Brand Navigator',
    gemReward: 3,
    description: 'Hire 2+ Brand Scouts (deal-season specialists).'
  },
  {
    id: 'million_run',
    name: 'Seven Figure Sprint',
    gemReward: 8,
    description: 'Earn 1,000,000 Clout in a single run before prestiging.'
  },
  {
    id: 'click_machine',
    name: 'Thumb Legend',
    gemReward: 6,
    description: 'Reach 100,000 manual posts (all-time; intern auto-posts do not count).'
  },
  {
    id: 'deal_century',
    name: 'Contract Machine',
    gemReward: 8,
    description: 'Accept 100 brand deals (all-time).'
  },
  {
    id: 'full_agency',
    name: 'Full Agency',
    gemReward: 10,
    description: 'Employ intern, agent, executive producer, and brand scout at the same time.'
  }
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
    description:
      'Just starting out, but authentic. Synergy: ×1.05 near Podcast Nook when in range.',
    cost: 88,
    baseCloutPerSecond: 0.48,
    color: '#00ffff',
    icon: '🌟',
    requiredEra: 0
  },
  {
    id: 'sketch_comic',
    name: 'Sketch Comic',
    description:
      'Punchy shorts and reaction beats. Synergy: ×1.1 near Laugh Track Booth when in range.',
    cost: 220,
    baseCloutPerSecond: 0.55,
    color: '#ffcc44',
    icon: '😂',
    requiredEra: 0
  },
  {
    id: 'tutorial_captain',
    name: 'How-To Captain',
    description:
      'Edutainment and deep dives. Synergy: ×1.07 near Creator Desk when in buff range.',
    cost: 305,
    baseCloutPerSecond: 0.66,
    color: '#77ee99',
    icon: '📚',
    requiredEra: 0
  },
  {
    id: 'foodie',
    name: 'Food Reviewer',
    description:
      'Local spots and reaction takes. Synergy: ×1.09 near Ring Light Bay, ×1.05 near Drone Bay.',
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
      'Daily vlogs and aesthetic posts. Synergy: ×1.11 near Digital Billboard, ×1.06 near Ring Light Bay.',
    cost: 380,
    baseCloutPerSecond: 1.75,
    color: '#ff00ff',
    icon: '📸',
    requiredEra: 0
  },
  {
    id: 'beauty_guru',
    name: 'Beauty Guru',
    description:
      'Tutorials and GRWM — synergy ×1.11 near Vanity Set when in range.',
    cost: 495,
    baseCloutPerSecond: 2.05,
    color: '#ff99cc',
    icon: '💄',
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
    id: 'travel_vlog',
    name: 'Travel Vlogger',
    description:
      'Drone shots and transit arcs — synergy ×1.13 near Drone Bay when in range.',
    cost: 6950,
    baseCloutPerSecond: 16,
    color: '#66ccff',
    icon: '✈️',
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
    id: 'esports_pro',
    name: 'Esports Pro',
    description:
      'Ranked sweat and LAN energy — synergy ×1.16 near LAN Arena when in range.',
    cost: 29800,
    baseCloutPerSecond: 65,
    color: '#ff4444',
    icon: '🏆',
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
    description:
      'Generated perfection, endless content. Synergy: ×1.08 near PR War Room when in range.',
    cost: 420000,
    baseCloutPerSecond: 420,
    color: '#ff0080',
    icon: '🤖',
    requiredEra: 2
  },
  {
    id: 'celebrity',
    name: 'Red Carpet Talent',
    description:
      'Agency rates go through the roof. Synergy: ×1.23 near Agency HQ Tower, ×1.06 near Satellite Relay.',
    cost: 1650000,
    baseCloutPerSecond: 1650,
    color: '#ffd700',
    icon: '🌟',
    requiredEra: 2
  },
  {
    id: 'synth_idol',
    name: 'Synth Idol',
    description:
      'Holographic arena tours — synergy ×1.24 near Holo Deck when in range.',
    cost: 9800000,
    baseCloutPerSecond: 4200,
    color: '#ff66ee',
    icon: '🎤',
    requiredEra: 2
  },
  {
    id: 'mogul',
    name: 'Media Mogul',
    description:
      'Owns feeds and franchises. Synergy: ×1.28 near Fan Fest Arena.',
    cost: 42000000,
    baseCloutPerSecond: 12000,
    color: '#ffaa00',
    icon: '👑',
    requiredEra: 2,
    minPrestige: 3
  },
  {
    id: 'world_icon',
    name: 'World Icon',
    description:
      'Planetary reach — absurd passive if you can afford them. Synergy: ×1.35 near Quantum Stage.',
    cost: 320000000,
    baseCloutPerSecond: 85000,
    color: '#ffffff',
    icon: '🌍',
    requiredEra: 2,
    minPrestige: 4
  },
  {
    id: 'galaxy_ambassador',
    name: 'Galaxy Ambassador',
    description:
      'Off-planet reach — synergy ×1.34 near Orbital Set when in range.',
    cost: 820000000,
    baseCloutPerSecond: 155000,
    color: '#e0e8ff',
    icon: '🛸',
    requiredEra: 2,
    minPrestige: 5
  }
];

// Building types — footprint, Manhattan buff radius (from footprint edge), base multiplier
export const buildingTypes = [
  {
    id: 'desk',
    name: 'Creator Desk',
    description:
      'Basic setup — small buff to adjacent talent. Synergy: extra ×1.06 with Nano / Pet, ×1.07 with How-To Captain in range.',
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
      'Soft light — wider reach. Synergy: extra ×1.09 with Food Reviewer, ×1.06 with Lifestyle Blogger in range.',
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
    id: 'vanity_set',
    name: 'Vanity Set',
    description:
      'Ring lights + glam mirrors — synergy ×1.11 with Beauty Guru in range.',
    cost: 395,
    effect: 'multiply',
    multiplier: 1.34,
    range: 2,
    color: '#ffb7c8',
    icon: '🪞',
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
    id: 'laugh_track',
    name: 'Laugh Track Booth',
    description:
      'Crowd energy on tap — pairing ×1.1 with Sketch Comic talent when they’re in buff range.',
    cost: 265,
    effect: 'multiply',
    multiplier: 1.32,
    range: 2,
    color: '#ffaa33',
    icon: '📣',
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
      'Sound-treated corner. Synergy: extra ×1.17 with Podcast Host, ×1.05 with Micro Influencer in range.',
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
      'Crisis cell — boosts viral plays. Synergy: extra ×1.15 with Viral Sensations, ×1.08 with AI Influencer in range.',
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
    id: 'drone_bay',
    name: 'Drone Bay',
    description:
      'Launch dock for aerial B-roll. Synergy: extra ×1.13 with Travel Vlogger, ×1.05 with Food Reviewer in range.',
    cost: 23500,
    effect: 'multiply',
    multiplier: 2.18,
    range: 3,
    color: '#88ddff',
    icon: '🚁',
    size: 1,
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
    id: 'lan_arena',
    name: 'LAN Arena',
    description:
      'Stage + spectator seating — synergy ×1.16 with Esports Pro in range.',
    cost: 72000,
    effect: 'multiply',
    multiplier: 2.78,
    range: 4,
    color: '#cc3300',
    icon: '🎯',
    size: 2,
    requiredEra: 1
  },
  {
    id: 'hq',
    name: 'Agency HQ Tower',
    description:
      'Glass tower — huge radius. Synergy: extra ×1.23 with Red Carpet Talent in range.',
    cost: 275000,
    effect: 'multiply',
    multiplier: 3.55,
    range: 5,
    color: '#aa66ff',
    icon: '🏢',
    size: 3,
    requiredEra: 2,
    minPrestige: 1
  },
  {
    id: 'holo_deck',
    name: 'Holo Deck',
    description:
      'Arena-scale holographics — synergy ×1.24 with Synth Idol in range.',
    cost: 1150000,
    effect: 'multiply',
    multiplier: 3.95,
    range: 5,
    color: '#ff77ee',
    icon: '🌐',
    size: 2,
    requiredEra: 2,
    minPrestige: 1
  },
  {
    id: 'satellite_relay',
    name: 'Satellite Relay',
    description:
      'Orbital uplink — continent-wide buffs. Synergy: extra ×1.21 with VTuber Star, ×1.06 with Red Carpet Talent in range.',
    cost: 2650000,
    effect: 'multiply',
    multiplier: 4.15,
    range: 6,
    color: '#66ddff',
    icon: '🛰️',
    size: 1,
    requiredEra: 2,
    minPrestige: 2
  },
  {
    id: 'fan_fest_arena',
    name: 'Fan Fest Arena',
    description:
      'Tour-scale footprint — insane coverage. Synergy: extra ×1.28 with Media Mogul in range.',
    cost: 52000000,
    effect: 'multiply',
    multiplier: 5.2,
    range: 7,
    color: '#ff5599',
    icon: '🏟️',
    size: 3,
    requiredEra: 2,
    minPrestige: 3
  },
  {
    id: 'quantum_stage',
    name: 'Quantum Stage',
    description:
      'Endgame structure — maximum radius and multiplier. Synergy: extra ×1.35 with World Icon in range.',
    cost: 310000000,
    effect: 'multiply',
    multiplier: 7.5,
    range: 8,
    color: '#ddff66',
    icon: '⚛️',
    size: 2,
    requiredEra: 2,
    minPrestige: 4
  },
  {
    id: 'orbital_set',
    name: 'Orbital Set',
    description:
      'Shoot content from low orbit — synergy ×1.34 with Galaxy Ambassador in range.',
    cost: 780000000,
    effect: 'multiply',
    multiplier: 10.5,
    range: 10,
    color: '#aabbff',
    icon: '🛰️',
    size: 2,
    requiredEra: 2,
    minPrestige: 5
  }
];

/**
 * Extra multiplier when the talent type is in range of at least one matching building (once per rule).
 */
export const synergyRules = [
  { buildingTypeId: 'desk', influencerTypeIds: ['pet', 'nano'], bonusMultiplier: 1.06 },
  { buildingTypeId: 'desk', influencerTypeIds: ['tutorial_captain'], bonusMultiplier: 1.07 },
  { buildingTypeId: 'ringlight', influencerTypeIds: ['foodie'], bonusMultiplier: 1.09 },
  { buildingTypeId: 'greenscreen', influencerTypeIds: ['coach'], bonusMultiplier: 1.08 },
  { buildingTypeId: 'laugh_track', influencerTypeIds: ['sketch_comic'], bonusMultiplier: 1.1 },
  { buildingTypeId: 'vanity_set', influencerTypeIds: ['beauty_guru'], bonusMultiplier: 1.11 },
  { buildingTypeId: 'studio', influencerTypeIds: ['dj'], bonusMultiplier: 1.22 },
  { buildingTypeId: 'podcast_nook', influencerTypeIds: ['podcast'], bonusMultiplier: 1.17 },
  { buildingTypeId: 'podcast_nook', influencerTypeIds: ['micro'], bonusMultiplier: 1.05 },
  { buildingTypeId: 'server', influencerTypeIds: ['gamer'], bonusMultiplier: 1.13 },
  { buildingTypeId: 'warroom', influencerTypeIds: ['viral'], bonusMultiplier: 1.15 },
  { buildingTypeId: 'warroom', influencerTypeIds: ['ai'], bonusMultiplier: 1.08 },
  { buildingTypeId: 'drone_bay', influencerTypeIds: ['travel_vlog'], bonusMultiplier: 1.13 },
  { buildingTypeId: 'drone_bay', influencerTypeIds: ['foodie'], bonusMultiplier: 1.05 },
  { buildingTypeId: 'billboard', influencerTypeIds: ['lifestyle'], bonusMultiplier: 1.11 },
  { buildingTypeId: 'ringlight', influencerTypeIds: ['lifestyle'], bonusMultiplier: 1.06 },
  { buildingTypeId: 'lan_arena', influencerTypeIds: ['esports_pro'], bonusMultiplier: 1.16 },
  { buildingTypeId: 'hq', influencerTypeIds: ['celebrity'], bonusMultiplier: 1.23 },
  { buildingTypeId: 'holo_deck', influencerTypeIds: ['synth_idol'], bonusMultiplier: 1.24 },
  { buildingTypeId: 'satellite_relay', influencerTypeIds: ['vtuber'], bonusMultiplier: 1.21 },
  { buildingTypeId: 'satellite_relay', influencerTypeIds: ['celebrity'], bonusMultiplier: 1.06 },
  { buildingTypeId: 'fan_fest_arena', influencerTypeIds: ['mogul'], bonusMultiplier: 1.28 },
  { buildingTypeId: 'quantum_stage', influencerTypeIds: ['world_icon'], bonusMultiplier: 1.35 },
  { buildingTypeId: 'orbital_set', influencerTypeIds: ['galaxy_ambassador'], bonusMultiplier: 1.34 }
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
    description: '+4 payout boost per post per level',
    baseCost: 420,
    growth: 1.16,
    kind: 'mult',
    perLevel: 0.04
  },
  {
    id: 'schedule',
    name: 'Content Calendar',
    description: '+5 payout boost per post per level',
    baseCost: 1100,
    growth: 1.16,
    kind: 'mult',
    perLevel: 0.05
  },
  {
    id: 'collab',
    name: 'Collab Engine',
    description: '+6 payout boost per post per level',
    baseCost: 4200,
    growth: 1.17,
    kind: 'mult',
    perLevel: 0.06
  },
  {
    id: 'drama',
    name: 'Strategic Drama',
    description: '+8 payout boost per post per level',
    baseCost: 9500,
    growth: 1.18,
    kind: 'mult',
    perLevel: 0.08
  },
  {
    id: 'brand_kit',
    name: 'Brand Kit',
    description: '+10 payout boost per post per level',
    baseCost: 24000,
    growth: 1.18,
    kind: 'mult',
    perLevel: 0.1
  },
  {
    id: 'talk_show',
    name: 'Talk Show Slot',
    description: '+12 payout boost per post per level',
    baseCost: 88000,
    growth: 1.19,
    kind: 'mult',
    perLevel: 0.12,
    minPrestige: 1
  },
  {
    id: 'superbowl',
    name: 'Halftime Bid',
    description: '+15 payout boost per post per level',
    baseCost: 520000,
    growth: 1.2,
    kind: 'mult',
    perLevel: 0.15,
    minPrestige: 2
  },
  {
    id: 'matrix_pr',
    name: 'Matrix PR Blitz',
    description: '+22 payout boost per post per level',
    baseCost: 6200000,
    growth: 1.21,
    kind: 'mult',
    perLevel: 0.22,
    minPrestige: 3
  },
  {
    id: 'singularity_feed',
    name: 'Singularity Feed',
    description: '+28 payout boost per post per level',
    baseCost: 52000000,
    growth: 1.22,
    kind: 'mult',
    perLevel: 0.28,
    minPrestige: 4
  },
  {
    id: 'omni_waves',
    name: 'Omnichannel Waves',
    description: '+32 payout boost per post per level',
    baseCost: 380000000,
    growth: 1.23,
    kind: 'mult',
    perLevel: 0.32,
    minPrestige: 5
  }
];

// Brand deal types - at least 3 different event types
/**
 * Brand deals scale with your current Clout / followers banks and lifetime career (log curve).
 * Shares are of current banked values (not lifetime). reputationDelta is percentage points (−100…+100 scale).
 */
export function computeBrandDealPayouts(deal, ctx) {
  const clout = Math.max(0, ctx.clout ?? 0);
  const followers = Math.max(0, ctx.followers ?? 0);
  const lifetimeClout = Math.max(0, ctx.lifetimeClout ?? 0);
  const prestigeMultiplier = ctx.prestigeMultiplier ?? 1;
  const gemCloutMult = ctx.gemCloutMult ?? 1;

  const growth = 1 + Math.log10(1 + lifetimeClout / 3500) * 0.42;
  const rawClout = Math.floor(clout * deal.cloutShare * growth);
  const rawFollowers = Math.floor(followers * deal.followersShare * growth);
  const cloutGain = Math.max(deal.minClout ?? 0, rawClout);
  const followerGain = Math.max(deal.minFollowers ?? 0, rawFollowers);
  const earnedClout = Math.floor(cloutGain * prestigeMultiplier * gemCloutMult);

  return {
    earnedClout,
    followerGain,
    reputationDelta: deal.reputationDelta
  };
}

export const brandDealTypes = [
  {
    id: 'sponsored',
    name: 'Sponsored Post',
    description: 'Small sponsor — tiny audience fatigue.',
    cloutShare: 0.045,
    followersShare: 0.028,
    reputationDelta: -3,
    minClout: 14,
    minFollowers: 2,
    requiredEra: 0,
    color: '#00ddff'
  },
  {
    id: 'partnership',
    name: 'Brand Partnership',
    description: 'Steady partner — modest bags, modest rep gain.',
    cloutShare: 0.085,
    followersShare: 0.065,
    reputationDelta: 5,
    minClout: 28,
    minFollowers: 5,
    requiredEra: 0,
    color: '#ff00dd'
  },
  {
    id: 'merch_drop',
    name: 'Merch Drop Collab',
    description: 'Limited run — fans rally; clean reputation bump.',
    cloutShare: 0.072,
    followersShare: 0.055,
    reputationDelta: 4,
    minClout: 38,
    minFollowers: 6,
    requiredEra: 0,
    color: '#88ff66'
  },
  {
    id: 'viral_push',
    name: 'Viral Push',
    description: 'Trend hijack — chunky % of your bank, noticeable rep hit.',
    cloutShare: 0.16,
    followersShare: 0.12,
    reputationDelta: -12,
    minClout: 55,
    minFollowers: 8,
    requiredEra: 0,
    color: '#ffaa00'
  },
  {
    id: 'controversy',
    name: 'Controversy Drop',
    description: 'Drama pays — big % clout & followers, reputation tanks.',
    cloutShare: 0.25,
    followersShare: 0.22,
    reputationDelta: -25,
    minClout: 120,
    minFollowers: 18,
    requiredEra: 1,
    color: '#ff4400'
  },
  {
    id: 'exclusive',
    name: 'Exclusive Deal',
    description: 'Premium alignment — strong payout, builds reputation.',
    cloutShare: 0.11,
    followersShare: 0.095,
    reputationDelta: 10,
    minClout: 180,
    minFollowers: 35,
    requiredEra: 1,
    color: '#ffdd00'
  },
  {
    id: 'creator_fund',
    name: 'Creator Fund Grant',
    description: 'Platform stipend — huge optics, strong reputation.',
    cloutShare: 0.098,
    followersShare: 0.082,
    reputationDelta: 8,
    minClout: 210,
    minFollowers: 42,
    requiredEra: 1,
    color: '#66ffaa'
  },
  {
    id: 'aipartner',
    name: 'AI Brand Synthesis',
    description: 'Automated integration — scales hard; slight sleaze factor.',
    cloutShare: 0.14,
    followersShare: 0.13,
    reputationDelta: -6,
    minClout: 420,
    minFollowers: 70,
    requiredEra: 2,
    color: '#dd00ff'
  },
  {
    id: 'stadium',
    name: 'Stadium Naming Deal',
    description: 'Banner placement — huge % payouts, very public risk.',
    cloutShare: 0.22,
    followersShare: 0.2,
    reputationDelta: -20,
    minClout: 900,
    minFollowers: 140,
    requiredEra: 2,
    color: '#00ffaa'
  },
  {
    id: 'scorched_earth',
    name: 'Scorched-Earth Hype Tour',
    description: 'Max bag: ~30% of banked Clout & followers — nukes reputation if you spam these.',
    cloutShare: 0.3,
    followersShare: 0.28,
    reputationDelta: -30,
    minClout: 2000,
    minFollowers: 280,
    requiredEra: 2,
    color: '#ff2266'
  }
];

/** One real-time week per phase (UTC). Rotates which deal ids get a spawn-weight bias. */
const DEAL_SEASON_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const brandDealSeasonPhases = [
  {
    id: 'clean',
    label: 'Clean partnerships',
    favoredDealIds: ['sponsored', 'partnership', 'merch_drop', 'exclusive', 'creator_fund'],
    weightMult: 1.22
  },
  {
    id: 'momentum',
    label: 'Momentum pushes',
    favoredDealIds: ['viral_push', 'aipartner', 'merch_drop'],
    weightMult: 1.2
  },
  {
    id: 'risk',
    label: 'High-risk season',
    favoredDealIds: ['controversy', 'viral_push', 'scorched_earth'],
    weightMult: 1.24
  },
  {
    id: 'arena',
    label: 'Arena & whale deals',
    favoredDealIds: ['stadium', 'exclusive', 'creator_fund', 'scorched_earth', 'aipartner'],
    weightMult: 1.2
  }
];

export function getBrandDealSeasonWeekIndex(nowMs = Date.now()) {
  return Math.floor(nowMs / DEAL_SEASON_WEEK_MS);
}

export function getActiveBrandDealSeasonPhase(nowMs = Date.now()) {
  const i = getBrandDealSeasonWeekIndex(nowMs);
  return brandDealSeasonPhases[i % brandDealSeasonPhases.length];
}

/** Bonus spawn weight per Brand Scout copy on meta-aligned deals (multiplicative). */
export const BRAND_SCOUT_WEIGHT_PER_COPY = 0.035;

/**
 * Extra weight on favored deals this week. Brand Scouts stack modestly on favored picks only.
 */
export function getBrandDealSeasonalWeightMult(dealId, nowMs = Date.now(), brandScoutCount = 0) {
  const phase = getActiveBrandDealSeasonPhase(nowMs);
  if (!phase.favoredDealIds.includes(dealId)) return 1;
  const scoutMult = 1 + BRAND_SCOUT_WEIGHT_PER_COPY * Math.max(0, brandScoutCount);
  return phase.weightMult * scoutMult;
}

/** Agent waits this long before auto-accept so you can decline ugly deals first */
export const AGENT_AUTO_ACCEPT_DELAY_MS = 2800;

/** Skip auto-accept when reputation would fall below this (agent protects the brand) */
export const AGENT_MIN_REP_AFTER_DEAL = 22;

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

/**
 * Executive producers: diminishing multiplicative steps + hard cap (no 1.18^n explosion).
 */
export function getProducerPassiveMult(producerCount) {
  const n = Math.max(0, Math.floor(producerCount ?? 0));
  if (n === 0) return 1;
  let m = 1;
  for (let i = 0; i < n; i++) {
    m *= 1 + 0.055 / (1 + i * 0.32);
  }
  return Math.min(1.95, m);
}

// Manager types (for future automation)
export const managerTypes = [
  {
    id: 'intern',
    name: 'Social Media Intern',
    description:
      'Light scheduled posting — small Clout drip, no viral frenzy; extra interns stack gently (not ×speed each)',
    cost: 5200,
    effect: 'autoclick',
    minPrestige: 0
  },
  {
    id: 'agent',
    name: 'Talent Agent',
    description: 'After a short beat, auto-accepts deals that won’t trash rep past your floor',
    cost: 16500,
    effect: 'autodeals',
    minPrestige: 1
  },
  {
    id: 'producer',
    name: 'Executive Producer',
    description: 'Raises agency passive with diminishing returns (capped team bonus, not exponential)',
    cost: 52000,
    effect: 'globalboost',
    multiplier: 1,
    minPrestige: 2
  },
  {
    id: 'scout',
    name: 'Brand Scout',
    description: 'Reads sponsor cycles — boosts spawn odds for this week’s favored deal types (stackable).',
    cost: 120000,
    effect: 'brandseason',
    minPrestige: 3
  }
];
