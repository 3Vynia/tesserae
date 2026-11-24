import { describe, expect, it } from 'vitest';
import { CARDS } from '../data/cards';
import { EMPTY_FILTER, fold, isFiltering, matchingIds } from './collection-filter';

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
