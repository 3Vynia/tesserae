<script lang="ts">
  import { t } from '../../i18n/i18n.svelte';
  import Icon from '../icons/Icon.svelte';
  import Sheet from './Sheet.svelte';
  import type { NavItem } from './nav';

  // The bottom dock on narrow screens; the rest of the destinations sit behind "More".
  let { items, more, current }: { items: NavItem[]; more: NavItem[]; current: string } = $props();
  let open = $state(false);
  const moreActive = $derived(more.some((m) => m.route === current));
  const moreBadge = $derived(more.some((m) => m.badge));
</script>

<nav class="dock" aria-label={t('ui.nav.label')}>
  <ul>
    {#each items as item (item.route)}
      <li>
        <a
          href={item.href}
          class:featured={item.featured}
          class:active={current === item.route}
          aria-current={current === item.route ? 'page' : undefined}
        >
          <span class="tablet">
            <Icon name={item.icon} size={28} />
            {#if item.badge}<span class="alert" aria-hidden="true"></span>{/if}
          </span>
          <span class="label caps">{item.label}</span>
          {#if item.status}<span class="visually-hidden">, {item.status}</span>{/if}
        </a>
      </li>
    {/each}
    <li>
      <button type="button" class:active={moreActive} onclick={() => (open = true)}>
        <span class="tablet">
          <Icon name="more" size={28} />
          {#if moreBadge}<span class="alert" aria-hidden="true"></span>{/if}
        </span>
        <span class="label caps">{t('ui.nav.more')}</span>
      </button>
    </li>
  </ul>
</nav>

{#if open}
  <Sheet title={t('ui.nav.more')} onclose={() => (open = false)}>
    <ul class="more">
      {#each more as item (item.route)}
        <li>
          <a
            href={item.href}
            aria-current={current === item.route ? 'page' : undefined}
            onclick={() => (open = false)}
          >
            <span class="more-icon"><Icon name={item.icon} size={26} /></span>
            <span class="more-label">{item.label}</span>
            {#if item.timer}<span class="more-note">{item.timer}</span>{/if}
            {#if item.status}<span class="more-note">{item.status}</span>{/if}
          </a>
        </li>
      {/each}
    </ul>
  </Sheet>
{/if}

<style>
  .dock {
    position: fixed;
    left: 50%;
    bottom: max(var(--space-3), env(safe-area-inset-bottom));
    translate: -50% 0;
    z-index: var(--z-sticky);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--rule-strong);
    border-radius: 14px;
    background: linear-gradient(180deg, rgb(16 28 62 / 0.96), rgb(7 10 20 / 0.96));
    box-shadow:
      inset 0 1px 0 rgb(255 244 210 / 0.12),
      0 18px 40px -12px rgb(0 0 0 / 0.9);
  }
  ul {
    display: flex;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  a,
  button {
    display: grid;
    justify-items: center;
    gap: 2px;
    min-width: 5.25rem;
    padding: var(--space-1) var(--space-2);
    color: var(--parchment-dim);
    text-decoration: none;
    border: 0;
    background: none;
    font: inherit;
    cursor: pointer;
    border-radius: 10px;
    transition:
      color var(--dur-quick) ease,
      transform var(--dur-press) var(--ease-out);
  }
  a:active,
  button:active {
    transform: scale(0.95);
  }
  .tablet {
    position: relative;
    display: grid;
    place-items: center;
    width: 52px;
    height: 44px;
    border-radius: 10px;
    border: 1px solid transparent;
    transition:
      background-color var(--dur-base) var(--ease-out),
      border-color var(--dur-base) ease,
      translate var(--dur-base) var(--ease-out);
  }
  .active {
    color: var(--gold-pale);
  }
  .active .tablet {
    translate: 0 -6px;
    background: linear-gradient(180deg, var(--gold-pale), var(--gold));
    color: var(--ink);
    border-color: var(--gold-pale);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.5),
      0 6px 14px -6px rgb(0 0 0 / 0.8);
  }
  .label {
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-caps);
  }
  .alert {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 14px;
    height: 14px;
    background: var(--gold-pale);
    clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  }
  /* the summoning medallion rises above the bar */
  .featured .tablet {
    width: 76px;
    height: 76px;
    margin-top: -34px;
    border-radius: 50%;
    border: 2px solid var(--gold);
    background: radial-gradient(circle at 50% 35%, #f2c879 0, #b0603f 35%, #2b1f45 75%);
    color: var(--parchment);
    box-shadow:
      inset 0 0 0 4px rgb(4 6 13 / 0.35),
      0 10px 22px -8px rgb(0 0 0 / 0.9);
  }
  .featured .tablet :global(svg) {
    width: 38px;
    height: 38px;
  }
  .featured.active .tablet {
    translate: 0 -4px;
    background: radial-gradient(circle at 50% 35%, #fdf1d2 0, #f2c879 40%, #b0603f 90%);
    color: var(--ink);
  }
  .more {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .more a {
    grid-template-columns: auto 1fr auto;
    justify-items: start;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
    min-height: 56px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--rule);
    color: var(--parchment);
    font-size: var(--text-lg);
  }
  .more a[aria-current='page'] {
    border-color: var(--gold);
    color: var(--gold-pale);
  }
  .more-icon {
    color: var(--gold);
  }
  .more-note {
    font-size: var(--text-sm);
    color: var(--gold);
  }
  @media (hover: hover) and (pointer: fine) {
    a:not(.active):hover {
      color: var(--gold-pale);
    }
    a:not(.active):hover .tablet {
      border-color: var(--rule-strong);
    }
  }
  @media (max-width: 520px) {
    .dock {
      left: 0;
      right: 0;
      translate: none;
      bottom: 0;
      border-radius: 14px 14px 0 0;
      padding-bottom: max(var(--space-2), env(safe-area-inset-bottom));
    }
    ul {
      justify-content: space-around;
    }
    li {
      flex: 1;
      min-width: 0;
    }
    ul {
      gap: 0;
    }
    .label {
      font-size: var(--text-xs);
      letter-spacing: 0.02em;
    }
    a,
    button {
      min-width: 0;
      width: 100%;
    }
  }
  @media (min-width: 900px) {
    .dock {
      display: none;
    }
  }
  :global([data-motion='calm']) .tablet {
    transition: none;
  }
</style>
