import { describe, expect, it } from 'vitest';
import { CARDS, CARDS_BY_ID } from '../data/cards';
import { BOSSES } from '../data/stages';
import { createDuel, DECK_SIZE } from './duel';
import { aiTurn } from './duel-ai';
import {
  allStages,
  bossEncounter,
  campaignEncounter,
  deckReady,
  playerDeck,
  recordWin,
  stageUnlocked,
  towerEncounter,
} from './modes';
import { createSave, parseSave } from './save';

describe('modes', () => {
  it('only names cards that exist', () => {
    for (const s of allStages())
      for (const e of s.enemies) expect(CARDS_BY_ID.has(e.card)).toBe(true);
    for (const b of BOSSES) expect(CARDS_BY_ID.has(b.card)).toBe(true);
  });

  it('starts with a ready deck of the starters', () => {
    const save = createSave('m', 0);
    expect(deckReady(save)).toBe(true);
    expect(playerDeck(save)).toHaveLength(DECK_SIZE);
  });

  it('unlocks stages in order and pays less on replays', () => {
    const save = createSave('m', 0);
    expect(stageUnlocked(save, '1-1')).toBe(true);
    expect(stageUnlocked(save, '1-2')).toBe(false);
    const first = campaignEncounter(save, '1-1');
    const before = save.starlight;
    expect(recordWin(save, first)).toBe(first.reward);
    expect(save.starlight).toBe(before + first.reward);
    expect(stageUnlocked(save, '1-2')).toBe(true);
    expect(campaignEncounter(save, '1-1').reward).toBeLessThan(first.reward);
  });

  it('generates the same tower floor for a save and climbs on wins', () => {
    const save = createSave('t', 0);
    const a = towerEncounter(save, CARDS);
    expect(towerEncounter(save, CARDS)).toEqual(a);
    recordWin(save, a);
    expect(towerEncounter(save, CARDS).id).toBe('floor-2');
  });

  it('gives bosses a deep well of life', () => {
    const save = createSave('b', 0);
    const boss = bossEncounter(save, 'apep', CARDS);
    expect(boss.life).toBeGreaterThan(40);
    recordWin(save, boss);
    expect(bossEncounter(save, 'apep', CARDS).firstClear).toBe(false);
  });

  it('every encounter plays out to a winner', () => {
    const save = createSave('p', 0);
    const encounters = [
      ...allStages().map((s) => campaignEncounter(save, s.id)),
      towerEncounter(save, CARDS),
      ...BOSSES.map((b) => bossEncounter(save, b.id, CARDS)),
    ];
    for (const e of encounters) {
      const { duel } = createDuel(
        { deck: playerDeck(save) },
        { deck: e.deck, life: e.life },
        e.id,
        CARDS_BY_ID,
      );
      let turns = 0;
      while (!duel.state.winner && turns++ < 300) aiTurn(duel);
      expect(duel.state.winner, e.id).not.toBeNull();
    }
  });

  it('turns an old battle formation into a deck', () => {
    const old = JSON.parse(JSON.stringify(createSave('o', 0)));
    delete old.battle.deck;
    old.battle.team = ['achilles', null, 'kappa', null, null];
    expect(parseSave(old).battle.deck).toEqual(['achilles', 'kappa']);
  });
});
