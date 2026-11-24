import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import {
  EMPTY_FILTER,
  emptyFilter,
  fold,
  isFiltering,
  matchingIds,
  sortCards,
  type Mark,
  type Traits,
} from './collection-filter';

const owned = new Set(['zeus', 'achilles']);
const names = (c: { id: string }) => [
  c.id.replace(/-/g, ' '),
  c.id === 'cu-chulainn' ? 'Cú Chulainn' : c.id,
];
const run = (patch: Partial<typeof EMPTY_FILTER>) =>
  matchingIds(CARDS, (id) => owned.has(id), { ...EMPTY_FILTER, ...patch }, names);

describe('collection filter', () => {
  it('matches everything when empty', () => {
    expect(run({}).size).toBe(CARDS.length);
    expect(isFiltering(EMPTY_FILTER)).toBe(false);
  });

  it('combines rarity, element and ownership', () => {
    expect([...run({ rarities: new Set(['god']), elements: new Set(['storm']) })].sort()).toEqual([
      'thor',
      'zeus',
    ]);
    expect([...run({ show: 'owned' })].sort()).toEqual(['achilles', 'zeus']);
    expect(run({ show: 'missing' }).has('zeus')).toBe(false);
  });

  it('searches names ignoring accents and case', () => {
    expect(fold('Cú Chulainn')).toBe('cu chulainn');
    expect([...run({ query: 'CU CHU' })]).toEqual(['cu-chulainn']);
    expect(isFiltering({ ...EMPTY_FILTER, query: 'x' })).toBe(true);
  });
});

describe('marks and sorting', () => {
  const traits = (id: string): Traits => ({
    marks: new Set<Mark>(id === 'zeus' ? ['locked', 'tagged'] : []),
    tags: id === 'zeus' ? ['sky'] : [],
    copies: id === 'zeus' ? 3 : 1,
    firstAt: id === 'zeus' ? 10 : 0,
  });
  it('filters by marks and tag', () => {
    const f = { ...emptyFilter(), marks: new Set<Mark>(['locked']), tag: 'sky' };
    expect([
      ...matchingIds(
        CARDS,
        () => true,
        f,
        (c) => [c.id],
        traits,
      ),
    ]).toEqual(['zeus']);
  });
  it('sorts by copies and recency', () => {
    expect(sortCards(CARDS, 'copies', traits, (c) => c.id)[0]?.id).toBe('zeus');
    expect(sortCards(CARDS, 'recent', traits, (c) => c.id)[0]?.id).toBe('zeus');
  });
});
