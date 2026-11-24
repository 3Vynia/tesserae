<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { CARDS_BY_ID } from '../../data/cards';
  import { RARITIES, type Rarity } from '../../data/schema';
  import type { PullResult } from '../../engine/gacha';
  import { t } from '../../i18n/i18n.svelte';
  import { cardName } from '../../app/card-text';
  import { motion, particleBudget } from '../motion/motion.svelte';
  import CardView from '../card/Card.svelte';
  import Button from '../Button.svelte';
  import { playSummonParticles } from './particles';
  import { portal } from '../portal';

  interface Props {
    results: PullResult[];
    seed: string;
    onclose: (action: 'vault' | 'stay') => void;
  }
  let { results, seed, onclose }: Props = $props();

  const RARITY_HEX: Record<Rarity, string> = {
    mortal: '#c49a74',
    hero: '#b4c8dc',
    demigod: '#86c4a6',
    god: '#f2c879',
    primordial: '#e6dcf0',
  };
  const rank = (r: Rarity) => RARITIES.indexOf(r);
  const top = $derived(
    results.reduce<Rarity>((best, r) => (rank(r.rarity) > rank(best) ? r.rarity : best), 'mortal'),
  );
  // Rarer results are revealed later, the rarest last with a pause before it.
  const order = $derived(
    results
      .map((r, i) => ({ i, rank: rank(r.rarity) }))
      .sort((a, b) => a.rank - b.rank || a.i - b.i)
      .map((x) => x.i),
  );
  const delayOf = (i: number) => {
    const pos = order.indexOf(i);
    const last =
      pos === order.length - 1 && rank(results[i]?.rarity ?? 'mortal') >= rank('demigod');
    return pos * 110 + (last ? 420 : 0);
  };

  let phase = $state<'gather' | 'burst' | 'reveal'>('gather');
  let canvas = $state<HTMLCanvasElement>();
  let skipButton = $state<HTMLButtonElement>();
  let doneButton = $state<HTMLElement>();
  let cancel: (() => void) | null = null;

  async function reveal(): Promise<void> {
    cancel?.();
    phase = 'reveal';
    await tick();
    doneButton?.querySelector('button')?.focus();
  }

  onMount(() => {
    skipButton?.focus();
    if (motion.calm || !canvas) {
      void reveal();
      return;
    }
    const gather = 1100 + rank(top) * 120;
    const run = playSummonParticles(canvas, {
      count: particleBudget(),
      to: RARITY_HEX[top],
      gather,
      burst: 420,
      seed,
    });
    cancel = run.cancel;
    const toBurst = setTimeout(() => (phase = 'burst'), gather);
    void run.done.then(() => {
      if (phase !== 'reveal') void reveal();
    });
    return () => {
      clearTimeout(toBurst);
      run.cancel();
    };
  });
</script>

<div
  use:portal
  class="ceremony top-{top}"
  class:many={results.length > 1}
  role="dialog"
  aria-modal="true"
  aria-label={t('ui.ceremony.label')}
  tabindex="-1"
  style:--glow={RARITY_HEX[top]}
  onkeydown={(e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (phase !== 'reveal') void reveal();
      else onclose('stay');
    }
  }}
>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
  <div class="flash" class:on={phase === 'burst' || phase === 'reveal'} aria-hidden="true"></div>

  {#if phase === 'reveal'}
    <ol class="spread" aria-live="polite">
      {#each results as result, i (i)}
        {@const card = CARDS_BY_ID.get(result.card)}
        {#if card}
          <li
            class="slot rarity-{result.rarity}"
            style:--i={i - (results.length - 1) / 2}
            style:--delay="{delayOf(i)}ms"
          >
            <div class="card-wrap">
              <CardView {card} interactive={results.length === 1} />
            </div>
            <p class="status caps" class:fresh={result.isNew}>
              {result.isNew ? t('ui.ceremony.new') : t('ui.ceremony.copy')}
            </p>
            <span class="visually-hidden">
              {t('ui.ceremony.result', {
                name: cardName(card),
                rarity: t(`ui.rarity.${result.rarity}`),
                status: result.isNew ? t('ui.ceremony.new') : t('ui.ceremony.copy'),
              })}
            </span>
          </li>
        {/if}
      {/each}
    </ol>
    <div class="actions" bind:this={doneButton}>
      <Button variant="gilt" icon="collection" onclick={() => onclose('vault')}>
        {t('ui.ceremony.done')}
      </Button>
      <Button variant="quiet" onclick={() => onclose('stay')}>{t('ui.ceremony.again')}</Button>
    </div>
  {:else}
    <button class="skip caps" type="button" bind:this={skipButton} onclick={() => void reveal()}>
      {t('ui.ceremony.skip')}
    </button>
  {/if}
</div>

<style>
  .ceremony {
    position: fixed;
    inset: 0;
    z-index: var(--z-ceremony);
    display: grid;
    grid-template-rows: 1fr auto;
    place-items: center;
    padding: var(--space-6) var(--gutter);
    background: radial-gradient(circle at 50% 45%, #121c42 0, var(--ink) 60%, var(--ink-deep) 100%);
    overflow: hidden;
    animation: dim var(--dur-sheet) var(--ease-out) both;
  }
  .ceremony:focus {
    outline: none;
  }
  @keyframes dim {
    from {
      opacity: 0;
    }
  }
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .flash {
    position: absolute;
    left: 50%;
    top: 45%;
    width: 140vmax;
    height: 140vmax;
    translate: -50% -50%;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--glow) 55%, transparent) 0,
      color-mix(in srgb, var(--glow) 18%, transparent) 18%,
      transparent 45%
    );
    opacity: 0;
    scale: 0.2;
    pointer-events: none;
  }
  .flash.on {
    animation: flash 1100ms var(--ease-out) forwards;
  }
  @keyframes flash {
    0% {
      opacity: 0;
      scale: 0.2;
    }
    25% {
      opacity: 1;
    }
    100% {
      opacity: 0.55;
      scale: 1;
    }
  }
  .top-god .flash.on,
  .top-primordial .flash.on {
    animation-duration: 1500ms;
  }

  .spread {
    position: relative;
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }
  .slot {
    display: grid;
    justify-items: center;
    gap: var(--space-2);
    width: min(19rem, 70vw);
    animation: arrive 620ms var(--ease-settle) var(--delay) both;
  }
  @keyframes arrive {
    from {
      opacity: 0;
      transform: translateY(40px) scale(0.88);
      filter: brightness(2.4);
    }
    60% {
      filter: brightness(1.3);
    }
  }
  /* ten cards: an arc, like a hand of cards held up to the light */
  .many .slot {
    width: clamp(5.5rem, 9vw, 9.5rem);
    margin-inline: calc(clamp(5.5rem, 9vw, 9.5rem) * -0.12);
    transform-origin: 50% 160%;
    rotate: calc(var(--i) * 4.5deg);
    translate: 0 calc(var(--i) * var(--i) * 3px);
  }
  .card-wrap {
    width: 100%;
  }
  .slot.rarity-god .card-wrap,
  .slot.rarity-primordial .card-wrap {
    filter: drop-shadow(0 0 24px color-mix(in srgb, var(--glow) 60%, transparent));
  }
  .status {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .status.fresh {
    color: var(--gold-pale);
  }
  .actions {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-3);
    animation: arrive 500ms var(--ease-out) 900ms both;
  }
  .many .actions {
    animation-delay: 1500ms;
  }
  .skip {
    position: absolute;
    right: var(--gutter);
    bottom: var(--space-6);
    min-height: 44px;
    padding: 0 var(--space-4);
    border: 1px solid var(--rule);
    border-radius: var(--radius-control);
    background: transparent;
    color: var(--parchment-dim);
    font-size: var(--text-lg);
    cursor: pointer;
  }
  @media (max-width: 760px) {
    .many .spread {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: var(--space-2);
    }
    .many .slot {
      width: auto;
      margin: 0;
      rotate: none;
      translate: none;
    }
  }
  :global([data-motion='calm']) .slot,
  :global([data-motion='calm']) .actions {
    animation-name: fade;
    animation-duration: var(--dur-base);
  }
  :global([data-motion='calm']) .many .slot {
    rotate: none;
    translate: none;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
