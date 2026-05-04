/** Base multiplier per duplicate tier before acceleration (see UNIT_PRICE_DUPLICATE_EXP). */
export const UNIT_PRICE_GROWTH = 1.268;

/**
 * Duplicate Clout cost uses: base × growth^(owned ** DUPLICATE_EXP) × CLOUT_PRICE_MULTIPLIER.
 * > 1 makes each extra copy of the same item ramp faster than fixed-% geometric stacking.
 */
export const UNIT_PRICE_DUPLICATE_EXP = 1.42;

/**
 * Added to DUPLICATE_EXP per catalog row (talent/builds/staff list order), so late unlocks
 * compound like Cookie/AdCap “next business” curves while early rows stay approachable.
 */
export const UNIT_PRICE_CATALOG_DUP_EXP_PER_INDEX = 0.024;

/**
 * Post-upgrade rows scale effective per-level growth: growth × (1 + tierIndex × this).
 * Later ladder steps bite harder at high levels (Cookie-style upgrade inflation).
 */
export const CLICK_UPGRADE_GROWTH_BONUS_PER_TIER = 0.0088;

/**
 * Multiple auras of the same building type on one talent: exponent stacks sublinearly after the first
 * (1st full ×m, extras add (n−1)×PER_EXTRA to exponent, capped). Tames late-game ring-of-HQ without touching
 * early single-structure play.
 */
export const BUILDING_SAME_TYPE_STACK_EXP_PER_EXTRA = 0.35;
export const BUILDING_SAME_TYPE_STACK_EXP_CAP = 3.55;

/** Duplicate building costs use slightly steeper growth / exponent by requiredEra (0 = early catalog). */
export const BUILDING_ERA_GROWTH_FACTOR = 0.062;
export const BUILDING_ERA_DUPLICATE_EXP_BONUS = [0, 0.055, 0.12, 0.19];
export const BUILDING_ERA_FLAT_COST_MULT = [1, 1.2, 1.46, 1.82];

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
/** After this many completed prestiges, each further bar step uses the deep multiplier (late-game brake). */
export const PRESTIGE_RUN_CLOUT_DEEP_AFTER = 12;
export const PRESTIGE_RUN_CLOUT_MULT_DEEP = 18;

export function getPrestigeRunCloutRequired(completedPrestigeCount) {
  const n = Math.max(0, Math.floor(completedPrestigeCount ?? 0));
  let mult = 1;
  for (let i = 0; i < n; i++) {
    mult *=
      i >= PRESTIGE_RUN_CLOUT_DEEP_AFTER ? PRESTIGE_RUN_CLOUT_MULT_DEEP : PRESTIGE_RUN_CLOUT_MULT_PER_STEP;
  }
  const raw = PRESTIGE_RUN_CLOUT_BASE * CLOUT_PRICE_MULTIPLIER * mult;
  return Math.min(Number.MAX_SAFE_INTEGER, Math.floor(raw));
}

/** Prestiges completed → highest catalog era index unlocked (0…3). Tied to prestige depth, not theme skin. */
export const CATALOG_ERA_PRESTIGE_STEP = 3;
export const MAX_CATALOG_ERA_INDEX = 3;

export function getUnlockedCatalogEra(prestigeCount) {
  const p = Math.max(0, Math.floor(prestigeCount ?? 0));
  return Math.min(MAX_CATALOG_ERA_INDEX, Math.floor(p / CATALOG_ERA_PRESTIGE_STEP));
}

export function catalogEraMeetsRequired(unlockedEra, requiredEra) {
  const need = Math.max(0, Math.floor(requiredEra ?? 0));
  const have = Math.max(0, Math.floor(unlockedEra ?? 0));
  return have >= need;
}

export function brandDealSpawnableAtCatalogEra(deal, unlockedCatalogEra) {
  return catalogEraMeetsRequired(unlockedCatalogEra, deal?.requiredEra ?? 0);
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

/**
 * Shop / hover: per-tile passive after passive balance only (still excludes grid buffs and roster-wide ×).
 */
export function passiveCatalogTunedCps(baseCloutPerSecond) {
  return (Number(baseCloutPerSecond) || 0) * PASSIVE_GLOBAL_MULT;
}

/** Flat Clout per manual post before upgrades (Thumb Training etc.) and reputation/gem/prestige mults. */
export const BASE_POST_CLOUT = 1;

/** Applied to manual + intern post Clout after upgrades; keep at 1 so an undressed post = BASE_POST_CLOUT at ×1 mults. */
export const CLICK_OUTPUT_GLOBAL_MULT = 1;

/**
 * Intern “scheduled posts” use a slice of your post-math so they stay a convenience, not the main engine.
 * (Still scales a bit with upgrades — just much weaker than manual.)
 */
export const INTERN_AUTO_POST_OUTPUT_MULT = 0.3;
/** First intern’s baseline rate; extra interns add sublinear speed (see INTERN_STACKING_EXP). */
export const INTERN_BASE_POSTS_PER_SEC = 0.55;
/** Total auto-post rate ∝ (intern count) ** this — stacks softer than linear. */
export const INTERN_STACKING_EXP = 0.62;

/** Permanent prestige mult: 1 + prestigeLevel × this (linear, gentler than old curves). */
export const PRESTIGE_MULT_PER_LEVEL = 0.24;

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
  },
  { id: 'prestige_15', name: 'Fifteen Seasons', gemReward: 18, description: 'Reach prestige level 15.' },
  { id: 'prestige_25', name: 'Syndicated', gemReward: 35, description: 'Reach prestige level 25.' },
  { id: 'ten_million_run', name: 'Eight Zeros Sprint', gemReward: 22, description: 'Earn 10,000,000 Clout in a single run.' },
  { id: 'trillion_life', name: 'Trillionaire Aura', gemReward: 40, description: 'Reach 1 trillion lifetime Clout.' },
  { id: 'followers_250k', name: 'Arena Tour', gemReward: 14, description: 'Reach 250,000 followers.' },
  { id: 'deal_250', name: 'Sponsor Magnet', gemReward: 16, description: 'Accept 250 brand deals (all-time).' },
  { id: 'buildings_25', name: 'Skyline', gemReward: 12, description: 'Place 25 buildings on the grid.' },
  { id: 'roster_25', name: 'Convention Floor', gemReward: 12, description: 'Have 25 influencers on the roster at once.' },
  { id: 'staff_8', name: 'Bullpen', gemReward: 10, description: 'Employ 8 staff total.' },
  { id: 'scout_squad', name: 'Scout Squad', gemReward: 14, description: 'Hire 4+ Brand Scouts.' },
  { id: 'gem_whale', name: 'Whale Desk', gemReward: 20, description: 'Hold 2,500 gems at once.' },
  { id: 'daily_week', name: 'Check-in Week', gemReward: 25, description: 'Claim daily rewards 7 days in a row.' },
  { id: 'gem_spender_500', name: 'Liquid Hype', gemReward: 15, description: 'Spend 500 gems total (this save).' },
  { id: 'gem_spender_5000', name: 'Burn Rate', gemReward: 45, description: 'Spend 5,000 gems total (this save).' }
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
    id: 'opinion_host',
    name: 'Hot Take Host',
    description:
      'Punchy commentary — engagement bait that somehow works. Synergy: ×1.09 near Karaoke Pod.',
    cost: 68,
    baseCloutPerSecond: 0.41,
    color: '#ff8866',
    icon: '📣',
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
    id: 'asmr_whisper',
    name: 'ASMR Whisperer',
    description:
      'Tingles that print minutes. Synergy: ×1.08 near Green Room.',
    cost: 248,
    baseCloutPerSecond: 0.92,
    color: '#cceeff',
    icon: '🎧',
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
      'Tutorials and GRWM — synergy ×1.11 near Vanity Set and ×1.06 near Green Room when in range.',
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
    id: 'speedrun_ace',
    name: 'Speedrun Ace',
    description:
      'PB chases and frame-perfect clips. Synergy: ×1.12 near Reels Crucible.',
    cost: 1680,
    baseCloutPerSecond: 4.95,
    color: '#66ff99',
    icon: '⏱️',
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
    id: 'debate_moderator',
    name: 'Debate Moderator',
    description:
      'Panel chaos and clip farms. Synergy: ×1.14 near Motion Stage.',
    cost: 22800,
    baseCloutPerSecond: 38,
    color: '#aa99ff',
    icon: '⚖️',
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
    id: 'iron_archon',
    name: 'Iron Archon',
    description:
      'Hardcore MMO statics and theorycraft. Synergy: ×1.15 near CDN Nexus.',
    cost: 38500,
    baseCloutPerSecond: 78,
    color: '#aa4444',
    icon: '🛡️',
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
    id: 'doc_lens',
    name: 'Doc Lens',
    description:
      'Long-form investigations — slower burn, huge trust. Synergy: ×1.12 near Ethics Review Room.',
    cost: 118000,
    baseCloutPerSecond: 155,
    color: '#88ccaa',
    icon: '🎥',
    requiredEra: 2,
    minPrestige: 2
  },
  {
    id: 'ai',
    name: 'AI Influencer',
    description:
      'Generated perfection, endless content. Synergy: ×1.08 near PR War Room when in range.',
    cost: 620000,
    baseCloutPerSecond: 420,
    color: '#ff0080',
    icon: '🤖',
    requiredEra: 2,
    minPrestige: 3
  },
  {
    id: 'celebrity',
    name: 'Red Carpet Talent',
    description:
      'Agency rates go through the roof. Synergy: ×1.23 near Agency HQ Tower, ×1.06 near Satellite Relay.',
    cost: 2150000,
    baseCloutPerSecond: 1650,
    color: '#ffd700',
    icon: '🌟',
    requiredEra: 2,
    minPrestige: 4
  },
  {
    id: 'synth_idol',
    name: 'Synth Idol',
    description:
      'Holographic arena tours — synergy ×1.24 near Holo Deck when in range.',
    cost: 14500000,
    baseCloutPerSecond: 4200,
    color: '#ff66ee',
    icon: '🎤',
    requiredEra: 2,
    minPrestige: 5
  },
  {
    id: 'mogul',
    name: 'Media Mogul',
    description:
      'Owns feeds and franchises. Synergy: ×1.28 near Fan Fest Arena.',
    cost: 92000000,
    baseCloutPerSecond: 12000,
    color: '#ffaa00',
    icon: '👑',
    requiredEra: 2,
    minPrestige: 8
  },
  {
    id: 'world_icon',
    name: 'World Icon',
    description:
      'Planetary reach — absurd passive if you can afford them. Synergy: ×1.35 near Quantum Stage.',
    cost: 520000000,
    baseCloutPerSecond: 85000,
    color: '#ffffff',
    icon: '🌍',
    requiredEra: 2,
    minPrestige: 12
  },
  {
    id: 'galaxy_ambassador',
    name: 'Galaxy Ambassador',
    description:
      'Off-planet reach — synergy ×1.34 near Orbital Set when in range.',
    cost: 1200000000,
    baseCloutPerSecond: 155000,
    color: '#e0e8ff',
    icon: '🛸',
    requiredEra: 2,
    minPrestige: 16
  },
  {
    id: 'signal_ceo',
    name: 'Signal CEO',
    description:
      'Runs the feed like a utility — synergy ×1.32 near Singularity Shell.',
    cost: 18500000000,
    baseCloutPerSecond: 420000,
    color: '#dde8ff',
    icon: '📡',
    requiredEra: 3,
    minPrestige: 18
  },
  {
    id: 'continuum_host',
    name: 'Continuum Host',
    description:
      'Every timeline tuned to you — endgame passive. Synergy: ×1.38 near Reality Tunnel.',
    cost: 120000000000,
    baseCloutPerSecond: 2200000,
    color: '#f0f4ff',
    icon: '🔮',
    requiredEra: 3,
    minPrestige: 22
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
    id: 'karaoke_pod',
    name: 'Karaoke Pod',
    description:
      'One-mic chaos — synergy ×1.09 with Hot Take Host in range.',
    cost: 340,
    effect: 'multiply',
    multiplier: 1.3,
    range: 1,
    color: '#ff77aa',
    icon: '🎤',
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
    id: 'green_room',
    name: 'Green Room',
    description:
      'Pre-show calm — synergy ×1.08 with ASMR Whisperer, ×1.06 with Beauty Guru in range.',
    cost: 1080,
    effect: 'multiply',
    multiplier: 1.38,
    range: 2,
    color: '#99ddbb',
    icon: '🛋️',
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
    id: 'reels_crucible',
    name: 'Reels Crucible',
    description:
      'Vertical-first pipeline — synergy ×1.12 with Speedrun Ace in range.',
    cost: 5200,
    effect: 'multiply',
    multiplier: 2.08,
    range: 2,
    color: '#ff99dd',
    icon: '🔥',
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
    id: 'ethics_review',
    name: 'Ethics Review Room',
    description:
      'Legal + moral sign-off — synergy ×1.12 with Doc Lens in range.',
    cost: 88000,
    effect: 'multiply',
    multiplier: 2.52,
    range: 3,
    color: '#aaffcc',
    icon: '⚖️',
    size: 1,
    requiredEra: 2,
    minPrestige: 3
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
    id: 'motion_stage',
    name: 'Motion Stage',
    description:
      'Tracked cameras + LED volume — synergy ×1.14 with Debate Moderator in range.',
    cost: 42000,
    effect: 'multiply',
    multiplier: 2.42,
    range: 3,
    color: '#bbaaff',
    icon: '🎭',
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
    id: 'cdn_nexus',
    name: 'CDN Nexus',
    description:
      'Edge caches for hype spikes — synergy ×1.15 with Iron Archon in range.',
    cost: 620000,
    effect: 'multiply',
    multiplier: 3.25,
    range: 5,
    color: '#66ffdd',
    icon: '🌐',
    size: 2,
    requiredEra: 2,
    minPrestige: 4
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
    minPrestige: 6
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
    minPrestige: 10
  },
  {
    id: 'singularity_shell',
    name: 'Singularity Shell',
    description:
      'Faraday-caged hype reactor — synergy ×1.32 with Signal CEO in range.',
    cost: 4200000000,
    effect: 'multiply',
    multiplier: 8.8,
    range: 9,
    color: '#ccd9ff',
    icon: '🧬',
    size: 3,
    requiredEra: 3,
    minPrestige: 15
  },
  {
    id: 'reality_tunnel',
    name: 'Reality Tunnel',
    description:
      'Nonlinear sets for multiverse drops — synergy ×1.38 with Continuum Host in range.',
    cost: 28000000000,
    effect: 'multiply',
    multiplier: 12.5,
    range: 11,
    color: '#e8e0ff',
    icon: '🌀',
    size: 2,
    requiredEra: 3,
    minPrestige: 20
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
  { buildingTypeId: 'orbital_set', influencerTypeIds: ['galaxy_ambassador'], bonusMultiplier: 1.34 },
  { buildingTypeId: 'karaoke_pod', influencerTypeIds: ['opinion_host'], bonusMultiplier: 1.09 },
  { buildingTypeId: 'green_room', influencerTypeIds: ['asmr_whisper'], bonusMultiplier: 1.08 },
  { buildingTypeId: 'green_room', influencerTypeIds: ['beauty_guru'], bonusMultiplier: 1.06 },
  { buildingTypeId: 'reels_crucible', influencerTypeIds: ['speedrun_ace'], bonusMultiplier: 1.12 },
  { buildingTypeId: 'motion_stage', influencerTypeIds: ['debate_moderator'], bonusMultiplier: 1.14 },
  { buildingTypeId: 'cdn_nexus', influencerTypeIds: ['iron_archon'], bonusMultiplier: 1.15 },
  { buildingTypeId: 'ethics_review', influencerTypeIds: ['doc_lens'], bonusMultiplier: 1.12 },
  { buildingTypeId: 'singularity_shell', influencerTypeIds: ['signal_ceo'], bonusMultiplier: 1.32 },
  { buildingTypeId: 'reality_tunnel', influencerTypeIds: ['continuum_host'], bonusMultiplier: 1.38 }
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Rotating weekly “meta lane” — one talent archetype gets extra passive (algorithm spotlight). */
export const WEEKLY_TALENT_META_MULT = 1.1;

export function getWeeklyTalentMetaBoostTypeId(nowMs = Date.now()) {
  const week = Math.floor(Number(nowMs) / WEEK_MS);
  const ids = influencerTypes.map(t => t.id);
  if (!ids.length) return null;
  const idx = ((week % ids.length) + ids.length) % ids.length;
  return ids[idx];
}

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

/**
 * Maps old post-upgrade ids → new ladder ids so saves keep earned levels after the Posts revamp.
 */
export const LEGACY_CLICK_UPGRADE_IDS = {
  grip: 'post_t01',
  hook: 'post_t02',
  trend: 'post_t03',
  thumbnail: 'post_t04',
  schedule: 'post_t05',
  collab: 'post_t06',
  drama: 'post_t07',
  brand_kit: 'post_t08',
  talk_show: 'post_t09',
  superbowl: 'post_t10',
  matrix_pr: 'post_t11',
  singularity_feed: 'post_t12',
  omni_waves: 'post_t13'
};

export function migrateClickUpgradeLevels(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const merged = {};
  for (const [k, v] of Object.entries(raw)) {
    const target = LEGACY_CLICK_UPGRADE_IDS[k] ?? k;
    const lv = Math.max(0, Math.floor(Number(v) || 0));
    merged[target] = Math.max(merged[target] ?? 0, lv);
  }
  return merged;
}

/**
 * Post upgrades: single ladder — **listed worst → best**, matching **ascending base price** (same row is always weaker than the next).
 * Four flat tiers, then twelve multiplicative tiers with strictly rising `perLevel`.
 */
export const clickUpgradeTypes = [
  {
    id: 'post_t01',
    name: 'Thumb Training',
    description: 'Adds +1 Clout to post base per level',
    baseCost: 18,
    growth: 1.142,
    kind: 'flat',
    perLevel: 1
  },
  {
    id: 'post_t02',
    name: 'Opening Hook',
    description: 'Adds +2 Clout to post base per level',
    baseCost: 42,
    growth: 1.143,
    kind: 'flat',
    perLevel: 2
  },
  {
    id: 'post_t03',
    name: 'Trend Radar',
    description: 'Adds +3 Clout to post base per level',
    baseCost: 95,
    growth: 1.144,
    kind: 'flat',
    perLevel: 3
  },
  {
    id: 'post_t04',
    name: 'Caption Polish',
    description: 'Adds +4 Clout to post base per level',
    baseCost: 220,
    growth: 1.145,
    kind: 'flat',
    perLevel: 4
  },
  {
    id: 'post_t05',
    name: 'Thumbnail Science',
    description: 'Multiplies whole post (+4 strength / level)',
    baseCost: 500,
    growth: 1.146,
    kind: 'mult',
    perLevel: 0.04
  },
  {
    id: 'post_t06',
    name: 'Content Calendar',
    description: 'Multiplies whole post (+5 strength / level)',
    baseCost: 1150,
    growth: 1.147,
    kind: 'mult',
    perLevel: 0.05
  },
  {
    id: 'post_t07',
    name: 'Collab Engine',
    description: 'Multiplies whole post (+6 strength / level)',
    baseCost: 2650,
    growth: 1.148,
    kind: 'mult',
    perLevel: 0.06
  },
  {
    id: 'post_t08',
    name: 'Strategic Drama',
    description: 'Multiplies whole post (+7 strength / level)',
    baseCost: 6200,
    growth: 1.149,
    kind: 'mult',
    perLevel: 0.07
  },
  {
    id: 'post_t09',
    name: 'Brand Kit',
    description: 'Multiplies whole post (+8 strength / level)',
    baseCost: 14500,
    growth: 1.15,
    kind: 'mult',
    perLevel: 0.08
  },
  {
    id: 'post_t10',
    name: 'Talk Show Slot',
    description: 'Multiplies whole post (+9 strength / level)',
    baseCost: 34000,
    growth: 1.151,
    kind: 'mult',
    perLevel: 0.09
  },
  {
    id: 'post_t11',
    name: 'Halftime Bid',
    description: 'Multiplies whole post (+10 strength / level)',
    baseCost: 80000,
    growth: 1.152,
    kind: 'mult',
    perLevel: 0.1
  },
  {
    id: 'post_t12',
    name: 'Matrix PR Blitz',
    description: 'Multiplies whole post (+11 strength / level)',
    baseCost: 190000,
    growth: 1.153,
    kind: 'mult',
    perLevel: 0.11
  },
  {
    id: 'post_t13',
    name: 'Singularity Feed',
    description: 'Multiplies whole post (+13 strength / level)',
    baseCost: 450000,
    growth: 1.154,
    kind: 'mult',
    perLevel: 0.13
  },
  {
    id: 'post_t14',
    name: 'Omnichannel Waves',
    description: 'Multiplies whole post (+15 strength / level)',
    baseCost: 1100000,
    growth: 1.155,
    kind: 'mult',
    perLevel: 0.15
  },
  {
    id: 'post_t15',
    name: 'Syndication Net',
    description: 'Multiplies whole post (+17 strength / level)',
    baseCost: 2700000,
    growth: 1.156,
    kind: 'mult',
    perLevel: 0.17
  },
  {
    id: 'post_t16',
    name: 'Total Presence',
    description: 'Multiplies whole post (+20 strength / level)',
    baseCost: 6500000,
    growth: 1.157,
    kind: 'mult',
    perLevel: 0.2
  },
  {
    id: 'post_t17',
    name: 'Signal Boost',
    description: 'Multiplies whole post (+22 strength / level)',
    baseCost: 15500000,
    growth: 1.158,
    kind: 'mult',
    perLevel: 0.22,
    minPrestige: 6
  },
  {
    id: 'post_t18',
    name: 'Omnicast Grid',
    description: 'Multiplies whole post (+24 strength / level)',
    baseCost: 38000000,
    growth: 1.159,
    kind: 'mult',
    perLevel: 0.24,
    minPrestige: 8
  },
  {
    id: 'post_t19',
    name: 'Reputation Engine',
    description: 'Multiplies whole post (+27 strength / level)',
    baseCost: 92000000,
    growth: 1.16,
    kind: 'mult',
    perLevel: 0.27,
    minPrestige: 11,
    requiredEra: 2
  },
  {
    id: 'post_t20',
    name: 'Ledger Drama',
    description: 'Multiplies whole post (+30 strength / level)',
    baseCost: 220000000,
    growth: 1.161,
    kind: 'mult',
    perLevel: 0.3,
    minPrestige: 14,
    requiredEra: 2
  },
  {
    id: 'post_t21',
    name: 'Singularity Copy',
    description: 'Multiplies whole post (+34 strength / level)',
    baseCost: 520000000,
    growth: 1.162,
    kind: 'mult',
    perLevel: 0.34,
    minPrestige: 17,
    requiredEra: 3
  },
  {
    id: 'post_t22',
    name: 'Continuum Finale',
    description: 'Multiplies whole post (+40 strength / level)',
    baseCost: 1200000000,
    growth: 1.163,
    kind: 'mult',
    perLevel: 0.4,
    minPrestige: 20,
    requiredEra: 3
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
  },
  {
    id: 'orbital_sponsor',
    name: 'Orbital Sponsor Patch',
    description: 'Satellite logo read — chunky upside, measurable optics risk.',
    cloutShare: 0.18,
    followersShare: 0.16,
    reputationDelta: -9,
    minClout: 2400,
    minFollowers: 320,
    requiredEra: 3,
    color: '#99ccff'
  },
  {
    id: 'multiverse_launch',
    name: 'Multiverse SKU Launch',
    description: 'Parallel drops across regions — huge bag, messy headlines.',
    cloutShare: 0.26,
    followersShare: 0.23,
    reputationDelta: -18,
    minClout: 5200,
    minFollowers: 520,
    requiredEra: 3,
    color: '#ddaaff'
  },
  {
    id: 'continuity_grant',
    name: 'Continuity Grant',
    description: 'Platform endowment — prestige optics, slower cash than chaos deals.',
    cloutShare: 0.13,
    followersShare: 0.11,
    reputationDelta: 12,
    minClout: 4800,
    minFollowers: 480,
    requiredEra: 3,
    color: '#aaffdd'
  },
  {
    id: 'timeline_buyout',
    name: 'Timeline Buyout',
    description: 'Own the conversation for 48h — apex payout, apex backlash.',
    cloutShare: 0.34,
    followersShare: 0.3,
    reputationDelta: -32,
    minClout: 12000,
    minFollowers: 900,
    requiredEra: 3,
    color: '#ffdd66'
  }
];

/**
 * At 100% reputation, deals that only raise reputation have no upside — omit from offers and accepts.
 */
export function brandDealOfferableAtReputation(deal, reputation) {
  const rep = Number(reputation);
  const delta = deal?.reputationDelta ?? 0;
  if (!Number.isFinite(rep)) return true;
  if (rep >= 100 && delta > 0) return false;
  return true;
}

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
  },
  {
    id: 'singularity',
    label: 'Singularity season',
    favoredDealIds: ['orbital_sponsor', 'multiverse_launch', 'timeline_buyout', 'aipartner'],
    weightMult: 1.22
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
export const BRAND_SCOUT_WEIGHT_PER_COPY = 0.055;

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

// Prestige eras (cosmetic theme — advances every few prestiges; catalog era uses the same cadence)
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
  },
  {
    id: 3,
    name: 'Post-Feed Singularity',
    description: 'Omnichannel gods, orbital sets, and deals that move markets',
    theme: {
      primary: '#a8f0ff',
      secondary: '#ff66cc',
      accent: '#ffd966',
      background: '#0a0618'
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
    m *= 1 + 0.078 / (1 + i * 0.28);
  }
  return Math.min(2.35, m);
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

export function catalogDupExpBonusForInfluencerId(typeId) {
  const i = influencerTypes.findIndex(t => t.id === typeId);
  return i < 0 ? 0 : i * UNIT_PRICE_CATALOG_DUP_EXP_PER_INDEX;
}

export function catalogDupExpBonusForBuildingTypeId(typeId) {
  const i = buildingTypes.findIndex(t => t.id === typeId);
  return i < 0 ? 0 : i * UNIT_PRICE_CATALOG_DUP_EXP_PER_INDEX;
}

export function catalogDupExpBonusForManagerId(typeId) {
  const i = managerTypes.findIndex(m => m.id === typeId);
  return i < 0 ? 0 : i * UNIT_PRICE_CATALOG_DUP_EXP_PER_INDEX;
}

/** Row index in the post-upgrade ladder (0 = first tier). */
export function clickUpgradeTierIndex(upgradeId) {
  const i = clickUpgradeTypes.findIndex(u => u.id === upgradeId);
  return i < 0 ? 0 : i;
}
