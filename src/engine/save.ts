import { z } from 'zod';

export const SAVE_VERSION = 1;

export const STARTER_CARDS = ['patroclus', 'achilles', 'enkidu', 'kappa'] as const;
export const STARTER_STARLIGHT = 1600;

const ownedCard = z.object({
  count: z.number().int().min(1),
  level: z.number().int().min(1).max(60),
  stars: z.number().int().min(0).max(5),
  xp: z.number().int().min(0).default(0),
  firstAt: z.number(),
  seen: z.boolean(),
});
export type OwnedCard = z.infer<typeof ownedCard>;

export const saveSchema = z.object({
  version: z.literal(SAVE_VERSION),
  seed: z.string().min(1),
  createdAt: z.number(),
  starlight: z.number().int().min(0),
  owned: z.record(z.string(), ownedCard),
  pulls: z.object({
    total: z.number().int().min(0),
    /** Pulls since the last card of each rarity, per banner id. */
    pity: z.record(z.string(), z.object({ demigod: z.number().int(), god: z.number().int() })),
    history: z.array(
      z.object({ at: z.number(), banner: z.string(), card: z.string(), rarity: z.string() }),
    ),
  }),
  quests: z
    .object({
      day: z.string(),
      progress: z.record(z.string(), z.number().int().min(0)),
      claimed: z.array(z.string()),
    })
    .default({ day: '', progress: {}, claimed: [] }),
  battle: z
    .object({
      /** Card ids by slot: 0-2 front row, 3-4 back row. */
      team: z.array(z.string().nullable()).length(5),
      cleared: z.array(z.string()),
      tower: z.number().int().min(0),
      bosses: z.array(z.string()),
      wins: z.number().int().min(0),
    })
    .default({ team: [null, null, null, null, null], cleared: [], tower: 0, bosses: [], wins: 0 }),
});
export type Save = z.infer<typeof saveSchema>;

export function createSave(seed: string, now: number): Save {
  const save: Save = {
    version: SAVE_VERSION,
    seed,
    createdAt: now,
    starlight: STARTER_STARLIGHT,
    owned: {},
    pulls: { total: 0, pity: {}, history: [] },
    quests: { day: '', progress: {}, claimed: [] },
    battle: {
      team: [STARTER_CARDS[1], STARTER_CARDS[0], STARTER_CARDS[3], STARTER_CARDS[2], null],
      cleared: [],
      tower: 0,
      bosses: [],
      wins: 0,
    },
  };
  for (const id of STARTER_CARDS) grant(save, id, now, true);
  return save;
}

/** Adds a copy of a card. Returns true when it is new to the collection. */
export function grant(save: Save, cardId: string, now: number, seen = false): boolean {
  const existing = save.owned[cardId];
  if (existing) {
    existing.count += 1;
    return false;
  }
  save.owned[cardId] = { count: 1, level: 1, stars: 0, xp: 0, firstAt: now, seen };
  return true;
}

export function markSeen(save: Save, cardId: string): void {
  const owned = save.owned[cardId];
  if (owned) owned.seen = true;
}

/** Validates data from storage or an imported file. Throws with a readable message. */
export function parseSave(data: unknown): Save {
  return saveSchema.parse(data);
}
