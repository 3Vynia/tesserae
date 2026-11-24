<script lang="ts">
  import { onMount } from 'svelte';
  import type { Card } from '../../data/schema';
  import { STATS } from '../../data/schema';
  import type { OwnedCard } from '../../engine/save';
  import { fmtDate, fmtNumber, t } from '../../i18n/i18n.svelte';
  import { cardEpithet, cardName, skillDescription, skillName } from '../../app/card-text';
  import CardView from '../card/Card.svelte';
  import Button from '../Button.svelte';
  import Icon from '../icons/Icon.svelte';

  interface Props {
    card: Card;
    owned: OwnedCard | undefined;
    transitionName: string;
    onclose: () => void;
  }
  let { card, owned, transitionName, onclose }: Props = $props();

  let dialog = $state<HTMLDialogElement>();
  let closeButton = $state<HTMLButtonElement>();
  let flipped = $state(false);

  const skills = $derived([
    {
      kind: 'active',
      skill: card.skills.active,
      note: t('ui.card.cooldown', { cooldown: card.skills.active.cooldown }),
    },
    {
      kind: 'ultimate',
      skill: card.skills.ultimate,
      note: t('ui.card.cost', { cost: card.skills.ultimate.energy }),
    },
    ...card.skills.passives.map((skill) => ({ kind: 'passive', skill, note: '' })),
  ]);

  onMount(() => {
    dialog?.showModal();
    // Start at the top with the card in view; focus the close button without scrolling.
    closeButton?.focus({ preventScroll: true });
    if (dialog) dialog.scrollTop = 0;
    return () => dialog?.close();
  });
</script>

<dialog
  bind:this={dialog}
  class="detail rarity-{card.rarity}"
  aria-labelledby="detail-name"
  oncancel={(e) => {
    e.preventDefault();
    onclose();
  }}
>
  <div class="layout">
    <div class="stage" class:missing={!owned} style:view-transition-name={transitionName}>
      <CardView {card} {flipped} />
    </div>

    <div class="info">
      <header>
        <h2 id="detail-name">{cardName(card)}</h2>
        <p class="epithet">{cardEpithet(card)}</p>
        <p class="tags caps">
          <span>{t(`ui.rarity.${card.rarity}`)}</span>
          <span>{t(`ui.pantheon.${card.pantheon}`)}</span>
          <span>{t(`ui.element.${card.element}`)}</span>
        </p>
      </header>

      {#if owned}
        <p class="owned">
          {t('ui.detail.level', { level: owned.level })}
          <span>{t('ui.detail.copies', { count: owned.count })}</span>
          <span>
            {t('ui.detail.found', { date: fmtDate(owned.firstAt, { dateStyle: 'medium' }) })}
          </span>
        </p>
      {:else}
        <p class="missing-note">{t('ui.detail.missing')}</p>
      {/if}

      <dl class="stats" aria-label={t('ui.card.stats')}>
        {#each STATS as stat (stat)}
          <div>
            <dt class="caps">{t(`ui.stat.${stat}`)}</dt>
            <dd>{fmtNumber(card.stats[stat])}</dd>
          </div>
        {/each}
      </dl>

      <section aria-labelledby="skills-heading">
        <h3 id="skills-heading" class="caps">{t('ui.card.skills')}</h3>
        <ul class="skills">
          {#each skills as { kind, skill, note } (skill.id)}
            <li>
              <p class="skill-head">
                <span class="kind caps">{t(`ui.card.${kind}`)}</span>
                <strong>{skillName(card, skill)}</strong>
                {#if note}<span class="note">{note}</span>{/if}
              </p>
              <p class="desc">{skillDescription(card, skill)}</p>
            </li>
          {/each}
        </ul>
      </section>

      <div class="actions">
        <Button
          variant="engraved"
          icon="flip"
          onclick={() => (flipped = !flipped)}
          aria-pressed={flipped}
        >
          {flipped ? t('ui.detail.flipBack') : t('ui.detail.flip')}
        </Button>
      </div>
    </div>
  </div>
  <button
    class="close"
    type="button"
    bind:this={closeButton}
    onclick={onclose}
    aria-label={t('ui.detail.close')}
  >
    <Icon name="close" size={24} />
  </button>
</dialog>

<style>
  .detail {
    width: min(64rem, 100vw - 2rem);
    max-height: calc(100dvh - 2rem);
    padding: 0;
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius-sheet);
    background:
      radial-gradient(circle at 25% 20%, rgb(43 63 134 / 0.35), transparent 60%), var(--ink);
    color: var(--text);
    box-shadow: var(--shadow-3);
    overflow: auto;
  }
  .detail::backdrop {
    background: rgb(4 6 13 / 0.78);
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(14rem, 22rem) minmax(0, 1fr);
    gap: var(--space-7);
    padding: var(--space-7);
    align-items: start;
  }
  .stage {
    position: sticky;
    top: 0;
  }
  .stage.missing {
    filter: grayscale(0.85) brightness(0.55);
  }
  header {
    display: grid;
    gap: var(--space-2);
    margin-bottom: var(--space-5);
  }
  h2 {
    font-size: var(--text-5xl);
    padding-inline-end: var(--space-7);
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
  .owned,
  .missing-note {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
    padding: var(--space-3) 0;
    border-block: 1px solid var(--rule);
    color: var(--parchment-dim);
  }
  .missing-note {
    font-style: italic;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-3);
    margin: var(--space-5) 0;
  }
  .stats div {
    display: grid;
    gap: var(--space-1);
  }
  .stats dt {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .stats dd {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-variant-numeric: lining-nums tabular-nums;
    color: var(--parchment);
  }
  h3 {
    font-size: var(--text-lg);
    font-weight: 400;
    color: var(--gold);
    margin-bottom: var(--space-3);
  }
  .skills {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-4);
  }
  .skill-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-1) var(--space-3);
  }
  .kind {
    font-size: var(--text-sm);
    color: var(--gold);
  }
  .skill-head strong {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: var(--text-xl);
    color: var(--parchment);
  }
  .note {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .desc {
    color: var(--parchment-dim);
  }
  .actions {
    margin-top: var(--space-6);
  }
  .close {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--rule);
    border-radius: var(--radius-control);
    background: var(--ink);
    color: var(--gold-pale);
    cursor: pointer;
    transition: transform var(--dur-press) var(--ease-out);
  }
  .close:active {
    transform: scale(0.95);
  }
  @media (max-width: 760px) {
    .detail {
      width: 100vw;
      max-width: 100vw;
      max-height: 100dvh;
      height: 100dvh;
      border-radius: 0;
      border: 0;
    }
    .layout {
      grid-template-columns: 1fr;
      padding: var(--space-7) var(--space-4) var(--space-6);
      gap: var(--space-5);
    }
    .stage {
      position: static;
      width: min(18rem, 78vw);
      margin-inline: auto;
    }
    .stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
