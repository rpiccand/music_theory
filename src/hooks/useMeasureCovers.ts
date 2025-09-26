import { useEffect } from 'react';
import type { ViewMode } from '../types';

interface UseMeasureCoversProps {
  keyIndex: number;
  coverEnabled: boolean;
  setMeasureCoversByView: (value: Record<ViewMode, boolean[]>) => void;
  setHideAlter: (value: boolean) => void;
  setHideTetrade: (value: boolean) => void;
  setHideAlterSchema: (value: boolean) => void;
  setHideTetradeSchema: (value: boolean) => void;
}

export function useMeasureCovers({
  keyIndex,
  coverEnabled,
  setMeasureCoversByView,
  setHideAlter,
  setHideTetrade,
  setHideAlterSchema,
  setHideTetradeSchema,
}: UseMeasureCoversProps) {
  useEffect(() => {
    if (coverEnabled) {
      setMeasureCoversByView({
        0: Array(7).fill(true),
        1: Array(7).fill(true),
        2: Array(7).fill(true)
      });
    } else {
      setMeasureCoversByView({
        0: Array(7).fill(false),
        1: Array(7).fill(false),
        2: Array(7).fill(false)
      });
    }
  }, [keyIndex, coverEnabled, setMeasureCoversByView]);

  useEffect(() => {
    if (!coverEnabled) return;

    setHideAlter(true);
    setHideTetrade(true);
    setHideAlterSchema(true);
    setHideTetradeSchema(true);
  }, [keyIndex, coverEnabled, setHideAlter, setHideTetrade, setHideAlterSchema, setHideTetradeSchema]);
}