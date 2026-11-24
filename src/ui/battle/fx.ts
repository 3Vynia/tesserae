import { POP_SPRING, stepSpring } from '../motion/spring';

/** Keyframes for a spring pop from `from` to 1, sampled once and reused by every number. */
export const POP_FRAMES: Keyframe[] = (() => {
  const frames: Keyframe[] = [];
  let s = { value: 0.4, velocity: 0 };
  for (let i = 0; i <= 36; i++) {
    frames.push({ transform: `translate(-50%, 0) scale(${s.value.toFixed(3)})` });
    s = stepSpring(s, 1, 1 / 60, POP_SPRING);
  }
  return frames;
})();

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
