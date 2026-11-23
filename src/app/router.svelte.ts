export const ROUTES = ['home', 'settings'] as const;
export type Route = (typeof ROUTES)[number];

function parse(hash: string): Route {
  const name = hash.replace(/^#\/?/, '').split('/')[0] ?? '';
  return (ROUTES as readonly string[]).includes(name) ? (name as Route) : 'home';
}

let current = $state<Route>(typeof location === 'undefined' ? 'home' : parse(location.hash));

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    current = parse(location.hash);
  });
}

export const router = {
  get route(): Route {
    return current;
  },
  href: (route: Route): string => `#/${route}`,
};
