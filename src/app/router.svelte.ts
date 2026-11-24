import { flushSync } from 'svelte';

export const ROUTES = ['home', 'settings'] as const;
export type Route = (typeof ROUTES)[number];

function parse(hash: string): Route {
  const name = hash.replace(/^#\/?/, '').split('/')[0] ?? '';
  return (ROUTES as readonly string[]).includes(name) ? (name as Route) : 'home';
}

let current = $state<Route>(typeof location === 'undefined' ? 'home' : parse(location.hash));

function update(): void {
  const next = parse(location.hash);
  if (next === current) return;
  const swap = () => {
    flushSync(() => (current = next));
    window.scrollTo({ top: 0 });
    document.getElementById('main')?.focus({ preventScroll: true });
  };
  // View Transitions where supported; an instant swap elsewhere.
  if (typeof document.startViewTransition === 'function') document.startViewTransition(swap);
  else swap();
}

if (typeof window !== 'undefined') window.addEventListener('hashchange', update);

export const router = {
  get route(): Route {
    return current;
  },
  href: (route: Route): string => `#/${route}`,
};
