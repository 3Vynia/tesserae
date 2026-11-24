import { describe, expect, it } from 'vitest';
import { CARDS, CARDS_BY_ID } from './cards';
import { cardTextKeys, RARITIES } from './schema';
import { skillValues } from './skill-values';
import { catalogs } from '../i18n/catalogs';
import { messageArguments } from '../i18n/core';

describe('card data', () => {
  it('has at least 20 cards across at least 5 pantheons and every rarity', () => {
    expect(CARDS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(CARDS.map((c) => c.pantheon)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(CARDS.map((c) => c.rarity))).toEqual(new Set(RARITIES));
  });

  it('has unique card ids and unique skill ids within a card', () => {
    expect(CARDS_BY_ID.size).toBe(CARDS.length);
    for (const card of CARDS) {
      const ids = [card.skills.active, card.skills.ultimate, ...card.skills.passives].map(
        (s) => s.id,
      );
      expect(new Set(ids).size, card.id).toBe(ids.length);
    }
  });

  it('only relates cards that exist, never to themselves', () => {
    for (const card of CARDS) {
      for (const other of [...card.relations.allies, ...card.relations.rivals]) {
        expect(CARDS_BY_ID.has(other), `${card.id} -> ${other}`).toBe(true);
        expect(other).not.toBe(card.id);
      }
    }
  });
});

describe('card text', () => {
  for (const [locale, catalog] of Object.entries(catalogs)) {
    it(`is complete in ${locale}`, () => {
      const missing = CARDS.flatMap((card) =>
        cardTextKeys(card)
          .map((k) => `cards.${card.id}.${k}`)
          .filter((k) => !(k in catalog)),
      );
      expect(missing).toEqual([]);
    });

    it(`has no text for unknown cards or skills in ${locale}`, () => {
      const expected = new Set(
        CARDS.flatMap((card) => cardTextKeys(card).map((k) => `cards.${card.id}.${k}`)),
      );
      const orphans = Object.keys(catalog).filter(
        (k) => k.startsWith('cards.') && !expected.has(k),
      );
      expect(orphans).toEqual([]);
    });

    it(`uses only placeholders the skill data provides in ${locale}`, () => {
      for (const card of CARDS) {
        for (const skill of [card.skills.active, card.skills.ultimate, ...card.skills.passives]) {
          const message = catalog[`cards.${card.id}.skills.${skill.id}.description`] ?? '';
          const provided = Object.keys(skillValues(skill));
          for (const arg of messageArguments(message, locale)) {
            expect(provided, `${card.id}/${skill.id}: {${arg}}`).toContain(arg);
          }
        }
      }
    });
  }
});

describe('skillValues', () => {
  it('reads percentages and turns from the data', () => {
    const zeus = CARDS_BY_ID.get('zeus')!;
    expect(skillValues(zeus.skills.active)).toMatchObject({
      damage: 210,
      chance: 30,
      turns: 1,
      cooldown: 3,
    });
    expect(skillValues(zeus.skills.ultimate)).toMatchObject({ damage: 160, cost: 100 });
  });
});
