import { motion } from './motion.svelte';

/**
 * Sends a few small stars from `from` to the element with id `toId` along a curved path, then
 * pulses the target. Used when starlight is earned so the player sees where it went.
 */
export function flyStarlight(from: Element, toId: string, count = 6): Promise<void> {
  const target = document.getElementById(toId);
  if (!target) return Promise.resolve();
  if (motion.calm) {
    target.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 240, easing: 'ease' });
    return Promise.resolve();
  }
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const start = { x: a.left + a.width / 2, y: a.top + a.height / 2 };
  const end = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  const flights: Promise<unknown>[] = [];
  for (let i = 0; i < count; i++) {
    const star = document.createElement('span');
    star.className = 'flying-star';
    star.style.left = `${start.x}px`;
    star.style.top = `${start.y}px`;
    document.body.append(star);
    const spread = (i - (count - 1) / 2) * 18;
    const mid = {
      x: (start.x + end.x) / 2 + spread,
      y: Math.min(start.y, end.y) - 80 - Math.abs(spread),
    };
    const anim = star.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.6)', opacity: 0 },
        {
          transform: `translate(calc(-50% + ${mid.x - start.x}px), calc(-50% + ${mid.y - start.y}px)) scale(1)`,
          opacity: 1,
          offset: 0.45,
        },
        {
          transform: `translate(calc(-50% + ${end.x - start.x}px), calc(-50% + ${end.y - start.y}px)) scale(0.5)`,
          opacity: 0.9,
        },
      ],
      { duration: 700, delay: i * 55, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'both' },
    );
    flights.push(anim.finished.finally(() => star.remove()));
  }
  return Promise.all(flights).then(() => {
    target.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }],
      { duration: 320, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    );
  });
}

/** Animates a number change on an element's text, with tabular figures so it does not jitter. */
export function countUp(
  from: number,
  to: number,
  onFrame: (value: number) => void,
  duration = 600,
): () => void {
  if (motion.calm || from === to) {
    onFrame(to);
    return () => {};
  }
  let raf = 0;
  const start = performance.now();
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 4;
    onFrame(Math.round(from + (to - from) * eased));
    if (t < 1) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
