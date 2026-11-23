import { IntlMessageFormat } from 'intl-messageformat';

export type MessageTree = { [key: string]: string | MessageTree };
export type Catalog = Record<string, string>;
export type MessageValues = Record<string, string | number | Date>;

export const SOURCE_LOCALE = 'en';

/** Flattens nested JSON into dotted keys: { a: { b: 'x' } } -> { 'a.b': 'x' }. */
export function flatten(tree: MessageTree, prefix = ''): Catalog {
  const out: Catalog = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[path] = value;
    else Object.assign(out, flatten(value, path));
  }
  return out;
}

/** Builds one flat catalog from namespace files, e.g. ui.json -> keys starting with "ui.". */
export function buildCatalog(namespaces: Record<string, MessageTree>): Catalog {
  const out: Catalog = {};
  for (const [ns, tree] of Object.entries(namespaces)) Object.assign(out, flatten(tree, ns));
  return out;
}

/** Picks the best supported locale for a list of preferred BCP 47 tags. */
export function pickLocale(preferred: readonly string[], available: readonly string[]): string {
  for (const tag of preferred) {
    const lower = tag.toLowerCase();
    const exact = available.find((l) => l.toLowerCase() === lower);
    if (exact) return exact;
    const base = lower.split('-')[0];
    const partial = available.find((l) => l.toLowerCase().split('-')[0] === base);
    if (partial) return partial;
  }
  return available.includes(SOURCE_LOCALE) ? SOURCE_LOCALE : (available[0] ?? SOURCE_LOCALE);
}

/** Returns the argument names used by an ICU message, to compare translations. */
export function messageArguments(message: string, locale: string): string[] {
  const names = new Set<string>();
  const walk = (nodes: unknown[]): void => {
    for (const node of nodes as Array<Record<string, unknown>>) {
      if (typeof node['value'] === 'string' && node['type'] !== 0) names.add(node['value']);
      const options = node['options'] as Record<string, { value: unknown[] }> | undefined;
      if (options) for (const option of Object.values(options)) walk(option.value);
      if (Array.isArray(node['children'])) walk(node['children']);
    }
  };
  walk(new IntlMessageFormat(message, locale).getAst() as unknown[]);
  return [...names].sort();
}

export interface Translator {
  readonly locale: string;
  t(key: string, values?: MessageValues): string;
  has(key: string): boolean;
  number(value: number, options?: Intl.NumberFormatOptions): string;
  date(value: Date | number, options?: Intl.DateTimeFormatOptions): string;
}

export function createTranslator(
  locale: string,
  catalog: Catalog,
  fallback: Catalog = {},
  onMissing?: (key: string) => void,
): Translator {
  const cache = new Map<string, IntlMessageFormat>();
  const format = (key: string, source: string, lang: string, values?: MessageValues): string => {
    const cacheKey = `${lang}\u0000${key}`;
    let compiled = cache.get(cacheKey);
    if (!compiled) {
      compiled = new IntlMessageFormat(source, lang);
      cache.set(cacheKey, compiled);
    }
    return String(compiled.format(values));
  };
  return {
    locale,
    t(key, values) {
      const own = catalog[key];
      if (own !== undefined) return format(key, own, locale, values);
      onMissing?.(key);
      const fb = fallback[key];
      if (fb !== undefined) return format(key, fb, SOURCE_LOCALE, values);
      return key;
    },
    has: (key) => key in catalog || key in fallback,
    number: (value, options) => new Intl.NumberFormat(locale, options).format(value),
    date: (value, options) => new Intl.DateTimeFormat(locale, options).format(value),
  };
}
