import { useCallback } from 'react';
import type { ViewMode } from '../types';

interface UseViewNavigationProps {
  setView: (value: ViewMode | ((prev: ViewMode) => ViewMode)) => void;
}

export function useViewNavigation({ setView }: UseViewNavigationProps) {
  const viewNext = useCallback(() => {
    setView(v => ((v + 1) % 3) as ViewMode);
  }, [setView]);

  const viewPrev = useCallback(() => {
    setView(v => ((v + 2) % 3) as ViewMode);
  }, [setView]);

  return {
    viewNext,
    viewPrev,
  };
}