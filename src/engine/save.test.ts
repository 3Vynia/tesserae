import { describe, expect, it } from 'vitest';
import { createSave, grant, markSeen, parseSave, STARTER_CARDS } from './save';

describe('save', () => {
  it('starts with the starter team and starlight', () => {
    const save = createSave('seed', 1000);
    expect(Object.keys(save.owned).sort()).toEqual([...STARTER_CARDS].sort());
    expect(save.starlight).toBeGreaterThan(0);
    expect(parseSave(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });

  it('counts duplicates and reports new cards', () => {
    const save = createSave('seed', 0);
    expect(grant(save, 'zeus', 5)).toBe(true);
    expect(grant(save, 'zeus', 6)).toBe(false);
    expect(save.owned['zeus']).toMatchObject({ count: 2, seen: false, firstAt: 5 });
    markSeen(save, 'zeus');
    expect(save.owned['zeus']?.seen).toBe(true);
  });

  it('rejects malformed data', () => {
    expect(() => parseSave({ version: 99 })).toThrow();
    expect(() => parseSave(null)).toThrow();
  });
});
