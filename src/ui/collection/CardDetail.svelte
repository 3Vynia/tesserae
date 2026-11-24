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
  import LookEditor from './LookEditor.svelte';
  import { game } from '../../app/save.svelte';
  import { cardSource } from '../../app/card-text';
  import { CARDS_BY_ID } from '../../data/cards';
  import {
    addTag,
    dissolve,
    DUST,
    MARKET_PRICE,
    removeTag,
    setLocked,
    SHOWCASE_MAX,
    toggleShowcase,
    toggleWish,
  } from '../../engine/vault';

  interface Props {
    card: Card;
    owned: OwnedCard | undefined;
    transitionName: string;
    onclose: () => void;
    /** Called when the player turns the card to read its back. */
    onflip?: () => void;
  }
  let { card, owned, transitionName, onclose, onflip }: Props = $props();

  let dialog = $state<HTMLDialogElement>();
  let closeButton = $state<HTMLButtonElement>();
  let flipped = $state(false);
  let tab = $state<'card' | 'info' | 'look'>('card');
  let tagDraft = $state('');
  let confirmDissolve = $state(false);
  let said = $state('');

  const wished = $derived(game.save.wishlist.includes(card.id));
  const shown = $derived(game.save.profile.showcase.includes(card.id));
  const showcaseFull = $derived(game.save.profile.showcase.length >= SHOWCASE_MAX);
  const spare = $derived(owned && !owned.locked ? owned.count - 1 : 0);
  const inAlbums = $derived(game.save.albums.filter((a) => a.cards.includes(card.id)));
  const tabs = $derived(owned ? (['card', 'info', 'look'] as const) : (['card', 'info'] as const));

  function doDissolve(): void {
    let got = { copies: 0, dust: 0 };
    game.update((s) => (got = dissolve(s, [card.id], CARDS_BY_ID)));
    said = t('ui.vault.dissolved', got);
    confirmDissolve = false;
  }
  function doTag(e: SubmitEvent): void {
    e.preventDefault();
    if (!tagDraft.trim()) return;
    game.update((s) => addTag(s, [card.id], tagDraft));
    tagDraft = '';
  }

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
      <CardView {card} {flipped} look={owned?.look} />
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

      <div class="quick">
        {#if owned}
          <button
            type="button"
            class="quick-btn"
            aria-pressed={owned.locked}
            onclick={() => game.update((s) => setLocked(s, [card.id], !owned.locked))}
          >
            <Icon name={owned.locked ? 'lock' : 'unlock'} size={18} />
            {owned.locked ? t('ui.vault.locked') : t('ui.vault.lock')}
          </button>
          <button
            type="button"
            class="quick-btn"
            aria-pressed={shown}
            disabled={!shown && showcaseFull}
            onclick={() => game.update((s) => toggleShowcase(s, card.id))}
          >
            <Icon name="profile" size={18} />
            {shown ? t('ui.vault.inShowcase') : t('ui.vault.toShowcase')}
          </button>
        {/if}
        <button
          type="button"
          class="quick-btn"
          aria-pressed={wished}
          onclick={() => game.update((s) => toggleWish(s, card.id))}
        >
          <Icon name="wish" size={18} />
          {wished ? t('ui.vault.wished') : t('ui.vault.wish')}
        </button>
        {#if owned && spare > 0}
          <button type="button" class="quick-btn danger" onclick={() => (confirmDissolve = true)}>
            <Icon name="dissolve" size={18} />{t('ui.vault.dissolveSpare', { count: spare })}
          </button>
        {/if}
      </div>
      {#if confirmDissolve}
        <div class="confirm" role="alertdialog" aria-labelledby="dissolve-q">
          <p id="dissolve-q">
            {t('ui.vault.dissolveOne', { count: spare, dust: spare * DUST[card.rarity] })}
          </p>
          <div class="confirm-actions">
            <Button variant="gilt" icon="dissolve" onclick={doDissolve}>
              {t('ui.vault.dissolveGo', { count: spare })}
            </Button>
            <Button variant="quiet" onclick={() => (confirmDissolve = false)}>
              {t('ui.vault.keep')}
            </Button>
          </div>
        </div>
      {/if}
      <p class="said" role="status">{said}</p>

      <div class="tabs" role="tablist" aria-label={t('ui.vault.detailTabs')}>
        {#each tabs as id (id)}
          <button
            type="button"
            role="tab"
            id="tab-{id}"
            aria-selected={tab === id}
            aria-controls="panel-{id}"
            onclick={() => (tab = id)}
          >
            {t(`ui.vault.tabs.${id}`)}
          </button>
        {/each}
      </div>

      {#if tab === 'card'}
        <div role="tabpanel" id="panel-card" aria-labelledby="tab-card">
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
              onclick={() => {
                flipped = !flipped;
                if (flipped) onflip?.();
              }}
              aria-pressed={flipped}
            >
              {flipped ? t('ui.detail.flipBack') : t('ui.detail.flip')}
            </Button>
          </div>
        </div>
      {:else if tab === 'info'}
        <div role="tabpanel" id="panel-info" aria-labelledby="tab-info" class="panel">
          <dl class="facts">
            {#if owned}
              <div>
                <dt>{t('ui.vault.info.copies')}</dt>
                <dd>{fmtNumber(owned.count)}</dd>
              </div>
              <div>
                <dt>{t('ui.vault.info.found')}</dt>
                <dd>{fmtDate(owned.firstAt, { dateStyle: 'long' })}</dd>
              </div>
            {/if}
            <div>
              <dt>{t('ui.vault.info.dust')}</dt>
              <dd>{t('ui.vault.info.dustValue', { dust: DUST[card.rarity] })}</dd>
            </div>
            <div>
              <dt>{t('ui.vault.info.market')}</dt>
              <dd>{t('ui.vault.info.dustValue', { dust: MARKET_PRICE[card.rarity] })}</dd>
            </div>
            <div class="wide">
              <dt>{t('ui.vault.info.albums')}</dt>
              <dd>
                {inAlbums.length
                  ? inAlbums.map((a) => a.name).join(', ')
                  : t('ui.vault.info.noAlbums')}
              </dd>
            </div>
            <div class="wide">
              <dt>{t('ui.vault.info.source')}</dt>
              <dd>{cardSource(card)}</dd>
            </div>
          </dl>
          {#if owned}
            <h3 class="caps">{t('ui.vault.list.tags')}</h3>
            <ul class="tag-chips">
              {#each owned.tags as tag (tag)}
                <li>
                  {tag}
                  <button
                    type="button"
                    aria-label={t('ui.vault.removeTag', { tag })}
                    onclick={() => game.update((s) => removeTag(s, [card.id], tag))}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </li>
              {/each}
            </ul>
            <form class="tag-form" onsubmit={doTag}>
              <label class="visually-hidden" for="detail-tag">{t('ui.vault.tagLabel')}</label>
              <input
                id="detail-tag"
                maxlength="24"
                bind:value={tagDraft}
                placeholder={t('ui.vault.tagLabel')}
                disabled={owned.tags.length >= 8}
              />
              <Button variant="engraved" icon="tag" type="submit" disabled={!tagDraft.trim()}>
                {t('ui.vault.tagGo')}
              </Button>
            </form>
          {/if}
        </div>
      {:else if owned}
        <div role="tabpanel" id="panel-look" aria-labelledby="tab-look" class="panel">
          <LookEditor cardId={card.id} {owned} />
        </div>
      {/if}
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
  .quick {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }
  .quick-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
    background: rgb(7 10 20 / 0.85);
    color: var(--parchment);
    font: inherit;
    cursor: pointer;
    transition: transform var(--dur-press) var(--ease-out);
  }
  .quick-btn:active:not(:disabled) {
    transform: scale(0.96);
  }
  .quick-btn[aria-pressed='true'] {
    border-color: var(--gold);
    background: rgb(212 173 85 / 0.18);
    color: var(--gold-pale);
  }
  .quick-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .quick-btn.danger {
    border-color: var(--danger);
    color: var(--danger);
  }
  .confirm {
    display: grid;
    gap: var(--space-3);
    margin-top: var(--space-3);
    padding: var(--space-4);
    border: 1px solid var(--danger);
    border-radius: var(--radius-sheet);
  }
  .confirm-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .said {
    min-height: 1.4em;
    margin: var(--space-2) 0;
    font-style: italic;
    color: var(--gold-pale);
  }
  .tabs {
    display: flex;
    gap: var(--space-1);
    margin-bottom: var(--space-5);
    border-bottom: 1px solid var(--rule);
  }
  .tabs button {
    min-height: 44px;
    padding: 0 var(--space-4);
    border: 0;
    border-bottom: 2px solid transparent;
    background: none;
    color: var(--parchment-dim);
    font-family: var(--font-caps);
    font-size: var(--text-lg);
    letter-spacing: var(--tracking-caps);
    cursor: pointer;
  }
  .tabs button[aria-selected='true'] {
    border-bottom-color: var(--gold);
    color: var(--gold-pale);
  }
  .facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-4);
    margin: 0 0 var(--space-5);
  }
  .facts div {
    display: grid;
    gap: 2px;
  }
  .facts .wide {
    grid-column: 1 / -1;
  }
  .facts dt {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .facts dd {
    margin: 0;
    color: var(--parchment);
    font-variant-numeric: lining-nums;
  }
  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin: 0 0 var(--space-3);
    padding: 0;
    list-style: none;
  }
  .tag-chips li {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding-inline-start: var(--space-3);
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
    color: var(--parchment);
  }
  .tag-chips button {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 0;
    background: none;
    color: var(--text-muted);
    cursor: pointer;
  }
  .tag-form {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .tag-form input {
    flex: 1;
    min-width: 10rem;
    min-height: 44px;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius-control);
    background: var(--ink);
    color: var(--parchment);
    font: inherit;
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
