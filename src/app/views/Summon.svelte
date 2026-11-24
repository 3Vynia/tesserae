<script lang="ts">
  import { CARDS } from '../../data/cards';
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
  import { claim, dayKey, isClaimed, questProgress, questsFor, track } from '../../engine/quests';
  import { fmtDate, t } from '../../i18n/i18n.svelte';
  import { game } from '../save.svelte';
  import { arrivals } from '../arrivals.svelte';
  import { router } from '../router.svelte';
  import { cardName } from '../card-text';
  import { CARDS_BY_ID } from '../../data/cards';
  import Button from '../../ui/Button.svelte';
  import Icon from '../../ui/icons/Icon.svelte';
  import Ornament from '../../ui/Ornament.svelte';
  import Ceremony from '../../ui/summon/Ceremony.svelte';
  import { flyStarlight } from '../../ui/motion/flight';
  import { GLYPHS } from '../../ui/card/art';

  const now = Date.now();
  const [standing, ...others] = bannersFor(now, CARDS) as [Banner, ...Banner[]];
  const banners = [standing, ...others];
  const WEEK = 7 * 24 * 3600 * 1000;
  const daysLeft = Math.max(1, Math.ceil((WEEK - (now % WEEK)) / (24 * 3600 * 1000)));

  let bannerId = $state(standing.id);
  let ceremony = $state<{ results: PullResult[]; seed: string } | null>(null);
  const banner = $derived(banners.find((b) => b.id === bannerId) ?? standing);
  const ready = $derived(game.status === 'ready');
  const starlight = $derived(ready ? game.save.starlight : 0);
  const pity = $derived(
    ready ? pityStatus(game.save, banner.id) : { demigod: DEMIGOD_PITY, god: GOD_PITY },
  );
  const today = dayKey(now);
  const quests = $derived(ready ? questsFor(game.save, today) : []);
  const history = $derived(ready ? game.save.pulls.history.slice(0, 12) : []);

  const featuredCards = (b: Banner) =>
    b.featured
      ? CARDS.filter((c) => c.pantheon === b.featured && RARITIES.indexOf(c.rarity) >= 2)
      : CARDS.filter((c) => RARITIES.indexOf(c.rarity) >= 4);

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

  function claimQuest(id: string, from: EventTarget | null): void {
    let reward = 0;
    game.update((save) => (reward = claim(save, id, today)));
    if (reward && from instanceof Element) void flyStarlight(from, 'hud-starlight');
  }

  const missing = (count: number) => Math.max(0, PULL_COST * count - starlight);
</script>

<div class="summon">
  <header class="head">
    <h1>{t('ui.summon.heading')}</h1>
    <p class="intro">{t('ui.summon.intro')}</p>
  </header>

  <div class="layout">
    <section class="altar" aria-labelledby="banners-heading">
      <h2 id="banners-heading" class="visually-hidden">{t('ui.summon.banner.label')}</h2>
      <div class="banners" role="radiogroup" aria-labelledby="banners-heading">
        {#each banners as b (b.id)}
          {@const featured = featuredCards(b)}
          <label class="banner" class:selected={b.id === bannerId}>
            <input type="radio" name="banner" value={b.id} bind:group={bannerId} />
            {#if b.featured}
              <Ornament pantheon={b.featured} height={12} />
              <span class="banner-title">
                {t('ui.summon.banner.featured', { pantheon: t(`ui.pantheonInline.${b.featured}`) })}
              </span>
              <span class="banner-body">
                {t('ui.summon.banner.featuredBody', {
                  pantheon: t(`ui.pantheonInline.${b.featured}`),
                })}
              </span>
              <span class="glyphs" aria-hidden="true">
                {#each featured as c (c.id)}
                  <svg viewBox="0 0 64 64"><path d={GLYPHS[c.art.glyph] ?? ''} /></svg>
                {/each}
              </span>
              <span class="ends">{t('ui.summon.banner.ends', { days: daysLeft })}</span>
            {:else}
              <span class="banner-title">{t('ui.summon.banner.standing')}</span>
              <span class="banner-body">{t('ui.summon.banner.standingBody')}</span>
              <span class="glyphs" aria-hidden="true">
                {#each featured as c (c.id)}
                  <svg viewBox="0 0 64 64"><path d={GLYPHS[c.art.glyph] ?? ''} /></svg>
                {/each}
              </span>
            {/if}
          </label>
        {/each}
      </div>

      <div class="pull">
        <div class="buttons">
          {#each [1, 10] as count (count)}
            <div class="pull-option">
              <Button
                variant={count === 1 ? 'engraved' : 'gilt'}
                icon="summon"
                disabled={!ready || missing(count) > 0}
                onclick={() => summon(count)}
              >
                {count === 1 ? t('ui.summon.one') : t('ui.summon.ten')}
              </Button>
              <span class="cost">{t('ui.summon.cost', { cost: PULL_COST * count })}</span>
            </div>
          {/each}
        </div>
        {#if ready && missing(1) > 0}
          <p class="short" role="status">{t('ui.summon.short', { missing: missing(1) })}</p>
        {/if}
      </div>

      <div class="odds">
        <section aria-labelledby="rates-heading">
          <h3 id="rates-heading" class="caps">{t('ui.summon.rates.heading')}</h3>
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
        </section>

        <section aria-labelledby="pity-heading">
          <h3 id="pity-heading" class="caps">{t('ui.summon.pity.heading')}</h3>
          {#each [{ kind: 'demigod', left: pity.demigod, max: DEMIGOD_PITY }, { kind: 'god', left: pity.god, max: GOD_PITY }] as meter (meter.kind)}
            <div class="meter">
              <p>{t(`ui.summon.pity.${meter.kind}`, { count: meter.left })}</p>
              <span class="track" aria-hidden="true">
                <span class="fill" style:transform="scaleX({1 - meter.left / meter.max})"></span>
              </span>
            </div>
          {/each}
        </section>
      </div>
    </section>

    <aside class="side">
      <section aria-labelledby="quests-heading">
        <h2 id="quests-heading" class="side-title">
          <Icon name="quest" size={22} />{t('ui.summon.quests.heading')}
        </h2>
        <ul class="quests">
          {#each quests as quest (quest.id)}
            {@const done = ready ? questProgress(game.save, today, quest) : 0}
            {@const claimed = ready && isClaimed(game.save, today, quest)}
            <li class:complete={done >= quest.goal}>
              <p class="quest-title">{t(`ui.summon.quests.titles.${quest.id}`)}</p>
              <p class="quest-progress">
                {t('ui.summon.quests.progress', { done, goal: quest.goal })}
              </p>
              {#if claimed}
                <span class="claimed">{t('ui.summon.quests.claimed')}</span>
              {:else}
                <Button
                  variant="engraved"
                  icon="starlight"
                  disabled={done < quest.goal}
                  onclick={(e) => claimQuest(quest.id, e.currentTarget)}
                >
                  {t('ui.summon.quests.claim', { reward: quest.reward })}
                </Button>
              {/if}
            </li>
          {/each}
        </ul>
        <p class="note">{t('ui.summon.quests.resets')}</p>
      </section>

      <section aria-labelledby="history-heading">
        <h2 id="history-heading" class="side-title">
          <Icon name="history" size={22} />{t('ui.summon.history.heading')}
        </h2>
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
      </section>
    </aside>
  </div>
</div>

{#if ceremony}
  <Ceremony results={ceremony.results} seed={ceremony.seed} onclose={finish} />
{/if}

<style>
  .summon {
    padding: var(--space-8) var(--gutter) var(--space-9);
  }
  .head {
    display: grid;
    gap: var(--space-3);
    margin-bottom: var(--space-7);
  }
  h1 {
    font-size: var(--text-6xl);
  }
  .intro {
    color: var(--parchment-dim);
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(16rem, 4fr);
    gap: var(--space-8);
    align-items: start;
  }
  .banners {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
    gap: var(--space-4);
  }
  .banner {
    position: relative;
    display: grid;
    gap: var(--space-2);
    align-content: start;
    padding: var(--space-5);
    min-height: 13rem;
    border: 1px solid var(--rule);
    border-radius: var(--radius-sheet) var(--radius-sheet) 50% 50% / var(--radius-sheet)
      var(--radius-sheet) 14% 14%;
    background:
      radial-gradient(circle at 50% 0, rgb(43 63 134 / 0.5), transparent 70%), var(--vault);
    cursor: pointer;
    transition:
      border-color var(--dur-quick) ease,
      transform var(--dur-press) var(--ease-out);
  }
  .banner:active {
    transform: scale(0.98);
  }
  .banner.selected {
    border-color: var(--gold);
    box-shadow: var(--bevel), var(--shadow-2);
  }
  .banner:has(input:focus-visible) {
    outline: 2px solid var(--focus);
    outline-offset: 3px;
  }
  .banner input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .banner-title {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    color: var(--gold-pale);
    line-height: var(--leading-tight);
  }
  .banner-body {
    color: var(--parchment-dim);
    font-size: var(--text-md);
  }
  .glyphs {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }
  .glyphs svg {
    width: 34px;
    height: 34px;
    fill: none;
    stroke: var(--gold);
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .ends {
    font-size: var(--text-sm);
    font-style: italic;
    color: var(--text-muted);
  }
  .pull {
    margin: var(--space-6) 0;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-5);
  }
  .pull-option {
    display: grid;
    gap: var(--space-1);
    justify-items: start;
  }
  .cost {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .short {
    margin-top: var(--space-3);
    color: var(--gold-pale);
    font-style: italic;
  }
  .odds {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
    gap: var(--space-6);
    padding-top: var(--space-5);
    border-top: 1px solid var(--rule);
  }
  h3 {
    font-size: var(--text-lg);
    font-weight: 400;
    color: var(--gold);
    margin-bottom: var(--space-3);
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
    color: var(--parchment);
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
  .meter {
    display: grid;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }
  .track {
    display: block;
    height: 4px;
    background: var(--lapis);
    border-radius: 2px;
    overflow: hidden;
  }
  .fill {
    display: block;
    height: 100%;
    background: var(--gold);
    transform-origin: left;
    transition: transform var(--dur-sheet) var(--ease-out);
  }
  .side {
    display: grid;
    gap: var(--space-7);
  }
  .side-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-2xl);
    margin-bottom: var(--space-4);
  }
  .side-title :global(.icon) {
    color: var(--gold);
  }
  .quests,
  .history {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .quests li {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-1) var(--space-3);
    align-items: center;
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--rule);
  }
  .quests li :global(.btn),
  .claimed {
    grid-row: span 2;
    grid-column: 2;
  }
  .quest-title {
    color: var(--parchment);
  }
  .quest-progress {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .complete .quest-progress {
    color: var(--success);
  }
  .claimed {
    font-style: italic;
    color: var(--text-muted);
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
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
