import type { Card, Rarity } from '../data/schema';
import { dayKey } from './quests';
import { createRng } from './rng';
import { grant, type Save } from './save';

const HOUR = 3600 * 1000;

/* Offerings: free starlight that gathers at the altar, a charge at a time. */

export const OFFERING_MAX = 3;
export const OFFERING_EVERY = 2 * HOUR;
export const OFFERING_REWARD = 160;

/** Charges ready now, and when the next one arrives (null when full). */
export function offerings(save: Save, now: number): { charges: number; nextAt: number | null } {
  const { charges, at } = save.free.offerings;
  if (charges >= OFFERING_MAX) return { charges: OFFERING_MAX, nextAt: null };
  const gained = Math.floor(Math.max(0, now - at) / OFFERING_EVERY);
  const total = Math.min(OFFERING_MAX, charges + gained);
  return {
    charges: total,
    nextAt: total >= OFFERING_MAX ? null : at + (gained + 1) * OFFERING_EVERY,
  };
}

/** Takes one offering. Returns the starlight granted, or 0 when none is ready. */
export function claimOffering(save: Save, now: number): number {
  const state = offerings(save, now);
  if (state.charges < 1) return 0;
  const wasFull = state.nextAt === null;
  const gained = state.charges - save.free.offerings.charges;
  // The clock keeps running from the last arrival; from full it starts now.
  const at = wasFull ? now : save.free.offerings.at + gained * OFFERING_EVERY;
  save.free.offerings = { charges: state.charges - 1, at };
  save.starlight += OFFERING_REWARD;
  save.stats.claimed += 1;
  return OFFERING_REWARD;
}

/* Tribute: one gift per calendar day; a seven-day streak ends with a golden tessera. */

export interface TributeGift {
  starlight: number;
  golden: number;
}
export const TRIBUTE: readonly TributeGift[] = [
  { starlight: 320, golden: 0 },
  { starlight: 320, golden: 0 },
  { starlight: 480, golden: 0 },
  { starlight: 480, golden: 0 },
  { starlight: 640, golden: 0 },
  { starlight: 640, golden: 0 },
  { starlight: 800, golden: 1 },
];

function previousDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return dayKey(new Date(y, m - 1, d - 1, 12).getTime());
}

/** Where the streak stands today: the day of the cycle to claim, and whether it was taken. */
export function tribute(save: Save, now: number): { day: number; claimed: boolean } {
  const today = dayKey(now);
  const { day, streak } = save.free.tribute;
  if (day === today) return { day: (streak - 1) % TRIBUTE.length, claimed: true };
  const continues = day !== '' && day === previousDay(today);
  return { day: continues ? streak % TRIBUTE.length : 0, claimed: false };
}

export function claimTribute(save: Save, now: number): TributeGift | null {
  const state = tribute(save, now);
  if (state.claimed) return null;
  const gift = TRIBUTE[state.day] as TributeGift;
  const streak = state.day === 0 ? 1 : save.free.tribute.streak + 1;
  save.free.tribute = { day: dayKey(now), streak };
  save.starlight += gift.starlight;
  save.wallet.golden += gift.golden;
  save.stats.claimed += 1;
  return gift;
}

/* The wheel of Fortuna: one free turn every few hours; more turns cost starlight. */

export const WHEEL_EVERY = 8 * HOUR;
export const WHEEL_COST = 320;

export type WheelPrize =
  | { kind: 'starlight'; amount: number }
  | { kind: 'dust'; amount: number }
  | { kind: 'card'; rarity: Rarity }
  | { kind: 'golden'; amount: number };

/** Every slice is drawn the same size; the chances are what differ, and they are shown. */
export const WHEEL: readonly { id: string; prize: WheelPrize; weight: number }[] = [
  { id: 'starlight-s', prize: { kind: 'starlight', amount: 200 }, weight: 30 },
  { id: 'dust-s', prize: { kind: 'dust', amount: 60 }, weight: 20 },
  { id: 'card-hero', prize: { kind: 'card', rarity: 'hero' }, weight: 10 },
  { id: 'starlight-m', prize: { kind: 'starlight', amount: 480 }, weight: 20 },
  { id: 'dust-m', prize: { kind: 'dust', amount: 150 }, weight: 10 },
  { id: 'card-demigod', prize: { kind: 'card', rarity: 'demigod' }, weight: 6 },
  { id: 'starlight-l', prize: { kind: 'starlight', amount: 1600 }, weight: 3 },
  { id: 'golden', prize: { kind: 'golden', amount: 1 }, weight: 1 },
];
const WHEEL_TOTAL = WHEEL.reduce((n, s) => n + s.weight, 0);

export const wheelChance = (weight: number) => weight / WHEEL_TOTAL;

export function wheelReady(save: Save, now: number): { free: boolean; nextAt: number } {
  const nextAt = save.free.wheel.at + WHEEL_EVERY;
  return { free: save.free.wheel.at === 0 || now >= nextAt, nextAt };
}

export interface Spin {
  slice: number;
  prize: WheelPrize;
  /** The card granted, for card prizes. */
  card?: string;
  isNew?: boolean;
}

export type SpinError = 'not-enough-starlight';

/** Turns the wheel once, free when it is ready, otherwise for WHEEL_COST. Deterministic. */
export function spin(save: Save, cards: readonly Card[], now: number): Spin | { error: SpinError } {
  const free = wheelReady(save, now).free;
  if (!free && save.starlight < WHEEL_COST) return { error: 'not-enough-starlight' };
  if (free) save.free.wheel.at = now;
  else save.starlight -= WHEEL_COST;
  const rng = createRng(`${save.seed}:wheel:${save.free.wheel.spins}`);
  save.free.wheel.spins += 1;
  let roll = rng.next() * WHEEL_TOTAL;
  let slice = WHEEL.findIndex((s) => (roll -= s.weight) < 0);
  if (slice < 0) slice = 0;
  const prize = (WHEEL[slice] as (typeof WHEEL)[number]).prize;
  const out: Spin = { slice, prize };
  switch (prize.kind) {
    case 'starlight':
      save.starlight += prize.amount;
      break;
    case 'dust':
      save.wallet.dust += prize.amount;
      break;
    case 'golden':
      save.wallet.golden += prize.amount;
      break;
    case 'card': {
      const pool = cards.filter((c) => c.rarity === prize.rarity);
      const card = pool.length ? rng.pick(pool) : undefined;
      if (card) {
        out.card = card.id;
        out.isNew = grant(save, card.id, now);
      }
      break;
    }
  }
  return out;
}
