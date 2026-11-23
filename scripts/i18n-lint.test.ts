import { describe, expect, it } from 'vitest';
import { compareLocales, findUnusedKeys } from './i18n-lint';

const en = { namespaces: { ui: { 'ui.a': 'A', 'ui.b': 'Hello {name}' } } };

describe('compareLocales', () => {
  it('passes when everything matches', () => {
    const es = { namespaces: { ui: { 'ui.a': 'A', 'ui.b': 'Hola {name}' } } };
    expect(compareLocales('en', { en, es })).toEqual([]);
  });

  it('reports missing, orphan and argument problems', () => {
    const es = { namespaces: { ui: { 'ui.b': 'Hola {nombre}', 'ui.c': 'C' } } };
    const issues = compareLocales('en', { en, es }).map((p) => `${p.issue}:${p.key}`);
    expect(issues).toEqual(['missing:ui.a', 'arguments:ui.b', 'orphan:ui.c']);
  });

  it('reports syntax errors and missing files', () => {
    const es = { namespaces: { other: { 'other.x': '{broken' } } };
    const issues = compareLocales('en', { en, es }).map((p) => p.issue);
    expect(issues).toContain('missing-file');
    expect(issues).toContain('orphan-file');
    expect(issues).toContain('syntax');
  });
});

describe('findUnusedKeys', () => {
  const catalog = { 'ui.a': 'A', 'ui.rarity.hero': 'Hero', 'ui.gone': 'x', 'cards.zeus': 'Zeus' };
  it('accepts literal and template prefix usage', () => {
    const code = "t('ui.a'); t(`ui.rarity.${r}`)";
    expect(findUnusedKeys('en', catalog, ['ui'], code).map((p) => p.key)).toEqual(['ui.gone']);
  });
});
