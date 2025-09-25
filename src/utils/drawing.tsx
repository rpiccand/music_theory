// --- Pure SVG/drawing helpers (no app state) --------------------------------
import React from "react";
import {
  staffPosToY,
  ledgerLinePositionsForStaffPos,
} from "./music";

/**
 * Draw a notehead at a given staff position, including any needed ledger lines.
 * - cx: center x of the notehead
 * - staffPos: diatonic staff position (E4 baseline = 0)
 * - scale: relative size of the notehead (1 = default)
 * - STAFF_BOTTOM_Y: absolute Y coordinate of the bottom staff line
 * - STEP_PX: vertical pixels per diatonic step (half a line spacing)
 * - noteFill: optional fill color (e.g., for highlighting)
 */
export function noteheadWithLedger(
  cx: number,
  staffPos: number,
  scale = 1,
  STAFF_BOTTOM_Y: number,
  STEP_PX: number,
  noteFill?: string
) {
  const y = staffPosToY(staffPos, STAFF_BOTTOM_Y, STEP_PX);
  const elems: React.ReactNode[] = [];

  // Ledger lines (above/below the 5 staff lines)
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

  // Elliptical notehead, slightly rotated
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

/**
 * Donut-sector path (for Circle of Fifths rings).
 * rInner→rOuter, from a0 to a1 (radians), clockwise.
 */
export function sectorPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  a0: number,
  a1: number
) {
  const x0o = cx + rOuter * Math.cos(a0), y0o = cy + rOuter * Math.sin(a0);
  const x1o = cx + rOuter * Math.cos(a1), y1o = cy + rOuter * Math.sin(a1);
  const x1i = cx + rInner * Math.cos(a1), y1i = cy + rInner * Math.sin(a1);
  const x0i = cx + rInner * Math.cos(a0), y0i = cy + rInner * Math.sin(a0);
  const largeArc = (a1 - a0) % (2 * Math.PI) > Math.PI ? 1 : 0;
  return [
    `M ${x0o} ${y0o}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x1o} ${y1o}`,
    `L ${x1i} ${y1i}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x0i} ${y0i}`,
    "Z",
  ].join(" ");
}