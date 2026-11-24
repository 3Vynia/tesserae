<script lang="ts">
  import { router, ROUTES, type Route } from './app/router.svelte';
  import { t } from './i18n/i18n.svelte';
  import Icon from './ui/icons/Icon.svelte';
  import NightSky from './ui/NightSky.svelte';
  import type { IconName } from './ui/icons/paths';
  import Home from './app/views/Home.svelte';
  import Settings from './app/views/Settings.svelte';
  import Collection from './app/views/Collection.svelte';
  import Summon from './app/views/Summon.svelte';
  import Starlight from './ui/hud/Starlight.svelte';
  import { game } from './app/save.svelte';
  import { onMount } from 'svelte';

  const views = {
    home: Home,
    collection: Collection,
    summon: Summon,
    settings: Settings,
  } satisfies Record<Route, unknown>;
  const icons: Record<Route, IconName> = {
    home: 'home',
    collection: 'collection',
    summon: 'summon',
    settings: 'settings',
  };

  onMount(() => void game.load());
  const View = $derived(views[router.route]);

  let nav = $state<HTMLUListElement>();
  let thread = $state<HTMLSpanElement>();

  // The gold thread under the current link slides to its new place.
  $effect(() => {
    const route = router.route;
    const link = nav?.querySelector<HTMLElement>(`[data-route="${route}"]`);
    if (!link || !thread || !nav) return;
    const box = link.getBoundingClientRect();
    const base = nav.getBoundingClientRect();
    thread.style.transform = `translateX(${box.left - base.left}px) scaleX(${box.width})`;
  });
</script>

<a class="skip visually-hidden" href="#main">{t('ui.app.skipToContent')}</a>
<NightSky stars={110} constellations={false} />

<header class="bar" class:over-portal={router.route === 'home'}>
  <a class="brand" href={router.href('home')} aria-label={t('ui.app.title')}>
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <rect x="2" y="2" width="10" height="10" rx="1" />
      <rect x="14" y="2" width="10" height="10" rx="1" class="lit" />
      <rect x="2" y="14" width="10" height="10" rx="1" class="lit" />
      <rect x="14" y="14" width="10" height="10" rx="1" />
      <path d="M19 4.5l.9 2.1 2.1.9-2.1.9L19 10.5l-.9-2.1-2.1-.9 2.1-.9z" class="star" />
    </svg>
    <span>{t('ui.app.title')}</span>
  </a>
  <nav aria-label={t('ui.nav.label')}>
    <ul bind:this={nav}>
      {#each ROUTES as route (route)}
        <li>
          <a
            href={router.href(route)}
            data-route={route}
            aria-current={router.route === route ? 'page' : undefined}
          >
            <Icon name={icons[route]} size={20} />
            <span>{t(`ui.nav.${route}`)}</span>
          </a>
        </li>
      {/each}
      <span class="thread" bind:this={thread} aria-hidden="true"></span>
    </ul>
  </nav>
  {#if game.status === 'ready'}<Starlight amount={game.save.starlight} />{/if}
</header>

<main id="main" tabindex="-1" class="page route-{router.route}">
  <View />
</main>

<footer class="foot">
  <p>
    {t('ui.footer.license')}
    <a href="https://github.com/3Vynia/tesserae" rel="noopener noreferrer">
      {t('ui.footer.source')}
    </a>
  </p>
</footer>

<style>
  .skip {
    position: absolute;
    top: var(--space-2);
    left: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: var(--vault);
    z-index: var(--z-toast);
  }
  .bar {
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-4);
    padding: var(--space-2) var(--gutter);
    background: linear-gradient(180deg, var(--ink) 0, rgb(7 10 20 / 0.92) 100%);
    border-bottom: 1px solid var(--rule);
  }
  .bar.over-portal {
    position: absolute;
    inset-inline: 0;
    background: linear-gradient(180deg, rgb(7 10 20 / 0.7), transparent) no-repeat;
    border-bottom-color: transparent;
  }
  .brand {
    margin-inline-end: auto;
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    min-height: 44px;
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    letter-spacing: 0.08em;
    color: var(--gold-pale);
    text-decoration: none;
  }
  .brand rect {
    fill: var(--lapis);
    stroke: var(--gold);
    stroke-width: 1;
  }
  .brand rect.lit {
    fill: var(--gold);
  }
  .brand .star {
    fill: var(--gold-pale);
  }
  ul {
    position: relative;
    display: flex;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  nav a {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0 var(--space-3);
    font-family: var(--font-caps);
    font-size: var(--text-lg);
    letter-spacing: var(--tracking-caps);
    color: var(--parchment-dim);
    text-decoration: none;
    transition: color var(--dur-quick) ease;
  }
  nav a[aria-current='page'] {
    color: var(--gold-pale);
  }
  .thread {
    position: absolute;
    left: 0;
    bottom: 2px;
    width: 1px;
    height: 1px;
    background: var(--gold);
    transform-origin: left;
    transition: transform var(--dur-base) var(--ease-out);
    pointer-events: none;
  }
  @media (hover: hover) and (pointer: fine) {
    nav a:hover {
      color: var(--gold-pale);
    }
  }
  :global([data-motion='calm']) .thread {
    transition: none;
  }
  .page {
    view-transition-name: page;
    min-height: 70dvh;
  }
  .page:focus {
    outline: none;
  }
  .foot {
    padding: var(--space-6) var(--gutter) var(--space-7);
    border-top: 1px solid var(--rule);
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
</style>
