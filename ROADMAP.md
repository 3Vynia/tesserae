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

- [ ] Card mechanics schema validated with Zod, per-language card text
- [ ] 20 sample cards across at least 5 pantheons, with sources
- [ ] Translation check covers card text

## Phase 2: card component (v0.2.0)

- [ ] Layered card: art, frame, effect, stickers
- [ ] 3D tilt, holographic shine by rarity, flip to the back
- [ ] Swappable placeholder art and `docs/art-guide.md`

## Phase 3: collection (v0.3.0)

- [ ] Mosaic view grouped by pantheon with ornaments
- [ ] Filters and detail view

## Phase 4: summoning (v0.4.0)

- [ ] Banners, visible drop rates, pity
- [ ] Pull history, daily quests, pull animation
- [ ] Save in IndexedDB

## Phase 5: combat (v0.5.0)

- [ ] Deterministic auto-battle engine: formation, synergies, elements
- [ ] Combat UI and animations
- [ ] Campaign chapters, tower, bosses

## Phase 6: progression (v0.6.0)

- [ ] Levels 1 to 60, ascension milestones
- [ ] Duplicates to stars and awakening
- [ ] Relics

## Phase 7: personalization (v0.7.0)

- [ ] Frames, effects, stickers, fonts and tint per card with preview

## Phase 8: polish (v1.0.0)

- [ ] Sound, mobile layout, accessibility pass
- [ ] Offline PWA
- [ ] Save export and import
- [ ] Performance budget enforced in CI

## Open items

- Donation link for the README (needs an account chosen by the maintainer).
