import { cardSchema, type Card, type CardInput } from './schema';

// Card mechanics. Names, stories and skill text live in src/locales/<locale>/cards.json.
// Adding a card is adding an entry here and its text in every locale.
const raw: CardInput[] = [
  // Greek
  {
    id: 'zeus',
    pantheon: 'greek',
    element: 'storm',
    rarity: 'god',
    stats: { health: 1480, attack: 172, defense: 88, speed: 106 },
    skills: {
      active: {
        id: 'thunderbolt',
        target: 'enemy',
        cooldown: 3,
        effects: [
          { type: 'damage', power: 2.1 },
          { type: 'stun', chance: 0.3, turns: 1 },
        ],
      },
      ultimate: {
        id: 'aegis-storm',
        target: 'enemies',
        energy: 100,
        effects: [{ type: 'damage', power: 1.6 }],
      },
      passives: [
        {
          id: 'king-of-olympus',
          target: 'allies',
          trigger: 'battle-start',
          effects: [{ type: 'modify', stat: 'attack', amount: 0.08, turns: 99 }],
        },
      ],
    },
    relations: { allies: ['gaia'], rivals: [] },
    art: { glyph: 'bolt' },
  },
  {
    id: 'achilles',
    pantheon: 'greek',
    element: 'flame',
    rarity: 'hero',
    stats: { health: 1080, attack: 138, defense: 70, speed: 112 },
    skills: {
      active: {
        id: 'spear-of-pelion',
        target: 'enemy',
        cooldown: 2,
        effects: [{ type: 'damage', power: 1.8 }],
      },
      ultimate: {
        id: 'wrath',
        target: 'enemy',
        energy: 90,
        effects: [
          { type: 'modify', stat: 'attack', amount: 0.4, turns: 2 },
          { type: 'damage', power: 2.6 },
        ],
      },
      passives: [
        {
          id: 'dipped-in-styx',
          target: 'self',
          trigger: 'on-low-health',
          effects: [{ type: 'shield', power: 0.25, turns: 2 }],
        },
      ],
    },
    relations: { allies: ['patroclus'], rivals: [] },
    art: { glyph: 'spear' },
  },
  {
    id: 'patroclus',
    pantheon: 'greek',
    element: 'stone',
    rarity: 'mortal',
    stats: { health: 960, attack: 88, defense: 72, speed: 98 },
    skills: {
      active: {
        id: 'borrowed-armor',
        target: 'self',
        cooldown: 3,
        effects: [
          { type: 'shield', power: 0.3, turns: 2 },
          { type: 'modify', stat: 'defense', amount: 0.2, turns: 2 },
        ],
      },
      ultimate: {
        id: 'charge-at-the-walls',
        target: 'enemies',
        energy: 100,
        effects: [{ type: 'damage', power: 1.1 }],
      },
      passives: [
        {
          id: 'loyal-friend',
          target: 'ally',
          trigger: 'turn-start',
          effects: [{ type: 'heal', power: 0.15 }],
        },
      ],
    },
    relations: { allies: ['achilles'], rivals: [] },
    art: { glyph: 'shield' },
  },
  {
    id: 'medusa',
    pantheon: 'greek',
    element: 'night',
    rarity: 'demigod',
    stats: { health: 1260, attack: 132, defense: 84, speed: 101 },
    skills: {
      active: {
        id: 'stone-gaze',
        target: 'enemy',
        cooldown: 3,
        effects: [
          { type: 'damage', power: 1.2 },
          { type: 'stun', chance: 0.5, turns: 1 },
        ],
      },
      ultimate: {
        id: 'hall-of-statues',
        target: 'enemies',
        energy: 110,
        effects: [
          { type: 'modify', stat: 'speed', amount: -0.3, turns: 2 },
          { type: 'damage', power: 1.2 },
        ],
      },
      passives: [
        {
          id: 'serpent-hair',
          target: 'self',
          trigger: 'on-hit',
          effects: [{ type: 'energy', amount: 10 }],
        },
      ],
    },
    relations: { allies: [], rivals: [] },
    art: { glyph: 'serpent' },
  },
  {
    id: 'gaia',
    pantheon: 'greek',
    element: 'verdure',
    rarity: 'primordial',
    stats: { health: 1820, attack: 140, defense: 118, speed: 94 },
    skills: {
      active: {
        id: 'bountiful-earth',
        target: 'allies',
        cooldown: 3,
        effects: [{ type: 'heal', power: 0.6 }],
      },
      ultimate: {
        id: 'mother-of-all',
        target: 'allies',
        energy: 120,
        effects: [
          { type: 'heal', power: 1.1 },
          { type: 'shield', power: 0.2, turns: 2 },
        ],
      },
      passives: [
        {
          id: 'deep-roots',
          target: 'self',
          trigger: 'battle-start',
          effects: [{ type: 'modify', stat: 'defense', amount: 0.2, turns: 99 }],
        },
        {
          id: 'first-born',
          target: 'allies',
          trigger: 'turn-start',
          effects: [{ type: 'heal', power: 0.08 }],
        },
      ],
    },
    relations: { allies: ['zeus'], rivals: [] },
    art: { glyph: 'mountain' },
  },

  // Norse
  {
    id: 'thor',
    pantheon: 'norse',
    element: 'storm',
    rarity: 'god',
    stats: { health: 1560, attack: 168, defense: 96, speed: 100 },
    skills: {
      active: {
        id: 'hammer-throw',
        target: 'enemy',
        cooldown: 2,
        effects: [{ type: 'damage', power: 1.9 }],
      },
      ultimate: {
        id: 'thunder-over-midgard',
        target: 'enemies',
        energy: 100,
        effects: [
          { type: 'damage', power: 1.5 },
          { type: 'stun', chance: 0.2, turns: 1 },
        ],
      },
      passives: [
        {
          id: 'belt-of-strength',
          target: 'self',
          trigger: 'battle-start',
          effects: [{ type: 'modify', stat: 'attack', amount: 0.15, turns: 99 }],
        },
      ],
    },
    relations: { allies: ['odin'], rivals: [] },
    art: { glyph: 'hammer' },
  },
  {
    id: 'odin',
    pantheon: 'norse',
    element: 'night',
    rarity: 'god',
    stats: { health: 1440, attack: 150, defense: 92, speed: 108 },
    skills: {
      active: {
        id: 'ravens-report',
        target: 'weakest-enemy',
        cooldown: 2,
        effects: [{ type: 'damage', power: 1.7 }],
      },
      ultimate: {
        id: 'gungnir',
        target: 'enemy',
        energy: 100,
        effects: [{ type: 'damage', power: 3 }],
      },
      passives: [
        {
          id: 'all-father',
          target: 'allies',
          trigger: 'battle-start',
          effects: [{ type: 'energy', amount: 20 }],
        },
      ],
    },
    relations: { allies: ['thor'], rivals: ['fenrir', 'ymir'] },
    art: { glyph: 'raven' },
  },
  {
    id: 'fenrir',
    pantheon: 'norse',
    element: 'night',
    rarity: 'demigod',
    stats: { health: 1340, attack: 146, defense: 76, speed: 110 },
    skills: {
      active: {
        id: 'savage-bite',
        target: 'enemy',
        cooldown: 2,
        effects: [
          { type: 'damage', power: 1.6 },
          { type: 'modify', stat: 'defense', amount: -0.2, turns: 2 },
        ],
      },
      ultimate: {
        id: 'breaking-gleipnir',
        target: 'self',
        energy: 100,
        effects: [
          { type: 'modify', stat: 'attack', amount: 0.4, turns: 3 },
          { type: 'modify', stat: 'speed', amount: 0.4, turns: 3 },
        ],
      },
      passives: [
        {
          id: 'growing-hunger',
          target: 'self',
          trigger: 'turn-start',
          effects: [{ type: 'modify', stat: 'attack', amount: 0.04, turns: 99 }],
        },
      ],
    },
    relations: { allies: [], rivals: ['odin'] },
    art: { glyph: 'wolf' },
  },
  {
    id: 'ymir',
    pantheon: 'norse',
    element: 'tide',
    rarity: 'primordial',
    stats: { health: 1960, attack: 150, defense: 110, speed: 88 },
    skills: {
      active: {
        id: 'rime-breath',
        target: 'enemies',
        cooldown: 3,
        effects: [
          { type: 'damage', power: 0.9 },
          { type: 'modify', stat: 'speed', amount: -0.2, turns: 2 },
        ],
      },
      ultimate: {
        id: 'world-from-flesh',
        target: 'allies',
        energy: 130,
        effects: [
          { type: 'shield', power: 0.35, turns: 2 },
          { type: 'modify', stat: 'defense', amount: 0.25, turns: 2 },
        ],
      },
      passives: [
        {
          id: 'frost-giant',
          target: 'self',
          trigger: 'battle-start',
          effects: [{ type: 'shield', power: 0.2, turns: 3 }],
        },
      ],
    },
    relations: { allies: [], rivals: ['odin'] },
    art: { glyph: 'giant' },
  },

  // Egyptian
  {
    id: 'ra',
    pantheon: 'egyptian',
    element: 'sun',
    rarity: 'god',
    stats: { health: 1500, attack: 164, defense: 90, speed: 104 },
    skills: {
      active: {
        id: 'solar-barque',
        target: 'enemy',
        cooldown: 2,
        effects: [
          { type: 'damage', power: 1.6 },
          { type: 'burn', power: 0.2, turns: 2 },
        ],
      },
      ultimate: {
        id: 'noon-blaze',
        target: 'enemies',
        energy: 110,
        effects: [
          { type: 'damage', power: 1.4 },
          { type: 'burn', power: 0.25, turns: 2 },
        ],
      },
      passives: [
        {
          id: 'daily-rebirth',
          target: 'self',
          trigger: 'turn-start',
          effects: [{ type: 'heal', power: 0.06 }],
        },
      ],
    },
    relations: { allies: [], rivals: ['apep'] },
    art: { glyph: 'sun-disk' },
  },
  {
    id: 'anubis',
    pantheon: 'egyptian',
    element: 'night',
    rarity: 'god',
    stats: { health: 1420, attack: 150, defense: 98, speed: 102 },
    skills: {
      active: {
        id: 'weighing-of-the-heart',
        target: 'weakest-enemy',
        cooldown: 3,
        effects: [{ type: 'damage', power: 2 }],
      },
      ultimate: {
        id: 'guide-of-souls',
        target: 'allies',
        energy: 100,
        effects: [
          { type: 'heal', power: 0.7 },
          { type: 'modify', stat: 'defense', amount: 0.15, turns: 2 },
        ],
      },
      passives: [
        {
          id: 'embalmer',
          target: 'ally',
          trigger: 'on-low-health',
          effects: [{ type: 'shield', power: 0.3, turns: 2 }],
        },
      ],
    },
    relations: { allies: [], rivals: [] },
    art: { glyph: 'jackal' },
  },
  {
    id: 'apep',
    pantheon: 'egyptian',
    element: 'tide',
    rarity: 'demigod',
    stats: { health: 1380, attack: 128, defense: 88, speed: 96 },
    skills: {
      active: {
        id: 'coils-of-chaos',
        target: 'enemy',
        cooldown: 3,
        effects: [
          { type: 'damage', power: 1.1 },
          { type: 'stun', chance: 0.6, turns: 1 },
        ],
      },
      ultimate: {
        id: 'swallow-the-sun',
        target: 'enemies',
        energy: 110,
        effects: [
          { type: 'modify', stat: 'attack', amount: -0.25, turns: 2 },
          { type: 'damage', power: 1.1 },
        ],
      },
      passives: [
        {
          id: 'endless-return',
          target: 'self',
          trigger: 'on-low-health',
          effects: [{ type: 'heal', power: 0.3 }],
        },
      ],
    },
    relations: { allies: [], rivals: ['ra'] },
    art: { glyph: 'serpent' },
  },

  // Mesopotamian
  {
    id: 'gilgamesh',
    pantheon: 'mesopotamian',
    element: 'stone',
    rarity: 'hero',
    stats: { health: 1160, attack: 128, defense: 82, speed: 100 },
    skills: {
      active: {
        id: 'axe-of-heroes',
        target: 'enemy',
        cooldown: 2,
        effects: [{ type: 'damage', power: 1.7 }],
      },
      ultimate: {
        id: 'cedar-forest',
        target: 'enemy',
        energy: 100,
        effects: [
          { type: 'damage', power: 2.4 },
          { type: 'modify', stat: 'defense', amount: -0.25, turns: 2 },
        ],
      },
      passives: [
        {
          id: 'two-thirds-divine',
          target: 'self',
          trigger: 'battle-start',
          effects: [{ type: 'modify', stat: 'health', amount: 0.1, turns: 99 }],
        },
      ],
    },
    relations: { allies: ['enkidu'], rivals: [] },
    art: { glyph: 'axe' },
  },
  {
    id: 'enkidu',
    pantheon: 'mesopotamian',
    element: 'verdure',
    rarity: 'mortal',
    stats: { health: 1000, attack: 96, defense: 68, speed: 104 },
    skills: {
      active: {
        id: 'wild-strength',
        target: 'enemy',
        cooldown: 2,
        effects: [{ type: 'damage', power: 1.5 }],
      },
      ultimate: {
        id: 'brother-in-arms',
        target: 'ally',
        energy: 90,
        effects: [
          { type: 'heal', power: 0.8 },
          { type: 'modify', stat: 'attack', amount: 0.2, turns: 2 },
        ],
      },
      passives: [
        {
          id: 'friend-of-beasts',
          target: 'self',
          trigger: 'turn-start',
          effects: [{ type: 'energy', amount: 5 }],
        },
      ],
    },
    relations: { allies: ['gilgamesh'], rivals: [] },
    art: { glyph: 'antler' },
  },
  {
    id: 'tiamat',
    pantheon: 'mesopotamian',
    element: 'tide',
    rarity: 'primordial',
    stats: { health: 1880, attack: 162, defense: 104, speed: 96 },
    skills: {
      active: {
        id: 'salt-waters',
        target: 'enemies',
        cooldown: 3,
        effects: [{ type: 'damage', power: 1 }],
      },
      ultimate: {
        id: 'eleven-monsters',
        target: 'enemies',
        energy: 130,
        effects: [
          { type: 'damage', power: 1.7 },
          { type: 'modify', stat: 'defense', amount: -0.2, turns: 2 },
        ],
      },
      passives: [
        {
          id: 'mother-of-depths',
          target: 'self',
          trigger: 'on-hit',
          effects: [{ type: 'energy', amount: 8 }],
        },
      ],
    },
    relations: { allies: [], rivals: [] },
    art: { glyph: 'wave' },
  },

  // Celtic
  {
    id: 'cu-chulainn',
    pantheon: 'celtic',
    element: 'flame',
    rarity: 'hero',
    stats: { health: 1100, attack: 134, defense: 72, speed: 110 },
    skills: {
      active: {
        id: 'gae-bolg',
        target: 'enemy',
        cooldown: 3,
        effects: [{ type: 'damage', power: 2.2 }],
      },
      ultimate: {
        id: 'battle-frenzy',
        target: 'self',
        energy: 90,
        effects: [
          { type: 'modify', stat: 'attack', amount: 0.45, turns: 3 },
          { type: 'modify', stat: 'defense', amount: -0.15, turns: 3 },
        ],
      },
      passives: [
        {
          id: 'hound-of-culann',
          target: 'self',
          trigger: 'on-hit',
          effects: [{ type: 'modify', stat: 'attack', amount: 0.05, turns: 2 }],
        },
      ],
    },
    relations: { allies: [], rivals: ['morrigan'] },
    art: { glyph: 'hound' },
  },
  {
    id: 'morrigan',
    pantheon: 'celtic',
    element: 'night',
    rarity: 'god',
    stats: { health: 1400, attack: 152, defense: 86, speed: 112 },
    skills: {
      active: {
        id: 'crow-over-the-field',
        target: 'enemies',
        cooldown: 3,
        effects: [{ type: 'modify', stat: 'attack', amount: -0.2, turns: 2 }],
      },
      ultimate: {
        id: 'prophecy-of-doom',
        target: 'enemies',
        energy: 100,
        effects: [
          { type: 'damage', power: 1.3 },
          { type: 'stun', chance: 0.25, turns: 1 },
        ],
      },
      passives: [
        {
          id: 'shape-shifter',
          target: 'self',
          trigger: 'on-low-health',
          effects: [{ type: 'modify', stat: 'speed', amount: 0.3, turns: 2 }],
        },
      ],
    },
    relations: { allies: [], rivals: ['cu-chulainn'] },
    art: { glyph: 'crow' },
  },

  // Japanese
  {
    id: 'yamata-no-orochi',
    pantheon: 'japanese',
    element: 'storm',
    rarity: 'demigod',
    stats: { health: 1420, attack: 138, defense: 80, speed: 94 },
    skills: {
      active: {
        id: 'eight-heads',
        target: 'enemies',
        cooldown: 3,
        effects: [{ type: 'damage', power: 0.8 }],
      },
      ultimate: {
        id: 'valley-of-eight',
        target: 'enemies',
        energy: 110,
        effects: [
          { type: 'damage', power: 1.4 },
          { type: 'burn', power: 0.15, turns: 2 },
        ],
      },
      passives: [
        {
          id: 'eight-tails',
          target: 'self',
          trigger: 'battle-start',
          effects: [{ type: 'shield', power: 0.15, turns: 2 }],
        },
      ],
    },
    relations: { allies: [], rivals: [] },
    art: { glyph: 'serpent' },
  },
  {
    id: 'kappa',
    pantheon: 'japanese',
    element: 'tide',
    rarity: 'mortal',
    stats: { health: 920, attack: 92, defense: 74, speed: 102 },
    skills: {
      active: {
        id: 'river-pull',
        target: 'enemy',
        cooldown: 2,
        effects: [
          { type: 'damage', power: 1.3 },
          { type: 'modify', stat: 'speed', amount: -0.15, turns: 2 },
        ],
      },
      ultimate: {
        id: 'polite-bow',
        target: 'self',
        energy: 80,
        effects: [
          { type: 'heal', power: 0.5 },
          { type: 'shield', power: 0.2, turns: 2 },
        ],
      },
      passives: [
        {
          id: 'water-dish',
          target: 'self',
          trigger: 'battle-start',
          effects: [{ type: 'modify', stat: 'defense', amount: 0.1, turns: 99 }],
        },
      ],
    },
    relations: { allies: [], rivals: [] },
    art: { glyph: 'turtle' },
  },

  // Chinese
  {
    id: 'sun-wukong',
    pantheon: 'chinese',
    element: 'stone',
    rarity: 'demigod',
    stats: { health: 1300, attack: 140, defense: 82, speed: 114 },
    skills: {
      active: {
        id: 'ruyi-staff',
        target: 'enemy',
        cooldown: 2,
        effects: [{ type: 'damage', power: 1.7 }],
      },
      ultimate: {
        id: 'seventy-two-forms',
        target: 'enemies',
        energy: 100,
        effects: [
          { type: 'damage', power: 1.3 },
          { type: 'stun', chance: 0.2, turns: 1 },
        ],
      },
      passives: [
        {
          id: 'born-of-stone',
          target: 'self',
          trigger: 'battle-start',
          effects: [{ type: 'modify', stat: 'speed', amount: 0.1, turns: 99 }],
        },
      ],
    },
    relations: { allies: [], rivals: [] },
    art: { glyph: 'staff' },
  },
];

export const CARDS: readonly Card[] = raw.map((c) => cardSchema.parse(c));
export const CARDS_BY_ID: ReadonlyMap<string, Card> = new Map(CARDS.map((c) => [c.id, c]));
