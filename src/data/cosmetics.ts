import { PANTHEONS, type Pantheon } from './pantheons';

/**
 * Card cosmetics. Frames repeat a pantheon's band ornament along the card's edge, so every frame
 * belongs to the same family as the rest of the game. See docs/design/direction.md.
 */
export interface FrameDef {
  id: string;
  /** Pantheon whose ornament draws the band, or null for the two plain frames. */
  pantheon: Pantheon | null;
  price: number;
}

export const FRAMES: readonly FrameDef[] = [
  ...PANTHEONS.map((p) => ({ id: p, pantheon: p, price: 480 })),
  { id: 'constellation', pantheon: null, price: 640 },
  { id: 'gilded', pantheon: null, price: 800 },
];
export const FRAMES_BY_ID = new Map(FRAMES.map((f) => [f.id, f]));

/** Frame colors: metals and the stones of ancient mosaics. */
export const TINTS = {
  gold: '#d4ad55',
  silver: '#c9ccd4',
  bronze: '#b0703f',
  lapis: '#3f5fc4',
  porphyry: '#8e3a52',
  verdigris: '#5fa596',
  jade: '#6fae74',
  obsidian: '#3a3a46',
  ivory: '#efe6cf',
  cinnabar: '#d0533a',
  turquoise: '#4fb7c2',
} as const;
export type Tint = keyof typeof TINTS;
export const TINT_IDS = Object.keys(TINTS) as Tint[];

/** Stickers: small emblems set in a corner of the card. Pantheon seals come free with a card. */
export const GLYPHS = {
  sun: 'M12 7.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9 7 7 M17 17l2.1 2.1 M19.1 4.9 17 7 M7 17l-2.1 2.1',
  moon: 'M15.5 3.5a8.5 8.5 0 1 0 5 13.5 7 7 0 0 1-5-13.5z',
  owl: 'M6 9a6 6 0 0 1 12 0v6a6 6 0 0 1-12 0z M9.5 10a1.5 1.5 0 1 0 0 .01 M14.5 10a1.5 1.5 0 1 0 0 .01 M12 12.5l-1 1.5h2z M6 5l2.5 2 M18 5l-2.5 2',
  serpent: 'M4 18c3 0 3-4 6-4s3 4 6 4 3-4 4-6 M18 8a2 2 0 1 0 0 .01 M16 9c-2 1-2 3-2 5',
  wave: 'M2 14c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2 5-1 M2 19c2.5-3 5-3 7.5 0s5 3 7.5 0',
  eye: 'M2 12c3-5 7-7 10-7s7 2 10 7c-3 5-7 7-10 7s-7-2-10-7z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z',
  laurel:
    'M12 21V9 M12 15c-3 0-5-2-6-5 3 0 5 2 6 5z M12 11c3 0 5-2 6-5-3 0-5 2-6 5z M12 18c3 0 5-2 6-5-3 0-5 2-6 5z',
  flame: 'M12 21c-4 0-6-3-6-6 0-4 4-6 4-11 3 2 5 5 5 8 1-1 1-2 1-3 2 2 2 4 2 6 0 3-2 6-6 6z',
} as const;
export type Glyph = keyof typeof GLYPHS;
export const GLYPH_PRICE = 120;

export type StickerId = `seal-${Pantheon}` | `glyph-${Glyph}`;

/** Effects play over the art. Each one opens when a card has enough copies. */
export const EFFECTS = [
  { id: 'stardust', copies: 3 },
  { id: 'aurora', copies: 5 },
  { id: 'eclipse', copies: 10 },
] as const;
export type EffectId = (typeof EFFECTS)[number]['id'];
