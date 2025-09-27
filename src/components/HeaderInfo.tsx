import React from 'react';
import Piano from './Piano';
import StickyNote from './ui/StickyNote';
import { MUSIC_FONT } from '../constants';
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
    <div className="p-2 w-full">
      {/* Mobile/Tablet Layout (current refactored version) */}
      <div className="xl:hidden">
        <div className="grid grid-cols-[auto_auto_auto_auto] gap-y-2 items-center w-full" style={{columnGap: '5ch'}}>
          {/* Tonalité */}
          <div className="text-neutral-700 text-sm font-medium">Tonalité:</div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-neutral-900">{displayKeyName}</span>
            <div className="transform scale-50">
              <Piano highlightedPc={currentKeyPc} />
            </div>
          </div>
          <div></div> {/* Espacement */}
          <div></div> {/* Espacement */}

          {/* Altérations */}
          <div className="text-neutral-700 text-sm font-medium">Altérations:</div>
          <div className="text-sm text-neutral-800 relative">
            {headerAccType === 'none' ? '—' : (
              <>
                <span>{headerAccStr}</span>
                <span className="text-xs" style={{ fontFamily: MUSIC_FONT }}>
                  {headerAccType === 'sharp' ? '♯' : '♭'}
                </span>
              </>
            )}
            {coverEnabled && hideAlter && (
              <StickyNote onClick={onToggleAlter} />
            )}
          </div>
          <div></div> {/* Espacement */}
          <div className="text-sm text-neutral-800 relative">
            {headerScaleSchemaPretty}
            {coverEnabled && hideAlterSchema && (
              <StickyNote onClick={onToggleAlterSchema} />
            )}
          </div>

          {/* Tétrade */}
          <div className="text-neutral-700 text-sm font-medium">Tétrade:</div>
          <div className="text-sm text-neutral-800 relative">
            {chordNamesINodesSmall}
            {coverEnabled && hideTetrade && (
              <StickyNote onClick={onToggleTetrade} />
            )}
          </div>
          <div></div> {/* Espacement */}
          <div className="text-sm text-neutral-800 relative">
            {headerChordSchema}
            {coverEnabled && hideTetradeSchema && (
              <StickyNote onClick={onToggleTetradeSchema} />
            )}
          </div>
        </div>
      </div>

      {/* Desktop/Laptop Layout (original version before refactoring) */}
      <div className="hidden xl:block">
        <div className="bg-gray-50 p-4 rounded border">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
            {/* Tonalité */}
            <div className="text-neutral-700 text-sm font-medium">Tonalité:</div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-neutral-900">{displayKeyName}</span>
              <div className="transform scale-75">
                <Piano highlightedPc={currentKeyPc} />
              </div>
            </div>

            {/* Altérations */}
            <div className="text-neutral-700 text-sm font-medium">Altérations:</div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-neutral-800 relative">
                {headerAccType === 'none' ? '—' : (
                  <>
                    <span>{headerAccStr}</span>
                    <span className="text-xs" style={{ fontFamily: MUSIC_FONT }}>
                      {headerAccType === 'sharp' ? '♯' : '♭'}
                    </span>
                  </>
                )}
                {coverEnabled && hideAlter && (
                  <StickyNote onClick={onToggleAlter} />
                )}
              </div>
              <div className="text-sm text-neutral-800 relative">
                {headerScaleSchemaPretty}
                {coverEnabled && hideAlterSchema && (
                  <StickyNote onClick={onToggleAlterSchema} />
                )}
              </div>
            </div>

            {/* Tétrade */}
            <div className="text-neutral-700 text-sm font-medium">Tétrade:</div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-neutral-800 relative">
                {chordNamesINodesSmall}
                {coverEnabled && hideTetrade && (
                  <StickyNote onClick={onToggleTetrade} />
                )}
              </div>
              <div className="text-sm text-neutral-800 relative">
                {headerChordSchema}
                {coverEnabled && hideTetradeSchema && (
                  <StickyNote onClick={onToggleTetradeSchema} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}