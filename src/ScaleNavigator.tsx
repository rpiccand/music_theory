import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

// --- Music theory helpers ---------------------------------------------------

type PitchClass = 0|1|2|3|4|5|6|7|8|9|10|11;

const KEYS: { name: string; pc: PitchClass }[] = [
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

const AMERICAN_NAMES_FLAT = ["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"] as const;
function americanKeyNameMajor(pc: number): string {
  return AMERICAN_NAMES_FLAT[((pc % 12) + 12) % 12];
}

const DEGREE_SEMITONES_MAJOR = [0, 2, 4, 5, 7, 9, 11];

const MODE_NAMES = [
  "Ionien (Majeur)",
  "Dorien",
  "Phrygien",
  "Lydien",
  "Mixolydien",
  "Éolien (Mineur naturel)",
  "Locrien",
];

const MODE_DEGREE_FORMULAS = [
  "1 2 3 4 5 6 7",            // Ionien
  "1 2 ♭3 4 5 6 ♭7",         // Dorien
  "1 ♭2 ♭3 4 5 ♭6 ♭7",       // Phrygien
  "1 2 3 #4 5 6 7",          // Lydien
  "1 2 3 4 5 6 ♭7",          // Mixolydien
  "1 2 ♭3 4 5 ♭6 ♭7",        // Éolien (mineur naturel)
  "1 ♭2 ♭3 4 ♭5 ♭6 ♭7",      // Locrien
];

// Key signature mapping for MAJOR keys (prefer flats for enharmonic black keys as per labels)
const SHARP_ORDER_LETTERS = ["F","C","G","D","A","E","B"] as const;
const FLAT_ORDER_LETTERS  = ["B","E","A","D","G","C","F"] as const;

function majorKeySignatureFor(pc: number): { type: 'none'|'sharp'|'flat', count: number } {
  // Circle of fifths for MAJOR with enharmonic preference: use flats for 1 (Db) and 6 (Gb)
  switch ((pc % 12 + 12) % 12) {
    case 0:  return { type: 'none',  count: 0 }; // C
    case 7:  return { type: 'sharp', count: 1 }; // G
    case 2:  return { type: 'sharp', count: 2 }; // D
    case 9:  return { type: 'sharp', count: 3 }; // A
    case 4:  return { type: 'sharp', count: 4 }; // E
    case 11: return { type: 'sharp', count: 5 }; // B
    case 6:  return { type: 'flat',  count: 6 }; // prefer Gb over F# for our labels
    case 5:  return { type: 'flat',  count: 1 }; // F
    case 10: return { type: 'flat',  count: 2 }; // Bb
    case 3:  return { type: 'flat',  count: 3 }; // Eb
    case 8:  return { type: 'flat',  count: 4 }; // Ab
    case 1:  return { type: 'flat',  count: 5 }; // Db (instead of C#)
    default: return { type: 'none', count: 0 };
  }
}

// Piano white/black membership by pitch class (C=0..B=11)
const WHITE_PCS = new Set([0,2,4,5,7,9,11]);
function isWhitePc(pc: number) { return WHITE_PCS.has(((pc%12)+12)%12); }
function pcOfMidi(m: number) { return ((m % 12) + 12) % 12; }

// Preferred staff positions (treble) for accidentals by letter (E4 pos=0 ... F5 pos=8)
const TREBLE_POS_FOR_LETTER: Record<string, number> = {
  C: 5, D: 6, E: 7, F: 8, G: 2, A: 3, B: 4,
};

const MODE_ALTERATIONS = [
  "—",
  "♭3, ♭7",
  "♭2, ♭3, ♭6, ♭7",
  "#4",
  "♭7",
  "♭3, ♭6, ♭7",
  "♭2, ♭3, ♭5, ♭6, ♭7",
];

const SEVENTH_QUALITIES = ["Maj7", "m7", "m7", "Maj7", "7", "m7", "m7♭5"] as const;
const ROMAN_NUMERALS = ["I","II","III","IV","V","VI","VII"];

function romanForDegree(degree: number, quality: string) {
  if (quality === "m7" || quality === "m7♭5") return ROMAN_NUMERALS[degree].toLowerCase();
  return ROMAN_NUMERALS[degree];
}


const LETTER_RANK: Record<string, number> = { C:0, D:1, E:2, F:3, G:4, A:5, B:6 };
const PC_TO_TONIC_LETTER_RANK: number[] = [0,1,1,2,2,3,4,4,5,5,6,6];
const LETTER_TO_NAME_FR = ["do","ré","mi","fa","sol","la","si"]; // C,D,E,F,G,A,B
const RANK_TO_LETTER = ["C","D","E","F","G","A","B"] as const;
function letterRankToNameFr(letterRank: number): string {
  return LETTER_TO_NAME_FR[letterRank % 7];
}

// --- American note + 7th quality helpers (for Tétrades/Modes tonic labels) ---
function americanNoteForLetterRank(lr: number, keyPc: number): { base: string; acc: 'sharp'|'flat'|null } {
  const letter = RANK_TO_LETTER[lr] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';
  const acc = accidentalForLetterInKey(letter, keyPc);
  // American base letter is just the letter itself
  return { base: letter, acc };
}

function prettyQualityForDegree(degree: number): string {
  const q = SEVENTH_QUALITIES[degree];
  switch (q) {
    case 'm7': return 'min7';
    case 'm7♭5': return 'min7♭5';
    default: return q; // 'Maj7' or '7'
  }
}

function accidentalForLetterInKey(letter: 'A'|'B'|'C'|'D'|'E'|'F'|'G', pc: number): 'sharp'|'flat'|null {
  const sig = majorKeySignatureFor(pc);
  if (sig.type === 'none' || sig.count === 0) return null;
  if (sig.type === 'sharp') {
    const idx = SHARP_ORDER_LETTERS.indexOf(letter as any);
    return (idx > -1 && idx < sig.count) ? 'sharp' : null;
  } else {
    const idx = FLAT_ORDER_LETTERS.indexOf(letter as any);
    return (idx > -1 && idx < sig.count) ? 'flat' : null;
  }
}
function midiOctave(midi: number): number { return Math.floor(midi / 12) - 1; }
const P_E4 = 7*4 + LETTER_RANK.E;
function staffPosFromLetterOct(letterRank: number, octave: number): number {
  return (7 * octave + letterRank) - P_E4;
}
function staffPosToY(pos: number, STAFF_BOTTOM_Y: number, STEP_PX: number): number {
  return STAFF_BOTTOM_Y - pos * STEP_PX;
}
function ledgerLinePositionsForStaffPos(pos: number): number[] {
  const lines: number[] = [];
  if (pos < 0) for (let p = -2; p >= pos; p -= 2) lines.push(p);
  else if (pos > 8) for (let p = 10; p <= pos; p += 2) lines.push(p);
  return lines;
}
function noteheadWithLedger(
  cx: number,
  staffPos: number,
  scale = 1,
  STAFF_BOTTOM_Y: number,
  STEP_PX: number,
  noteFill?: string
) {
  const y = staffPosToY(staffPos, STAFF_BOTTOM_Y, STEP_PX);
  const elems: React.ReactNode[] = [];
  const ll = ledgerLinePositionsForStaffPos(staffPos);
  const halfLen = 12 * scale;
  for (let i = 0; i < ll.length; i++) {
    const yLine = staffPosToY(ll[i], STAFF_BOTTOM_Y, STEP_PX);
    elems.push(
      <line
        key={`ll-${i}`}
        x1={cx - halfLen}
        x2={cx + halfLen}
        y1={yLine}
        y2={yLine}
        stroke="#111"
        strokeWidth={1}
      />
    );
  }
  const rx = 6 * scale;
  const ry = 4 * scale;
  elems.push(
    <ellipse
      key="nh"
      cx={cx}
      cy={y}
      rx={rx}
      ry={ry}
      transform={`rotate(-15 ${cx} ${y})`}
      {...(noteFill ? { fill: noteFill } : {})}
    />
  );
  return elems;
}
function TrebleClef({ x, STAFF_TOP_Y, LINE_SPACING }: { x:number; STAFF_TOP_Y:number; LINE_SPACING:number }) {
  // We want the clef to span ~6 staff spacings (slightly taller than the 5 lines)
  const targetH = LINE_SPACING * 6;
  // Empirical multiplier so the glyph visually matches the target height across typical fonts
  const fontSize = targetH * 1.15;
  // Place the baseline near the bottom line (E line) and nudge up for better fit
  const bottomLineY = STAFF_TOP_Y + 4 * LINE_SPACING;
  const baselineY = bottomLineY - LINE_SPACING * 0.05; // lowered a bit more
  return (
    <text
      x={x}
      y={baselineY}
      fontSize={fontSize}
      fontFamily="'Noto Music','Bravura Text','Bravura','Petaluma','Musica','Segoe UI Symbol', serif"
      dominantBaseline="alphabetic"
    >
      {"\uD834\uDD1E" /* Unicode G clef 𝄞 */}
    </text>
  );
}

// --- Circle of Fifths overlay via portal ---
function CircleOverlay({ pc, onSelect, size=260, top=16 }: { pc:number; onSelect:(pc:number)=>void; size?:number; top?:number }) {
  const node = (
    <div
      style={{
        position: 'fixed',
        top,
        left: '100vw', // anchor to right edge of viewport
        transform: 'translateX(-100%)', // flush to right
        zIndex: 50,
        background: 'rgba(255,255,255,0.8)',
        borderRadius: '9999px',
        padding: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
      }}
    >
      <CircleOfFifths pc={pc} size={size} onSelect={onSelect} />
    </div>
  );
  return createPortal(node, document.body);
}
// --- Circle of Fifths SVG helper ---
function sectorPath(cx:number, cy:number, rInner:number, rOuter:number, a0:number, a1:number) {
  // angles in radians; draw clockwise
  const x0o = cx + rOuter * Math.cos(a0), y0o = cy + rOuter * Math.sin(a0);
  const x1o = cx + rOuter * Math.cos(a1), y1o = cy + rOuter * Math.sin(a1);
  const x1i = cx + rInner * Math.cos(a1), y1i = cy + rInner * Math.sin(a1);
  const x0i = cx + rInner * Math.cos(a0), y0i = cy + rInner * Math.sin(a0);
  const largeArc = (a1 - a0) % (2*Math.PI) > Math.PI ? 1 : 0;
  return [
    `M ${x0o} ${y0o}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x1o} ${y1o}`,
    `L ${x1i} ${y1i}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x0i} ${y0i}`,
    'Z',
  ].join(' ');
}

const COF_PCS: number[] = [0,7,2,9,4,11,6,1,8,3,10,5]; // C, G, D, A, E, B, Gb, Db, Ab, Eb, Bb, F
const COF_MAJ_LABELS = ['C','G','D','A','E','B','G♭','D♭','A♭','E♭','B♭','F'];
// Relative minors for each major above (aligned indices)
const COF_MIN_LABELS = ['Am','Em','Bm','F♯m','C♯m','G♯m','E♭m','B♭m','Fm','Cm','Gm','Dm'];

function CircleOfFifths({ pc, size=220, onSelect }: { pc: number; size?: number; onSelect?: (pc:number)=>void }) {
  const w = size, h = size; const cx = w/2, cy = h/2;
  const step = (2*Math.PI)/12;
  const rOuter = size*0.48, rInner = size*0.30, rHole = size*0.16;
  // current index on circle (C at 0, clockwise fifths)
  const idx = ((pc % 12) + 12) % 12; // pitch class
  const outerIdx = (idx * 7) % 12;   // map to circle index
  const highlightIdxMajor = outerIdx;
  const highlightIdxMinor = outerIdx; // aligned relative minor wedge beneath
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
         style={{ display: 'block' }}>
      {/* Outer ring (majors) */}
      {COF_PCS.map((_, i) => {
        const a0 = -Math.PI/2 + i*step; // start at top (C)
        const a1 = a0 + step;
        const isHi = i === highlightIdxMajor;
        return (
          <path
            key={`maj-${i}`}
            d={sectorPath(cx,cy,rInner,rOuter,a0,a1)}
            fill={isHi ? '#fde68a' : '#e5e7eb'}
            stroke="#111"
            strokeWidth={1}
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
            onClick={() => onSelect && onSelect(COF_PCS[i])}
            role="button"
            aria-label={`Select ${COF_MAJ_LABELS[i]} major`}
          />
        );
      })}
      {/* Inner ring (minors) */}
      {COF_PCS.map((_, i) => {
        const a0 = -Math.PI/2 + i*step; const a1 = a0 + step;
        const isHi = i === highlightIdxMinor;
        return (
          <path
            key={`min-${i}`}
            d={sectorPath(cx,cy,rHole,rInner,a0,a1)}
            fill={isHi ? '#fde68a' : '#ffffff'}
            stroke="#111"
            strokeWidth={1}
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
            onClick={() => onSelect && onSelect(COF_PCS[i])}
            role="button"
            aria-label={`Select ${COF_MIN_LABELS[i]} (relative of ${COF_MAJ_LABELS[i]})`}
          />
        );
      })}
      {/* Labels */}
      {COF_MAJ_LABELS.map((lab, i) => {
        const ang = -Math.PI/2 + (i+0.5)*step;
        const x = cx + (rInner + (rOuter-rInner)/2) * Math.cos(ang);
        const y = cy + (rInner + (rOuter-rInner)/2) * Math.sin(ang);
        return (
          <text
            key={`labM-${i}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size*0.09}
            fontFamily="'Noto Music','Noto Sans Symbols2','Bravura Text','Bravura','Segoe UI Symbol','Arial',sans-serif"
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
            onClick={() => onSelect && onSelect(COF_PCS[i])}
          >
            {lab}
          </text>
        );
      })}
      {COF_MIN_LABELS.map((lab, i) => {
        const ang = -Math.PI/2 + (i+0.5)*step;
        const x = cx + (rHole + (rInner-rHole)/2) * Math.cos(ang);
        const y = cy + (rHole + (rInner-rHole)/2) * Math.sin(ang);
        return (
          <text
            key={`labm-${i}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size*0.07}
            fontFamily="'Noto Music','Noto Sans Symbols2','Bravura Text','Bravura','Segoe UI Symbol','Arial',sans-serif"
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
            onClick={() => onSelect && onSelect(COF_PCS[i])}
          >
            {lab}
          </text>
        );
      })}
    </svg>
  );
}
function buildSeventhChordIndices(rootDegree: number): number[] {
  return [0,2,4,6].map((o)=>(rootDegree+o)%7);
}
function majorScaleMidis(keyPc: PitchClass): number[] {
  const baseC4 = 60;
  const tonicMidi = baseC4 + ((keyPc+12)%12);
  return DEGREE_SEMITONES_MAJOR.map(st=>tonicMidi+st);
}

// Helper to get y for accidental letter
function yForAccidentalLetter(letter: 'A'|'B'|'C'|'D'|'E'|'F'|'G', STAFF_BOTTOM_Y: number, STEP_PX: number) {
  const pos = TREBLE_POS_FOR_LETTER[letter];
  return staffPosToY(pos, STAFF_BOTTOM_Y, STEP_PX);
}

type ViewMode = 0|1|2; // 0=Notes, 1=Tétrades (7e), 2=Modes
const ScaleNavigator: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1000);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        if (e.contentRect) setContainerWidth(e.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [keyIndex, setKeyIndex] = useState<number>(0);
  const [view,setView] = useState<ViewMode>(0);
  const [navMode, setNavMode] = useState<'diatonique' | 'circle' | 'test'>('diatonique');
  const [recentTest, setRecentTest] = useState<number[]>([]); // last visited keys in test mode
  const [hideAlter, setHideAlter] = useState<boolean>(false);
  const [hideTetrade, setHideTetrade] = useState<boolean>(false);
  const [hideAlterSchema, setHideAlterSchema] = useState(false);
  const [hideTetradeSchema, setHideTetradeSchema] = useState(false);
  const [measureCoversByView, setMeasureCoversByView] = useState<Record<ViewMode, boolean[]>>({
    0: Array(7).fill(false),
    1: Array(7).fill(false),
    2: Array(7).fill(false),
  });

  // Click helpers to mimic arrow keys
  const goRight = () => {
    setKeyIndex(i => {
      if (navMode === 'diatonique') return (i + 1) % 12;
      if (navMode === 'circle')     return (i + 7) % 12; // perfect fifth up
      // test: choose a key not in the recent window (8) and not current
      const forbidden = new Set<number>([i, ...recentTest]);
      let candidates = Array.from({ length: 12 }, (_, k) => k).filter(k => !forbidden.has(k));
      if (candidates.length === 0) {
        candidates = Array.from({ length: 12 }, (_, k) => k).filter(k => k !== i);
      }
      const r = candidates[Math.floor(Math.random() * candidates.length)];
      setRecentTest(prev => {
        const next = [i, ...prev];
        return next.slice(0, 8);
      });
      if (navMode === 'test') {
        setHideAlter(true);
        setHideTetrade(true);
        setHideAlterSchema(true);
        setHideTetradeSchema(true);
        setMeasureCoversByView({ 0: Array(7).fill(true), 1: Array(7).fill(true), 2: Array(7).fill(true) });
      }
      return r;
    });
  };

  const goLeft = () => {
    setKeyIndex(i => {
      if (navMode === 'diatonique') return (i + 11) % 12; // -1 mod 12
      if (navMode === 'circle')     return (i + 5) % 12;  // perfect fifth down (i-7 ≡ i+5)
      const forbidden = new Set<number>([i, ...recentTest]);
      let candidates = Array.from({ length: 12 }, (_, k) => k).filter(k => !forbidden.has(k));
      if (candidates.length === 0) {
        candidates = Array.from({ length: 12 }, (_, k) => k).filter(k => k !== i);
      }
      const r = candidates[Math.floor(Math.random() * candidates.length)];
      setRecentTest(prev => {
        const next = [i, ...prev];
        return next.slice(0, 8);
      });
      if (navMode === 'test') {
        setHideAlter(true);
        setHideTetrade(true);
        setHideAlterSchema(true);
        setHideTetradeSchema(true);
        setMeasureCoversByView({ 0: Array(7).fill(true), 1: Array(7).fill(true), 2: Array(7).fill(true) });
      }
      return r;
    });
  };

  const viewNext = () => setView(v => ((v + 1) % 3) as ViewMode);
  const viewPrev = () => setView(v => ((v + 2) % 3) as ViewMode);

  const currentKey = KEYS[keyIndex];
  const scaleMidis = useMemo(()=>majorScaleMidis(currentKey.pc),[currentKey]);
  const tonicLetterRank = PC_TO_TONIC_LETTER_RANK[currentKey.pc];
  const tonicStartOct = useMemo(()=> midiOctave(scaleMidis[0]), [scaleMidis]);

  // Header info (Altérations / Schéma / Tétrade du I / Schéma de tétrade)
  const sig = majorKeySignatureFor(currentKey.pc);
  // Helpers for header accidental rendering
  const headerAccCount = sig.type === 'none' ? 0 : sig.count;
  const headerAccType: 'none'|'sharp'|'flat' = sig.type;
  const MUSIC_FONT = "'Noto Music','Noto Sans Symbols2','Bravura Text','Bravura','Segoe UI Symbol','Arial',sans-serif";
  // Trailing non-breaking spaces to stabilize end-alignment with slanted script fonts (Caveat)
  const TRAIL_NBSP = '\u00A0\u00A0\u00A0\u00A0\u00A0'; // ~5 spaces
  // Only the number, accidental glyph rendered separately
  const headerAccStr = sig.type === 'none' || sig.count === 0 ? '—' : String(headerAccCount);
  // Schéma des 7 degrés (sans l’octave) : '.' pour blanche, '°' pour noire (no spaces)
  const headerScaleSchema = scaleMidis
    .map(m => (isWhitePc(pcOfMidi(m)) ? '.' : '°'))
    .join('');
  // Tétrade du I (notes + altérations selon armure), as tokens for JSX rendering
  type ChordTok = { base: string; acc: 'sharp'|'flat'|null };
  const chordLRsI = [0,2,4,6].map(o => (tonicLetterRank + o) % 7);
  const chordTokensI: ChordTok[] = chordLRsI.map(lr => {
    const letter = RANK_TO_LETTER[lr] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';
    const base = letterRankToNameFr(lr);
    const acc  = accidentalForLetterInKey(letter, currentKey.pc);
    return { base, acc };
  });
  const chordNamesINodes = chordTokensI.map((tok, idx) => {
    const prev = chordTokensI[idx - 1];
    const needsSpace = idx === 0 ? false : prev && prev.acc !== 'flat';
    return (
      <React.Fragment key={`tok-${idx}`}>
        {needsSpace ? ' ' : ''}
        <span>{tok.base}</span>
        {tok.acc && (
          <span style={{ fontFamily: MUSIC_FONT }}>{tok.acc === 'sharp' ? '♯' : '♭'}</span>
        )}
      </React.Fragment>
    );
  });
  // Smaller accidental size for header Tétrade value (so ♯/♭ don't overpower the text)
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
  // Schéma d'altération (basé sur les 7 degrés de la gamme) :
  // Pour chaque degré, affiche '\'' si la note est altérée (#/♭) dans la tonalité, sinon ','.
  // Exemple en Sol majeur: G A B C D E F# → ", \u00A0, \u00A0, \u00A0, \u00A0, \u00A0, \u00A0, '"
  const headerScaleSchemaPretty = (() => {
    const letters = Array.from({ length: 7 }, (_, d) =>
      RANK_TO_LETTER[(tonicLetterRank + d) % 7] as 'A'|'B'|'C'|'D'|'E'|'F'|'G'
    );
    const marks = letters.map(letter => (accidentalForLetterInKey(letter, currentKey.pc) ? "'" : ","));
    return marks.join('\u00A0');
  })();
  const chordPcsI = [0,2,4,6].map(o => pcOfMidi(scaleMidis[(0+o)%7] + (o>=7?12:0)));
  // Schéma de la tétrade: '/', '\\', '-' selon alternance blanche/noire
  const headerChordSchema = (() => {
    const marks: string[] = [];
    for (let i=0; i<chordPcsI.length-1; i++) {
      const aW = isWhitePc(chordPcsI[i]);
      const bW = isWhitePc(chordPcsI[i+1]);
      if (aW && !bW) marks.push('/');
      else if (!aW && bW) marks.push('\\');
      else marks.push('-');
    }
    return marks.join('');
  })();

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if (e.key === "ArrowRight") {
        setKeyIndex(i => {
          if (navMode === 'diatonique') return (i + 1) % 12;
          if (navMode === 'circle')     return (i + 7) % 12; // perfect fifth up
          // test: choose a key not in the recent window (8) and not current
          const forbidden = new Set<number>([i, ...recentTest]);
          let candidates = Array.from({ length: 12 }, (_, k) => k).filter(k => !forbidden.has(k));
          if (candidates.length === 0) {
            // if all excluded (can happen after many unique steps), relax by dropping oldest
            candidates = Array.from({ length: 12 }, (_, k) => k).filter(k => k !== i);
          }
          const r = candidates[Math.floor(Math.random() * candidates.length)];
          // update recency buffer with current index i
          setRecentTest(prev => {
            const next = [i, ...prev];
            return next.slice(0, 8);
          });
          if (navMode === 'test') {
            setHideAlter(true);
            setHideTetrade(true);
            setHideAlterSchema(true);
            setHideTetradeSchema(true);
            setMeasureCoversByView({ 0: Array(7).fill(true), 1: Array(7).fill(true), 2: Array(7).fill(true) });
          }
          return r;
        });
      }
      if (e.key === "ArrowLeft") {
        setKeyIndex(i => {
          if (navMode === 'diatonique') return (i + 11) % 12; // -1 mod 12
          if (navMode === 'circle')     return (i + 5) % 12;  // perfect fifth down (i-7 ≡ i+5)
          // test: choose a key not in the recent window (8) and not current
          const forbidden = new Set<number>([i, ...recentTest]);
          let candidates = Array.from({ length: 12 }, (_, k) => k).filter(k => !forbidden.has(k));
          if (candidates.length === 0) {
            candidates = Array.from({ length: 12 }, (_, k) => k).filter(k => k !== i);
          }
          const r = candidates[Math.floor(Math.random() * candidates.length)];
          setRecentTest(prev => {
            const next = [i, ...prev];
            return next.slice(0, 8);
          });
          if (navMode === 'test') {
            setHideAlter(true);
            setHideTetrade(true);
            setHideAlterSchema(true);
            setHideTetradeSchema(true);
            setMeasureCoversByView({ 0: Array(7).fill(true), 1: Array(7).fill(true), 2: Array(7).fill(true) });
          }
          return r;
        });
      }
      if (e.key === "ArrowUp")   setView(v => ((v + 1) % 3) as ViewMode);
      if (e.key === "ArrowDown") setView(v => ((v + 2) % 3) as ViewMode); // cycle backwards
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[navMode, recentTest]);

    // Reset per-measure sticky notes when the key changes (and sync to navMode)
    useEffect(() => {
      if (navMode === 'test') {
        setMeasureCoversByView({ 0: Array(7).fill(true), 1: Array(7).fill(true), 2: Array(7).fill(true) });
      } else {
        setMeasureCoversByView({ 0: Array(7).fill(false), 1: Array(7).fill(false), 2: Array(7).fill(false) });
      }
    }, [keyIndex, navMode]);

  useEffect(() => {
    setRecentTest([]);
    if (navMode === 'test') {
      setHideAlter(true);
      setHideTetrade(true);
      setHideAlterSchema(true);
      setHideTetradeSchema(true);
    } else {
      setHideAlter(false);
      setHideTetrade(false);
      setHideAlterSchema(false);
      setHideTetradeSchema(false);
    }
  }, [navMode]);
// --- StickyNote overlay component ---
function StickyNote({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Retirer le post-it"
      className="absolute"
      style={{
        top: -6,
        right: -6,
        bottom: -6,
        left: -6,
        zIndex: 30,
        background: 'linear-gradient(180deg, #fff59d 0%, #ffeb3b 60%, #fdd835 100%)',
        boxShadow: '0 8px 18px rgba(0,0,0,0.25)',
        transform: 'rotate(-2.5deg)',
        border: '1px solid rgba(0,0,0,0.15)',
        cursor: 'pointer',
      }}
    >
      <div style={{
        position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%) rotate(2.5deg)',
        width: 46, height: 10, background: 'rgba(0,0,0,0.15)', borderRadius: 2
      }} />
    </button>
  );
}

  // True staff edges
  const leftEdge = 20;
  const rightMargin = 20;

  // First pass: estimate scale from container width (ignoring clef padding)
  const prelimMeasure = Math.max(80, (containerWidth - 40) / 7);
  const s = Math.max(0.9, Math.min(2, prelimMeasure / 120));

  // Vertical metrics based on s
  const degreeFont = 16 * s;                 // taille des chiffres 1–7
  const DEGREE_LABEL_Y = degreeFont + 6;     // ancre sûre des chiffres (près du haut du SVG)
  const LINE_SPACING = 10 * s * 0.67;
  const STEP_PX = LINE_SPACING / 2;
  const STAFF_TOP_Y = DEGREE_LABEL_Y + 36 * s; // décale la portée vers le bas pour créer de l'espace
  const STAFF_BOTTOM_Y = STAFF_TOP_Y + 4 * LINE_SPACING;
  const DEGREE_NUM_Y = STAFF_BOTTOM_Y + 36 * s; // chiffres 1..7 plus bas sous la portée

  // Second pass: compute left padding for the clef, then distribute remaining width across 7 measures
  const staffHeight = 100;
  const leftPadding = leftEdge + 28 * s; // plus d'espace réservé à la clé de sol
  const measureWidth = Math.max(80, (containerWidth - leftPadding - rightMargin) / 7);
  const X0 = leftPadding;               // début de la première mesure
  const staffWidth = X0 + measureWidth * 7 + rightMargin; // <= containerWidth

  // Minimal dynamic SVG height: compute the lowest content Y depending on the view
  const ROMAN_Y = STAFF_BOTTOM_Y + 72 * s;          // chiffres romains (plus bas pour plus d'espace)
  const MODE_NAME_Y = ROMAN_Y + 28 * s;             // nom du mode
  const MODE_FORMULA_Y = MODE_NAME_Y + 22 * s;      // formule du mode
  const contentBottomY = view === 2 ? MODE_FORMULA_Y : Math.max(DEGREE_NUM_Y, ROMAN_Y + 34 * s);
  const svgHeight = Math.ceil(contentBottomY + 24); // petite marge inférieure

  return (
    <div className="w-full min-h-screen bg-neutral-50 text-neutral-900 p-6 relative" style={{ fontFamily: '"Caveat", cursive' }}>
      {/* Navigation mode selector (now on top-left) */}
      <div className="absolute top-6 left-6 z-10">
        <div className="flex items-center gap-0">
          <label
            className="text-neutral-700"
            style={{ fontSize: '2rem', minWidth: '10ch', textAlign: 'left' }}
          >
            Navigation
          </label>
          <select
            value={navMode}
            onChange={(e) => {
              setNavMode(e.target.value as 'diatonique' | 'circle' | 'test');
              (e.target as HTMLSelectElement).blur();
            }}
            className="border border-neutral-300 rounded px-1 py-1 bg-white text-neutral-900"
            style={{ fontSize: '1.07rem', marginLeft: '0.25ch' }}
          >
            <option value="diatonique">diatonique</option>
            <option value="circle">circle of fifth</option>
            <option value="test">test (random)</option>
          </select>
        </div>
        {/* Horizontal arrows legend */}
        <div className="mt-2 text-neutral-600" style={{ fontSize: '1.2rem', lineHeight: 1.2, textAlign: 'left' }}>
          <div
            onClick={goRight}
            role="button"
            className="transition-colors hover:text-neutral-900 hover:underline"
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            → : tonalité suivante
          </div>
          <div
            onClick={goLeft}
            role="button"
            className="transition-colors hover:text-neutral-900 hover:underline"
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            ← : tonalité précédente (selon le mode ci-dessus)
          </div>
          <div>… ou choisir dans le cercle des quintes</div>
        </div>
        {/* Blank line before current view label */}
        <div aria-hidden="true" style={{ height: '1.2rem' }} />
        {/* Current view label (same size as Navigation) */}
        <div className="mt-6 text-neutral-700" style={{ fontSize: '2rem', textAlign: 'left' }}>
          {(() => {
            const v = view === 0 ? 'diatonique' : view === 1 ? 'tétrade' : 'modes';
            return `Vue : ${v}`;
          })()}
        </div>
        {/* Vertical arrows legend below */}
        <div className="mt-1 text-neutral-600" style={{ fontSize: '1.2rem', lineHeight: 1.2, textAlign: 'left' }}>
          <div
            onClick={viewNext}
            role="button"
            className="transition-colors hover:text-neutral-900 hover:underline"
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            ↑ : vue suivante
          </div>
          <div
            onClick={viewPrev}
            role="button"
            className="transition-colors hover:text-neutral-900 hover:underline"
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            ↓ : vue précédente
          </div>
        </div>
        {/* (Circle of Fifths hidden temporarily) */}
      </div>
      <div ref={containerRef}>
      <header className="mb-72 flex items-start justify-center">
      <div
        className="text-center"
        style={{
          fontVariantNumeric: 'tabular-nums',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
    <div
      className="inline-grid"
      style={{
        gridTemplateColumns: '26ch 2ch 6ch minmax(0, 2fr) 8ch minmax(0, 40ch)',
        gridTemplateRows: '4.5rem 4.5rem 4.5rem', // fixed height for Tonalité, Altérations, Tétrade rows
        alignItems: 'center',
        columnGap: '1ch',
        rowGap: '0.35rem',
      }}
    >
      {/* Tonalité */}
      <div className="justify-self-end font-bold leading-tight" style={{ fontSize: '3rem' }}>Tonalité</div>
      <div className="font-bold leading-tight" style={{ fontSize: '3rem' }}>:</div>
      <div />
      <div
        className="justify-self-start text-left font-bold leading-tight"
        style={{
          fontSize: '4rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          gridColumn: '4 / 7', // span across value + spacer + right schema columns
        }}
      >
        {(() => {
          const v = americanKeyNameMajor(currentKey.pc);
          return v.length ? v[0].toUpperCase() + v.slice(1) : v;
        })()}{TRAIL_NBSP}
      </div>

      {/* Altérations */}
      <div className="justify-self-end text-neutral-800 mt-1 tracking-wide" style={{ fontSize: '3rem' }}>Altérations</div>
      <div className="text-neutral-800 mt-1 tracking-wide" style={{ fontSize: '3rem' }}>:</div>
      <div />
      <div className="justify-self-start text-left text-neutral-800 mt-1 tracking-wide relative" style={{ fontSize: '3rem', overflow: 'hidden' }}>
        {headerAccType === 'none' ? '—' : (
          <>
            <span>{headerAccStr}</span>
            <span style={{ fontFamily: MUSIC_FONT, fontSize: '2rem' }}>{headerAccType === 'sharp' ? '♯' : '♭'}</span>
          </>
        )}
        {navMode === 'test' && hideAlter && (
          <StickyNote onClick={() => setHideAlter(false)} />
        )}
      </div>
      <div />
      <div
        className="justify-self-start text-left text-neutral-800 mt-1 tracking-wide relative"
        style={{ fontSize: '3rem', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '30ch' }}
      >
        {headerScaleSchemaPretty}
        {navMode === 'test' && hideAlterSchema && (
          <StickyNote onClick={() => setHideAlterSchema(false)} />
        )}
      </div>

      {/* Tétrade */}
      <div className="justify-self-end text-neutral-800 tracking-wide" style={{ fontSize: '3rem' }}>Tétrade</div>
      <div className="text-neutral-800 tracking-wide" style={{ fontSize: '3rem' }}>:</div>
      <div />
      <div className="justify-self-start text-left text-neutral-800 tracking-wide relative" style={{ fontSize: '3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {chordNamesINodesSmall}
        <span>{TRAIL_NBSP}</span>
        {navMode === 'test' && hideTetrade && (
          <StickyNote onClick={() => setHideTetrade(false)} />
        )}
      </div>
      <div />
      <div
        className="justify-self-start text-left text-neutral-800 tracking-wide relative"
        style={{
          fontSize: '3rem',
          whiteSpace: 'nowrap',
          minWidth: '8ch',
          overflow: 'hidden',
          minHeight: '4.5rem' // même hauteur que la ligne Altérations schema
        }}
      >
        {headerChordSchema}
        {navMode === 'test' && hideTetradeSchema && (
          <StickyNote onClick={() => setHideTetradeSchema(false)} />
        )}
      </div>
    </div>
  </div>
</header>

        <div className="rounded-2xl bg-white shadow p-4" style={{ minHeight: svgHeight + 32 }}>
      {/* Circle of Fifths via portal (always top-right) */}
      <CircleOverlay
        pc={currentKey.pc}
        size={260}
        top={16}
        onSelect={(pc) => {
          const idx = KEYS.findIndex(k => ((k.pc % 12) + 12) % 12 === pc);
          if (idx >= 0) setKeyIndex(idx);
          if (navMode === 'test') {
            setHideAlter(true);
            setHideTetrade(true);
            setHideAlterSchema(true);
            setHideTetradeSchema(true);
            setMeasureCoversByView({ 0: Array(7).fill(true), 1: Array(7).fill(true), 2: Array(7).fill(true) });
          }
        }}
      />
          <div className="relative" style={{ width: staffWidth, height: svgHeight, margin: '0 auto' }}>
          <svg width="100%" height={svgHeight} viewBox={`0 0 ${staffWidth} ${svgHeight}`} preserveAspectRatio="xMidYMin meet">            
            const leftPadding = leftEdge + 28 * s;
            {[0,1,2,3,4].map(line=>(<line key={line} x1={leftEdge} x2={staffWidth-rightMargin} y1={STAFF_TOP_Y+line*LINE_SPACING} y2={STAFF_TOP_Y+line*LINE_SPACING} stroke="#333" strokeWidth={1}/>))}
            {Array.from({length:8}).map((_,i)=>(<line key={i} x1={X0+i*measureWidth} x2={X0+i*measureWidth} y1={STAFF_TOP_Y-5} y2={STAFF_BOTTOM_Y} stroke="#999" strokeWidth={i===0?2:1}/>))}
            <TrebleClef x={26} STAFF_TOP_Y={STAFF_TOP_Y} LINE_SPACING={LINE_SPACING} />
            {scaleMidis.map((midi,degree)=>{
              const xCenter = X0 + degree*measureWidth + measureWidth/2 + 10;
              if(view===0){
                const letterRank = (tonicLetterRank + degree) % 7;
                // Diatonic stepwise ascent: each wrap past 'B'→'C' increases the octave
                const wraps = Math.floor((tonicLetterRank + degree) / 7);
                const oct = tonicStartOct + wraps;
                const staffPos = staffPosFromLetterOct(letterRank, oct);
                const y = staffPosToY(staffPos, STAFF_BOTTOM_Y, STEP_PX);
                const letter = RANK_TO_LETTER[letterRank] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';
                const acc = accidentalForLetterInKey(letter, currentKey.pc);
                const accGlyph = acc === 'sharp' ? '♯' : acc === 'flat' ? '♭' : '';
                return (
                  <g key={degree}>
                    {accGlyph && (
                    <text
                      x={accGlyph === '♯' ? xCenter - 12 * s : xCenter - 14 * s}
                      y={y}
                      fontSize={13 * s}
                      fontFamily={MUSIC_FONT}
                      style={{ fontStyle: 'normal', letterSpacing: '0' }}
                      dominantBaseline="middle"
                    >
                      {accGlyph}
                    </text>
                  )}
                    <motion.g initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} transition={{duration:0.25}} className="fill-neutral-900">
                      {noteheadWithLedger(xCenter, staffPos, s * 0.67, STAFF_BOTTOM_Y, STEP_PX)}
                    </motion.g>
                    <text x={xCenter-6} y={DEGREE_NUM_Y} fontSize={degreeFont} className="fill-neutral-700">{degree+1}</text>
                  </g>
                );
              }
              const chordDegrees = buildSeventhChordIndices(degree);
              // Build inline chord note names from root upward (e.g., do mi sol si)
              const chordLetterRanks = [0,2,4,6].map(o => (tonicLetterRank + ((degree + o) % 7)) % 7);
              const chordNamesInline = chordLetterRanks.map(lr => letterRankToNameFr(lr)).join(' ');
              // Use global Y positions computed above
              const romanY = ROMAN_Y;
              const chordNamesY = MODE_NAME_Y;
              // Build 8-note mode note-name tokens for this degree (degree..degree+7)
              const modeTokens = Array.from({ length: 8 }, (_, step) => {
                const absIndex = tonicLetterRank + degree + step; // diatonic absolute index from tonic
                const letterRank = absIndex % 7;
                const base = letterRankToNameFr(letterRank);
                const letter = RANK_TO_LETTER[letterRank] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';
                const acc = accidentalForLetterInKey(letter, currentKey.pc);
                return { base, acc } as { base: string; acc: 'sharp'|'flat'|null };
              });
              return (
                <g key={degree}>
                  {/* Render mode notes on staff inside measure for view===2 */}
                  {view===2 && (
                    <g>
                      {(() => {
                        const pad = 6 * s; // inner horizontal padding within the measure
                        const xLeft = X0 + degree * measureWidth + pad;
                        const xRight = X0 + (degree + 1) * measureWidth - pad;
                        const stepX = (xRight - xLeft) / 7; // 7 notes, centered between barlines
                        const modeFormulaTokens = MODE_DEGREE_FORMULAS[degree].split(' ');
                        return Array.from({ length: 7 }, (_, step) => {
                          const cx = xLeft + (step + 0.5) * stepX; // center each of the 7 notes within its 1/7 slice
                          const absIndex = tonicLetterRank + degree + step; // diatonic absolute index from tonic
                          const letterRank = absIndex % 7;
                          const oct = tonicStartOct + Math.floor(absIndex / 7);
                          const staffPos = staffPosFromLetterOct(letterRank, oct);
                          const y = staffPosToY(staffPos, STAFF_BOTTOM_Y, STEP_PX);
                          const letter = RANK_TO_LETTER[letterRank] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';
                          const acc = accidentalForLetterInKey(letter, currentKey.pc);
                          const accGlyph = acc === 'sharp' ? '♯' : acc === 'flat' ? '♭' : '';
                          const tok = modeFormulaTokens[step];
                          const isAlt = tok.includes('♭') || tok.includes('#');
                          const hiColor = isAlt ? '#b91c1c' : undefined; // same red as used in the text formula
                          return (
                            <g key={`mode-note-${degree}-${step}`}>
                              {accGlyph && (
                                <text
                                  x={accGlyph === '♯' ? cx - 9 * s : cx - 14 * s}
                                  y={y}
                                  fontSize={13 * s}
                                  fontFamily={MUSIC_FONT}
                                  dominantBaseline="middle"
                                  {...(isAlt ? { fill: '#b91c1c' } : {})}
                                >
                                  {accGlyph}
                                </text>
                              )}
                              {noteheadWithLedger(cx, staffPos, s * 0.5, STAFF_BOTTOM_Y, STEP_PX, hiColor)}
                            </g>
                          );
                        });
                      })()}
                    </g>
                  )}
                  {view===1 && (
                    <text x={X0 + degree*measureWidth + measureWidth/2} y={romanY} fontSize={18 * s} className="fill-neutral-700" textAnchor="middle">
                      {romanForDegree(degree,SEVENTH_QUALITIES[degree])} / {SEVENTH_QUALITIES[degree]}
                    </text>
                  )}
                  {view===1 && (
                    <text
                      x={X0 + degree*measureWidth + measureWidth/2}
                      y={romanY + 30 * s}
                      fontSize={16 * s}
                      className="fill-neutral-800"
                      textAnchor="middle"
                    >
                      {(() => {
                        const lr = (tonicLetterRank + degree) % 7;
                        const note = americanNoteForLetterRank(lr, currentKey.pc);
                        const quality = prettyQualityForDegree(degree);
                        return (
                          <>
                            <tspan>{note.base}</tspan>
                            {note.acc && (
                              <tspan style={{ fontFamily: MUSIC_FONT }}>{note.acc === 'sharp' ? '♯' : '♭'}</tspan>
                            )}
                            <tspan style={{ fontSize: `${12 * s}px`, baselineShift: 'super' }}>{quality}</tspan>
                          </>
                        );
                      })()}
                    </text>
                  )}
                  {view===2 && (
                    <g>
                      {/* Mode tonic label above the mode name (American note only, no 7th quality) */}
                      <text
                        x={X0 + degree*measureWidth + measureWidth/2}
                        y={chordNamesY - 22 * s}
                        fontSize={18 * s}
                        className="fill-neutral-800"
                        textAnchor="middle"
                      >
                        {(() => {
                          const lr = (tonicLetterRank + degree) % 7; // letter rank for the mode tonic
                          const note = americanNoteForLetterRank(lr, currentKey.pc);
                          return (
                            <>
                              <tspan>{note.base}</tspan>
                              {note.acc && (
                                <tspan style={{ fontFamily: MUSIC_FONT }}>{note.acc === 'sharp' ? '♯' : '♭'}</tspan>
                              )}
                            </>
                          );
                        })()}
                      </text>
                      <text
                        x={X0 + degree*measureWidth + measureWidth/2}
                        y={chordNamesY}
                        fontSize={24 * s}
                        className="fill-neutral-700"
                        textAnchor="middle"
                      >
                        {(() => {
                          const modeFull = MODE_NAMES[degree];
                          const m = modeFull.match(/^([^()]+)(?:\s*\(([^)]+)\))?/);
                          const modeBase = m ? m[1].trim() : modeFull;
                          return modeBase;
                        })()}
                      </text>
                      <text
                        x={X0 + degree*measureWidth + measureWidth/2}
                        y={chordNamesY + 22 * s}
                        fontSize={10 * s}
                        textAnchor="middle"
                      >
                        {(() => {
                          const tokens = MODE_DEGREE_FORMULAS[degree].split(' ');
                          return tokens.map((t, i) => {
                            const isAcc = t.includes('♭') || t.includes('#');
                            return (
                              <tspan
                                key={`tok-${i}`}
                                fill={isAcc ? '#b91c1c' : '#374151'}
                                fontWeight={isAcc ? 700 : 400}
                              >
                                {t}{i < tokens.length - 1 ? ' ' : ''}
                              </tspan>
                            );
                          });
                        })()}
                      </text>
                    </g>
                  )}
                  {view===1 && chordDegrees.map((dg,i)=>{
                    const offset = [0,2,4,6][i];                  // 0, 2, 4, 6 pas diatoniques depuis la fondamentale
                    const absIndex = tonicLetterRank + degree + offset; // index diatonique absolu depuis la tonique
                    const letterRank = absIndex % 7;
                    const oct = tonicStartOct + Math.floor(absIndex / 7);
                    const staffPos = staffPosFromLetterOct(letterRank, oct);
                    const y = staffPosToY(staffPos, STAFF_BOTTOM_Y, STEP_PX);
                    const letter = RANK_TO_LETTER[letterRank] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';
                    const acc = accidentalForLetterInKey(letter, currentKey.pc);
                    const accGlyph = acc === 'sharp' ? '♯' : acc === 'flat' ? '♭' : '';
                    return (
                      <motion.g key={i} initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} transition={{duration:0.25}}>
                      {accGlyph && (
                        <text
                          x={accGlyph === '♯' ? xCenter - 14 * s : xCenter - 16 * s}
                          y={y}
                          fontSize={14 * s}
                          fontFamily={MUSIC_FONT}
                          dominantBaseline="middle"
                        >
                          {accGlyph}
                        </text>
                      )}
                        {noteheadWithLedger(xCenter, staffPos, s * 0.67, STAFF_BOTTOM_Y, STEP_PX)}
                      </motion.g>
                    );
                  })}
                  <text x={xCenter-6} y={DEGREE_NUM_Y} fontSize={degreeFont}  className="fill-neutral-500">{degree+1}</text>
                </g>
              );
            })}
          </svg>
            {navMode === 'test' && (measureCoversByView[view] ?? []).map((covered, i) => {
              if (!covered) return null;
            const x = X0 + i * measureWidth;
            const yTop = Math.max(0, STAFF_TOP_Y - 10 * s);
            const yBottom = svgHeight - 8;
            const width = measureWidth;
            const height = Math.max(24, yBottom - yTop);
            return (
              <div key={`cover-${i}`} className="absolute" style={{ left: x, top: yTop, width, height, zIndex: 28 }}>
                <div className="relative w-full h-full">
                <StickyNote
                  onClick={() => {
                    setMeasureCoversByView(prev => {
                      const next: Record<ViewMode, boolean[]> = {
                        0: prev[0].slice(),
                        1: prev[1].slice(),
                        2: prev[2].slice(),
                      };
                      next[view] = prev[view].slice();
                      next[view][i] = false;
                      return next;
                    });
                  }}
                />
                </div>
              </div>
            );
          })}
        </div>
        </div>

      </div>
    </div>
  );
};
export default ScaleNavigator;
