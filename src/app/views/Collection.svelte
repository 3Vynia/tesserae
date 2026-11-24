<script lang="ts">
  import { flushSync, onMount, tick } from 'svelte';
  import { CARDS, CARDS_BY_ID } from '../../data/cards';
  import { PANTHEONS, type Pantheon } from '../../data/pantheons';
  import { ELEMENTS, RARITIES, type Element, type Rarity } from '../../data/schema';
  import { markSeen } from '../../engine/save';
  import { dayKey, track } from '../../engine/quests';
  import { arrivals } from '../arrivals.svelte';
  import { createRng } from '../../engine/rng';
  import { i18n, t } from '../../i18n/i18n.svelte';
  import { game } from '../save.svelte';
  import { router } from '../router.svelte';
  import { cardEpithet, cardName } from '../card-text';
  import {
    EMPTY_FILTER,
    isFiltering,
    matchingIds,
    toggle,
    type CollectionFilter,
    type Show,
  } from '../collection-filter';
  import Ornament from '../../ui/Ornament.svelte';
  import Tile from '../../ui/collection/Tile.svelte';
  import CardDetail from '../../ui/collection/CardDetail.svelte';
  import Icon from '../../ui/icons/Icon.svelte';
  import Button from '../../ui/Button.svelte';
  import NightSky from '../../ui/NightSky.svelte';
  import { motion } from '../../ui/motion/motion.svelte';
  import { stepSpring, TILT_SPRING, type SpringState } from '../../ui/motion/spring';

  let filter = $state<CollectionFilter>({
    ...EMPTY_FILTER,
    rarities: new Set(),
    elements: new Set(),
  });
  let flying = $state<string | null>(null);
  let mosaic = $state<HTMLDivElement>();
  let dust = $state<HTMLDivElement>();
  let threads = $state<
    Record<
      string,
      { d: string; length: number; w: number; h: number; nodes: { x: number; y: number }[] }
    >
  >({});

  const ready = $derived(game.status === 'ready');
  const owned = (id: string) => (ready ? game.save.owned[id] : undefined);
  const groups = $derived(
    PANTHEONS.map((p) => ({ pantheon: p, cards: CARDS.filter((c) => c.pantheon === p) })).filter(
      (g) => g.cards.length > 0,
    ),
  );
  const unwritten = $derived(PANTHEONS.filter((p) => !CARDS.some((c) => c.pantheon === p)));
  const ownedCount = $derived(ready ? CARDS.filter((c) => game.save.owned[c.id]).length : 0);
  const matches = $derived(
    matchingIds(
      CARDS,
      (id) => !!owned(id),
      filter,
      (c) => [cardName(c), cardEpithet(c)],
    ),
  );
  const filtering = $derived(isFiltering(filter));
  const selected = $derived(router.param ? CARDS_BY_ID.get(router.param) : undefined);
  const list = $derived(new Intl.ListFormat(i18n.locale, { type: 'conjunction' }));

  function open(id: string): void {
    game.update((s) => track(s, 'open-card', dayKey(Date.now())));
    flushSync(() => (flying = id));
    location.hash = router.href('collection', id);
  }
  function close(): void {
    if (selected) {
      const id = selected.id;
      if (owned(id) && !owned(id)?.seen) game.update((s) => markSeen(s, id));
    }
    location.hash = router.href('collection');
  }

  let arrived: string[] = [];

  /**
   * Radial wave: lit tiles ignite outward from the top-left corner of the mosaic, or from the
   * first card that just arrived from a summon, which also ripples into place.
   */
  function wave(): void {
    if (!mosaic) return;
    const first = arrived[0]
      ? mosaic.querySelector<HTMLElement>(`[data-card="${arrived[0]}"]`)
      : null;
    const origin = (first ?? mosaic).getBoundingClientRect();
    for (const id of arrived) {
      mosaic.querySelector<HTMLElement>(`[data-card="${id}"]`)?.classList.add('arrive');
    }
    const rng = createRng('wave');
    const tiles = mosaic.querySelectorAll<HTMLElement>('.tile.lit');
    const size = tiles[0]?.getBoundingClientRect().width || 96;
    for (const tile of tiles) {
      const r = tile.getBoundingClientRect();
      const dist = Math.hypot(r.left - origin.left, r.top - origin.top) / size;
      const delay = Math.min(600, dist * 18 * 4) + rng.next() * 25;
      tile.style.setProperty('--delay', `${Math.round(delay)}ms`);
    }
  }

  /** Gold threads in the grout joining the lit tiles of each pantheon. */
  function measureThreads(): void {
    if (!mosaic) return;
    const next: typeof threads = {};
    for (const grid of mosaic.querySelectorAll<HTMLElement>('.tiles')) {
      const box = grid.getBoundingClientRect();
      const points = [...grid.querySelectorAll<HTMLElement>('.tile.lit')].map((el) => {
        const r = el.getBoundingClientRect();
        return [r.right - box.left - r.width * 0.16, r.top - box.top + r.height * 0.16] as const;
      });
      if (points.length < 2) continue;
      let length = 0;
      const d = points
        .map(([x, y], i) => {
          const prev = points[i - 1];
          if (prev) length += Math.hypot(x - prev[0], y - prev[1]);
          return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ');
      next[grid.dataset['pantheon'] ?? ''] = {
        d,
        length: Math.ceil(length),
        w: box.width,
        h: box.height,
        nodes: points.map(([x, y]) => ({ x, y })),
      };
    }
    threads = next;
  }

  onMount(() => {
    arrived = arrivals.take();
    if (game.status === 'ready') game.update((s) => track(s, 'visit-vault', dayKey(Date.now())));
    let observer: ResizeObserver | undefined;
    let raf = 0;
    void tick().then(() => {
      wave();
      measureThreads();
      observer = new ResizeObserver(() => measureThreads());
      if (mosaic) observer.observe(mosaic);
    });

    // Subtle parallax of the gold dust behind the mosaic.
    let target = { x: 0, y: 0 };
    let sx: SpringState = { value: 0, velocity: 0 };
    let sy: SpringState = { value: 0, velocity: 0 };
    let last = performance.now();
    const frame = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      sx = stepSpring(sx, target.x, dt, TILT_SPRING);
      sy = stepSpring(sy, target.y, dt, TILT_SPRING);
      if (dust)
        dust.style.translate = `${(sx.value * 14).toFixed(2)}px ${(sy.value * 10).toFixed(2)}px`;
      raf = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      if (motion.calm) return;
      target = { x: e.clientX / innerWidth - 0.5, y: e.clientY / innerHeight - 0.5 };
    };
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      addEventListener('pointermove', onMove, { passive: true });
      raf = requestAnimationFrame(frame);
    }
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
    };
  });

  // Re-measure once the save arrives and tiles light up.
  $effect(() => {
    if (ready)
      void tick().then(() => {
        wave();
        measureThreads();
      });
  });
</script>

<div class="collection">
  <div class="dust" bind:this={dust} aria-hidden="true">
    <NightSky seed="vault-dust" stars={70} fixed={false} constellations={false} />
  </div>

  <header class="head">
    <h1>{t('ui.collection.heading')}</h1>
    {#if ready}
      <p class="progress">
        {t('ui.collection.progress', { owned: ownedCount, total: CARDS.length })}
      </p>
    {/if}
    <p class="intro">{t('ui.collection.intro')}</p>
  </header>

  {#if game.status === 'loading'}
    <p class="state" role="status">{t('ui.collection.loading')}</p>
  {:else if game.status === 'error'}
    <div class="state error" role="alert">
      <h2>{t('ui.collection.errorTitle')}</h2>
      <p>{t('ui.collection.errorBody', { message: game.error ?? '' })}</p>
      <Button variant="engraved" onclick={() => game.load()}>{t('ui.collection.retry')}</Button>
    </div>
  {:else}
    <form
      class="filters"
      aria-label={t('ui.collection.filters.label')}
      onsubmit={(e) => e.preventDefault()}
    >
      <label class="search">
        <Icon name="filter" size={20} />
        <span class="visually-hidden">{t('ui.collection.filters.search')}</span>
        <input
          type="search"
          placeholder={t('ui.collection.filters.search')}
          bind:value={filter.query}
          autocomplete="off"
        />
      </label>

      <fieldset class="chips">
        <legend class="caps">{t('ui.collection.filters.rarity')}</legend>
        {#each RARITIES as rarity (rarity)}
          <button
            type="button"
            class="chip"
            style:--pip="var(--rarity-{rarity})"
            aria-pressed={filter.rarities.has(rarity)}
            onclick={() => (filter.rarities = toggle<Rarity>(filter.rarities, rarity))}
          >
            <i class="pip" aria-hidden="true"></i>{t(`ui.rarity.${rarity}`)}
          </button>
        {/each}
      </fieldset>

      <fieldset class="chips">
        <legend class="caps">{t('ui.collection.filters.element')}</legend>
        {#each ELEMENTS as element (element)}
          <button
            type="button"
            class="chip"
            aria-pressed={filter.elements.has(element)}
            onclick={() => (filter.elements = toggle<Element>(filter.elements, element))}
          >
            {t(`ui.element.${element}`)}
          </button>
        {/each}
      </fieldset>

      <fieldset class="chips">
        <legend class="caps">{t('ui.collection.filters.show')}</legend>
        {#each ['all', 'owned', 'missing'] as const as show (show)}
          <button
            type="button"
            class="chip"
            aria-pressed={filter.show === show}
            onclick={() => (filter.show = show as Show)}
          >
            {t(`ui.collection.filters.${show}`)}
          </button>
        {/each}
      </fieldset>

      <p class="matches" role="status" aria-live="polite">
        {#if filtering}
          {t('ui.collection.filters.matches', { count: matches.size })}
          <Button
            variant="quiet"
            onclick={() => (filter = { ...EMPTY_FILTER, rarities: new Set(), elements: new Set() })}
          >
            {t('ui.collection.filters.clear')}
          </Button>
        {/if}
      </p>
    </form>

    <div class="mosaic" bind:this={mosaic}>
      {#each groups as { pantheon, cards } (pantheon)}
        {@const lit = cards.filter((c) => owned(c.id)).length}
        <section class="group" aria-labelledby="g-{pantheon}">
          <div class="group-head">
            <h2 id="g-{pantheon}" class="caps">{t(`ui.pantheon.${pantheon}`)}</h2>
            <span class="count">
              {t('ui.collection.group', { owned: lit, total: cards.length })}
            </span>
            <span class="band"><Ornament pantheon={pantheon as Pantheon} height={12} /></span>
          </div>
          <div class="tiles" data-pantheon={pantheon}>
            {#if threads[pantheon]}
              {@const th = threads[pantheon]}
              <svg class="threads" width={th.w} height={th.h} aria-hidden="true">
                <path d={th.d} style:--len={th.length} />
                {#each th.nodes as n, i (i)}
                  <path
                    class="node"
                    style:--i={i}
                    d="M{n.x} {n.y - 5}l1.3 3.7 3.7 1.3-3.7 1.3-1.3 3.7-1.3-3.7-3.7-1.3 3.7-1.3z"
                  />
                {/each}
              </svg>
            {/if}
            {#each cards as card (card.id)}
              <Tile
                {card}
                owned={owned(card.id)}
                dim={filtering && !matches.has(card.id)}
                transitionName={flying === card.id && router.param !== card.id
                  ? 'card-flight'
                  : null}
                onopen={() => open(card.id)}
              />
            {/each}
          </div>
        </section>
      {/each}
    </div>

    {#if unwritten.length}
      <p class="unwritten">
        {t('ui.collection.unwritten', {
          list: list.format(unwritten.map((p) => t(`ui.pantheon.${p}`))),
        })}
      </p>
    {/if}
  {/if}
</div>

{#if selected && ready}
  {#key selected.id}
    <CardDetail
      card={selected}
      owned={owned(selected.id)}
      transitionName="card-flight"
      onclose={close}
      onflip={() => game.update((s) => track(s, 'read-myth', dayKey(Date.now())))}
    />
  {/key}
{/if}

<style>
  .collection {
    position: relative;
    padding: var(--space-8) var(--gutter) var(--space-9);
    isolation: isolate;
  }
  .dust {
    position: absolute;
    inset: 0;
    z-index: -1;
    opacity: 0.8;
    pointer-events: none;
  }
  .head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: var(--space-2) var(--space-6);
    margin-bottom: var(--space-6);
  }
  h1 {
    font-size: var(--text-6xl);
  }
  .progress {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    color: var(--gold);
    text-align: end;
  }
  .intro {
    grid-column: 1 / -1;
    color: var(--parchment-dim);
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--space-4) var(--space-6);
    padding: var(--space-4) 0;
    border-block: 1px solid var(--rule);
    margin-bottom: var(--space-7);
  }
  .search {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius-control);
    background: var(--vault);
    color: var(--gold);
  }
  .search:focus-within {
    border-color: var(--gold);
  }
  .search input {
    width: 12rem;
    min-height: 42px;
    border: 0;
    background: none;
    color: var(--parchment);
    font-family: var(--font-body);
    font-size: var(--text-lg);
  }
  .search input:focus {
    outline: none;
  }
  .search input::placeholder {
    color: var(--text-muted);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .chips legend {
    padding: 0;
    margin-bottom: var(--space-1);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .chip {
    min-height: 36px;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule);
    border-radius: var(--radius-control);
    background: transparent;
    color: var(--parchment-dim);
    font-family: var(--font-body);
    font-size: var(--text-md);
    cursor: pointer;
    transition:
      background-color var(--dur-quick) ease,
      border-color var(--dur-quick) ease,
      color var(--dur-quick) ease,
      transform var(--dur-press) var(--ease-out);
  }
  .pip {
    display: inline-block;
    width: 0.5em;
    height: 0.5em;
    margin-inline-end: 0.45em;
    rotate: 45deg;
    background: var(--pip);
    vertical-align: 0.1em;
  }
  .chip:active {
    transform: scale(0.96);
  }
  .chip[aria-pressed='true'] {
    background: var(--lapis);
    border-color: var(--gold);
    color: var(--gold-pale);
  }
  @media (hover: hover) and (pointer: fine) {
    .chip:hover {
      border-color: var(--rule-strong);
      color: var(--parchment);
    }
  }
  .matches {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    flex-basis: 100%;
    color: var(--gold-pale);
    font-style: italic;
  }
  .matches:empty {
    display: none;
  }

  .mosaic {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
    gap: var(--space-7) var(--space-6);
  }
  .group-head {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: baseline;
    gap: var(--space-1) var(--space-3);
    margin-bottom: var(--space-3);
  }
  .group-head h2 {
    font-size: var(--text-xl);
    color: var(--parchment);
  }
  .count {
    justify-self: end;
    font-size: var(--text-sm);
    color: var(--text-muted);
    font-variant-numeric: lining-nums;
  }
  .band {
    grid-column: 1 / -1;
  }
  .tiles {
    position: relative;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
    gap: 6px;
  }
  .threads {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    overflow: visible;
  }
  .threads path:not(.node) {
    fill: none;
    stroke: var(--gold);
    stroke-width: 1.5;
    stroke-linejoin: round;
    stroke-dasharray: var(--len);
    stroke-dashoffset: var(--len);
    animation: draw var(--dur-ceremony) var(--ease-in-out) 500ms forwards;
    stroke-width: 1;
    opacity: 0.8;
  }
  .threads .node {
    fill: var(--gold-pale);
    opacity: 0;
    animation: twinkle-in 500ms var(--ease-out) forwards;
    animation-delay: calc(500ms + var(--i) * 120ms);
  }
  @keyframes twinkle-in {
    from {
      opacity: 0;
      scale: 0.4;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }
  .threads .node {
    transform-box: fill-box;
    transform-origin: center;
  }
  :global([data-motion='calm']) .threads .node {
    animation-name: fade;
    opacity: 1;
  }
  :global([data-motion='calm']) .threads path:not(.node) {
    stroke-dashoffset: 0;
    animation: fade var(--dur-base) ease both;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  .unwritten {
    margin-top: var(--space-8);
    font-style: italic;
    color: var(--text-muted);
  }
  .state {
    padding: var(--space-8) 0;
    color: var(--parchment-dim);
    font-style: italic;
  }
  .state.error {
    display: grid;
    gap: var(--space-3);
    justify-items: start;
    font-style: normal;
  }
  .state.error h2 {
    font-size: var(--text-3xl);
  }
  @media (max-width: 620px) {
    .head {
      grid-template-columns: 1fr;
    }
    .progress {
      text-align: start;
    }
    .search,
    .search input {
      width: 100%;
    }
    .search {
      flex-basis: 100%;
    }
  }
</style>
