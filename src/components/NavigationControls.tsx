import React from 'react';
import type { NavigationMode, ViewMode } from '../types';
import { VIEW_MODE_NAMES } from '../constants';

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
    <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 items-start sm:items-center">
      {/* Navigation Section */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
        <label className="text-neutral-700 text-lg lg:text-xl font-medium whitespace-nowrap">
          Navigation:
        </label>
        <div className="flex items-center gap-2">
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
            className="border border-neutral-300 rounded px-2 py-1 bg-white text-neutral-900 text-sm lg:text-base"
          >
            <option value="diatonique">Diatonique</option>
            <option value="circle">Cycle</option>
            <option value="random">Aléatoire</option>
          </select>
          <label className="inline-flex items-center gap-1 text-neutral-700 text-sm lg:text-base">
            <input
              type="checkbox"
              checked={coverEnabled}
              onChange={(e) => onCoverEnabledChange(e.target.checked)}
              className="align-middle"
            />
            <span>post-it</span>
          </label>
        </div>
        <div className="flex gap-2 text-sm text-neutral-600">
          <button
            onClick={(e) => {
              e.preventDefault();
              onGoLeft();
            }}
            className="hover:text-neutral-900 hover:underline"
            title="Tonalité précédente"
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onGoRight();
            }}
            className="hover:text-neutral-900 hover:underline"
            title="Tonalité suivante"
          >
            →
          </button>
        </div>
      </div>

      {/* View Section */}
      <div className="flex flex-col gap-2 items-start">
        <div className="flex items-center gap-2">
          <label className="text-neutral-700 text-lg lg:text-xl font-medium whitespace-nowrap">
            Vue:
          </label>
          <span className="text-neutral-900 text-base lg:text-lg font-medium">
            {VIEW_MODE_NAMES[currentView]}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewPrev();
            }}
            className="px-2 py-1 text-sm bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
            title={`Vue "${prevViewName}"`}
          >
            ↓
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewNext();
            }}
            className="px-2 py-1 text-sm bg-neutral-100 hover:bg-neutral-200 rounded transition-colors"
            title={`Vue "${nextViewName}"`}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}