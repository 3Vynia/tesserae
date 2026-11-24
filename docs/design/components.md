# Component inventory

Tokens live in `src/styles/tokens.css`. Every component below uses only those tokens. States not
listed for a component do not apply to it.

Shared rules:

- **Focus**: 2 px `--focus` outline, 3 px offset, on `:focus-visible` only. Never removed.
- **Press**: `scale(0.97)` over `--dur-press` with `--ease-out` on every pressable surface.
- **Hover**: color and line changes only, `--dur-quick`, gated behind `(hover: hover) and (pointer: fine)`.
- **Disabled**: 45% opacity, no hover or press, `cursor: not-allowed`, and the reason given in text
  next to the control (never a silent grey).
- **Loading**: the control keeps its size; a small constellation tracer replaces the icon.
- **Calm motion**: everything below keeps its state colors; only movement is removed.

## Actions

| Component        | Default                               | Hover                          | Focus   | Active | Disabled          | Loading             |
| ---------------- | ------------------------------------- | ------------------------------ | ------- | ------ | ----------------- | ------------------- |
| Button, gilt     | gold-leaf fill, ink text, bevel       | sheen crosses once             | outline | press  | dim, reason shown | tracer, label stays |
| Button, engraved | transparent, gold hairline, gold text | fill `--vault`, line brightens | outline | press  | dim, reason shown | tracer              |
| Button, quiet    | text only, underline on hover         | underline draws from left      | outline | press  | dim               | n/a                 |
| Icon button      | 44 px target, engraved icon           | icon to pale gold              | outline | press  | dim               | tracer              |

## Inputs

| Component          | Default                                | Hover          | Focus               | Disabled | Error                               |
| ------------------ | -------------------------------------- | -------------- | ------------------- | -------- | ----------------------------------- |
| Select             | vault fill, hairline, engraved chevron | line brightens | outline + line gold | dim      | ember line, message below           |
| Segmented choice   | row of plates, selected plate lapis    | plate lightens | outline on plate    | dim      | n/a                                 |
| Filter seal        | wax-seal toggle with pantheon glyph    | ring brightens | outline             | dim      | n/a                                 |
| File drop (import) | dashed gold frame                      | frame solid    | outline             | dim      | ember frame, problem and fix stated |

## Navigation

| Component   | Default               | Hover              | Focus   | Current                                    |
| ----------- | --------------------- | ------------------ | ------- | ------------------------------------------ |
| Nav link    | engraved icon + label | label to pale gold | outline | gold thread under it, slides between links |
| Tab / plate | small caps label      | label brightens    | outline | lapis plate behind, slides on change       |

## Collection

| Component     | Empty (not owned)                   | Owned                          | New                             | Hover                           | Focus               | Selected   |
| ------------- | ----------------------------------- | ------------------------------ | ------------------------------- | ------------------------------- | ------------------- | ---------- |
| Mosaic tile   | dark glass, pantheon glyph at 20%   | gold leaf with rarity edge     | small star in corner until seen | lifts 2 px, edge brighter       | outline             | lapis ring |
| Pantheon band | ornament at 40%, name in small caps | ornament at 100% when complete | n/a                             | n/a                             | n/a                 | n/a        |
| Card          | n/a                                 | layered front, flips to back   | n/a                             | 3D tilt and foil follow pointer | outline around card | n/a        |

Empty collection: the vault is drawn dark with every slot outlined; the message points to the
first free pull. Error loading the save: plain explanation, and buttons to retry or import a file.

## Feedback

| Component                      | Behavior                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Toast (reward)                 | enters from the bottom edge, 400 ms `ease`, stays 4 s, leaves the same way; paused while hovered or the tab is hidden |
| Currency counter               | counts up over 600 ms with old-style figures, tabular; a coin flies to it on rewards                                  |
| Pity meter                     | an arc of 90 tiles that light one by one; the number is printed beside it                                             |
| Constellation tracer (loading) | three stars joined by a line that draws and fades, 900 ms loop                                                        |
| Inline message                 | icon + one sentence; ember for errors, verdigris for success, never only color                                        |

## Sheets and ceremonies

| Component     | Open                                                 | Close                                    | Calm motion              |
| ------------- | ---------------------------------------------------- | ---------------------------------------- | ------------------------ |
| Detail sheet  | card flies from its tile, sheet rises `--ease-sheet` | reverse, 70% of the time                 | crossfade                |
| Pull ceremony | stars converge, rarity reveal, card settles          | card slots into the mosaic with a ripple | glow fades in, no travel |
| Battle stage  | formation slides in, turn ribbon draws               | result plate                             | positions fade           |

Modals are not used for anything that does not need protected focus. The detail sheet and the
ceremony trap focus and close with Escape.
