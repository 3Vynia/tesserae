import type { Card } from '../data/schema';
import { RITES } from '../data/duel';
import { BOSSES, CHAPTERS, type Stage } from '../data/stages';
import { buildDeck, START_LIFE, type DeckEntry } from './duel';
import { createRng } from './rng';
import type { Save } from './save';

export type Mode = 'campaign' | 'tower' | 'boss';
export const DECK_FIGURES_MIN = 4;
export const DECK_FIGURES_MAX = 8;

export interface Encounter {
  mode: Mode;
  id: string;
  /** Cards the opponent plays, for previews. */
  faces: string[];
  level: number;
  deck: DeckEntry[];
  life: number;
  reward: number;
  firstClear: boolean;
}

const RITE_IDS = RITES.map((r) => r.id);

export function allStages(): Stage[] {
  return CHAPTERS.flatMap((c) => c.stages);
}

/** A stage is open when it is the first one or the previous stage has been cleared. */
export function stageUnlocked(save: Save, stageId: string): boolean {
  const stages = allStages();
  const i = stages.findIndex((s) => s.id === stageId);
  if (i <= 0) return i === 0;
  const previous = stages[i - 1];
  return !!previous && save.battle.cleared.includes(previous.id);
}

export function campaignEncounter(save: Save, stageId: string): Encounter {
  const stage = allStages().find((s) => s.id === stageId);
  if (!stage) throw new Error(`unknown stage ${stageId}`);
  const level = stage.enemies[0]?.level ?? 1;
  const firstClear = !save.battle.cleared.includes(stage.id);
  const unique = [...new Set(stage.enemies.map((e) => e.card))];
  return {
    mode: 'campaign',
    id: stage.id,
    faces: unique,
    level,
    deck: buildDeck(
      unique.map((id) => ({ id, level })),
      RITE_IDS,
    ),
    life: START_LIFE - 6 + level * 2,
    reward: firstClear ? stage.reward : Math.round(stage.reward / 3),
    firstClear,
  };
}

/** Tower floors are generated from the save seed: same floor, same opponent, every time. */
export function towerEncounter(save: Save, cards: readonly Card[]): Encounter {
  const floor = save.battle.tower + 1;
  const rng = createRng(`${save.seed}:tower:${floor}`);
  const size = Math.min(8, 4 + Math.floor(floor / 3));
  const pool = [...cards];
  const picks: string[] = [];
  while (picks.length < size && pool.length) {
    const [card] = pool.splice(rng.int(0, pool.length - 1), 1);
    if (card) picks.push(card.id);
  }
  const level = Math.min(60, 1 + Math.floor(floor * 1.5));
  return {
    mode: 'tower',
    id: `floor-${floor}`,
    faces: picks,
    level,
    deck: buildDeck(
      picks.map((id) => ({ id, level })),
      RITE_IDS,
    ),
    life: START_LIFE - 4 + floor * 2,
    reward: 100 + floor * 20,
    firstClear: true,
  };
}

/** A boss brings its own pantheon and a deep well of life. */
export function bossEncounter(save: Save, bossId: string, cards: readonly Card[]): Encounter {
  const boss = BOSSES.find((b) => b.id === bossId);
  const bossCard = cards.find((c) => c.id === boss?.card);
  if (!boss || !bossCard) throw new Error(`unknown boss ${bossId}`);
  const kin = cards.filter((c) => c.pantheon === bossCard.pantheon && c.id !== bossCard.id);
  const ids = [bossCard.id, bossCard.id, ...kin.map((c) => c.id)].slice(0, 6);
  const firstClear = !save.battle.bosses.includes(boss.id);
  return {
    mode: 'boss',
    id: boss.id,
    faces: [bossCard.id],
    level: boss.level,
    deck: buildDeck(
      ids.map((id) => ({ id, level: boss.level })),
      RITE_IDS,
    ),
    life: Math.round(START_LIFE * boss.boost),
    reward: firstClear ? boss.reward : Math.round(boss.reward / 4),
    firstClear,
  };
}

/** Records a win and pays the reward. Returns the starlight granted. */
export function recordWin(save: Save, encounter: Encounter): number {
  if (encounter.mode === 'campaign' && !save.battle.cleared.includes(encounter.id)) {
    save.battle.cleared.push(encounter.id);
  }
  if (encounter.mode === 'tower') save.battle.tower += 1;
  if (encounter.mode === 'boss' && !save.battle.bosses.includes(encounter.id)) {
    save.battle.bosses.push(encounter.id);
  }
  save.battle.wins += 1;
  save.starlight += encounter.reward;
  return encounter.reward;
}

/** The player's deck figures, skipping cards they no longer own. */
export function deckFigures(save: Save): { id: string; level: number }[] {
  return save.battle.deck.flatMap((id) => {
    const owned = save.owned[id];
    return owned ? [{ id, level: owned.level }] : [];
  });
}

export function playerDeck(save: Save): DeckEntry[] {
  return buildDeck(deckFigures(save), RITE_IDS);
}

export function deckReady(save: Save): boolean {
  const n = deckFigures(save).length;
  return n >= DECK_FIGURES_MIN && n <= DECK_FIGURES_MAX;
}
