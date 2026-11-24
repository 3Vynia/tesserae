import { createRng } from '../../engine/rng';

type Rgb = readonly [number, number, number];

export interface CloudOptions {
  size: number;
  seed: string;
  /** Light source in 0..1 texture coordinates. */
  light: { x: number; y: number };
  /** Base feature scale: higher means smaller clouds. */
  frequency?: number;
  /** 0..1, how much of the sky is covered. */
  coverage?: number;
}

const SHADOW: Rgb = [14, 24, 52]; // vault
const DUSK: Rgb = [43, 63, 134]; // lapis bright
const EMBER: Rgb = [231, 150, 92];
const DAWN: Rgb = [242, 200, 121];
const CREAM: Rgb = [250, 236, 200];

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number): number => t * t * (3 - 2 * t);

/** Tileable 2D value noise lattice from the seeded RNG. */
function lattice(seed: string, period: number): Float32Array {
  const rng = createRng(seed);
  const grid = new Float32Array(period * period);
  for (let i = 0; i < grid.length; i++) grid[i] = rng.next();
  return grid;
}

function valueNoise(grid: Float32Array, period: number, x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const tx = smooth(x - xi);
  const ty = smooth(y - yi);
  const at = (gx: number, gy: number): number =>
    grid[(((gy % period) + period) % period) * period + (((gx % period) + period) % period)] ?? 0;
  const a = at(xi, yi);
  const b = at(xi + 1, yi);
  const c = at(xi, yi + 1);
  const d = at(xi + 1, yi + 1);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}

/** Ramp for lit cloud color: far from the light the clouds cool into the night. */
function lightRamp(light: number): Rgb {
  if (light > 0.66) return mix(DAWN, CREAM, (light - 0.66) / 0.34);
  if (light > 0.33) return mix(EMBER, DAWN, (light - 0.33) / 0.33);
  return mix(DUSK, EMBER, light / 0.33);
}

/**
 * Renders an RGBA cloud layer. Pure and deterministic for a given seed so it can be tested and
 * regenerated identically on every visit. Clouds are lit from `light`: each pixel compares its
 * density with a sample a little toward the light, so faces turned to the light glow and the
 * far sides fall into shadow.
 */
export function renderClouds(options: CloudOptions): Uint8ClampedArray<ArrayBuffer> {
  const { size, seed, light, frequency = 4, coverage = 0.55 } = options;
  const octaves = 7;
  const grids = Array.from({ length: octaves }, (_, o) => ({
    period: frequency * 2 ** o,
    grid: lattice(`${seed}:${o}`, frequency * 2 ** o),
  }));
  const warp = { period: frequency, grid: lattice(`${seed}:warp`, frequency) };
  const fbm = (u: number, v: number): number => {
    // Domain warp gives the billowing, folded shapes of painted clouds.
    const wu =
      u + (valueNoise(warp.grid, warp.period, u * warp.period, v * warp.period) - 0.5) * 0.18;
    const wv =
      v + (valueNoise(warp.grid, warp.period, v * warp.period + 7.3, u * warp.period) - 0.5) * 0.18;
    let n = 0;
    let amp = 0.5;
    for (const { period, grid } of grids) {
      n += valueNoise(grid, period, wu * period, wv * period) * amp;
      amp *= 0.46;
    }
    return n / 0.92;
  };

  const out = new Uint8ClampedArray(new ArrayBuffer(size * size * 4));
  const threshold = 1 - coverage;
  const reach = 0.006;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const u = px / size;
      const v = py / size;
      const n = fbm(u, v);
      const density = clamp01(((n - threshold) / (1 - threshold)) * 2.2);
      const i = (py * size + px) * 4;
      if (density <= 0) continue;

      const dx = light.x - u;
      const dy = light.y - v;
      const dist = Math.hypot(dx, dy) || 1e-6;
      const toward = fbm(u + (dx / dist) * reach, v + (dy / dist) * reach);
      // Positive when the cloud thins toward the light: a lit face.
      const facing = clamp01(0.5 + (n - toward) * 14);
      const lit = clamp01(1 - dist / 0.58) ** 1.4;
      const lightness = clamp01(lit * (0.35 + facing * 0.75));
      const shadow = mix(SHADOW, DUSK, clamp01(lit * 1.5 + facing * 0.25));
      const color = mix(shadow, lightRamp(lightness), clamp01(lit * 0.9 + facing * lit));

      out[i] = color[0];
      out[i + 1] = color[1];
      out[i + 2] = color[2];
      out[i + 3] = Math.round(smooth(density) * 245);
    }
  }
  return out;
}

/** Renders on the main thread; used when workers or OffscreenCanvas are unavailable. */
async function renderOnMainThread(options: CloudOptions): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = options.size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.putImageData(new ImageData(renderClouds(options), options.size, options.size), 0, 0);
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function renderInWorker(options: CloudOptions): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./clouds.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<Blob | null>) => {
      resolve(e.data);
      worker.terminate();
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(e);
    };
    worker.postMessage(options);
  });
}

/** Browser helper: renders a cloud layer off the main thread and returns an object URL. */
export async function cloudTextureUrl(options: CloudOptions): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  let blob: Blob | null = null;
  if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
    blob = await renderInWorker(options).catch(() => null);
  }
  blob ??= await renderOnMainThread(options);
  return blob ? URL.createObjectURL(blob) : null;
}
