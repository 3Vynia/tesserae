<script lang="ts">
  import { t } from '../../i18n/i18n.svelte';
  import Icon from '../icons/Icon.svelte';
  import Starlight from '../hud/Starlight.svelte';

  interface Props {
    homeHref: string;
    settingsHref: string;
    starlight: number | null;
    lit: { owned: number; total: number } | null;
  }
  let { homeHref, settingsHref, starlight, lit }: Props = $props();
</script>

<header class="hud">
  <a class="crest" href={homeHref} aria-label={t('ui.app.title')}>
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <path class="shield" d="M20 2l16 6v12c0 9-7 15-16 18C11 35 4 29 4 20V8z" />
      <rect x="11" y="11" width="8" height="8" rx="1" />
      <rect x="21" y="11" width="8" height="8" rx="1" class="lit" />
      <rect x="11" y="21" width="8" height="8" rx="1" class="lit" />
      <rect x="21" y="21" width="8" height="8" rx="1" />
    </svg>
    <span class="name">
      <span class="word caps">{t('ui.app.title')}</span>
      {#if lit}<span class="lit-count">{t('ui.collection.progress', lit)}</span>{/if}
    </span>
  </a>
  <div class="right">
    {#if starlight !== null}<Starlight amount={starlight} />{/if}
    <a class="gear" href={settingsHref} aria-label={t('ui.nav.settings')}>
      <Icon name="settings" size={24} />
    </a>
  </div>
</header>

<style>
  .hud {
    position: fixed;
    inset-inline: 0;
    top: 0;
    z-index: var(--z-sticky);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--gutter);
    background: linear-gradient(180deg, rgb(7 10 20 / 0.85), transparent) no-repeat;
    pointer-events: none;
  }
  .hud > * {
    pointer-events: auto;
  }
  .crest {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    text-decoration: none;
    min-height: 44px;
  }
  .shield {
    fill: var(--ink);
    stroke: var(--gold);
    stroke-width: 1.4;
  }
  rect {
    fill: var(--lapis);
    stroke: var(--gold);
    stroke-width: 0.8;
  }
  rect.lit {
    fill: var(--gold);
  }
  .name {
    display: grid;
    line-height: 1.1;
  }
  .word {
    font-size: var(--text-xl);
    letter-spacing: 0.14em;
    color: var(--gold-pale);
  }
  .lit-count {
    font-size: var(--text-sm);
    color: var(--text-muted);
    font-variant-numeric: lining-nums;
  }
  .right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .right :global(.starlight) {
    background: rgb(7 10 20 / 0.85);
    border-color: var(--rule-strong);
    border-radius: 999px;
  }
  .gear {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--rule-strong);
    border-radius: 50%;
    background: rgb(7 10 20 / 0.85);
    color: var(--gold-pale);
    transition: transform var(--dur-press) var(--ease-out);
  }
  .gear:active {
    transform: scale(0.94) rotate(-20deg);
  }
  @media (max-width: 520px) {
    .lit-count {
      display: none;
    }
  }
</style>
