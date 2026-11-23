import { catalogs, availableLocales } from './catalogs';
import { createTranslator, pickLocale, SOURCE_LOCALE, type MessageValues } from './core';

const STORAGE_KEY = 'tesserae.locale';

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function initialLocale(): string {
  const stored = readStored();
  if (stored && availableLocales.includes(stored)) return stored;
  const preferred = typeof navigator === 'undefined' ? [] : navigator.languages;
  return pickLocale(preferred, availableLocales);
}

function build(locale: string) {
  return createTranslator(locale, catalogs[locale] ?? {}, catalogs[SOURCE_LOCALE], (key) => {
    if (import.meta.env.DEV) console.warn(`[i18n] missing "${key}" in ${locale}`);
  });
}

let translator = $state(build(initialLocale()));

function applyDocumentLang(locale: string): void {
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
}
applyDocumentLang(translator.locale);

export const i18n = {
  get locale(): string {
    return translator.locale;
  },
  locales: availableLocales,
  setLocale(locale: string): void {
    if (!availableLocales.includes(locale) || locale === translator.locale) return;
    translator = build(locale);
    applyDocumentLang(locale);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts for the session.
    }
  },
};

export const t = (key: string, values?: MessageValues): string => translator.t(key, values);
export const fmtNumber = (value: number, options?: Intl.NumberFormatOptions): string =>
  translator.number(value, options);
export const fmtDate = (value: Date | number, options?: Intl.DateTimeFormatOptions): string =>
  translator.date(value, options);
/** Name of a locale written in that locale, e.g. "Español". */
export const localeName = (locale: string): string =>
  catalogs[locale]?.['ui.language.name'] ?? locale;
