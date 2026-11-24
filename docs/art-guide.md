# Art guide

There is no final card art yet. Every card shows a generated plate (pantheon ground, element
halo, star field and an engraved glyph) drawn by `src/ui/card/CardArt.svelte`. Real art replaces
it card by card without touching any other code.

## Adding art for a card

1. Put the file in `public/art/`, named after the card id: `public/art/zeus.webp`.
2. Set `art.file` in the card's entry in `src/data/cards.ts`: `art: { glyph: 'bolt', file: 'zeus.webp' }`.
3. Keep `glyph`: it is still used for the dark silhouette of the tile when the card is not owned.

## Format

| Property     | Value                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| Aspect ratio | 5:7 portrait (the card face)                                                |
| Size         | 1000 × 1400 px master; export 750 × 1050 px for the game                    |
| Format       | WebP, quality 82; AVIF optional alongside                                   |
| Weight       | under 180 KB per card                                                       |
| Color        | sRGB                                                                        |
| Safe area    | keep faces and key shapes inside the top 62% and 8% from each side          |
| Bottom third | darker or calmer: the name plate is drawn over it                           |
| Square crop  | the collection tile shows the center square, so the subject must read there |

## Style

- Painted or engraved, never photographic. Dark mid-tone grounds so gold and parchment text keep
  their contrast.
- Light from above or from the upper right, like the oculus on the home screen.
- No frames, borders, text or logos in the art: frames, names and rarity come from the game.
- No imagery from franchises, modern retellings or living religions (see `docs/decisions.md`).

## Licensing

Only art you made yourself or art under a license that allows redistribution and modification
(CC0, CC BY, CC BY-SA). Record the author and license of each file in `public/art/CREDITS.md`.
Do not add images downloaded from the web without a clear license.
