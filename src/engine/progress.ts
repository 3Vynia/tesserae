import type { OwnedCard } from './save';

export const MAX_LEVEL = 60;

/** Experience needed to go from `level` to the next one. */
export function xpToNext(level: number): number {
  return 60 + level * 40;
}

/** Adds experience and levels the card up. Returns the number of levels gained. */
export function addXp(card: OwnedCard, amount: number, cap = MAX_LEVEL): number {
  let gained = 0;
  card.xp += amount;
  while (card.level < cap && card.xp >= xpToNext(card.level)) {
    card.xp -= xpToNext(card.level);
    card.level += 1;
    gained += 1;
  }
  if (card.level >= cap) card.xp = Math.min(card.xp, xpToNext(card.level) - 1);
  return gained;
}

/** Experience each team member earns from a battle. Losing still teaches a little. */
export function battleXp(enemyLevels: readonly number[], won: boolean): number {
  const avg = enemyLevels.reduce((n, l) => n + l, 0) / Math.max(1, enemyLevels.length);
  return won ? Math.round(40 + avg * 12) : Math.round(15 + avg * 4);
}
