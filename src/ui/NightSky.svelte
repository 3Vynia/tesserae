<script lang="ts">
  import { createRng } from '../engine/rng';

  interface Props {
    seed?: string;
    stars?: number;
    /** Fixed to the viewport (page background) or filling its parent. */
    fixed?: boolean;
    /** Draw constellation lines with a stroke animation. */
    constellations?: boolean;
  }
  let { seed = 'tesserae-sky', stars = 140, fixed = true, constellations = true }: Props = $props();

  const sky = $derived.by(() => {
    const rng = createRng(seed);
    const points = Array.from({ length: stars }, () => ({
      x: rng.next() * 1000,
      y: rng.next() * 1000,
      r: 0.5 + rng.next() ** 4 * 2.2,
      o: 0.35 + rng.next() * 0.6,
      gold: rng.chance(0.3),
      delay: rng.next() * 8,
    }));
    const lines: Array<{ d: string; length: number }> = [];
    for (let c = 0; c < 3; c++) {
      let x = 80 + rng.next() * 840;
      let y = 60 + rng.next() * 880;
      let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
      let length = 0;
      for (let i = 0; i < 4 + rng.int(0, 2); i++) {
        const nx = x + (rng.next() - 0.45) * 120;
        const ny = y + (rng.next() - 0.45) * 90;
        length += Math.hypot(nx - x, ny - y);
        d += ` L${nx.toFixed(1)} ${ny.toFixed(1)}`;
        x = nx;
        y = ny;
      }
      lines.push({ d, length: Math.ceil(length) });
    }
    return { points, lines };
  });
</script>

<svg
  class="sky"
  class:fixed
  viewBox="0 0 1000 1000"
  preserveAspectRatio="xMidYMid slice"
  aria-hidden="true"
>
  {#if constellations}
    {#each sky.lines as line, i (i)}
      <path class="line" d={line.d} style:--len={line.length} style:--i={i} />
    {/each}
  {/if}
  {#each sky.points as s, i (i)}
    <circle
      cx={s.x}
      cy={s.y}
      r={s.r}
      opacity={s.o}
      class="star"
      class:gold={s.gold}
      style:animation-delay="{s.delay}s"
    />
  {/each}
</svg>

<style>
  .sky {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .sky.fixed {
    position: fixed;
    z-index: var(--z-sky);
  }
  .star {
    fill: var(--parchment);
    animation: twinkle 9s ease-in-out infinite;
  }
  .star.gold {
    fill: var(--gold-pale);
  }
  .line {
    fill: none;
    stroke: var(--gold);
    stroke-width: 0.7;
    opacity: 0.35;
    stroke-dasharray: var(--len);
    stroke-dashoffset: var(--len);
    animation: draw var(--dur-ceremony) var(--ease-in-out) forwards;
    animation-delay: calc(400ms + var(--i) * 80ms);
  }
  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }
  @keyframes twinkle {
    50% {
      opacity: 0.12;
    }
  }
  :global([data-motion='calm']) .star {
    animation: none;
  }
  :global([data-motion='calm']) .line {
    stroke-dashoffset: 0;
    animation: fade var(--dur-base) ease both;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
