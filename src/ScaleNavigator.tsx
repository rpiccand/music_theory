import React, { useEffect, useState } from "react";
import { KEYS } from "./utils/music";
import { useHeaderInfo } from "./utils/headerInfo";
import { useScaleNavigatorState } from "./hooks/useScaleNavigatorState";
import { useKeyNavigation } from "./hooks/useKeyNavigation";
import { useViewNavigation } from "./hooks/useViewNavigation";
import { useKeyboardControls } from "./hooks/useKeyboardControls";
import { useMeasureCovers } from "./hooks/useMeasureCovers";
import NavigationControls from "./components/NavigationControls";
import HeaderInfo from "./components/HeaderInfo";
import MusicalStaff from "./components/staff/MusicalStaff";
import CircleOverlay from "./components/CircleOverlay";
import type { ViewMode } from "./types";

const ScaleNavigator: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1000);

  const state = useScaleNavigatorState();
  const headerInfo = useHeaderInfo(state.keyIndex);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        if (e.contentRect) setContainerWidth(e.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const keyNavigation = useKeyNavigation({
    setKeyIndex: state.setKeyIndex,
    navMode: state.navMode,
    recentRandom: state.recentRandom,
    setRecentRandom: state.setRecentRandom,
    coverEnabled: state.coverEnabled,
    setHideAlter: state.setHideAlter,
    setHideTetrade: state.setHideTetrade,
    setHideAlterSchema: state.setHideAlterSchema,
    setHideTetradeSchema: state.setHideTetradeSchema,
    setMeasureCoversByView: state.setMeasureCoversByView,
  });

  const viewNavigation = useViewNavigation({
    setView: state.setView,
  });

  useKeyboardControls({
    goRight: keyNavigation.goRight,
    goLeft: keyNavigation.goLeft,
    viewNext: viewNavigation.viewNext,
    viewPrev: viewNavigation.viewPrev,
    dependencies: [state.navMode, state.recentRandom, state.coverEnabled],
  });

  useMeasureCovers({
    keyIndex: state.keyIndex,
    coverEnabled: state.coverEnabled,
    setMeasureCoversByView: state.setMeasureCoversByView,
    setHideAlter: state.setHideAlter,
    setHideTetrade: state.setHideTetrade,
    setHideAlterSchema: state.setHideAlterSchema,
    setHideTetradeSchema: state.setHideTetradeSchema,
  });

  useEffect(() => {
    state.setRecentRandom([]);
    if (state.coverEnabled) {
      state.setHideAlter(true);
      state.setHideTetrade(true);
      state.setHideAlterSchema(true);
      state.setHideTetradeSchema(true);
    } else {
      state.setHideAlter(false);
      state.setHideTetrade(false);
      state.setHideAlterSchema(false);
      state.setHideTetradeSchema(false);
    }
  }, [state.navMode, state.coverEnabled]);

  const handleToggleMeasureCover = (measureIndex: number) => {
    state.setMeasureCoversByView(prev => {
      const next: Record<ViewMode, boolean[]> = {
        0: prev[0].slice(),
        1: prev[1].slice(),
        2: prev[2].slice(),
      };
      next[state.view] = prev[state.view].slice();
      next[state.view][measureIndex] = false;
      return next;
    });
  };

  const handleCoverEnabledChange = (enabled: boolean) => {
    state.setCoverEnabled(enabled);
    state.setHideAlter(enabled);
    state.setHideTetrade(enabled);
    state.setHideAlterSchema(enabled);
    state.setHideTetradeSchema(enabled);
    state.setMeasureCoversByView({
      0: Array(7).fill(enabled),
      1: Array(7).fill(enabled),
      2: Array(7).fill(enabled)
    });
  };

  const handleCircleSelect = (pc: number) => {
    const idx = KEYS.findIndex(k => ((k.pc % 12) + 12) % 12 === pc);
    if (idx >= 0) state.setKeyIndex(idx);
    if (state.coverEnabled) {
      state.setHideAlter(true);
      state.setHideTetrade(true);
      state.setHideAlterSchema(true);
      state.setHideTetradeSchema(true);
      state.setMeasureCoversByView({
        0: Array(7).fill(true),
        1: Array(7).fill(true),
        2: Array(7).fill(true)
      });
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-50 text-neutral-900 p-6 relative" style={{ fontFamily: '"Caveat", cursive', scrollBehavior: 'auto' }}>
      <NavigationControls
        navMode={state.navMode}
        coverEnabled={state.coverEnabled}
        currentView={state.view}
        onNavModeChange={state.setNavMode}
        onCoverEnabledChange={handleCoverEnabledChange}
        onGoRight={keyNavigation.goRight}
        onGoLeft={keyNavigation.goLeft}
        onViewNext={viewNavigation.viewNext}
        onViewPrev={viewNavigation.viewPrev}
      />

      <div ref={containerRef}>
        <HeaderInfo
          currentKeyPc={headerInfo.currentKey.pc}
          headerAccStr={headerInfo.headerAccStr}
          headerAccType={headerInfo.headerAccType}
          headerScaleSchemaPretty={headerInfo.headerScaleSchemaPretty}
          chordNamesINodesSmall={headerInfo.chordNamesINodesSmall}
          headerChordSchema={headerInfo.headerChordSchema}
          coverEnabled={state.coverEnabled}
          hideAlter={state.hideAlter}
          hideTetrade={state.hideTetrade}
          hideAlterSchema={state.hideAlterSchema}
          hideTetradeSchema={state.hideTetradeSchema}
          onToggleAlter={() => state.setHideAlter(false)}
          onToggleTetrade={() => state.setHideTetrade(false)}
          onToggleAlterSchema={() => state.setHideAlterSchema(false)}
          onToggleTetradeSchema={() => state.setHideTetradeSchema(false)}
        />

        <div className="rounded-2xl bg-white shadow p-4" style={{ minHeight: '500px' }}>
          <CircleOverlay
            pc={headerInfo.currentKey.pc}
            size={260}
            top={16}
            onSelect={handleCircleSelect}
          />

          <MusicalStaff
            keyIndex={state.keyIndex}
            view={state.view}
            containerWidth={containerWidth}
            coverEnabled={state.coverEnabled}
            measureCoversByView={state.measureCoversByView}
            onToggleMeasureCover={handleToggleMeasureCover}
          />
        </div>
      </div>
    </div>
  );
};

export default ScaleNavigator;