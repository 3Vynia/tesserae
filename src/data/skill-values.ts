import type { Card, Effect } from './schema';

type Skill =
  Card['skills']['active'] | Card['skills']['ultimate'] | Card['skills']['passives'][number];

const pct = (v: number): number => Math.round(Math.abs(v) * 100);

/**
 * Values a skill description may use as ICU arguments. Each takes the first effect of its kind,
 * so descriptions stay in sync with the data without repeating numbers in translation files.
 */
export function skillValues(skill: Skill): Record<string, number> {
  const first = <T extends Effect['type']>(type: T) =>
    skill.effects.find((e): e is Extract<Effect, { type: T }> => e.type === type);
  const values: Record<string, number> = {};
  const damage = first('damage');
  if (damage) values['damage'] = pct(damage.power);
  const heal = first('heal');
  if (heal) values['heal'] = pct(heal.power);
  const shield = first('shield');
  if (shield) values['shield'] = pct(shield.power);
  const burn = first('burn');
  if (burn) values['burn'] = pct(burn.power);
  const modify = first('modify');
  if (modify) values['amount'] = pct(modify.amount);
  const stun = first('stun');
  if (stun) values['chance'] = pct(stun.chance);
  const energy = first('energy');
  if (energy) values['energy'] = energy.amount;
  const timed = skill.effects.find((e) => 'turns' in e);
  if (timed && 'turns' in timed) values['turns'] = timed.turns;
  if ('cooldown' in skill) values['cooldown'] = skill.cooldown;
  if ('energy' in skill) values['cost'] = skill.energy;
  return values;
}
