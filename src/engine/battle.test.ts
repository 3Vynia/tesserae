import { describe, expect, it } from 'vitest';
import { CARDS_BY_ID } from '../data/cards';
import {
  elementMultiplier,
  MAX_ROUNDS,
  scaledStats,
  simulate,
  synergyFor,
  validTeam,
  type Fighter,
} from './battle';

const f = (id: string, slot: number, level = 1, boost?: number): Fighter => ({
  card: CARDS_BY_ID.get(id)!,
  slot,
  level,
  stars: 0,
  ...(boost ? { boost } : {}),
});
const starters = () => ['patroclus', 'achilles', 'enkidu', 'kappa'].map((id, i) => f(id, i));
const gods = (level = 1) =>
  ['zeus', 'thor', 'odin', 'ra', 'anubis'].map((id, i) => f(id, i, level));

describe('elements', () => {
  it('follows the cycle and the sun-night pair', () => {
    expect(elementMultiplier('storm', 'tide')).toBe(1.3);
    expect(elementMultiplier('tide', 'storm')).toBe(0.8);
    expect(elementMultiplier('stone', 'storm')).toBe(1.3);
    expect(elementMultiplier('sun', 'night')).toBe(1.3);
    expect(elementMultiplier('night', 'sun')).toBe(1.3);
    expect(elementMultiplier('storm', 'flame')).toBe(1);
    expect(elementMultiplier('sun', 'storm')).toBe(1);
  });
});

describe('synergy and scaling', () => {
  it('grows with shared pantheons', () => {
    expect(synergyFor(1)).toEqual({ attack: 0, health: 0 });
    expect(synergyFor(3).attack).toBeGreaterThan(synergyFor(2).attack);
    expect(synergyFor(5)).toEqual(synergyFor(4));
  });

  it('scales stats with level and stars', () => {
    const zeus = CARDS_BY_ID.get('zeus')!;
    expect(scaledStats(zeus, 1, 0)).toEqual(zeus.stats);
    expect(scaledStats(zeus, 60, 0).attack).toBeGreaterThan(zeus.stats.attack * 3.9);
    expect(scaledStats(zeus, 1, 5).health).toBeGreaterThan(zeus.stats.health);
  });

  it('validates team size and duplicates', () => {
    expect(validTeam(starters())).toBe(true);
    expect(validTeam(starters().slice(0, 3))).toBe(false);
    expect(validTeam([...starters(), f('achilles', 4)])).toBe(false);
  });
});

describe('simulate', () => {
  it('is deterministic for a seed', () => {
    expect(simulate(starters(), gods(), 'a')).toEqual(simulate(starters(), gods(), 'a'));
    expect(simulate(starters(), gods(), 'a').events).not.toEqual(
      simulate(starters(), gods(), 'b').events,
    );
  });

  it('always ends within the round limit with a consistent log', () => {
    for (const seed of ['1', '2', '3', '4', '5']) {
      const result = simulate(starters(), starters(), seed);
      expect(result.rounds).toBeLessThanOrEqual(MAX_ROUNDS);
      expect(result.events.at(-1)).toEqual({
        type: 'end',
        winner: result.winner,
        rounds: result.rounds,
      });
      for (const e of result.events) {
        if ('hp' in e) expect(e.hp).toBeGreaterThanOrEqual(0);
      }
      const defeated = result.events.filter((e) => e.type === 'defeat').map((e) => e.target);
      expect(new Set(defeated).size).toBe(defeated.length);
    }
  });

  it('lets a far stronger team win', () => {
    let wins = 0;
    for (let i = 0; i < 20; i++) {
      if (simulate(gods(30), starters(), `s${i}`).winner === 'player') wins++;
    }
    expect(wins).toBe(20);
  });

  it('hits the front row before the back row with single-target attacks', () => {
    const enemy = [f('zeus', 3), f('thor', 0), f('odin', 1), f('ra', 2)];
    const result = simulate(starters(), enemy, 'front');
    const firstBasic = result.events.find(
      (e) => e.type === 'skill' && e.actor.startsWith('player') && e.kind === 'basic',
    );
    expect(firstBasic && 'targets' in firstBasic ? firstBasic.targets[0] : null).toBe('enemy-0');
  });

  it('applies bosses boost', () => {
    const boss = simulate(starters(), [f('tiamat', 0, 1, 3)], 'boss');
    const tiamat = boss.units.find((u) => u.id === 'enemy-0')!;
    expect(tiamat.maxHp).toBeGreaterThan(CARDS_BY_ID.get('tiamat')!.stats.health * 2.9);
  });
});

describe('fury', () => {
  it('ends evenly matched fights before the round limit', () => {
    let draws = 0;
    for (let i = 0; i < 30; i++) {
      if (simulate(starters(), starters(), `even${i}`).winner === 'draw') draws++;
    }
    expect(draws).toBe(0);
  });
});
