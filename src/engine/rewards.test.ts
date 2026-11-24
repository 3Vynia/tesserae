import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import {
  claimOffering,
  claimTribute,
  OFFERING_EVERY,
  OFFERING_MAX,
  OFFERING_REWARD,
  offerings,
  spin,
  TRIBUTE,
  tribute,
  WHEEL,
  WHEEL_COST,
  WHEEL_EVERY,
  wheelChance,
} from './rewards';
import { createSave } from './save';

const day = (n: number) => new Date(2026, 0, 1 + n, 10).getTime();

describe('offerings', () => {
  it('starts full and refills one charge at a time', () => {
    const save = createSave('s', 0);
    const t0 = day(0);
    expect(offerings(save, t0)).toEqual({ charges: OFFERING_MAX, nextAt: null });
    const before = save.starlight;
    for (let i = 0; i < OFFERING_MAX; i++) expect(claimOffering(save, t0)).toBe(OFFERING_REWARD);
    expect(claimOffering(save, t0)).toBe(0);
    expect(save.starlight).toBe(before + OFFERING_REWARD * OFFERING_MAX);
    expect(offerings(save, t0).nextAt).toBe(t0 + OFFERING_EVERY);
    expect(offerings(save, t0 + OFFERING_EVERY).charges).toBe(1);
    expect(offerings(save, t0 + OFFERING_EVERY * 10).charges).toBe(OFFERING_MAX);
  });

  it('keeps the clock when a charge is taken mid-refill', () => {
    const save = createSave('s', 0);
    const t0 = day(0);
    for (let i = 0; i < OFFERING_MAX; i++) claimOffering(save, t0);
    const later = t0 + OFFERING_EVERY * 1.5;
    expect(claimOffering(save, later)).toBe(OFFERING_REWARD);
    expect(offerings(save, later)).toEqual({ charges: 0, nextAt: t0 + OFFERING_EVERY * 2 });
  });
});

describe('tribute', () => {
  it('pays once a day and grows with the streak', () => {
    const save = createSave('s', 0);
    expect(tribute(save, day(0))).toEqual({ day: 0, claimed: false });
    expect(claimTribute(save, day(0))).toEqual(TRIBUTE[0]);
    expect(claimTribute(save, day(0))).toBeNull();
    expect(tribute(save, day(1)).day).toBe(1);
    claimTribute(save, day(1));
    expect(save.free.tribute.streak).toBe(2);
  });

  it('gives a golden tessera on the seventh day and starts over', () => {
    const save = createSave('s', 0);
    for (let i = 0; i < 7; i++) claimTribute(save, day(i));
    expect(save.wallet.golden).toBe(1);
    expect(tribute(save, day(7)).day).toBe(0);
  });

  it('resets after a missed day', () => {
    const save = createSave('s', 0);
    claimTribute(save, day(0));
    claimTribute(save, day(1));
    expect(tribute(save, day(3))).toEqual({ day: 0, claimed: false });
  });
});

describe('wheel', () => {
  it('chances add up to one', () => {
    expect(WHEEL.reduce((n, s) => n + wheelChance(s.weight), 0)).toBeCloseTo(1);
  });

  it('is free once per period, then costs starlight', () => {
    const save = createSave('s', 0);
    save.starlight = WHEEL_COST;
    const t0 = day(0);
    expect('error' in spin(save, CARDS, t0)).toBe(false);
    const paid = spin(save, CARDS, t0 + 1);
    expect('error' in paid).toBe(false);
    expect(save.starlight).toBeGreaterThanOrEqual(0);
    save.starlight = 0;
    expect(spin(save, CARDS, t0 + 2)).toEqual({ error: 'not-enough-starlight' });
    expect('error' in spin(save, CARDS, t0 + WHEEL_EVERY)).toBe(false);
  });

  it('is deterministic and grants what it shows', () => {
    const a = createSave('wheel', 0);
    const b = createSave('wheel', 0);
    a.starlight = b.starlight = 1_000_000;
    for (let i = 0; i < 40; i++) {
      const x = spin(a, CARDS, day(0) + i);
      expect(x).toEqual(spin(b, CARDS, day(0) + i));
      if ('error' in x) throw new Error('spin failed');
      if (x.prize.kind === 'card') expect(a.owned[x.card ?? '']).toBeDefined();
    }
  });
});
