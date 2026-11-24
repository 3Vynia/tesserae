import type { Action } from 'svelte/action';
import { motion } from '../motion/motion.svelte';
import { isSettled, stepSpring, TILT_SPRING, type SpringState } from '../motion/spring';

interface TiltOptions {
  /** Max rotation in degrees. */
  max?: number;
  disabled?: boolean;
}

/**
 * Pointer-following 3D tilt driven by springs. Writes transform on the node and the glare
 * position on its `.shine` child directly, so no inherited custom property recalculates the tree.
 */
export const tilt: Action<HTMLElement, TiltOptions | undefined> = (node, initial) => {
  let options = initial ?? {};
  const shine = () => node.querySelector<HTMLElement>('.shine');
  let target = { x: 0, y: 0 };
  let sx: SpringState = { value: 0, velocity: 0 };
  let sy: SpringState = { value: 0, velocity: 0 };
  let raf = 0;
  let last = 0;

  const frame = (now: number) => {
    const dt = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    sx = stepSpring(sx, target.x, dt, TILT_SPRING);
    sy = stepSpring(sy, target.y, dt, TILT_SPRING);
    const max = options.max ?? 12;
    node.style.transform = `rotateX(${(-sy.value * max).toFixed(2)}deg) rotateY(${(sx.value * max).toFixed(2)}deg)`;
    const s = shine();
    if (s) {
      s.style.setProperty('--mx', `${(50 + sx.value * 50).toFixed(1)}%`);
      s.style.setProperty('--my', `${(50 + sy.value * 50).toFixed(1)}%`);
      s.style.setProperty('--tilt', Math.min(1, Math.hypot(sx.value, sy.value) * 1.4).toFixed(3));
    }
    if (isSettled(sx, target.x) && isSettled(sy, target.y)) {
      raf = 0;
      last = 0;
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const move = (e: PointerEvent) => {
    if (options.disabled || motion.calm) return;
    const r = node.getBoundingClientRect();
    target = {
      x: Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)),
      y: Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)),
    };
    kick();
  };
  const leave = () => {
    target = { x: 0, y: 0 };
    kick();
  };
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerleave', leave);
  return {
    update(next) {
      options = next ?? {};
      if (options.disabled) leave();
    },
    destroy() {
      cancelAnimationFrame(raf);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', leave);
    },
  };
};
