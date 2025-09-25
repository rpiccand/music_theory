import React from "react";

type TrebleClefProps = {
  x: number;
  STAFF_TOP_Y: number;
  LINE_SPACING: number;
};

const TrebleClef: React.FC<TrebleClefProps> = ({ x, STAFF_TOP_Y, LINE_SPACING }) => {
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
};

export default TrebleClef;