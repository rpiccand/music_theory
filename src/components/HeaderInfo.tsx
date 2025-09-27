import React from 'react';
import Piano from './Piano';
import StickyNote from './ui/StickyNote';
import { MUSIC_FONT, TRAIL_NBSP, PIANO_WIDTH } from '../constants';
import { americanKeyNameMajor } from '../utils/music';

interface HeaderInfoProps {
  currentKeyPc: number;
  headerAccStr: string;
  headerAccType: 'none' | 'sharp' | 'flat';
  headerScaleSchemaPretty: string;
  chordNamesINodesSmall: React.ReactNode;
  headerChordSchema: string;
  coverEnabled: boolean;
  hideAlter: boolean;
  hideTetrade: boolean;
  hideAlterSchema: boolean;
  hideTetradeSchema: boolean;
  onToggleAlter: () => void;
  onToggleTetrade: () => void;
  onToggleAlterSchema: () => void;
  onToggleTetradeSchema: () => void;
}

export default function HeaderInfo({
  currentKeyPc,
  headerAccStr,
  headerAccType,
  headerScaleSchemaPretty,
  chordNamesINodesSmall,
  headerChordSchema,
  coverEnabled,
  hideAlter,
  hideTetrade,
  hideAlterSchema,
  hideTetradeSchema,
  onToggleAlter,
  onToggleTetrade,
  onToggleAlterSchema,
  onToggleTetradeSchema
}: HeaderInfoProps) {
  const keyName = americanKeyNameMajor(currentKeyPc);
  const displayKeyName = keyName.length ? keyName[0].toUpperCase() + keyName.slice(1) : keyName;

  return (
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
            gridTemplateRows: '4.5rem 4.5rem 4.5rem',
            alignItems: 'center',
            columnGap: '1ch',
            rowGap: '0.35rem',
          }}
        >
          {/* Tonalité */}
          <div className="justify-self-end font-bold leading-tight" style={{ fontSize: '3rem' }}>
            Tonalité
          </div>
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
            {displayKeyName}{TRAIL_NBSP}
            <div style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: PIANO_WIDTH
            }}>
              <Piano highlightedPc={currentKeyPc} />
            </div>
          </div>

          {/* Altérations */}
          <div className="justify-self-end text-neutral-800 mt-1 tracking-wide" style={{ fontSize: '3rem' }}>
            Altérations
          </div>
          <div className="text-neutral-800 mt-1 tracking-wide" style={{ fontSize: '3rem' }}>:</div>
          <div />
          <div className="justify-self-start text-left text-neutral-800 tracking-wide relative" style={{
            fontSize: '3rem',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
          }}>
            {headerAccType === 'none' ? '—' : (
              <>
                <span>{headerAccStr}</span>
                <span style={{ fontFamily: MUSIC_FONT, fontSize: '2rem' }}>
                  {headerAccType === 'sharp' ? '♯' : '♭'}
                </span>
              </>
            )}
            {coverEnabled && hideAlter && (
              <StickyNote onClick={onToggleAlter} />
            )}
          </div>
          <div />
          <div
            className="justify-self-start text-left text-neutral-800 mt-1 tracking-wide relative"
            style={{
              fontSize: '3rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              display: 'inline-block'
            }}
          >
            {headerScaleSchemaPretty}
            {coverEnabled && hideAlterSchema && (
              <StickyNote onClick={onToggleAlterSchema} />
            )}
          </div>

          {/* Tétrade */}
          <div className="justify-self-end text-neutral-800 tracking-wide" style={{ fontSize: '3rem' }}>
            Tétrade
          </div>
          <div className="text-neutral-800 tracking-wide" style={{ fontSize: '3rem' }}>:</div>
          <div />
          <div className="justify-self-start text-left text-neutral-800 tracking-wide relative" style={{
            fontSize: '3rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {chordNamesINodesSmall}
            <span>{TRAIL_NBSP}</span>
            {coverEnabled && hideTetrade && (
              <StickyNote onClick={onToggleTetrade} />
            )}
          </div>
          <div />
          <div
            className="justify-self-start text-left text-neutral-800 tracking-wide relative"
            style={{
              fontSize: '3rem',
              whiteSpace: 'nowrap',
              minWidth: '12ch',
              overflow: 'hidden',
              minHeight: '4.5rem'
            }}
          >
            {headerChordSchema}
            {coverEnabled && hideTetradeSchema && (
              <StickyNote onClick={onToggleTetradeSchema} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}