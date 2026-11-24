import { createRng } from '../../engine/rng';

interface Particle {
  angle: number;
  radius: number;
  delay: number;
  size: number;
  spin: number;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Stars spiral in from beyond the edges and meet in the middle, shifting from gold toward the
 * color of the rarest result, then burst outward. One canvas, no allocations per frame.
 */
export function playSummonParticles(
  canvas: HTMLCanvasElement,
  options: { count: number; to: string; gather: number; burst: number; seed: string },
): { done: Promise<void>; cancel: () => void } {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  if (!ctx || options.count === 0) return { done: Promise.resolve(), cancel: () => {} };
  ctx.scale(dpr, dpr);

  const rng = createRng(options.seed);
  const reach = Math.hypot(w, h) * 0.42;
  const particles: Particle[] = Array.from({ length: options.count }, () => ({
    angle: rng.next() * Math.PI * 2,
    radius: reach * (0.75 + rng.next() * 0.5),
    delay: rng.next() * 0.3,
    size: 1.4 + rng.next() ** 2 * 2.8,
    spin: 0.8 + rng.next() * 0.9,
  }));
  const gold = hexToRgb('#ecd496');
  const target = hexToRgb(options.to);
  const cx = w / 2;
  const cy = h / 2;
  const total = options.gather + options.burst;
  let raf = 0;
  let resolve: () => void = () => {};
  const done = new Promise<void>((r) => (resolve = r));
  const start = performance.now();

  const frame = (now: number) => {
    const elapsed = now - start;
    // Fade the previous frame instead of clearing it: that leaves short trails.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    if (elapsed < options.gather) {
      const g = elapsed / options.gather;
      const tint = Math.max(0, (g - 0.55) / 0.45);
      const r = lerp(gold[0], target[0], tint);
      const gg = lerp(gold[1], target[1], tint);
      const b = lerp(gold[2], target[2], tint);
      for (const p of particles) {
        const local = Math.min(1, Math.max(0, (g - p.delay) / (1 - p.delay)));
        const e = easeInOut(local);
        const rad = p.radius * (1 - e);
        const ang = p.angle + (1 - e) * p.spin * 1.6;
        ctx.fillStyle = `rgba(${r | 0}, ${gg | 0}, ${b | 0}, ${0.55 + e * 0.45})`;
        ctx.fillRect(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, p.size, p.size);
      }
    } else if (elapsed < total) {
      const t = (elapsed - options.gather) / options.burst;
      const e = 1 - (1 - t) ** 3;
      ctx.fillStyle = `rgba(${target[0]}, ${target[1]}, ${target[2]}, ${1 - t})`;
      for (const p of particles) {
        const rad = e * p.radius * 0.45 * p.spin;
        ctx.fillRect(cx + Math.cos(p.angle) * rad, cy + Math.sin(p.angle) * rad, p.size, p.size);
      }
    } else {
      ctx.clearRect(0, 0, w, h);
      resolve();
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return {
    done,
    cancel: () => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
      resolve();
    },
  };
}
