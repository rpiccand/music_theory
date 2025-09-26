export const PIANO_KEY_WIDTH = 16;
export const PIANO_WHITE_COUNT = 14;
export const PIANO_WIDTH = PIANO_KEY_WIDTH * PIANO_WHITE_COUNT;

export const MUSIC_FONT = "'Noto Music','Noto Sans Symbols2','Bravura Text','Bravura','Segoe UI Symbol','Arial',sans-serif";
export const TRAIL_NBSP = '\u00A0\u00A0\u00A0\u00A0\u00A0';

export const VIEW_MODE_NAMES = {
  0: 'diatonique',
  1: 'tétrade',
  2: 'modes'
} as const;

export const NAVIGATION_LABELS = {
  diatonique: 'diatonique',
  circle: 'cycle de quintes',
  random: 'random'
} as const;