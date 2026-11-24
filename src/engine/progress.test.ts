import { describe, expect, it } from 'vitest';
import { addXp, battleXp, MAX_LEVEL, xpToNext } from './progress';

const card = () => ({ count: 1, level: 1, stars: 0, xp: 0, firstAt: 0, seen: true });

describe('progress', () => {
  it('levels up across several thresholds', () => {
    const c = card();
    const gained = addXp(c, xpToNext(1) + xpToNext(2) + 5);
    expect(gained).toBe(2);
    expect(c).toMatchObject({ level: 3, xp: 5 });
  });

  it('stops at the cap', () => {
    const c = card();
    addXp(c, 10_000_000);
    expect(c.level).toBe(MAX_LEVEL);
    expect(c.xp).toBeLessThan(xpToNext(MAX_LEVEL));
    const capped = card();
    addXp(capped, 10_000, 5);
    expect(capped.level).toBe(5);
  });

  it('pays more for wins and harder enemies', () => {
    expect(battleXp([5, 5], true)).toBeGreaterThan(battleXp([5, 5], false));
    expect(battleXp([10], true)).toBeGreaterThan(battleXp([1], true));
    expect(battleXp([], false)).toBeGreaterThan(0);
  });
});
