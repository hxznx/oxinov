import { RateLimiter } from './http-hardening.middleware';

describe('RateLimiter', () => {
  it('allows requests up to the limit and then asks the client to retry', () => {
    const limiter = new RateLimiter(3, 60_000);
    expect([limiter.hit('a', 0), limiter.hit('a', 1), limiter.hit('a', 2)]).toEqual([0, 0, 0]);
    expect(limiter.hit('a', 10_000)).toBe(50);
  });

  it('counts clients independently', () => {
    const limiter = new RateLimiter(1, 60_000);
    expect(limiter.hit('a', 0)).toBe(0);
    expect(limiter.hit('b', 0)).toBe(0);
    expect(limiter.hit('a', 0)).toBeGreaterThan(0);
  });

  it('starts a new window after the previous one ends', () => {
    const limiter = new RateLimiter(1, 60_000);
    limiter.hit('a', 0);
    expect(limiter.hit('a', 30_000)).toBeGreaterThan(0);
    expect(limiter.hit('a', 60_000)).toBe(0);
  });

  it('keeps memory bounded when many clients appear', () => {
    const limiter = new RateLimiter(1, 60_000, 2);
    limiter.hit('a', 0);
    limiter.hit('b', 0);
    expect(limiter.hit('c', 0)).toBe(0);
    // "a" was evicted as the oldest key, so it starts a fresh window.
    expect(limiter.hit('a', 0)).toBe(0);
  });
});
