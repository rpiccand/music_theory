import { useCallback } from 'react';
import type { NavigationMode, ViewMode } from '../types';

interface UseKeyNavigationProps {
  setKeyIndex: (value: number | ((prev: number) => number)) => void;
  navMode: NavigationMode;
  recentRandom: number[];
  setRecentRandom: (value: number[] | ((prev: number[]) => number[])) => void;
  coverEnabled: boolean;
  setHideAlter: (value: boolean) => void;
  setHideTetrade: (value: boolean) => void;
  setHideAlterSchema: (value: boolean) => void;
  setHideTetradeSchema: (value: boolean) => void;
  setMeasureCoversByView: (value: Record<ViewMode, boolean[]>) => void;
}

export function useKeyNavigation({
  setKeyIndex,
  navMode,
  recentRandom,
  setRecentRandom,
  coverEnabled,
  setHideAlter,
  setHideTetrade,
  setHideAlterSchema,
  setHideTetradeSchema,
  setMeasureCoversByView,
}: UseKeyNavigationProps) {
  const applyCoverMode = useCallback(() => {
    if (coverEnabled) {
      setHideAlter(true);
      setHideTetrade(true);
      setHideAlterSchema(true);
      setHideTetradeSchema(true);
      setMeasureCoversByView({
        0: Array(7).fill(true),
        1: Array(7).fill(true),
        2: Array(7).fill(true)
      });
    }
  }, [
    coverEnabled,
    setHideAlter,
    setHideTetrade,
    setHideAlterSchema,
    setHideTetradeSchema,
    setMeasureCoversByView
  ]);

  const getRandomKey = useCallback((currentIndex: number) => {
    const forbidden = new Set<number>([currentIndex, ...recentRandom]);
    let candidates = Array.from({ length: 12 }, (_, k) => k).filter(k => !forbidden.has(k));
    if (candidates.length === 0) {
      candidates = Array.from({ length: 12 }, (_, k) => k).filter(k => k !== currentIndex);
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }, [recentRandom]);

  const goRight = useCallback(() => {
    setKeyIndex(i => {
      let newIndex: number;

      if (navMode === 'diatonique') {
        newIndex = (i + 1) % 12;
      } else if (navMode === 'circle') {
        newIndex = (i + 7) % 12;
      } else {
        newIndex = getRandomKey(i);
        setRecentRandom(prev => {
          const next = [i, ...prev];
          return next.slice(0, 8);
        });
      }

      applyCoverMode();
      return newIndex;
    });
  }, [navMode, getRandomKey, setRecentRandom, applyCoverMode]);

  const goLeft = useCallback(() => {
    setKeyIndex(i => {
      let newIndex: number;

      if (navMode === 'diatonique') {
        newIndex = (i + 11) % 12;
      } else if (navMode === 'circle') {
        newIndex = (i + 5) % 12;
      } else {
        newIndex = getRandomKey(i);
        setRecentRandom(prev => {
          const next = [i, ...prev];
          return next.slice(0, 8);
        });
      }

      applyCoverMode();
      return newIndex;
    });
  }, [navMode, getRandomKey, setRecentRandom, applyCoverMode]);

  return {
    goRight,
    goLeft,
  };
}