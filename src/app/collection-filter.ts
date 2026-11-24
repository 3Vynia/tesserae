import type { Card, Element, Rarity } from '../data/schema';

export type Show = 'all' | 'owned' | 'missing';

export interface CollectionFilter {
  query: string;
  rarities: ReadonlySet<Rarity>;
  elements: ReadonlySet<Element>;
  show: Show;
}

export const EMPTY_FILTER: CollectionFilter = {
  query: '',
  rarities: new Set(),
  elements: new Set(),
  show: 'all',
};

export const isFiltering = (f: CollectionFilter): boolean =>
  f.query.trim() !== '' || f.rarities.size > 0 || f.elements.size > 0 || f.show !== 'all';

/** Case and accent insensitive comparison, so "cu chulainn" finds "Cú Chulainn". */
export const fold = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export function matchingIds(
  cards: readonly Card[],
  owned: (id: string) => boolean,
  filter: CollectionFilter,
  names: (card: Card) => string[],
): Set<string> {
  const query = fold(filter.query.trim());
  return new Set(
    cards
      .filter((c) => filter.rarities.size === 0 || filter.rarities.has(c.rarity))
      .filter((c) => filter.elements.size === 0 || filter.elements.has(c.element))
      .filter((c) => filter.show === 'all' || (filter.show === 'owned') === owned(c.id))
      .filter((c) => !query || names(c).some((n) => fold(n).includes(query)))
      .map((c) => c.id),
  );
}

/** Returns a new set with `value` added or removed. */
export function toggle<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
