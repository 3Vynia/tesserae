<script lang="ts">
  import { onMount } from 'svelte';
  import { router, type Route } from './app/router.svelte';
  import { t } from './i18n/i18n.svelte';
  import { game } from './app/save.svelte';
  import { CARDS } from './data/cards';
  import { dayKey, isClaimed, questProgress, questsFor } from './engine/quests';
  import { offerings, tribute, wheelReady } from './engine/rewards';
  import { workshopRotation } from './engine/vault';
  import { clock, untilParts } from './app/clock.svelte';
  import NightSky from './ui/NightSky.svelte';
  import Hud from './ui/game/Hud.svelte';
  import Dock from './ui/game/Dock.svelte';
  import Rail from './ui/game/Rail.svelte';
  import type { NavItem } from './ui/game/nav';
  import Home from './app/views/Home.svelte';
  import Collection from './app/views/Collection.svelte';
  import Summon from './app/views/Summon.svelte';
  import Battle from './app/views/Battle.svelte';
  import Settings from './app/views/Settings.svelte';
  import Wheel from './app/views/Wheel.svelte';
  import Market from './app/views/Market.svelte';
  import Workshop from './app/views/Workshop.svelte';
  import Profile from './app/views/Profile.svelte';

  const views = {
    home: Home,
    collection: Collection,
    summon: Summon,
    battle: Battle,
    wheel: Wheel,
    market: Market,
    workshop: Workshop,
    profile: Profile,
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

  // What waits where: free offerings and the daily tribute at the altar, a free turn of the wheel,
  // the workshop's gift. Each shows as a badge on the rail and the dock.
  const altarWaiting = $derived(
    ready
      ? offerings(game.save, clock.now).charges + (tribute(game.save, clock.now).claimed ? 0 : 1)
      : 0,
  );
  const wheel = $derived(ready ? wheelReady(game.save, clock.now) : null);
  const wheelTimer = $derived.by(() => {
    if (!wheel || wheel.free) return undefined;
    const { h, m, s } = untilParts(wheel.nextAt, clock.now);
    return h > 0 ? t('ui.time.hm', { h, m }) : t('ui.time.ms', { m, s });
  });
  const giftWaiting = $derived(
    ready && !game.save.cosmetics.gifts.includes(workshopRotation(clock.now).id),
  );

  const item = (route: Route, icon: NavItem['icon'], extra: Partial<NavItem> = {}): NavItem => ({
    route,
    href: router.href(route),
    icon,
    label: t(`ui.nav.${route}`),
    ...extra,
  });
  const home = $derived(
    item('home', 'home', {
      badge: questWaiting,
      ...(questWaiting ? { status: t('ui.nav.status.quest') } : {}),
    }),
  );
  const summon = $derived(
    item('summon', 'summon', {
      featured: true,
      badge: altarWaiting,
      ...(altarWaiting ? { status: t('ui.nav.status.altar', { count: altarWaiting }) } : {}),
    }),
  );
  const wheelItem = $derived(
    item('wheel', 'wheel', {
      badge: !!wheel?.free,
      ...(wheelTimer ? { timer: wheelTimer } : {}),
      ...(wheel?.free ? { status: t('ui.nav.status.wheel') } : {}),
    }),
  );
  const workshop = $derived(
    item('workshop', 'workshop', {
      badge: giftWaiting,
      ...(giftWaiting ? { status: t('ui.nav.status.gift') } : {}),
    }),
  );
  const rail = $derived([
    [home, summon, wheelItem, item('battle', 'battle')],
    [
      item('collection', 'collection'),
      item('profile', 'profile'),
      workshop,
      item('market', 'market'),
    ],
    [item('settings', 'settings')],
  ]);
  const dock = $derived([home, item('collection', 'collection'), summon, item('battle', 'battle')]);
  const more = $derived([
    item('profile', 'profile'),
    wheelItem,
    workshop,
    item('market', 'market'),
    item('settings', 'settings'),
  ]);

  onMount(() => void game.load());
</script>

<a class="skip visually-hidden" href="#main">{t('ui.app.skipToContent')}</a>
<NightSky stars={110} constellations={false} />

<Hud
  homeHref={router.href('home')}
  settingsHref={router.href('settings')}
  wallet={ready
    ? {
        starlight: game.save.starlight,
        dust: game.save.wallet.dust,
        golden: game.save.wallet.golden,
      }
    : null}
  lit={ready && router.route !== 'home' && router.route !== 'collection'
    ? { owned: CARDS.filter((c) => game.save.owned[c.id]).length, total: CARDS.length }
    : null}
/>

<main id="main" tabindex="-1" class="scene route-{router.route}">
  <View />
</main>

<Rail groups={rail} current={router.route} />
<Dock items={dock} {more} current={router.route} />

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
  @media (min-width: 900px) {
    .scene {
      padding-left: 6.5rem;
      padding-bottom: var(--space-7);
    }
  }
</style>
