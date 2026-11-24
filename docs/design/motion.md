# Motion language

Motion in Tesserae has two registers.

- **Everyday** (navigation, filters, buttons, toggles): fast, light, interruptible. The player sees
  these dozens of times per session, so they confirm and get out of the way.
- **Ceremony** (lighting the vault, a pull, a card reveal, a battle): slow, layered, worth watching.
  These happen a few times per session and are where the spectacle budget is spent.

## Durations

| Token            | Value   | Use                                                    |
| ---------------- | ------- | ------------------------------------------------------ |
| `--dur-press`    | 120 ms  | press feedback, pressed scale                          |
| `--dur-quick`    | 180 ms  | hover color, small state changes, tab indicator        |
| `--dur-base`     | 240 ms  | panels, selects, filter changes, page transition out   |
| `--dur-sheet`    | 420 ms  | sheets and the detail view opening, page transition in |
| `--dur-flip`     | 700 ms  | card flip                                              |
| `--dur-ceremony` | 1200 ms | one beat of a ceremony (anticipation, reveal, settle)  |

Exits are faster than entrances (roughly 70%). Nothing in the everyday register goes over 300 ms.

## Easings

| Token           | Curve                               | Use                                 |
| --------------- | ----------------------------------- | ----------------------------------- |
| `--ease-out`    | `cubic-bezier(0.23, 1, 0.32, 1)`    | anything entering or responding     |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)`   | things moving across the screen     |
| `--ease-sheet`  | `cubic-bezier(0.32, 0.72, 0, 1)`    | sheets and the detail view          |
| `--ease-settle` | `cubic-bezier(0.34, 1.36, 0.64, 1)` | a card landing; one small overshoot |
| `ease`          | built in                            | color-only hover changes            |
| `linear`        | built in                            | sheen sweeps and constant rotation  |

`ease-in` is never used on interface elements: it delays the moment the player is watching.

Springs are used where motion follows the pointer or must carry velocity: card tilt and floating
damage numbers. They use a small critically damped spring in `src/ui/motion/spring.ts` (stiffness
170, damping 26 for tilt; stiffness 260, damping 18 for damage numbers, which may bounce once).

## Stagger patterns

- **Radial wave** (the vault lighting up, a pull landing in the mosaic): delay grows with distance
  from the origin, `18 ms × distance in tiles`, capped at 600 ms, plus a jitter of up to 25 ms so the
  wave does not look mechanical.
- **List** (filtered results, battle log entries): 40 ms between items, the first five only; later
  items appear with the fifth.
- **Line drawing** (constellations, ornaments): `stroke-dashoffset` from full length to 0 over
  `--dur-ceremony` with `--ease-in-out`, each line starting 80 ms after the previous one.

Stagger is decoration: it never blocks input.

## Properties and performance

- Animate `transform` and `opacity`. `clip-path` and `stroke-dashoffset` are allowed for reveals and
  line drawing; `filter: blur()` up to 6 px only to bridge crossfades.
- Hover motion is gated by `@media (hover: hover) and (pointer: fine)`.
- Particle budgets: 120 particles on desktop, 60 on narrow or low-core devices
  (`navigator.hardwareConcurrency <= 4`), 0 under reduced motion. Particles draw on one canvas.
- Page transitions use the View Transitions API when available and a crossfade otherwise.
- Pointer parallax writes `transform` on the moving layer directly, never through a CSS variable on
  a parent with many children.

## Reduced motion

`prefers-reduced-motion: reduce`, or the in-game Motion setting set to Calm, swaps movement for
light:

- Waves and staggers become one 240 ms crossfade.
- Card tilt is off; the foil shows a static sheen.
- The card flip becomes a crossfade between faces.
- Ceremonies keep their beats but use opacity and color only: the reveal is a glow that fades in.
- Battle lunges and camera shake are removed; damage numbers fade in place.

Nothing is hidden or skipped by reduced motion; only how it moves changes.
