<script lang="ts">
  import { CARDS, CARDS_BY_ID } from '../../data/cards';
  import { RARITIES, type Rarity } from '../../data/schema';
  import {
    bannersFor,
    DEMIGOD_PITY,
    GOD_PITY,
    pityStatus,
    pull,
    PULL_COST,
    RATES,
    type Banner,
    type PullResult,
  } from '../../engine/gacha';
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
  let ceremony = $state<{ results: PullResult[]; seed: string } | null>(null);
  let sheet = $state<'details' | 'history' | null>(null);
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
  const history = $derived(ready ? game.save.pulls.history.slice(0, 40) : []);
  const today = dayKey(now);

  function summon(count: number): void {
    let outcome: ReturnType<typeof pull> | undefined;
    game.update((save) => {
      outcome = pull(save, banner, count, CARDS, Date.now());
      if (outcome && 'results' in outcome) track(save, 'summon', today, count);
    });
    if (outcome && 'results' in outcome) {
      ceremony = { results: outcome.results, seed: `${game.save.seed}:${game.save.pulls.total}` };
    }
  }

  function finish(action: 'vault' | 'stay'): void {
    const results = ceremony?.results ?? [];
    ceremony = null;
    if (action === 'vault') {
      arrivals.set([...new Set(results.map((r) => r.card))]);
      location.hash = router.href('collection');
    }
  }

  const missing = (count: number) => Math.max(0, PULL_COST * count - starlight);
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

      <p class="pity">
        <span class="pity-num">{pity.god}</span>
        <span>{t('ui.summon.pity.godShort', { count: pity.god })}</span>
      </p>

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
    {#if ready && missing(1) > 0}
      <p class="short" role="status">{t('ui.summon.short', { missing: missing(1) })}</p>
    {/if}
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
  </Sheet>
{:else if sheet === 'history'}
  <Sheet title={t('ui.summon.history.heading')} onclose={() => (sheet = null)}>
    {#if history.length === 0}
      <p class="note">{t('ui.summon.history.empty')}</p>
    {:else}
      <ol class="history">
        {#each history as entry, i (i)}
          {@const card = CARDS_BY_ID.get(entry.card)}
          <li style:--pip="var(--rarity-{entry.rarity})">
            <i class="pip" aria-hidden="true"></i>
            <span>{card ? cardName(card) : entry.card}</span>
            <span class="when">
              {fmtDate(entry.at, { dateStyle: 'short', timeStyle: 'short' })}
            </span>
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
    grid-template-columns: minmax(12rem, 15rem) minmax(0, 1fr);
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
  .history {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .history li {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    padding: var(--space-1) 0;
    border-bottom: 1px solid var(--rule);
  }
  .when {
    font-size: var(--text-sm);
    color: var(--text-muted);
    font-variant-numeric: lining-nums;
  }
  @media (max-width: 900px) {
    .altar {
      grid-template-columns: 1fr;
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
