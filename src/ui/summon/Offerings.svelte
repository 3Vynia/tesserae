<script lang="ts">
  import { fmtNumber, t } from '../../i18n/i18n.svelte';
  import { game } from '../../app/save.svelte';
  import { clock, untilParts } from '../../app/clock.svelte';
  import {
    claimOffering,
    claimTribute,
    OFFERING_MAX,
    OFFERING_REWARD,
    offerings,
    TRIBUTE,
    tribute,
  } from '../../engine/rewards';
  import Icon from '../icons/Icon.svelte';

  // The altar's free gifts: votive offerings that refill over time, and the daily tribute.
  let { compact = false }: { compact?: boolean } = $props();

  const stock = $derived(offerings(game.save, clock.now));
  const daily = $derived(tribute(game.save, clock.now));
  let said = $state('');
  let lit = $state<number | null>(null);

  const wait = (at: number) => {
    const { h, m, s } = untilParts(at, clock.now);
    return h > 0 ? t('ui.time.hm', { h, m }) : t('ui.time.ms', { m, s });
  };

  function takeOffering(): void {
    let got = 0;
    game.update((save) => (got = claimOffering(save, Date.now())));
    if (got) {
      lit = stock.charges;
      said = t('ui.free.offeringTaken', { amount: got });
    }
  }

  function takeTribute(): void {
    let gift: ReturnType<typeof claimTribute> = null;
    game.update((save) => (gift = claimTribute(save, Date.now())));
    if (gift) {
      const g = gift as (typeof TRIBUTE)[number];
      said = g.golden
        ? t('ui.free.tributeGolden', { amount: g.starlight })
        : t('ui.free.tributeTaken', { amount: g.starlight });
    }
  }
</script>

<section class="free" class:compact aria-labelledby="free-h">
  <h2 id="free-h" class="caps">{t('ui.free.heading')}</h2>

  <div class="row">
    <div class="votives" aria-hidden="true">
      {#each { length: OFFERING_MAX } as _, i (i)}
        <span class="votive" class:full={i < stock.charges} class:spent={lit === i}>
          <Icon name="offering" size={22} />
        </span>
      {/each}
    </div>
    <div class="what">
      <p class="title">{t('ui.free.offerings')}</p>
      <p class="note">
        {stock.nextAt === null
          ? t('ui.free.offeringsFull')
          : t('ui.free.offeringsNext', { time: wait(stock.nextAt) })}
      </p>
    </div>
    <button type="button" class="claim" disabled={stock.charges < 1} onclick={takeOffering}>
      <Icon name="starlight" size={16} />+{fmtNumber(OFFERING_REWARD)}
      <span class="visually-hidden">
        {t('ui.free.offeringClaim', { count: stock.charges })}
      </span>
    </button>
  </div>

  <div class="row tribute">
    <ol class="days" aria-label={t('ui.free.streak')}>
      {#each TRIBUTE as gift, i (i)}
        <li
          class:done={daily.claimed ? i <= daily.day : i < daily.day}
          class:today={i === daily.day}
          class:golden={gift.golden > 0}
        >
          <span aria-hidden="true">
            {#if gift.golden}<Icon name="golden" size={14} />{:else}{i + 1}{/if}
          </span>
          <span class="visually-hidden">
            {t('ui.free.dayGift', { day: i + 1, amount: gift.starlight, golden: gift.golden })}
          </span>
        </li>
      {/each}
    </ol>
    <div class="what">
      <p class="title">{t('ui.free.tribute')}</p>
      <p class="note">
        {daily.claimed
          ? t('ui.free.tributeDone')
          : t('ui.free.tributeDay', { day: daily.day + 1, total: TRIBUTE.length })}
      </p>
    </div>
    <button type="button" class="claim" disabled={daily.claimed} onclick={takeTribute}>
      <Icon name="gift" size={16} />
      {daily.claimed ? t('ui.free.claimed') : t('ui.free.claim')}
    </button>
  </div>

  <p class="said" role="status">{said}</p>
</section>

<style>
  .free {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-4);
    border: 1px solid var(--rule-strong);
    border-radius: 12px;
    background:
      radial-gradient(120% 80% at 0% 0%, rgb(176 96 63 / 0.18), transparent 60%),
      linear-gradient(180deg, rgb(16 28 62 / 0.92), rgb(7 10 20 / 0.94));
    box-shadow: inset 0 1px 0 rgb(255 244 210 / 0.1);
  }
  h2 {
    font-size: var(--text-lg);
    font-weight: 400;
    letter-spacing: 0.08em;
    color: var(--gold);
  }
  .row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-3);
  }
  /* the pips or the streak on top, then what it is and the button */
  .row {
    grid-template-columns: 1fr auto;
    grid-template-areas: 'show show' 'what claim';
    row-gap: var(--space-2);
  }
  .tribute {
    padding-top: var(--space-3);
    border-top: 1px solid var(--rule);
  }
  .votives,
  .days {
    grid-area: show;
  }
  .what {
    grid-area: what;
  }
  .claim {
    grid-area: claim;
  }
  .votives {
    display: flex;
    gap: 2px;
  }
  .votive {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    color: var(--vellum);
    opacity: 0.45;
    transition:
      opacity var(--dur-base) ease,
      color var(--dur-base) ease;
  }
  .votive.full {
    opacity: 1;
    color: var(--gold-pale);
    background: radial-gradient(circle at 50% 30%, rgb(242 200 121 / 0.35), transparent 70%);
  }
  .votive.spent {
    animation: spend 600ms var(--ease-out);
  }
  @keyframes spend {
    40% {
      scale: 1.35;
      color: #fff6dc;
    }
  }
  .title {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--parchment);
    line-height: 1.2;
  }
  .note {
    font-size: var(--text-sm);
    color: var(--text-muted);
    font-variant-numeric: lining-nums tabular-nums;
  }
  .claim {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 40px;
    padding: 0 var(--space-3);
    border: 1px solid var(--gold-pale);
    border-radius: 999px;
    background: linear-gradient(180deg, var(--gold-pale), var(--gold) 60%, #b98f3e);
    color: var(--ink);
    font-family: var(--font-body);
    font-size: var(--text-md);
    font-variant-numeric: lining-nums;
    cursor: pointer;
    transition: transform var(--dur-press) var(--ease-out);
  }
  .claim:active:not(:disabled) {
    transform: scale(0.95);
  }
  .claim:disabled {
    border-color: var(--rule);
    background: transparent;
    color: var(--text-muted);
    cursor: default;
  }
  .days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .days li {
    display: grid;
    place-items: center;
    height: 28px;
    border: 1px solid var(--rule);
    border-radius: 4px;
    color: var(--text-muted);
    font-size: var(--text-sm);
    font-variant-numeric: lining-nums;
  }
  .days li.golden {
    color: var(--gold);
  }
  .days li.today {
    border-color: var(--gold-pale);
    color: var(--gold-pale);
    box-shadow: inset 0 0 0 1px var(--gold-pale);
  }
  .days li.done {
    border-color: var(--gold);
    background: var(--gold);
    color: var(--ink);
  }
  .said {
    min-height: 1.3em;
    font-size: var(--text-sm);
    font-style: italic;
    color: var(--gold-pale);
  }
  .compact .said:empty {
    display: none;
  }
  :global([data-motion='calm']) .votive.spent {
    animation: none;
  }
</style>
