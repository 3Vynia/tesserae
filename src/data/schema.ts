import { z } from 'zod';
import { PANTHEONS } from './pantheons';

export const RARITIES = ['mortal', 'hero', 'demigod', 'god', 'primordial'] as const;
export type Rarity = (typeof RARITIES)[number];

/**
 * Elements form a cycle where each beats the next (storm > tide > flame > verdure > stone > storm),
 * plus sun and night, which beat each other.
 */
export const ELEMENTS = ['storm', 'tide', 'flame', 'verdure', 'stone', 'sun', 'night'] as const;
export type Element = (typeof ELEMENTS)[number];

export const STATS = ['health', 'attack', 'defense', 'speed'] as const;
export type Stat = (typeof STATS)[number];

const id = z.string().regex(/^[a-z][a-z0-9-]*$/, 'ids are lowercase kebab-case');

const target = z.enum([
  'enemy', // the enemy the card is facing
  'enemies', // every enemy
  'weakest-enemy', // enemy with the lowest health ratio
  'self',
  'ally', // the ally with the lowest health ratio
  'allies', // every ally, the card included
]);

const effect = z.discriminatedUnion('type', [
  z.object({ type: z.literal('damage'), power: z.number().positive() }),
  z.object({ type: z.literal('heal'), power: z.number().positive() }),
  z.object({
    type: z.literal('shield'),
    power: z.number().positive(),
    turns: z.number().int().min(1),
  }),
  z.object({
    type: z.literal('modify'),
    stat: z.enum(STATS),
    amount: z.number().min(-0.9).max(2),
    turns: z.number().int().min(1),
  }),
  z.object({
    type: z.literal('stun'),
    chance: z.number().min(0).max(1),
    turns: z.number().int().min(1),
  }),
  z.object({
    type: z.literal('burn'),
    power: z.number().positive(),
    turns: z.number().int().min(1),
  }),
  z.object({ type: z.literal('energy'), amount: z.number().int() }),
]);
export type Effect = z.infer<typeof effect>;

const action = z.object({ id, target, effects: z.array(effect).min(1) });

export const cardSchema = z
  .object({
    id,
    pantheon: z.enum(PANTHEONS),
    element: z.enum(ELEMENTS),
    rarity: z.enum(RARITIES),
    stats: z.object({
      health: z.number().int().positive(),
      attack: z.number().int().positive(),
      defense: z.number().int().nonnegative(),
      speed: z.number().int().positive(),
    }),
    skills: z.object({
      active: action.extend({ cooldown: z.number().int().min(1).max(6) }),
      ultimate: action.extend({ energy: z.number().int().min(50).max(150) }),
      passives: z
        .array(
          action.extend({
            trigger: z.enum(['battle-start', 'turn-start', 'on-hit', 'on-low-health']),
          }),
        )
        .min(1)
        .max(2),
    }),
    relations: z.object({ allies: z.array(id), rivals: z.array(id) }),
    art: z.object({
      /** Glyph drawn on the placeholder art; see docs/art-guide.md. */
      glyph: z.string().min(1),
      /** Optional file name of real art under public/art; placeholder used when missing. */
      file: z.string().optional(),
    }),
    frame: z.string().default('standard'),
    effect: z.string().default('none'),
  })
  .strict();

export type CardInput = z.input<typeof cardSchema>;
export type Card = z.output<typeof cardSchema>;

/** Text keys every card must provide in every locale, relative to `cards.<id>.`. */
export function cardTextKeys(card: Card): string[] {
  const skills = [card.skills.active, card.skills.ultimate, ...card.skills.passives];
  return [
    'name',
    'epithet',
    'story',
    'source',
    'trivia',
    ...skills.flatMap((s) => [`skills.${s.id}.name`, `skills.${s.id}.description`]),
  ];
}
