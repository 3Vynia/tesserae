import { buildCatalog, type Catalog, type MessageTree } from './core';

// Every JSON file under src/locales/<locale>/ is a namespace. Adding a language is adding a folder.
const files = import.meta.glob<MessageTree>('../locales/*/*.json', {
  eager: true,
  import: 'default',
});

function collect(): Record<string, Catalog> {
  const byLocale: Record<string, Record<string, MessageTree>> = {};
  for (const [path, tree] of Object.entries(files)) {
    const match = /\/locales\/([^/]+)\/([^/]+)\.json$/.exec(path);
    if (!match) continue;
    const [, locale, ns] = match as unknown as [string, string, string];
    (byLocale[locale] ??= {})[ns] = tree;
  }
  return Object.fromEntries(Object.entries(byLocale).map(([l, ns]) => [l, buildCatalog(ns)]));
}

export const catalogs = collect();
export const availableLocales = Object.keys(catalogs).sort();
