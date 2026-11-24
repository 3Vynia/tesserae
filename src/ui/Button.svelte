<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import Icon from './icons/Icon.svelte';
  import type { IconName } from './icons/paths';
  import Tracer from './Tracer.svelte';

  interface Props extends HTMLButtonAttributes {
    variant?: 'gilt' | 'engraved' | 'quiet';
    icon?: IconName;
    loading?: boolean;
    /** Rendered as a link when set. */
    href?: string;
    children: Snippet;
  }
  let {
    variant = 'engraved',
    icon,
    loading = false,
    href,
    disabled,
    children,
    ...rest
  }: Props = $props();
</script>

{#snippet content()}
  <span class="inner">
    {#if loading}<Tracer />{:else if icon}<Icon name={icon} size={20} />{/if}
    <span class="label">{@render children()}</span>
  </span>
{/snippet}

{#if href && !disabled}
  <a class="btn {variant}" {href}>{@render content()}</a>
{:else}
  <button
    class="btn {variant}"
    type="button"
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...rest}
  >
    {@render content()}
  </button>
{/if}

<style>
  .btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 var(--space-5);
    border: 1px solid transparent;
    border-radius: var(--radius-control);
    font-family: var(--font-caps);
    font-size: var(--text-lg);
    letter-spacing: var(--tracking-caps);
    text-decoration: none;
    cursor: pointer;
    overflow: hidden;
    isolation: isolate;
    transition:
      transform var(--dur-press) var(--ease-out),
      background-color var(--dur-quick) ease,
      border-color var(--dur-quick) ease,
      color var(--dur-quick) ease;
  }
  .inner {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  .btn:active:not(:disabled) {
    transform: scale(0.97);
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .gilt {
    background: var(--gold);
    color: var(--ink);
    box-shadow: var(--bevel), var(--shadow-2);
  }
  /* gold-leaf sheen: a band of light that crosses once on hover */
  .gilt::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(
      100deg,
      transparent 35%,
      rgb(255 248 225 / 0.55) 50%,
      transparent 65%
    );
    translate: -110% 0;
  }

  .engraved {
    background: transparent;
    border-color: var(--rule-strong);
    color: var(--gold-pale);
  }
  .quiet {
    padding: 0 var(--space-2);
    background: none;
    color: var(--gold-pale);
    font-family: var(--font-body);
    letter-spacing: 0;
  }
  .quiet .label {
    background: linear-gradient(currentColor, currentColor) 0 100% / 0 1px no-repeat;
    transition: background-size var(--dur-base) var(--ease-out);
  }

  @media (hover: hover) and (pointer: fine) {
    .gilt:hover:not(:disabled)::after {
      translate: 110% 0;
      transition: translate 700ms var(--ease-in-out);
    }
    .engraved:hover:not(:disabled) {
      background: var(--vault);
      border-color: var(--gold);
    }
    .quiet:hover:not(:disabled) .label {
      background-size: 100% 1px;
    }
  }
  :global([data-motion='calm']) .gilt::after {
    display: none;
  }
</style>
