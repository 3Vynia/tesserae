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
  /** A locked card is never dissolved, not even its duplicates. */
  locked: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(24)).max(8).default([]),
  /** Cosmetics worn by the card; every field is optional. */
  look: z
    .object({
      frame: z.string().optional(),
      tint: z.string().optional(),
      sticker: z.string().optional(),
      effect: z.string().optional(),
    })
    .default({}),
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
      z.object({
        at: z.number(),
        banner: z.string(),
        card: z.string(),
        rarity: z.string(),
        /** Pulls made with one press share a batch, so a wish can be replayed whole. */
        batch: z.number().int().min(0).default(0),
      }),
    ),
    batches: z.number().int().min(0).default(0),
    /** Starred batches stay in the history after older ones fall off. */
    favorites: z.array(z.number().int()).max(50).default([]),
    /** Pulls toward the next golden tessera. */
    meter: z.number().int().min(0).default(0),
  }),
  wallet: z
    .object({
      /** Stardust, from dissolving duplicates; spent at the market and the frame workshop. */
      dust: z.number().int().min(0),
      /** Golden tesserae: each one summons a god or a primordial. */
      golden: z.number().int().min(0),
    })
    .default({ dust: 0, golden: 0 }),
  free: z
    .object({
      offerings: z.object({ charges: z.number().int().min(0), at: z.number() }),
      tribute: z.object({ day: z.string(), streak: z.number().int().min(0) }),
      wheel: z.object({ at: z.number(), spins: z.number().int().min(0) }),
    })
    .default({
      offerings: { charges: 3, at: 0 },
      tribute: { day: '', streak: 0 },
      wheel: { at: 0, spins: 0 },
    }),
  stats: z
    .object({
      dissolved: z.number().int().min(0),
      claimed: z.number().int().min(0),
      bought: z.number().int().min(0),
    })
    .default({ dissolved: 0, claimed: 0, bought: 0 }),
  profile: z
    .object({
      name: z.string().max(24),
      motto: z.string().max(140),
      /** Up to five cards shown on the profile. */
      showcase: z.array(z.string()).max(5),
      featured: z.string().nullable(),
      theme: z.string(),
      /** Wear the theme across the whole game, not just the profile. */
      everywhere: z.boolean().default(false),
    })
    .default({
      name: '',
      motto: '',
      showcase: [],
      featured: null,
      theme: 'lapis',
      everywhere: false,
    }),
  albums: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(32),
        cards: z.array(z.string()).max(40),
      }),
    )
    .max(10)
    .default([]),
  wishlist: z.array(z.string()).max(40).default([]),
  cosmetics: z
    .object({
      /** Owned frames as "frame/color". */
      frames: z.array(z.string()),
      /** Rotations whose free gift was taken. */
      gifts: z.array(z.string()),
      glyphs: z.array(z.string()).default([]),
    })
    .default({ frames: [], gifts: [], glyphs: [] }),
  market: z
    .object({ week: z.number().int(), bought: z.array(z.string()) })
    .default({ week: -1, bought: [] }),
  quests: z
    .object({
      day: z.string(),
      progress: z.record(z.string(), z.number().int().min(0)),
      claimed: z.array(z.string()),
    })
    .default({ day: '', progress: {}, claimed: [] }),
  battle: z
    .object({
      /** Figures in the duel deck; each brings two copies. */
      deck: z.array(z.string()).max(8),
      cleared: z.array(z.string()),
      tower: z.number().int().min(0),
      bosses: z.array(z.string()),
      wins: z.number().int().min(0),
    })
    .default({ deck: [...STARTER_CARDS], cleared: [], tower: 0, bosses: [], wins: 0 }),
});
export type Save = z.infer<typeof saveSchema>;

export function createSave(seed: string, now: number): Save {
  const save: Save = {
    version: SAVE_VERSION,
    seed,
    createdAt: now,
    starlight: STARTER_STARLIGHT,
    owned: {},
    pulls: { total: 0, pity: {}, history: [], batches: 0, favorites: [], meter: 0 },
    wallet: { dust: 0, golden: 0 },
    free: {
      offerings: { charges: 3, at: 0 },
      tribute: { day: '', streak: 0 },
      wheel: { at: 0, spins: 0 },
    },
    stats: { dissolved: 0, claimed: 0, bought: 0 },
    profile: {
      name: '',
      motto: '',
      showcase: [],
      featured: null,
      theme: 'lapis',
      everywhere: false,
    },
    albums: [],
    wishlist: [],
    cosmetics: { frames: [], gifts: [], glyphs: [] },
    market: { week: -1, bought: [] },
    quests: { day: '', progress: {}, claimed: [] },
    battle: {
      deck: [...STARTER_CARDS],
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
  save.owned[cardId] = {
    count: 1,
    level: 1,
    stars: 0,
    xp: 0,
    firstAt: now,
    seen,
    locked: false,
    tags: [],
    look: {},
  };
  return true;
}

export function markSeen(save: Save, cardId: string): void {
  const owned = save.owned[cardId];
  if (owned) owned.seen = true;
}

/** Older saves kept a five-slot battle formation; it becomes the duel deck. */
function migrate(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const battle = (data as { battle?: { team?: unknown; deck?: unknown } }).battle;
  if (battle && !battle.deck && Array.isArray(battle.team)) {
    battle.deck = battle.team.filter((id): id is string => typeof id === 'string');
    delete battle.team;
  }
  return data;
}

/** Validates data from storage or an imported file. Throws with a readable message. */
export function parseSave(data: unknown): Save {
  return saveSchema.parse(migrate(structuredClone(data)));
}
