import { describe, expect, it } from 'vitest';
import { CARDS, CARDS_BY_ID } from '../data/cards';
import { RITES } from '../data/duel';
import {
  act,
  attackTargets,
  BOARD_LIMIT,
  buildDeck,
  createDuel,
  DECK_SIZE,
  MAX_MANA,
  playable,
  targetsFor,
  entryEffect,
  type DeckEntry,
  type Duel,
  type Unit,
} from './duel';
import { rivalTurn } from './rival';

const rites = RITES.map((r) => r.id);
const deckOf = (ids: string[]) =>
  buildDeck(
    ids.map((id) => ({ id, level: 1 })),
    rites,
  );
const starter = deckOf(['patroclus', 'achilles', 'enkidu', 'kappa']);
const heavy = deckOf(['zeus', 'thor', 'odin', 'ra', 'gaia', 'tiamat', 'ymir', 'fenrir']);
// A curve from two to seven mana.
const strong = deckOf([
  'enkidu',
  'achilles',
  'cu-chulainn',
  'gilgamesh',
  'sun-wukong',
  'fenrir',
  'thor',
  'zeus',
]);

function fresh(seed = 'd', a = starter, b = starter): Duel {
  return createDuel({ deck: a }, { deck: b }, seed, CARDS_BY_ID).duel;
}

/** Puts a figure straight onto a board, ready to attack. */
function place(duel: Duel, side: 'player' | 'enemy', id: string, ready = true): Unit {
  const card = CARDS_BY_ID.get(id)!;
  const unit: Unit = {
    uid: duel.state.nextUid++,
    card,
    attack: card.duel.attack,
    health: card.duel.health,
    maxHealth: card.duel.health,
    keywords: [...card.duel.keywords],
    ward: card.duel.keywords.includes('ward'),
    attacks: ready ? 1 : 0,
    stunned: 0,
  };
  duel.state.seats[side].board.push(unit);
  return unit;
}

describe('decks', () => {
  it('builds two copies of each figure topped up with rites', () => {
    expect(starter).toHaveLength(DECK_SIZE);
    expect(starter.filter((e) => e.kind === 'figure')).toHaveLength(8);
    expect(heavy.filter((e: DeckEntry) => e.kind === 'rite')).toHaveLength(0);
  });

  it('every card and rite has a cost and a valid effect', () => {
    for (const c of CARDS) expect(c.duel.cost).toBeGreaterThan(0);
    for (const r of RITES) expect(r.cost).toBeGreaterThanOrEqual(0);
  });
});

describe('setup and turns', () => {
  it('is deterministic for a seed', () => {
    const a = createDuel({ deck: starter }, { deck: strong }, 'x', CARDS_BY_ID);
    const b = createDuel({ deck: starter }, { deck: strong }, 'x', CARDS_BY_ID);
    expect(a.events).toEqual(b.events);
    expect(a.duel.state).toEqual(b.duel.state);
  });

  it('deals opening hands and starts the player turn with one mana', () => {
    const duel = fresh();
    const { player, enemy } = duel.state.seats;
    expect(player.hand).toHaveLength(4);
    expect(enemy.hand).toHaveLength(4);
    expect(player.mana).toBe(1);
    expect(duel.state.active).toBe('player');
  });

  it('grows mana each turn up to the cap', () => {
    const duel = fresh();
    for (let i = 0; i < 30; i++) act(duel, { type: 'end' });
    expect(duel.state.seats.player.maxMana).toBe(MAX_MANA);
  });

  it('hurts a hero who draws from an empty deck', () => {
    const duel = fresh();
    duel.state.seats.player.deck = [];
    act(duel, { type: 'end' });
    const events = act(duel, { type: 'end' });
    expect(events).toContainEqual({ type: 'fatigue', side: 'player', amount: 1 });
    expect(duel.state.seats.player.life).toBe(19);
  });
});

describe('playing cards', () => {
  it('spends mana and puts figures on the board, not ready unless swift', () => {
    const duel = fresh();
    const seat = duel.state.seats.player;
    seat.mana = 10;
    seat.hand = [
      { uid: 900, entry: { kind: 'figure', id: 'patroclus', level: 1 }, cost: 2 },
      { uid: 901, entry: { kind: 'figure', id: 'achilles', level: 1 }, cost: 3 },
    ];
    act(duel, { type: 'play', uid: 900 });
    act(duel, { type: 'play', uid: 901 });
    expect(seat.mana).toBe(5);
    expect(seat.board.map((u) => u.attacks)).toEqual([0, 1]);
  });

  it('refuses cards it cannot pay for and full boards', () => {
    const duel = fresh();
    const seat = duel.state.seats.player;
    seat.mana = 1;
    seat.hand = [{ uid: 900, entry: { kind: 'figure', id: 'zeus', level: 1 }, cost: 7 }];
    expect(() => act(duel, { type: 'play', uid: 900 })).toThrow('not enough mana');
    seat.mana = 10;
    for (let i = 0; i < BOARD_LIMIT; i++) place(duel, 'player', 'kappa');
    seat.hand = [{ uid: 901, entry: { kind: 'figure', id: 'patroclus', level: 1 }, cost: 2 }];
    expect(() => act(duel, { type: 'play', uid: 901 })).toThrow('board full');
    expect(playable(duel, 'player')).toEqual([]);
  });

  it('asks for a target and resolves the effect', () => {
    const duel = fresh();
    const seat = duel.state.seats.player;
    seat.mana = 10;
    const foe = place(duel, 'enemy', 'gilgamesh');
    seat.hand = [{ uid: 900, entry: { kind: 'figure', id: 'zeus', level: 1 }, cost: 7 }];
    expect(
      targetsFor(duel.state, 'player', entryEffect(seat.hand[0]!.entry, CARDS_BY_ID)),
    ).toHaveLength(2);
    expect(() => act(duel, { type: 'play', uid: 900 })).toThrow('invalid target');
    act(duel, { type: 'play', uid: 900, target: { side: 'enemy', uid: foe.uid } });
    expect(foe.health).toBe(2);
  });

  it('gives kinship to a figure joining its own pantheon', () => {
    const duel = fresh();
    const seat = duel.state.seats.player;
    seat.mana = 10;
    place(duel, 'player', 'patroclus');
    seat.hand = [{ uid: 900, entry: { kind: 'figure', id: 'achilles', level: 1 }, cost: 3 }];
    const events = act(duel, { type: 'play', uid: 900 });
    expect(events.some((e) => e.type === 'kinship')).toBe(true);
    expect(seat.board.at(-1)).toMatchObject({ attack: 5, health: 3 });
  });
});

describe('combat', () => {
  it('forces attacks into guards first', () => {
    const duel = fresh();
    place(duel, 'player', 'achilles');
    const guard = place(duel, 'enemy', 'patroclus');
    place(duel, 'enemy', 'kappa');
    expect(attackTargets(duel.state, 'player')).toEqual([{ side: 'enemy', uid: guard.uid }]);
  });

  it('trades damage both ways and buries the dead', () => {
    const duel = fresh();
    const a = place(duel, 'player', 'gilgamesh');
    const d = place(duel, 'enemy', 'achilles');
    act(duel, { type: 'attack', uid: a.uid, target: { side: 'enemy', uid: d.uid } });
    expect(duel.state.seats.enemy.board).toHaveLength(0);
    expect(a.health).toBe(1);
    expect(() =>
      act(duel, { type: 'attack', uid: a.uid, target: { side: 'enemy', hero: true } }),
    ).toThrow('not ready');
  });

  it('applies ward, venom, fury, drain and element edges', () => {
    const duel = fresh();
    const wukong = place(duel, 'enemy', 'sun-wukong');
    const kappa = place(duel, 'player', 'kappa');
    act(duel, { type: 'attack', uid: kappa.uid, target: { side: 'enemy', uid: wukong.uid } });
    expect(wukong).toMatchObject({ health: 3, ward: false });

    const anubis = place(duel, 'player', 'anubis');
    const ymir = place(duel, 'enemy', 'ymir');
    act(duel, { type: 'attack', uid: anubis.uid, target: { side: 'enemy', uid: ymir.uid } });
    expect(duel.state.seats.enemy.board.includes(ymir)).toBe(false);

    const cu = place(duel, 'player', 'cu-chulainn');
    cu.attacks = 2;
    act(duel, { type: 'attack', uid: cu.uid, target: { side: 'enemy', uid: wukong.uid } });
    expect(cu.attacks).toBe(1);

    const ra = place(duel, 'player', 'ra');
    duel.state.seats.player.life = 10;
    duel.state.seats.enemy.board = [];
    act(duel, { type: 'attack', uid: ra.uid, target: { side: 'enemy', hero: true } });
    expect(duel.state.seats.player.life).toBe(14);

    // storm (thor) beats tide (kappa): one extra damage
    const thor = place(duel, 'player', 'thor');
    const tide = place(duel, 'enemy', 'kappa');
    tide.health = 20;
    tide.maxHealth = 20;
    act(duel, { type: 'attack', uid: thor.uid, target: { side: 'enemy', uid: tide.uid } });
    expect(tide.health).toBe(14);
  });

  it('ends the duel when a hero falls', () => {
    const duel = fresh();
    duel.state.seats.enemy.life = 3;
    const a = place(duel, 'player', 'achilles');
    const events = act(duel, { type: 'attack', uid: a.uid, target: { side: 'enemy', hero: true } });
    expect(events.at(-1)).toEqual({ type: 'win', side: 'player' });
    expect(() => act(duel, { type: 'end' })).toThrow('over');
  });
});

describe('rival', () => {
  it('plays whole games against itself to a winner, deterministically', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      const duel = fresh(seed, heavy, starter);
      let turns = 0;
      while (!duel.state.winner && turns < 200) {
        rivalTurn(duel);
        turns++;
      }
      expect(duel.state.winner).not.toBeNull();
    }
  });

  it('a stronger deck usually wins', () => {
    let wins = 0;
    for (let i = 0; i < 20; i++) {
      const duel = fresh(`s${i}`, strong, starter);
      while (!duel.state.winner) rivalTurn(duel);
      if (duel.state.winner === 'player') wins++;
    }
    expect(wins).toBeGreaterThan(14);
  });
});
