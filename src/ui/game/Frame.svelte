<script lang="ts">
  import type { Snippet } from 'svelte';

  // A game panel: vault-blue ground, a gold hairline and engraved corner pieces.
  interface Props {
    children: Snippet;
    tone?: 'vault' | 'ink' | 'parchment';
    class?: string;
  }
  let { children, tone = 'vault', class: extra = '' }: Props = $props();
</script>

<div class="frame {tone} {extra}">
  {#each ['tl', 'tr', 'bl', 'br'] as corner (corner)}
    <svg class="corner {corner}" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M1 23V7a6 6 0 0 1 6-6h16 M5 23V9a4 4 0 0 1 4-4h14 M9 9h2v2H9z" />
    </svg>
  {/each}
  {@render children()}
</div>

<style>
  .frame {
    position: relative;
    padding: var(--space-5);
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius-control);
    box-shadow:
      inset 0 0 0 4px rgb(4 6 13 / 0.6),
      inset 0 0 0 5px rgb(212 173 85 / 0.18),
      var(--shadow-3);
  }
  .vault {
    background:
      radial-gradient(ellipse at 50% 0, rgb(43 63 134 / 0.45), transparent 70%),
      linear-gradient(180deg, #101c3e, #0a1229);
  }
  .ink {
    background: rgb(7 10 20 / 0.88);
  }
  .parchment {
    background:
      radial-gradient(circle at 30% 20%, rgb(255 255 255 / 0.3), transparent 60%), var(--parchment);
    color: #23202e;
  }
  .corner {
    position: absolute;
    width: 22px;
    height: 22px;
    fill: none;
    stroke: var(--gold);
    stroke-width: 1.3;
    pointer-events: none;
  }
  .parchment .corner {
    stroke: var(--gold-deep);
  }
  .tl {
    top: -3px;
    left: -3px;
  }
  .tr {
    top: -3px;
    right: -3px;
    rotate: 90deg;
  }
  .br {
    bottom: -3px;
    right: -3px;
    rotate: 180deg;
  }
  .bl {
    bottom: -3px;
    left: -3px;
    rotate: 270deg;
  }
</style>
