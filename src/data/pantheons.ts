export const PANTHEONS = [
  'greek',
  'roman',
  'norse',
  'egyptian',
  'mesopotamian',
  'celtic',
  'slavic',
  'persian',
  'aztec',
  'maya',
  'inca',
  'chinese',
  'japanese',
] as const;

export type Pantheon = (typeof PANTHEONS)[number];
