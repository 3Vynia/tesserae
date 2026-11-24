<script lang="ts">
  import type { Snippet } from 'svelte';

  // The plate every scene opens with: the title between two engraved wings, and an optional
  // counter under it.
  let { title, children }: { title: string; children?: Snippet } = $props();
</script>

<header class="plate">
  <svg class="wing" viewBox="0 0 120 20" aria-hidden="true">
    <path d="M0 10h96 M100 10l6-6 6 6-6 6z M88 4l6 6-6 6 M70 10a3 3 0 1 0 0 .1" />
  </svg>
  <div class="center">
    <h1 class="caps">{title}</h1>
    {#if children}<div class="sub">{@render children()}</div>{/if}
  </div>
  <svg class="wing right" viewBox="0 0 120 20" aria-hidden="true">
    <path d="M0 10h96 M100 10l6-6 6 6-6 6z M88 4l6 6-6 6 M70 10a3 3 0 1 0 0 .1" />
  </svg>
</header>

<style>
  .plate {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: var(--space-4);
    margin: 0 auto var(--space-6);
    max-width: 52rem;
  }
  .center {
    display: grid;
    justify-items: center;
    gap: var(--space-1);
    text-align: center;
  }
  h1 {
    font-size: var(--text-4xl);
    letter-spacing: 0.12em;
    color: var(--gold-pale);
    text-shadow: 0 2px 12px rgb(0 0 0 / 0.7);
  }
  .sub {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--gold);
    font-variant-numeric: lining-nums;
  }
  .wing {
    width: 100%;
    max-width: 14rem;
    height: 20px;
    justify-self: end;
  }
  .wing.right {
    justify-self: start;
    scale: -1 1;
  }
  .wing path {
    fill: none;
    stroke: var(--gold);
    stroke-width: 1.2;
  }
  @media (max-width: 560px) {
    .plate {
      gap: var(--space-2);
    }
    h1 {
      font-size: var(--text-3xl);
    }
  }
</style>
