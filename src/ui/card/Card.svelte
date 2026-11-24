<script lang="ts">
  import { untrack } from 'svelte';
  import type { Card } from '../../data/schema';
  import { RARITIES } from '../../data/schema';
  import { CARDS_BY_ID } from '../../data/cards';
  import { t } from '../../i18n/i18n.svelte';
  import { motion } from '../motion/motion.svelte';
  import { cardEpithet, cardName, cardSource, cardStory, cardTrivia } from '../../app/card-text';
  import CardArt from './CardArt.svelte';
  import Ornament from '../Ornament.svelte';
  import { tilt } from './tilt';

  interface Props {
    card: Card;
    flipped?: boolean;
    interactive?: boolean;
  }
  let { card, flipped = false, interactive = true }: Props = $props();

  let flipper = $state<HTMLDivElement>();
  let shown = $state(untrack(() => flipped));
  const tier = $derived(RARITIES.indexOf(card.rarity) + 1);
  const ornate = $derived(card.rarity === 'god' || card.rarity === 'primordial');

  // Flip with weight: the card swings a little past the back, then settles.
  $effect(() => {
    const target = flipped;
    if (!flipper || target === shown) return;
    if (motion.calm) {
      shown = target;
      return;
    }
    const from = shown ? 180 : 0;
    const to = target ? 180 : 0;
    const over = to + (to > from ? 14 : -14);
    const anim = flipper.animate(
      [
        {
          transform: `rotateY(${from}deg) translateZ(0) scale(1)`,
          easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
        },
        {
          transform: `rotateY(${over}deg) translateZ(40px) scale(1.04)`,
          offset: 0.72,
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
        },
        { transform: `rotateY(${to}deg) translateZ(0) scale(1)` },
      ],
      { duration: 700, fill: 'forwards' },
    );
    // Swap which face screen readers and keyboards reach once the card passes edge-on.
    const swap = setTimeout(() => (shown = target), 260);
    anim.onfinish = () => {
      if (flipper) flipper.style.transform = `rotateY(${to}deg)`;
      anim.cancel();
    };
    return () => clearTimeout(swap);
  });

  const related = (ids: string[]) =>
    ids.map((id) => CARDS_BY_ID.get(id)).filter((c): c is Card => !!c);
</script>

<div class="scene rarity-{card.rarity}" class:calm={motion.calm}>
  <div class="tilt" use:tilt={{ disabled: !interactive }}>
    <div class="flipper" class:show-back={shown} bind:this={flipper}>
      <article class="face front" aria-hidden={shown} inert={shown}>
        <CardArt {card} />
        {#if ornate}
          <div class="band top"><Ornament pantheon={card.pantheon} height={10} /></div>
        {/if}
        <div class="frame" aria-hidden="true"></div>
        <div class="plate">
          <h3 class="name">{cardName(card)}</h3>
          <p class="epithet">{cardEpithet(card)}</p>
          <p class="meta caps">
            <span>{t(`ui.rarity.${card.rarity}`)}</span>
            <span class="pips" aria-hidden="true">
              {#each { length: 5 } as _, i (i)}<i class:on={i < tier}></i>{/each}
            </span>
            <span>{t(`ui.element.${card.element}`)}</span>
          </p>
        </div>
        <div class="shine" aria-hidden="true"></div>
      </article>

      <article class="face back" aria-hidden={!shown} inert={!shown}>
        <h3 class="back-name">{cardName(card)}</h3>
        <p class="back-epithet">{cardEpithet(card)}</p>
        <Ornament pantheon={card.pantheon} height={10} />
        <h4 class="caps">{t('ui.card.story')}</h4>
        <p class="story">{cardStory(card)}</p>
        <p class="source"><span class="caps">{t('ui.card.source')}</span> {cardSource(card)}</p>
        {#if card.relations.allies.length || card.relations.rivals.length}
          <dl class="relations">
            {#if card.relations.allies.length}
              <dt class="caps">{t('ui.card.allies')}</dt>
              <dd>{related(card.relations.allies).map(cardName).join(', ')}</dd>
            {/if}
            {#if card.relations.rivals.length}
              <dt class="caps">{t('ui.card.rivals')}</dt>
              <dd>{related(card.relations.rivals).map(cardName).join(', ')}</dd>
            {/if}
          </dl>
        {/if}
        <h4 class="caps">{t('ui.card.trivia')}</h4>
        <p class="trivia">{cardTrivia(card)}</p>
      </article>
    </div>
  </div>
</div>

<style>
  .scene {
    --accent: var(--rarity-mortal);
    container-type: inline-size;
    width: 100%;
    aspect-ratio: 5 / 7;
    perspective: 1100px;
  }
  .rarity-hero {
    --accent: var(--rarity-hero);
  }
  .rarity-demigod {
    --accent: var(--rarity-demigod);
  }
  .rarity-god {
    --accent: var(--rarity-god);
  }
  .rarity-primordial {
    --accent: var(--rarity-primordial);
  }
  .tilt,
  .flipper {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
  }
  .tilt {
    will-change: transform;
  }
  .flipper.show-back {
    transform: rotateY(180deg);
  }
  .face {
    position: absolute;
    inset: 0;
    border-radius: 3.5cqi;
    overflow: hidden;
    backface-visibility: hidden;
    box-shadow: var(--shadow-3);
  }
  .back {
    transform: rotateY(180deg);
  }

  /* calm: no rotation, the faces crossfade */
  .calm .flipper.show-back {
    transform: none;
  }
  .calm .back {
    transform: none;
  }
  .calm .face {
    backface-visibility: visible;
    transition: opacity var(--dur-base) ease;
  }
  .calm .flipper:not(.show-back) .back,
  .calm .flipper.show-back .front {
    opacity: 0;
  }

  /* frame: one more line of metal per rarity */
  .frame {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    box-shadow:
      inset 0 0 0 1.2cqi var(--ink),
      inset 0 0 0 1.6cqi var(--accent);
  }
  .rarity-hero .frame {
    box-shadow:
      inset 0 0 0 1.2cqi var(--ink),
      inset 0 0 0 1.6cqi var(--accent),
      inset 0 0 0 2.4cqi var(--ink),
      inset 0 0 0 2.7cqi rgb(180 200 220 / 0.6);
  }
  .rarity-demigod .frame,
  .rarity-god .frame {
    box-shadow:
      inset 0 0 0 1cqi var(--ink),
      inset 0 0 0 2.4cqi var(--accent),
      inset 0 0 0 2.8cqi var(--ink),
      inset 0 0 0 3.1cqi var(--accent);
  }
  .rarity-god .frame::before,
  .rarity-demigod .frame::before {
    content: '';
    position: absolute;
    inset: 4cqi;
    border: 0.3cqi solid var(--accent);
    border-radius: 2cqi;
    opacity: 0.5;
  }
  .rarity-primordial .frame {
    box-shadow: inset 0 0 0 1cqi var(--ink);
  }
  .rarity-primordial .frame::after {
    content: '';
    position: absolute;
    inset: 1cqi;
    border-radius: 3cqi;
    padding: 1.8cqi;
    background: conic-gradient(
      from var(--angle, 0deg),
      #e6dcf0,
      #f3e3b4,
      #bfe3d6,
      #c9d8f0,
      #f2d3d6,
      #e6dcf0
    );
    mask:
      linear-gradient(#000 0 0) content-box exclude,
      linear-gradient(#000 0 0);
    animation: pearl 8s linear infinite;
  }
  @property --angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes pearl {
    to {
      --angle: 360deg;
    }
  }
  .band {
    position: absolute;
    inset-inline: 5cqi;
    top: 5cqi;
    color: var(--accent);
    opacity: 0.9;
  }
  .band :global(.ornament) {
    color: var(--accent);
  }

  .plate {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    padding: 14cqi 7cqi 6cqi;
    background: linear-gradient(0deg, rgb(4 6 13 / 0.94) 0, rgb(4 6 13 / 0.82) 55%, transparent);
  }
  .name {
    font-size: 11cqi;
    line-height: 1;
    color: var(--parchment);
  }
  .epithet {
    margin-top: 1.5cqi;
    font-size: 5.4cqi;
    font-style: italic;
    color: var(--gold-pale);
    line-height: 1.2;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1cqi 3cqi;
    margin-top: 3cqi;
    font-size: 4.6cqi;
    color: var(--accent);
  }
  .pips {
    display: inline-flex;
    gap: 1.2cqi;
  }
  .pips i {
    width: 2.4cqi;
    height: 2.4cqi;
    rotate: 45deg;
    border: 0.4cqi solid var(--accent);
    opacity: 0.45;
  }
  .pips i.on {
    background: var(--accent);
    opacity: 1;
  }

  /* shine: glare follows the pointer; foil strength rises with rarity */
  .shine {
    --mx: 50%;
    --my: 50%;
    --tilt: 0;
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    mix-blend-mode: soft-light;
    opacity: calc(0.25 + var(--tilt) * 0.75);
    background: radial-gradient(
      circle at var(--mx) var(--my),
      rgb(255 250 235 / 0.7) 0,
      rgb(255 250 235 / 0.15) 30%,
      transparent 60%
    );
  }
  .rarity-hero .shine,
  .rarity-demigod .shine {
    background:
      radial-gradient(circle at var(--mx) var(--my), rgb(255 250 235 / 0.7) 0, transparent 55%),
      linear-gradient(
        115deg,
        transparent calc(var(--mx) - 22%),
        rgb(255 255 255 / 0.35) var(--mx),
        transparent calc(var(--mx) + 22%)
      );
  }
  .rarity-god .shine {
    mix-blend-mode: overlay;
    background:
      radial-gradient(circle at var(--mx) var(--my), rgb(255 244 210 / 0.8) 0, transparent 50%),
      repeating-linear-gradient(
        120deg,
        rgb(212 173 85 / 0) 0,
        rgb(236 212 150 / 0.35) calc(var(--mx) * 0.2),
        rgb(212 173 85 / 0) calc(var(--mx) * 0.4)
      );
  }
  .rarity-primordial .shine {
    mix-blend-mode: color-dodge;
    opacity: calc(0.35 + var(--tilt) * 0.65);
    background:
      radial-gradient(circle at var(--mx) var(--my), rgb(255 255 255 / 0.55) 0, transparent 45%),
      linear-gradient(
        calc(100deg + var(--tilt) * 60deg),
        rgb(242 211 214 / 0.35),
        rgb(243 227 180 / 0.35),
        rgb(191 227 214 / 0.35),
        rgb(201 216 240 / 0.35),
        rgb(242 211 214 / 0.35)
      );
    background-size:
      100% 100%,
      200% 200%;
    background-position:
      0 0,
      var(--mx) var(--my);
  }
  /* gold-leaf sweep: a band of light crosses god and primordial cards every few seconds */
  .rarity-god .front::after,
  .rarity-primordial .front::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      105deg,
      transparent 40%,
      rgb(255 244 210 / 0.38) 50%,
      transparent 60%
    );
    translate: -120% 0;
    animation: sweep 6s var(--ease-in-out) 1.2s infinite;
  }
  @keyframes sweep {
    0% {
      translate: -120% 0;
    }
    22%,
    100% {
      translate: 120% 0;
    }
  }

  /* back: parchment */
  .back {
    display: flex;
    flex-direction: column;
    gap: 2cqi;
    padding: 7cqi 7cqi 6cqi;
    background:
      radial-gradient(circle at 30% 20%, rgb(255 255 255 / 0.25), transparent 60%), var(--parchment);
    color: #23202e;
    overflow-y: auto;
    scrollbar-width: thin;
  }
  .back :global(.ornament) {
    color: #8a6f33;
    margin-block: 1cqi 2cqi;
  }
  .back-name {
    font-size: 9cqi;
    color: #1b1830;
  }
  .back-epithet {
    font-style: italic;
    font-size: 5cqi;
    color: #5a4520;
  }
  h4 {
    margin: 2cqi 0 0;
    font-size: 4.6cqi;
    font-weight: 400;
    color: #6b5222;
  }
  .story,
  .trivia {
    font-size: 4.6cqi;
    line-height: 1.45;
  }
  .source {
    font-size: 4.2cqi;
    font-style: italic;
    color: #3d3546;
  }
  .source .caps {
    font-style: normal;
    color: #6b5222;
  }
  .relations {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5cqi 3cqi;
    margin: 1cqi 0 0;
    font-size: 4.4cqi;
  }
  .relations dt {
    color: #6b5222;
  }
  .relations dd {
    margin: 0;
  }

  .calm .shine {
    opacity: 0.35;
  }
  .calm .front::after,
  .calm .frame::after {
    animation: none;
  }
</style>
