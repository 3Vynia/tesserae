<script lang="ts">
  import { onMount } from 'svelte';
  import { router, type Route } from './app/router.svelte';
  import { t } from './i18n/i18n.svelte';
  import { game } from './app/save.svelte';
  import { CARDS } from './data/cards';
  import { dayKey, isClaimed, questProgress, questsFor } from './engine/quests';
  import NightSky from './ui/NightSky.svelte';
  import Hud from './ui/game/Hud.svelte';
  import Dock from './ui/game/Dock.svelte';
  import Home from './app/views/Home.svelte';
  import Collection from './app/views/Collection.svelte';
  import Summon from './app/views/Summon.svelte';
  import Battle from './app/views/Battle.svelte';
  import Settings from './app/views/Settings.svelte';

  const views = {
    home: Home,
    collection: Collection,
    summon: Summon,
    battle: Battle,
    settings: Settings,
  } satisfies Record<Route, unknown>;
  const View = $derived(views[router.route]);
  const ready = $derived(game.status === 'ready');

  const questWaiting = $derived.by(() => {
    if (!ready) return false;
    const day = dayKey(Date.now());
    return questsFor(game.save, day).some(
      (q) => questProgress(game.save, day, q) >= q.goal && !isClaimed(game.save, day, q),
    );
  });

  const dock = $derived([
    {
      route: 'home',
      href: router.href('home'),
      icon: 'home' as const,
      label: t('ui.nav.home'),
      alert: questWaiting,
    },
    {
      route: 'collection',
      href: router.href('collection'),
      icon: 'collection' as const,
      label: t('ui.nav.collection'),
    },
    {
      route: 'summon',
      href: router.href('summon'),
      icon: 'summon' as const,
      label: t('ui.nav.summon'),
    },
    {
      route: 'battle',
      href: router.href('battle'),
      icon: 'battle' as const,
      label: t('ui.nav.battle'),
    },
  ]);

  onMount(() => void game.load());
</script>

<a class="skip visually-hidden" href="#main">{t('ui.app.skipToContent')}</a>
<NightSky stars={110} constellations={false} />

<Hud
  homeHref={router.href('home')}
  settingsHref={router.href('settings')}
  starlight={ready ? game.save.starlight : null}
  lit={ready && router.route !== 'home' && router.route !== 'collection'
    ? { owned: CARDS.filter((c) => game.save.owned[c.id]).length, total: CARDS.length }
    : null}
/>

<main id="main" tabindex="-1" class="scene route-{router.route}">
  <View />
</main>

<Dock items={dock} current={router.route} />

<style>
  .skip {
    position: absolute;
    top: var(--space-2);
    left: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: var(--vault);
    z-index: var(--z-toast);
  }
  .scene {
    view-transition-name: page;
    min-height: 100dvh;
    padding-top: 5rem;
    padding-bottom: 8rem;
  }
  .scene:focus {
    outline: none;
  }
  .route-home {
    padding-top: 0;
    padding-bottom: 0;
  }
</style>
