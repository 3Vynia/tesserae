<script lang="ts">
  import { CARDS, CARDS_BY_ID } from '../../data/cards';
  import { RARITIES } from '../../data/schema';
  import { CHAPTERS } from '../../data/stages';
  import { THEME_IDS, THEMES, type Theme } from '../../data/themes';
  import {
    deleteAlbum,
    removeFromAlbum,
    renameAlbum,
    SHOWCASE_MAX,
    toggleWish,
    WISHLIST_MAX,
  } from '../../engine/vault';
  import { fmtDate, fmtNumber, t } from '../../i18n/i18n.svelte';
  import { game } from '../save.svelte';
  import { router } from '../router.svelte';
  import { cardEpithet, cardName } from '../card-text';
  import CardView from '../../ui/card/Card.svelte';
  import CardArt from '../../ui/card/CardArt.svelte';
  import Icon from '../../ui/icons/Icon.svelte';
  import Sheet from '../../ui/game/Sheet.svelte';
  import Button from '../../ui/Button.svelte';

  type Tab = 'showcase' | 'stats' | 'albums' | 'wishlist';
  let tab = $state<Tab>('showcase');
  let editing = $state(false);
  let openAlbum = $state<string | null>(null);
  let renaming = $state('');

  const ready = $derived(game.status === 'ready');
  const save = $derived(ready ? game.save : null);
  const ownedCards = $derived(save ? CARDS.filter((c) => save.owned[c.id]) : []);
  const featured = $derived(
    save?.profile.featured ? CARDS_BY_ID.get(save.profile.featured) : ownedCards.at(-1),
  );
  const theme = $derived(THEMES[(save?.profile.theme ?? 'lapis') as Theme] ?? THEMES.lapis);
  const showcase = $derived(
    (save?.profile.showcase ?? []).map((id) => CARDS_BY_ID.get(id)).filter((c) => !!c),
  );
  const stages = CHAPTERS.flatMap((c) => c.stages).length;
  const stats = $derived(
    save
      ? [
          {
            id: 'lit',
            value: t('ui.collection.progress', { owned: ownedCards.length, total: CARDS.length }),
          },
          { id: 'summons', value: fmtNumber(save.pulls.total) },
          {
            id: 'copies',
            value: fmtNumber(Object.values(save.owned).reduce((n, o) => n + o.count, 0)),
          },
          { id: 'wins', value: fmtNumber(save.battle.wins) },
          {
            id: 'campaign',
            value: t('ui.profile.ofTotal', { done: save.battle.cleared.length, total: stages }),
          },
          { id: 'tower', value: fmtNumber(save.battle.tower) },
          { id: 'dissolved', value: fmtNumber(save.stats.dissolved) },
          { id: 'claimed', value: fmtNumber(save.stats.claimed) },
          { id: 'bought', value: fmtNumber(save.stats.bought) },
          { id: 'spins', value: fmtNumber(save.free.wheel.spins) },
          { id: 'since', value: fmtDate(save.createdAt, { dateStyle: 'medium' }) },
        ]
      : [],
  );
  const byRarity = $derived(
    RARITIES.map((r) => {
      const all = CARDS.filter((c) => c.rarity === r);
      return { rarity: r, owned: all.filter((c) => save?.owned[c.id]).length, total: all.length };
    }).reverse(),
  );
  const albums = $derived(save?.albums ?? []);
  const album = $derived(albums.find((a) => a.id === openAlbum));
  const wishes = $derived(
    (save?.wishlist ?? []).map((id) => CARDS_BY_ID.get(id)).filter((c) => !!c),
  );
  const keeper = $derived(save?.profile.name.trim() || t('ui.profile.defaultName'));
</script>

{#if save}
  <div class="profile" style:--ground={theme.ground} style:--deep={theme.deep}>
    <header class="banner">
      <svg
        class="stars"
        viewBox="0 0 400 120"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path d="M30 80 L80 40 L140 60 L200 24 L260 52 L330 30 L380 70" />
        {#each [[30, 80], [80, 40], [140, 60], [200, 24], [260, 52], [330, 30], [380, 70]] as [x, y], i (i)}
          <circle cx={x} cy={y} r={i % 2 ? 1 : 1.6} />
        {/each}
      </svg>
      <div class="medallion">
        {#if featured}<CardArt card={featured} />{/if}
      </div>
      <div class="who">
        <h1>{keeper}</h1>
        <p class="motto">{save.profile.motto || t('ui.profile.defaultMotto')}</p>
        <p class="since">
          {t('ui.profile.since', { date: fmtDate(save.createdAt, { dateStyle: 'long' }) })}
        </p>
      </div>
      <button type="button" class="edit" onclick={() => (editing = true)}>
        <Icon name="edit" size={18} />{t('ui.profile.edit')}
      </button>
    </header>

    <div class="summary">
      <ul class="rarity-bars" aria-label={t('ui.profile.byRarity')}>
        {#each byRarity as row (row.rarity)}
          <li style:--pip="var(--rarity-{row.rarity})">
            <span class="r-name">{t(`ui.rarity.${row.rarity}`)}</span>
            <span class="r-bar" aria-hidden="true">
              <span style:width="{row.total ? (row.owned / row.total) * 100 : 0}%"></span>
            </span>
            <span class="r-count">{row.owned}/{row.total}</span>
          </li>
        {/each}
      </ul>
      <dl class="headline">
        <div>
          <dt>{t('ui.profile.stats.summons')}</dt>
          <dd>{fmtNumber(save.pulls.total)}</dd>
        </div>
        <div>
          <dt>{t('ui.profile.stats.wins')}</dt>
          <dd>{fmtNumber(save.battle.wins)}</dd>
        </div>
        <div>
          <dt>{t('ui.profile.stats.lit')}</dt>
          <dd>{ownedCards.length}/{CARDS.length}</dd>
        </div>
      </dl>
    </div>

    <div class="tabs" role="tablist" aria-label={t('ui.profile.tabsLabel')}>
      {#each ['showcase', 'stats', 'albums', 'wishlist'] as const as id (id)}
        <button
          type="button"
          role="tab"
          id="ptab-{id}"
          aria-selected={tab === id}
          aria-controls="ppanel-{id}"
          onclick={() => {
            tab = id;
            openAlbum = null;
          }}
        >
          {t(`ui.profile.tabs.${id}`)}
          {#if id === 'albums'}<span class="n">{albums.length}/10</span>{/if}
          {#if id === 'wishlist'}<span class="n">{wishes.length}/{WISHLIST_MAX}</span>{/if}
        </button>
      {/each}
    </div>

    <div class="panel" role="tabpanel" id="ppanel-{tab}" aria-labelledby="ptab-{tab}">
      {#if tab === 'showcase'}
        <ol class="showcase">
          {#each { length: SHOWCASE_MAX } as _, i (i)}
            {@const card = showcase[i]}
            <li>
              {#if card}
                <a
                  href={router.href('collection', card.id)}
                  class="slot-card"
                  aria-label={cardName(card)}
                >
                  <CardView {card} interactive={false} look={save.owned[card.id]?.look} />
                </a>
              {:else}
                <a href={router.href('collection')} class="empty-slot">
                  <Icon name="plus" size={28} />
                  <span>{t('ui.profile.emptySlot')}</span>
                </a>
              {/if}
            </li>
          {/each}
        </ol>
        <p class="note">{t('ui.profile.showcaseHint', { max: SHOWCASE_MAX })}</p>
      {:else if tab === 'stats'}
        <dl class="stats">
          {#each stats as s (s.id)}
            <div>
              <dt>{t(`ui.profile.stats.${s.id}`)}</dt>
              <dd>{s.value}</dd>
            </div>
          {/each}
        </dl>
      {:else if tab === 'albums'}
        {#if album}
          <div class="album-head">
            <button type="button" class="back" onclick={() => (openAlbum = null)}>
              <Icon name="back" size={20} />{t('ui.profile.albums.back')}
            </button>
            <form
              class="rename"
              onsubmit={(e) => {
                e.preventDefault();
                game.update((s) => renameAlbum(s, album.id, renaming));
              }}
            >
              <label class="visually-hidden" for="album-name">{t('ui.profile.albums.name')}</label>
              <input id="album-name" maxlength="32" bind:value={renaming} />
              <Button variant="engraved" type="submit">{t('ui.profile.albums.rename')}</Button>
            </form>
            <Button
              variant="quiet"
              icon="trash"
              onclick={() => {
                game.update((s) => deleteAlbum(s, album.id));
                openAlbum = null;
              }}
            >
              {t('ui.profile.albums.delete')}
            </Button>
          </div>
          <ul class="grid">
            {#each album.cards as id (id)}
              {@const card = CARDS_BY_ID.get(id)}
              {#if card}
                <li class="mini rarity-{card.rarity}" class:have={!!save.owned[id]}>
                  <a href={router.href('collection', id)} class="mini-art"><CardArt {card} /></a>
                  <span class="mini-name">{save.owned[id] ? cardName(card) : '?'}</span>
                  <button
                    type="button"
                    class="mini-x"
                    aria-label={t('ui.profile.albums.remove', { name: cardName(card) })}
                    onclick={() => game.update((s) => removeFromAlbum(s, album.id, id))}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </li>
              {/if}
            {:else}
              <li class="note">{t('ui.profile.albums.emptyAlbum')}</li>
            {/each}
          </ul>
        {:else if albums.length === 0}
          <p class="note">{t('ui.profile.albums.none')}</p>
        {:else}
          <ul class="albums">
            {#each albums as a (a.id)}
              {@const cover = CARDS_BY_ID.get(a.cards[0] ?? '')}
              <li>
                <button
                  type="button"
                  class="album"
                  onclick={() => {
                    openAlbum = a.id;
                    renaming = a.name;
                  }}
                >
                  <span class="cover">
                    {#if cover}<CardArt card={cover} />{/if}
                  </span>
                  <span class="album-name">{a.name}</span>
                  <span class="note">{t('ui.vault.albumCount', { count: a.cards.length })}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      {:else}
        {#if wishes.length === 0}
          <p class="note">{t('ui.profile.wishlist.none')}</p>
        {:else}
          <ul class="grid">
            {#each wishes as card (card.id)}
              {@const have = !!save.owned[card.id]}
              <li class="mini rarity-{card.rarity}" class:have>
                <a href={router.href('collection', card.id)} class="mini-art"><CardArt {card} /></a>
                <span class="mini-name">{have ? cardName(card) : cardEpithet(card)}</span>
                {#if have}<span class="found caps">{t('ui.profile.wishlist.found')}</span>{/if}
                <button
                  type="button"
                  class="mini-x"
                  aria-label={t('ui.profile.wishlist.remove')}
                  onclick={() => game.update((s) => toggleWish(s, card.id))}
                >
                  <Icon name="close" size={14} />
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
    </div>
  </div>

  {#if editing}
    <Sheet title={t('ui.profile.edit')} onclose={() => (editing = false)}>
      <form
        class="edit-form"
        onsubmit={(e) => {
          e.preventDefault();
          editing = false;
        }}
      >
        <label for="p-name">{t('ui.profile.name')}</label>
        <input
          id="p-name"
          maxlength="24"
          value={save.profile.name}
          placeholder={t('ui.profile.defaultName')}
          oninput={(e) => game.update((s) => (s.profile.name = e.currentTarget.value))}
        />
        <label for="p-motto">{t('ui.profile.motto')}</label>
        <textarea
          id="p-motto"
          maxlength="140"
          rows="2"
          value={save.profile.motto}
          placeholder={t('ui.profile.defaultMotto')}
          oninput={(e) => game.update((s) => (s.profile.motto = e.currentTarget.value))}></textarea>
        <fieldset>
          <legend>{t('ui.profile.featured')}</legend>
          <div class="picks">
            {#each ownedCards as card (card.id)}
              <button
                type="button"
                class="pick"
                aria-pressed={featured?.id === card.id}
                aria-label={cardName(card)}
                title={cardName(card)}
                onclick={() => game.update((s) => (s.profile.featured = card.id))}
              >
                <CardArt {card} />
              </button>
            {/each}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t('ui.profile.theme')}</legend>
          <div class="themes">
            {#each THEME_IDS as id (id)}
              <button
                type="button"
                class="theme"
                aria-pressed={save.profile.theme === id}
                style:--ground={THEMES[id].ground}
                style:--deep={THEMES[id].deep}
                onclick={() => game.update((s) => (s.profile.theme = id))}
              >
                <span class="swatch" aria-hidden="true"></span>{t(`ui.profile.themes.${id}`)}
              </button>
            {/each}
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              checked={save.profile.everywhere}
              onchange={(e) => game.update((s) => (s.profile.everywhere = e.currentTarget.checked))}
            />
            {t('ui.profile.everywhere')}
          </label>
        </fieldset>
        <Button variant="gilt" type="submit">{t('ui.profile.done')}</Button>
      </form>
    </Sheet>
  {/if}
{/if}

<style>
  .profile {
    display: grid;
    gap: var(--space-5);
    max-width: 72rem;
    margin-inline: auto;
    padding: 0 var(--gutter) var(--space-7);
  }
  .banner {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: end;
    gap: var(--space-5);
    min-height: 13rem;
    padding: var(--space-6);
    border: 1px solid var(--rule-strong);
    border-radius: 14px;
    background:
      radial-gradient(
        120% 140% at 85% 0%,
        color-mix(in srgb, var(--ground) 90%, white 10%),
        transparent 55%
      ),
      linear-gradient(160deg, var(--ground), var(--deep));
    overflow: hidden;
    box-shadow:
      inset 0 1px 0 rgb(255 244 210 / 0.12),
      var(--shadow-3);
  }
  .stars {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.5;
  }
  .stars path {
    fill: none;
    stroke: var(--gold-pale);
    stroke-width: 0.6;
    stroke-dasharray: 2 3;
  }
  .stars circle {
    fill: var(--gold-pale);
  }
  .medallion {
    position: relative;
    width: 8.5rem;
    aspect-ratio: 1;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid var(--gold);
    box-shadow:
      0 0 0 6px rgb(7 10 20 / 0.6),
      var(--shadow-2);
  }
  .who {
    position: relative;
    display: grid;
    gap: var(--space-1);
  }
  h1 {
    font-size: var(--text-5xl);
    color: var(--gold-pale);
    line-height: 1;
  }
  .motto {
    font-style: italic;
    font-size: var(--text-lg);
    color: var(--parchment);
    max-width: 40ch;
  }
  .since {
    font-size: var(--text-sm);
    color: var(--parchment-dim);
  }
  .edit {
    position: relative;
    align-self: start;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0 var(--space-4);
    border: 1px solid var(--gold);
    border-radius: 999px;
    background: rgb(7 10 20 / 0.7);
    color: var(--gold-pale);
    font: inherit;
    cursor: pointer;
  }
  .summary {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    gap: var(--space-5);
    padding: var(--space-5);
    border: 1px solid var(--rule);
    border-radius: 12px;
    background: rgb(7 10 20 / 0.7);
  }
  .rarity-bars {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rarity-bars li {
    display: grid;
    grid-template-columns: 7rem 1fr 3rem;
    align-items: center;
    gap: var(--space-3);
  }
  .r-name {
    color: var(--parchment-dim);
  }
  .r-bar {
    height: 8px;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.06);
    overflow: hidden;
  }
  .r-bar span {
    display: block;
    height: 100%;
    background: var(--pip);
  }
  .r-count {
    text-align: end;
    font-variant-numeric: lining-nums tabular-nums;
    color: var(--parchment);
  }
  .headline {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-3);
    margin: 0;
    align-content: center;
    text-align: center;
  }
  .headline dt,
  .stats dt {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .headline dd {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-4xl);
    color: var(--gold-pale);
    font-variant-numeric: lining-nums;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    border-bottom: 1px solid var(--rule);
  }
  .tabs button {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-2);
    min-height: 48px;
    padding: 0 var(--space-4);
    border: 0;
    border-bottom: 2px solid transparent;
    background: none;
    color: var(--parchment-dim);
    font-family: var(--font-caps);
    font-size: var(--text-xl);
    letter-spacing: var(--tracking-caps);
    cursor: pointer;
  }
  .tabs button[aria-selected='true'] {
    border-bottom-color: var(--gold);
    color: var(--gold-pale);
  }
  .n {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--text-muted);
    font-variant-numeric: lining-nums;
  }
  .panel {
    display: grid;
    gap: var(--space-4);
  }
  .showcase {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .slot-card {
    display: block;
    transition: transform var(--dur-base) var(--ease-out);
  }
  .empty-slot {
    display: grid;
    place-items: center;
    align-content: center;
    gap: var(--space-2);
    aspect-ratio: 5 / 7;
    border: 1px dashed var(--rule-strong);
    border-radius: 8px;
    color: var(--text-muted);
    text-align: center;
    text-decoration: none;
    font-size: var(--text-sm);
    padding: var(--space-3);
  }
  @media (hover: hover) and (pointer: fine) {
    .slot-card:hover {
      transform: translateY(-6px);
    }
    .empty-slot:hover {
      border-color: var(--gold);
      color: var(--gold-pale);
    }
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
    gap: var(--space-3);
    margin: 0;
  }
  .stats div {
    padding: var(--space-4);
    border: 1px solid var(--rule);
    border-radius: 10px;
    background: rgb(7 10 20 / 0.7);
  }
  .stats dd {
    margin: var(--space-1) 0 0;
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    color: var(--parchment);
    font-variant-numeric: lining-nums;
  }
  .albums {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    gap: var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .album {
    display: grid;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-3);
    border: 1px solid var(--rule-strong);
    border-radius: 10px;
    background: rgb(7 10 20 / 0.8);
    color: var(--parchment);
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  .cover {
    position: relative;
    display: block;
    aspect-ratio: 4 / 3;
    border-radius: 6px;
    overflow: hidden;
    background: var(--vault);
  }
  .album-name {
    font-family: var(--font-display);
    font-size: var(--text-xl);
  }
  .album-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
  }
  .back {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule);
    border-radius: 999px;
    background: none;
    color: var(--gold-pale);
    font: inherit;
    cursor: pointer;
  }
  .rename {
    display: flex;
    flex: 1;
    gap: var(--space-2);
  }
  input,
  textarea {
    min-height: 44px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius-control);
    background: var(--ink);
    color: var(--parchment);
    font: inherit;
  }
  .rename input {
    flex: 1;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .mini {
    --accent: var(--rarity-mortal);
    position: relative;
    display: grid;
    gap: var(--space-1);
  }
  .mini.rarity-hero {
    --accent: var(--rarity-hero);
  }
  .mini.rarity-demigod {
    --accent: var(--rarity-demigod);
  }
  .mini.rarity-god {
    --accent: var(--rarity-god);
  }
  .mini.rarity-primordial {
    --accent: var(--rarity-primordial);
  }
  .mini-art {
    position: relative;
    display: block;
    aspect-ratio: 1;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .mini:not(.have) .mini-art {
    filter: grayscale(0.7) brightness(0.6);
  }
  .mini-name {
    font-size: var(--text-sm);
    color: var(--parchment-dim);
  }
  .found {
    position: absolute;
    top: 6px;
    left: 6px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--gold);
    color: var(--ink);
    font-size: var(--text-xs);
  }
  .mini-x {
    position: absolute;
    top: 4px;
    right: 4px;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--rule-strong);
    border-radius: 50%;
    background: rgb(7 10 20 / 0.85);
    color: var(--parchment);
    cursor: pointer;
  }
  .note {
    color: var(--text-muted);
    font-style: italic;
  }
  .edit-form {
    display: grid;
    gap: var(--space-2);
  }
  fieldset {
    display: grid;
    gap: var(--space-2);
    margin: var(--space-3) 0;
    padding: 0;
    border: 0;
  }
  legend {
    margin-bottom: var(--space-2);
    color: var(--gold);
  }
  .picks {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(3.5rem, 1fr));
    gap: var(--space-2);
  }
  .pick {
    position: relative;
    aspect-ratio: 1;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 50%;
    overflow: hidden;
    background: none;
    cursor: pointer;
  }
  .pick[aria-pressed='true'] {
    border-color: var(--gold-pale);
  }
  .themes {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .theme {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 40px;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule);
    border-radius: 999px;
    background: none;
    color: var(--parchment-dim);
    font: inherit;
    cursor: pointer;
  }
  .theme[aria-pressed='true'] {
    border-color: var(--gold-pale);
    color: var(--gold-pale);
  }
  .swatch {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--ground), var(--deep));
    box-shadow: inset 0 0 0 1px var(--gold);
  }
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    margin-top: var(--space-2);
    cursor: pointer;
  }
  .toggle input {
    min-height: 0;
    width: 18px;
    height: 18px;
    accent-color: var(--gold);
  }
  @media (max-width: 760px) {
    .banner {
      grid-template-columns: auto 1fr;
      padding: var(--space-4);
    }
    .medallion {
      width: 5.5rem;
    }
    .edit {
      grid-column: 1 / -1;
      justify-self: start;
    }
    .summary {
      grid-template-columns: 1fr;
    }
    .showcase {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
</style>
