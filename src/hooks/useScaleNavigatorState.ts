import { useState } from 'react';
import type { NavigationMode, ViewMode } from '../types';

export function useScaleNavigatorState() {
  const [keyIndex, setKeyIndex] = useState<number>(0);
  const [view, setView] = useState<ViewMode>(0);
  const [navMode, setNavMode] = useState<NavigationMode>('diatonique');
  const [coverEnabled, setCoverEnabled] = useState<boolean>(false);
  const [recentRandom, setRecentRandom] = useState<number[]>([]);

  const [hideAlter, setHideAlter] = useState<boolean>(false);
  const [hideTetrade, setHideTetrade] = useState<boolean>(false);
  const [hideAlterSchema, setHideAlterSchema] = useState<boolean>(false);
  const [hideTetradeSchema, setHideTetradeSchema] = useState<boolean>(false);
  const [measureCoversByView, setMeasureCoversByView] = useState<Record<ViewMode, boolean[]>>({
    0: Array(7).fill(false),
    1: Array(7).fill(false),
    2: Array(7).fill(false),
  });

  return {
    keyIndex,
    setKeyIndex,
    view,
    setView,
    navMode,
    setNavMode,
    coverEnabled,
    setCoverEnabled,
    recentRandom,
    setRecentRandom,
    hideAlter,
    setHideAlter,
    hideTetrade,
    setHideTetrade,
    hideAlterSchema,
    setHideAlterSchema,
    hideTetradeSchema,
    setHideTetradeSchema,
    measureCoversByView,
    setMeasureCoversByView,
  };
}