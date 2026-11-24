import type { Pantheon } from '../data/pantheons';

/**
 * One band ornament per pantheon, each drawn on a 20 x 14 cell with the same stroke so the set
 * reads as one family. See docs/design/direction.md.
 */
export const ORNAMENTS: Record<Pantheon, string> = {
  greek: 'M0 13h1V1h14v8H7V5h4 M15 13h5',
  roman: 'M0 7h20 M4 7c1-3 4-4 6-4-1 2-3 4-6 4z M16 7c-1 3-4 4-6 4 1-2 3-4 6-4z',
  norse: 'M0 3c5 0 5 8 10 8s5-8 10-8 M0 11c5 0 5-8 10-8s5 8 10 8',
  egyptian:
    'M0 13h20 M5 13V8 M5 8C3 8 2 5 2 3c1.5 1 2.5 2 3 3 .5-1 1.5-2 3-3 0 2-1 5-3 5z M15 13V9 M15 9c-1.4 0-2-1.6-1.2-3.2L15 4l1.2 1.8C17 7.4 16.4 9 15 9z',
  mesopotamian:
    'M0 1h20 M0 13h20 M10 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M10 3v8 M6 7h8 M7.2 4.2l5.6 5.6 M12.8 4.2l-5.6 5.6',
  celtic: 'M0 12c4 0 6-2 6-5S4 3 2.5 4s-1 3 .5 3 M6 7c0 3 2 5 6 5h8',
  slavic: 'M0 7l5-5 5 5-5 5z M10 7l5-5 5 5-5 5z M3.5 7h3 M13.5 7h3',
  persian:
    'M10 13V7 M10 7C7 6 6 3 7 1c1 2 2 3 3 4 1-1 2-2 3-4 1 2 0 5-3 6z M0 13c3 0 4-3 7-3 M20 13c-3 0-4-3-7-3',
  aztec: 'M0 13h3V9h3V5h3V1h5v4h-3v4H8v4h12',
  maya: 'M0 7c3 0 4-5 7-5s3 4 1 4-2-2 0-2 M10 10a1 1 0 1 0 0 .01 M13 7c3 0 4 5 7 5',
  inca: 'M1 1h8v12H1z M3 3h4v4H3z M11 1h8v12h-8z M13 7h4v4h-4z',
  chinese: 'M0 11h4c0-3 2-5 4.5-5S13 8 12 10s-3.5 1-3-.5 M12 10c1 2 4 3 6 1 M18 11h2',
  japanese: 'M0 14a10 10 0 0 1 20 0 M3 14a7 7 0 0 1 14 0 M6 14a4 4 0 0 1 8 0',
};
