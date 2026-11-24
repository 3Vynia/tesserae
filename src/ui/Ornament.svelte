<script lang="ts">
  import type { Pantheon } from '../data/pantheons';
  import { ORNAMENTS } from './ornaments';

  interface Props {
    pantheon: Pantheon;
    /** Band height in px; the pattern scales with it. */
    height?: number;
  }
  let { pantheon, height = 14 }: Props = $props();
  const id = $props.id();
  const scale = $derived(height / 14);
</script>

<svg class="ornament" {height} aria-hidden="true">
  <defs>
    <pattern
      id="orn-{id}"
      width="20"
      height="14"
      patternUnits="userSpaceOnUse"
      patternTransform="scale({scale})"
    >
      <path d={ORNAMENTS[pantheon]} />
    </pattern>
  </defs>
  <rect width="100%" {height} fill="url(#orn-{id})" />
</svg>

<style>
  .ornament {
    display: block;
    width: 100%;
    color: var(--gold);
  }
  path {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.25;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
