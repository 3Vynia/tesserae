<script lang="ts">
  import { CARDS } from '../../data/cards';
  import { buyCard, MARKET_PRICE, marketBought, marketStock, weekEnds } from '../../engine/vault';
  import { fmtNumber, t } from '../../i18n/i18n.svelte';
  import { game } from '../save.svelte';
  import { clock } from '../clock.svelte';
  import { router } from '../router.svelte';
  import { cardName } from '../card-text';
  import CardView from '../../ui/card/Card.svelte';
  import SceneTitle from '../../ui/game/SceneTitle.svelte';
  import Icon from '../../ui/icons/Icon.svelte';

  // The Oracle's stall: a few cards each week, sold for stardust, one of each.
  const ready = $derived(game.status === 'ready');
  const stock = $derived(ready ? marketStock(game.save, CARDS, clock.now) : []);
  const sold = $derived(ready ? marketBought(game.save, clock.now) : []);
  const dust = $derived(ready ? game.save.wallet.dust : 0);
  const left = $derived.by(() => {
    const ms = Math.max(0, weekEnds(clock.now) - clock.now);
    const d = Math.floor(ms / 86_400_000);
    const h = Math.floor((ms % 86_400_000) / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return d > 0 ? t('ui.time.dh', { d, h }) : t('ui.time.hm', { h, m });
  });
  let said = $state('');

  function buy(id: string): void {
    let out: ReturnType<typeof buyCard> | undefined;
    game.update((s) => (out = buyCard(s, CARDS, id, Date.now())));
    const card = stock.find((c) => c.id === id);
    if (out && 'isNew' in out && card)
      said = out.isNew
        ? t('ui.market.boughtNew', { name: cardName(card) })
        : t('ui.market.boughtCopy', { name: cardName(card) });
  }
</script>

<div class="market">
  <SceneTitle title={t('ui.market.heading')}>{t('ui.market.restock', { time: left })}</SceneTitle>

  {#if ready}
    <div class="purse-line">
      <p class="balance">
        <Icon name="dust" size={22} />
        {t('ui.market.balance', { dust })}
      </p>
      <p class="said" role="status">{said}</p>
    </div>

    <ul class="stalls">
      {#each stock as card (card.id)}
        {@const owned = game.save.owned[card.id]}
        {@const isSold = sold.includes(card.id)}
        {@const price = MARKET_PRICE[card.rarity]}
        {@const wished = game.save.wishlist.includes(card.id)}
        <li class:sold={isSold}>
          <a class="art" href={router.href('collection', card.id)} aria-label={cardName(card)}>
            <CardView {card} interactive={false} />
          </a>
          <div class="tags">
            {#if !owned}<span class="tag new caps">{t('ui.market.newToYou')}</span>{/if}
            {#if wished}<span class="tag wish">
                <Icon name="wish" size={14} />{t('ui.market.onWishlist')}
              </span>{/if}
          </div>
          <p class="held">
            {owned ? t('ui.market.youHave', { count: owned.count }) : t('ui.market.notYet')}
          </p>
          <button
            type="button"
            class="buy"
            disabled={isSold || dust < price}
            onclick={() => buy(card.id)}
          >
            {#if isSold}
              <Icon name="check" size={18} />{t('ui.market.sold')}
            {:else}
              <Icon name="dust" size={18} />{fmtNumber(price)}
            {/if}
          </button>
        </li>
      {/each}
    </ul>

    <aside class="how">
      <h2 class="caps">{t('ui.market.howHeading')}</h2>
      <p>{t('ui.market.howBody')}</p>
      <a href={router.href('collection')}>
        <Icon name="dissolve" size={18} />{t('ui.market.toVault')}
      </a>
    </aside>
  {/if}
</div>

<style>
  .market {
    display: grid;
    gap: var(--space-5);
    max-width: 76rem;
    margin-inline: auto;
    padding: 0 var(--gutter) var(--space-7);
  }
  .purse-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-4);
  }
  .balance {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0 var(--space-4);
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
    background: rgb(7 10 20 / 0.85);
    color: var(--parchment);
    font-variant-numeric: lining-nums;
  }
  .balance :global(svg) {
    color: #b9c7e8;
  }
  .said {
    flex: 1;
    text-align: end;
    font-style: italic;
    color: var(--gold-pale);
  }
  .stalls {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap: var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .stalls li {
    position: relative;
    display: grid;
    justify-items: center;
    gap: var(--space-2);
    padding: var(--space-4) var(--space-3);
    border: 1px solid var(--rule);
    border-radius: 12px;
    background:
      radial-gradient(80% 50% at 50% 0%, rgb(212 173 85 / 0.12), transparent 70%),
      rgb(7 10 20 / 0.8);
    text-align: center;
  }
  .art {
    display: block;
    width: 100%;
    transition: transform var(--dur-base) var(--ease-out);
  }
  .sold .art {
    filter: grayscale(0.6) brightness(0.6);
  }
  @media (hover: hover) and (pointer: fine) {
    li:not(.sold) .art:hover {
      transform: translateY(-6px);
    }
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-1);
    min-height: 24px;
  }
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px;
    border-radius: 999px;
    font-size: var(--text-xs);
  }
  .tag.new {
    background: var(--gold);
    color: var(--ink);
  }
  .tag.wish {
    border: 1px solid var(--gold);
    color: var(--gold-pale);
  }
  .held {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .buy {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--gold-pale);
    border-radius: 10px;
    background: linear-gradient(180deg, var(--gold-pale), var(--gold) 55%, #b98f3e);
    color: var(--ink);
    font: inherit;
    font-variant-numeric: lining-nums;
    cursor: pointer;
    transition: transform var(--dur-press) var(--ease-out);
  }
  .buy:active:not(:disabled) {
    transform: scale(0.96);
  }
  .buy:disabled {
    border-color: var(--rule);
    background: transparent;
    color: var(--text-muted);
    cursor: not-allowed;
  }
  .how {
    display: grid;
    gap: var(--space-2);
    max-width: 60ch;
    padding: var(--space-5);
    border-left: 2px solid var(--gold);
    background: rgb(7 10 20 / 0.6);
  }
  .how h2 {
    font-size: var(--text-lg);
    font-weight: 400;
    color: var(--gold);
  }
  .how a {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    color: var(--gold-pale);
  }
</style>
