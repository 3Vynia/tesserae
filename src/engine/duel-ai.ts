import type { DuelEffect } from '../data/duel';
import {
  act,
  attackTargets,
  entryEffect,
  other,
  playable,
  targetsFor,
  type Action,
  type Duel,
  type DuelEvent,
  type Side,
  type Target,
  type Unit,
} from './duel';
import { elementMultiplier } from './elements';

const value = (u: Unit) => u.attack * 2 + u.health;

function unitOf(duel: Duel, t: Target): Unit | undefined {
  return 'hero' in t ? undefined : duel.state.seats[t.side].board.find((u) => u.uid === t.uid);
}

/** Picks a target for an effect, or null when playing it now would be wasted. */
function chooseTarget(
  duel: Duel,
  side: Side,
  effect: DuelEffect,
  options: Target[],
): Target | null {
  const foeSeat = duel.state.seats[other(side)];
  const mySeat = duel.state.seats[side];
  const units = options.map((t) => ({ t, u: unitOf(duel, t) }));
  switch (effect.kind) {
    case 'damage': {
      const hero = options.find((t) => 'hero' in t);
      if (hero && foeSeat.life <= effect.amount) return hero;
      const kills = units
        .filter((x) => x.u && !x.u.ward && x.u.health <= effect.amount)
        .sort((a, b) => value(b.u as Unit) - value(a.u as Unit));
      if (kills[0]) return kills[0].t;
      const biggest = units
        .filter((x) => x.u)
        .sort((a, b) => value(b.u as Unit) - value(a.u as Unit))[0];
      return biggest?.t ?? hero ?? null;
    }
    case 'heal': {
      const hurt = units
        .filter((x) => (x.u ? x.u.health < x.u.maxHealth : mySeat.life < mySeat.maxLife))
        .sort((a, b) => (b.u ? value(b.u) : 99) - (a.u ? value(a.u) : 99));
      return hurt[0]?.t ?? null;
    }
    case 'buff':
    case 'ward': {
      const best = units
        .filter((x) => x.u)
        .sort((a, b) => value(b.u as Unit) - value(a.u as Unit))[0];
      return best?.t ?? null;
    }
    case 'stun':
    case 'weaken': {
      const best = units
        .filter((x): x is { t: Target; u: Unit } => !!x.u)
        .sort((a, b) => b.u.attack - a.u.attack)[0];
      return best?.t ?? null;
    }
    default:
      return null;
  }
}

/** The play the AI would make now, if any card is worth playing. */
function nextPlay(duel: Duel, side: Side): Action | null {
  const options = playable(duel, side).sort((a, b) => b.cost - a.cost);
  for (const card of options) {
    const effect = entryEffect(card.entry, duel.cards);
    const targets = targetsFor(duel.state, side, effect);
    let target: Target | undefined;
    if (effect && targets && targets.length > 0) {
      const choice = chooseTarget(duel, side, effect, targets);
      // A rite with nothing worth targeting waits; a figure is still worth playing.
      if (!choice && card.entry.kind === 'rite') continue;
      target = choice ?? targets[0];
    } else if (
      card.entry.kind === 'rite' &&
      effect?.kind === 'heal' &&
      effect.target !== 'allies'
    ) {
      continue;
    }
    return { type: 'play', uid: card.uid, ...(target ? { target } : {}) };
  }
  return null;
}

/** The attack the AI would make now, if any figure is ready. */
function nextAttack(duel: Duel, side: Side): Action | null {
  const seat = duel.state.seats[side];
  const attacker = seat.board.filter((u) => u.attacks > 0).sort((a, b) => b.attack - a.attack)[0];
  if (!attacker) return null;
  const targets = attackTargets(duel.state, side);
  const hero = targets.find((t) => 'hero' in t);
  const reach = seat.board.reduce((n, u) => n + u.attack * u.attacks, 0);
  if (hero && reach >= duel.state.seats[other(side)].life) {
    return { type: 'attack', uid: attacker.uid, target: hero };
  }
  const trades = targets
    .map((t) => ({ t, u: unitOf(duel, t) }))
    .filter((x): x is { t: Target; u: Unit } => !!x.u)
    .map(({ t, u }) => {
      const edge = elementMultiplier(attacker.card.element, u.card.element) > 1 ? 1 : 0;
      const kills =
        !u.ward && (attacker.attack + edge >= u.health || attacker.keywords.includes('venom'));
      const survives = u.attack < attacker.health || attacker.ward;
      const score = kills ? (survives ? value(u) + 10 : value(u) - value(attacker)) : -99;
      return { t, score };
    })
    .sort((a, b) => b.score - a.score);
  const best = trades[0];
  const target = best && (best.score > 0 || !hero) ? best.t : hero;
  return target ? { type: 'attack', uid: attacker.uid, target } : null;
}

/**
 * The AI's next action for the side whose turn it is: play cards first (biggest first), then
 * attack, then end the turn. Call repeatedly; each call returns one action.
 */
export function aiNextAction(duel: Duel): Action {
  const side = duel.state.active;
  return nextPlay(duel, side) ?? nextAttack(duel, side) ?? { type: 'end' };
}

/** Plays the whole turn for the side whose turn it is, then ends it. */
export function aiTurn(duel: Duel): DuelEvent[] {
  const events: DuelEvent[] = [];
  for (let i = 0; i < 60 && !duel.state.winner; i++) {
    const action = aiNextAction(duel);
    events.push(...act(duel, action));
    if (action.type === 'end') break;
  }
  return events;
}
