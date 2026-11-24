/** Campaign chapters and bosses. Enemy teams name cards from src/data/cards.ts. */
export interface StageEnemy {
  card: string;
  slot: number;
  level: number;
  boost?: number;
}

export interface Stage {
  id: string;
  enemies: StageEnemy[];
  /** Starlight for the first win; later wins pay a third. */
  reward: number;
}

export interface Chapter {
  id: string;
  stages: Stage[];
}

const team = (ids: string[], level: number): StageEnemy[] =>
  ids.map((card, slot) => ({ card, slot, level }));

export const CHAPTERS: Chapter[] = [
  {
    id: 'shores-of-troy',
    stages: [
      { id: '1-1', enemies: team(['kappa', 'enkidu', 'patroclus', 'kappa'], 1), reward: 120 },
      { id: '1-2', enemies: team(['enkidu', 'patroclus', 'kappa', 'enkidu'], 1), reward: 120 },
      { id: '1-3', enemies: team(['cu-chulainn', 'kappa', 'enkidu', 'patroclus'], 2), reward: 160 },
      { id: '1-4', enemies: team(['gilgamesh', 'enkidu', 'patroclus', 'kappa'], 3), reward: 160 },
      {
        id: '1-5',
        enemies: team(['achilles', 'cu-chulainn', 'patroclus', 'kappa'], 4),
        reward: 200,
      },
      {
        id: '1-6',
        enemies: team(['medusa', 'achilles', 'patroclus', 'kappa'], 5),
        reward: 320,
      },
    ],
  },
  {
    id: 'roots-of-the-world',
    stages: [
      { id: '2-1', enemies: team(['fenrir', 'kappa', 'enkidu', 'patroclus'], 6), reward: 200 },
      {
        id: '2-2',
        enemies: team(['yamata-no-orochi', 'kappa', 'gilgamesh', 'enkidu'], 7),
        reward: 200,
      },
      { id: '2-3', enemies: team(['apep', 'cu-chulainn', 'achilles', 'enkidu'], 8), reward: 240 },
      {
        id: '2-4',
        enemies: team(['sun-wukong', 'gilgamesh', 'medusa', 'kappa', 'enkidu'], 9),
        reward: 240,
      },
      {
        id: '2-5',
        enemies: team(['morrigan', 'cu-chulainn', 'fenrir', 'patroclus', 'kappa'], 10),
        reward: 280,
      },
      { id: '2-6', enemies: team(['odin', 'thor', 'fenrir', 'enkidu', 'kappa'], 12), reward: 400 },
    ],
  },
];

export interface Boss {
  id: string;
  card: string;
  level: number;
  boost: number;
  reward: number;
}

export const BOSSES: Boss[] = [
  { id: 'apep', card: 'apep', level: 6, boost: 3.2, reward: 400 },
  { id: 'ymir', card: 'ymir', level: 10, boost: 3.6, reward: 600 },
  { id: 'tiamat', card: 'tiamat', level: 15, boost: 4, reward: 800 },
];
