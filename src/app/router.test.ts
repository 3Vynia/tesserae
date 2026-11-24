import { describe, expect, it } from 'vitest';
import { parseHash } from './router.svelte';

describe('parseHash', () => {
  it('reads route and param', () => {
    expect(parseHash('#/collection/zeus')).toEqual({ route: 'collection', param: 'zeus' });
    expect(parseHash('#/settings')).toEqual({ route: 'settings', param: null });
  });
  it('falls back to home', () => {
    expect(parseHash('')).toEqual({ route: 'home', param: null });
    expect(parseHash('#/nowhere/x')).toEqual({ route: 'home', param: null });
  });
});
