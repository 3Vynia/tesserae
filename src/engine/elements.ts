import type { Element } from '../data/schema';

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
