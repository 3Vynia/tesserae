import { messageArguments, type Catalog } from '../src/i18n/core.ts';

export interface LocaleData {
  /** namespace -> flat catalog for that namespace (keys include the namespace prefix) */
  namespaces: Record<string, Catalog>;
}

export interface Problem {
  locale: string;
  key: string;
  issue: 'missing' | 'orphan' | 'syntax' | 'arguments' | 'missing-file' | 'orphan-file' | 'unused';
  detail?: string;
}

const merge = (data: LocaleData): Catalog => Object.assign({}, ...Object.values(data.namespaces));

function safeArgs(message: string, locale: string): string[] | Error {
  try {
    return messageArguments(message, locale);
  } catch (error) {
    return error as Error;
  }
}

/** Compares every locale against the source locale. */
export function compareLocales(
  sourceLocale: string,
  locales: Record<string, LocaleData>,
): Problem[] {
  const problems: Problem[] = [];
  const source = locales[sourceLocale];
  if (!source) return [{ locale: sourceLocale, key: '*', issue: 'missing-file' }];
  const sourceCatalog = merge(source);

  for (const [key, message] of Object.entries(sourceCatalog)) {
    const args = safeArgs(message, sourceLocale);
    if (args instanceof Error) {
      problems.push({ locale: sourceLocale, key, issue: 'syntax', detail: args.message });
    }
  }

  for (const [locale, data] of Object.entries(locales)) {
    if (locale === sourceLocale) continue;
    for (const ns of Object.keys(source.namespaces)) {
      if (!(ns in data.namespaces))
        problems.push({ locale, key: `${ns}.json`, issue: 'missing-file' });
    }
    for (const ns of Object.keys(data.namespaces)) {
      if (!(ns in source.namespaces))
        problems.push({ locale, key: `${ns}.json`, issue: 'orphan-file' });
    }
    const catalog = merge(data);
    for (const key of Object.keys(sourceCatalog)) {
      if (!(key in catalog)) problems.push({ locale, key, issue: 'missing' });
    }
    for (const [key, message] of Object.entries(catalog)) {
      const args = safeArgs(message, locale);
      if (args instanceof Error) {
        problems.push({ locale, key, issue: 'syntax', detail: args.message });
      }
      const sourceMessage = sourceCatalog[key];
      if (sourceMessage === undefined) {
        problems.push({ locale, key, issue: 'orphan' });
        continue;
      }
      if (args instanceof Error) continue;
      const expected = safeArgs(sourceMessage, sourceLocale);
      if (!(expected instanceof Error) && args.join(',') !== expected.join(',')) {
        problems.push({
          locale,
          key,
          issue: 'arguments',
          detail: `expected {${expected.join(', ')}} got {${args.join(', ')}}`,
        });
      }
    }
  }
  return problems;
}

/**
 * Finds source keys of the given namespaces that no code references. A key counts as used when
 * it appears as a quoted literal, or when code builds it from a template prefix like `ui.rarity.${r}`.
 */
export function findUnusedKeys(
  sourceLocale: string,
  catalog: Catalog,
  namespaces: readonly string[],
  code: string,
): Problem[] {
  const literals = new Set<string>();
  for (const m of code.matchAll(/['"`]([a-zA-Z][\w-]*(?:\.[\w-]+)+)['"`]/g))
    if (m[1]) literals.add(m[1]);
  const prefixes: string[] = [];
  for (const m of code.matchAll(/`([a-zA-Z][\w-]*\.[\w.-]*)\$\{/g)) if (m[1]) prefixes.push(m[1]);

  return Object.keys(catalog)
    .filter((key) => namespaces.includes(key.split('.')[0] ?? ''))
    .filter((key) => !literals.has(key) && !prefixes.some((p) => key.startsWith(p)))
    .map((key) => ({ locale: sourceLocale, key, issue: 'unused' as const }));
}
