import type { IconName } from '../ui/icons/paths';
import type { Route } from '../app/router.svelte';

/** Notes shown on the home board. Text lives in ui.json under news.<id>. */
export interface NewsItem {
  id: string;
  date: string;
  icon: IconName;
  route: Route;
}

export const NEWS: NewsItem[] = [
  { id: 'fortuna', date: '2026-11-24', icon: 'wheel', route: 'wheel' },
  { id: 'workshop', date: '2026-11-24', icon: 'workshop', route: 'workshop' },
  { id: 'weekly-banners', date: '2026-11-23', icon: 'summon', route: 'summon' },
  { id: 'chapter-two', date: '2026-11-23', icon: 'battle', route: 'battle' },
  { id: 'twenty-figures', date: '2026-11-22', icon: 'collection', route: 'collection' },
];
