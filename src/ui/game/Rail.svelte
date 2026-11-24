<script lang="ts">
  import { t } from '../../i18n/i18n.svelte';
  import Icon from '../icons/Icon.svelte';
  import type { NavItem } from './nav';

  // The side rail on wide screens: every destination, with what waits there.
  let { groups, current }: { groups: NavItem[][]; current: string } = $props();
</script>

<nav class="rail" aria-label={t('ui.nav.label')}>
  {#each groups as group, g (g)}
    {#if g > 0}<span class="rule" aria-hidden="true"></span>{/if}
    <ul>
      {#each group as item (item.route)}
        <li>
          <a
            href={item.href}
            class:active={current === item.route}
            class:featured={item.featured}
            aria-current={current === item.route ? 'page' : undefined}
          >
            <span class="tile">
              <Icon name={item.icon} size={item.featured ? 30 : 24} />
              {#if typeof item.badge === 'number' && item.badge > 0}
                <span class="count" aria-hidden="true">{item.badge}</span>
              {:else if item.badge === true}
                <span class="spark" aria-hidden="true"></span>
              {/if}
            </span>
            <span class="label">{item.label}</span>
            {#if item.timer}<span class="timer">{item.timer}</span>{/if}
            {#if item.status}<span class="visually-hidden">, {item.status}</span>{/if}
          </a>
        </li>
      {/each}
    </ul>
  {/each}
</nav>

<style>
  .rail {
    position: fixed;
    z-index: var(--z-sticky);
    top: 5rem;
    bottom: var(--space-4);
    left: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    width: 5.5rem;
    padding: var(--space-3) var(--space-1);
    overflow-y: auto;
    scrollbar-width: none;
    border: 1px solid var(--rule-strong);
    border-radius: 14px;
    background: linear-gradient(180deg, rgb(16 28 62 / 0.96), rgb(7 10 20 / 0.96));
    box-shadow:
      inset 0 1px 0 rgb(255 244 210 / 0.12),
      0 18px 40px -12px rgb(0 0 0 / 0.9);
  }
  ul {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rule {
    flex: none;
    height: 1px;
    margin: var(--space-1) var(--space-3);
    background: var(--rule);
  }
  a {
    display: grid;
    justify-items: center;
    gap: 2px;
    padding: var(--space-1) 0 var(--space-2);
    border-radius: 10px;
    color: var(--parchment-dim);
    text-decoration: none;
    transition:
      color var(--dur-quick) ease,
      transform var(--dur-press) var(--ease-out);
  }
  a:active {
    transform: scale(0.95);
  }
  .tile {
    position: relative;
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border: 1px solid transparent;
    border-radius: 10px;
    transition:
      background-color var(--dur-base) var(--ease-out),
      border-color var(--dur-base) ease;
  }
  .label {
    font-family: var(--font-caps);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-caps);
    line-height: 1.15;
    text-align: center;
  }
  .timer {
    font-size: var(--text-xs);
    color: var(--gold);
    font-variant-numeric: lining-nums tabular-nums;
  }
  .active {
    color: var(--gold-pale);
  }
  .active .tile {
    background: linear-gradient(180deg, var(--gold-pale), var(--gold));
    border-color: var(--gold-pale);
    color: var(--ink);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.5),
      0 6px 14px -6px rgb(0 0 0 / 0.8);
  }
  .featured .tile {
    width: 56px;
    height: 56px;
    border: 2px solid var(--gold);
    border-radius: 50%;
    background: radial-gradient(circle at 50% 35%, #f2c879 0, #b0603f 35%, #2b1f45 75%);
    color: var(--parchment);
  }
  .featured.active .tile {
    background: radial-gradient(circle at 50% 35%, #fdf1d2 0, #f2c879 40%, #b0603f 90%);
    color: var(--ink);
  }
  .count {
    position: absolute;
    top: -6px;
    right: -8px;
    display: grid;
    place-items: center;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--cinnabar, #d0533a);
    color: var(--parchment);
    font-size: var(--text-xs);
    font-variant-numeric: lining-nums;
    box-shadow: 0 0 0 2px var(--ink);
  }
  .spark {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 14px;
    height: 14px;
    background: var(--gold-pale);
    clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
    animation: twinkle 2.4s ease-in-out infinite;
  }
  @keyframes twinkle {
    50% {
      scale: 0.7;
      opacity: 0.7;
    }
  }
  @media (hover: hover) and (pointer: fine) {
    a:not(.active):hover {
      color: var(--gold-pale);
    }
    a:not(.active):hover .tile {
      border-color: var(--rule-strong);
    }
  }
  @media (max-width: 899px) {
    .rail {
      display: none;
    }
  }
  :global([data-motion='calm']) .spark {
    animation: none;
  }
</style>
