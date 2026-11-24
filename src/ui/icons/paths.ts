// Engraved line icons on a 24-unit grid, drawn for Tesserae. Stroke only, 1.5 units, round caps.
export const ICONS = {
  // oculus: a vault arch with the opening at its crown
  home: 'M3.5 20.5V11a8.5 8.5 0 0 1 17 0v9.5 M3.5 20.5h17 M12 5.2a2.3 2.3 0 1 0 0 .01 M8 20.5v-6.5a4 4 0 0 1 8 0v6.5',
  // a cluster of offset tesserae
  collection:
    'M3.5 4.5h7v6h-7z M13.5 3.5h7v7h-7z M3.5 13.5h6v7h-6z M12.5 13.5h8v6h-8z M15.5 18.5l0 0',
  // rays converging on a star
  summon:
    'M12 7.5l1.3 3.2 3.2 1.3-3.2 1.3L12 16.5l-1.3-3.2L7.5 12l3.2-1.3z M12 2v2.5 M12 19.5V22 M2 12h2.5 M19.5 12H22 M5 5l1.8 1.8 M17.2 17.2 19 19 M19 5l-1.8 1.8 M6.8 17.2 5 19',
  // crossed spears
  battle:
    'M4 20L18.5 5.5 M15.5 4.5l4-1-1 4 M20 20L5.5 5.5 M8.5 4.5l-4-1 1 4 M6.5 15.5l2 2 M17.5 15.5l-2 2',
  // astrolabe
  settings:
    'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17z M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10z M4 15.5L20 8.5 M12 1.5v2',
  back: 'M14.5 5.5L8 12l6.5 6.5 M8.5 12H20',
  close: 'M6 6l12 12 M18 6L6 18',
  chevron: 'M6.5 9.5L12 15l5.5-5.5',
  star: 'M12 3.5l2.4 5.6 6.1.5-4.6 4 1.4 5.9L12 16.4l-5.3 3.1 1.4-5.9-4.6-4 6.1-.5z',
  flip: 'M4.5 9a7.5 7.5 0 0 1 13.4-2.6 M18.5 3.5v3.5H15 M19.5 15a7.5 7.5 0 0 1-13.4 2.6 M5.5 20.5V17H9',
  filter: 'M4 6h16 M7 12h10 M10 18h4',
  language:
    'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17z M3.5 12h17 M12 3.5c-2.6 2.4-3.6 5.2-3.6 8.5s1 6.1 3.6 8.5 M12 3.5c2.6 2.4 3.6 5.2 3.6 8.5s-1 6.1-3.6 8.5',
  motion: 'M3 12c2.5-4 5-4 7.5 0s5 4 7.5 0 M3 17c2.5-4 5-4 7.5 0 M10.5 7c2.5-4 5-4 7.5 0 M18 7l3 0',
  shield: 'M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z M12 8v7 M9 11.5h6',
  starlight:
    'M12 2.5l1.6 6.2 4.9-4.1-3.2 5.6 6.2 1.8-6.2 1.8 3.2 5.6-4.9-4.1L12 21.5l-1.6-6.2-4.9 4.1 3.2-5.6L2.5 12l6.2-1.8-3.2-5.6 4.9 4.1z',
  history: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3 M4 4v3.5h3.5 M12 8v4.5l3 2',
  quest: 'M6 3.5h12v17l-6-4-6 4z M9 8.5h6 M9 12h4',
  tower: 'M7 21V8l5-5 5 5v13 M4 21h16 M10 21v-4a2 2 0 0 1 4 0v4 M10 10h4 M10 13.5h4 M7 8h10',
  scroll:
    'M6 4h11a2 2 0 0 1 2 2v11 M6 4a2 2 0 0 0-2 2v1h4 M6 4a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1H10 M11 9h5 M11 12.5h5',
  info: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17z M12 11v5.5 M12 7.6v.4',
  // the wheel of Fortuna: rim, hub and eight spokes
  wheel:
    'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z M12 3v6.5 M12 14.5V21 M3 12h6.5 M14.5 12H21 M5.6 5.6l4.6 4.6 M13.8 13.8l4.6 4.6 M18.4 5.6l-4.6 4.6 M10.2 13.8l-4.6 4.6',
  // a carved frame with a chisel across it
  workshop: 'M4 4h12v12H4z M7 7h6v6H7z M14 14l6 6 M18 20l2-2',
  // a pair of scales
  market:
    'M12 3.5v17 M8 20.5h8 M4.5 7h15 M12 5a1 1 0 1 0 0 .01 M4.5 7L2 13a2.5 2.5 0 0 0 5 0z M19.5 7L17 13a2.5 2.5 0 0 0 5 0z',
  // a bust in profile on a plinth
  profile: 'M12 3.5a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M5 20.5c0-4 3-6.5 7-6.5s7 2.5 7 6.5z',
  more: 'M5 12a1 1 0 1 0 0 .01 M12 12a1 1 0 1 0 0 .01 M19 12a1 1 0 1 0 0 .01',
  // a votive bowl with a flame
  offering:
    'M3.5 12.5h17a8.5 6 0 0 1-17 0z M8 20.5h8 M12 3.5c2 2 2.5 3.5 1.5 5S10 9.5 10.5 7.5 12 5.5 12 3.5z',
  lock: 'M6 10.5h12v10H6z M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3 M12 14.5v2.5',
  unlock: 'M6 10.5h12v10H6z M8.5 10.5V7.5a3.5 3.5 0 0 1 6.8-1.2 M12 14.5v2.5',
  tag: 'M3.5 12.5V4h8.5l8.5 8.5-8 8z M8 8a.8.8 0 1 0 0 .01',
  album: 'M5 3.5h12a2 2 0 0 1 2 2v15H7a2 2 0 0 1-2-2z M5 18.5a2 2 0 0 1 2-2h12 M9 8h6 M9 11h4',
  // a shooting star: the wish
  wish: 'M14.5 4l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z M10.5 13.5L3.5 20.5 M8 12l-3 3 M12 16l-3 3',
  dust: 'M6 6a1 1 0 1 0 0 .01 M12 4a1.5 1.5 0 1 0 0 .01 M18 7a1 1 0 1 0 0 .01 M8 12a1.5 1.5 0 1 0 0 .01 M15 11a1 1 0 1 0 0 .01 M5 17a1 1 0 1 0 0 .01 M11 18a1.5 1.5 0 1 0 0 .01 M18 16a1.5 1.5 0 1 0 0 .01',
  // a golden tessera: a cut square standing on its corner
  golden: 'M12 2.5l9.5 9.5-9.5 9.5L2.5 12z M12 7l5 5-5 5-5-5z',
  replay: 'M5 12a7 7 0 1 0 2.1-5 M5 4v4h4 M10.5 9v6l5-3z',
  grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  list: 'M4 6h2 M9 6h11 M4 12h2 M9 12h11 M4 18h2 M9 18h11',
  check: 'M4.5 12.5l5 5 10-11',
  select: 'M4 4h16v16H4z M8 12l3 3 5-6',
  dissolve:
    'M7 4h10l-1.5 7h-7z M9 14.5a1 1 0 1 0 0 .01 M13 15.5a1 1 0 1 0 0 .01 M11 18.5a1 1 0 1 0 0 .01 M15 19.5a1 1 0 1 0 0 .01 M7.5 19a1 1 0 1 0 0 .01',
  sticker: 'M4 4h16v9l-7 7H4z M13 20v-7h7',
  effect:
    'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z M18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z M5.5 15.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z',
  plus: 'M12 5v14 M5 12h14',
  edit: 'M4 20l1-4.5L15.5 5a2 2 0 0 1 3 3L8 18.5z M13.5 7l3 3',
  gift: 'M4 9h16v4H4z M5.5 13h13v7.5h-13z M12 9v11.5 M12 9C10 9 7.5 8 7.5 6s2.5-2 4.5 3 M12 9c2 0 4.5-1 4.5-3S14 4 12 9',
  sort: 'M7 4v16 M4 17l3 3 3-3 M17 20V4 M14 7l3-3 3 3',
  trash: 'M4.5 6.5h15 M9 6.5V4h6v2.5 M6.5 6.5l1 14h9l1-14',
  search: 'M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13z M15.5 15.5L20.5 20.5',
} as const;

export type IconName = keyof typeof ICONS;
