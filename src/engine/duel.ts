import type { Card, Element } from '../data/schema';
import type { Pantheon } from '../data/pantheons';
import { RITES_BY_ID, type DuelEffect, type Keyword } from '../data/duel';
import { elementMultiplier } from './elements';
import { createRng, type Rng } from './rng';

export type Side = 'player' | 'enemy';
export const START_LIFE = 20;
export const MAX_MANA = 10;
export const BOARD_LIMIT = 5;
export const HAND_LIMIT = 8;
export const DECK_SIZE = 16;
const OPENING_HAND = 3;

/** An entry in a deck: a figure (with its level) or a rite. */
export type DeckEntry =
  { kind: 'figure'; id: string; level: number } | { kind: 'rite'; id: string };

export interface HandCard {
  uid: number;
  entry: DeckEntry;
  cost: number;
}

export interface Unit {
  uid: number;
  card: Card;
  attack: number;
  health: number;
  maxHealth: number;
  keywords: Keyword[];
  ward: boolean;
  /** Attacks left this turn. 0 while summoning sick. */
  attacks: number;
  stunned: number;
}

export interface Seat {
  life: number;
  maxLife: number;
  mana: number;
  maxMana: number;
  deck: HandCard[];
  hand: HandCard[];
  board: Unit[];
  fatigue: number;
}

export interface DuelState {
  turn: number;
  active: Side;
  winner: Side | null;
  seats: Record<Side, Seat>;
  rng: [number, number, number, number];
  nextUid: number;
}

export type Target = { side: Side; uid: number } | { side: Side; hero: true };

export type Action =
  | { type: 'play'; uid: number; target?: Target }
  | { type: 'attack'; uid: number; target: Target }
  | { type: 'end' };

export type DuelEvent =
  | { type: 'turn'; side: Side; turn: number }
  | { type: 'mana'; side: Side; mana: number; max: number }
  | { type: 'draw'; side: Side; uid: number }
  | { type: 'burn'; side: Side; uid: number }
  | { type: 'fatigue'; side: Side; amount: number }
  | { type: 'play'; side: Side; uid: number; entry: DeckEntry; target?: Target }
  | { type: 'summon'; side: Side; uid: number }
  | { type: 'attack'; side: Side; uid: number; target: Target }
  | { type: 'damage'; target: Target; amount: number; left: number }
  | { type: 'heal'; target: Target; amount: number; left: number }
  | { type: 'buff'; side: Side; uid: number; attack: number; health: number }
  | { type: 'ward'; side: Side; uid: number; on: boolean }
  | { type: 'stun'; side: Side; uid: number }
  | { type: 'kinship'; side: Side; uid: number }
  | { type: 'death'; side: Side; uid: number }
  | { type: 'win'; side: Side };

export const other = (s: Side): Side => (s === 'player' ? 'enemy' : 'player');

/** Figures grow a little with their collection level. */
export const levelBonus = (level: number): number => Math.floor((level - 1) / 10);

export function entryCost(entry: DeckEntry, cards: ReadonlyMap<string, Card>): number {
  if (entry.kind === 'rite') return RITES_BY_ID.get(entry.id)?.cost ?? 0;
  return cards.get(entry.id)?.duel.cost ?? 0;
}

export function entryEffect(
  entry: DeckEntry,
  cards: ReadonlyMap<string, Card>,
): DuelEffect | undefined {
  if (entry.kind === 'rite') return RITES_BY_ID.get(entry.id)?.effect;
  return cards.get(entry.id)?.duel.play;
}

/** Targets that must be chosen by the player for an effect, or null when none is needed. */
export function targetsFor(
  state: DuelState,
  side: Side,
  effect: DuelEffect | undefined,
): Target[] | null {
  if (!effect || !('target' in effect)) return null;
  const me = state.seats[side];
  const foe = other(side);
  const enemyUnits = state.seats[foe].board.map((u) => ({ side: foe, uid: u.uid }) as Target);
  const myUnits = me.board.map((u) => ({ side, uid: u.uid }) as Target);
  switch (effect.target) {
    case 'enemy':
      return [...enemyUnits, { side: foe, hero: true }];
    case 'enemy-unit':
      return enemyUnits;
    case 'ally':
      return [...myUnits, { side, hero: true }];
    case 'ally-unit':
      return myUnits;
    default:
      return null;
  }
}

export interface Duel {
  state: DuelState;
  cards: ReadonlyMap<string, Card>;
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

class Engine {
  rng: Rng;
  events: DuelEvent[] = [];
  constructor(
    public s: DuelState,
    public cards: ReadonlyMap<string, Card>,
  ) {
    this.rng = createRng(s.rng);
  }

  done(): DuelEvent[] {
    this.s.rng = this.rng.state();
    return this.events;
  }

  unit(side: Side, uid: number): Unit | undefined {
    return this.s.seats[side].board.find((u) => u.uid === uid);
  }

  draw(side: Side): void {
    const seat = this.s.seats[side];
    const card = seat.deck.shift();
    if (!card) {
      seat.fatigue += 1;
      this.events.push({ type: 'fatigue', side, amount: seat.fatigue });
      this.hurtHero(side, seat.fatigue);
      return;
    }
    if (seat.hand.length >= HAND_LIMIT) {
      this.events.push({ type: 'burn', side, uid: card.uid });
      return;
    }
    seat.hand.push(card);
    this.events.push({ type: 'draw', side, uid: card.uid });
  }

  hurtHero(side: Side, amount: number): void {
    const seat = this.s.seats[side];
    seat.life = Math.max(0, seat.life - amount);
    this.events.push({ type: 'damage', target: { side, hero: true }, amount, left: seat.life });
    if (seat.life <= 0 && !this.s.winner) {
      this.s.winner = other(side);
      this.events.push({ type: 'win', side: other(side) });
    }
  }

  /** Damages a unit. Returns the damage actually dealt (0 when a ward absorbed it). */
  hurtUnit(side: Side, unit: Unit, amount: number, venom: boolean): number {
    if (amount <= 0) return 0;
    if (unit.ward) {
      unit.ward = false;
      this.events.push({ type: 'ward', side, uid: unit.uid, on: false });
      return 0;
    }
    unit.health -= amount;
    if (venom) unit.health = Math.min(unit.health, 0);
    this.events.push({
      type: 'damage',
      target: { side, uid: unit.uid },
      amount,
      left: Math.max(0, unit.health),
    });
    return amount;
  }

  bury(): void {
    for (const side of ['player', 'enemy'] as const) {
      const seat = this.s.seats[side];
      for (const u of seat.board.filter((x) => x.health <= 0)) {
        this.events.push({ type: 'death', side, uid: u.uid });
      }
      seat.board = seat.board.filter((x) => x.health > 0);
    }
  }

  heal(target: Target, amount: number): void {
    if ('hero' in target) {
      const seat = this.s.seats[target.side];
      seat.life = Math.min(seat.maxLife, seat.life + amount);
      this.events.push({ type: 'heal', target, amount, left: seat.life });
      return;
    }
    const u = this.unit(target.side, target.uid);
    if (!u) return;
    u.health = Math.min(u.maxHealth, u.health + amount);
    this.events.push({ type: 'heal', target, amount, left: u.health });
  }

  buff(side: Side, u: Unit, attack: number, health: number): void {
    u.attack = Math.max(0, u.attack + attack);
    u.health += health;
    u.maxHealth += health;
    this.events.push({ type: 'buff', side, uid: u.uid, attack, health });
  }

  resolve(
    side: Side,
    effect: DuelEffect,
    target: Target | undefined,
    self: Unit | undefined,
  ): void {
    const foe = other(side);
    switch (effect.kind) {
      case 'damage':
        if (effect.target === 'enemies') {
          for (const u of [...this.s.seats[foe].board]) this.hurtUnit(foe, u, effect.amount, false);
        } else if (effect.target === 'enemy-hero') {
          this.hurtHero(foe, effect.amount);
        } else if (target) {
          if ('hero' in target) this.hurtHero(target.side, effect.amount);
          else {
            const u = this.unit(target.side, target.uid);
            if (u) this.hurtUnit(target.side, u, effect.amount, false);
          }
        }
        break;
      case 'heal':
        if (effect.target === 'allies') {
          for (const u of this.s.seats[side].board) this.heal({ side, uid: u.uid }, effect.amount);
          this.heal({ side, hero: true }, effect.amount);
        } else if (effect.target === 'hero') this.heal({ side, hero: true }, effect.amount);
        else if (target) this.heal(target, effect.amount);
        break;
      case 'buff': {
        const units =
          effect.target === 'allies'
            ? this.s.seats[side].board
            : effect.target === 'self'
              ? self
                ? [self]
                : []
              : target && !('hero' in target)
                ? [this.unit(side, target.uid)].filter((u): u is Unit => !!u)
                : [];
        for (const u of units) this.buff(side, u, effect.attack, effect.health);
        break;
      }
      case 'draw':
        for (let i = 0; i < effect.amount; i++) this.draw(side);
        break;
      case 'stun':
        if (target && !('hero' in target)) {
          const u = this.unit(target.side, target.uid);
          if (u) {
            u.stunned = 2;
            this.events.push({ type: 'stun', side: target.side, uid: u.uid });
          }
        }
        break;
      case 'ward': {
        const u =
          effect.target === 'self'
            ? self
            : target && !('hero' in target)
              ? this.unit(side, target.uid)
              : undefined;
        if (u) {
          u.ward = true;
          this.events.push({ type: 'ward', side, uid: u.uid, on: true });
        }
        break;
      }
      case 'weaken': {
        const units =
          effect.target === 'enemies'
            ? this.s.seats[foe].board
            : target && !('hero' in target)
              ? [this.unit(target.side, target.uid)].filter((u): u is Unit => !!u)
              : [];
        for (const u of units) this.buff(foe, u, -effect.amount, 0);
        break;
      }
    }
    this.bury();
  }

  startTurn(side: Side): void {
    this.s.active = side;
    this.s.turn += 1;
    const seat = this.s.seats[side];
    seat.maxMana = Math.min(MAX_MANA, seat.maxMana + 1);
    seat.mana = seat.maxMana;
    this.events.push({ type: 'turn', side, turn: this.s.turn });
    this.events.push({ type: 'mana', side, mana: seat.mana, max: seat.maxMana });
    for (const u of seat.board) {
      if (u.stunned > 0) u.stunned -= 1;
      u.attacks = u.stunned > 0 ? 0 : u.keywords.includes('fury') ? 2 : 1;
    }
    this.draw(side);
  }

  play(side: Side, uid: number, target: Target | undefined): void {
    const seat = this.s.seats[side];
    const index = seat.hand.findIndex((c) => c.uid === uid);
    const card = seat.hand[index];
    if (!card) throw new Error('card not in hand');
    if (card.cost > seat.mana) throw new Error('not enough mana');
    const effect = entryEffect(card.entry, this.cards);
    const options = targetsFor(this.s, side, effect);
    if (options && options.length > 0) {
      if (!target || !options.some((o) => sameTarget(o, target))) throw new Error('invalid target');
    }
    if (card.entry.kind === 'figure' && seat.board.length >= BOARD_LIMIT)
      throw new Error('board full');
    if (card.entry.kind === 'rite' && options && options.length === 0) throw new Error('no target');

    seat.mana -= card.cost;
    seat.hand.splice(index, 1);
    this.events.push({ type: 'play', side, uid, entry: card.entry, ...(target ? { target } : {}) });
    this.events.push({ type: 'mana', side, mana: seat.mana, max: seat.maxMana });

    let unit: Unit | undefined;
    if (card.entry.kind === 'figure') {
      const data = this.cards.get(card.entry.id);
      if (!data) throw new Error(`unknown card ${card.entry.id}`);
      const bonus = levelBonus(card.entry.level);
      const kin = seat.board.some((u) => u.card.pantheon === data.pantheon);
      unit = {
        uid: card.uid,
        card: data,
        attack: data.duel.attack + bonus,
        health: data.duel.health + bonus,
        maxHealth: data.duel.health + bonus,
        keywords: [...data.duel.keywords],
        ward: data.duel.keywords.includes('ward'),
        attacks: data.duel.keywords.includes('swift')
          ? data.duel.keywords.includes('fury')
            ? 2
            : 1
          : 0,
        stunned: 0,
      };
      seat.board.push(unit);
      this.events.push({ type: 'summon', side, uid: unit.uid });
      if (kin) {
        this.events.push({ type: 'kinship', side, uid: unit.uid });
        this.buff(side, unit, 1, 1);
      }
    }
    // An effect with no legal target fizzles (a figure can always be played).
    if (effect && !(options && options.length === 0)) this.resolve(side, effect, target, unit);
  }

  attack(side: Side, uid: number, target: Target): void {
    const attacker = this.unit(side, uid);
    if (!attacker) throw new Error('no attacker');
    if (attacker.attacks <= 0) throw new Error('not ready');
    if (target.side === side) throw new Error('cannot attack own side');
    if (!attackTargets(this.s, side).some((t) => sameTarget(t, target)))
      throw new Error('invalid target');
    attacker.attacks -= 1;
    this.events.push({ type: 'attack', side, uid, target });
    const venom = attacker.keywords.includes('venom');
    if ('hero' in target) {
      this.hurtHero(target.side, attacker.attack);
      if (attacker.keywords.includes('drain')) this.heal({ side, hero: true }, attacker.attack);
      return;
    }
    const defender = this.unit(target.side, target.uid);
    if (!defender) throw new Error('no defender');
    const edge = elementMultiplier(attacker.card.element, defender.card.element) > 1 ? 1 : 0;
    const dealt = this.hurtUnit(target.side, defender, attacker.attack + edge, venom);
    this.hurtUnit(side, attacker, defender.attack, defender.keywords.includes('venom'));
    if (dealt > 0 && attacker.keywords.includes('drain')) this.heal({ side, hero: true }, dealt);
    this.bury();
  }
}

export const sameTarget = (a: Target, b: Target): boolean =>
  a.side === b.side && ('hero' in a ? 'hero' in b : !('hero' in b) && a.uid === b.uid);

/** Legal attack targets for a side: guards first, otherwise any figure or the hero. */
export function attackTargets(state: DuelState, side: Side): Target[] {
  const foe = other(side);
  const board = state.seats[foe].board;
  const guards = board.filter((u) => u.keywords.includes('guard'));
  if (guards.length) return guards.map((u) => ({ side: foe, uid: u.uid }));
  return [...board.map((u) => ({ side: foe, uid: u.uid }) as Target), { side: foe, hero: true }];
}

export interface Contender {
  deck: DeckEntry[];
  life?: number;
}

/** Starts a duel. The player goes first; the enemy gets one extra card to make up for it. */
export function createDuel(
  player: Contender,
  enemy: Contender,
  seed: string,
  cards: ReadonlyMap<string, Card>,
): { duel: Duel; events: DuelEvent[] } {
  const rng = createRng(seed);
  let uid = 1;
  const seat = (c: Contender): Seat => ({
    life: c.life ?? START_LIFE,
    maxLife: c.life ?? START_LIFE,
    mana: 0,
    maxMana: 0,
    deck: shuffle(c.deck, rng).map((entry) => ({
      uid: uid++,
      entry,
      cost: entryCost(entry, cards),
    })),
    hand: [],
    board: [],
    fatigue: 0,
  });
  const state: DuelState = {
    turn: 0,
    active: 'player',
    winner: null,
    seats: { player: seat(player), enemy: seat(enemy) },
    rng: rng.state(),
    nextUid: uid,
  };
  const engine = new Engine(state, cards);
  for (let i = 0; i < OPENING_HAND; i++) engine.draw('player');
  for (let i = 0; i < OPENING_HAND + 1; i++) engine.draw('enemy');
  engine.startTurn('player');
  return { duel: { state, cards }, events: engine.done() };
}

/** Applies one action for the side whose turn it is. Throws on illegal actions. */
export function act(duel: Duel, action: Action): DuelEvent[] {
  const { state } = duel;
  if (state.winner) throw new Error('duel is over');
  const engine = new Engine(state, duel.cards);
  const side = state.active;
  if (action.type === 'play') engine.play(side, action.uid, action.target);
  else if (action.type === 'attack') engine.attack(side, action.uid, action.target);
  else if (!state.winner) engine.startTurn(other(side));
  return engine.done();
}

export function playable(duel: Duel, side: Side): HandCard[] {
  const seat = duel.state.seats[side];
  return seat.hand.filter((c) => {
    if (c.cost > seat.mana) return false;
    if (c.entry.kind === 'figure') return seat.board.length < BOARD_LIMIT;
    const options = targetsFor(duel.state, side, entryEffect(c.entry, duel.cards));
    return !options || options.length > 0;
  });
}

/** Builds a deck from a team: two copies of each figure, topped up with rites. */
export function buildDeck(
  team: readonly { id: string; level: number }[],
  riteIds: readonly string[],
): DeckEntry[] {
  const deck: DeckEntry[] = [];
  for (const f of team) {
    deck.push(
      { kind: 'figure', id: f.id, level: f.level },
      { kind: 'figure', id: f.id, level: f.level },
    );
  }
  let i = 0;
  while (deck.length < DECK_SIZE && riteIds.length) {
    deck.push({ kind: 'rite', id: riteIds[i % riteIds.length] as string });
    i++;
  }
  return deck.slice(0, Math.max(DECK_SIZE, team.length * 2));
}

export type { Element, Pantheon };
