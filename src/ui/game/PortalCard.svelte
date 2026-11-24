<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tilt } from '../card/tilt';

  // A giant card on the hub that leads to a scene. It tilts like the real cards do.
  interface Props {
    href: string;
    title: string;
    status: string;
    tone: 'vault' | 'summon' | 'battle';
    art: Snippet;
  }
  let { href, title, status, tone, art }: Props = $props();
</script>

<a class="portal {tone}" {href}>
  <span class="tilt" use:tilt={{ max: 10 }}>
    <span class="face">
      <span class="art" aria-hidden="true">{@render art()}</span>
      <span class="plate">
        <span class="title caps">{title}</span>
        <span class="status">{status}</span>
      </span>
      <span class="frame" aria-hidden="true"></span>
      <span class="shine" aria-hidden="true"></span>
    </span>
  </span>
</a>

<style>
  .portal {
    display: block;
    width: 100%;
    perspective: 900px;
    text-decoration: none;
    color: inherit;
    transition:
      translate var(--dur-base) var(--ease-out),
      scale var(--dur-press) var(--ease-out);
  }
  .portal:active {
    scale: 0.97;
  }
  .tilt {
    display: block;
    transform-style: preserve-3d;
  }
  .face {
    container-type: inline-size;
    position: relative;
    display: block;
    aspect-ratio: 5 / 7;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: var(--shadow-3);
  }
  .vault .face {
    background: radial-gradient(circle at 50% 35%, #2b3f86 0, #0e1834 60%, #070a14 100%);
  }
  .summon .face {
    background: radial-gradient(
      circle at 50% 35%,
      #f2c879 0,
      #b0603f 18%,
      #3a2a55 45%,
      #0b1128 85%
    );
  }
  .battle .face {
    background: radial-gradient(circle at 50% 35%, #a8462e 0, #4a1f26 35%, #12101e 80%);
  }
  .art {
    position: absolute;
    inset: 8% 10% 34%;
    display: grid;
    place-items: center;
    color: var(--gold-pale);
  }
  .plate {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    display: grid;
    gap: 2px;
    padding: 22% 9% 9%;
    background: linear-gradient(0deg, rgb(4 6 13 / 0.95) 0, rgb(4 6 13 / 0.75) 60%, transparent);
  }
  .title {
    font-size: max(0.95rem, min(2rem, 12cqi));
    letter-spacing: 0.08em;
    color: var(--gold-pale);
    line-height: 1;
  }
  .status {
    font-size: max(0.75rem, min(1rem, 7.5cqi));
    color: var(--parchment-dim);
    font-variant-numeric: lining-nums;
  }
  .frame {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 2px var(--gold),
      inset 0 0 0 6px rgb(4 6 13 / 0.7),
      inset 0 0 0 7px rgb(212 173 85 / 0.5);
    pointer-events: none;
  }
  .shine {
    --mx: 50%;
    --my: 50%;
    --tilt: 0;
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at var(--mx) var(--my),
      rgb(255 248 225 / 0.5),
      transparent 55%
    );
    mix-blend-mode: soft-light;
    opacity: calc(0.2 + var(--tilt) * 0.8);
    pointer-events: none;
  }
  @media (hover: hover) and (pointer: fine) {
    .portal:hover {
      translate: 0 -10px;
    }
  }
  .portal:focus-visible {
    outline: none;
  }
  .portal:focus-visible .face {
    outline: 3px solid var(--focus);
    outline-offset: 4px;
  }
</style>
