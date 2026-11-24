# Tesserae

[Leer en español](README.es.md)

A free, open source collectible card game that runs in the browser. Gods, heroes and monsters from
ancient mythologies share one night sky: collect them as cards, raise them and send them into
automatic turn-based battles.

- Free. Everything is earned by playing. No purchases of any kind.
- Offline. No server, no analytics, no cookies, no network requests. Your progress lives in your
  browser and can be exported to a file.
- Open. Code under the MIT license. Card content is based on public domain myths, retold in our own
  words with the classical source cited on each card.
- Available in English and Spanish. More languages can be added with translation files alone.

Play it at <https://3vynia.github.io/tesserae/>.

## Status

Playable: collection, summoning with visible odds, daily quests and automatic battles with a
campaign, a tower and bosses. See [ROADMAP.md](ROADMAP.md) for what is done and what comes next, and
[docs/decisions.md](docs/decisions.md) for the reasoning behind technical and content choices.

## Development

Requires Node.js 22.18 or newer.

```sh
npm install
npm run dev          # local dev server
npm run verify       # lint, type check, translation check, unit tests, build
npm run test:e2e     # Playwright smoke test (run `npx playwright install chromium` once)
```

Project layout:

```
src/engine/    game logic in plain TypeScript, deterministic from a seed, no UI imports
src/data/      game data (cards, pantheons, stages)
DESIGN.md      visual system; details in docs/design/
src/locales/   one folder per language, one JSON file per namespace (ui, cards)
src/i18n/      translation runtime
src/ui/        reusable Svelte components
src/app/       views and app wiring
scripts/       build-time checks (translations)
tests/e2e/     Playwright tests
```

## Translations

English (`src/locales/en`) is the source of truth. To add a language, copy that folder to
`src/locales/<code>` and translate the values. `npm run i18n:check` fails on missing keys, orphan
keys, broken ICU syntax or mismatched placeholders. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Support

The game is and will stay free. If a donation link is added in the future it will appear here,
and it will never unlock anything in the game.

## License

Code: [MIT](LICENSE). Myths are public domain; the card texts in this repository are original
summaries released under the same license.
