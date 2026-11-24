<script lang="ts">
  import { fmtNumber, t } from '../../i18n/i18n.svelte';
  import { countUp } from '../motion/flight';
  import Icon from '../icons/Icon.svelte';

  let { amount }: { amount: number } = $props();
  let shown = $state(0);
  let first = true;

  $effect(() => {
    const to = amount;
    if (first) {
      first = false;
      shown = to;
      return;
    }
    return countUp(shown, to, (v) => (shown = v));
  });
</script>

<p class="starlight" id="hud-starlight" aria-live="polite">
  <Icon name="starlight" size={20} />
  <span class="amount" aria-hidden="true">{fmtNumber(shown)}</span>
  <span class="visually-hidden">{t('ui.hud.starlight', { amount })}</span>
</p>

<style>
  .starlight {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule);
    border-radius: var(--radius-control);
    color: var(--gold);
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-variant-numeric: lining-nums tabular-nums;
  }
  .amount {
    color: var(--gold-pale);
    min-width: 3.5ch;
    text-align: end;
  }
</style>
