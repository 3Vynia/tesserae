/** Damped spring integrated with a fixed step. Pure, so it can be tested and reused anywhere. */
export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass?: number;
}

export interface SpringState {
  value: number;
  velocity: number;
}

export const TILT_SPRING: SpringConfig = { stiffness: 170, damping: 26 };
export const POP_SPRING: SpringConfig = { stiffness: 260, damping: 18 };

const STEP = 1 / 120;

/** Advances a spring toward `target` by `dt` seconds. */
export function stepSpring(
  state: SpringState,
  target: number,
  dt: number,
  config: SpringConfig,
): SpringState {
  const mass = config.mass ?? 1;
  let { value, velocity } = state;
  let remaining = Math.min(dt, 0.1);
  while (remaining > 0) {
    const h = Math.min(STEP, remaining);
    const force = -config.stiffness * (value - target) - config.damping * velocity;
    velocity += (force / mass) * h;
    value += velocity * h;
    remaining -= h;
  }
  return { value, velocity };
}

export function isSettled(state: SpringState, target: number, epsilon = 0.001): boolean {
  return Math.abs(state.value - target) < epsilon && Math.abs(state.velocity) < epsilon;
}
