<script lang="ts">
  import type { Card } from '../../data/schema';
  import type { OwnedCard } from '../../engine/save';
  import { t } from '../../i18n/i18n.svelte';
  import { cardEpithet, cardName } from '../../app/card-text';
  import CardArt from '../card/CardArt.svelte';
  import { GLYPHS } from '../card/art';
  import { createRng } from '../../engine/rng';

  interface Props {
    card: Card;
    owned: OwnedCard | undefined;
    dim: boolean;
    /** Name used to fly the art into the detail view. */
    transitionName: string | null;
    onopen: () => void;
  }
  let { card, owned, dim, transitionName, onopen }: Props = $props();

  // Hand-set look: each tessera sits a little off true, the same way on every visit.
  const set = $derived.by(() => {
    const rng = createRng(`tile:${card.id}`);
    return `rotate(${(rng.next() * 2.4 - 1.2).toFixed(2)}deg) translate(${(rng.next() * 2 - 1).toFixed(1)}px, ${(rng.next() * 2 - 1).toFixed(1)}px) scale(${(0.965 + rng.next() * 0.035).toFixed(3)})`;
  });

  const summary = $derived(
    t('ui.card.summary', {
      name: cardName(card),
      epithet: cardEpithet(card),
      rarity: t(`ui.rarity.${card.rarity}`),
      pantheon: t(`ui.pantheon.${card.pantheon}`),
      element: t(`ui.element.${card.element}`),
    }),
  );
</script>

<button
  type="button"
  class="tile rarity-{card.rarity}"
  class:lit={owned}
  class:dim
  data-card={card.id}
  aria-label={t(owned ? 'ui.collection.tileOwned' : 'ui.collection.tileMissing', { summary }) +
    (owned && !owned.seen ? ` ${t('ui.collection.new')}` : '')}
  onclick={onopen}
>
  <span class="glass" style:view-transition-name={transitionName} style:transform={set}>
    {#if owned}
      <span class="gold"><CardArt {card} /></span>
    {:else}
      <svg class="ghost" viewBox="0 0 64 64" aria-hidden="true">
        <path d={GLYPHS[card.art.glyph] ?? ''} />
      </svg>
    {/if}
  </span>
  {#if owned && !owned.seen}<span class="new" aria-hidden="true"></span>{/if}
  <span class="label" aria-hidden="true">{owned ? cardName(card) : '?'}</span>
</button>

<style>
  .tile {
    --accent: var(--rarity-mortal);
    position: relative;
    display: block;
    width: 100%;
    aspect-ratio: 1;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    transition:
      opacity var(--dur-base) ease,
      filter var(--dur-base) ease,
      transform var(--dur-press) var(--ease-out);
  }
  .rarity-hero {
    --accent: var(--rarity-hero);
  }
  .rarity-demigod {
    --accent: var(--rarity-demigod);
  }
  .rarity-god {
    --accent: var(--rarity-god);
  }
  .rarity-primordial {
    --accent: var(--rarity-primordial);
  }
  .tile:active {
    transform: scale(0.96);
  }
  .tile.dim {
    opacity: 0.22;
    filter: saturate(0.3);
  }
  .glass {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: var(--radius-tile);
    background:
      linear-gradient(135deg, rgb(255 255 255 / 0.05), transparent 45%),
      linear-gradient(180deg, #121e40, #0a1229);
    box-shadow: var(--bevel);
  }
  .ghost {
    position: absolute;
    inset: 22%;
    fill: none;
    stroke: var(--lapis-bright);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.7;
  }
  .gold {
    position: absolute;
    inset: 0;
    animation: ignite 700ms var(--ease-out) both;
    animation-delay: var(--delay, 0ms);
  }
  .lit .glass {
    box-shadow: var(--shadow-2);
  }
  .lit .glass::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    box-shadow:
      inset 0 0 0 3px var(--accent),
      inset 0 0 0 4px rgb(4 6 13 / 0.7),
      inset 0 0 18px rgb(242 200 121 / 0.25);
    background: linear-gradient(
      125deg,
      rgb(255 244 210 / 0.22) 0,
      transparent 30%,
      transparent 70%,
      rgb(255 244 210 / 0.12) 100%
    );
  }
  @keyframes ignite {
    0% {
      opacity: 0;
      filter: brightness(2.2) saturate(0.4);
      transform: scale(0.94);
    }
    45% {
      opacity: 1;
      filter: brightness(1.6) saturate(0.7);
    }
    100% {
      opacity: 1;
      filter: none;
      transform: none;
    }
  }
  .new {
    position: absolute;
    top: 6%;
    right: 6%;
    width: 16%;
    aspect-ratio: 1;
    background: var(--gold-pale);
    clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  }
  .label {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    padding: 18% 6% 6%;
    font-family: var(--font-display);
    font-size: clamp(0.7rem, 0.55rem + 0.5vw, 0.9rem);
    line-height: 1.1;
    color: var(--parchment);
    background: linear-gradient(0deg, rgb(4 6 13 / 0.9), transparent);
    border-radius: 0 0 var(--radius-tile) var(--radius-tile);
    opacity: 0;
    transition: opacity var(--dur-quick) ease;
    pointer-events: none;
    text-align: start;
  }
  .tile:focus-visible .label {
    opacity: 1;
  }
  @media (hover: hover) and (pointer: fine) {
    .tile:hover .label {
      opacity: 1;
    }
    .tile:hover:not(.dim) {
      transform: translateY(-2px);
    }
  }
  :global([data-motion='calm']) .gold {
    animation-name: fade;
    animation-duration: var(--dur-base);
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
