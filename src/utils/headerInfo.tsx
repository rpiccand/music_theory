import React from 'react';
import type { ChordToken } from '../types';
import { MUSIC_FONT } from '../constants';
import {
  KEYS,
  PC_TO_TONIC_LETTER_RANK,
  RANK_TO_LETTER,
  majorKeySignatureFor,
  letterRankToNameFr,
  accidentalForLetterInKey,
  isWhitePc,
  pcOfMidi,
  majorScaleMidis
} from './music';

export function useHeaderInfo(keyIndex: number) {
  const currentKey = KEYS[keyIndex];
  const scaleMidis = React.useMemo(() => majorScaleMidis(currentKey.pc), [currentKey]);
  const tonicLetterRank = PC_TO_TONIC_LETTER_RANK[currentKey.pc];
  const sig = majorKeySignatureFor(currentKey.pc);

  // Header accidental info
  const headerAccCount = sig.type === 'none' ? 0 : sig.count;
  const headerAccType: 'none' | 'sharp' | 'flat' = sig.type;
  const headerAccStr = sig.type === 'none' || sig.count === 0 ? '—' : String(headerAccCount);

  // Chord tokens for Tétrade du I
  const chordLRsI = [0, 2, 4, 6].map(o => (tonicLetterRank + o) % 7);
  const chordTokensI: ChordToken[] = chordLRsI.map(lr => {
    const letter = RANK_TO_LETTER[lr] as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
    const base = letterRankToNameFr(lr);
    const acc = accidentalForLetterInKey(letter, currentKey.pc);
    return { base, acc };
  });

  // Render chord names with small accidentals
  const chordNamesINodesSmall = chordTokensI.map((tok, idx) => {
    const prev = chordTokensI[idx - 1];
    const needsSpace = idx === 0 ? false : prev && prev.acc !== 'flat';
    return (
      <React.Fragment key={`tok-small-${idx}`}>
        {needsSpace ? ' ' : ''}
        <span>{tok.base}</span>
        {tok.acc && (
          <span style={{ fontFamily: MUSIC_FONT, fontSize: '0.7em', verticalAlign: 'super' }}>
            {tok.acc === 'sharp' ? '♯' : '♭'}
          </span>
        )}
      </React.Fragment>
    );
  });

  // Scale schema (alteration pattern)
  const headerScaleSchemaPretty = (() => {
    const letters = Array.from({ length: 7 }, (_, d) =>
      RANK_TO_LETTER[(tonicLetterRank + d) % 7] as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
    );
    const marks = letters.map(letter => (accidentalForLetterInKey(letter, currentKey.pc) ? "'" : ","));
    return marks.join('\u00A0') + '\u00A0\u00A0\u00A0\u00A0';
  })();

  // Chord schema (white/black key pattern)
  const chordPcsI = [0, 2, 4, 6].map(o => pcOfMidi(scaleMidis[(0 + o) % 7] + (o >= 7 ? 12 : 0)));
  const headerChordSchema = (() => {
    const marks: string[] = [];
    for (let i = 0; i < chordPcsI.length - 1; i++) {
      const aW = isWhitePc(chordPcsI[i]);
      const bW = isWhitePc(chordPcsI[i + 1]);
      if (aW && !bW) marks.push('/');
      else if (!aW && bW) marks.push('\\');
      else marks.push('-');
    }
    return marks.join('');
  })();

  return {
    currentKey,
    headerAccStr,
    headerAccType,
    headerScaleSchemaPretty,
    chordNamesINodesSmall,
    headerChordSchema
  };
}