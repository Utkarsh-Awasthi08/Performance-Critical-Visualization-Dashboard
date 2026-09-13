import { useEffect, useRef, useState } from 'react';
import type { DataPayload } from '@/lib/dataWorker';

export const MAX_POINTS = 20000; // Max points to keep in memory (20,000 x,y pairs)

export function useDataWorker() {
  const workerRef = useRef<Worker | null>(null);
  
  // Pre-allocate a large typed array for maximum performance and to guarantee no memory leaks
  // Format: [x0, y0, x1, y1, ...]
  const dataBufferRef = useRef<Float64Array>(new Float64Array(MAX_POINTS * 2));
  const bufferIndexRef = useRef<number>(0);
  const dataLengthRef = useRef<number>(0); // How many points are valid in the buffer
  
  // Minimal state just for aggregations (updates less frequently, safe for React)
  const [aggregates, setAggregates] = useState({ oneMinAvg: 0, fiveMinAvg: 0, oneHourAvg: 0 });

  useEffect(() => {
    // Initialize Web Worker using standard Next.js 14+ / Webpack syntax
    workerRef.current = new Worker(new URL('../lib/dataWorker', import.meta.url), {
      type: 'module'
    });

    workerRef.current.onmessage = (e: MessageEvent<DataPayload>) => {
      if (e.data.type === 'DATA_TICK') {
        const { points, aggregates: newAggregates } = e.data;
        const numNewPoints = points.length / 2;
        
        const buffer = dataBufferRef.current;
        let currentIndex = bufferIndexRef.current;
        
        // Append incoming points to our circular buffer
        for (let i = 0; i < points.length; i += 2) {
          const idx = (currentIndex * 2) % (MAX_POINTS * 2);
          buffer[idx] = points[i];       // X
          buffer[idx + 1] = points[i+1]; // Y
          currentIndex = (currentIndex + 1) % MAX_POINTS;
        }
        
        bufferIndexRef.current = currentIndex;
        dataLengthRef.current = Math.min(dataLengthRef.current + numNewPoints, MAX_POINTS);
        setAggregates(newAggregates);
      }
    };

    workerRef.current.postMessage({ type: 'START' });

    return () => {
      workerRef.current?.postMessage({ type: 'STOP' });
      workerRef.current?.terminate();
    };
  }, []);

  return { dataBufferRef, bufferIndexRef, dataLengthRef, aggregates, maxPoints: MAX_POINTS };
}
