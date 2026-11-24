import { flushSync } from 'svelte';

export const ROUTES = [
  'home',
  'collection',
  'summon',
  'battle',
  'wheel',
  'market',
  'workshop',
  'profile',
  'settings',
] as const;
export type Route = (typeof ROUTES)[number];

interface Location {
  route: Route;
  /** Optional second segment, e.g. a card id in #/collection/zeus. */
  param: string | null;
}

export function parseHash(hash: string): Location {
  const [name = '', param = null] = hash.replace(/^#\/?/, '').split('/');
  const route = (ROUTES as readonly string[]).includes(name) ? (name as Route) : 'home';
  return { route, param: route === name && param ? decodeURIComponent(param) : null };
}

let current = $state<Location>(
  typeof location === 'undefined' ? { route: 'home', param: null } : parseHash(location.hash),
);

/**
 * Runs a DOM change inside a view transition when the browser supports it. `kind` names a
 * special transition styled in base.css through the data-vt attribute on the root element.
 */
export function withTransition(change: () => void, kind?: string): void {
  const run = () => flushSync(change);
  if (typeof document === 'undefined' || typeof document.startViewTransition !== 'function') {
    run();
    return;
  }
  const root = document.documentElement;
  if (kind) root.dataset['vt'] = kind;
  const transition = document.startViewTransition(run);
  void transition.finished.finally(() => {
    if (root.dataset['vt'] === kind) delete root.dataset['vt'];
  });
}

function update(): void {
  const next = parseHash(location.hash);
  if (next.route === current.route && next.param === current.param) return;
  const pageChange = next.route !== current.route;
  const kind = current.route === 'home' && next.route === 'collection' ? 'oculus' : undefined;
  withTransition(() => {
    current = next;
  }, kind);
  if (pageChange) {
    window.scrollTo({ top: 0 });
    document.getElementById('main')?.focus({ preventScroll: true });
  }
}

if (typeof window !== 'undefined') window.addEventListener('hashchange', update);

export const router = {
  get route(): Route {
    return current.route;
  },
  get param(): string | null {
    return current.param;
  },
  href: (route: Route, param?: string): string =>
    param ? `#/${route}/${encodeURIComponent(param)}` : `#/${route}`,
};
