export type ViewMode = 0 | 1 | 2;

export type NavigationMode = 'diatonique' | 'circle' | 'random';

export interface ChordToken {
  base: string;
  acc: 'sharp' | 'flat' | null;
}

export interface MeasureCoverState {
  [key: number]: boolean[];
}

export interface AppState {
  keyIndex: number;
  view: ViewMode;
  navMode: NavigationMode;
  coverEnabled: boolean;
  recentRandom: number[];
  hideAlter: boolean;
  hideTetrade: boolean;
  hideAlterSchema: boolean;
  hideTetradeSchema: boolean;
  measureCoversByView: Record<ViewMode, boolean[]>;
}