import { describe, expect, it } from 'vitest';
import { isSettled, POP_SPRING, stepSpring, TILT_SPRING } from './spring';

function run(config = TILT_SPRING, seconds = 2) {
  let s = { value: 0, velocity: 0 };
  let peak = 0;
  for (let t = 0; t < seconds; t += 1 / 60) {
    s = stepSpring(s, 1, 1 / 60, config);
    peak = Math.max(peak, s.value);
  }
  return { s, peak };
}

describe('spring', () => {
  it('settles on the target', () => {
    const { s } = run();
    expect(isSettled(s, 1)).toBe(true);
  });

  it('tilt barely overshoots, pop bounces a little', () => {
    expect(run(TILT_SPRING).peak).toBeLessThan(1.05);
    const pop = run(POP_SPRING).peak;
    expect(pop).toBeGreaterThan(1.05);
    expect(pop).toBeLessThan(1.4);
  });

  it('is stable with a long frame', () => {
    const s = stepSpring({ value: 0, velocity: 0 }, 1, 5, TILT_SPRING);
    expect(Number.isFinite(s.value)).toBe(true);
    expect(Math.abs(s.value)).toBeLessThan(2);
  });
});
