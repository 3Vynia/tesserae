<script lang="ts">
  import { t } from '../../i18n/i18n.svelte';
  import { CARDS } from '../../data/cards';
  import { CHAPTERS } from '../../data/stages';
  import { PULL_COST } from '../../engine/gacha';
  import { game } from '../save.svelte';
  import { router } from '../router.svelte';
  import Oculus from '../../ui/sky/Oculus.svelte';
  import PortalCard from '../../ui/game/PortalCard.svelte';
  import Frame from '../../ui/game/Frame.svelte';
  import QuestList from '../../ui/game/QuestList.svelte';
  import Icon from '../../ui/icons/Icon.svelte';
  import Ornament from '../../ui/Ornament.svelte';

  const ready = $derived(game.status === 'ready');
  const owned = $derived(ready ? CARDS.filter((c) => game.save.owned[c.id]).length : 0);
  const pulls = $derived(ready ? Math.floor(game.save.starlight / PULL_COST) : 0);
  const next = $derived(
    ready
      ? CHAPTERS.flatMap((c) => c.stages).find((s) => !game.save.battle.cleared.includes(s.id))?.id
      : undefined,
  );
  // 4 x 4 mosaic on the vault portal, lit in proportion to the collection.
  const litTiles = $derived(Math.round((owned / CARDS.length) * 16));
</script>

<div class="hub">
  <Oculus />

  <section class="title-block">
    <h1 class="title">{t('ui.app.title')}</h1>
    <p class="tagline">{t('ui.home.tagline')}</p>
  </section>

  {#if ready}
    <section class="quest-block" aria-labelledby="quests-title">
      <Frame tone="ink" class="quests">
        <h2 id="quests-title" class="quests-title caps">
          <Icon name="quest" size={20} />{t('ui.hub.quests')}
        </h2>
        <QuestList />
      </Frame>
    </section>
  {/if}

  <nav class="portals" aria-label={t('ui.hub.label')}>
    <div class="slot one">
      <PortalCard
        href={router.href('collection')}
        tone="vault"
        title={t('ui.nav.collection')}
        status={t('ui.collection.progress', { owned, total: CARDS.length })}
      >
        {#snippet art()}
          <svg class="mosaic" viewBox="0 0 100 100">
            {#each { length: 16 } as _, i (i)}
              <rect
                x={6 + (i % 4) * 23}
                y={6 + Math.floor(i / 4) * 23}
                width="20"
                height="20"
                rx="1.5"
                class:lit={i < litTiles}
                transform="rotate({((i * 37) % 7) - 3} {16 + (i % 4) * 23} {16 +
                  Math.floor(i / 4) * 23})"
              />
            {/each}
          </svg>
        {/snippet}
      </PortalCard>
    </div>
    <div class="slot two">
      <PortalCard
        href={router.href('summon')}
        tone="summon"
        title={t('ui.nav.summon')}
        status={t('ui.hub.pulls', { count: pulls })}
      >
        {#snippet art()}
          <span class="glyph"><Icon name="summon" size={120} /></span>
        {/snippet}
      </PortalCard>
    </div>
    <div class="slot three">
      <PortalCard
        href={router.href('battle')}
        tone="battle"
        title={t('ui.nav.battle')}
        status={next ? t('ui.hub.next', { id: next }) : t('ui.hub.allClear')}
      >
        {#snippet art()}
          <span class="glyph"><Icon name="battle" size={120} /></span>
          <span class="band"><Ornament pantheon="greek" height={10} /></span>
        {/snippet}
      </PortalCard>
    </div>
  </nav>
</div>

<style>
  .hub {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    grid-template-areas: 'title portals' 'quests portals';
    grid-template-rows: 1fr auto;
    align-items: end;
    gap: var(--space-5) var(--space-6);
    min-height: 100dvh;
    padding: 6rem var(--gutter) 8.5rem;
    isolation: isolate;
    overflow: hidden;
  }
  .hub :global(.oculus) {
    z-index: -1;
  }
  .title-block {
    grid-area: title;
    display: grid;
    gap: var(--space-4);
    align-content: end;
  }
  .title {
    font-family: var(--font-caps);
    font-size: clamp(3rem, 1rem + 7vw, 6.5rem);
    letter-spacing: 0.14em;
    line-height: 0.95;
    color: var(--parchment);
    text-shadow: 0 2px 24px rgb(7 10 20 / 0.6);
    animation: rise var(--dur-ceremony) var(--ease-out) 300ms both;
  }
  .tagline {
    font-size: var(--text-xl);
    font-style: italic;
    color: var(--gold-pale);
    max-width: 34ch;
    animation: rise var(--dur-ceremony) var(--ease-out) 450ms both;
  }
  .quest-block {
    grid-area: quests;
  }
  .quest-block :global(.quests) {
    max-width: 30rem;
    animation: rise var(--dur-ceremony) var(--ease-out) 600ms both;
  }
  .quests-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
    font-size: var(--text-lg);
    font-weight: 400;
    color: var(--gold);
  }
  .portals {
    grid-area: portals;
    align-self: center;
    padding-inline: var(--space-4);
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-4);
    align-items: end;
    padding-bottom: var(--space-4);
  }
  /* the three portals sit in a gentle fan, like a hand of cards */
  .slot {
    transform-origin: 50% 120%;
    animation: deal 900ms var(--ease-settle) both;
  }
  .one {
    rotate: -5deg;
    translate: 0 14px;
    animation-delay: 500ms;
  }
  .two {
    animation-delay: 620ms;
  }
  .three {
    rotate: 5deg;
    translate: 0 14px;
    animation-delay: 740ms;
  }
  @keyframes deal {
    from {
      opacity: 0;
      transform: translateY(60px) scale(0.9);
    }
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
  }
  .mosaic {
    width: 78%;
  }
  .mosaic rect {
    fill: #142352;
    stroke: var(--lapis-bright);
    stroke-width: 0.8;
  }
  .mosaic rect.lit {
    fill: var(--gold);
    stroke: var(--gold-pale);
  }
  .glyph {
    display: grid;
    place-items: center;
    filter: drop-shadow(0 4px 10px rgb(0 0 0 / 0.6));
  }
  .band {
    position: absolute;
    inset-inline: 6%;
    bottom: -4%;
  }
  @media (max-width: 900px) {
    .hub {
      grid-template-columns: 1fr;
      grid-template-areas: 'title' 'portals' 'quests';
      grid-template-rows: auto;
      align-items: start;
      padding-top: 5rem;
      overflow: visible;
    }
    .title {
      font-size: clamp(2.4rem, 1rem + 7vw, 4rem);
    }
    .tagline {
      font-size: var(--text-lg);
    }
    .portals {
      gap: var(--space-2);
      padding-inline: 0;
    }
  }
  :global([data-motion='calm']) .slot,
  :global([data-motion='calm']) .title,
  :global([data-motion='calm']) .tagline,
  :global([data-motion='calm']) .quest-block :global(.quests) {
    animation-name: fade;
    animation-duration: var(--dur-base);
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
