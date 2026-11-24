# Design

The visual system of Tesserae in one page. Details:

- [docs/design/direction.md](docs/design/direction.md): concept, palette with contrast, type,
  ornaments, texture.
- [docs/design/motion.md](docs/design/motion.md): durations, easings, staggers, reduced motion.
- [docs/design/components.md](docs/design/components.md): component inventory and states.
- [src/styles/tokens.css](src/styles/tokens.css): the tokens themselves.

## World

A mosaic vault at night: deep blue glass tiles set with gold stars, read through the engraved
line work of old star atlases. Cards are tesserae; owning one lights its tile.

## Rules

1. Ground is ink and vault blue. Gold is the only metal and the only accent. Parchment is for text
   and for reading surfaces.
2. IM Fell English for display, its small caps for labels, Alegreya for reading. No sans serif
   identity, no uppercase transforms on running text.
3. Left-aligned, asymmetric compositions. Rules and space divide content; boxes are rare and never
   nested.
4. One ornament band per pantheon, always marking a beginning or an edge, never wallpaper.
5. Everyday motion under 300 ms on shared curves; ceremonies get the spectacle. Calm motion keeps
   every state and removes travel.
6. Icons are drawn in-house in the engraved line style. No emoji, no stock sets.
7. Forbidden: gradient text, purple-to-blue gradients, glass blur cards, neon glow as the main
   effect, uniform grids of identical rounded cards.
