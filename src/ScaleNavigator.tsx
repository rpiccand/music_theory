import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  KEYS, MODE_NAMES, MODE_DEGREE_FORMULAS,
  SEVENTH_QUALITIES,
  PC_TO_TONIC_LETTER_RANK, RANK_TO_LETTER,
  americanKeyNameMajor, majorKeySignatureFor, isWhitePc, pcOfMidi, romanForDegree,
  letterRankToNameFr, americanNoteForLetterRank, prettyQualityForDegree,
  accidentalForLetterInKey, midiOctave, staffPosFromLetterOct, staffPosToY,
  buildSeventhChordIndices, majorScaleMidis
} from "./utils/music";
import { noteheadWithLedger } from "./utils/drawing";
import TrebleClef from "./components/TrebleClef";
import Piano from "./components/Piano";
import CircleOfFifths from "./components/CircleOfFifths";


// --- Music theory helpers ---------------------------------------------------

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

// --- Piano (2 octaves) ------------------------------------------------------
// Fixed width for header keyboard (2 octaves = 14 white keys at 16px each)
const PIANO_KEY_WIDTH = 16;
const PIANO_WHITE_COUNT = 14;
const PIANO_WIDTH = PIANO_KEY_WIDTH * PIANO_WHITE_COUNT; // 224px


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
  const [navMode, setNavMode] = useState<'diatonique' | 'circle' | 'random'>('diatonique');
  const [coverEnabled, setCoverEnabled] = useState<boolean>(false);
  const [recentRandom, setRecentRandom] = useState<number[]>([]); // last visited keys in random mode
  const [hideAlter, setHideAlter] = useState<boolean>(false);
  const [hideTetrade, setHideTetrade] = useState<boolean>(false);
  const [hideAlterSchema, setHideAlterSchema] = useState(false);
  const [hideTetradeSchema, setHideTetradeSchema] = useState(false);
  const [measureCoversByView, setMeasureCoversByView] = useState<Record<ViewMode, boolean[]>>({
    0: Array(7).fill(false),
    1: Array(7).fill(false),
    2: Array(7).fill(false),
  });

  const navSelectRef = React.useRef<HTMLSelectElement>(null);

  // Click helpers to mimic arrow keys
  const goRight = () => {
    setKeyIndex(i => {
      if (navMode === 'diatonique') return (i + 1) % 12;
      if (navMode === 'circle')     return (i + 7) % 12; // perfect fifth up
      // random: choose a key not in the recent window (8) and not current
      const forbidden = new Set<number>([i, ...recentRandom]);
      let candidates = Array.from({ length: 12 }, (_, k) => k).filter(k => !forbidden.has(k));
      if (candidates.length === 0) {
        candidates = Array.from({ length: 12 }, (_, k) => k).filter(k => k !== i);
      }
      const r = candidates[Math.floor(Math.random() * candidates.length)];
      setRecentRandom(prev => {
        const next = [i, ...prev];
        return next.slice(0, 8);
      });
      if (coverEnabled) {
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
      const forbidden = new Set<number>([i, ...recentRandom]);
      let candidates = Array.from({ length: 12 }, (_, k) => k).filter(k => !forbidden.has(k));
      if (candidates.length === 0) {
        candidates = Array.from({ length: 12 }, (_, k) => k).filter(k => k !== i);
      }
      const r = candidates[Math.floor(Math.random() * candidates.length)];
      setRecentRandom(prev => {
        const next = [i, ...prev];
        return next.slice(0, 8);
      });
      if (coverEnabled) {
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
  
  // Tétrade du I (notes + altérations selon armure), as tokens for JSX rendering
  type ChordTok = { base: string; acc: 'sharp'|'flat'|null };
  const chordLRsI = [0,2,4,6].map(o => (tonicLetterRank + o) % 7);
  const chordTokensI: ChordTok[] = chordLRsI.map(lr => {
    const letter = RANK_TO_LETTER[lr] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';
    const base = letterRankToNameFr(lr);
    const acc  = accidentalForLetterInKey(letter, currentKey.pc);
    return { base, acc };
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
      if (e.key === "ArrowRight") { goRight(); }
      else if (e.key === "ArrowLeft") { goLeft(); }
      else if (e.key === "ArrowUp") { viewNext(); }
      else if (e.key === "ArrowDown") { viewPrev(); }
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[navMode, recentRandom, coverEnabled]);

    // Reset per-measure sticky notes when the key changes (and sync to navMode)
    useEffect(() => {
      if (coverEnabled) {
        setMeasureCoversByView({ 0: Array(7).fill(true), 1: Array(7).fill(true), 2: Array(7).fill(true) });
      } else {
        setMeasureCoversByView({ 0: Array(7).fill(false), 1: Array(7).fill(false), 2: Array(7).fill(false) });
      }
    }, [keyIndex, coverEnabled]);

    useEffect(() => {
      if (!coverEnabled) return;
      // Re-cover header sticky notes on key change when cover mode is enabled
      setHideAlter(true);
      setHideTetrade(true);
      setHideAlterSchema(true);
      setHideTetradeSchema(true);
    }, [keyIndex, coverEnabled]);

    useEffect(() => {
      setRecentRandom([]);
      if (coverEnabled) {
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
    }, [navMode, coverEnabled]);
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
            ref={navSelectRef}
            value={navMode}
            onChange={(e) => {
              // apply the new mode
              setNavMode(e.target.value as 'diatonique' | 'circle' | 'random');

              // blur on the next frame so the dropdown loses focus
              // (works across Chrome/Safari/Firefox)
              requestAnimationFrame(() => navSelectRef.current?.blur());
            }}
            // stop arrow keys from hijacking while focused (extra safety)
            onKeyDown={(ev) => {
              if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown' || ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
                ev.preventDefault();
                ev.stopPropagation();
              }
            }}
            // also stop click bubbling so our global key handler stays clean
            onClick={(ev) => ev.stopPropagation()}
            className="border border-neutral-300 rounded px-1 py-1 bg-white text-neutral-900"
            style={{ fontSize: '1.07rem', marginLeft: '0.25ch' }}
          >
            <option value="diatonique">diatonique</option>
            <option value="circle">cycle de quintes</option>
            <option value="random">random</option>
          </select>
          <label className="ml-3 inline-flex items-center gap-2 text-neutral-700" style={{ fontSize: '1rem' }}>
          <input
            type="checkbox"
            checked={coverEnabled}
            onChange={(e) => {
              const enabled = e.target.checked;
              setCoverEnabled(enabled);
              // synchronise les caches du header
              setHideAlter(enabled);
              setHideTetrade(enabled);
              setHideAlterSchema(enabled);
              setHideTetradeSchema(enabled);
              // synchronise les caches par mesure pour les 3 vues
              setMeasureCoversByView({ 0: Array(7).fill(enabled), 1: Array(7).fill(enabled), 2: Array(7).fill(enabled) });
            }}
            className="align-middle"
          />
          <span>post-it</span>
        </label>
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
          <div>… ou choisir dans le cycles des quintes</div>
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
          gridColumn: '4 / 7',
          position: 'relative',
          paddingRight: `${PIANO_WIDTH + 16}px`
        }}
      >
        {(() => {
          const v = americanKeyNameMajor(currentKey.pc);
          return v.length ? v[0].toUpperCase() + v.slice(1) : v;
        })()}{TRAIL_NBSP}
        <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: PIANO_WIDTH }}>
          <Piano highlightedPc={currentKey.pc} />
        </div>
      </div>

      {/* Altérations */}
      <div className="justify-self-end text-neutral-800 mt-1 tracking-wide" style={{ fontSize: '3rem' }}>Altérations</div>
      <div className="text-neutral-800 mt-1 tracking-wide" style={{ fontSize: '3rem' }}>:</div>
      <div />
      <div className="justify-self-start text-left text-neutral-800 tracking-wide relative" style={{ fontSize: '3rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'  }}>
        {headerAccType === 'none' ? '—' : (
          <>
            <span>{headerAccStr}</span>
            <span style={{ fontFamily: MUSIC_FONT, fontSize: '2rem' }}>{headerAccType === 'sharp' ? '♯' : '♭'}</span>
          </>
        )}
        {coverEnabled && hideAlter && (
          <StickyNote onClick={() => setHideAlter(false)} />
        )}
      </div>
      <div />
      <div
        className="justify-self-start text-left text-neutral-800 mt-1 tracking-wide relative"
        style={{ fontSize: '3rem', whiteSpace: 'nowrap', overflow: 'hidden', minWidth: '24ch' }}
      >
        {headerScaleSchemaPretty}
        {coverEnabled && hideAlterSchema && (
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
        {coverEnabled && hideTetrade && (
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
        {coverEnabled && hideTetradeSchema && (
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
          if (coverEnabled) {
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
            {[0,1,2,3,4].map(line=>(<line key={line} x1={leftEdge} x2={staffWidth-rightMargin} y1={STAFF_TOP_Y+line*LINE_SPACING} y2={STAFF_TOP_Y+line*LINE_SPACING} stroke="#333" strokeWidth={1}/>))}
            {Array.from({length:8}).map((_,i)=>(<line key={i} x1={X0+i*measureWidth} x2={X0+i*measureWidth} y1={STAFF_TOP_Y-5} y2={STAFF_BOTTOM_Y} stroke="#999" strokeWidth={i===0?2:1}/>))}
            <TrebleClef x={26} STAFF_TOP_Y={STAFF_TOP_Y} LINE_SPACING={LINE_SPACING} />
            {scaleMidis.map((_, degree)=>{
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
              // Use global Y positions computed above
              const romanY = ROMAN_Y;
              const chordNamesY = MODE_NAME_Y;
              // Octave adjustment to keep highest note at or below first ledger A5 (staffPos 10)
              const chordAbsIndices = [0,2,4,6].map(o => tonicLetterRank + degree + o);
              const chordStaffPosMax = Math.max(
                ...chordAbsIndices.map(ai => {
                  const lr = ai % 7;
                  const oc = tonicStartOct + Math.floor(ai / 7);
                  return staffPosFromLetterOct(lr, oc);
                })
              );
              const chordOctAdj = chordStaffPosMax > 10 ? -1 : 0;

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
                        // Octave adjustment for modes: ensure the highest of the 7 notes is <= A5 (staffPos 10)
                        const modeAbsIndices = Array.from({ length: 7 }, (_, st) => tonicLetterRank + degree + st);
                        const modeStaffPosMax = Math.max(
                          ...modeAbsIndices.map(ai => {
                            const lr = ai % 7;
                            const oc = tonicStartOct + Math.floor(ai / 7);
                            return staffPosFromLetterOct(lr, oc);
                          })
                        );
                        const modeOctAdj = modeStaffPosMax > 10 ? -1 : 0;
                        return Array.from({ length: 7 }, (_, step) => {
                          const cx = xLeft + (step + 0.5) * stepX; // center each of the 7 notes within its 1/7 slice
                          const absIndex = tonicLetterRank + degree + step; // diatonic absolute index from tonic
                          const letterRank = absIndex % 7;
                          const oct = tonicStartOct + Math.floor(absIndex / 7) + modeOctAdj;
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
                  {view===1 && chordDegrees.map((_, idx)=>{
                    const offset = [0,2,4,6][idx];                  // 0, 2, 4, 6 pas diatoniques depuis la fondamentale
                    const absIndex = tonicLetterRank + degree + offset; // index diatonique absolu depuis la tonique
                    const letterRank = absIndex % 7;
                    const oct = tonicStartOct + Math.floor(absIndex / 7) + chordOctAdj;
                    const staffPos = staffPosFromLetterOct(letterRank, oct);
                    const y = staffPosToY(staffPos, STAFF_BOTTOM_Y, STEP_PX);
                    const letter = RANK_TO_LETTER[letterRank] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';
                    const acc = accidentalForLetterInKey(letter, currentKey.pc);
                    const accGlyph = acc === 'sharp' ? '♯' : acc === 'flat' ? '♭' : '';
                    return (
                      <motion.g key={idx} initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} transition={{duration:0.25}}>
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
            {coverEnabled && (measureCoversByView[view] ?? []).map((covered, i) => {
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
