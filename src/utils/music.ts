// --- Pure music theory helpers & constants (no JSX) ------------------------

export type PitchClass = 0|1|2|3|4|5|6|7|8|9|10|11;

export const KEYS: { name: string; pc: PitchClass }[] = [
  { name: "Do", pc: 0 },
  { name: "Ré♭ (Do#)", pc: 1 },
  { name: "Ré", pc: 2 },
  { name: "Mi♭ (Ré#)", pc: 3 },
  { name: "Mi", pc: 4 },
  { name: "Fa", pc: 5 },
  { name: "Sol♭ (Fa#)", pc: 6 },
  { name: "Sol", pc: 7 },
  { name: "La♭ (Sol#)", pc: 8 },
  { name: "La", pc: 9 },
  { name: "Si♭ (La#)", pc: 10 },
  { name: "Si", pc: 11 },
];

export const AMERICAN_NAMES_FLAT = ["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"] as const;
export function americanKeyNameMajor(pc: number): string {
  return AMERICAN_NAMES_FLAT[((pc % 12) + 12) % 12];
}

export const DEGREE_SEMITONES_MAJOR = [0, 2, 4, 5, 7, 9, 11];

export const MODE_NAMES = [
  "Ionien (Majeur)",
  "Dorien",
  "Phrygien",
  "Lydien",
  "Mixolydien",
  "Éolien (Mineur naturel)",
  "Locrien",
];

export const MODE_DEGREE_FORMULAS = [
  "1 2 3 4 5 6 7",            // Ionien
  "1 2 ♭3 4 5 6 ♭7",         // Dorien
  "1 ♭2 ♭3 4 5 ♭6 ♭7",       // Phrygien
  "1 2 3 #4 5 6 7",          // Lydien
  "1 2 3 4 5 6 ♭7",          // Mixolydien
  "1 2 ♭3 4 5 ♭6 ♭7",        // Éolien
  "1 ♭2 ♭3 4 ♭5 ♭6 ♭7",      // Locrien
];

export const SHARP_ORDER_LETTERS = ["F","C","G","D","A","E","B"] as const;
export const FLAT_ORDER_LETTERS  = ["B","E","A","D","G","C","F"] as const;

export function majorKeySignatureFor(pc: number): { type: 'none'|'sharp'|'flat', count: number } {
  switch ((pc % 12 + 12) % 12) {
    case 0:  return { type: 'none',  count: 0 };
    case 7:  return { type: 'sharp', count: 1 };
    case 2:  return { type: 'sharp', count: 2 };
    case 9:  return { type: 'sharp', count: 3 };
    case 4:  return { type: 'sharp', count: 4 };
    case 11: return { type: 'sharp', count: 5 };
    case 6:  return { type: 'flat',  count: 6 };
    case 5:  return { type: 'flat',  count: 1 };
    case 10: return { type: 'flat',  count: 2 };
    case 3:  return { type: 'flat',  count: 3 };
    case 8:  return { type: 'flat',  count: 4 };
    case 1:  return { type: 'flat',  count: 5 };
    default: return { type: 'none', count: 0 };
  }
}

export const WHITE_PCS = new Set([0,2,4,5,7,9,11]);
export function isWhitePc(pc: number) { return WHITE_PCS.has(((pc%12)+12)%12); }
export function pcOfMidi(m: number) { return ((m % 12) + 12) % 12; }

export const SEVENTH_QUALITIES = ["Maj7", "m7", "m7", "Maj7", "7", "m7", "m7♭5"] as const;
export const ROMAN_NUMERALS = ["I","II","III","IV","V","VI","VII"];

export function romanForDegree(degree: number, quality: string) {
  if (quality === "m7" || quality === "m7♭5") return ROMAN_NUMERALS[degree].toLowerCase();
  return ROMAN_NUMERALS[degree];
}

export const LETTER_RANK: Record<string, number> = { C:0, D:1, E:2, F:3, G:4, A:5, B:6 };
export const PC_TO_TONIC_LETTER_RANK: number[] = [0,1,1,2,2,3,4,4,5,5,6,6];
export const LETTER_TO_NAME_FR = ["do","ré","mi","fa","sol","la","si"];
export const RANK_TO_LETTER = ["C","D","E","F","G","A","B"] as const;

export function letterRankToNameFr(letterRank: number): string {
  return LETTER_TO_NAME_FR[letterRank % 7];
}

export function americanNoteForLetterRank(lr: number, keyPc: number): { base: string; acc: 'sharp'|'flat'|null } {
  const letter = RANK_TO_LETTER[lr] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';
  const acc = accidentalForLetterInKey(letter, keyPc);
  return { base: letter, acc };
}

export function prettyQualityForDegree(degree: number): string {
  const q = SEVENTH_QUALITIES[degree];
  switch (q) {
    case 'm7': return 'min7';
    case 'm7♭5': return 'min7♭5';
    default: return q;
  }
}

export function accidentalForLetterInKey(letter: 'A'|'B'|'C'|'D'|'E'|'F'|'G', pc: number): 'sharp'|'flat'|null {
  const sig = majorKeySignatureFor(pc);
  if (sig.type === 'none' || sig.count === 0) return null;
  if (sig.type === 'sharp') {
    const idx = SHARP_ORDER_LETTERS.indexOf(letter as typeof SHARP_ORDER_LETTERS[number]);
    return (idx > -1 && idx < sig.count) ? 'sharp' : null;
  } else {
    const idx = FLAT_ORDER_LETTERS.indexOf(letter as typeof FLAT_ORDER_LETTERS[number]);
    return (idx > -1 && idx < sig.count) ? 'flat' : null;
  }
}

export function midiOctave(midi: number): number { return Math.floor(midi / 12) - 1; }

const P_E4 = 7*4 + LETTER_RANK.E;
export function staffPosFromLetterOct(letterRank: number, octave: number): number {
  return (7 * octave + letterRank) - P_E4;
}

export function staffPosToY(pos: number, STAFF_BOTTOM_Y: number, STEP_PX: number): number {
  return STAFF_BOTTOM_Y - pos * STEP_PX;
}

export function ledgerLinePositionsForStaffPos(pos: number): number[] {
  const lines: number[] = [];
  if (pos < 0) for (let p = -2; p >= pos; p -= 2) lines.push(p);
  else if (pos > 8) for (let p = 10; p <= pos; p += 2) lines.push(p);
  return lines;
}

export function buildSeventhChordIndices(rootDegree: number): number[] {
  return [0,2,4,6].map((o)=>(rootDegree+o)%7);
}

export function majorScaleMidis(keyPc: PitchClass): number[] {
  const baseC4 = 60;
  const tonicMidi = baseC4 + ((keyPc+12)%12);
  return DEGREE_SEMITONES_MAJOR.map(st=>tonicMidi+st);
}