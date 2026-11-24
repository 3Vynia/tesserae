<script lang="ts">
  import type { Stage } from '../../data/stages';
  import { t } from '../../i18n/i18n.svelte';

  // A chapter drawn as a constellation: each stage is a star on a winding path. Cleared stars are
  // gold, the open one glows, locked ones are dim.
  interface Props {
    stages: Stage[];
    cleared: readonly string[];
    unlocked: (id: string) => boolean;
    selected: string;
    onselect: (id: string) => void;
  }
  let { stages, cleared, unlocked, selected, onselect }: Props = $props();

  const points = $derived(
    stages.map((_, i) => ({
      x: 8 + (i * 84) / Math.max(1, stages.length - 1),
      y: i % 2 === 0 ? 34 : 66,
    })),
  );
  const star =
    'M0.00 -10.00 L2.47 -3.40 L9.51 -3.09 L3.99 1.30 L5.88 8.09 L0.00 4.20 L-5.88 8.09 L-3.99 1.30 L-9.51 -3.09 L-2.47 -3.40Z';
  const state = (id: string) =>
    cleared.includes(id) ? 'cleared' : unlocked(id) ? 'open' : 'locked';
</script>

<div class="map" role="radiogroup">
  <svg class="lines" viewBox="0 0 320 100" aria-hidden="true">
    {#each points.slice(1) as p, i (i)}
      {@const from = points[i] ?? p}
      <line
        x1={from.x * 3.2}
        y1={from.y}
        x2={p.x * 3.2}
        y2={p.y}
        class:gold={cleared.includes(stages[i]?.id ?? '')}
        style:--i={i}
        pathLength="1"
      />
    {/each}
  </svg>
  {#each stages as stage, i (stage.id)}
    {@const s = state(stage.id)}
    {@const p = points[i] ?? { x: 0, y: 0 }}
    <button
      type="button"
      role="radio"
      class="node {s}"
      class:selected={selected === stage.id}
      style:left="{p.x}%"
      style:top="{p.y}%"
      aria-checked={selected === stage.id}
      disabled={s === 'locked'}
      aria-label="{t('ui.battle.stageName', { id: stage.id })}, {s === 'cleared'
        ? t('ui.battle.cleared')
        : s === 'locked'
          ? t('ui.battle.lockedShort')
          : t('ui.battle.level', { level: stage.enemies[0]?.level ?? 1 })}"
      onclick={() => onselect(stage.id)}
    >
      <svg viewBox="-14 -14 28 28" aria-hidden="true">
        <circle class="halo" r="13" />
        <path d={star} />
      </svg>
      <span class="label">{stage.id}</span>
    </button>
  {/each}
</div>

<style>
  .map {
    position: relative;
    aspect-ratio: 3.2 / 1;
  }
  .lines {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  line {
    stroke: var(--lapis-bright);
    stroke-width: 1.2;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 500ms var(--ease-in-out) forwards;
    animation-delay: calc(var(--i) * 90ms);
  }
  line.gold {
    stroke: var(--gold);
  }
  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }
  .node {
    position: absolute;
    translate: -50% -50%;
    display: grid;
    justify-items: center;
    gap: 2px;
    width: 52px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--parchment);
    cursor: pointer;
    transition: transform var(--dur-press) var(--ease-out);
  }
  .node:active:not(:disabled) {
    transform: scale(0.92);
  }
  .node svg {
    width: 44px;
    height: 44px;
    overflow: visible;
  }
  .node path {
    fill: none;
    stroke: var(--lapis-bright);
    stroke-width: 1.4;
    stroke-linejoin: round;
  }
  .halo {
    fill: rgb(7 10 20 / 0.85);
    stroke: var(--rule);
  }
  .cleared path {
    fill: var(--gold);
    stroke: var(--gold-pale);
  }
  .open path {
    fill: rgb(236 212 150 / 0.15);
    stroke: var(--gold-pale);
  }
  .open .halo {
    stroke: var(--gold);
    animation: beckon 2.4s ease-in-out infinite;
    transform-origin: center;
    transform-box: fill-box;
  }
  @keyframes beckon {
    50% {
      scale: 1.12;
      stroke-opacity: 0.4;
    }
  }
  .selected .halo {
    stroke: var(--gold-pale);
    stroke-width: 2;
    fill: var(--lapis);
  }
  .locked {
    cursor: not-allowed;
    color: var(--text-muted);
  }
  .label {
    font-family: var(--font-display);
    font-size: var(--text-md);
    font-variant-numeric: lining-nums;
  }
  .node:focus-visible {
    outline: none;
  }
  .node:focus-visible .halo {
    stroke: var(--focus);
    stroke-width: 2.5;
  }
  :global([data-motion='calm']) line {
    stroke-dashoffset: 0;
    animation: none;
  }
  :global([data-motion='calm']) .open .halo {
    animation: none;
  }
</style>
