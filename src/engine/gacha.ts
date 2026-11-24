import type { Card, Rarity } from '../data/schema';
import { RARITIES } from '../data/schema';
import type { Pantheon } from '../data/pantheons';
import { createRng, type Rng } from './rng';
import { grant, type Save } from './save';

/** Base chance per rarity. Shown to the player on every banner. */
export const RATES: Record<Rarity, number> = {
  mortal: 0.5,
  hero: 0.3,
  demigod: 0.14,
  god: 0.05,
  primordial: 0.01,
};

export const PULL_COST = 160;
/** A demigod or better is guaranteed within this many pulls. */
export const DEMIGOD_PITY = 10;
/** A god or better is guaranteed within this many pulls. */
export const GOD_PITY = 60;
/** From this pull on, the god-or-better chance rises by SOFT_STEP per pull. */
export const SOFT_PITY_START = 45;
export const SOFT_STEP = 0.05;
/** Share of a rarity's pulls that land on featured cards of that rarity. */
export const FEATURED_SHARE = 0.5;
const HISTORY_LIMIT = 300;

export interface Banner {
  id: string;
  /** Featured pantheon, or null for the standing banner. */
  featured: Pantheon | null;
}

export interface PullResult {
  card: string;
  rarity: Rarity;
  isNew: boolean;
}

const ORDER = (r: Rarity) => RARITIES.indexOf(r);

/** The standing banner plus one featured pantheon that rotates every week. */
export function bannersFor(now: number, cards: readonly Card[]): Banner[] {
  const pantheons = [...new Set(cards.map((c) => c.pantheon))].sort();
  const week = Math.floor(now / (7 * 24 * 3600 * 1000));
  const featured = pantheons[week % pantheons.length] ?? null;
  return [
    { id: 'night-vault', featured: null },
    { id: `featured-${featured}-${week}`, featured },
  ];
}

/** Chance of each rarity for the next pull given the pity counters. */
export function currentRates(pity: { demigod: number; god: number }): Record<Rarity, number> {
  const nextPull = pity.god + 1;
  if (nextPull >= GOD_PITY) {
    // Hard pity: only god or primordial, keeping their relative weight.
    const total = RATES.god + RATES.primordial;
    return {
      mortal: 0,
      hero: 0,
      demigod: 0,
      god: RATES.god / total,
      primordial: RATES.primordial / total,
    };
  }
  const boost = nextPull >= SOFT_PITY_START ? (nextPull - SOFT_PITY_START + 1) * SOFT_STEP : 0;
  const high = Math.min(1, RATES.god + RATES.primordial + boost);
  const godShare = RATES.god / (RATES.god + RATES.primordial);
  if (pity.demigod + 1 >= DEMIGOD_PITY) {
    return {
      mortal: 0,
      hero: 0,
      demigod: 1 - high,
      god: high * godShare,
      primordial: high * (1 - godShare),
    };
  }
  const low = 1 - high;
  const lowBase = RATES.mortal + RATES.hero + RATES.demigod;
  return {
    mortal: (RATES.mortal / lowBase) * low,
    hero: (RATES.hero / lowBase) * low,
    demigod: (RATES.demigod / lowBase) * low,
    god: high * godShare,
    primordial: high * (1 - godShare),
  };
}

function rollRarity(rng: Rng, rates: Record<Rarity, number>): Rarity {
  let roll = rng.next();
  for (const rarity of RARITIES) {
    roll -= rates[rarity];
    if (roll < 0) return rarity;
  }
  return 'mortal';
}

function pickCard(rng: Rng, cards: readonly Card[], rarity: Rarity, banner: Banner): Card {
  const pool = cards.filter((c) => c.rarity === rarity);
  const featured = banner.featured ? pool.filter((c) => c.pantheon === banner.featured) : [];
  if (featured.length && rng.chance(FEATURED_SHARE)) return rng.pick(featured);
  return rng.pick(pool);
}

export type PullError = 'not-enough-starlight' | 'empty-pool';

/**
 * Pulls `count` cards on a banner. Deterministic: each pull draws from an RNG seeded with the save
 * seed and the running pull count, so the same save always produces the same results.
 */
export function pull(
  save: Save,
  banner: Banner,
  count: number,
  cards: readonly Card[],
  now: number,
): { results: PullResult[] } | { error: PullError } {
  if (save.starlight < PULL_COST * count) return { error: 'not-enough-starlight' };
  if (cards.length === 0) return { error: 'empty-pool' };
  const pity = (save.pulls.pity[banner.id] ??= { demigod: 0, god: 0 });
  const results: PullResult[] = [];
  save.starlight -= PULL_COST * count;

  for (let i = 0; i < count; i++) {
    const rng = createRng(`${save.seed}:pull:${save.pulls.total}`);
    let rarity = rollRarity(rng, currentRates(pity));
    // No cards of that rarity yet: fall back to the closest lower rarity that has cards.
    while (!cards.some((c) => c.rarity === rarity) && ORDER(rarity) > 0) {
      rarity = RARITIES[ORDER(rarity) - 1] as Rarity;
    }
    const card = pickCard(rng, cards, rarity, banner);
    const isNew = grant(save, card.id, now);
    pity.demigod = ORDER(rarity) >= ORDER('demigod') ? 0 : pity.demigod + 1;
    pity.god = ORDER(rarity) >= ORDER('god') ? 0 : pity.god + 1;
    save.pulls.total += 1;
    save.pulls.history.unshift({ at: now, banner: banner.id, card: card.id, rarity });
    results.push({ card: card.id, rarity, isNew });
  }
  save.pulls.history.length = Math.min(save.pulls.history.length, HISTORY_LIMIT);
  return { results };
}

/** Pulls left until each guarantee, for display. */
export function pityStatus(save: Save, bannerId: string): { demigod: number; god: number } {
  const pity = save.pulls.pity[bannerId] ?? { demigod: 0, god: 0 };
  return { demigod: DEMIGOD_PITY - pity.demigod, god: GOD_PITY - pity.god };
}
