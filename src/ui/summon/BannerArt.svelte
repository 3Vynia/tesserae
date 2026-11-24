<script lang="ts">
  import { onMount } from 'svelte';
  import type { Banner } from '../../engine/gacha';
  import { t } from '../../i18n/i18n.svelte';
  import { bannerCards, bannerEndsIn, splitDuration } from '../../app/banners';
  import { cardName } from '../../app/card-text';
  import { PANTHEON_GROUND } from '../card/art';
  import CardView from '../card/Card.svelte';
  import Rosette from '../battle/Rosette.svelte';
  import NightSky from '../NightSky.svelte';
  import Ornament from '../Ornament.svelte';
  import { motion } from '../motion/motion.svelte';

  // The illustrated face of a summoning banner, used on the summon altar and the home carousel.
  interface Props {
    banner: Banner;
    compact?: boolean;
    /** When set, the featured cards become buttons that open a viewer. */
    oncard?: (index: number) => void;
  }
  let { banner, compact = false, oncard }: Props = $props();

  const cards = $derived(bannerCards(banner));
  const pantheon = $derived(banner.featured ?? 'greek');
  const ground = $derived(
    banner.featured ? PANTHEON_GROUND[banner.featured] : ['#1d2c63', '#070a14'],
  );
  let now = $state(Date.now());
  const left = $derived(bannerEndsIn(banner, now));
  const time = $derived(left === null ? null : splitDuration(left));

  // The featured cards orbit on a tilted ellipse, always facing the viewer, so every card is seen
  // whole in turn. Transforms are written straight to each slot every frame.
  let orbit = $state<HTMLDivElement>();
  let paused = false;

  onMount(() => {
    const id = setInterval(() => (now = Date.now()), 30_000);
    let raf = 0;
    let angle = 0;
    let last = performance.now();
    const place = () => {
      const slots = orbit ? [...orbit.querySelectorAll<HTMLElement>('.card-slot')] : [];
      const n = slots.length;
      slots.forEach((el, i) => {
        const a = angle + (i / n) * Math.PI * 2;
        const depth = (Math.cos(a) + 1) / 2; // 1 in front, 0 behind
        const x = Math.sin(a) * 14;
        const y = (1 - depth) * -6;
        const scale = 0.62 + depth * 0.38;
        el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(2)}cqi, ${y.toFixed(2)}cqi) scale(${scale.toFixed(3)}) rotateY(${(-Math.sin(a) * 18).toFixed(1)}deg)`;
        el.style.zIndex = String(Math.round(depth * 100));
        el.style.filter = `brightness(${(0.55 + depth * 0.45).toFixed(2)})`;
      });
    };
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!paused && !motion.calm) angle += dt * 0.35;
      place();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      clearInterval(id);
      cancelAnimationFrame(raf);
    };
  });
</script>

<div
  class="art"
  class:compact
  style:--g1={ground[0]}
  style:--g2={ground[1]}
  aria-hidden={compact ? 'true' : undefined}
>
  <div class="sky">
    <NightSky seed={banner.id} stars={60} fixed={false} constellations={false} />
  </div>
  <div class="rosette"><Rosette {pantheon} petals={12} /></div>

  <div
    class="cards"
    role="presentation"
    bind:this={orbit}
    onpointerenter={() => (paused = true)}
    onpointerleave={() => (paused = false)}
    onfocusin={() => (paused = true)}
    onfocusout={() => (paused = false)}
  >
    {#if oncard}<span class="hint caps">{t('ui.summon.banner.tapToView')}</span>{/if}
    {#each cards as card, i (card.id)}
      {#if oncard}
        <button
          type="button"
          class="card-slot pick"
          onclick={() => oncard(i)}
          aria-label={t('ui.summon.banner.view', { name: cardName(card) })}
        >
          <CardView {card} interactive={false} />
        </button>
      {:else}
        <div class="card-slot"><CardView {card} interactive={false} /></div>
      {/if}
    {/each}
  </div>

  <div class="copy">
    {#if banner.featured}
      <span class="band"><Ornament pantheon={banner.featured} height={12} /></span>
      <h2 class="title">
        {t('ui.summon.banner.featured', { pantheon: t(`ui.pantheonInline.${banner.featured}`) })}
      </h2>
      <p class="sub">
        {t('ui.summon.banner.rateUp', { names: cards.slice(0, 3).map(cardName).join(' · ') })}
      </p>
    {:else}
      <span class="band"><Ornament pantheon="greek" height={12} /></span>
      <h2 class="title">{t('ui.summon.banner.standing')}</h2>
      <p class="sub">{t('ui.summon.banner.standingBody')}</p>
    {/if}
    {#if time}
      <p class="timer">
        {t('ui.summon.banner.timer', time)}
      </p>
    {:else}
      <p class="timer">{t('ui.summon.banner.always')}</p>
    {/if}
  </div>

  {#if banner.featured}
    <div class="seal" aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <path
          d="M50 4l8 9 12-3 3 12 12 3-3 12 9 8-9 8 3 12-12 3-3 12-12-3-8 9-8-9-12 3-3-12-12-3 3-12-9-8 9-8-3-12 12-3 3-12 12 3z"
        />
      </svg>
      <span>{t('ui.summon.banner.seal')}</span>
    </div>
  {/if}
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
    background:
      radial-gradient(
        ellipse at 70% 40%,
        color-mix(in srgb, var(--g1) 85%, #f2c879 15%) 0,
        var(--g1) 30%,
        var(--g2) 80%
      ),
      var(--g2);
    box-shadow: var(--shadow-3);
  }
  .sky {
    position: absolute;
    inset: 0;
    opacity: 0.8;
  }
  .rosette {
    position: absolute;
    right: -6%;
    top: 50%;
    width: 72cqi;
    aspect-ratio: 1;
    translate: 0 -50%;
    color: var(--gold);
    opacity: 0.22;
    animation: turn 120s linear infinite;
  }
  @keyframes turn {
    to {
      rotate: 360deg;
    }
  }
  .cards {
    position: absolute;
    left: 50cqi;
    right: 4cqi;
    top: 0;
    bottom: 0;
    perspective: 900px;
  }
  .card-slot {
    position: absolute;
    left: 50%;
    top: 54%;
    width: 19cqi;
    transform: translate(-50%, -50%);
    will-change: transform;
  }
  .pick {
    padding: 0;
    border: 0;
    background: none;
    cursor: zoom-in;
    transition:
      translate var(--dur-base) var(--ease-out),
      rotate var(--dur-base) var(--ease-out),
      scale var(--dur-press) var(--ease-out);
  }
  .pick:active {
    scale: 0.97;
  }
  .pick:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 4px;
    border-radius: 3.5cqi;
  }
  @media (hover: hover) and (pointer: fine) {
    .pick:hover {
      translate: 0 -2cqi;
    }
  }
  .hint {
    position: absolute;
    right: 0;
    bottom: 3cqi;
    z-index: 200;
    font-size: max(0.65rem, 1.4cqi);
    color: var(--parchment-dim);
    letter-spacing: 0.08em;
    pointer-events: none;
  }
  .copy {
    position: absolute;
    left: 5cqi;
    top: 50%;
    translate: 0 -50%;
    width: 44cqi;
    display: grid;
    gap: 1.2cqi;
  }
  .band {
    width: 24cqi;
  }
  .title {
    font-family: var(--font-caps);
    font-size: 6.4cqi;
    line-height: 0.95;
    letter-spacing: 0.06em;
    color: var(--parchment);
    text-shadow: 0 3px 16px rgb(0 0 0 / 0.7);
  }
  .sub {
    font-size: max(0.8rem, 2cqi);
    font-style: italic;
    color: var(--gold-pale);
    text-shadow: 0 2px 8px rgb(0 0 0 / 0.8);
  }
  .timer {
    justify-self: start;
    margin-top: 1cqi;
    padding: 0.4em 0.9em;
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
    background: rgb(4 6 13 / 0.7);
    font-size: max(0.75rem, 1.6cqi);
    color: var(--parchment);
    font-variant-numeric: lining-nums tabular-nums;
  }
  .seal {
    position: absolute;
    top: 4cqi;
    right: 4cqi;
    width: 13cqi;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    z-index: 4;
    rotate: 12deg;
  }
  .seal svg {
    position: absolute;
    inset: 0;
    fill: var(--gold);
    stroke: var(--gold-pale);
    stroke-width: 2;
  }
  .seal span {
    position: relative;
    font-family: var(--font-caps);
    font-size: max(0.6rem, 1.7cqi);
    line-height: 1;
    text-align: center;
    color: var(--ink);
    width: 70%;
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
    z-index: 5;
  }
  .compact .copy {
    width: 52cqi;
  }
  :global([data-motion='calm']) .rosette {
    animation: none;
  }
</style>
