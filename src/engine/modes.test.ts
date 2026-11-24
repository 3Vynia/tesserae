import { describe, expect, it } from 'vitest';
import { CARDS, CARDS_BY_ID } from '../data/cards';
import { BOSSES, CHAPTERS } from '../data/stages';
import { validTeam } from './battle';
import {
  allStages,
  bossEncounter,
  campaignEncounter,
  playerFighters,
  recordWin,
  stageUnlocked,
  towerEncounter,
} from './modes';
import { createSave } from './save';

describe('modes', () => {
  it('only names cards that exist', () => {
    for (const s of allStages())
      for (const e of s.enemies) expect(CARDS_BY_ID.has(e.card)).toBe(true);
    for (const b of BOSSES) expect(CARDS_BY_ID.has(b.card)).toBe(true);
    expect(CHAPTERS.length).toBeGreaterThan(0);
  });

  it('starts with a valid team of the starters', () => {
    const save = createSave('m', 0);
    expect(validTeam(playerFighters(save, CARDS_BY_ID))).toBe(true);
  });

  it('unlocks stages in order and pays less on replays', () => {
    const save = createSave('m', 0);
    expect(stageUnlocked(save, '1-1')).toBe(true);
    expect(stageUnlocked(save, '1-2')).toBe(false);
    const first = campaignEncounter(save, '1-1', CARDS_BY_ID);
    const before = save.starlight;
    expect(recordWin(save, first)).toBe(first.reward);
    expect(save.starlight).toBe(before + first.reward);
    expect(stageUnlocked(save, '1-2')).toBe(true);
    expect(campaignEncounter(save, '1-1', CARDS_BY_ID).reward).toBeLessThan(first.reward);
  });

  it('generates the same tower floor for a save and climbs on wins', () => {
    const save = createSave('t', 0);
    const a = towerEncounter(save, CARDS);
    expect(towerEncounter(save, CARDS)).toEqual(a);
    recordWin(save, a);
    expect(save.battle.tower).toBe(1);
    expect(towerEncounter(save, CARDS).id).toBe('floor-2');
  });

  it('marks bosses as defeated', () => {
    const save = createSave('b', 0);
    const boss = bossEncounter(save, 'apep', CARDS_BY_ID);
    expect(boss.enemies[0]?.boost).toBeGreaterThan(1);
    recordWin(save, boss);
    expect(bossEncounter(save, 'apep', CARDS_BY_ID).firstClear).toBe(false);
  });
});
