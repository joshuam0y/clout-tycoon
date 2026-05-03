export const SFX_MUTE_STORAGE_KEY = 'clout-tycoon-sfx-muted';

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

/** Short ascending chime for prestige (Web Audio API). */
export function playPrestigeChime() {
  if (isSfxMuted()) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.12, now);
    master.connect(ctx.destination);

    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.001, now + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.08, now + i * 0.05 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.35);
      osc.connect(g);
      g.connect(master);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.4);
    });

    ctx.resume?.();
    setTimeout(() => ctx.close?.(), 900);
  } catch {
    /* offline / autoplay policy */
  }
}

/** Short bright ping for trophies / achievements (Web Audio API). */
export function playAchievementPing() {
  if (isSfxMuted()) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.1, now);
    master.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + 0.25);

    ctx.resume?.();
    setTimeout(() => ctx.close?.(), 500);
  } catch {
    /* ignore */
  }
}

/** Small “cash register” tone when locking in a brand deal (Web Audio API). */
export function playBrandDealAcceptChime() {
  if (isSfxMuted()) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.09, now);
    master.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(392, now);
    osc.frequency.setValueAtTime(523.25, now + 0.06);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.06, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + 0.2);

    ctx.resume?.();
    setTimeout(() => ctx.close?.(), 400);
  } catch {
    /* ignore */
  }
}
