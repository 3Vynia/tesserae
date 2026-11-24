import { describe, expect, it } from 'vitest';
import { renderClouds } from './clouds';

const base = { size: 32, seed: 'test', light: { x: 0.5, y: 0.5 } };

describe('renderClouds', () => {
  it('is deterministic', () => {
    expect(renderClouds(base)).toEqual(renderClouds(base));
  });

  it('changes with the seed', () => {
    expect(renderClouds(base)).not.toEqual(renderClouds({ ...base, seed: 'other' }));
  });

  it('is warmer near the light than far from it', () => {
    const data = renderClouds({ ...base, size: 64 });
    const red = (x: number, y: number) => data[(y * 64 + x) * 4]!;
    const blue = (x: number, y: number) => data[(y * 64 + x) * 4 + 2]!;
    expect(red(32, 32) - blue(32, 32)).toBeGreaterThan(red(0, 0) - blue(0, 0));
  });

  it('coverage controls how much sky is clouded', () => {
    const alpha = (c: number) =>
      renderClouds({ ...base, coverage: c }).filter((_, i) => i % 4 === 3 && _ > 0).length;
    expect(alpha(0.8)).toBeGreaterThan(alpha(0.3));
  });
});
