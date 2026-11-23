import { describe, expect, it } from 'vitest';
import { buildCatalog, createTranslator, flatten, messageArguments, pickLocale } from './core';

describe('flatten', () => {
  it('produces dotted keys', () => {
    expect(flatten({ a: { b: 'x', c: { d: 'y' } }, e: 'z' })).toEqual({
      'a.b': 'x',
      'a.c.d': 'y',
      e: 'z',
    });
  });

  it('prefixes namespaces', () => {
    expect(buildCatalog({ ui: { hi: 'Hi' } })).toEqual({ 'ui.hi': 'Hi' });
  });
});

describe('pickLocale', () => {
  const available = ['en', 'es'];
  it('matches exact and base tags', () => {
    expect(pickLocale(['es-CO', 'en'], available)).toBe('es');
    expect(pickLocale(['EN-gb'], available)).toBe('en');
  });
  it('falls back to english', () => {
    expect(pickLocale(['ja', 'fr'], available)).toBe('en');
    expect(pickLocale([], available)).toBe('en');
  });
});

describe('translator', () => {
  const en = { 'ui.cards': '{count, plural, one {# card} other {# cards}}', 'ui.only': 'Only' };
  const es = { 'ui.cards': '{count, plural, one {# carta} other {# cartas}}' };

  it('formats plurals per locale', () => {
    const tr = createTranslator('es', es, en);
    expect(tr.t('ui.cards', { count: 1 })).toBe('1 carta');
    expect(tr.t('ui.cards', { count: 1200 })).toBe('1200 cartas');
  });

  it('falls back to the source locale, then to the key', () => {
    const missing: string[] = [];
    const tr = createTranslator('es', es, en, (k) => missing.push(k));
    expect(tr.t('ui.only')).toBe('Only');
    expect(tr.t('ui.nope')).toBe('ui.nope');
    expect(missing).toEqual(['ui.only', 'ui.nope']);
  });

  it('formats numbers and dates for the locale', () => {
    const tr = createTranslator('es', es);
    expect(tr.number(12345.5)).toBe('12.345,5');
    expect(tr.date(new Date(Date.UTC(2024, 0, 15)), { timeZone: 'UTC', month: 'long' })).toBe(
      'enero',
    );
  });
});

describe('messageArguments', () => {
  it('lists arguments including nested ones', () => {
    expect(
      messageArguments('{name} has {count, plural, one {# {thing}} other {many}}', 'en'),
    ).toEqual(['count', 'name', 'thing']);
  });
});
