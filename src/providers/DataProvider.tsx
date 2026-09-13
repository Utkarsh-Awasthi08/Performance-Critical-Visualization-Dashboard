'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import type { DataPayload } from '@/lib/dataWorker';
import { useControlContext } from './ControlProvider';

export const ABSOLUTE_MAX_POINTS = 100000; // Pre-allocate maximum possible points to avoid GC

interface DataContextValue {
  dataBufferRef: React.RefObject<Float64Array | null>;
  bufferIndexRef: React.RefObject<number>;
  dataLengthRef: React.RefObject<number>;
  aggregates: { oneMinAvg: number; fiveMinAvg: number; oneHourAvg: number };
  maxPoints: number;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { isPaused, activeLoad } = useControlContext();
  const workerRef = useRef<Worker | null>(null);
  
  // Use a ref for activeLoad to avoid stale closures in the worker message handler
  const activeLoadRef = useRef(activeLoad);
  activeLoadRef.current = activeLoad;

  // Pre-allocate massive typed array once to guarantee no memory leaks even at extreme stress load
  const dataBufferRef = useRef<Float64Array | null>(null);
  if (dataBufferRef.current === null) {
    dataBufferRef.current = new Float64Array(ABSOLUTE_MAX_POINTS * 2);
  }
  
  const bufferIndexRef = useRef<number>(0);
  const dataLengthRef = useRef<number>(0);
  
  // Minimal state for aggregations (updates less frequently)
  const [aggregates, setAggregates] = useState({ oneMinAvg: 0, fiveMinAvg: 0, oneHourAvg: 0 });

  useEffect(() => {
    // Strict Mode Safety: Only initialize if it hasn't been initialized
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../lib/dataWorker', import.meta.url), {
        type: 'module'
      });

      workerRef.current.onmessage = (e: MessageEvent<DataPayload>) => {
        if (e.data.type === 'DATA_TICK') {
          const { points, aggregates: newAggregates } = e.data;
          const numNewPoints = points.length / 2;
          
          const buffer = dataBufferRef.current;
          const currentMaxPoints = activeLoadRef.current; 

          if (!buffer) return;
          
          let currentIndex = bufferIndexRef.current;
          
          // Append incoming points to our circular buffer natively
          for (let i = 0; i < points.length; i += 2) {
            const idx = (currentIndex * 2) % (currentMaxPoints * 2);
            buffer[idx] = points[i];       // X
            buffer[idx + 1] = points[i+1]; // Y
            currentIndex = (currentIndex + 1) % currentMaxPoints;
          }
          
          bufferIndexRef.current = currentIndex;
          dataLengthRef.current = Math.min(dataLengthRef.current + numNewPoints, currentMaxPoints);
          
          // Update sliding window aggregates
          setAggregates({
            oneMinAvg: newAggregates.oneMinAvg,
            fiveMinAvg: newAggregates.fiveMinAvg,
            oneHourAvg: newAggregates.oneHourAvg
          });
        }
      };
      
      // Start the worker on initialization
      workerRef.current.postMessage({ type: 'START' });
      workerRef.current.postMessage({ type: 'SET_LOAD', load: activeLoadRef.current });
    }

    return () => {
      // Ensure strict cleanup
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'STOP' });
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Listen for zoom changes
  useEffect(() => {
    const handleZoom = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'SET_ZOOM', zoomMs: customEvent.detail });
      }
    };
    
    window.addEventListener('ZOOM_CHANGED', handleZoom);
    return () => window.removeEventListener('ZOOM_CHANGED', handleZoom);
  }, []);

  // Sync control state to worker when it changes
  useEffect(() => {
    if (workerRef.current) {
      if (isPaused) {
        workerRef.current.postMessage({ type: 'PAUSE' });
      } else {
        workerRef.current.postMessage({ type: 'RESUME' });
      }
      workerRef.current.postMessage({ type: 'SET_LOAD', load: activeLoad });
    }
  }, [isPaused, activeLoad]);

  // Reset the ring buffer cursor whenever the stress-load size changes.
  // bufferIndexRef/dataLengthRef are wrapped modulo the CURRENT activeLoad, so
  // carrying over a cursor computed under the old modulus produces stale,
  // non-contiguous reads for consumers until it happens to realign.
  useEffect(() => {
    bufferIndexRef.current = 0;
    dataLengthRef.current = 0;
  }, [activeLoad]);

  const value = useMemo(() => ({
    dataBufferRef,
    bufferIndexRef,
    dataLengthRef,
    aggregates,
    maxPoints: activeLoad
  }), [aggregates, activeLoad]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
}
