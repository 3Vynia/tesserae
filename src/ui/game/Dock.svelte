<script lang="ts">
  import { t } from '../../i18n/i18n.svelte';
  import Icon from '../icons/Icon.svelte';
  import type { IconName } from '../icons/paths';

  interface Item {
    route: string;
    href: string;
    icon: IconName;
    label: string;
    /** Shows a small star when something waits there, such as a quest to claim. */
    alert?: boolean;
  }
  let { items, current }: { items: Item[]; current: string } = $props();
</script>

<nav class="dock" aria-label={t('ui.nav.label')}>
  <ul>
    {#each items as item (item.route)}
      <li>
        <a
          href={item.href}
          class:active={current === item.route}
          aria-current={current === item.route ? 'page' : undefined}
        >
          <span class="tablet">
            <Icon name={item.icon} size={28} />
            {#if item.alert}<span class="alert" aria-hidden="true"></span>{/if}
          </span>
          <span class="label caps">{item.label}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

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
  a {
    display: grid;
    justify-items: center;
    gap: 2px;
    min-width: 5.25rem;
    padding: var(--space-1) var(--space-2);
    color: var(--parchment-dim);
    text-decoration: none;
    border-radius: 10px;
    transition:
      color var(--dur-quick) ease,
      transform var(--dur-press) var(--ease-out);
  }
  a:active {
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
    a {
      min-width: 0;
      flex: 1;
    }
  }
  :global([data-motion='calm']) .tablet {
    transition: none;
  }
</style>
