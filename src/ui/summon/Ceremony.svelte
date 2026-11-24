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
  import { modal, portal } from '../portal';
  import CardArt from '../card/CardArt.svelte';
  import { fmtNumber } from '../../i18n/i18n.svelte';
  import { tally } from '../../app/tally';

  interface Props {
    results: PullResult[];
    seed: string;
    onclose: (action: 'vault' | 'stay') => void;
    /** Replaying a past wish: no new-or-copy labels, and the actions only close. */
    replay?: boolean;
  }
  let { results, seed, onclose, replay = false }: Props = $props();

  // A big wish (more than ten) shows its highlights as cards and the rest as a tally.
  const haul = $derived(results.length > 10);
  const rows = $derived(tally(results));
  const perRarity = $derived(
    RARITIES.map((r) => ({ rarity: r, count: results.filter((x) => x.rarity === r).length }))
      .filter((x) => x.count > 0)
      .reverse(),
  );
  const shown = $derived.by((): PullResult[] => {
    if (!haul) return results;
    const best = rows
      .filter((x) => x.isNew || rank(x.rarity) >= rank('god'))
      .slice(0, 10)
      .map((x) => ({ card: x.card, rarity: x.rarity, isNew: x.isNew }));
    return best.length ? best : rows.slice(0, 5).map((x) => ({ ...x }));
  });

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
    shown
      .map((r, i) => ({ i, rank: rank(r.rarity) }))
      .sort((a, b) => a.rank - b.rank || a.i - b.i)
      .map((x) => x.i),
  );
  const delayOf = (i: number) => {
    const pos = order.indexOf(i);
    const last = pos === order.length - 1 && rank(shown[i]?.rarity ?? 'mortal') >= rank('demigod');
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
  use:modal
  class="ceremony top-{top}"
  class:many={shown.length > 1}
  class:haul
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
    {#if haul}
      <div class="haul-head">
        <h2 class="caps">{t('ui.ceremony.haul', { count: results.length })}</h2>
        <ul class="per-rarity">
          {#each perRarity as row (row.rarity)}
            <li style:--pip="var(--rarity-{row.rarity})">
              <i aria-hidden="true"></i>{t(`ui.rarity.${row.rarity}`)}
              <b>{fmtNumber(row.count)}</b>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
    <ol class="spread" aria-live="polite">
      {#each shown as result, i (i)}
        {@const card = CARDS_BY_ID.get(result.card)}
        {#if card}
          <li
            class="slot rarity-{result.rarity}"
            style:--i={i - (shown.length - 1) / 2}
            style:--delay="{delayOf(i)}ms"
          >
            <div class="card-wrap">
              <CardView {card} interactive={shown.length === 1} />
            </div>
            {#if !replay}
              <p class="status caps" class:fresh={result.isNew}>
                {result.isNew ? t('ui.ceremony.new') : t('ui.ceremony.copy')}
              </p>
            {/if}
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
    {#if haul}
      <ul class="tally" aria-label={t('ui.ceremony.tally')}>
        {#each rows as row (row.card)}
          {@const card = CARDS_BY_ID.get(row.card)}
          {#if card}
            <li class="rarity-{row.rarity}" title={cardName(card)}>
              <span class="thumb"><CardArt {card} /></span>
              <span class="times">×{fmtNumber(row.count)}</span>
              {#if row.isNew && !replay}<span class="new caps">{t('ui.ceremony.new')}</span>{/if}
              <span class="visually-hidden">{cardName(card)}</span>
            </li>
          {/if}
        {/each}
      </ul>
    {/if}
    <div class="actions" bind:this={doneButton}>
      {#if replay}
        <Button variant="gilt" onclick={() => onclose('stay')}>
          {t('ui.ceremony.closeReplay')}
        </Button>
      {:else}
        <Button variant="gilt" icon="collection" onclick={() => onclose('vault')}>
          {t('ui.ceremony.done', { count: results.length })}
        </Button>
        <Button variant="quiet" onclick={() => onclose('stay')}>{t('ui.ceremony.again')}</Button>
      {/if}
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
  /* a big wish: the highlights in an arc, then the whole haul as a tally */
  .haul {
    grid-template-rows: auto auto 1fr auto;
    place-items: start center;
    gap: var(--space-4);
    overflow-y: auto;
  }
  .haul .spread {
    padding: var(--space-4) 0 var(--space-8);
  }
  .haul .status {
    display: none;
  }
  .haul .slot {
    width: clamp(4.5rem, 7vw, 7.5rem);
    margin-inline: calc(clamp(4.5rem, 7vw, 7.5rem) * -0.1);
  }
  .haul-head {
    position: relative;
    display: grid;
    justify-items: center;
    gap: var(--space-2);
    animation: arrive 500ms var(--ease-out) both;
  }
  .haul-head h2 {
    font-size: var(--text-3xl);
    color: var(--gold-pale);
    letter-spacing: 0.06em;
  }
  .per-rarity {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2) var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--parchment-dim);
  }
  .per-rarity li {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  .per-rarity i {
    width: 0.6em;
    height: 0.6em;
    rotate: 45deg;
    background: var(--pip);
  }
  .per-rarity b {
    font-weight: 500;
    color: var(--gold-pale);
    font-variant-numeric: lining-nums tabular-nums;
  }
  .tally {
    position: relative;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(4.25rem, 1fr));
    gap: var(--space-2);
    width: min(60rem, 100%);
    margin: 0;
    padding: var(--space-3);
    list-style: none;
    border: 1px solid var(--rule);
    border-radius: var(--radius-sheet);
    background: rgb(7 10 20 / 0.7);
    animation: arrive 500ms var(--ease-out) 1200ms both;
  }
  .tally li {
    position: relative;
    display: grid;
    gap: 2px;
    justify-items: center;
  }
  .tally .thumb {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: inset 0 0 0 2px var(--accent, var(--rarity-mortal));
  }
  .tally .rarity-hero {
    --accent: var(--rarity-hero);
  }
  .tally .rarity-demigod {
    --accent: var(--rarity-demigod);
  }
  .tally .rarity-god {
    --accent: var(--rarity-god);
  }
  .tally .rarity-primordial {
    --accent: var(--rarity-primordial);
  }
  .times {
    font-size: var(--text-sm);
    color: var(--parchment);
    font-variant-numeric: lining-nums tabular-nums;
  }
  .new {
    position: absolute;
    top: -6px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--gold);
    color: var(--ink);
    font-size: var(--text-xs);
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
  :global([data-motion='calm']) .haul-head,
  :global([data-motion='calm']) .tally,
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
