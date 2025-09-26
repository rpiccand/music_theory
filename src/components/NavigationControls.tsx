import React from 'react';
import type { NavigationMode, ViewMode } from '../types';
import { NAVIGATION_LABELS, VIEW_MODE_NAMES } from '../constants';

interface NavigationControlsProps {
  navMode: NavigationMode;
  coverEnabled: boolean;
  currentView: ViewMode;
  onNavModeChange: (mode: NavigationMode) => void;
  onCoverEnabledChange: (enabled: boolean) => void;
  onGoRight: () => void;
  onGoLeft: () => void;
  onViewNext: () => void;
  onViewPrev: () => void;
}

export default function NavigationControls({
  navMode,
  coverEnabled,
  currentView,
  onNavModeChange,
  onCoverEnabledChange,
  onGoRight,
  onGoLeft,
  onViewNext,
  onViewPrev
}: NavigationControlsProps) {
  const navSelectRef = React.useRef<HTMLSelectElement>(null);

  // Calculer les vues suivante et précédente
  const nextView = (currentView + 1) % 3;
  const prevView = (currentView - 1 + 3) % 3;
  const nextViewName = VIEW_MODE_NAMES[nextView as keyof typeof VIEW_MODE_NAMES];
  const prevViewName = VIEW_MODE_NAMES[prevView as keyof typeof VIEW_MODE_NAMES];

  return (
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
            onNavModeChange(e.target.value as NavigationMode);
            requestAnimationFrame(() => navSelectRef.current?.blur());
          }}
          onKeyDown={(ev) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.key)) {
              ev.preventDefault();
              ev.stopPropagation();
            }
          }}
          onClick={(ev) => ev.stopPropagation()}
          className="border border-neutral-300 rounded px-1 py-1 bg-white text-neutral-900"
          style={{ fontSize: '1.07rem', marginLeft: '0.25ch' }}
        >
          <option value="diatonique">{NAVIGATION_LABELS.diatonique}</option>
          <option value="circle">{NAVIGATION_LABELS.circle}</option>
          <option value="random">{NAVIGATION_LABELS.random}</option>
        </select>
        <label className="ml-3 inline-flex items-center gap-2 text-neutral-700" style={{ fontSize: '1rem' }}>
          <input
            type="checkbox"
            checked={coverEnabled}
            onChange={(e) => onCoverEnabledChange(e.target.checked)}
            className="align-middle"
          />
          <span>post-it</span>
        </label>
      </div>

      <div className="mt-2 text-neutral-600" style={{ fontSize: '1.2rem', lineHeight: 1.2, textAlign: 'left' }}>
        <div
          onClick={(e) => {
            e.preventDefault();
            onGoRight();
          }}
          role="button"
          className="transition-colors hover:text-neutral-900 hover:underline"
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          → : tonalité suivante
        </div>
        <div
          onClick={(e) => {
            e.preventDefault();
            onGoLeft();
          }}
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
        Vue : {VIEW_MODE_NAMES[currentView]}
      </div>

      {/* Vertical arrows legend below */}
      <div className="mt-1 text-neutral-600" style={{ fontSize: '1.2rem', lineHeight: 1.2, textAlign: 'left' }}>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onViewNext();
          }}
          role="button"
          className="transition-colors hover:text-neutral-900 hover:underline"
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          ↑ : vue "{nextViewName}"
        </div>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onViewPrev();
          }}
          role="button"
          className="transition-colors hover:text-neutral-900 hover:underline"
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          ↓ : vue "{prevViewName}"
        </div>
      </div>
    </div>
  );
}