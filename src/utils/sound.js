export const SFX_MUTE_STORAGE_KEY = 'clout-tycoon-sfx-muted';

let sharedCtx = null;

export function isSfxMuted() {
  try {
    return localStorage.getItem(SFX_MUTE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSfxMuted(muted) {
  try {
    if (muted) localStorage.setItem(SFX_MUTE_STORAGE_KEY, '1');
    else localStorage.removeItem(SFX_MUTE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Lazily create one AudioContext and resume it (required after user gesture on most browsers).
 * Call from first pointer/key on the page; play* functions await this internally too.
 */
export async function unlockAudioContext() {
  if (isSfxMuted()) return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new Ctx();
  }
  if (sharedCtx.state === 'suspended') {
    try {
      await sharedCtx.resume();
    } catch {
      return null;
    }
  }
  return sharedCtx;
}

function runWhenUnlocked(schedule) {
  if (isSfxMuted()) return;
  void (async () => {
    const ctx = await unlockAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      schedule(ctx, now);
    } catch {
      /* offline / scheduling */
    }
  })();
}

/** Short ascending chime for prestige (Web Audio API). */
export function playPrestigeChime() {
  runWhenUnlocked((ctx, now) => {
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.22, now);
    master.connect(ctx.destination);

    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.001, now + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.1, now + i * 0.05 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.35);
      osc.connect(g);
      g.connect(master);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.4);
    });
  });
}

/** Short bright ping for trophies / achievements (Web Audio API). */
export function playAchievementPing() {
  runWhenUnlocked((ctx, now) => {
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.18, now);
    master.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + 0.25);
  });
}

/** Small “cash register” tone when locking in a brand deal (Web Audio API). */
export function playBrandDealAcceptChime() {
  runWhenUnlocked((ctx, now) => {
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.16, now);
    master.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(392, now);
    osc.frequency.setValueAtTime(523.25, now + 0.06);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + 0.2);
  });
}

/** Manual “Post content” tap — short so rapid clicking stays pleasant. */
export function playClickPostTick() {
  runWhenUnlocked((ctx, now) => {
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.14, now);
    master.connect(ctx.destination);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.028);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.07, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + 0.07);
  });
}

/** Clout shop purchases: hire, build, post upgrade, staff. */
export function playPurchaseChime() {
  runWhenUnlocked((ctx, now) => {
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.17, now);
    master.connect(ctx.destination);
    const notes = [659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.045);
      g.gain.setValueAtTime(0.001, now + i * 0.045);
      g.gain.exponentialRampToValueAtTime(0.085, now + i * 0.045 + 0.018);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.14);
      osc.connect(g);
      g.connect(master);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.16);
    });
  });
}

/** Gem spend / premium actions — brighter, shorter sparkle. */
export function playGemSpendChime() {
  runWhenUnlocked((ctx, now) => {
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.15, now);
    master.connect(ctx.destination);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(990, now);
    osc.frequency.exponentialRampToValueAtTime(1580, now + 0.05);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.07, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + 0.13);
  });
}
