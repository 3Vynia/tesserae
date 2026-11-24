# Visual direction: the starry vault

## Concept

Tesserae is a mosaic vault at night. The reference is the blue ceiling of the Mausoleum of Galla
Placidia in Ravenna (5th century): a dome of deep blue glass tesserae set with hundreds of gold
stars. We cross it with the engraved star atlases of the 17th century, where constellations are
drawn as figures over a grid of fine lines.

Every card is a tessera set into that vault. An empty slot is dark glass; an owned card is a tile
of gold leaf that catches the light. The collection screen is the vault seen from below. The rest
of the interface is the atlas: engraved rules, small caps, marginal notes and plate numbers.

Alternatives considered:

- _Illuminated manuscript_ (parchment ground, red and blue initials). Beautiful for the card backs,
  but a light parchment ground fights the night sky the brief asks for. Kept as the material of
  the card back and of reading surfaces only.
- _Museum display case_ (dark velvet, brass labels). Strong for the detail view, but it turns the
  collection into a list of exhibits instead of one picture. Rejected as the main metaphor.
- _Star chart only_ (fine lines on black). Too cold, and it hides the gold. Absorbed into the
  vault as the line language.

The vault won because it joins the two halves of the brief: the mosaic (the game's name and its
collection) and the night sky with constellations.

## The oculus (home)

The home screen is the vault seen from its center: an oculus, like the opening at the top of the
Pantheon in Rome or the painted skies of Baroque ceilings where gods sit among clouds. Warm light
breaks through procedural clouds in the middle; toward the edges the clouds cool into lapis and
the night returns with its gold stars. The title sits over the light in very wide, monumental
Fell capitals. Entering the collection opens the oculus: the light widens until it becomes the
vault of tiles.

The maintainer pointed to a reference she liked: a painted golden-hour sky with a monumental serif
title over it. We keep its mood (a luminous painted sky, a large spaced serif, an entrance) and
leave its parts (photographic doves, a centered pill button, video). The clouds are generated in
the browser from noise and colored with our palette, so there are no image files and nothing to
download.

Two extra colors live only inside the oculus light: dawn `#f2c879` and ember glow `#e7965c`. Text
never sits on them without a dark scrim. The title is placed where the vignette darkens the sky;
measured against the brightest rendered pixel behind it the worst case is 5.1:1 (large text, AA
needs 3:1), and the tagline and body text stay above 12:1.

## Mood

Quiet awe, lit by candles. Most of the time the screen is still and dark, with small points of
gold. When something matters (a pull, a reveal, a victory) the gold wakes up and moves. Calm
surfaces, rare spectacle.

## Palette

| Token     | Hex       | Role                                                 |
| --------- | --------- | ---------------------------------------------------- |
| ink       | `#070a14` | page ground, the night between tiles                 |
| vault     | `#0e1834` | raised surfaces, panels, the blue of the glass tiles |
| lapis     | `#1d2c63` | active fills, selected tiles, strong rules           |
| gold leaf | `#d4ad55` | ornament, focus, primary actions, owned tiles        |
| pale gold | `#ecd496` | headings and highlights on dark ground               |
| parchment | `#f1e6cc` | body text; the card back and reading surfaces        |
| vellum    | `#b9ae95` | secondary text                                       |
| ember     | `#e8957a` | errors, damage                                       |
| verdigris | `#86c4a6` | success, healing                                     |

Rarity colors: Mortal bronze `#c49a74`, Hero silver `#b4c8dc`, Demigod verdigris `#86c4a6`, God
gold `#d4ad55`, Primordial pearl `#e6dcf0` with an iridescent sheen.

Measured contrast (WCAG 2.x ratio, text over ground):

| Text      | on ink | on vault | on lapis |
| --------- | -----: | -------: | -------: |
| parchment |   15.9 |     14.1 |     10.6 |
| pale gold |   13.6 |     12.0 |      9.1 |
| gold leaf |    9.3 |      8.3 |      6.2 |
| vellum    |    9.0 |      8.0 |      6.0 |
| ember     |    8.5 |      7.5 |      5.7 |
| verdigris |    9.8 |      8.7 |      6.6 |
| bronze    |    7.7 |      6.9 |      5.2 |
| silver    |   11.5 |     10.2 |      7.7 |
| pearl     |   14.9 |     13.2 |     10.0 |

Ink on a gold-leaf button: 9.3. Every pair above passes AA for body text; most pass AAA.
There is no purple-to-blue gradient anywhere: blue is a flat glass color, and gold is the only
metal.

## Typography

- **Display: IM Fell English** (Igino Marini's revival of the Fell types, cut in the 1670s and used
  in English printing of that era). It is the lettering of the atlas plates: slightly rough, warm,
  with real ink spread. Used large and sparingly: screen titles, card names, numbers in ceremonies.
- **Labels: IM Fell English SC**, true small caps from the same family, for plate labels,
  pantheon names and table headers. No uppercase transforms on running text.
- **Body: Alegreya**, a calligraphic text face made for literature. It stays readable at 15 px on a
  phone, has true italics for epithets and old-style figures that sit well next to Fell.

All three are under the SIL Open Font License and bundled from npm packages.

Rejected: Cormorant Garamond (used in the first prototype; the default "elegant serif", thin and fragile at small sizes on dark
ground), Cinzel (the generic fantasy-game face), any sans as the identity.

## Ornament language per pantheon

Each pantheon owns a band ornament, drawn as an SVG pattern in a single stroke weight (1.25 units
on a 20-unit cell) so they read as one family:

| Pantheon     | Ornament                 |
| ------------ | ------------------------ |
| Greek        | meander (Greek key)      |
| Roman        | laurel band              |
| Norse        | interlaced knotwork      |
| Egyptian     | lotus and bud frieze     |
| Mesopotamian | rosettes                 |
| Celtic       | running spirals          |
| Slavic       | lozenge chain            |
| Persian      | palmette scroll          |
| Aztec        | stepped fret             |
| Maya         | scroll and dot band      |
| Inca         | stepped squares          |
| Chinese      | auspicious clouds        |
| Japanese     | waves (overlapping arcs) |

Ornaments mark where a pantheon begins: the band over a pantheon's section of the mosaic, the
frame of its cards, the edge of a detail sheet. They are never wallpaper. Symbols tied to living
worship are avoided (see `docs/decisions.md`).

## Texture

- Glass: tiles are flat blue with a faint inner bevel (one light edge, one dark edge), never glossy.
- Gold leaf: a flat gold with a slow diagonal sheen that crosses it on showpiece moments only. Gold
  is a fill and a line, not a glow.
- Engraving: hairlines at 1 px in gold at 30% opacity for rules and grids; constellations drawn with
  the same line.
- Paper: the card back and reading sheets use parchment with a fine fibrous noise generated as an
  inline SVG filter, no image files.

## Composition

- Left-aligned text, asymmetric layouts. Title plates sit off-axis like atlas captions.
- Hierarchy through size and space, not boxes. Panels are rare; rules and margins divide content.
- Radii are small (2 px on tiles, 4 px on controls); the vault is architecture, not pillows.
- Icons are our own SVG set in the engraved line style (see `src/ui/icons`).

## Motion

See [motion.md](motion.md). In short: everyday actions are quick and nearly invisible, showpieces
are slow and rich, and everything shares a small set of curves.
