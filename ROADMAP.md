# Roadmap

Each phase ends with lint, type check, translation check, tests and build passing, and is pushed to
`main`. Major phases are tagged.

## Phase 0: repository and base (v0.0.1)

- [x] Vite, Svelte 5, strict TypeScript
- [x] i18n runtime with English and Spanish, browser language detection, persisted choice
- [x] Translation check in CI (missing, orphan, unused keys, ICU syntax, placeholders)
- [x] Seeded deterministic random generator for game logic
- [x] ESLint, Prettier, Vitest, Playwright smoke test (also asserts no external requests)
- [x] GitHub Actions CI and deployment to GitHub Pages
- [x] READMEs in English and Spanish, MIT license

## Phase 1: data model and sample cards (v0.1.0)

- [x] Card mechanics schema validated with Zod, per-language card text
- [x] 20 sample cards across 7 pantheons, with sources
- [x] Tests fail on missing or orphan card text

## Phase 2: card component (v0.2.0)

- [x] Layered card: art, frame, effect (stickers arrive with personalization)
- [x] 3D tilt, holographic shine by rarity, flip to the back
- [x] Swappable placeholder art and `docs/art-guide.md`

## Phase 3: collection (v0.3.0)

- [x] Mosaic view grouped by pantheon with ornaments
- [x] Filters and detail view

## Phase 4: summoning (v0.4.0)

- [x] Banners, visible drop rates, pity
- [x] Pull history, daily quests, pull animation
- [x] Save in IndexedDB
- [x] ×100, ×1000 and any amount; golden tesserae every 200 summons; odds for every card
- [x] Wish history with stars and replay
- [x] Offerings, daily tribute and Fortuna's wheel

## Phase 5: combat (v0.5.0)

- [x] Deterministic auto-battle engine: formation, synergies, elements
- [x] Combat UI and animations
- [x] Campaign chapters, tower, bosses

## Phase 6: progression (v0.6.0)

- [x] Levels 1 to 60 from battle experience
- [ ] Ascension milestones (frame change, skill unlocks)
- [ ] Duplicates to stars and awakening
- [ ] Relics

## Phase 7: personalization (v0.7.0)

- [x] Frames from pantheon ornaments in eleven tints, stickers, effects, with live preview
- [x] Frame workshop with a weekly bench, a free gift and try-on
- [x] Profile: medallion, motto, showcase, stats, albums, wishlist, vault themes
- [x] Stardust from spare copies; the Oracle's market
- [ ] Title fonts per card

## Phase 8: polish (v1.0.0)

- [ ] Sound, mobile layout, accessibility pass
- [ ] Offline PWA
- [ ] Save export and import
- [ ] Performance budget enforced in CI (the main chunk is over Vite's 500 kB warning: split the
      views)

## Open items

- More chapters and cards: chapter 2 needs summoned cards to clear.
- Pantheons without cards yet: Roman, Slavic, Persian, Aztec, Maya, Inca.

- Donation link for the README (needs an account chosen by the maintainer).

## Visual layer

- [x] Product context, visual direction, motion language and component inventory (`DESIGN.md`,
      `docs/design/`)
- [x] Tokens, fonts, engraved icon set, ornaments for all 13 pantheons
- [x] Home oculus with procedural clouds, settings with motion preference, page transitions
- [x] Collection mosaic with filters, card detail with flip
- [x] Pull ceremony
- [x] Battle stage
