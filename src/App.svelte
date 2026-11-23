<script lang="ts">
  import { router, ROUTES, type Route } from './app/router.svelte';
  import { t } from './i18n/i18n.svelte';
  import NightSky from './ui/NightSky.svelte';
  import Home from './app/views/Home.svelte';
  import Settings from './app/views/Settings.svelte';

  const views = { home: Home, settings: Settings } satisfies Record<Route, unknown>;
  const View = $derived(views[router.route]);
</script>

<a class="skip visually-hidden" href="#main">{t('ui.app.skipToContent')}</a>
<NightSky />

<header class="bar">
  <a class="brand" href={router.href('home')}>{t('ui.app.title')}</a>
  <nav aria-label={t('ui.nav.label')}>
    <ul>
      {#each ROUTES as route (route)}
        <li>
          <a href={router.href(route)} aria-current={router.route === route ? 'page' : undefined}>
            {t(`ui.nav.${route}`)}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</header>

<main id="main" tabindex="-1">
  <View />
</main>

<footer>
  <p>
    {t('ui.footer.license')}
    <a href="https://github.com/Heavenly3/tesserae" rel="noopener noreferrer">
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
    background: var(--night-800);
    z-index: 10;
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-6);
    border-bottom: 1px solid var(--line);
    background: rgb(5 7 15 / 0.6);
    backdrop-filter: blur(6px);
    position: sticky;
    top: 0;
    z-index: 5;
  }
  .brand {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-decoration: none;
    color: var(--gold-300);
  }
  nav ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  nav a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 var(--space-3);
    color: var(--text);
    text-decoration: none;
    border-bottom: 2px solid transparent;
    transition:
      color var(--dur-fast),
      border-color var(--dur-fast);
  }
  nav a:hover,
  nav a[aria-current='page'] {
    color: var(--gold-300);
    border-color: var(--gold-400);
  }
  main {
    width: min(72rem, 100% - 2rem);
    margin: 0 auto;
    min-height: 70dvh;
  }
  main:focus {
    outline: none;
  }
  footer {
    text-align: center;
    padding: var(--space-6) var(--space-4) var(--space-8);
    color: var(--text-muted);
    font-size: 0.9rem;
    border-top: 1px solid var(--line);
  }
</style>
