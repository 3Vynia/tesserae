<script lang="ts" generics="T">
  import { onMount, type Snippet } from 'svelte';
  import { t } from '../../i18n/i18n.svelte';
  import Icon from '../icons/Icon.svelte';
  import { motion } from '../motion/motion.svelte';

  // Rotating banners on the hub. Advances every few seconds; pauses while hovered, focused or
  // when motion is calm. Arrows, dots and swipes move it by hand.
  interface Props {
    items: T[];
    label: string;
    href: (item: T) => string;
    name: (item: T) => string;
    slide: Snippet<[T]>;
    interval?: number;
  }
  let { items, label, href, name, slide, interval = 7000 }: Props = $props();

  let index = $state(0);
  let paused = $state(false);
  let startX = 0;
  const go = (i: number) => (index = (i + items.length) % items.length);

  onMount(() => {
    const id = setInterval(() => {
      if (!paused && !motion.calm && document.visibilityState === 'visible') go(index + 1);
    }, interval);
    return () => clearInterval(id);
  });
</script>

<section
  class="carousel"
  aria-roledescription="carousel"
  aria-label={label}
  onpointerenter={() => (paused = true)}
  onpointerleave={() => (paused = false)}
  onfocusin={() => (paused = true)}
  onfocusout={() => (paused = false)}
>
  <div
    class="viewport"
    role="presentation"
    onpointerdown={(e) => (startX = e.clientX)}
    onpointerup={(e) => {
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    }}
  >
    <div class="track" style:transform="translateX({-index * 100}%)">
      {#each items as item, i (i)}
        <a
          class="slide"
          href={href(item)}
          aria-roledescription="slide"
          aria-label={name(item)}
          aria-hidden={i !== index}
          tabindex={i === index ? 0 : -1}
          draggable="false"
        >
          {@render slide(item)}
        </a>
      {/each}
    </div>
  </div>
  <div class="controls">
    <button
      type="button"
      class="arrow"
      onclick={() => go(index - 1)}
      aria-label={t('ui.hub.previous')}
    >
      <Icon name="back" size={20} />
    </button>
    <div class="dots">
      {#each items as item, i (i)}
        <button
          type="button"
          class="dot"
          class:on={i === index}
          aria-label={name(item)}
          aria-current={i === index ? 'true' : undefined}
          onclick={() => go(i)}
        ></button>
      {/each}
    </div>
    <button
      type="button"
      class="arrow next"
      onclick={() => go(index + 1)}
      aria-label={t('ui.hub.next')}
    >
      <Icon name="back" size={20} />
    </button>
  </div>
</section>

<style>
  .carousel {
    display: grid;
    gap: var(--space-3);
  }
  .viewport {
    overflow: hidden;
    border-radius: 16px;
    touch-action: pan-y;
  }
  .track {
    display: flex;
    transition: transform 620ms var(--ease-in-out);
  }
  .slide {
    flex: 0 0 100%;
    display: block;
    color: inherit;
    text-decoration: none;
    user-select: none;
  }
  .slide:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: -3px;
    border-radius: 16px;
  }
  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
  }
  .arrow {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--rule-strong);
    border-radius: 50%;
    background: rgb(7 10 20 / 0.85);
    color: var(--gold-pale);
    cursor: pointer;
    transition: transform var(--dur-press) var(--ease-out);
  }
  .arrow:active {
    transform: scale(0.92);
  }
  .arrow.next :global(svg) {
    rotate: 180deg;
  }
  .dots {
    display: flex;
    gap: var(--space-2);
  }
  .dot {
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    position: relative;
  }
  .dot::after {
    content: '';
    position: absolute;
    inset: 10px;
    rotate: 45deg;
    border: 1.5px solid var(--gold);
    transition:
      background-color var(--dur-quick) ease,
      scale var(--dur-quick) var(--ease-out);
  }
  .dot.on::after {
    background: var(--gold);
    scale: 1.25;
  }
  :global([data-motion='calm']) .track {
    transition-duration: var(--dur-base);
  }
</style>
