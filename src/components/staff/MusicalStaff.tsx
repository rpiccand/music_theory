import React from 'react';
import { motion } from 'framer-motion';
import TrebleClef from '../TrebleClef';
import MeasureClickHandler from '../MeasureClickHandler';
import StickyNote from '../ui/StickyNote';
import CurrentKeyModesStaff from './CurrentKeyModesStaff';
import type { ViewMode } from '../../types';
import {
  KEYS, MODE_NAMES, MODE_DEGREE_FORMULAS, SEVENTH_QUALITIES,
  PC_TO_TONIC_LETTER_RANK, RANK_TO_LETTER,
  accidentalForLetterInKey, midiOctave, staffPosFromLetterOct,
  staffPosToY, buildSeventhChordIndices, majorScaleMidis,
  romanForDegree, americanNoteForLetterRank, prettyQualityForDegree
} from '../../utils/music';
import { MUSIC_FONT } from '../../constants';
import { noteheadWithLedger } from '../../utils/drawing';

interface MusicalStaffProps {
  keyIndex: number;
  view: ViewMode;
  containerWidth: number;
  coverEnabled: boolean;
  measureCoversByView: Record<ViewMode, boolean[]>;
  onToggleMeasureCover: (measureIndex: number) => void;
}

export default function MusicalStaff({
  keyIndex,
  view,
  containerWidth,
  coverEnabled,
  measureCoversByView,
  onToggleMeasureCover
}: MusicalStaffProps) {
  const currentKey = KEYS[keyIndex];
  const scaleMidis = React.useMemo(() => majorScaleMidis(currentKey.pc), [currentKey]);
  const tonicLetterRank = PC_TO_TONIC_LETTER_RANK[currentKey.pc];
  const tonicStartOct = React.useMemo(() => midiOctave(scaleMidis[0]), [scaleMidis]);

  // Responsive layout calculations
  const leftEdge = Math.max(10, Math.min(20, containerWidth * 0.02));
  const rightMargin = leftEdge;
  const availableWidth = containerWidth - leftEdge - rightMargin;
  const prelimMeasure = Math.max(60, availableWidth / 7);

  // Responsive scaling - better for all screen sizes
  const baseScale = containerWidth < 768 ? 0.7 : containerWidth < 1024 ? 1.0 : containerWidth < 1440 ? 1.2 : 1.4;
  const s = Math.max(0.6, Math.min(2, (prelimMeasure / 120) * baseScale));

  // Separate scaling for second staff to ensure consistent rendering
  const secondStaffScale = Math.max(0.8, Math.min(1.5, s));

  // Vertical metrics
  const degreeFont = 16 * s;
  const DEGREE_LABEL_Y = degreeFont + 6;
  const LINE_SPACING = 10 * s * 0.67;
  const STEP_PX = LINE_SPACING / 2;
  const STAFF_TOP_Y = DEGREE_LABEL_Y + 36 * s;
  const STAFF_BOTTOM_Y = STAFF_TOP_Y + 4 * LINE_SPACING;
  const DEGREE_NUM_Y = STAFF_BOTTOM_Y + 36 * s;

  // Horizontal layout
  const leftPadding = leftEdge + 28 * s;
  const measureWidth = Math.max(80, (containerWidth - leftPadding - rightMargin) / 7);
  const X0 = leftPadding;
  const staffWidth = X0 + measureWidth * 7 + rightMargin;

  // Consistent SVG height for all views to prevent scrolling
  const ROMAN_Y = STAFF_BOTTOM_Y + 72 * s;
  const MODE_NAME_Y = ROMAN_Y + 28 * s;
  const MODE_FORMULA_Y = MODE_NAME_Y + 22 * s;

  // Additional staff for modes view (current key in each mode) - better spacing
  const SECOND_STAFF_TOP_Y = MODE_FORMULA_Y + Math.max(60, 50 * s);
  const SECOND_STAFF_BOTTOM_Y = SECOND_STAFF_TOP_Y + 4 * (10 * secondStaffScale * 0.67);

  // Always use the maximum possible height to prevent layout shifts
  const contentBottomY = view === 2
    ? Math.max(SECOND_STAFF_BOTTOM_Y + 40 * s, DEGREE_NUM_Y, ROMAN_Y + 34 * s)
    : Math.max(MODE_FORMULA_Y, DEGREE_NUM_Y, ROMAN_Y + 34 * s);
  const svgHeight = Math.ceil(contentBottomY + 24);

  return (
    <div className="relative w-full overflow-x-auto" style={{ maxWidth: '100%' }}>
      <div className="relative" style={{ width: Math.max(staffWidth, 400), height: svgHeight, margin: '0 auto', minWidth: 'max-content' }}>
        <svg
          width="100%"
          height={svgHeight}
          viewBox={`0 0 ${staffWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMin meet"
          className="block"
        >
        {/* Staff lines */}
        {[0, 1, 2, 3, 4].map(line => (
          <line
            key={line}
            x1={leftEdge}
            x2={staffWidth - rightMargin}
            y1={STAFF_TOP_Y + line * LINE_SPACING}
            y2={STAFF_TOP_Y + line * LINE_SPACING}
            stroke="#333"
            strokeWidth={1}
          />
        ))}

        {/* Measure bars */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={i}
            x1={X0 + i * measureWidth}
            x2={X0 + i * measureWidth}
            y1={STAFF_TOP_Y - 5}
            y2={STAFF_BOTTOM_Y}
            stroke="#999"
            strokeWidth={i === 0 ? 2 : 1}
          />
        ))}

        <TrebleClef x={26} STAFF_TOP_Y={STAFF_TOP_Y} LINE_SPACING={LINE_SPACING} scale={1.3} />

        {/* Scale degrees */}
        {scaleMidis.map((_, degree) => {
          const xCenter = X0 + degree * measureWidth + measureWidth / 2 + 10;

          if (view === 0) {
            return (
              <ScaleDegreeView
                key={degree}
                degree={degree}
                xCenter={xCenter}
                tonicLetterRank={tonicLetterRank}
                tonicStartOct={tonicStartOct}
                currentKeyPc={currentKey.pc}
                STAFF_BOTTOM_Y={STAFF_BOTTOM_Y}
                STEP_PX={STEP_PX}
                DEGREE_NUM_Y={DEGREE_NUM_Y}
                degreeFont={degreeFont}
                s={s}
              />
            );
          }

          return (
            <ChordOrModeView
              key={degree}
              degree={degree}
              view={view}
              xCenter={xCenter}
              measureWidth={measureWidth}
              X0={X0}
              tonicLetterRank={tonicLetterRank}
              tonicStartOct={tonicStartOct}
              currentKeyPc={currentKey.pc}
              STAFF_BOTTOM_Y={STAFF_BOTTOM_Y}
              STEP_PX={STEP_PX}
              DEGREE_NUM_Y={DEGREE_NUM_Y}
              ROMAN_Y={ROMAN_Y}
              MODE_NAME_Y={MODE_NAME_Y}
              degreeFont={degreeFont}
              s={s}
            />
          );
        })}

        {/* Additional staff for modes view - showing current key in each mode */}
        {view === 2 && (
          <CurrentKeyModesStaff
            staffWidth={staffWidth - leftEdge - rightMargin}
            measureWidth={measureWidth}
            currentKeyPc={currentKey.pc}
            modes={['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian']}
            yTop={SECOND_STAFF_TOP_Y}
            X0={X0}
            tonicLetterRank={tonicLetterRank}
            tonicStartOct={tonicStartOct}
            STEP_PX={STEP_PX * (secondStaffScale / s)}
            s={secondStaffScale}
            LINE_SPACING={10 * secondStaffScale * 0.67}
            fontSize={Math.max(10, 12 * secondStaffScale)}
          />
        )}

        {/* Click zones for audio playback */}
        {scaleMidis.map((_, degree) => {
          const measureX = X0 + degree * measureWidth;
          const measureY = STAFF_TOP_Y - 20;
          const measureHeight = STAFF_BOTTOM_Y - STAFF_TOP_Y + 80;

          return (
            <MeasureClickHandler
              key={`click-${degree}`}
              x={measureX}
              y={measureY}
              width={measureWidth}
              height={measureHeight}
              degree={degree}
              currentKeyPc={currentKey.pc}
              tonicLetterRank={tonicLetterRank}
              tonicStartOct={tonicStartOct}
              view={view}
            />
          );
        })}

        {/* Click zones for second staff in mode view */}
        {view === 2 && scaleMidis.map((_, degree) => {
          const measureX = X0 + degree * measureWidth;
          const measureY = SECOND_STAFF_TOP_Y - 20;
          const measureHeight = SECOND_STAFF_BOTTOM_Y - SECOND_STAFF_TOP_Y + 80;

          return (
            <MeasureClickHandler
              key={`click-second-${degree}`}
              x={measureX}
              y={measureY}
              width={measureWidth}
              height={measureHeight}
              degree={degree}
              currentKeyPc={currentKey.pc}
              tonicLetterRank={tonicLetterRank}
              tonicStartOct={tonicStartOct}
              view={view}
              isSecondStaff={true}
            />
          );
        })}
      </svg>

      {/* Sticky note covers */}
      {coverEnabled && (measureCoversByView[view] ?? []).map((covered, i) => {
        if (!covered) return null;

        const x = X0 + i * measureWidth;
        const yTop = Math.max(0, STAFF_TOP_Y - 10 * s);
        const yBottom = svgHeight - 8;
        const width = measureWidth;
        const height = Math.max(24, yBottom - yTop);

        return (
          <div
            key={`cover-${i}`}
            className="absolute"
            style={{ left: x, top: yTop, width, height, zIndex: 28 }}
          >
            <div className="relative w-full h-full">
              <StickyNote onClick={() => onToggleMeasureCover(i)} />
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

// Separate components for different views
function ScaleDegreeView({
  degree,
  xCenter,
  tonicLetterRank,
  tonicStartOct,
  currentKeyPc,
  STAFF_BOTTOM_Y,
  STEP_PX,
  DEGREE_NUM_Y,
  degreeFont,
  s
}: {
  degree: number;
  xCenter: number;
  tonicLetterRank: number;
  tonicStartOct: number;
  currentKeyPc: number;
  STAFF_BOTTOM_Y: number;
  STEP_PX: number;
  DEGREE_NUM_Y: number;
  degreeFont: number;
  s: number;
}) {
  const letterRank = (tonicLetterRank + degree) % 7;
  const wraps = Math.floor((tonicLetterRank + degree) / 7);
  const oct = tonicStartOct + wraps;
  const staffPos = staffPosFromLetterOct(letterRank, oct);
  const y = staffPosToY(staffPos, STAFF_BOTTOM_Y, STEP_PX);
  const letter = RANK_TO_LETTER[letterRank] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';
  const acc = accidentalForLetterInKey(letter, currentKeyPc);
  const accGlyph = acc === 'sharp' ? '♯' : acc === 'flat' ? '♭' : '';

  return (
    <g>
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
      <motion.g
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="fill-neutral-900"
      >
        {noteheadWithLedger(xCenter, staffPos, s * 0.67, STAFF_BOTTOM_Y, STEP_PX)}
      </motion.g>
      <text x={xCenter - 6} y={DEGREE_NUM_Y} fontSize={degreeFont} className="fill-neutral-700">
        {degree + 1}
      </text>
    </g>
  );
}

function ChordOrModeView({
  degree,
  view,
  xCenter,
  measureWidth,
  X0,
  tonicLetterRank,
  tonicStartOct,
  currentKeyPc,
  STAFF_BOTTOM_Y,
  STEP_PX,
  DEGREE_NUM_Y,
  ROMAN_Y,
  MODE_NAME_Y,
  degreeFont,
  s
}: {
  degree: number;
  view: ViewMode;
  xCenter: number;
  measureWidth: number;
  X0: number;
  tonicLetterRank: number;
  tonicStartOct: number;
  currentKeyPc: number;
  STAFF_BOTTOM_Y: number;
  STEP_PX: number;
  DEGREE_NUM_Y: number;
  ROMAN_Y: number;
  MODE_NAME_Y: number;
  degreeFont: number;
  s: number;
}) {
  const chordDegrees = buildSeventhChordIndices(degree);

  // Octave adjustments
  const chordAbsIndices = [0, 2, 4, 6].map(o => tonicLetterRank + degree + o);
  const chordStaffPosMax = Math.max(
    ...chordAbsIndices.map(ai => {
      const lr = ai % 7;
      const oc = tonicStartOct + Math.floor(ai / 7);
      return staffPosFromLetterOct(lr, oc);
    })
  );
  const chordOctAdj = chordStaffPosMax > 10 ? -1 : 0;

  return (
    <g>
      {/* Mode notes for view 2 */}
      {view === 2 && (
        <ModeNotesView
          degree={degree}
          measureWidth={measureWidth}
          X0={X0}
          tonicLetterRank={tonicLetterRank}
          tonicStartOct={tonicStartOct}
          currentKeyPc={currentKeyPc}
          STAFF_BOTTOM_Y={STAFF_BOTTOM_Y}
          STEP_PX={STEP_PX}
          s={s}
        />
      )}

      {/* Chord view labels */}
      {view === 1 && (
        <>
          <text x={xCenter} y={ROMAN_Y} fontSize={18 * s} className="fill-neutral-700" textAnchor="middle">
            {romanForDegree(degree, SEVENTH_QUALITIES[degree])} / {SEVENTH_QUALITIES[degree]}
          </text>
          <ChordNameText
            degree={degree}
            xCenter={xCenter}
            y={ROMAN_Y + 30 * s}
            tonicLetterRank={tonicLetterRank}
            currentKeyPc={currentKeyPc}
            s={s}
          />
        </>
      )}

      {/* Mode view labels */}
      {view === 2 && (
        <ModeLabels
          degree={degree}
          xCenter={xCenter}
          tonicLetterRank={tonicLetterRank}
          currentKeyPc={currentKeyPc}
          MODE_NAME_Y={MODE_NAME_Y}
          s={s}
          X0={X0}
          measureWidth={measureWidth}
        />
      )}

      {/* Chord notes for view 1 */}
      {view === 1 && chordDegrees.map((_, idx) => {
        const offset = [0, 2, 4, 6][idx];
        const absIndex = tonicLetterRank + degree + offset;
        const letterRank = absIndex % 7;
        const oct = tonicStartOct + Math.floor(absIndex / 7) + chordOctAdj;
        const staffPos = staffPosFromLetterOct(letterRank, oct);
        const y = staffPosToY(staffPos, STAFF_BOTTOM_Y, STEP_PX);
        const letter = RANK_TO_LETTER[letterRank] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';
        const acc = accidentalForLetterInKey(letter, currentKeyPc);
        const accGlyph = acc === 'sharp' ? '♯' : acc === 'flat' ? '♭' : '';

        return (
          <motion.g
            key={idx}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
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

      <text x={xCenter - 6} y={DEGREE_NUM_Y} fontSize={degreeFont} className="fill-neutral-500">
        {degree + 1}
      </text>
    </g>
  );
}

function ModeNotesView({
  degree,
  measureWidth,
  X0,
  tonicLetterRank,
  tonicStartOct,
  currentKeyPc,
  STAFF_BOTTOM_Y,
  STEP_PX,
  s
}: {
  degree: number;
  measureWidth: number;
  X0: number;
  tonicLetterRank: number;
  tonicStartOct: number;
  currentKeyPc: number;
  STAFF_BOTTOM_Y: number;
  STEP_PX: number;
  s: number;
}) {
  const pad = 6 * s;
  const xLeft = X0 + degree * measureWidth + pad;
  const xRight = X0 + (degree + 1) * measureWidth - pad;
  const stepX = (xRight - xLeft) / 8;
  const modeFormulaTokens = MODE_DEGREE_FORMULAS[degree].split(' ');

  // Octave adjustment
  const modeAbsIndices = Array.from({ length: 8 }, (_, st) => tonicLetterRank + degree + st);
  const modeStaffPosMax = Math.max(
    ...modeAbsIndices.map(ai => {
      const lr = ai % 7;
      const oc = tonicStartOct + Math.floor(ai / 7);
      return staffPosFromLetterOct(lr, oc);
    })
  );
  const modeOctAdj = modeStaffPosMax > 10 ? -1 : 0;

  return (
    <g>
      {Array.from({ length: 8 }, (_, step) => {
        const cx = xLeft + (step + 0.5) * stepX;
        const absIndex = tonicLetterRank + degree + step;
        const letterRank = absIndex % 7;
        const oct = tonicStartOct + Math.floor(absIndex / 7) + modeOctAdj;
        const staffPos = staffPosFromLetterOct(letterRank, oct);
        const y = staffPosToY(staffPos, STAFF_BOTTOM_Y, STEP_PX);
        const letter = RANK_TO_LETTER[letterRank] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';
        const acc = accidentalForLetterInKey(letter, currentKeyPc);
        const accGlyph = acc === 'sharp' ? '♯' : acc === 'flat' ? '♭' : '';
        const tok = step < 7 ? modeFormulaTokens[step] : modeFormulaTokens[0]; // La 8e note utilise le token de la première
        const isAlt = tok.includes('♭') || tok.includes('#');
        const hiColor = isAlt ? '#b91c1c' : undefined;

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
      })}
    </g>
  );
}

function ChordNameText({
  degree,
  xCenter,
  y,
  tonicLetterRank,
  currentKeyPc,
  s
}: {
  degree: number;
  xCenter: number;
  y: number;
  tonicLetterRank: number;
  currentKeyPc: number;
  s: number;
}) {
  const lr = (tonicLetterRank + degree) % 7;
  const note = americanNoteForLetterRank(lr, currentKeyPc);
  const quality = prettyQualityForDegree(degree);

  return (
    <text
      x={xCenter}
      y={y}
      fontSize={16 * s}
      className="fill-neutral-800"
      textAnchor="middle"
    >
      <tspan>{note.base}</tspan>
      {note.acc && (
        <tspan style={{ fontFamily: MUSIC_FONT }}>{note.acc === 'sharp' ? '♯' : '♭'}</tspan>
      )}
      <tspan style={{ fontSize: `${12 * s}px`, baselineShift: 'super' }}>{quality}</tspan>
    </text>
  );
}

function ModeLabels({
  degree,
  xCenter,
  tonicLetterRank,
  currentKeyPc,
  MODE_NAME_Y,
  s,
  X0,
  measureWidth
}: {
  degree: number;
  xCenter: number;
  tonicLetterRank: number;
  currentKeyPc: number;
  MODE_NAME_Y: number;
  s: number;
  X0: number;
  measureWidth: number;
}) {
  const lr = (tonicLetterRank + degree) % 7;
  const note = americanNoteForLetterRank(lr, currentKeyPc);
  const modeFull = MODE_NAMES[degree];
  const m = modeFull.match(/^([^()]+)(?:\s*\(([^)]+)\))?/);
  const modeBase = m ? m[1].trim() : modeFull;
  const tokens = MODE_DEGREE_FORMULAS[degree].split(' ');

  return (
    <g>
      {/* Mode tonic */}
      <text
        x={xCenter}
        y={MODE_NAME_Y - 22 * s}
        fontSize={18 * s}
        className="fill-neutral-800"
        textAnchor="middle"
      >
        <tspan>{note.base}</tspan>
        {note.acc && (
          <tspan style={{ fontFamily: MUSIC_FONT }}>{note.acc === 'sharp' ? '♯' : '♭'}</tspan>
        )}
      </text>

      {/* Mode name */}
      <text
        x={xCenter}
        y={MODE_NAME_Y}
        fontSize={24 * s}
        className="fill-neutral-700"
        textAnchor="middle"
      >
        {modeBase}
      </text>

      {/* Mode formula - aligné avec les notes (8 chiffres pour 8 notes) */}
      {[...tokens, tokens[0]].map((t, i) => {  // Ajouter la 8e note (octave de la première)
        const isAcc = t.includes('♭') || t.includes('#');
        const pad = 6 * s;
        const xLeft = X0 + degree * measureWidth + pad;
        const xRight = X0 + (degree + 1) * measureWidth - pad;
        const stepX = (xRight - xLeft) / 8;  // Diviser par 8 au lieu de 7
        const tokenX = xLeft + (i + 0.5) * stepX;

        return (
          <text
            key={`tok-${i}`}
            x={tokenX}
            y={MODE_NAME_Y + 22 * s}
            fontSize={10 * s}
            textAnchor="middle"
            fill={isAcc ? '#b91c1c' : '#374151'}
            fontWeight={isAcc ? 700 : 400}
          >
            {t}
          </text>
        );
      })}

    </g>
  );
}