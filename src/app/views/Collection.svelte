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
    emptyFilter,
    isFiltering,
    MARKS,
    matchingIds,
    sortCards,
    SORTS,
    toggle,
    type CollectionFilter,
    type Mark,
    type Show,
    type Sort,
    type Traits,
  } from '../collection-filter';
  import {
    addTag,
    addToAlbum,
    allTags,
    createAlbum,
    dissolve,
    dissolvePreview,
    isCustomized,
    setLocked,
    toggleWish,
  } from '../../engine/vault';
  import Sheet from '../../ui/game/Sheet.svelte';
  import CardArt from '../../ui/card/CardArt.svelte';
  import { fmtNumber } from '../../i18n/i18n.svelte';
  import Ornament from '../../ui/Ornament.svelte';
  import Tile from '../../ui/collection/Tile.svelte';
  import CardDetail from '../../ui/collection/CardDetail.svelte';
  import Icon from '../../ui/icons/Icon.svelte';
  import Button from '../../ui/Button.svelte';
  import NightSky from '../../ui/NightSky.svelte';
  import SceneTitle from '../../ui/game/SceneTitle.svelte';
  import { motion } from '../../ui/motion/motion.svelte';
  import { stepSpring, TILT_SPRING, type SpringState } from '../../ui/motion/spring';

  let filter = $state<CollectionFilter>(emptyFilter());
  let sort = $state<Sort>('pantheon');
  let view = $state<'mosaic' | 'list'>('mosaic');
  let selecting = $state(false);
  let picked = $state<string[]>([]);
  let bulk = $state<'tag' | 'album' | 'dissolve' | null>(null);
  let tagDraft = $state('');
  let albumDraft = $state('');
  let notice = $state('');
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
  const traits = (id: string): Traits => {
    const o = owned(id);
    const marks: Mark[] = [];
    if (o?.locked) marks.push('locked');
    if (o?.tags.length) marks.push('tagged');
    if (ready && game.save.wishlist.includes(id)) marks.push('wished');
    if (o && o.count > 1) marks.push('spare');
    if (o && isCustomized(o)) marks.push('custom');
    if (o && !o.seen) marks.push('unseen');
    return {
      marks: new Set(marks),
      tags: o?.tags ?? [],
      copies: o?.count ?? 0,
      firstAt: o?.firstAt ?? 0,
    };
  };
  const tags = $derived(ready ? allTags(game.save) : []);
  const albums = $derived(ready ? game.save.albums : []);
  const wished = (id: string) => ready && game.save.wishlist.includes(id);
  const matches = $derived(
    matchingIds(
      CARDS,
      (id) => !!owned(id),
      filter,
      (c) => [cardName(c), cardEpithet(c)],
      traits,
    ),
  );
  // Any order but by pantheon shows one flat grid of the matching cards.
  const flat = $derived(
    sort === 'pantheon' && view === 'mosaic'
      ? null
      : sortCards(
          CARDS.filter((c) => matches.has(c.id)),
          sort,
          traits,
          cardName,
        ),
  );
  const pickedOwned = $derived(picked.filter((id) => owned(id)));
  const preview = $derived(
    ready ? dissolvePreview(game.save, pickedOwned, CARDS_BY_ID) : { copies: 0, dust: 0 },
  );

  function pick(id: string): void {
    picked = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id];
  }
  function endSelect(): void {
    selecting = false;
    picked = [];
    bulk = null;
  }
  function act(change: Parameters<typeof game.update>[0], message: string): void {
    game.update(change);
    notice = message;
  }
  function wishPicked(s: Parameters<Parameters<typeof game.update>[0]>[0]): void {
    for (const id of picked) if (!s.owned[id] && !s.wishlist.includes(id)) toggleWish(s, id);
  }
  function runDissolve(): void {
    let got = { copies: 0, dust: 0 };
    game.update((s) => (got = dissolve(s, pickedOwned, CARDS_BY_ID)));
    notice = t('ui.vault.dissolved', got);
    bulk = null;
  }
  function runAlbum(id: string | null): void {
    let added = 0;
    let name = '';
    game.update((s) => {
      const target = id ?? createAlbum(s, albumDraft);
      if (!target) return;
      added = id ? addToAlbum(s, target, picked) : addToAlbum(s, target, picked);
      name = s.albums.find((a) => a.id === target)?.name ?? '';
    });
    if (name) notice = t('ui.vault.addedToAlbum', { count: added, name });
    albumDraft = '';
    bulk = null;
  }
  function runTag(): void {
    const tag = tagDraft.trim();
    if (!tag) return;
    act(
      (s) => addTag(s, pickedOwned, tag),
      t('ui.vault.tagged', { count: pickedOwned.length, tag }),
    );
    tagDraft = '';
    bulk = null;
  }
  const filtering = $derived(isFiltering(filter));
  const selected = $derived(router.param ? CARDS_BY_ID.get(router.param) : undefined);
  const list = $derived(new Intl.ListFormat(i18n.locale, { type: 'conjunction' }));

  function open(id: string): void {
    if (selecting) {
      pick(id);
      return;
    }
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

  <SceneTitle title={t('ui.collection.heading')}>
    {#if ready}{t('ui.collection.progress', { owned: ownedCount, total: CARDS.length })}{/if}
  </SceneTitle>

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

      <fieldset class="chips">
        <legend class="caps">{t('ui.vault.marks.legend')}</legend>
        {#each MARKS as mark (mark)}
          <button
            type="button"
            class="chip"
            aria-pressed={filter.marks.has(mark)}
            onclick={() => (filter.marks = toggle<Mark>(filter.marks, mark))}
          >
            {t(`ui.vault.marks.${mark}`)}
          </button>
        {/each}
        {#if tags.length}
          <label class="tag-pick">
            <span class="visually-hidden">{t('ui.vault.tagFilter')}</span>
            <select bind:value={filter.tag}>
              <option value={null}>{t('ui.vault.anyTag')}</option>
              {#each tags as tag (tag)}<option value={tag}>{tag}</option>{/each}
            </select>
          </label>
        {/if}
      </fieldset>

      <p class="matches" role="status" aria-live="polite">
        {#if filtering}
          {t('ui.collection.filters.matches', { count: matches.size })}
          <Button variant="quiet" onclick={() => (filter = emptyFilter())}>
            {t('ui.collection.filters.clear')}
          </Button>
        {/if}
      </p>
    </form>

    <div class="toolbar">
      <label class="sort">
        <Icon name="sort" size={18} />
        <span class="visually-hidden">{t('ui.vault.sort.label')}</span>
        <select bind:value={sort}>
          {#each SORTS as s (s)}<option value={s}>{t(`ui.vault.sort.${s}`)}</option>{/each}
        </select>
      </label>
      <div class="views" role="group" aria-label={t('ui.vault.view.label')}>
        <button
          type="button"
          aria-pressed={view === 'mosaic'}
          aria-label={t('ui.vault.view.mosaic')}
          onclick={() => (view = 'mosaic')}
        >
          <Icon name="grid" size={20} />
        </button>
        <button
          type="button"
          aria-pressed={view === 'list'}
          aria-label={t('ui.vault.view.list')}
          onclick={() => (view = 'list')}
        >
          <Icon name="list" size={20} />
        </button>
      </div>
      <button
        type="button"
        class="select-btn"
        aria-pressed={selecting}
        onclick={() => (selecting ? endSelect() : (selecting = true))}
      >
        <Icon name="select" size={20} />
        {selecting ? t('ui.vault.select.done') : t('ui.vault.select.start')}
      </button>
      <p class="notice" role="status">{notice}</p>
    </div>

    {#if view === 'list' && flat}
      <table class="ledger">
        <thead>
          <tr>
            <th scope="col"><span class="visually-hidden">{t('ui.vault.list.card')}</span></th>
            <th scope="col">{t('ui.vault.list.card')}</th>
            <th scope="col">{t('ui.collection.filters.rarity')}</th>
            <th scope="col" class="num">{t('ui.vault.list.copies')}</th>
            <th scope="col" class="num">{t('ui.vault.list.level')}</th>
            <th scope="col">{t('ui.vault.list.tags')}</th>
          </tr>
        </thead>
        <tbody>
          {#each flat as card (card.id)}
            {@const o = owned(card.id)}
            <tr
              class:missing={!o}
              class:picked={picked.includes(card.id)}
              style:--pip="var(--rarity-{card.rarity})"
            >
              <td class="thumb-cell">
                <span class="thumb" class:ghost={!o}><CardArt {card} /></span>
              </td>
              <th scope="row">
                <button
                  type="button"
                  class="row-open"
                  aria-pressed={selecting ? picked.includes(card.id) : undefined}
                  onclick={() => open(card.id)}
                >
                  <span class="row-name">{o ? cardName(card) : '?'}</span>
                  <span class="row-epithet">
                    {o ? cardEpithet(card) : t('ui.vault.list.unknown')}
                  </span>
                </button>
              </th>
              <td><i class="pip" aria-hidden="true"></i>{t(`ui.rarity.${card.rarity}`)}</td>
              <td class="num">{o ? fmtNumber(o.count) : '—'}</td>
              <td class="num">{o ? o.level : '—'}</td>
              <td class="row-tags">
                {#if o?.locked}<Icon name="lock" size={14} label={t('ui.vault.lockedShort')} />{/if}
                {#if wished(card.id)}<Icon
                    name="wish"
                    size={14}
                    label={t('ui.vault.wishedShort')}
                  />{/if}
                {(o?.tags ?? []).join(', ')}
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="empty">{t('ui.collection.filters.matches', { count: 0 })}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else if flat}
      <div class="flat">
        {#each flat as card (card.id)}
          <Tile
            {card}
            owned={owned(card.id)}
            dim={false}
            wished={wished(card.id)}
            {selecting}
            picked={picked.includes(card.id)}
            transitionName={flying === card.id && router.param !== card.id ? 'card-flight' : null}
            onopen={() => open(card.id)}
          />
        {:else}
          <p class="empty">{t('ui.collection.filters.matches', { count: 0 })}</p>
        {/each}
      </div>
    {/if}

    <div class="mosaic" bind:this={mosaic} hidden={!!flat}>
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
                wished={wished(card.id)}
                {selecting}
                picked={picked.includes(card.id)}
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

{#if selecting}
  <div class="bulk" role="toolbar" aria-label={t('ui.vault.select.bar')}>
    <p class="bulk-count">{t('ui.vault.select.count', { count: picked.length })}</p>
    <button
      type="button"
      onclick={() => (picked = (flat ?? CARDS.filter((c) => matches.has(c.id))).map((c) => c.id))}
    >
      <Icon name="select" size={18} />{t('ui.vault.select.all')}
    </button>
    <button
      type="button"
      disabled={!pickedOwned.length}
      onclick={() =>
        act(
          (s) => setLocked(s, pickedOwned, true),
          t('ui.vault.lockedMany', { count: pickedOwned.length }),
        )}
    >
      <Icon name="lock" size={18} />{t('ui.vault.lock')}
    </button>
    <button
      type="button"
      disabled={!pickedOwned.length}
      onclick={() =>
        act(
          (s) => setLocked(s, pickedOwned, false),
          t('ui.vault.unlockedMany', { count: pickedOwned.length }),
        )}
    >
      <Icon name="unlock" size={18} />{t('ui.vault.unlock')}
    </button>
    <button type="button" disabled={!pickedOwned.length} onclick={() => (bulk = 'tag')}>
      <Icon name="tag" size={18} />{t('ui.vault.tag')}
    </button>
    <button type="button" disabled={!picked.length} onclick={() => (bulk = 'album')}>
      <Icon name="album" size={18} />{t('ui.vault.album')}
    </button>
    <button
      type="button"
      disabled={!picked.length}
      onclick={() => act(wishPicked, t('ui.vault.wishedMany'))}
    >
      <Icon name="wish" size={18} />{t('ui.vault.wish')}
    </button>
    <button
      type="button"
      class="danger"
      disabled={!preview.copies}
      onclick={() => (bulk = 'dissolve')}
    >
      <Icon name="dissolve" size={18} />{t('ui.vault.dissolve')}
    </button>
  </div>
{/if}

{#if bulk === 'tag'}
  <Sheet
    title={t('ui.vault.tagSheet', { count: pickedOwned.length })}
    onclose={() => (bulk = null)}
  >
    <form
      class="sheet-form"
      onsubmit={(e) => {
        e.preventDefault();
        runTag();
      }}
    >
      <label for="tag-input">{t('ui.vault.tagLabel')}</label>
      <input id="tag-input" maxlength="24" bind:value={tagDraft} autocomplete="off" />
      {#if tags.length}
        <div class="tag-list">
          {#each tags as tag (tag)}
            <button type="button" class="chip" onclick={() => (tagDraft = tag)}>{tag}</button>
          {/each}
        </div>
      {/if}
      <Button variant="gilt" icon="tag" type="submit" disabled={!tagDraft.trim()}>
        {t('ui.vault.tagGo')}
      </Button>
    </form>
  </Sheet>
{:else if bulk === 'album'}
  <Sheet title={t('ui.vault.albumSheet', { count: picked.length })} onclose={() => (bulk = null)}>
    <div class="sheet-form">
      {#each albums as album (album.id)}
        <button type="button" class="album-row" onclick={() => runAlbum(album.id)}>
          <Icon name="album" size={20} />
          <span>{album.name}</span>
          <span class="note">{t('ui.vault.albumCount', { count: album.cards.length })}</span>
        </button>
      {/each}
      <form
        class="new-album"
        onsubmit={(e) => {
          e.preventDefault();
          if (albumDraft.trim()) runAlbum(null);
        }}
      >
        <label for="album-input">{t('ui.vault.newAlbum')}</label>
        <div class="inline">
          <input
            id="album-input"
            maxlength="32"
            bind:value={albumDraft}
            disabled={albums.length >= 10}
          />
          <Button
            variant="gilt"
            icon="plus"
            type="submit"
            disabled={!albumDraft.trim() || albums.length >= 10}
          >
            {t('ui.vault.createAlbum')}
          </Button>
        </div>
        {#if albums.length >= 10}<p class="note">{t('ui.vault.albumsFull')}</p>{/if}
      </form>
    </div>
  </Sheet>
{:else if bulk === 'dissolve'}
  <Sheet title={t('ui.vault.dissolveSheet')} onclose={() => (bulk = null)}>
    <div class="sheet-form">
      <p>{t('ui.vault.dissolveBody', preview)}</p>
      <p class="note">{t('ui.vault.dissolveKeep')}</p>
      <div class="inline">
        <Button variant="gilt" icon="dissolve" onclick={runDissolve}>
          {t('ui.vault.dissolveGo', { count: preview.copies })}
        </Button>
        <Button variant="quiet" onclick={() => (bulk = null)}>{t('ui.vault.keep')}</Button>
      </div>
    </div>
  </Sheet>
{/if}

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
    padding: var(--space-4) var(--gutter) var(--space-6);
    isolation: isolate;
  }
  .dust {
    position: absolute;
    inset: 0;
    z-index: -1;
    opacity: 0.8;
    pointer-events: none;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--space-4) var(--space-6);
    padding: var(--space-4) var(--space-5);
    margin-bottom: var(--space-7);
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius-control);
    background: rgb(7 10 20 / 0.85);
    box-shadow:
      inset 0 0 0 4px rgb(4 6 13 / 0.6),
      inset 0 0 0 5px rgb(212 173 85 / 0.15),
      var(--shadow-2);
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

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    max-width: 72rem;
    margin: 0 auto var(--space-5);
  }
  .sort {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-3);
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
    background: rgb(7 10 20 / 0.85);
    color: var(--gold);
  }
  select {
    min-height: 44px;
    border: 0;
    background: transparent;
    color: var(--parchment);
    font: inherit;
    cursor: pointer;
  }
  select option {
    background: var(--ink);
  }
  .views {
    display: inline-flex;
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
    overflow: hidden;
  }
  .views button,
  .select-btn {
    display: inline-grid;
    grid-auto-flow: column;
    place-items: center;
    gap: var(--space-2);
    min-width: 44px;
    min-height: 44px;
    padding: 0 var(--space-3);
    border: 0;
    background: rgb(7 10 20 / 0.85);
    color: var(--parchment-dim);
    font: inherit;
    cursor: pointer;
  }
  .views button[aria-pressed='true'],
  .select-btn[aria-pressed='true'] {
    background: var(--gold);
    color: var(--ink);
  }
  .select-btn {
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
  }
  .notice {
    flex: 1;
    min-width: 12rem;
    text-align: end;
    font-style: italic;
    color: var(--gold-pale);
  }
  .tag-pick select {
    padding: 0 var(--space-3);
    border: 1px solid var(--rule);
    border-radius: 999px;
    background: rgb(7 10 20 / 0.85);
  }
  .flat {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(clamp(5.5rem, 10vw, 8rem), 1fr));
    gap: var(--space-4);
    max-width: 72rem;
    margin-inline: auto;
  }
  .empty {
    grid-column: 1 / -1;
    padding: var(--space-6);
    text-align: center;
    font-style: italic;
    color: var(--text-muted);
  }
  .ledger {
    width: 100%;
    max-width: 72rem;
    margin-inline: auto;
    border-collapse: collapse;
    background: rgb(7 10 20 / 0.7);
    font-variant-numeric: lining-nums tabular-nums;
  }
  .ledger th,
  .ledger td {
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--rule);
    font-weight: 400;
    text-align: start;
    vertical-align: middle;
  }
  .ledger thead th {
    font-family: var(--font-caps);
    font-size: var(--text-sm);
    color: var(--gold);
  }
  .ledger .num {
    text-align: end;
  }
  .ledger tr.missing {
    color: var(--text-muted);
  }
  .ledger tr.picked {
    background: rgb(212 173 85 / 0.14);
  }
  .thumb-cell {
    width: 56px;
  }
  .thumb {
    position: relative;
    display: block;
    width: 44px;
    aspect-ratio: 1;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: inset 0 0 0 2px var(--pip);
  }
  .thumb.ghost {
    filter: grayscale(1) brightness(0.35);
  }
  .row-open {
    display: grid;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  .row-name {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--parchment);
  }
  .missing .row-name {
    color: var(--text-muted);
  }
  .row-epithet {
    font-size: var(--text-sm);
    font-style: italic;
    color: var(--text-muted);
  }
  .row-tags {
    font-size: var(--text-sm);
    color: var(--parchment-dim);
  }
  .row-tags :global(svg) {
    margin-inline-end: 4px;
    color: var(--gold);
    vertical-align: -2px;
  }
  .ledger .pip {
    display: inline-block;
    width: 0.55em;
    height: 0.55em;
    margin-inline-end: 0.55em;
    rotate: 45deg;
    background: var(--pip);
  }
  .bulk {
    position: fixed;
    z-index: var(--z-sticky);
    left: 50%;
    bottom: var(--space-4);
    translate: -50% 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: max-content;
    max-width: calc(100vw - 2rem);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--gold);
    border-radius: 14px;
    background: linear-gradient(180deg, rgb(16 28 62 / 0.98), rgb(7 10 20 / 0.98));
    box-shadow: var(--shadow-3);
    animation: bar-in var(--dur-sheet) var(--ease-sheet) both;
  }
  @keyframes bar-in {
    from {
      opacity: 0;
      translate: -50% 24px;
    }
  }
  .bulk-count {
    padding: 0 var(--space-2);
    color: var(--gold-pale);
    font-variant-numeric: lining-nums;
  }
  .bulk button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-height: 44px;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule);
    border-radius: 10px;
    background: transparent;
    color: var(--parchment);
    font: inherit;
    cursor: pointer;
    transition: transform var(--dur-press) var(--ease-out);
  }
  .bulk button:active:not(:disabled) {
    transform: scale(0.96);
  }
  .bulk button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .bulk .danger {
    border-color: var(--danger);
    color: var(--danger);
  }
  .sheet-form {
    display: grid;
    gap: var(--space-3);
  }
  .sheet-form input {
    min-height: 44px;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius-control);
    background: var(--ink);
    color: var(--parchment);
    font: inherit;
  }
  .inline {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .inline input {
    flex: 1;
  }
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .album-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-3);
    min-height: 52px;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule);
    border-radius: 10px;
    background: transparent;
    color: var(--parchment);
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  .new-album {
    display: grid;
    gap: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid var(--rule);
  }
  .note {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  @media (max-width: 899px) {
    .bulk {
      bottom: calc(6rem + env(safe-area-inset-bottom));
    }
  }
  @media (max-width: 620px) {
    .ledger th:nth-child(3),
    .ledger td:nth-child(3),
    .ledger th:nth-child(5),
    .ledger td:nth-child(5),
    .ledger th:nth-child(6),
    .ledger td:nth-child(6) {
      display: none;
    }
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
    .search,
    .search input {
      width: 100%;
    }
    .search {
      flex-basis: 100%;
    }
  }
</style>
