const MUTE_KEY = 'clout-tycoon-sfx-muted';

export function isSfxMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSfxMuted(muted) {
  try {
    if (muted) localStorage.setItem(MUTE_KEY, '1');
    else localStorage.removeItem(MUTE_KEY);
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
