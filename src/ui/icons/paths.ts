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
} as const;

export type IconName = keyof typeof ICONS;
