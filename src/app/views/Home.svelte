<script lang="ts">
  import { t, fmtDate } from '../../i18n/i18n.svelte';
  import { CARDS } from '../../data/cards';
  import { CHAPTERS } from '../../data/stages';
  import { NEWS } from '../../data/news';
  import { bannersFor, type Banner } from '../../engine/gacha';
  import { game } from '../save.svelte';
  import { router } from '../router.svelte';
  import Oculus from '../../ui/sky/Oculus.svelte';
  import Carousel from '../../ui/game/Carousel.svelte';
  import BannerArt from '../../ui/summon/BannerArt.svelte';
  import EventArt from '../../ui/game/EventArt.svelte';
  import Frame from '../../ui/game/Frame.svelte';
  import QuestList from '../../ui/game/QuestList.svelte';
  import Icon from '../../ui/icons/Icon.svelte';
  import { clock, untilParts } from '../clock.svelte';
  import { wheelReady } from '../../engine/rewards';
  import { weekEnds, workshopRotation } from '../../engine/vault';

  type Slide =
    | { kind: 'banner'; banner: Banner }
    | { kind: 'event'; id: 'chapter-two' | 'tower'; route: 'battle' };

  const now = Date.now();
  const [standing, ...weekly] = bannersFor(now, CARDS);
  const slides: Slide[] = [
    ...weekly.map((banner) => ({ kind: 'banner' as const, banner })),
    { kind: 'event', id: 'chapter-two', route: 'battle' },
    ...(standing ? [{ kind: 'banner' as const, banner: standing }] : []),
    { kind: 'event', id: 'tower', route: 'battle' },
  ];

  const slideName = (s: Slide) =>
    s.kind === 'banner'
      ? s.banner.featured
        ? t('ui.summon.banner.featured', { pantheon: t(`ui.pantheonInline.${s.banner.featured}`) })
        : t('ui.summon.banner.standing')
      : t(`ui.hub.slides.${s.id}.title`);

  const ready = $derived(game.status === 'ready');
  const wheel = $derived(ready ? wheelReady(game.save, clock.now) : null);
  const span = (at: number) => {
    const { h, m } = untilParts(at, clock.now);
    return h >= 24
      ? t('ui.time.dh', { d: Math.floor(h / 24), h: h % 24 })
      : t('ui.time.hm', { h, m });
  };
  const stages = CHAPTERS.flatMap((c) => c.stages);
  const modes = $derived(
    ready
      ? [
          {
            id: 'campaign',
            icon: 'battle' as const,
            route: 'battle' as const,
            value: t('ui.hub.modes.campaignValue', {
              done: game.save.battle.cleared.length,
              total: stages.length,
            }),
          },
          {
            id: 'tower',
            icon: 'tower' as const,
            route: 'battle' as const,
            value: t('ui.hub.modes.towerValue', { floor: game.save.battle.tower + 1 }),
          },
          {
            id: 'vault',
            icon: 'collection' as const,
            route: 'collection' as const,
            value: t('ui.collection.progress', {
              owned: CARDS.filter((c) => game.save.owned[c.id]).length,
              total: CARDS.length,
            }),
          },
          {
            id: 'wheel',
            icon: 'wheel' as const,
            route: 'wheel' as const,
            value: wheel?.free
              ? t('ui.hub.modes.wheelReady')
              : t('ui.hub.modes.wheelIn', { time: span(wheel?.nextAt ?? 0) }),
          },
          {
            id: 'workshop',
            icon: 'workshop' as const,
            route: 'workshop' as const,
            value: game.save.cosmetics.gifts.includes(workshopRotation(clock.now).id)
              ? t('ui.hub.modes.benchIn', { time: span(weekEnds(clock.now)) })
              : t('ui.hub.modes.giftReady'),
          },
          {
            id: 'market',
            icon: 'market' as const,
            route: 'market' as const,
            value: t('ui.hub.modes.stallIn', { time: span(weekEnds(clock.now)) }),
          },
        ]
      : [],
  );
</script>

<div class="hub">
  <div class="backdrop"><Oculus /></div>
  <h1 class="visually-hidden">{t('ui.app.title')}</h1>

  <div class="main">
    <Carousel
      items={slides}
      label={t('ui.hub.label')}
      href={(s) => router.href(s.kind === 'banner' ? 'summon' : s.route)}
      name={slideName}
    >
      {#snippet slide(s)}
        {#if s.kind === 'banner'}
          <BannerArt banner={s.banner} compact />
        {:else}
          <EventArt
            pantheon={s.id === 'tower' ? 'mesopotamian' : 'norse'}
            icon={s.id === 'tower' ? 'tower' : 'battle'}
            title={t(`ui.hub.slides.${s.id}.title`)}
            sub={t(`ui.hub.slides.${s.id}.sub`)}
            chip={t(`ui.hub.slides.${s.id}.chip`)}
          />
        {/if}
      {/snippet}
    </Carousel>

    <ul class="modes">
      {#each modes as mode (mode.id)}
        <li>
          <a class="mode" href={router.href(mode.route)}>
            <span class="mode-icon"><Icon name={mode.icon} size={30} /></span>
            <span class="mode-title caps">{t(`ui.hub.modes.${mode.id}`)}</span>
            <span class="mode-value">{mode.value}</span>
          </a>
        </li>
      {/each}
    </ul>
  </div>

  <aside class="side">
    <Frame tone="ink">
      <h2 class="side-title caps"><Icon name="scroll" size={20} />{t('ui.hub.news')}</h2>
      <ul class="news">
        {#each NEWS as item (item.id)}
          <li>
            <a href={router.href(item.route)}>
              <span class="news-icon"><Icon name={item.icon} size={22} /></span>
              <span class="news-text">
                <span class="news-title">{t(`ui.news.${item.id}.title`)}</span>
                <span class="news-body">{t(`ui.news.${item.id}.body`)}</span>
              </span>
              <time datetime={item.date}>
                {fmtDate(new Date(`${item.date}T12:00:00`), { day: 'numeric', month: 'short' })}
              </time>
            </a>
          </li>
        {/each}
      </ul>
    </Frame>
    {#if ready}
      <Frame tone="ink">
        <h2 class="side-title caps"><Icon name="quest" size={20} />{t('ui.hub.quests')}</h2>
        <QuestList />
      </Frame>
    {/if}
  </aside>
</div>

<style>
  .hub {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem);
    gap: var(--space-5);
    align-items: start;
    max-width: 90rem;
    margin-inline: auto;
    min-height: 100dvh;
    padding: 5.5rem var(--gutter) 9rem;
    isolation: isolate;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: -1;
    opacity: 0.55;
  }
  .main {
    animation: rise 700ms var(--ease-out) 150ms both;
  }
  .modes {
    list-style: none;
    margin: var(--space-4) 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-3);
  }
  .mode {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    column-gap: var(--space-3);
    align-items: center;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--rule-strong);
    border-radius: 12px;
    background: linear-gradient(135deg, rgb(29 44 99 / 0.85), rgb(7 10 20 / 0.92));
    box-shadow:
      inset 0 1px 0 rgb(255 244 210 / 0.12),
      var(--shadow-2);
    color: inherit;
    text-decoration: none;
    transition:
      transform var(--dur-press) var(--ease-out),
      border-color var(--dur-quick) ease;
  }
  .mode:active {
    transform: scale(0.97);
  }
  .mode-icon {
    grid-row: span 2;
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 1.5px solid var(--gold);
    background: radial-gradient(circle at 50% 35%, #2b3f86, #0b1128);
    color: var(--gold-pale);
  }
  .mode-title {
    font-size: var(--text-lg);
    color: var(--gold-pale);
    letter-spacing: 0.06em;
  }
  .mode-value {
    font-size: var(--text-sm);
    color: var(--parchment-dim);
    font-variant-numeric: lining-nums;
  }
  @media (hover: hover) and (pointer: fine) {
    .mode:hover {
      border-color: var(--gold);
    }
  }
  @media (max-width: 640px) {
    .modes {
      grid-template-columns: 1fr;
    }
  }
  .side {
    display: grid;
    gap: var(--space-4);
    animation: rise 700ms var(--ease-out) 300ms both;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
  }
  .side-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
    font-size: var(--text-lg);
    font-weight: 400;
    color: var(--gold);
  }
  .news {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
  }
  .news a {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: var(--space-3);
    align-items: start;
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--rule);
    color: inherit;
    text-decoration: none;
    transition: background-color var(--dur-quick) ease;
  }
  .news li:last-child a {
    border-bottom: 0;
  }
  .news-icon {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--rule-strong);
    border-radius: 10px;
    background: var(--vault);
    color: var(--gold-pale);
  }
  .news-text {
    display: grid;
    gap: 2px;
  }
  .news-title {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--parchment);
    line-height: 1.2;
  }
  .news-body {
    font-size: var(--text-sm);
    color: var(--text-muted);
    line-height: var(--leading-snug);
  }
  time {
    font-size: var(--text-xs);
    color: var(--text-muted);
    font-variant-numeric: lining-nums;
    white-space: nowrap;
  }
  @media (hover: hover) and (pointer: fine) {
    .news a:hover .news-title {
      color: var(--gold-pale);
    }
  }
  @media (max-width: 960px) {
    .hub {
      grid-template-columns: 1fr;
      padding-top: 5rem;
    }
  }
  :global([data-motion='calm']) .main,
  :global([data-motion='calm']) .side {
    animation-name: fade;
    animation-duration: var(--dur-base);
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
