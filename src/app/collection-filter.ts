import { RARITIES, type Card, type Element, type Rarity } from '../data/schema';

export type Show = 'all' | 'owned' | 'missing';
/** Marks a card can carry in the vault, used as filters. */
export const MARKS = ['locked', 'tagged', 'wished', 'spare', 'custom', 'unseen'] as const;
export type Mark = (typeof MARKS)[number];
export const SORTS = ['pantheon', 'rarity', 'recent', 'name', 'copies'] as const;
export type Sort = (typeof SORTS)[number];

export interface CollectionFilter {
  query: string;
  rarities: ReadonlySet<Rarity>;
  elements: ReadonlySet<Element>;
  show: Show;
  marks: ReadonlySet<Mark>;
  tag: string | null;
}

export const EMPTY_FILTER: CollectionFilter = {
  query: '',
  rarities: new Set(),
  elements: new Set(),
  show: 'all',
  marks: new Set(),
  tag: null,
};

/** A fresh empty filter, with its own sets. */
export const emptyFilter = (): CollectionFilter => ({
  ...EMPTY_FILTER,
  rarities: new Set(),
  elements: new Set(),
  marks: new Set(),
});

export const isFiltering = (f: CollectionFilter): boolean =>
  f.query.trim() !== '' ||
  f.rarities.size > 0 ||
  f.elements.size > 0 ||
  f.show !== 'all' ||
  (f.marks?.size ?? 0) > 0 ||
  !!f.tag;

/** What the vault knows about a card beyond the card itself. */
export interface Traits {
  marks: ReadonlySet<Mark>;
  tags: readonly string[];
  copies: number;
  firstAt: number;
}

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
  traits?: (id: string) => Traits,
): Set<string> {
  const query = fold(filter.query.trim());
  const marks = filter.marks ?? new Set<Mark>();
  return new Set(
    cards
      .filter((c) => filter.rarities.size === 0 || filter.rarities.has(c.rarity))
      .filter((c) => filter.elements.size === 0 || filter.elements.has(c.element))
      .filter((c) => filter.show === 'all' || (filter.show === 'owned') === owned(c.id))
      .filter((c) => !query || names(c).some((n) => fold(n).includes(query)))
      .filter((c) => {
        if (!traits || (marks.size === 0 && !filter.tag)) return true;
        const tr = traits(c.id);
        return (
          [...marks].every((m) => tr.marks.has(m)) && (!filter.tag || tr.tags.includes(filter.tag))
        );
      })
      .map((c) => c.id),
  );
}

/** Orders cards for the flat views. Ties fall back to the card list order. */
export function sortCards(
  cards: readonly Card[],
  sort: Sort,
  traits: (id: string) => Traits,
  name: (card: Card) => string,
): Card[] {
  const rank = (c: Card) => RARITIES.indexOf(c.rarity);
  const out = [...cards];
  switch (sort) {
    case 'rarity':
      return out.sort((a, b) => rank(b) - rank(a));
    case 'recent':
      return out.sort((a, b) => traits(b.id).firstAt - traits(a.id).firstAt);
    case 'name':
      return out.sort((a, b) => name(a).localeCompare(name(b)));
    case 'copies':
      return out.sort((a, b) => traits(b.id).copies - traits(a.id).copies);
    default:
      return out;
  }
}

/** Returns a new set with `value` added or removed. */
export function toggle<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
