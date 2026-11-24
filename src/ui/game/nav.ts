import type { IconName } from '../icons/paths';

export interface NavItem {
  route: string;
  href: string;
  icon: IconName;
  label: string;
  /** A number of things waiting, or true for a single spark. */
  badge?: number | boolean;
  /** A short countdown shown under the label. */
  timer?: string;
  /** What the badge or timer means, for screen readers. */
  status?: string;
  /** The raised summoning medallion. */
  featured?: boolean;
}
