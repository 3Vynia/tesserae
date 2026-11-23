# Contributing

Thanks for your interest. A few ground rules keep the project what it is:

- No monetization, no tracking, no network requests. Everything must work offline and be bundled.
- Content comes only from ancient myths and folklore in the public domain, with no living worship.
  No figures from franchises or modern retellings. Write summaries in your own words and cite the
  classical source. See the content policy in [docs/decisions.md](docs/decisions.md).
- Game logic in `src/engine` stays free of UI and browser APIs and takes randomness only from the
  seeded generator in `src/engine/rng.ts`.
- No user-visible text in components: add keys to `src/locales/en/*.json` and every other locale.

Before opening a pull request run `npm run verify` and `npm run test:e2e`.

## Adding a language

1. Copy `src/locales/en` to `src/locales/<code>` (a BCP 47 tag such as `fr` or `pt-BR`).
2. Translate the values. Keep ICU placeholders like `{count}` and plural branches intact.
3. Set `language.name` in `ui.json` to the language name written in that language.
4. Run `npm run i18n:check`.
