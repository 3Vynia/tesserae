import type { Pantheon } from '../../data/pantheons';
import type { Element } from '../../data/schema';

/** Ground colors for placeholder art: dark mid tones so the gold glyph reads. */
export const PANTHEON_GROUND: Record<Pantheon, [string, string]> = {
  greek: ['#24406e', '#0d1a36'],
  roman: ['#4c2a2a', '#1a0f12'],
  norse: ['#26485a', '#0b1820'],
  egyptian: ['#1d3a72', '#0a1330'],
  mesopotamian: ['#5a3a26', '#1c120c'],
  celtic: ['#23493a', '#0a1a14'],
  slavic: ['#2c4230', '#0e1710'],
  persian: ['#1f4b54', '#0a1a1e'],
  aztec: ['#4d3a19', '#1a1309'],
  maya: ['#1d4a3c', '#0a1a15'],
  inca: ['#4d3219', '#1a1109'],
  chinese: ['#5a2424', '#1c0c0c'],
  japanese: ['#1f3a4c', '#0b141c'],
};

export const ELEMENT_TINT: Record<Element, string> = {
  storm: '#b4c8dc',
  tide: '#7fb3c9',
  flame: '#e8957a',
  verdure: '#86c4a6',
  stone: '#c9b48a',
  sun: '#f2c879',
  night: '#9aa6d6',
};

/**
 * Glyphs drawn for the placeholder art on a 64-unit grid, in the same engraved line as the icons.
 * Real art replaces them without touching card data (see docs/art-guide.md).
 */
export const GLYPHS: Record<string, string> = {
  bolt: 'M36 6L18 34h12l-6 24 22-32H34z',
  spear: 'M32 4l6 14-6 6-6-6z M32 24v36 M26 52h12',
  shield: 'M32 6l20 8v16c0 14-9 24-20 28C21 54 12 44 12 30V14z M32 6v52 M12 26h40',
  serpent:
    'M14 50c0-8 10-10 18-10s16-4 16-12-8-12-16-10-10 8-4 10 10-2 8-6 M48 50c-6 4-24 4-34 0 M30 18l-3-3 M33 17l3-3',
  mountain: 'M4 54l18-28 8 10 10-20 20 38z M22 26l4 8 M40 16l5 10 M4 54h56',
  hammer: 'M16 10h32v14H16z M32 24v34 M27 58h10 M16 17h-4 M52 17h-4',
  raven:
    'M10 40c8-2 14-10 18-18s12-12 20-10l6 4-8 2c4 6 2 16-6 22l4 12-10-8c-8 2-16 0-24-4z M44 16a1.5 1.5 0 1 0 0 .1',
  wolf: 'M14 54l4-22-8-14 12 4 10-12 10 12 12-4-8 14 4 22-10-8H24z M26 30l4 2 M38 30l-4 2 M32 40v4',
  giant:
    'M32 8a8 8 0 1 0 0 16a8 8 0 1 0 0-16z M18 58l4-26 10-6 10 6 4 26 M22 34l-10 12 M42 34l10 12',
  'sun-disk':
    'M32 18a12 12 0 1 0 0 24a12 12 0 1 0 0-24z M14 30c-6-6-10-4-12 0 M50 30c6-6 10-4 12 0 M24 46l-6 12 M40 46l6 12 M32 46v14',
  jackal:
    'M22 6l6 16 M42 6l-6 16 M20 24h24l-6 14 10 6-16 2-4 14-4-14-16-2 10-6z M28 32h2 M36 32h-2',
  axe: 'M22 6v52 M22 10c14 0 24 6 24 16s-10 16-24 16 M22 18c8 0 12 4 12 8s-4 8-12 8',
  antler:
    'M32 58V30 M32 30c-4-8-12-12-20-12 M20 20l-4-10 M26 24l-2-12 M32 30c4-8 12-12 20-12 M44 20l4-10 M38 24l2-12 M24 44a8 8 0 0 0 16 0',
  wave: 'M4 44c10 0 10-14 22-14s14 16 22 10 8-14 12-12 M4 54c10 0 12-8 20-8s12 8 20 8 12-6 16-6 M26 30c-6-10 4-20 14-14',
  hound: 'M10 30l10-8 4-12 6 10h14l10 10-4 6-8-2-2 22h-6l-2-12H22l-4 12h-6l2-16z M44 26h2',
  crow: 'M8 30c10-10 22-14 34-10l10-6-2 8c4 4 4 10 0 14-8 8-20 10-30 6L8 50l6-14z M46 22a1.5 1.5 0 1 0 0 .1 M30 42l-2 14 M36 42l2 14',
  turtle:
    'M32 16c12 0 20 10 20 22H12c0-12 8-22 20-22z M12 38c-4 0-6 4-4 8 M52 38c4 0 6 4 4 8 M20 38v10 M44 38v10 M32 16c-2-6 0-10 2-10s4 4 2 10 M24 26l8 6 8-6',
  staff: 'M14 56L50 8 M10 52l8 8 M46 4l8 8 M28 40c-6-4-10 0-8 4 M36 28c6 4 10 0 8-4',
};
