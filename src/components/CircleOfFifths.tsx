import React from "react";
import { sectorPath } from "../utils/drawing";

const COF_PCS: number[] = [0,7,2,9,4,11,6,1,8,3,10,5]; // C, G, D, A, E, B, Gb, Db, Ab, Eb, Bb, F
const COF_MAJ_LABELS = ['C','G','D','A','E','B','G♭','D♭','A♭','E♭','B♭','F'];
// Relative minors for each major above (aligned indices)
const COF_MIN_LABELS = ['Am','Em','Bm','F♯m','C♯m','G♯m','E♭m','B♭m','Fm','Cm','Gm','Dm'];

type Props = {
  pc: number;
  size?: number;
  onSelect?: (pc: number) => void;
};

/** Pure circle of fifths SVG. No portals, just the graphic. */
const CircleOfFifths: React.FC<Props> = ({ pc, size = 220, onSelect }) => {
  const w = size, h = size; const cx = w/2, cy = h/2;
  const step = (2*Math.PI)/12;
  // Center the C sector at the very top (12 o'clock)
  const startAngle = -Math.PI / 2 - step / 2; // 0° = East; -90° = North in SVG
  const rOuter = size*0.48, rInner = size*0.30, rHole = size*0.16;

  // current index on circle (C at 0, clockwise fifths)
  const idx = ((pc % 12) + 12) % 12;
  const outerIdx = (idx * 7) % 12; // map to circle index
  const highlightIdxMajor = outerIdx;
  const highlightIdxMinor = outerIdx;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {/* Outer ring (majors) */}
      {COF_PCS.map((_, i) => {
        const a0 = startAngle + i * step;
        const a1 = a0 + step;
        const isHi = i === highlightIdxMajor;
        return (
          <path
            key={`maj-${i}`}
            d={sectorPath(cx, cy, rInner, rOuter, a0, a1)}
            fill={isHi ? "#fde68a" : "#e5e7eb"}
            stroke="#111"
            strokeWidth={1}
            style={{ cursor: onSelect ? "pointer" : "default" }}
            onClick={() => onSelect && onSelect(COF_PCS[i])}
            role="button"
            aria-label={`Select ${COF_MAJ_LABELS[i]} major`}
          />
        );
      })}
      {/* Inner ring (minors) */}
      {COF_PCS.map((_, i) => {
        const a0 = startAngle + i * step;
        const a1 = a0 + step;
        const isHi = i === highlightIdxMinor;
        return (
          <path
            key={`min-${i}`}
            d={sectorPath(cx, cy, rHole, rInner, a0, a1)}
            fill={isHi ? "#fde68a" : "#ffffff"}
            stroke="#111"
            strokeWidth={1}
            style={{ cursor: onSelect ? "pointer" : "default" }}
            onClick={() => onSelect && onSelect(COF_PCS[i])}
            role="button"
            aria-label={`Select ${COF_MIN_LABELS[i]} (relative of ${COF_MAJ_LABELS[i]})`}
          />
        );
      })}
      {/* Labels */}
      {COF_MAJ_LABELS.map((lab, i) => {
        const ang = startAngle + (i + 0.5) * step;
        const x = cx + (rInner + (rOuter - rInner) / 2) * Math.cos(ang);
        const y = cy + (rInner + (rOuter - rInner) / 2) * Math.sin(ang);
        return (
          <text
            key={`labM-${i}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.09}
            fontFamily="'Noto Music','Noto Sans Symbols2','Bravura Text','Bravura','Segoe UI Symbol','Arial',sans-serif"
            style={{ cursor: onSelect ? "pointer" : "default" }}
            onClick={() => onSelect && onSelect(COF_PCS[i])}
          >
            {lab}
          </text>
        );
      })}
      {COF_MIN_LABELS.map((lab, i) => {
        const ang = startAngle + (i + 0.5) * step;
        const x = cx + (rHole + (rInner - rHole) / 2) * Math.cos(ang);
        const y = cy + (rHole + (rInner - rHole) / 2) * Math.sin(ang);
        return (
          <text
            key={`labm-${i}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.07}
            fontFamily="'Noto Music','Noto Sans Symbols2','Bravura Text','Bravura','Segoe UI Symbol','Arial',sans-serif"
            style={{ cursor: onSelect ? "pointer" : "default" }}
            onClick={() => onSelect && onSelect(COF_PCS[i])}
          >
            {lab}
          </text>
        );
      })}
    </svg>
  );
};

export default CircleOfFifths;