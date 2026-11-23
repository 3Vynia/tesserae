import { describe, expect, it } from 'vitest';
import { createRng, hashSeed } from './rng';

describe('rng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng('olympus');
    const b = createRng('olympus');
    const seqA = Array.from({ length: 50 }, () => a.next());
    const seqB = Array.from({ length: 50 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('differs between seeds', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });

  it('stays in range', () => {
    const rng = createRng('range');
    for (let i = 0; i < 2000; i++) {
      const f = rng.next();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = rng.int(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
    }
  });

  it('covers the whole integer range roughly evenly', () => {
    const rng = createRng('even');
    const counts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 60000; i++) counts[rng.int(0, 5)]!++;
    for (const c of counts) expect(Math.abs(c - 10000)).toBeLessThan(500);
  });

  it('resumes from a saved state', () => {
    const rng = createRng('resume');
    rng.next();
    const resumed = createRng(rng.state());
    expect(resumed.next()).toBe(rng.next());
  });

  it('rejects bad input', () => {
    const rng = createRng(0);
    expect(() => rng.int(5, 1)).toThrow(RangeError);
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it('hashes seeds to unsigned 32-bit words', () => {
    for (const w of hashSeed('x')) {
      expect(Number.isInteger(w)).toBe(true);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThan(2 ** 32);
    }
  });
});
