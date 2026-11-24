<script lang="ts">
  import type { Pantheon } from '../../data/pantheons';
  import { PANTHEON_GROUND } from '../card/art';
  import Rosette from '../battle/Rosette.svelte';
  import NightSky from '../NightSky.svelte';
  import Ornament from '../Ornament.svelte';
  import Icon from '../icons/Icon.svelte';
  import type { IconName } from '../icons/paths';

  // A carousel slide for an event or mode: same composition as a summon banner, with a large
  // engraved emblem instead of cards.
  interface Props {
    pantheon: Pantheon;
    icon: IconName;
    title: string;
    sub: string;
    chip: string;
  }
  let { pantheon, icon, title, sub, chip }: Props = $props();
  const ground = $derived(PANTHEON_GROUND[pantheon]);
</script>

<div class="art" style:--g1={ground[0]} style:--g2={ground[1]}>
  <div class="sky"><NightSky seed={title} stars={60} fixed={false} constellations={false} /></div>
  <div class="rosette"><Rosette {pantheon} petals={12} /></div>
  <div class="emblem"><Icon name={icon} size={200} /></div>
  <div class="copy">
    <span class="band"><Ornament {pantheon} height={12} /></span>
    <h2 class="title">{title}</h2>
    <p class="sub">{sub}</p>
    <p class="chip">{chip}</p>
  </div>
  <div class="frame"></div>
</div>

<style>
  .art {
    container-type: inline-size;
    position: relative;
    aspect-ratio: 16 / 8;
    border-radius: 16px;
    overflow: hidden;
    isolation: isolate;
    background: radial-gradient(
      ellipse at 72% 45%,
      color-mix(in srgb, var(--g1) 80%, #e7965c 20%) 0,
      var(--g1) 30%,
      var(--g2) 80%
    );
    box-shadow: var(--shadow-3);
  }
  .sky {
    position: absolute;
    inset: 0;
    opacity: 0.8;
  }
  .rosette {
    position: absolute;
    right: 2%;
    top: 50%;
    width: 60cqi;
    aspect-ratio: 1;
    translate: 0 -50%;
    color: var(--gold);
    opacity: 0.22;
    animation: turn 140s linear infinite reverse;
  }
  @keyframes turn {
    to {
      rotate: 360deg;
    }
  }
  .emblem {
    position: absolute;
    right: 14cqi;
    top: 50%;
    translate: 0 -50%;
    width: 28cqi;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    color: var(--gold-pale);
    filter: drop-shadow(0 8px 18px rgb(0 0 0 / 0.6));
  }
  .emblem :global(svg) {
    width: 100%;
    height: 100%;
  }
  .copy {
    position: absolute;
    left: 5cqi;
    top: 50%;
    translate: 0 -50%;
    width: 46cqi;
    display: grid;
    gap: 1.2cqi;
  }
  .band {
    width: 24cqi;
  }
  .title {
    font-family: var(--font-caps);
    font-size: 6cqi;
    line-height: 0.95;
    letter-spacing: 0.05em;
    color: var(--parchment);
    text-shadow: 0 3px 16px rgb(0 0 0 / 0.7);
  }
  .sub {
    font-size: max(0.8rem, 2cqi);
    font-style: italic;
    color: var(--gold-pale);
  }
  .chip {
    justify-self: start;
    margin-top: 1cqi;
    padding: 0.4em 0.9em;
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
    background: rgb(4 6 13 / 0.7);
    font-size: max(0.75rem, 1.6cqi);
    color: var(--parchment);
    font-variant-numeric: lining-nums;
  }
  .frame {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 2px var(--gold),
      inset 0 0 0 6px rgb(4 6 13 / 0.55),
      inset 0 0 0 7px rgb(212 173 85 / 0.45);
    pointer-events: none;
  }
  :global([data-motion='calm']) .rosette {
    animation: none;
  }
</style>
