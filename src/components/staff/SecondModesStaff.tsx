import { X0, LINE_SPACING } from '../../constants';
import { computeModalScale, type ModeName } from '../../theory/modes';

export default function SecondModesStaff({
  staffWidth,
  measureWidth,
  tonic,
  modes,
  yTop,
  fontSize = 12,
}: {
  staffWidth: number;
  measureWidth: number;
  tonic: string;
  modes: ModeName[];      // ordre d’affichage (ex: ['ionian','dorian',...])
  yTop: number;           // position verticale de la 2e portée
  fontSize?: number;
}) {
  const yBottom = yTop + 4 * LINE_SPACING;
  return (
    <g>
      {[0,1,2,3,4].map((i)=>(
        <line key={`2staff-line-${i}`} x1={0} x2={staffWidth}
          y1={yTop + i*LINE_SPACING} y2={yTop + i*LINE_SPACING}
          stroke="#333" strokeWidth={1}/>
      ))}
      {Array.from({length: modes.length+1}).map((_,i)=>(
        <line key={`2staff-bar-${i}`} x1={X0 + i*measureWidth} x2={X0 + i*measureWidth}
          y1={yTop-5} y2={yBottom} stroke="#999" strokeWidth={1}/>
      ))}
      {modes.map((m,idx)=>{
        const notes = computeModalScale(tonic, m); // 7 notes modales
        const xCenter = X0 + idx*measureWidth + measureWidth/2;
        const yText = yTop + LINE_SPACING*2; // milieu de portée pour un rendu simple (texte)
        return (
          <g key={`2staff-notes-${m}`}>
            <text x={xCenter} y={yText} fontSize={fontSize} textAnchor="middle">
              {notes.join(' ')}
            </text>
            <text x={xCenter} y={yBottom + 14} fontSize={fontSize-2} textAnchor="middle" fill="#666">
              {m}
            </text>
          </g>
        );
      })}
    </g>
  );
}
