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
const HISTORY_LIMIT = 2000;
/** Every this many pulls on any banner earns a golden tessera. */
export const GOLDEN_EVERY = 200;
/** Amounts offered on the altar; any other amount up to MAX_PULLS can be typed. */
export const PULL_AMOUNTS = [1, 10, 100, 1000] as const;
export const MAX_PULLS = 5000;

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

export type PullError = 'not-enough-starlight' | 'empty-pool' | 'bad-count' | 'no-golden';

function record(save: Save, entry: Save['pulls']['history'][number]): void {
  save.pulls.history.unshift(entry);
}

/** Keeps the history bounded, but never drops a starred batch. */
function trimHistory(save: Save): void {
  const history = save.pulls.history;
  if (history.length <= HISTORY_LIMIT) return;
  const kept = new Set(save.pulls.favorites);
  save.pulls.history = history.filter((e, i) => i < HISTORY_LIMIT || kept.has(e.batch));
}

/** Chance that the next pull on a banner gives this exact card, given the pity counters. */
export function cardChance(
  cardId: string,
  banner: Banner,
  pity: { demigod: number; god: number },
  cards: readonly Card[],
): number {
  const card = cards.find((c) => c.id === cardId);
  if (!card) return 0;
  const rate = currentRates(pity)[card.rarity];
  const pool = cards.filter((c) => c.rarity === card.rarity);
  const featured = banner.featured ? pool.filter((c) => c.pantheon === banner.featured) : [];
  const fromFeatured = card.pantheon === banner.featured ? FEATURED_SHARE / featured.length : 0;
  const fromPool = (featured.length ? 1 - FEATURED_SHARE : 1) / pool.length;
  return rate * ((featured.length ? fromFeatured : 0) + fromPool);
}

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
): { results: PullResult[]; golden: number; batch: number } | { error: PullError } {
  if (!Number.isInteger(count) || count < 1 || count > MAX_PULLS) return { error: 'bad-count' };
  if (save.starlight < PULL_COST * count) return { error: 'not-enough-starlight' };
  if (cards.length === 0) return { error: 'empty-pool' };
  const pity = (save.pulls.pity[banner.id] ??= { demigod: 0, god: 0 });
  const results: PullResult[] = [];
  save.starlight -= PULL_COST * count;
  const batch = (save.pulls.batches += 1);
  let golden = 0;

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
    save.pulls.meter += 1;
    if (save.pulls.meter >= GOLDEN_EVERY) {
      save.pulls.meter -= GOLDEN_EVERY;
      save.wallet.golden += 1;
      golden += 1;
    }
    record(save, { at: now, banner: banner.id, card: card.id, rarity, batch });
    results.push({ card: card.id, rarity, isNew });
  }
  trimHistory(save);
  return { results, golden, batch };
}

/**
 * Spends a golden tessera: one god or primordial from the banner, by their relative base rates.
 * It leaves the pity counters and the golden meter alone.
 */
export function summonGolden(
  save: Save,
  banner: Banner,
  cards: readonly Card[],
  now: number,
): { results: PullResult[]; batch: number } | { error: PullError } {
  if (save.wallet.golden < 1) return { error: 'no-golden' };
  const high = cards.filter((c) => c.rarity === 'god' || c.rarity === 'primordial');
  if (high.length === 0) return { error: 'empty-pool' };
  save.wallet.golden -= 1;
  const batch = (save.pulls.batches += 1);
  const rng = createRng(`${save.seed}:golden:${batch}`);
  const hasPrimordial = high.some((c) => c.rarity === 'primordial');
  const primordial = hasPrimordial && rng.chance(RATES.primordial / (RATES.god + RATES.primordial));
  const rarity: Rarity = primordial ? 'primordial' : 'god';
  const card = pickCard(rng, cards, rarity, banner);
  const isNew = grant(save, card.id, now);
  record(save, { at: now, banner: banner.id, card: card.id, rarity, batch });
  trimHistory(save);
  return { results: [{ card: card.id, rarity, isNew }], batch };
}

/** Groups the history into wishes, newest first. */
export function historyBatches(
  save: Save,
): { batch: number; at: number; banner: string; cards: { card: string; rarity: string }[] }[] {
  const out: ReturnType<typeof historyBatches> = [];
  for (const entry of save.pulls.history) {
    const last = out[out.length - 1];
    if (last && last.batch === entry.batch) last.cards.unshift(entry);
    else out.push({ batch: entry.batch, at: entry.at, banner: entry.banner, cards: [entry] });
  }
  return out;
}

export function toggleFavorite(save: Save, batch: number): void {
  const list = save.pulls.favorites;
  const at = list.indexOf(batch);
  if (at >= 0) list.splice(at, 1);
  else if (list.length < 50) list.push(batch);
}

/** Pulls left until each guarantee, for display. */
export function pityStatus(save: Save, bannerId: string): { demigod: number; god: number } {
  const pity = save.pulls.pity[bannerId] ?? { demigod: 0, god: 0 };
  return { demigod: DEMIGOD_PITY - pity.demigod, god: GOD_PITY - pity.god };
}
