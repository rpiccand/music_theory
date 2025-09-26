export type ModeName = 'ionian'|'dorian'|'phrygian'|'lydian'|'mixolydian'|'aeolian'|'locrian';

export const MODE_STEPS: Record<ModeName, number[]> = {
  ionian:     [0,2,4,5,7,9,11],
  dorian:     [0,2,3,5,7,9,10],
  phrygian:   [0,1,3,5,7,8,10],
  lydian:     [0,2,4,6,7,9,11],
  mixolydian: [0,2,4,5,7,9,10],
  aeolian:    [0,2,3,5,7,8,10],
  locrian:    [0,1,3,5,6,8,10],
};

const PITCH_CLASS: Record<string, number> = {
  C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,'Fb':4,'E#':5,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11,Cb:11,'B#':0
};

const LETTERS = ['C','D','E','F','G','A','B'] as const;
type Letter = typeof LETTERS[number];
const NAT_PC: Record<Letter, number> = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };

const FLAT_KEYS = new Set(['F','Bb','Eb','Ab','Db','Gb','Cb']);
const SHARP_KEYS = new Set(['G','D','A','E','B','F#','C#']);

function prefersFlats(tonic: string) {
  const T = tonic.replace(/[^A-G#b]/gi,'');
  if (FLAT_KEYS.has(T)) return true;
  if (SHARP_KEYS.has(T)) return false;
  if (/#$/.test(T)) return false;
  if (/b$/.test(T)) return true;
  return false;
}

function spell(pc: number, letter: Letter, preferFlats: boolean) {
  const natural = NAT_PC[letter];
  let delta = ((pc - natural) % 12 + 12) % 12; // 0..11
  if (delta > 6) delta -= 12; // -5..+6
  if (delta === 0) return letter;
  if (delta === 1) return preferFlats ? `${letter}♭♭` : `${letter}#`;
  if (delta === -1) return `${letter}♭`;
  if (delta === 2) return preferFlats ? `${letter}♭` : `${letter}##`;
  if (delta === -2) return `${letter}♭♭`;
  return preferFlats ? `${letter}♭` : `${letter}#`;
}

export function computeModalScale(tonic: string, mode: ModeName): string[] {
  const pc0 = PITCH_CLASS[tonic];
  if (pc0 == null) throw new Error(`Unknown tonic: ${tonic}`);
  const preferFlats = prefersFlats(tonic);
  const startLetter = (tonic[0].toUpperCase() as Letter);
  const letters: Letter[] = Array.from({length:7}, (_,i) => LETTERS[(LETTERS.indexOf(startLetter)+i)%7]);
  return MODE_STEPS[mode].map((semi, i) => spell((pc0 + semi) % 12, letters[i], preferFlats));
}

// Nouvelle fonction pour calculer la tonalité courante dans le mode donné
export function computeCurrentKeyInMode(currentKey: string, mode: ModeName): string[] {
  const pc0 = PITCH_CLASS[currentKey];
  if (pc0 == null) throw new Error(`Unknown key: ${currentKey}`);
  const preferFlats = prefersFlats(currentKey);
  const startLetter = (currentKey[0].toUpperCase() as Letter);
  const letters: Letter[] = Array.from({length:7}, (_,i) => LETTERS[(LETTERS.indexOf(startLetter)+i)%7]);
  return MODE_STEPS[mode].map((semi, i) => spell((pc0 + semi) % 12, letters[i], preferFlats));
}

// Version qui prend un pitch class directement
export function computeCurrentPcInMode(pc: number, mode: ModeName): string[] {
  // Convertir PC vers nom de note anglais pour la fonction
  const pcToEnglish: Record<number, string> = {
    0: 'C', 1: 'C#', 2: 'D', 3: 'Eb', 4: 'E', 5: 'F',
    6: 'F#', 7: 'G', 8: 'Ab', 9: 'A', 10: 'Bb', 11: 'B'
  };

  const keyName = pcToEnglish[pc];
  const preferFlats = [1, 3, 6, 8, 10].includes(pc); // Db, Eb, Gb, Ab, Bb
  const startLetter = (keyName[0] as Letter);
  const letters: Letter[] = Array.from({length:7}, (_,i) => LETTERS[(LETTERS.indexOf(startLetter)+i)%7]);
  return MODE_STEPS[mode].map((semi, i) => spell((pc + semi) % 12, letters[i], preferFlats));
}
