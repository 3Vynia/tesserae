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

## Visual direction: the starry vault

The full direction lives in `DESIGN.md` and `docs/design/`. Product context is in `PRODUCT.md`.
The brief pinned the world (ink, midnight blue, gold leaf, parchment, constellations, a mosaic per
pantheon), so no competing directions were explored beyond the ones listed in
`docs/design/direction.md`.

## Fonts changed to IM Fell English and Alegreya

Cormorant Garamond was replaced by IM Fell English (display) and its small caps cut (labels). The
Fell types belong to the same century as the engraved star atlases the interface borrows from,
and their ink spread gives character at large sizes. Alegreya stays for reading. All are OFL and
bundled.

## Motion without GSAP or PixiJS

The original baseline listed GSAP and PixiJS. Everything so far is CSS transitions, CSS
animations, the Web Animations API, a 40-line spring and one canvas. These run on the compositor
for transform and opacity, cost nothing in bundle size and are enough for the planned
ceremonies. PixiJS stays an option for the pull and battle particle effects if a 2D canvas cannot
hold 60 fps within the particle budget; that will be measured, not assumed.

## Procedural clouds for the home oculus

The home sky is rendered in the browser from seeded fractal noise with directional lighting, in a
Web Worker (`src/ui/sky/clouds.worker.ts`) with a main-thread fallback. Two layers of 768 and 1024
px take about one second together on a desktop, start after the first paint, and fade in. No
image files are shipped and nothing is fetched. Regular sun rays were tried and removed: they
read as a generic sunburst and echo a flag with militarist associations.

## Motion setting

Settings offer Follow device, Full and Calm. Calm (or the system reduced-motion preference when
following the device) sets `data-motion="calm"` on the root element; components swap movement for
fades instead of switching animation off, so no state change becomes invisible.

## Page transitions

Route changes use the View Transitions API (`document.startViewTransition`) with a short fade and
rise. Browsers without it swap instantly.

## Detector and tool folders

Design and screenshot helper scripts live outside the repository. ESLint and Prettier ignore
dot-folders at the root (except `.github/`) so local tool folders never break the checks.

## Card data split

Mechanics live in `src/data/cards.ts` and are validated with Zod at load. Text lives in
`src/locales/<locale>/cards.json`. Skill descriptions never repeat numbers: they use ICU
arguments (`{damage}`, `{turns}`) filled from the skill's effects by `skillValues`, so balancing a
card never touches a translation. Tests fail when a card lacks text in any locale, when a locale
has text for an unknown card, or when a description uses an argument the data does not provide.
Relations between cards are only listed when the sources support them.

## Summoning numbers

Base rates: Mortal 50%, Hero 30%, Demigod 14%, God 5%, Primordial 1%. A Demigod or better is
guaranteed within 10 pulls and a God or better within 60, with the God-or-better chance rising
by 5 points per pull from pull 45. Each banner keeps its own counters. A featured banner sends
half of the Demigod-and-above results to its pantheon and changes every week. A pull costs 160
starlight. Every pull draws from an RNG seeded with the save seed and the pull count, so a save
always produces the same results and the odds can be checked by tests over thousands of pulls.

## Earning starlight

New saves start with 1600 starlight (ten pulls) and a team of four Mortal and Hero cards. Three
daily quests (from a pool of eight) pay between 80 and 320, battles pay on the first win and a
third or a quarter on replays, and tower floors pay more as they climb.

## Battle rules

Automatic and deterministic from a seed. Units act in speed order each round. A unit uses its
ultimate when its energy reaches the cost, its active skill when the cooldown allows, otherwise
a basic attack. Single-target attacks hit the front row first. Elements: storm beats tide, tide
beats flame, flame beats verdure, verdure beats stone, stone beats storm (x1.3 / x0.8); sun and
night beat each other. Two, three or four cards of one pantheon give +5/10/15% attack (and +5/10%
health from three). From round 12 all damage grows by 15% per round so even fights end; the cap
is 30 rounds. The engine returns an event log and the UI replays it, so the result is decided
before any animation runs and skipping never changes it.

Progression for now is experience only: every battle gives experience to the team (less for a
loss, so nobody gets stuck) and stats grow 5% per level. Ascension, stars from duplicates and
relics are still to come (see the roadmap).

## Overlays

The pull ceremony and the battle stage are moved to the end of `<body>` and make the rest of the
page inert while open, then return focus where it was. The card detail uses a native `<dialog>`.

## Development shortcut

In development builds only, `?starlight` in the URL sets the balance to five million
(`?starlight=200` sets an exact amount) to test summons and progression. The code is removed from
production builds by Vite, so the published game has no way to add starlight.

## From web page to game screens

The first build read as a website: a top bar of text links, a footer, page titles with
explanatory paragraphs and a scrolling landing page. The shell is now built like a game:

- A floating HUD (crest, starlight, settings) and a dock of four large tablets at the bottom
  (Home, Vault, Summon, Battle). No footer; license and source live under Settings.
- Home is a hub, not a landing page: the oculus fills the screen, three portal cards in a fan lead
  to the vault, the summoning altar and the battles, each showing live progress, and the daily
  quests sit beside them.
- Every scene opens with an engraved title plate instead of a heading and a paragraph. Panels use
  a shared frame with gold corner pieces.
- The campaign is a constellation: each stage is a star on a path, gold when cleared, glowing when
  open, dim when locked.

The settling curve lost its overshoot (`--ease-settle` is now an exponential ease-out): the
small bounce read as dated next to the rest of the motion.

## Systems taken from collection games, made to work offline

A review of an established card-collecting site gave a list of systems players expect. Each was
adapted to Tesserae's vault and to the rule that nothing leaves the browser:

- **Side rail.** On wide screens every destination sits in a left rail with badges (offerings,
  tribute, a free turn, the weekly gift) and countdowns. Narrow screens keep the dock, with the
  rest behind More.
- **Free income.** Offerings refill one charge every two hours up to three; the daily tribute pays
  more over a seven-day streak and ends with a golden tessera. Fortuna's wheel gives one free turn
  every eight hours and prints the real chance of every slice next to it, since the slices are drawn
  the same size.
- **Big wishes.** Summon ×1, ×10, ×100, ×1000 or any amount up to 5,000. More than ten results
  show their highlights and a tally instead of one card at a time.
- **Golden tesserae.** Every 200 summons on any banner earn one; it summons a god or a primordial
  without touching pity. This is the long-term guarantee, visible as a meter under the pity count.
- **Odds per card.** The details sheet lists every card's chance on the next summon, with the
  current pity, as a percentage and as "1 in N".
- **History by wish.** Pulls made with one press share a batch. A wish can be starred (kept past the
  history limit) and replayed.
- **Stardust.** Spare copies dissolve into stardust; the last copy and locked cards are never
  touched, and the amount is shown before confirming. Stardust buys cards at the Oracle's market
  (a weekly stall of six, one of each, always with a god or better) and frames and stickers.
- **Vault tools.** Marks (locked, tagged, wishlist, spare, customized, unseen) and tags as filters;
  sorting; a list view; bulk selection to lock, tag, file in an album, wish or dissolve.
- **Profile.** Name, motto, a medallion card, a showcase of five, stats, albums (ten, forty cards
  each) and a wishlist of forty. A vault theme tints the banner and, if chosen, the whole game.
- **Card looks.** Frames repeat a pantheon's band ornament along the edge, so every frame belongs to
  the game's own family; eleven tints from metals and mosaic stones. Pantheon seals come free with
  their cards; glyph stickers are bought. Effects open with copies (3, 5, 10), which gives
  duplicates a use besides dissolving.

Left out on purpose: trading, offers, auctions, friends and notifications between players need a
server and accounts; the market replaces trading as a way to reach a missing card. Anything paid
or premium is out, as everywhere in Tesserae.
