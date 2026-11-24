import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { RARITIES, type Rarity } from '../data/schema';
import {
  bannersFor,
  currentRates,
  DEMIGOD_PITY,
  GOD_PITY,
  pityStatus,
  pull,
  PULL_COST,
  RATES,
} from './gacha';
import { createSave } from './save';

const rich = (seed = 'test') => {
  const save = createSave(seed, 0);
  save.starlight = PULL_COST * 100_000;
  return save;
};
const banner = { id: 'night-vault', featured: null };
const sum = (r: Record<Rarity, number>) => RARITIES.reduce((n, k) => n + r[k], 0);

describe('rates', () => {
  it('base rates add up to one', () => {
    expect(sum(RATES)).toBeCloseTo(1);
    const now = currentRates({ demigod: 0, god: 0 });
    for (const r of RARITIES) expect(now[r]).toBeCloseTo(RATES[r]);
  });

  it('always add up to one under every pity state', () => {
    for (let d = 0; d < DEMIGOD_PITY; d++) {
      for (let g = 0; g < GOD_PITY; g++)
        expect(sum(currentRates({ demigod: d, god: g }))).toBeCloseTo(1);
    }
  });

  it('guarantees at the pity limits', () => {
    const atDemigod = currentRates({ demigod: DEMIGOD_PITY - 1, god: 0 });
    expect(atDemigod.mortal + atDemigod.hero).toBe(0);
    const atGod = currentRates({ demigod: 0, god: GOD_PITY - 1 });
    expect(atGod.god + atGod.primordial).toBeCloseTo(1);
  });
});

describe('pull', () => {
  it('is deterministic for a seed', () => {
    const a = pull(rich('same'), banner, 10, CARDS, 0);
    const b = pull(rich('same'), banner, 10, CARDS, 0);
    expect(a).toEqual(b);
  });

  it('charges, records history and refuses when short', () => {
    const save = createSave('x', 0);
    const before = save.starlight;
    const out = pull(save, banner, 1, CARDS, 5);
    expect('results' in out).toBe(true);
    expect(save.starlight).toBe(before - PULL_COST);
    expect(save.pulls.history[0]).toMatchObject({ at: 5, banner: 'night-vault' });
    save.starlight = 0;
    expect(pull(save, banner, 1, CARDS, 5)).toEqual({ error: 'not-enough-starlight' });
  });

  it('never breaks the pity guarantees over many pulls', () => {
    const save = rich('pity');
    let sinceDemigod = 0;
    let sinceGod = 0;
    const counts: Record<string, number> = {};
    for (let i = 0; i < 6000; i++) {
      const out = pull(save, banner, 1, CARDS, 0);
      if (!('results' in out)) throw new Error('pull failed');
      const r = out.results[0]!.rarity;
      counts[r] = (counts[r] ?? 0) + 1;
      sinceDemigod = ['demigod', 'god', 'primordial'].includes(r) ? 0 : sinceDemigod + 1;
      sinceGod = ['god', 'primordial'].includes(r) ? 0 : sinceGod + 1;
      expect(sinceDemigod).toBeLessThan(DEMIGOD_PITY);
      expect(sinceGod).toBeLessThan(GOD_PITY);
    }
    // Pity lifts the effective high-rarity rate above the base one.
    expect((counts['god'] ?? 0) / 6000).toBeGreaterThan(RATES.god);
    expect(counts['primordial']).toBeGreaterThan(0);
  });

  it('favors featured cards on a featured banner', () => {
    const save = rich('featured');
    const featured = { id: 'f', featured: 'norse' as const };
    let norse = 0;
    let total = 0;
    for (let i = 0; i < 600; i++) {
      const out = pull(save, featured, 1, CARDS, 0);
      if ('results' in out) {
        const card = CARDS.find((c) => c.id === out.results[0]!.card)!;
        if (card.rarity === 'god' || card.rarity === 'demigod') {
          total++;
          if (card.pantheon === 'norse') norse++;
        }
      }
    }
    expect(norse / total).toBeGreaterThan(0.4);
  });

  it('reports pulls left until each guarantee', () => {
    const save = rich('status');
    expect(pityStatus(save, 'night-vault')).toEqual({ demigod: DEMIGOD_PITY, god: GOD_PITY });
  });
});

describe('banners', () => {
  it('rotate the featured pantheon weekly', () => {
    const week = 7 * 24 * 3600 * 1000;
    const [, a] = bannersFor(0, CARDS);
    const [, b] = bannersFor(week, CARDS);
    expect(a!.featured).not.toBe(b!.featured);
    expect(bannersFor(0, CARDS)[0]!.featured).toBeNull();
  });
});
