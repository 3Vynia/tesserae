# Decisions

Short records of choices that are not obvious from the code. Newest at the bottom.

## Name

Kept the working title "Tesserae": tesserae are the small tiles of a mosaic, which matches the
collection screen where each card is a tile. It is a common Latin word, not a product name.

## Stack: Svelte 5 + Vite, no SvelteKit

The game is a single static page with a handful of screens, no server rendering and no server
routes. SvelteKit's static adapter would add a routing layer, prerendering config and a 404
workaround for GitHub Pages without giving anything back. Plain Vite with a tiny hash router is
simpler and works from any subfolder or from a local file server.

Hash routing (`#/settings`) avoids server rewrites entirely, which matters on GitHub Pages and for
offline use.

## TypeScript 6.0 instead of 7

TypeScript 7 is out, but typescript-eslint and svelte-check do not support it yet. Pinned to 6.0;
revisit when both do.

## Game logic in `src/engine`

Combat, summoning and progression live in plain TypeScript with no imports from Svelte or browser
APIs. All randomness goes through `createRng` (sfc32 seeded with a cyrb128 hash), so any battle or
pull can be replayed from its seed, tested exactly, and ported later (for example to Rust and
WebAssembly). `Math.random` is not used in game logic.

## i18n: thin layer over intl-messageformat

Options considered:

- svelte-i18n: store-based, designed before Svelte 5 runes, and pulls in more than needed.
- Paraglide: compiles messages to functions, which is great for UI strings but awkward for
  data-driven keys such as card names looked up by id, and adds a code generation step.
- typesafe-i18n: unmaintained.

Chosen: about 100 lines on top of `intl-messageformat` (ICU MessageFormat, the same syntax most
translation tools understand) plus the built-in `Intl` APIs for numbers and dates. Messages live
in `src/locales/<locale>/<namespace>.json`; keys are prefixed by namespace (`ui.nav.home`).
Locale folders are discovered with `import.meta.glob`, so adding a language is adding a folder.
All locales are bundled: the text is small and the game must work offline. Missing keys fall back
to English and are logged in development.

The translation check (`scripts/check-i18n.ts`, run in CI) fails on missing keys, orphan keys,
missing or extra namespace files, invalid ICU syntax, placeholder mismatches between languages,
and source UI keys that no code references. A key counts as referenced if it appears as a string
literal or if code builds it from a template prefix such as `` `ui.nav.${route}` ``.

## Locale preference in localStorage

The language must be known synchronously before the first render, so it is stored in
`localStorage`. The game save itself will go to IndexedDB (Dexie) in phase 4.

## Fonts

Cormorant Garamond for display and Alegreya for body text, both under the SIL Open Font License,
bundled through `@fontsource` packages. Nothing is loaded from a CDN.

## No external requests

A Content Security Policy meta tag restricts scripts, styles, fonts, images and connections to the
page's own origin. The Playwright smoke test also fails if the page requests anything from another
origin. The only external URLs are plain links (the source code link in the footer).

## Licensing of content

Code is MIT. The myths themselves are public domain; the card texts are original summaries and are
released under the same MIT license to keep things simple for forks.

## Content policy

The brief asks for ancient myth and folklore with no living worship. Some listed traditions need
care because parts of them are still practiced:

- Revival movements (modern Hellenism, Heathenry, Rodnovery, neo-Druidry) do not disqualify the
  ancient Greek, Norse, Slavic or Celtic material, which is known from ancient and medieval texts.
- Japanese: Shinto is a continuously practiced religion and many kami from the Kojiki are enshrined
  today. Cards draw on yokai, legendary heroes and monsters of folklore. Kami that are objects of
  current worship (for example Amaterasu) are left out.
- Chinese: figures from Journey to the West are included as literary characters. Buddhist figures
  (the Buddha, bodhisattvas such as Guanyin) are excluded. Daoist deities with active temple
  worship are avoided; ancient myth figures (Nüwa, Pangu, Hou Yi, Gonggong) are used with care.
- Aztec, Maya, Inca: limited to the documented pre-Columbian corpus (Popol Vuh, Florentine Codex,
  colonial chronicles). Figures central to living Indigenous practice today, such as Pachamama, are
  left out.
- Persian: pre-Islamic epic and myth (Shahnameh heroes and creatures). Zoroastrianism is a living
  religion, so its divine beings (Ahura Mazda, the Amesha Spentas) are excluded.

When in doubt a figure is left out and listed here.
