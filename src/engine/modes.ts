import type { Card } from '../data/schema';
import { BOSSES, CHAPTERS, type Stage } from '../data/stages';
import type { Fighter } from './battle';
import { createRng } from './rng';
import type { Save } from './save';

export type Mode = 'campaign' | 'tower' | 'boss';

export interface Encounter {
  mode: Mode;
  id: string;
  enemies: Fighter[];
  reward: number;
  firstClear: boolean;
}

const lookup = (cards: ReadonlyMap<string, Card>, id: string): Card => {
  const card = cards.get(id);
  if (!card) throw new Error(`unknown card ${id}`);
  return card;
};

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

export function campaignEncounter(
  save: Save,
  stageId: string,
  cards: ReadonlyMap<string, Card>,
): Encounter {
  const stage = allStages().find((s) => s.id === stageId);
  if (!stage) throw new Error(`unknown stage ${stageId}`);
  const firstClear = !save.battle.cleared.includes(stage.id);
  return {
    mode: 'campaign',
    id: stage.id,
    enemies: stage.enemies.map((e) => ({
      card: lookup(cards, e.card),
      slot: e.slot,
      level: e.level,
      stars: 0,
    })),
    reward: firstClear ? stage.reward : Math.round(stage.reward / 3),
    firstClear,
  };
}

/** Tower floors are generated from the save seed: same floor, same enemies, every time. */
export function towerEncounter(save: Save, cards: readonly Card[]): Encounter {
  const floor = save.battle.tower + 1;
  const rng = createRng(`${save.seed}:tower:${floor}`);
  const size = floor < 5 ? 4 : 5;
  const pool = [...cards];
  const enemies: Fighter[] = [];
  for (let slot = 0; slot < size && pool.length; slot++) {
    const [card] = pool.splice(rng.int(0, pool.length - 1), 1);
    if (!card) break;
    enemies.push({ card, slot, level: Math.min(60, 1 + Math.floor(floor * 1.5)), stars: 0 });
  }
  return {
    mode: 'tower',
    id: `floor-${floor}`,
    enemies,
    reward: 100 + floor * 20,
    firstClear: true,
  };
}

export function bossEncounter(
  save: Save,
  bossId: string,
  cards: ReadonlyMap<string, Card>,
): Encounter {
  const boss = BOSSES.find((b) => b.id === bossId);
  if (!boss) throw new Error(`unknown boss ${bossId}`);
  const firstClear = !save.battle.bosses.includes(boss.id);
  return {
    mode: 'boss',
    id: boss.id,
    enemies: [
      { card: lookup(cards, boss.card), slot: 1, level: boss.level, stars: 0, boost: boss.boost },
    ],
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

/** The player's team as fighters, skipping cards they no longer own. */
export function playerFighters(save: Save, cards: ReadonlyMap<string, Card>): Fighter[] {
  return save.battle.team.flatMap((id, slot) => {
    const owned = id ? save.owned[id] : undefined;
    const card = id ? cards.get(id) : undefined;
    return owned && card ? [{ card, slot, level: owned.level, stars: owned.stars }] : [];
  });
}
