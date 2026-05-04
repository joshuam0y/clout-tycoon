import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { subscribeMatchMedia } from './matchMediaSubscribe';

beforeEach(() => {
  globalThis.window = globalThis;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete globalThis.window;
});

describe('subscribeMatchMedia', () => {
  it('invokes onMatch after microtask and on media change', async () => {
    let changeHandler;
    const mq = {
      matches: true,
      addEventListener: vi.fn((type, cb) => {
        if (type === 'change') changeHandler = cb;
      }),
      removeEventListener: vi.fn((type, cb) => {
        if (changeHandler === cb) changeHandler = undefined;
      })
    };
    vi.stubGlobal('matchMedia', vi.fn(() => mq));

    const onMatch = vi.fn();
    const unsub = subscribeMatchMedia('(max-width: 900px)', onMatch);

    expect(onMatch).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(onMatch).toHaveBeenCalledWith(true);

    mq.matches = false;
    changeHandler();
    expect(onMatch).toHaveBeenLastCalledWith(false);

    unsub();
    expect(mq.removeEventListener).toHaveBeenCalled();
  });

  it('uses addListener / removeListener when addEventListener is missing', async () => {
    const mq = {
      matches: false,
      addListener: vi.fn(fn => {
        mq._fn = fn;
      }),
      removeListener: vi.fn(fn => {
        if (mq._fn === fn) mq._fn = undefined;
      })
    };
    vi.stubGlobal('matchMedia', vi.fn(() => mq));

    const onMatch = vi.fn();
    const unsub = subscribeMatchMedia('(max-width: 1px)', onMatch);
    await Promise.resolve();
    expect(mq.addListener).toHaveBeenCalled();
    expect(onMatch).toHaveBeenCalledWith(false);
    unsub();
    expect(mq.removeListener).toHaveBeenCalled();
  });
});
