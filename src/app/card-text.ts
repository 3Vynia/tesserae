import type { Card } from '../data/schema';
import { skillValues } from '../data/skill-values';
import { t } from '../i18n/i18n.svelte';

type Skill =
  Card['skills']['active'] | Card['skills']['ultimate'] | Card['skills']['passives'][number];

const key = (card: Card, field: string): string => `cards.${card.id}.${field}`;

export const cardName = (card: Card): string => t(key(card, 'name'));
export const cardEpithet = (card: Card): string => t(key(card, 'epithet'));
export const cardStory = (card: Card): string => t(key(card, 'story'));
export const cardSource = (card: Card): string => t(key(card, 'source'));
export const cardTrivia = (card: Card): string => t(key(card, 'trivia'));
export const skillName = (card: Card, skill: Skill): string =>
  t(key(card, `skills.${skill.id}.name`));
export const skillDescription = (card: Card, skill: Skill): string =>
  t(key(card, `skills.${skill.id}.description`), skillValues(skill));
