<script lang="ts">
  import { CARDS, CARDS_BY_ID } from '../../data/cards';
  import { RARITIES, type Rarity } from '../../data/schema';
  import {
    bannersFor,
    cardChance,
    DEMIGOD_PITY,
    GOD_PITY,
    GOLDEN_EVERY,
    historyBatches,
    MAX_PULLS,
    pityStatus,
    pull,
    PULL_COST,
    RATES,
    summonGolden,
    toggleFavorite,
    type Banner,
    type PullResult,
  } from '../../engine/gacha';
  import { tally } from '../tally';
  import Offerings from '../../ui/summon/Offerings.svelte';
  import { dayKey, track } from '../../engine/quests';
  import { fmtDate, fmtNumber, t } from '../../i18n/i18n.svelte';
  import { game } from '../save.svelte';
  import { arrivals } from '../arrivals.svelte';
  import { router } from '../router.svelte';
  import { cardName } from '../card-text';
  import { bannerCards } from '../banners';
  import Icon from '../../ui/icons/Icon.svelte';
  import Ceremony from '../../ui/summon/Ceremony.svelte';
  import BannerArt from '../../ui/summon/BannerArt.svelte';
  import Sheet from '../../ui/game/Sheet.svelte';
  import CardArt from '../../ui/card/CardArt.svelte';
  import CardViewer from '../../ui/summon/CardViewer.svelte';
  import { RARITIES as ORDER } from '../../data/schema';

  const now = Date.now();
  const [standing, ...others] = bannersFor(now, CARDS) as [Banner, ...Banner[]];
  // The weekly banner leads, like a featured event.
  const banners = [...others, standing];

  let bannerId = $state(banners[0]?.id ?? standing.id);
  let ceremony = $state<{ results: PullResult[]; seed: string; replay?: boolean } | null>(null);
  let sheet = $state<'details' | 'history' | 'amount' | null>(null);
  let custom = $state(50);
  let oddsQuery = $state('');
  let openBatch = $state<number | null>(null);
  let onlyStarred = $state(false);
  let notice = $state('');
  let viewing = $state<number | null>(null);
  // The viewer browses the banner's featured cards first, then the rest of its pool.
  const pool = $derived.by(() => {
    const lead = bannerCards(banner);
    const rest = CARDS.filter(
      (c) => !lead.includes(c) && (!banner.featured || c.pantheon === banner.featured),
    ).sort((a, b) => ORDER.indexOf(b.rarity) - ORDER.indexOf(a.rarity));
    return [...lead, ...rest];
  });
  const banner = $derived(banners.find((b) => b.id === bannerId) ?? standing);
  const ready = $derived(game.status === 'ready');
  const starlight = $derived(ready ? game.save.starlight : 0);
  const pity = $derived(
    ready ? pityStatus(game.save, banner.id) : { demigod: DEMIGOD_PITY, god: GOD_PITY },
  );
  const rawPity = $derived(
    (ready ? game.save.pulls.pity[banner.id] : undefined) ?? { demigod: 0, god: 0 },
  );
  const golden = $derived(ready ? game.save.wallet.golden : 0);
  const meter = $derived(ready ? game.save.pulls.meter : 0);
  const batches = $derived(ready ? historyBatches(game.save) : []);
  const starred = $derived(ready ? game.save.pulls.favorites : []);
  const wishes = $derived(
    (onlyStarred ? batches.filter((b) => starred.includes(b.batch)) : batches).slice(0, 60),
  );
  const odds = $derived.by(() => {
    const q = oddsQuery.trim().toLocaleLowerCase();
    return CARDS.filter((c) => !q || cardName(c).toLocaleLowerCase().includes(q))
      .map((c) => ({ card: c, chance: cardChance(c.id, banner, rawPity, CARDS) }))
      .sort((a, b) => b.chance - a.chance);
  });
  const today = dayKey(now);
  // The largest affordable amount, for the "as many as I can" shortcut.
  const affordable = $derived(Math.min(MAX_PULLS, Math.floor(starlight / PULL_COST)));

  function summon(count: number): void {
    let outcome: ReturnType<typeof pull> | undefined;
    game.update((save) => {
      outcome = pull(save, banner, count, CARDS, Date.now());
      if (outcome && 'results' in outcome) track(save, 'summon', today, count);
    });
    if (outcome && 'results' in outcome) {
      sheet = null;
      notice = outcome.golden ? t('ui.summon.golden.earned', { count: outcome.golden }) : '';
      ceremony = { results: outcome.results, seed: `${game.save.seed}:${game.save.pulls.total}` };
    }
  }

  function summonWithGolden(): void {
    let outcome: ReturnType<typeof summonGolden> | undefined;
    game.update((save) => (outcome = summonGolden(save, banner, CARDS, Date.now())));
    if (outcome && 'results' in outcome) {
      ceremony = { results: outcome.results, seed: `${game.save.seed}:golden:${outcome.batch}` };
    }
  }

  function replay(batch: (typeof batches)[number]): void {
    sheet = null;
    ceremony = {
      replay: true,
      seed: `${game.save.seed}:replay:${batch.batch}`,
      results: batch.cards.map((c) => ({
        card: c.card,
        rarity: c.rarity as Rarity,
        isNew: false,
      })),
    };
  }

  const wishTitle = (b: (typeof batches)[number]) => {
    const only = b.cards.length === 1 ? CARDS_BY_ID.get(b.cards[0]?.card ?? '') : undefined;
    return only ? cardName(only) : t('ui.summon.history.wish', { count: b.cards.length });
  };
  const grouped = (b: (typeof batches)[number]) => tally(b.cards);
  const oneIn = (p: number) => (p > 0 ? Math.round(1 / p) : 0);
  const batchTop = (b: (typeof batches)[number]) =>
    b.cards.reduce(
      (best, c) =>
        ORDER.indexOf(c.rarity as Rarity) > ORDER.indexOf(best) ? (c.rarity as Rarity) : best,
      'mortal' as Rarity,
    );

  function finish(action: 'vault' | 'stay'): void {
    const results = ceremony?.results ?? [];
    ceremony = null;
    if (action === 'vault') {
      arrivals.set([...new Set(results.map((r) => r.card))]);
      location.hash = router.href('collection');
    }
  }

  const missing = (count: number) => Math.max(0, PULL_COST * count - starlight);
  const customCount = $derived(
    Math.max(1, Math.min(MAX_PULLS, Math.floor(Number.isFinite(custom) ? custom : 1))),
  );
  const tabTitle = (b: Banner) =>
    b.featured
      ? t('ui.summon.banner.featured', { pantheon: t(`ui.pantheonInline.${b.featured}`) })
      : t('ui.summon.banner.standing');
</script>

<div class="altar">
  <h1 class="visually-hidden">{t('ui.summon.heading')}</h1>

  <div class="tabs" role="tablist" aria-label={t('ui.summon.banner.label')}>
    {#each banners as b (b.id)}
      {@const lead = bannerCards(b)[0]}
      <button
        type="button"
        role="tab"
        class="tab"
        aria-selected={b.id === bannerId}
        aria-controls="banner-panel"
        onclick={() => (bannerId = b.id)}
      >
        <span class="thumb">
          {#if lead}<CardArt card={lead} />{/if}
        </span>
        <span class="tab-title">{tabTitle(b)}</span>
        {#if b.featured}<span class="tag caps">{t('ui.summon.banner.seal')}</span>{/if}
      </button>
    {/each}
  </div>
  {#if ready}<div class="free-slot"><Offerings /></div>{/if}

  <div class="stage" id="banner-panel" role="tabpanel" aria-label={tabTitle(banner)}>
    {#key banner.id}
      <div class="banner-swap"><BannerArt {banner} oncard={(i) => (viewing = i)} /></div>
    {/key}

    <div class="console">
      <div class="info-buttons">
        <button type="button" class="pill" onclick={() => (sheet = 'details')}>
          <Icon name="info" size={18} />{t('ui.summon.details')}
        </button>
        <button type="button" class="pill" onclick={() => (sheet = 'history')}>
          <Icon name="history" size={18} />{t('ui.summon.history.heading')}
        </button>
      </div>

      <div class="counters">
        <p class="pity">
          <span class="pity-num">{pity.god}</span>
          <span>{t('ui.summon.pity.godShort', { count: pity.god })}</span>
        </p>
        <div class="meter" title={t('ui.summon.golden.meterHint', { every: GOLDEN_EVERY })}>
          <p class="meter-text">
            <Icon name="golden" size={16} />
            {t('ui.summon.golden.next', { count: GOLDEN_EVERY - meter })}
          </p>
          <span class="bar" aria-hidden="true">
            <span style:width="{(meter / GOLDEN_EVERY) * 100}%"></span>
          </span>
        </div>
      </div>

      <div class="pulls">
        {#each [1, 10] as count (count)}
          <button
            type="button"
            class="pull-btn"
            class:ten={count === 10}
            disabled={!ready || missing(count) > 0}
            onclick={() => summon(count)}
          >
            <span class="pull-label caps">
              {count === 1 ? t('ui.summon.one') : t('ui.summon.ten')}
            </span>
            <span class="pull-cost">
              <Icon name="starlight" size={16} />{fmtNumber(PULL_COST * count)}
            </span>
          </button>
        {/each}
      </div>
    </div>

    <div class="more-pulls">
      {#each [100, 1000] as count (count)}
        <button
          type="button"
          class="chip"
          disabled={!ready || missing(count) > 0}
          onclick={() => summon(count)}
        >
          <span class="chip-x">×{fmtNumber(count)}</span>
          <span class="chip-cost">
            <Icon name="starlight" size={14} />{fmtNumber(PULL_COST * count)}
          </span>
        </button>
      {/each}
      <button
        type="button"
        class="chip"
        disabled={!ready || affordable < 1}
        onclick={() => (sheet = 'amount')}
      >
        <span class="chip-x">{t('ui.summon.other')}</span>
        <span class="chip-cost">{t('ui.summon.upTo', { count: affordable })}</span>
      </button>
      <button
        type="button"
        class="chip golden"
        disabled={!ready || golden < 1}
        onclick={summonWithGolden}
      >
        <span class="chip-x"><Icon name="golden" size={16} />{t('ui.summon.golden.use')}</span>
        <span class="chip-cost">{t('ui.summon.golden.have', { count: golden })}</span>
      </button>
    </div>
    <p class="short" role="status">
      {notice || (ready && missing(1) > 0 ? t('ui.summon.short', { missing: missing(1) }) : '')}
    </p>
  </div>
</div>

{#if sheet === 'details'}
  <Sheet title={t('ui.summon.details')} onclose={() => (sheet = null)}>
    <h3 class="sheet-h caps">{t('ui.summon.rates.heading')}</h3>
    <table class="rates">
      <tbody>
        {#each RARITIES as rarity (rarity)}
          <tr>
            <th scope="row" style:--pip="var(--rarity-{rarity})">
              <i class="pip" aria-hidden="true"></i>{t(`ui.rarity.${rarity}`)}
            </th>
            <td>{t('ui.summon.rates.value', { rate: RATES[rarity as Rarity] })}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="note">{t('ui.summon.rates.note')}</p>
    <h3 class="sheet-h caps">{t('ui.summon.pity.heading')}</h3>
    <p>{t('ui.summon.pity.demigod', { count: pity.demigod })}</p>
    <p>{t('ui.summon.pity.god', { count: pity.god })}</p>
    {#if banner.featured}
      <h3 class="sheet-h caps">{t('ui.summon.banner.seal')}</h3>
      <p>
        {t('ui.summon.banner.featuredBody', {
          pantheon: t(`ui.pantheonInline.${banner.featured}`),
        })}
      </p>
    {/if}
    <h3 class="sheet-h caps">{t('ui.summon.golden.heading')}</h3>
    <p>{t('ui.summon.golden.body', { every: GOLDEN_EVERY })}</p>
    <h3 class="sheet-h caps">{t('ui.summon.odds.heading')}</h3>
    <p class="note">{t('ui.summon.odds.note')}</p>
    <label class="search">
      <Icon name="search" size={18} />
      <span class="visually-hidden">{t('ui.summon.odds.search')}</span>
      <input type="search" bind:value={oddsQuery} placeholder={t('ui.summon.odds.search')} />
    </label>
    <table class="rates odds">
      <tbody>
        {#each odds as row (row.card.id)}
          <tr>
            <th scope="row" style:--pip="var(--rarity-{row.card.rarity})">
              <i class="pip" aria-hidden="true"></i>{cardName(row.card)}
            </th>
            <td>{t('ui.summon.rates.value', { rate: row.chance })}</td>
            <td class="one-in">{t('ui.summon.odds.oneIn', { n: oneIn(row.chance) })}</td>
          </tr>
        {:else}
          <tr><td colspan="3" class="note">{t('ui.summon.odds.none')}</td></tr>
        {/each}
      </tbody>
    </table>
  </Sheet>
{:else if sheet === 'amount'}
  <Sheet title={t('ui.summon.amount.heading')} onclose={() => (sheet = null)}>
    <form
      class="amount"
      onsubmit={(e) => {
        e.preventDefault();
        if (missing(customCount) === 0) summon(customCount);
      }}
    >
      <label for="amount-input">{t('ui.summon.amount.label', { max: affordable })}</label>
      <div class="amount-row">
        <input
          id="amount-input"
          type="number"
          inputmode="numeric"
          min="1"
          max={Math.max(1, affordable)}
          bind:value={custom}
        />
        <button type="button" class="pill" onclick={() => (custom = Math.max(1, affordable))}>
          {t('ui.summon.amount.max')}
        </button>
      </div>
      <input
        type="range"
        min="1"
        max={Math.max(1, affordable)}
        bind:value={custom}
        aria-label={t('ui.summon.amount.slider')}
      />
      <p class="amount-cost">
        <Icon name="starlight" size={18} />
        {t('ui.summon.amount.cost', { cost: PULL_COST * customCount })}
      </p>
      <button type="submit" class="pull-btn ten" disabled={missing(customCount) > 0}>
        <span class="pull-label caps">{t('ui.summon.amount.go', { count: customCount })}</span>
      </button>
    </form>
  </Sheet>
{:else if sheet === 'history'}
  <Sheet title={t('ui.summon.history.heading')} onclose={() => (sheet = null)}>
    <div class="history-tools">
      <label class="toggle">
        <input type="checkbox" bind:checked={onlyStarred} />
        {t('ui.summon.history.onlyStarred')}
      </label>
      <span class="note">{t('ui.summon.history.kept')}</span>
    </div>
    {#if wishes.length === 0}
      <p class="note">
        {onlyStarred ? t('ui.summon.history.noStarred') : t('ui.summon.history.empty')}
      </p>
    {:else}
      <ol class="wishes">
        {#each wishes as wish (wish.batch + ':' + wish.at)}
          {@const top = batchTop(wish)}
          {@const isStarred = starred.includes(wish.batch)}
          <li class="wish" style:--pip="var(--rarity-{top})">
            <div class="wish-row">
              <button
                type="button"
                class="star"
                class:on={isStarred}
                aria-pressed={isStarred}
                aria-label={t('ui.summon.history.star')}
                onclick={() => game.update((save) => toggleFavorite(save, wish.batch))}
              >
                <Icon name="star" size={20} />
              </button>
              <button
                type="button"
                class="wish-open"
                aria-expanded={openBatch === wish.batch}
                onclick={() => (openBatch = openBatch === wish.batch ? null : wish.batch)}
              >
                <i class="pip" aria-hidden="true"></i>
                <span class="wish-title">
                  {wishTitle(wish)}
                </span>
                <span class="when">
                  {fmtDate(wish.at, { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <Icon name="chevron" size={18} />
              </button>
              <button
                type="button"
                class="replay"
                aria-label={t('ui.summon.history.replay')}
                onclick={() => replay(wish)}
              >
                <Icon name="replay" size={20} />
              </button>
            </div>
            {#if openBatch === wish.batch}
              <ul class="wish-cards">
                {#each grouped(wish) as row (row.card)}
                  {@const card = CARDS_BY_ID.get(row.card)}
                  <li style:--pip="var(--rarity-{row.rarity})">
                    <i class="pip" aria-hidden="true"></i>{card ? cardName(card) : row.card}
                    {#if row.count > 1}<span class="times">×{fmtNumber(row.count)}</span>{/if}
                  </li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ol>
    {/if}
  </Sheet>
{/if}

{#if viewing !== null}
  <CardViewer
    cards={pool}
    start={viewing}
    title={tabTitle(banner)}
    onclose={() => (viewing = null)}
  />
{/if}

{#if ceremony}
  <Ceremony results={ceremony.results} seed={ceremony.seed} onclose={finish} />
{/if}

<style>
  .altar {
    display: grid;
    grid-template-columns: minmax(15rem, 18rem) minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    grid-template-areas: 'tabs stage' 'free stage';
    align-items: start;
    gap: var(--space-5);
    max-width: 82rem;
    margin-inline: auto;
    padding: var(--space-2) var(--gutter) var(--space-6);
  }
  .tabs {
    display: grid;
    gap: var(--space-3);
    align-content: start;
  }
  .tab {
    position: relative;
    display: grid;
    grid-template-columns: 56px 1fr;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2);
    border: 1px solid var(--rule);
    border-radius: 12px;
    background: rgb(7 10 20 / 0.85);
    color: var(--parchment-dim);
    text-align: start;
    cursor: pointer;
    transition:
      border-color var(--dur-quick) ease,
      transform var(--dur-press) var(--ease-out),
      translate var(--dur-base) var(--ease-out);
  }
  .tab:active {
    transform: scale(0.97);
  }
  .tab[aria-selected='true'] {
    border-color: var(--gold);
    color: var(--gold-pale);
    translate: 6px 0;
    background: linear-gradient(90deg, rgb(43 63 134 / 0.6), rgb(7 10 20 / 0.9));
  }
  .thumb {
    position: relative;
    width: 56px;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: inset 0 0 0 2px var(--gold);
  }
  .tab-title {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    line-height: 1.15;
  }
  .tag {
    position: absolute;
    top: -8px;
    right: 8px;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--gold);
    color: var(--ink);
    font-size: var(--text-xs);
  }
  .stage {
    display: grid;
    gap: var(--space-4);
  }
  .banner-swap {
    animation: swap 420ms var(--ease-out) both;
  }
  @keyframes swap {
    from {
      opacity: 0;
      transform: translateX(18px);
    }
  }
  .console {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-4);
  }
  .info-buttons {
    display: flex;
    gap: var(--space-2);
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0 var(--space-4);
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
    background: rgb(7 10 20 / 0.85);
    color: var(--gold-pale);
    font-family: var(--font-body);
    font-size: var(--text-md);
    cursor: pointer;
    transition: transform var(--dur-press) var(--ease-out);
  }
  .pill:active {
    transform: scale(0.96);
  }
  .pity {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    justify-self: center;
    color: var(--parchment-dim);
    font-size: var(--text-md);
  }
  .pity-num {
    display: grid;
    place-items: center;
    width: 2.6rem;
    height: 2.6rem;
    border: 2px solid var(--gold);
    border-radius: 50%;
    font-family: var(--font-display);
    font-size: var(--text-xl);
    color: var(--gold-pale);
    font-variant-numeric: lining-nums;
  }
  .pulls {
    display: flex;
    gap: var(--space-3);
  }
  .pull-btn {
    display: grid;
    justify-items: center;
    gap: 2px;
    min-width: 11rem;
    padding: var(--space-3) var(--space-5);
    border: 1px solid var(--gold);
    border-radius: 12px;
    background: linear-gradient(180deg, #1d2c63, #0e1834);
    color: var(--gold-pale);
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgb(255 244 210 / 0.25),
      var(--shadow-2);
    transition:
      transform var(--dur-press) var(--ease-out),
      filter var(--dur-quick) ease;
  }
  .pull-btn.ten {
    background: linear-gradient(180deg, var(--gold-pale), var(--gold) 55%, #b98f3e);
    color: var(--ink);
    border-color: var(--gold-pale);
  }
  .pull-btn:active:not(:disabled) {
    transform: scale(0.96);
  }
  .pull-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .pull-label {
    font-size: var(--text-xl);
    letter-spacing: 0.06em;
  }
  .pull-cost {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-md);
    font-variant-numeric: lining-nums;
  }
  @media (hover: hover) and (pointer: fine) {
    .pull-btn:hover:not(:disabled) {
      filter: brightness(1.12);
    }
    .tab:not([aria-selected='true']):hover {
      border-color: var(--rule-strong);
    }
  }
  .short {
    justify-self: end;
    font-style: italic;
    color: var(--gold-pale);
  }
  .sheet-h {
    margin: var(--space-5) 0 var(--space-2);
    font-size: var(--text-lg);
    font-weight: 400;
    color: var(--gold);
  }
  .sheet-h:first-child {
    margin-top: 0;
  }
  .rates {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: lining-nums tabular-nums;
  }
  .rates th,
  .rates td {
    padding: var(--space-1) 0;
    border-bottom: 1px solid var(--rule);
    font-weight: 400;
    text-align: start;
  }
  .rates td {
    text-align: end;
  }
  .pip {
    display: inline-block;
    width: 0.55em;
    height: 0.55em;
    margin-inline-end: 0.55em;
    rotate: 45deg;
    background: var(--pip);
  }
  .note {
    margin-top: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .tabs {
    grid-area: tabs;
  }
  .stage {
    grid-area: stage;
  }
  .free-slot {
    grid-area: free;
  }
  .counters {
    display: grid;
    justify-items: center;
    gap: var(--space-2);
  }
  .meter {
    display: grid;
    gap: 4px;
    width: min(16rem, 100%);
  }
  .meter-text {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    font-size: var(--text-sm);
    color: var(--parchment-dim);
    font-variant-numeric: lining-nums;
  }
  .meter-text :global(svg) {
    color: var(--gold);
  }
  .bar {
    height: 6px;
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
    background: rgb(7 10 20 / 0.85);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--gold-deep), var(--gold-pale));
    transition: width var(--dur-sheet) var(--ease-out);
  }
  .more-pulls {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-2);
  }
  .chip {
    display: grid;
    justify-items: center;
    min-width: 7.5rem;
    min-height: 48px;
    padding: var(--space-1) var(--space-3);
    border: 1px solid var(--rule-strong);
    border-radius: 10px;
    background: rgb(7 10 20 / 0.88);
    color: var(--gold-pale);
    font-family: var(--font-body);
    cursor: pointer;
    transition:
      transform var(--dur-press) var(--ease-out),
      border-color var(--dur-quick) ease;
  }
  .chip:active:not(:disabled) {
    transform: scale(0.96);
  }
  .chip:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .chip.golden {
    border-color: var(--gold);
    background: linear-gradient(180deg, rgb(138 111 51 / 0.45), rgb(7 10 20 / 0.9));
  }
  .chip-x {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-display);
    font-size: var(--text-lg);
  }
  .chip-cost {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: var(--text-xs);
    color: var(--parchment-dim);
    font-variant-numeric: lining-nums;
  }
  @media (hover: hover) and (pointer: fine) {
    .chip:hover:not(:disabled) {
      border-color: var(--gold-pale);
    }
  }
  .search {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: var(--space-2) 0;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
    color: var(--gold);
  }
  .search input {
    flex: 1;
    min-height: 40px;
    border: 0;
    background: transparent;
    color: var(--parchment);
    font: inherit;
  }
  .search input:focus {
    outline: none;
  }
  .search:focus-within {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }
  .odds td {
    padding-inline-start: var(--space-3);
  }
  .one-in {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
  .amount {
    display: grid;
    gap: var(--space-3);
  }
  .amount-row {
    display: flex;
    gap: var(--space-2);
  }
  .amount-row input {
    flex: 1;
    min-height: 48px;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius-control);
    background: var(--ink);
    color: var(--parchment);
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-variant-numeric: lining-nums;
  }
  .amount input[type='range'] {
    accent-color: var(--gold);
  }
  .amount-cost {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--gold-pale);
    font-variant-numeric: lining-nums;
  }
  .history-tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    cursor: pointer;
  }
  .toggle input {
    accent-color: var(--gold);
    width: 18px;
    height: 18px;
  }
  .wishes {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .wish {
    border-bottom: 1px solid var(--rule);
  }
  .wish-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-1);
  }
  .star,
  .replay {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
  }
  .star.on {
    color: var(--gold);
  }
  .star.on :global(svg) {
    fill: var(--gold);
  }
  .replay {
    color: var(--gold-pale);
  }
  .wish-open {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--parchment);
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  .wish-open[aria-expanded='true'] :global(svg) {
    rotate: 180deg;
  }
  .times {
    margin-inline-start: 4px;
    color: var(--gold-pale);
    font-variant-numeric: lining-nums;
  }
  .wish-cards {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-3);
    margin: 0 0 var(--space-3);
    padding: 0 0 0 3rem;
    list-style: none;
    font-size: var(--text-sm);
    color: var(--parchment-dim);
  }
  .when {
    font-size: var(--text-sm);
    color: var(--text-muted);
    font-variant-numeric: lining-nums;
  }
  @media (max-width: 900px) {
    .altar {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: none;
      grid-template-areas: 'tabs' 'stage' 'free';
    }
    .tabs {
      grid-auto-flow: column;
      grid-auto-columns: minmax(12rem, 1fr);
      overflow-x: auto;
      padding-top: 10px;
    }
    .tab[aria-selected='true'] {
      translate: 0 -4px;
    }
    .console {
      grid-template-columns: 1fr;
      justify-items: center;
    }
  }
  @media (max-width: 520px) {
    .more-pulls {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .pulls {
      width: 100%;
    }
    .pull-btn {
      min-width: 0;
      flex: 1;
      padding-inline: var(--space-3);
    }
  }
  :global([data-motion='calm']) .banner-swap {
    animation-name: fade;
    animation-duration: var(--dur-base);
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
