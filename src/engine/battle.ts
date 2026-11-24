import type { Card, Effect, Element, Stat } from '../data/schema';
import type { Pantheon } from '../data/pantheons';
import { createRng, type Rng } from './rng';

export type Side = 'player' | 'enemy';
export const TEAM_MAX = 5;
export const TEAM_MIN = 4;
/** Slots 0-2 are the front row, 3-4 the back row. */
export const FRONT_SLOTS = [0, 1, 2] as const;
export const MAX_ROUNDS = 30;
const ULTIMATE_GAIN_ON_ACT = 25;
const ULTIMATE_GAIN_ON_HIT = 10;
const LOW_HEALTH = 0.35;
const CRIT_CHANCE = 0.1;
const CRIT_MULT = 1.5;
/** From this round on, all damage grows each round so long fights still end. */
export const FURY_ROUND = 12;
const FURY_STEP = 0.15;

const CYCLE: Element[] = ['storm', 'tide', 'flame', 'verdure', 'stone'];

/** 1.3 when the attacker's element beats the defender's, 0.8 when it is beaten, else 1. */
export function elementMultiplier(attacker: Element, defender: Element): number {
  if (
    (attacker === 'sun' && defender === 'night') ||
    (attacker === 'night' && defender === 'sun')
  ) {
    return 1.3;
  }
  const a = CYCLE.indexOf(attacker);
  const d = CYCLE.indexOf(defender);
  if (a < 0 || d < 0) return 1;
  if ((a + 1) % CYCLE.length === d) return 1.3;
  if ((d + 1) % CYCLE.length === a) return 0.8;
  return 1;
}

/** Team bonus for sharing a pantheon: attack and health multipliers. */
export function synergyFor(count: number): { attack: number; health: number } {
  if (count >= 4) return { attack: 0.15, health: 0.1 };
  if (count === 3) return { attack: 0.1, health: 0.05 };
  if (count === 2) return { attack: 0.05, health: 0 };
  return { attack: 0, health: 0 };
}

export function teamSynergies(cards: readonly Card[]): Map<Pantheon, number> {
  const counts = new Map<Pantheon, number>();
  for (const c of cards) counts.set(c.pantheon, (counts.get(c.pantheon) ?? 0) + 1);
  return counts;
}

/** Stats at a level with stars; the progression curve lives here so battle and UI agree. */
export function scaledStats(card: Card, level: number, stars: number): Card['stats'] {
  const growth = 1 + 0.05 * (level - 1);
  const star = 1 + 0.08 * stars;
  return {
    health: Math.round(card.stats.health * growth * star),
    attack: Math.round(card.stats.attack * growth * star),
    defense: Math.round(card.stats.defense * growth * star),
    speed: card.stats.speed + Math.floor((level - 1) / 10) + stars,
  };
}

export interface Fighter {
  card: Card;
  slot: number;
  level: number;
  stars: number;
  /** Extra multiplier on all stats, used for bosses. */
  boost?: number;
}

interface Modifier {
  stat: Stat;
  amount: number;
  turns: number;
}

export interface Unit {
  id: string;
  side: Side;
  card: Card;
  slot: number;
  maxHp: number;
  hp: number;
  base: Card['stats'];
  energy: number;
  cooldown: number;
  shield: number;
  shieldTurns: number;
  burn: number;
  burnTurns: number;
  stun: number;
  mods: Modifier[];
  lowTriggered: boolean;
}

export type BattleEvent =
  | { type: 'round'; round: number }
  | { type: 'turn'; actor: string; order: string[] }
  | {
      type: 'skill';
      actor: string;
      kind: 'basic' | 'active' | 'ultimate' | 'passive';
      skill: string | null;
      targets: string[];
    }
  | {
      type: 'damage';
      target: string;
      amount: number;
      crit: boolean;
      advantage: 'strong' | 'weak' | null;
      hp: number;
      shield: number;
    }
  | { type: 'heal'; target: string; amount: number; hp: number }
  | { type: 'shield'; target: string; amount: number }
  | { type: 'modify'; target: string; stat: Stat; amount: number }
  | { type: 'stun'; target: string }
  | { type: 'burn'; target: string; amount: number; hp: number }
  | { type: 'energy'; target: string; energy: number }
  | { type: 'skip'; actor: string }
  | { type: 'defeat'; target: string }
  | { type: 'end'; winner: Side | 'draw'; rounds: number };

export interface BattleResult {
  winner: Side | 'draw';
  rounds: number;
  events: BattleEvent[];
  /** State of every unit before any event, for replaying the log. */
  initial: Unit[];
  /** Final state of every unit, for the result screen. */
  units: Unit[];
}

function makeUnit(f: Fighter, side: Side, bonus: { attack: number; health: number }): Unit {
  const s = scaledStats(f.card, f.level, f.stars);
  const boost = f.boost ?? 1;
  const base = {
    health: Math.round(s.health * boost * (1 + bonus.health)),
    attack: Math.round(s.attack * boost * (1 + bonus.attack)),
    defense: Math.round(s.defense * boost),
    speed: s.speed,
  };
  return {
    id: `${side}-${f.slot}`,
    side,
    card: f.card,
    slot: f.slot,
    maxHp: base.health,
    hp: base.health,
    base,
    energy: 0,
    cooldown: 1,
    shield: 0,
    shieldTurns: 0,
    burn: 0,
    burnTurns: 0,
    stun: 0,
    mods: [],
    lowTriggered: false,
  };
}

function stat(u: Unit, s: Stat): number {
  const bonus = u.mods.filter((m) => m.stat === s).reduce((n, m) => n + m.amount, 0);
  return Math.max(1, u.base[s] * (1 + bonus));
}

function team(units: Unit[], side: Side): Unit[] {
  return units.filter((u) => u.side === side && u.hp > 0);
}

function frontFirst(units: Unit[]): Unit | undefined {
  const sorted = [...units].sort((a, b) => a.slot - b.slot);
  return sorted.find((u) => u.slot < 3) ?? sorted[0];
}

function pickTargets(
  units: Unit[],
  actor: Unit,
  target: 'enemy' | 'enemies' | 'weakest-enemy' | 'self' | 'ally' | 'allies',
): Unit[] {
  const foes = team(units, actor.side === 'player' ? 'enemy' : 'player');
  const friends = team(units, actor.side);
  const ratio = (u: Unit) => u.hp / u.maxHp;
  switch (target) {
    case 'enemy': {
      const t = frontFirst(foes);
      return t ? [t] : [];
    }
    case 'enemies':
      return foes;
    case 'weakest-enemy': {
      const t = [...foes].sort((a, b) => ratio(a) - ratio(b) || a.slot - b.slot)[0];
      return t ? [t] : [];
    }
    case 'self':
      return [actor];
    case 'ally': {
      const t = [...friends].sort((a, b) => ratio(a) - ratio(b) || a.slot - b.slot)[0];
      return t ? [t] : [];
    }
    case 'allies':
      return friends;
  }
}

class Battle {
  events: BattleEvent[] = [];
  round = 0;
  constructor(
    public units: Unit[],
    private rng: Rng,
  ) {}

  private gainEnergy(u: Unit, amount: number): void {
    u.energy = Math.max(0, Math.min(200, u.energy + amount));
    this.events.push({ type: 'energy', target: u.id, energy: u.energy });
  }

  private damage(actor: Unit, target: Unit, power: number): void {
    const mult = elementMultiplier(actor.card.element, target.card.element);
    const crit = this.rng.chance(CRIT_CHANCE);
    const variance = 0.95 + this.rng.next() * 0.1;
    const fury = 1 + Math.max(0, this.round - FURY_ROUND) * FURY_STEP;
    const raw =
      stat(actor, 'attack') *
      power *
      (100 / (100 + stat(target, 'defense'))) *
      mult *
      variance *
      fury;
    let amount = Math.max(1, Math.round(raw * (crit ? CRIT_MULT : 1)));
    const absorbed = Math.min(target.shield, amount);
    target.shield -= absorbed;
    amount -= absorbed;
    target.hp = Math.max(0, target.hp - amount);
    this.events.push({
      type: 'damage',
      target: target.id,
      amount: amount + absorbed,
      crit,
      advantage: mult > 1 ? 'strong' : mult < 1 ? 'weak' : null,
      hp: target.hp,
      shield: target.shield,
    });
    if (target.hp <= 0) {
      this.events.push({ type: 'defeat', target: target.id });
      return;
    }
    this.gainEnergy(target, ULTIMATE_GAIN_ON_HIT);
    this.passives(target, 'on-hit');
    if (!target.lowTriggered && target.hp / target.maxHp < LOW_HEALTH) {
      target.lowTriggered = true;
      this.passives(target, 'on-low-health');
    }
  }

  private apply(actor: Unit, targets: Unit[], effects: readonly Effect[]): void {
    for (const effect of effects) {
      for (const target of targets) {
        if (target.hp <= 0) continue;
        switch (effect.type) {
          case 'damage':
            this.damage(actor, target, effect.power);
            break;
          case 'heal': {
            const amount = Math.round(stat(actor, 'attack') * effect.power);
            target.hp = Math.min(target.maxHp, target.hp + amount);
            this.events.push({ type: 'heal', target: target.id, amount, hp: target.hp });
            break;
          }
          case 'shield': {
            const amount = Math.round(target.maxHp * effect.power);
            target.shield += amount;
            target.shieldTurns = Math.max(target.shieldTurns, effect.turns);
            this.events.push({ type: 'shield', target: target.id, amount });
            break;
          }
          case 'modify':
            if (effect.stat === 'health') {
              const extra = Math.round(target.maxHp * effect.amount);
              target.maxHp += extra;
              target.hp += Math.max(0, extra);
            } else {
              target.mods.push({ stat: effect.stat, amount: effect.amount, turns: effect.turns });
            }
            this.events.push({
              type: 'modify',
              target: target.id,
              stat: effect.stat,
              amount: effect.amount,
            });
            break;
          case 'stun':
            if (this.rng.chance(effect.chance)) {
              target.stun = Math.max(target.stun, effect.turns);
              this.events.push({ type: 'stun', target: target.id });
            }
            break;
          case 'burn':
            target.burn = Math.round(stat(actor, 'attack') * effect.power);
            target.burnTurns = effect.turns;
            break;
          case 'energy':
            this.gainEnergy(target, effect.amount);
            break;
        }
      }
    }
  }

  passives(unit: Unit, trigger: Card['skills']['passives'][number]['trigger']): void {
    for (const p of unit.card.skills.passives) {
      if (p.trigger !== trigger || unit.hp <= 0) continue;
      const targets = pickTargets(this.units, unit, p.target);
      this.events.push({
        type: 'skill',
        actor: unit.id,
        kind: 'passive',
        skill: p.id,
        targets: targets.map((t) => t.id),
      });
      this.apply(unit, targets, p.effects);
    }
  }

  turn(unit: Unit): void {
    if (unit.burnTurns > 0) {
      unit.hp = Math.max(0, unit.hp - unit.burn);
      unit.burnTurns -= 1;
      this.events.push({ type: 'burn', target: unit.id, amount: unit.burn, hp: unit.hp });
      if (unit.hp <= 0) {
        this.events.push({ type: 'defeat', target: unit.id });
        return;
      }
    }
    if (unit.stun > 0) {
      unit.stun -= 1;
      this.events.push({ type: 'skip', actor: unit.id });
      return;
    }
    this.passives(unit, 'turn-start');
    const { active, ultimate } = unit.card.skills;
    let kind: 'basic' | 'active' | 'ultimate' = 'basic';
    let skill: typeof active | typeof ultimate | null = null;
    if (unit.energy >= ultimate.energy) {
      kind = 'ultimate';
      skill = ultimate;
      unit.energy = 0;
      this.events.push({ type: 'energy', target: unit.id, energy: 0 });
    } else if (unit.cooldown <= 0) {
      kind = 'active';
      skill = active;
      unit.cooldown = active.cooldown;
    }
    const targets = pickTargets(this.units, unit, skill ? skill.target : 'enemy');
    this.events.push({
      type: 'skill',
      actor: unit.id,
      kind,
      skill: skill?.id ?? null,
      targets: targets.map((t) => t.id),
    });
    this.apply(unit, targets, skill ? skill.effects : [{ type: 'damage', power: 1 }]);
    if (kind !== 'ultimate') this.gainEnergy(unit, ULTIMATE_GAIN_ON_ACT);
    unit.cooldown = Math.max(0, unit.cooldown - 1);
    unit.mods = unit.mods.map((m) => ({ ...m, turns: m.turns - 1 })).filter((m) => m.turns > 0);
    if (unit.shieldTurns > 0 && --unit.shieldTurns === 0) unit.shield = 0;
  }

  order(): Unit[] {
    // Speed decides; ties broken by a seeded coin so replays stay identical.
    return this.units
      .filter((u) => u.hp > 0)
      .map((u) => ({ u, tie: this.rng.next() }))
      .sort((a, b) => stat(b.u, 'speed') - stat(a.u, 'speed') || a.tie - b.tie)
      .map((x) => x.u);
  }
}

export function validTeam(team: readonly (Fighter | null)[]): boolean {
  const filled = team.filter((f): f is Fighter => !!f);
  return (
    filled.length >= TEAM_MIN &&
    filled.length <= TEAM_MAX &&
    new Set(filled.map((f) => f.card.id)).size === filled.length
  );
}

/** Runs a whole battle. Same teams and seed always produce the same events. */
export function simulate(
  player: readonly Fighter[],
  enemy: readonly Fighter[],
  seed: string,
): BattleResult {
  const rng = createRng(seed);
  const bonus = (fs: readonly Fighter[]) => {
    const best = Math.max(0, ...teamSynergies(fs.map((f) => f.card)).values());
    return synergyFor(best);
  };
  const units = [
    ...player.map((f) => makeUnit(f, 'player', bonus(player))),
    ...enemy.map((f) => makeUnit(f, 'enemy', bonus(enemy))),
  ];
  const initial = units.map((u) => structuredClone(u));
  const battle = new Battle(units, rng);
  for (const u of units) battle.passives(u, 'battle-start');

  let rounds = 0;
  let winner: Side | 'draw' = 'draw';
  outer: while (rounds < MAX_ROUNDS) {
    rounds += 1;
    battle.round = rounds;
    battle.events.push({ type: 'round', round: rounds });
    const order = battle.order();
    for (const unit of order) {
      if (unit.hp <= 0) continue;
      battle.events.push({
        type: 'turn',
        actor: unit.id,
        order: order.filter((u) => u.hp > 0).map((u) => u.id),
      });
      battle.turn(unit);
      const p = team(units, 'player').length;
      const e = team(units, 'enemy').length;
      if (p === 0 || e === 0) {
        winner = p > 0 ? 'player' : e > 0 ? 'enemy' : 'draw';
        break outer;
      }
    }
  }
  battle.events.push({ type: 'end', winner, rounds });
  return { winner, rounds, events: battle.events, initial, units };
}
