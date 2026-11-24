import { CARDS } from '../data/cards';
import { RARITIES, type Card } from '../data/schema';
import type { Banner } from '../engine/gacha';

const WEEK = 7 * 24 * 3600 * 1000;

/** Cards shown on a banner's art: the rarest of its featured pantheon, or the primordials. */
export function bannerCards(banner: Banner): Card[] {
  const pool = banner.featured ? CARDS.filter((c) => c.pantheon === banner.featured) : CARDS;
  return [...pool]
    .sort((a, b) => RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity))
    .slice(0, 3);
}

/** Milliseconds until a weekly banner rotates; null for the standing banner. */
export function bannerEndsIn(banner: Banner, now: number): number | null {
  return banner.featured ? WEEK - (now % WEEK) : null;
}

export function splitDuration(ms: number): { days: number; hours: number; minutes: number } {
  const minutes = Math.floor(ms / 60000);
  return {
    days: Math.floor(minutes / 1440),
    hours: Math.floor((minutes % 1440) / 60),
    minutes: minutes % 60,
  };
}
