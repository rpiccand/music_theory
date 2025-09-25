import React from "react";

const WHITE_KEYS = new Set([0, 2, 4, 5, 7, 9, 11]);

type PianoProps = { highlightedPc: number };

const Piano: React.FC<PianoProps> = ({ highlightedPc }) => {
  // Draw from C4 (60) for 24 semitones (to B5 inclusive)
  const startMidi = 60; // C4
  const endMidi = startMidi + 24; // 2 octaves
  const keyWidth = 16;
  const whiteKeyHeight = 64;
  const corner = 3;

  const keys: number[] = [];
  for (let m = startMidi; m < endMidi; m++) keys.push(m);

  const whitesSoFar = (idx: number) =>
    keys.slice(0, idx).filter((k) => WHITE_KEYS.has((k % 12 + 12) % 12)).length;
  const totalWhite = keys.filter((k) => WHITE_KEYS.has((k % 12 + 12) % 12)).length;
  const svgWidth = keyWidth * totalWhite;

  const pcEq = (a: number, b: number) =>
    (((a % 12) + 12) % 12) === (((b % 12) + 12) % 12);

  return (
    <svg
      width={svgWidth}
      height={whiteKeyHeight + 14}
      aria-label="Clavier (2 octaves)"
      style={{ display: "block" }}
    >
      <defs>
        {/* Subtle drop shadow for keys */}
        <filter id="keyShadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="1.4"
            floodColor="#000"
            floodOpacity="0.25"
          />
        </filter>
        {/* White key glossy gradient */}
        <linearGradient id="whiteGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f9fafb" />
          <stop offset="55%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e5e7eb" />
        </linearGradient>
        {/* Black key glossy gradient */}
        <linearGradient id="blackGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#444" />
          <stop offset="40%" stopColor="#111" />
          <stop offset="100%" stopColor="#000" />
        </linearGradient>
        {/* Darker red highlight overlay */}
        <linearGradient id="redHi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
      </defs>

      {/* Base board */}
      <rect
        x={-6}
        y={whiteKeyHeight}
        width={svgWidth + 12}
        height={10}
        fill="#111"
        opacity="0.12"
      />

      {/* White keys first (under) */}
      {keys.map((m, i) => {
        const pc = ((m % 12) + 12) % 12;
        if (!WHITE_KEYS.has(pc)) return null;
        const x = keyWidth * whitesSoFar(i);
        const isTonic = pcEq(pc, highlightedPc);
        return (
          <g key={`w-${m}`} filter="url(#keyShadow)">
            <rect
              x={x}
              y={0}
              width={keyWidth}
              height={whiteKeyHeight}
              rx={corner}
              ry={corner}
              fill="url(#whiteGrad)"
              stroke="#111"
              strokeOpacity="0.35"
              strokeWidth={0.8}
            />
            {/* separator line */}
            <line
              x1={x + keyWidth - 0.5}
              y1={0}
              x2={x + keyWidth - 0.5}
              y2={whiteKeyHeight}
              stroke="#000"
              strokeOpacity="0.08"
            />
            {isTonic && (
              <rect
                x={x + 2}
                y={2}
                width={keyWidth - 4}
                height={whiteKeyHeight - 10}
                rx={corner - 1}
                ry={corner - 1}
                fill="url(#redHi)"
                opacity="0.45"
                stroke="#7f1d1d"
                strokeWidth={1.2}
                style={{ mixBlendMode: "multiply" }}
              />
            )}
          </g>
        );
      })}

      {/* Black keys on top */}
      {keys.map((m, i) => {
        const pc = ((m % 12) + 12) % 12;
        if (WHITE_KEYS.has(pc)) return null;
        const x = keyWidth * (whitesSoFar(i) - 0.36);
        const isTonic = pcEq(pc, highlightedPc);
        return (
          <g key={`b-${m}`} filter="url(#keyShadow)">
            <rect
              x={x}
              y={0}
              width={keyWidth * 0.72}
              height={40}
              rx={corner}
              ry={corner}
              fill="url(#blackGrad)"
            />
            {isTonic && (
              <rect
                x={x + 1.5}
                y={1.5}
                width={keyWidth * 0.72 - 3}
                height={40 - 6}
                rx={corner - 1}
                ry={corner - 1}
                fill="url(#redHi)"
                opacity="0.55"
                stroke="#7f1d1d"
                strokeWidth={1}
                style={{ mixBlendMode: "screen" }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default Piano;