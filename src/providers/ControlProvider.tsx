'use client';

import React, { createContext, useContext, useState, useRef, useTransition, useMemo } from 'react';

export type LoadSize = 10000 | 50000 | 100000;
export type ViewMode = 'grid' | 'focused';
export type ChartType = 'line' | 'bar' | 'scatter' | 'heatmap';

interface ControlContextValue {
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  activeLoad: LoadSize;
  setActiveLoad: (load: LoadSize) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  visibleCharts: Record<ChartType, boolean>;
  toggleChart: (chart: ChartType) => void;
  zoomWindowRef: React.RefObject<number>;
  isPending: boolean; // For transitions like switching grid/focused
}

const ControlContext = createContext<ControlContextValue | null>(null);

export function ControlProvider({ children }: { children: React.ReactNode }) {
  const [isPaused, setIsPaused] = useState(false);
  const [activeLoad, setActiveLoad] = useState<LoadSize>(10000); // Start at standard
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isPending, startTransition] = useTransition();
  const [visibleCharts, setVisibleCharts] = useState<Record<ChartType, boolean>>({
    line: true,
    bar: true,
    scatter: true,
    heatmap: true,
  });

  const zoomWindowRef = useRef<number>(15000); // Default 15s

  const toggleChart = (chart: ChartType) => {
    setVisibleCharts(prev => ({ ...prev, [chart]: !prev[chart] }));
  };

  const handleSetViewMode = (mode: ViewMode) => {
    startTransition(() => {
      setViewMode(mode);
    });
  };

  const handleSetActiveLoad = (load: LoadSize) => {
    startTransition(() => {
      setActiveLoad(load);
    });
  };

  const value = useMemo(() => ({
    isPaused,
    setIsPaused,
    activeLoad,
    setActiveLoad: handleSetActiveLoad,
    viewMode,
    setViewMode: handleSetViewMode,
    visibleCharts,
    toggleChart,
    zoomWindowRef,
    isPending
  }), [isPaused, activeLoad, viewMode, visibleCharts, isPending]);

  return <ControlContext.Provider value={value}>{children}</ControlContext.Provider>;
}

export function useControlContext() {
  const context = useContext(ControlContext);
  if (!context) {
    throw new Error('useControlContext must be used within a ControlProvider');
  }
  return context;
}
