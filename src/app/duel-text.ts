import { CARDS_BY_ID } from '../data/cards';
import type { DuelEffect, Keyword } from '../data/duel';
import type { DeckEntry } from '../engine/duel';
import { t } from '../i18n/i18n.svelte';
import { cardName } from './card-text';

/** Plain-language text for a duel effect, built from its data. */
export function effectText(effect: DuelEffect): string {
  switch (effect.kind) {
    case 'damage':
      return t(`ui.duel.effect.damage.${effect.target}`, { amount: effect.amount });
    case 'heal':
      return t(`ui.duel.effect.heal.${effect.target}`, { amount: effect.amount });
    case 'buff':
      return t(`ui.duel.effect.buff.${effect.target}`, {
        attack: effect.attack,
        health: effect.health,
      });
    case 'draw':
      return t('ui.duel.effect.draw', { amount: effect.amount });
    case 'stun':
      return t('ui.duel.effect.stun');
    case 'ward':
      return t(`ui.duel.effect.ward.${effect.target}`);
    case 'weaken':
      return t(`ui.duel.effect.weaken.${effect.target}`, { amount: effect.amount });
  }
}

export const keywordName = (k: Keyword): string => t(`ui.duel.keyword.${k}.name`);
export const keywordDesc = (k: Keyword): string => t(`ui.duel.keyword.${k}.desc`);

export function entryName(entry: DeckEntry): string {
  if (entry.kind === 'rite') return t(`ui.duel.rites.${entry.id}`);
  const card = CARDS_BY_ID.get(entry.id);
  return card ? cardName(card) : entry.id;
}
