import { z } from 'zod';

/** Keywords a figure can carry on the duel board. */
export const KEYWORDS = ['guard', 'swift', 'ward', 'venom', 'drain', 'fury'] as const;
export type Keyword = (typeof KEYWORDS)[number];

const damage = z.object({
  kind: z.literal('damage'),
  amount: z.number().int().min(1),
  /** enemy: one enemy figure or the enemy hero; enemy-unit: a figure; enemies: all enemy figures. */
  target: z.enum(['enemy', 'enemy-unit', 'enemies', 'enemy-hero']),
});
const heal = z.object({
  kind: z.literal('heal'),
  amount: z.number().int().min(1),
  /** ally: one friendly figure or your hero; allies: every friendly figure and your hero. */
  target: z.enum(['ally', 'allies', 'hero']),
});
const buff = z.object({
  kind: z.literal('buff'),
  attack: z.number().int(),
  health: z.number().int().min(0),
  target: z.enum(['ally-unit', 'allies', 'self']),
});
const draw = z.object({ kind: z.literal('draw'), amount: z.number().int().min(1) });
const stun = z.object({ kind: z.literal('stun'), target: z.literal('enemy-unit') });
const ward = z.object({ kind: z.literal('ward'), target: z.enum(['ally-unit', 'self']) });
const weaken = z.object({
  kind: z.literal('weaken'),
  amount: z.number().int().min(1),
  target: z.enum(['enemy-unit', 'enemies']),
});

export const duelEffectSchema = z.discriminatedUnion('kind', [
  damage,
  heal,
  buff,
  draw,
  stun,
  ward,
  weaken,
]);
export type DuelEffect = z.infer<typeof duelEffectSchema>;

export const duelProfileSchema = z.object({
  cost: z.number().int().min(0).max(10),
  attack: z.number().int().min(0),
  health: z.number().int().min(1),
  keywords: z.array(z.enum(KEYWORDS)).default([]),
  /** Happens when the figure is played from the hand. */
  play: duelEffectSchema.optional(),
});
export type DuelProfile = z.output<typeof duelProfileSchema>;

/** Neutral rites that fill decks: short spells anyone can use. */
export interface Rite {
  id: string;
  cost: number;
  effect: DuelEffect;
}

export const RITES: readonly Rite[] = [
  { id: 'javelin', cost: 1, effect: { kind: 'damage', amount: 2, target: 'enemy' } },
  { id: 'libation', cost: 1, effect: { kind: 'heal', amount: 4, target: 'ally' } },
  { id: 'omen', cost: 2, effect: { kind: 'draw', amount: 2 } },
  { id: 'laurel', cost: 2, effect: { kind: 'buff', attack: 2, health: 2, target: 'ally-unit' } },
];
export const RITES_BY_ID: ReadonlyMap<string, Rite> = new Map(RITES.map((r) => [r.id, r]));
