<script lang="ts">
  import type { Pantheon } from '../../data/pantheons';
  import { ORNAMENTS } from '../ornaments';

  // A pantheon's band ornament turned around a circle: each tradition's skills bloom in its own
  // pattern.
  let { pantheon, petals = 8 }: { pantheon: Pantheon; petals?: number } = $props();
</script>

<svg class="rosette" viewBox="-50 -50 100 100" aria-hidden="true">
  <circle r="12" />
  {#each { length: petals } as _, i (i)}
    <g transform="rotate({(360 / petals) * i}) translate(-10 -44)">
      <path d={ORNAMENTS[pantheon]} />
    </g>
  {/each}
  <circle r="30" class="ring" />
</svg>

<style>
  .rosette {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  path,
  circle {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .ring {
    stroke-dasharray: 2 4;
    opacity: 0.6;
  }
</style>
