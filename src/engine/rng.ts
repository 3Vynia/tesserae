/**
 * Small deterministic PRNG (sfc32) seeded from a string or number.
 * All game logic draws randomness from here so runs can be replayed from a seed.
 */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max], both inclusive. */
  int(min: number, max: number): number;
  /** Returns true with the given probability. */
  chance(probability: number): boolean;
  pick<T>(items: readonly T[]): T;
  /** Current internal state, to persist and resume a sequence. */
  state(): [number, number, number, number];
}

/** cyrb128 string hash, used to expand a seed into four 32-bit words. */
export function hashSeed(seed: string | number): [number, number, number, number] {
  const str = String(seed);
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export function createRng(seed: string | number | [number, number, number, number]): Rng {
  let [a, b, c, d] = Array.isArray(seed) ? seed : hashSeed(seed);
  const next = (): number => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  return {
    next,
    int(min, max) {
      if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
        throw new RangeError(`invalid range [${min}, ${max}]`);
      }
      return min + Math.floor(next() * (max - min + 1));
    },
    chance: (probability) => next() < probability,
    pick(items) {
      if (items.length === 0) throw new RangeError('cannot pick from an empty list');
      return items[Math.floor(next() * items.length)] as (typeof items)[number];
    },
    state: () => [a >>> 0, b >>> 0, c >>> 0, d >>> 0],
  };
}
