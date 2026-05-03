import { describe, it, expect } from 'vitest';

/** Thumbnail Science (post_t05) `perLevel` in gameData */
const THUMBNAIL_PER_LEVEL = 0.04;

/**
 * Toy model: each post = B × M × T, where
 * B = "flat" Clout from base + all Adds… rows,
 * M = all other mults (prestige, followers, other mult rows… folded into one),
 * T = Thumbnail row only: (1 + perLevel) ** L
 */
function toyPostClout(B, M, thumbnailLevel) {
  const T = Math.pow(1 + THUMBNAIL_PER_LEVEL, thumbnailLevel);
  return B * M * T;
}

function gainFromOneCaptionLevel(B, M, thumbL) {
  const before = toyPostClout(B, M, thumbL);
  const after = toyPostClout(B + 4, M, thumbL);
  return { before, after, gain: after - before };
}

function gainFromOneThumbnailLevel(B, M, thumbL) {
  const before = toyPostClout(B, M, thumbL);
  const after = toyPostClout(B, M, thumbL + 1);
  return { before, after, gain: after - before };
}

describe('Caption Polish vs Thumbnail (simple B × M toy model)', () => {
  it('small B: one Caption level beats one Thumbnail level', () => {
    const B = 10;
    const M = 5;
    expect(toyPostClout(B, M, 0)).toBe(50);
    const c = gainFromOneCaptionLevel(B, M, 0);
    const t = gainFromOneThumbnailLevel(B, M, 0);
    expect(c.gain).toBeGreaterThan(t.gain);
    expect(c.gain).toBe(20);
    expect(c.before).toBe(50);
    expect(c.after).toBe(70);
  });

  it('large B: one Thumbnail level beats one Caption level', () => {
    const B = 200;
    const M = 5;
    const c = gainFromOneCaptionLevel(B, M, 0);
    const t = gainFromOneThumbnailLevel(B, M, 0);
    expect(t.gain).toBeGreaterThan(c.gain);
    expect(c.gain).toBe(20);
  });
});
