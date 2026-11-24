import type { IconName } from '../ui/icons/paths';

/** Notes shown on the home board. Text lives in ui.json under news.<id>. */
export interface NewsItem {
  id: string;
  date: string;
  icon: IconName;
  route: 'collection' | 'summon' | 'battle' | 'settings';
}

export const NEWS: NewsItem[] = [
  { id: 'weekly-banners', date: '2026-11-23', icon: 'summon', route: 'summon' },
  { id: 'chapter-two', date: '2026-11-23', icon: 'battle', route: 'battle' },
  { id: 'twenty-figures', date: '2026-11-22', icon: 'collection', route: 'collection' },
  { id: 'calm-motion', date: '2026-11-22', icon: 'motion', route: 'settings' },
];
