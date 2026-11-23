// Fails when a translation is missing, has orphan keys, broken ICU syntax, mismatched
// arguments, or when a UI key in the source locale is not used anywhere in the code.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { flatten, SOURCE_LOCALE, type MessageTree } from '../src/i18n/core.ts';
import { compareLocales, findUnusedKeys, type LocaleData } from './i18n-lint.ts';

const root = new URL('..', import.meta.url).pathname;
const localesDir = join(root, 'src/locales');
// Namespaces whose keys must be referenced from code. Data namespaces (cards, etc.) are
// validated against the game data by their own tests.
const CODE_NAMESPACES = ['ui'];

function loadLocales(): Record<string, LocaleData> {
  const out: Record<string, LocaleData> = {};
  for (const locale of readdirSync(localesDir)) {
    const dir = join(localesDir, locale);
    if (!statSync(dir).isDirectory()) continue;
    const namespaces: LocaleData['namespaces'] = {};
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const ns = file.slice(0, -'.json'.length);
      const tree = JSON.parse(readFileSync(join(dir, file), 'utf8')) as MessageTree;
      namespaces[ns] = flatten(tree, ns);
    }
    out[locale] = { namespaces };
  }
  return out;
}

function readCode(dir: string): string {
  let code = '';
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) code += readCode(path);
    else if (/\.(ts|svelte)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name)) {
      code += readFileSync(path, 'utf8') + '\n';
    }
  }
  return code;
}

const locales = loadLocales();
const source = locales[SOURCE_LOCALE];
const problems = compareLocales(SOURCE_LOCALE, locales);
if (source) {
  const catalog = Object.assign({}, ...Object.values(source.namespaces));
  problems.push(
    ...findUnusedKeys(SOURCE_LOCALE, catalog, CODE_NAMESPACES, readCode(join(root, 'src'))),
  );
}

if (problems.length > 0) {
  for (const p of problems) {
    console.error(`${p.locale}: ${p.issue} ${p.key}${p.detail ? ` (${p.detail})` : ''}`);
  }
  console.error(`\n${problems.length} translation problem(s) in ${relative(root, localesDir)}`);
  process.exit(1);
}
const keyCount = source
  ? Object.values(source.namespaces).reduce((n, c) => n + Object.keys(c).length, 0)
  : 0;
console.log(`i18n ok: ${Object.keys(locales).length} locales, ${keyCount} keys`);
