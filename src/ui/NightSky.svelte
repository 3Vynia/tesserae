<script lang="ts">
  import { createRng } from '../engine/rng';

  interface Props {
    seed?: string;
    stars?: number;
  }
  let { seed = 'tesserae-sky', stars = 140 }: Props = $props();

  const sky = $derived.by(() => {
    const rng = createRng(seed);
    const points = Array.from({ length: stars }, () => ({
      x: rng.next() * 1000,
      y: rng.next() * 1000,
      r: 0.4 + rng.next() ** 3 * 1.8,
      o: 0.35 + rng.next() * 0.6,
      delay: rng.next() * 6,
    }));
    // A few loose constellations: short chains of nearby bright stars.
    const lines: Array<[number, number, number, number]> = [];
    for (let c = 0; c < 4; c++) {
      let x = 100 + rng.next() * 800;
      let y = 80 + rng.next() * 500;
      for (let i = 0; i < 4 + rng.int(0, 2); i++) {
        const nx = x + (rng.next() - 0.4) * 110;
        const ny = y + (rng.next() - 0.4) * 80;
        lines.push([x, y, nx, ny]);
        x = nx;
        y = ny;
      }
    }
    return { points, lines };
  });
</script>

<svg class="sky" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <radialGradient id="sky-glow" cx="50%" cy="0%" r="90%">
      <stop offset="0%" stop-color="#1a2652" />
      <stop offset="55%" stop-color="#0b1128" />
      <stop offset="100%" stop-color="#05070f" />
    </radialGradient>
  </defs>
  <rect width="1000" height="1000" fill="url(#sky-glow)" />
  <g class="lines">
    {#each sky.lines as [x1, y1, x2, y2], i (i)}
      <line {x1} {y1} {x2} {y2} />
      <circle cx={x2} cy={y2} r="1.6" class="node" />
    {/each}
  </g>
  {#each sky.points as s, i (i)}
    <circle
      cx={s.x}
      cy={s.y}
      r={s.r}
      opacity={s.o}
      class="star"
      style:animation-delay="{s.delay}s"
    />
  {/each}
</svg>

<style>
  .sky {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
  }
  .star {
    fill: var(--parchment-100);
    animation: twinkle 7s ease-in-out infinite;
  }
  .lines line {
    stroke: var(--gold-400);
    stroke-width: 0.6;
    opacity: 0.22;
  }
  .node {
    fill: var(--gold-300);
    opacity: 0.6;
  }
  @keyframes twinkle {
    0%,
    100% {
      opacity: inherit;
    }
    50% {
      opacity: 0.15;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .star {
      animation: none;
    }
  }
</style>
