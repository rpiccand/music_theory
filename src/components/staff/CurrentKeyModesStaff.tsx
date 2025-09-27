import { motion } from 'framer-motion';
import { MODE_STEPS, type ModeName } from '../../theory/modes';
import {
  RANK_TO_LETTER,
  staffPosFromLetterOct,
  staffPosToY,
  accidentalForLetterInKey,
  americanKeyNameMajor
} from '../../utils/music';
import { noteheadWithLedger } from '../../utils/drawing';
import { MUSIC_FONT } from '../../constants';
import TrebleClef from '../TrebleClef';

export default function CurrentKeyModesStaff({
  staffWidth,
  measureWidth,
  currentKeyPc,
  modes,
  yTop,
  X0,
  tonicLetterRank,
  tonicStartOct,
  STEP_PX,
  s,
  LINE_SPACING,
  fontSize = 12,
}: {
  staffWidth: number;
  measureWidth: number;
  currentKeyPc: number;      // la tonalité courante en pitch class (0-11)
  modes: ModeName[];         // ordre d'affichage (ex: ['ionian','dorian',...])
  yTop: number;             // position verticale de la portée
  X0: number;               // décalage horizontal du début des mesures
  tonicLetterRank: number;  // rang de la lettre de la tonique (0=C, 1=D, etc.)
  tonicStartOct: number;    // octave de départ
  STEP_PX: number;          // pixels par demi-ton vertical
  s: number;                // facteur d'échelle
  LINE_SPACING: number;     // espacement entre les lignes de la portée
  fontSize?: number;
}) {
  const yBottom = yTop + 4 * LINE_SPACING;

  return (
    <g>
      {/* Lignes de la portée */}
      {[0,1,2,3,4].map((i)=>(
        <line
          key={`current-staff-line-${i}`}
          x1={0}
          x2={staffWidth}
          y1={yTop + i*LINE_SPACING}
          y2={yTop + i*LINE_SPACING}
          stroke="#333"
          strokeWidth={1}
        />
      ))}

      {/* Barres de mesure */}
      {Array.from({length: modes.length+1}).map((_,i)=>{
        const x = X0 + i*measureWidth;
        // S'assurer que la barre ne dépasse pas la largeur de la portée
        if (x > staffWidth) return null;

        return (
          <line
            key={`current-staff-bar-${i}`}
            x1={x}
            x2={x}
            y1={yTop-5}
            y2={yBottom}
            stroke="#999"
            strokeWidth={i === 0 ? 2 : 1} // Première barre plus épaisse
          />
        );
      })}

      {/* Clé de sol */}
      <TrebleClef x={26} STAFF_TOP_Y={yTop} LINE_SPACING={LINE_SPACING} scale={1.3} />

      {/* Notes pour chaque mode */}
      {modes.map((mode, modeIdx) => {
        const modeSteps = MODE_STEPS[mode];
        const pad = 6 * s; // Même padding que ModeNotesView
        const xLeft = X0 + modeIdx * measureWidth + pad;
        const xRight = X0 + (modeIdx + 1) * measureWidth - pad;
        const stepX = (xRight - xLeft) / 8;


        // Noms des modes en français
        const modeNames: Record<ModeName, string> = {
          'ionian': 'ionien',
          'dorian': 'dorien',
          'phrygian': 'phrygien',
          'lydian': 'lydien',
          'mixolydian': 'mixolydien',
          'aeolian': 'éolien',
          'locrian': 'locrien'
        };

        // Utiliser la même fonction que le header pour la cohérence
        const keyDisplayName = americanKeyNameMajor(currentKeyPc);

        return (
          <g key={`current-mode-${mode}`}>
            {/* Notes du mode */}
            {Array.from({ length: 8 }).map((_, step) => {
              // Position comme la première portée : partir de la tonique + step (pas du mode)
              const cx = xLeft + (step + 0.5) * stepX;
              const absIndex = tonicLetterRank + step; // Partir de la tonique, pas du mode
              const letterRank = absIndex % 7;
              const oct = tonicStartOct + Math.floor(absIndex / 7);
              const letter = RANK_TO_LETTER[letterRank] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';

              // Altération de base de cette lettre dans la tonalité courante
              const baseAcc = accidentalForLetterInKey(letter, currentKeyPc);
              const baseAccGlyph = baseAcc === 'sharp' ? '♯' : baseAcc === 'flat' ? '♭' : '';


              // Note correspondante dans ce mode spécifique
              // Pour la 8e note (step === 7), utiliser la même que la première (step 0)
              const modeStepIndex = step >= 7 ? 0 : step;
              const modeNotePc = (currentKeyPc + modeSteps[modeStepIndex]) % 12;

              // Trouver la meilleure représentation enharmonique pour ce pitch class
              const targetPc = modeNotePc;

              // Liste des 12 pitch classes avec leurs représentations possibles
              const pcToNotes = [
                ['C', 'B♯'],           // 0
                ['C♯', 'D♭'],         // 1
                ['D'],                // 2
                ['D♯', 'E♭'],         // 3
                ['E', 'F♭'],          // 4
                ['F', 'E♯'],          // 5
                ['F♯', 'G♭'],         // 6
                ['G'],                // 7
                ['G♯', 'A♭'],         // 8
                ['A'],                // 9
                ['A♯', 'B♭'],         // 10
                ['B', 'C♭']           // 11
              ];

              // Obtenir les options possibles pour ce pitch class
              const noteOptions = pcToNotes[targetPc];

              let finalLetterRank = letterRank;
              let finalOct = oct;
              let accGlyph = '';
              let isAlteredByMode = false;

              // Trouver la meilleure option parmi les enharmoniques possibles
              let bestOption = null;
              let bestScore = Infinity;

              for (const noteStr of noteOptions) {
                const noteLetter = noteStr[0] as 'A'|'B'|'C'|'D'|'E'|'F'|'G';
                const noteAcc = noteStr.length > 1 ? noteStr.substring(1) : '';
                const noteLetterRank = ['C','D','E','F','G','A','B'].indexOf(noteLetter);

                // Calculer l'octave pour cette lettre
                let noteOct = oct;
                const letterDiff = noteLetterRank - letterRank;

                if (letterDiff > 3) {
                  noteOct = oct - 1; // On a reculé dans l'alphabet (ex: de F à A en remontant)
                } else if (letterDiff < -3) {
                  noteOct = oct + 1; // On a avancé dans l'alphabet (ex: de A à F en descendant)
                }

                // Vérifier si cette option nécessite l'altération de la tonalité
                const noteBaseAcc = accidentalForLetterInKey(noteLetter, currentKeyPc);
                const noteBaseAccGlyph = noteBaseAcc === 'sharp' ? '♯' : noteBaseAcc === 'flat' ? '♭' : '';

                // Calculer un score pour cette option (plus bas = meilleur)
                let score = 0;

                // Préférer les notes sans altération exotique (♭, ♯♯, etc.)
                if (noteAcc === '♭♭' || noteAcc === '♯♯' || noteAcc === '♮') {
                  score += 100; // Très mauvais
                } else if (noteAcc === '♭' || noteAcc === '♯') {
                  score += 10; // Altération simple acceptable
                }

                // Préférer les notes qui correspondent à la tonalité
                if (noteAcc === noteBaseAccGlyph) {
                  score += 1; // Bonus léger pour correspondre à la tonalité
                } else if (noteAcc === '' && noteBaseAccGlyph === '') {
                  score += 0; // Parfait : note naturelle dans tonalité naturelle
                } else if (noteAcc !== noteBaseAccGlyph) {
                  score += 5; // Altération différente de la tonalité
                }

                // Préférer les notes qui suivent l'ordre diatonique
                const expectedLetterRank = (tonicLetterRank + step) % 7;
                if (noteLetterRank === expectedLetterRank) {
                  score -= 5; // Gros bonus pour respecter l'ordre diatonique
                } else {
                  score += 10; // Gros malus pour ne pas respecter l'ordre diatonique
                }

                if (score < bestScore) {
                  bestScore = score;
                  bestOption = {
                    letterRank: noteLetterRank,
                    oct: noteOct,
                    acc: noteAcc,
                    letter: noteLetter
                  };
                }
              }

              if (bestOption) {
                finalLetterRank = bestOption.letterRank;
                finalOct = bestOption.oct;
                accGlyph = bestOption.acc;
                // Une note est altérée par le mode seulement si elle diffère de la tonalité de base
                // En ionien, aucune note ne devrait être rouge car c'est la tonalité de base
                const isIonianMode = mode === 'ionian';
                isAlteredByMode = !isIonianMode && ((bestOption.letterRank !== letterRank) || (bestOption.acc !== baseAccGlyph));
              }

              // Recalculer la position sur la portée avec la lettre finale
              const finalStaffPos = staffPosFromLetterOct(finalLetterRank, finalOct);

              return (
                <motion.g
                  key={`mode-${mode}-note-${step}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: step * 0.05 }}
                >
                  {/* Altération */}
                  {accGlyph && (
                    <text
                      x={
                        accGlyph.includes('♯♯') || accGlyph.includes('♭♭') ? cx - 18 * s : // Doubles altérations plus à gauche
                        accGlyph === '♯' ? cx - 9 * s : cx - 14 * s // Même position que première portée en vue modes
                      }
                      y={staffPosToY(finalStaffPos, yTop + 4 * LINE_SPACING, STEP_PX)}
                      fontSize={13 * s} // Même taille que première portée
                      fontFamily={MUSIC_FONT}
                      dominantBaseline="middle"
                      fill={isAlteredByMode ? '#b91c1c' : '#374151'} // Même rouge que première portée
                    >
                      {accGlyph}
                    </text>
                  )}
                  {/* Tête de note */}
                  {noteheadWithLedger(
                    cx,
                    finalStaffPos,
                    s * 0.5, // Même taille que première portée en vue modes
                    yTop + 4 * LINE_SPACING,
                    STEP_PX, // Même espacement que la première portée
                    isAlteredByMode ? '#b91c1c' : '#374151' // Même rouge que première portée
                  )}
                </motion.g>
              );
            })}

            {/* Nom du mode */}
            <text
              x={X0 + modeIdx * measureWidth + measureWidth / 2}
              y={yBottom + 20}
              fontSize={fontSize}
              textAnchor="middle"
              fill="#374151"
              fontWeight="400"
            >
              {keyDisplayName} {modeNames[mode]}
            </text>

          </g>
        );
      })}
    </g>
  );
}