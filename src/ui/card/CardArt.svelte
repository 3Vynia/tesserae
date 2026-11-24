<script lang="ts">
  import type { Card } from '../../data/schema';
  import { createRng } from '../../engine/rng';
  import { ELEMENT_TINT, GLYPHS, PANTHEON_GROUND } from './art';

  // Swappable art: real art from public/art when the card names a file, a generated plate otherwise.
  let { card }: { card: Card } = $props();
  const ground = $derived(PANTHEON_GROUND[card.pantheon]);
  const tint = $derived(ELEMENT_TINT[card.element]);
  const stars = $derived.by(() => {
    const rng = createRng(card.id);
    return Array.from({ length: 26 }, () => ({
      x: rng.next() * 100,
      y: rng.next() * 140,
      r: 0.3 + rng.next() ** 3 * 1.1,
    }));
  });
  const uid = $props.id();
</script>

{#if card.art.file}
  <img class="art" src={`art/${card.art.file}`} alt="" loading="lazy" decoding="async" />
{:else}
  <svg class="art" viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <radialGradient id="g-{uid}" cx="50%" cy="38%" r="75%">
        <stop offset="0" stop-color={ground[0]} />
        <stop offset="1" stop-color={ground[1]} />
      </radialGradient>
      <radialGradient id="h-{uid}" cx="50%" cy="40%" r="35%">
        <stop offset="0" stop-color={tint} stop-opacity="0.35" />
        <stop offset="1" stop-color={tint} stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="100" height="140" fill="url(#g-{uid})" />
    {#each stars as s, i (i)}
      <circle cx={s.x} cy={s.y} r={s.r} fill="#f1e6cc" opacity="0.5" />
    {/each}
    <circle cx="50" cy="56" r="36" fill="url(#h-{uid})" />
    <circle
      cx="50"
      cy="56"
      r="30"
      fill="none"
      stroke={tint}
      stroke-opacity="0.35"
      stroke-width="0.5"
    />
    <circle
      cx="50"
      cy="56"
      r="33"
      fill="none"
      stroke={tint}
      stroke-opacity="0.2"
      stroke-width="0.3"
      stroke-dasharray="1 2"
    />
    <g transform="translate(22 28) scale(0.875)">
      <path class="glyph" d={GLYPHS[card.art.glyph] ?? GLYPHS['shield']} />
    </g>
  </svg>
{/if}

<style>
  .art {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .glyph {
    fill: none;
    stroke: var(--gold-pale);
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
