<script lang="ts">
  import { onMount } from 'svelte';
  import type { Card } from '../../data/schema';
  import { t } from '../../i18n/i18n.svelte';
  import { cardEpithet, cardName, skillDescription, skillName } from '../../app/card-text';
  import CardView from '../card/Card.svelte';
  import Icon from '../icons/Icon.svelte';
  import Button from '../Button.svelte';

  // Browse the cards of a banner one by one: big, tiltable, and with the back one tap away.
  interface Props {
    cards: Card[];
    start: number;
    title: string;
    onclose: () => void;
  }
  let { cards, start, title, onclose }: Props = $props();

  let index = $state(0);
  let flipped = $state(false);
  let dir = $state(1);
  let dialog = $state<HTMLDialogElement>();
  let startX = 0;
  const card = $derived(cards[index]);

  function go(step: number): void {
    dir = step;
    flipped = false;
    index = (index + step + cards.length) % cards.length;
  }

  onMount(() => {
    index = Math.max(0, Math.min(cards.length - 1, start));
    dialog?.showModal();
    return () => dialog?.close();
  });
</script>

<dialog
  bind:this={dialog}
  class="viewer"
  aria-label={title}
  oncancel={(e) => {
    e.preventDefault();
    onclose();
  }}
  onkeydown={(e) => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  }}
>
  <header>
    <p class="caps">{title}</p>
    <p class="count">{index + 1} / {cards.length}</p>
    <button type="button" class="round" onclick={onclose} aria-label={t('ui.detail.close')}>
      <Icon name="close" size={22} />
    </button>
  </header>

  {#if card}
    <div
      class="stage"
      role="presentation"
      onpointerdown={(e) => (startX = e.clientX)}
      onpointerup={(e) => {
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <button
        type="button"
        class="round nav"
        onclick={() => go(-1)}
        aria-label={t('ui.hub.previous')}
      >
        <Icon name="back" size={22} />
      </button>
      {#key card.id}
        <div class="card" style:--dir={dir}>
          <CardView {card} {flipped} />
        </div>
      {/key}
      <button
        type="button"
        class="round nav next"
        onclick={() => go(1)}
        aria-label={t('ui.hub.next')}
      >
        <Icon name="back" size={22} />
      </button>
    </div>

    <div class="info" aria-live="polite">
      <h2>{cardName(card)}</h2>
      <p class="epithet">{cardEpithet(card)}</p>
      <p class="tags caps">
        <span style:color="var(--rarity-{card.rarity})">{t(`ui.rarity.${card.rarity}`)}</span>
        <span>{t(`ui.pantheon.${card.pantheon}`)}</span>
        <span>{t(`ui.element.${card.element}`)}</span>
      </p>
      <ul class="skills">
        {#each [card.skills.active, card.skills.ultimate] as skill (skill.id)}
          <li><strong>{skillName(card, skill)}</strong> {skillDescription(card, skill)}</li>
        {/each}
      </ul>
      <Button
        variant="engraved"
        icon="flip"
        onclick={() => (flipped = !flipped)}
        aria-pressed={flipped}
      >
        {flipped ? t('ui.detail.flipBack') : t('ui.detail.flip')}
      </Button>
    </div>
  {/if}

  <div class="dots" aria-hidden="true">
    {#each cards as c, i (c.id)}<i class:on={i === index}></i>{/each}
  </div>
</dialog>

<style>
  .viewer {
    width: min(60rem, 100vw - 1rem);
    max-height: calc(100dvh - 1rem);
    padding: var(--space-4) var(--space-5) var(--space-5);
    border: 1px solid var(--rule-strong);
    border-radius: 18px;
    background:
      radial-gradient(circle at 35% 40%, rgb(43 63 134 / 0.55), transparent 60%), var(--ink);
    color: var(--text);
    box-shadow: var(--shadow-3);
    overflow: auto;
  }
  .viewer[open] {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    grid-template-areas: 'head head' 'stage info' 'dots dots';
    gap: var(--space-4) var(--space-6);
    align-items: center;
  }
  .viewer::backdrop {
    background: rgb(4 6 13 / 0.82);
  }
  header {
    grid-area: head;
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  header .caps {
    color: var(--gold);
    letter-spacing: 0.08em;
  }
  .count {
    margin-inline-start: auto;
    color: var(--text-muted);
    font-variant-numeric: lining-nums;
  }
  .round {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    flex: none;
    border: 1px solid var(--rule-strong);
    border-radius: 50%;
    background: rgb(7 10 20 / 0.85);
    color: var(--gold-pale);
    cursor: pointer;
    transition: transform var(--dur-press) var(--ease-out);
  }
  .round:active {
    transform: scale(0.92);
  }
  .stage {
    grid-area: stage;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-3);
    touch-action: pan-y;
  }
  .next :global(svg) {
    rotate: 180deg;
  }
  .card {
    width: min(20rem, 100%);
    justify-self: center;
    animation: slide 420ms var(--ease-out) both;
  }
  @keyframes slide {
    from {
      opacity: 0;
      transform: translateX(calc(var(--dir) * 40px)) rotate(calc(var(--dir) * 4deg));
    }
  }
  .info {
    grid-area: info;
    display: grid;
    gap: var(--space-3);
    align-content: center;
    justify-items: start;
  }
  h2 {
    font-size: var(--text-5xl);
  }
  .epithet {
    font-style: italic;
    font-size: var(--text-xl);
    color: var(--gold-pale);
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
    color: var(--text-muted);
  }
  .skills {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: var(--space-2);
    color: var(--parchment-dim);
  }
  .skills strong {
    font-family: var(--font-display);
    font-weight: 400;
    color: var(--parchment);
    margin-inline-end: var(--space-1);
  }
  .dots {
    grid-area: dots;
    display: flex;
    justify-content: center;
    gap: var(--space-2);
  }
  .dots i {
    width: 8px;
    height: 8px;
    rotate: 45deg;
    border: 1.5px solid var(--gold);
  }
  .dots i.on {
    background: var(--gold);
  }
  @media (max-width: 760px) {
    .viewer[open] {
      grid-template-columns: 1fr;
      grid-template-areas: 'head' 'stage' 'info' 'dots';
    }
    .card {
      width: min(15rem, 100%);
    }
    h2 {
      font-size: var(--text-4xl);
    }
  }
  :global([data-motion='calm']) .card {
    animation-name: fade;
    animation-duration: var(--dur-base);
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
