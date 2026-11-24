<script lang="ts">
  import { fmtNumber, t } from '../../i18n/i18n.svelte';
  import Icon from '../icons/Icon.svelte';
  import Starlight from './Starlight.svelte';

  // The currencies, side by side: starlight counts up; stardust and golden tesserae just show.
  let { starlight, dust, golden }: { starlight: number; dust: number; golden: number } = $props();
</script>

<div class="purse">
  <Starlight amount={starlight} />
  <p class="coin dust" title={t('ui.wallet.dustName')}>
    <Icon name="dust" size={18} />
    <span aria-hidden="true">{fmtNumber(dust)}</span>
    <span class="visually-hidden">{t('ui.wallet.dust', { amount: dust })}</span>
  </p>
  <p class="coin golden" title={t('ui.wallet.goldenName')}>
    <Icon name="golden" size={18} />
    <span aria-hidden="true">{fmtNumber(golden)}</span>
    <span class="visually-hidden">{t('ui.wallet.golden', { amount: golden })}</span>
  </p>
</div>

<style>
  .purse {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .purse :global(.starlight),
  .coin {
    background: rgb(7 10 20 / 0.85);
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
  }
  .coin {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-height: 44px;
    padding: 0 var(--space-3);
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--parchment);
    font-variant-numeric: lining-nums tabular-nums;
  }
  .dust :global(svg) {
    color: #b9c7e8;
  }
  .golden :global(svg) {
    color: var(--gold);
  }
  @media (max-width: 640px) {
    .coin {
      padding: 0 var(--space-2);
      font-size: var(--text-md);
    }
    .dust {
      display: none;
    }
  }
</style>
