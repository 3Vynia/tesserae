/** Vault themes: grounds for the profile banner, and optionally for the whole game. */
export const THEMES = {
  lapis: { ground: '#1d2c63', deep: '#0e1834' },
  porphyry: { ground: '#5a2a3c', deep: '#24101a' },
  verdigris: { ground: '#1f4a44', deep: '#0c201e' },
  obsidian: { ground: '#2c2c3a', deep: '#0d0d14' },
  ochre: { ground: '#6b4a1e', deep: '#2a1c0a' },
  amethyst: { ground: '#3c2a63', deep: '#170f2a' },
} as const;
export type Theme = keyof typeof THEMES;
export const THEME_IDS = Object.keys(THEMES) as Theme[];
