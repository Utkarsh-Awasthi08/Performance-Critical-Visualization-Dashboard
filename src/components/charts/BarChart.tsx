'use client';

import React, { useRef, useEffect } from 'react';
import { useDataContext } from '@/providers/DataProvider';
import { useControlContext } from '@/providers/ControlProvider';
import { ChartMetrics } from '@/hooks/useChartRenderer';
import { useInteractiveCrosshair } from '@/hooks/useInteractiveCrosshair';
import CrosshairOverlay from './CrosshairOverlay';

export default function BarChart() {
  const { dataBufferRef, bufferIndexRef, dataLengthRef, maxPoints } = useDataContext();
  const { zoomWindowRef } = useControlContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const yBoundsRef = useRef({ minY: 0, maxY: 100 });
  const metricsRef = useRef<ChartMetrics>({ scaleX: 0, scaleY: 0, minX: 0, minY: 0, width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false }); 
    if (!ctx) return;

    // Array to hold bucketed sums and counts
    // 2000 is enough for a 4k monitor if bars are 2px wide
    const numBuckets = 1000;
    const bucketMax = new Float64Array(numBuckets);
    
    const render = () => {
      if (!dataBufferRef.current || dataLengthRef.current === 0) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }
      
      const width = rect.width;
      const height = rect.height;
      const buffer = dataBufferRef.current;
      const length = dataLengthRef.current;
      const currentIndex = bufferIndexRef.current;

      ctx.fillStyle = '#0f172a'; 
      ctx.fillRect(0, 0, width, height);

      const WINDOW_TIME_MS = zoomWindowRef.current; 
      
      const latestIdx = ((currentIndex - 1 + maxPoints) % maxPoints) * 2;
      const latestX = buffer[latestIdx];
      const minX = latestX - WINDOW_TIME_MS;

      let currentMinY = Number.MAX_VALUE;
      let currentMaxY = Number.MIN_VALUE;

      const scaleX = width / WINDOW_TIME_MS;
      
      const barWidth = 4;
      const actualBuckets = Math.ceil(width / barWidth);

      // Clear buckets
      for (let i = 0; i < actualBuckets; i++) {
        bucketMax[i] = -Infinity;
      }

      // Group points into buckets
      for (let i = 0; i < length; i++) {
        const offset = ((currentIndex - length + i + maxPoints) % maxPoints) * 2;
        const x = buffer[offset];
        if (x >= minX) {
          const y = buffer[offset + 1];
          if (y < currentMinY) currentMinY = y;
          if (y > currentMaxY) currentMaxY = y;

          const px = (x - minX) * scaleX;
          const bIdx = Math.floor(px / barWidth);
          if (bIdx >= 0 && bIdx < actualBuckets) {
            if (y > bucketMax[bIdx]) {
               bucketMax[bIdx] = y;
            }
          }
        }
      }

      if (currentMinY === Number.MAX_VALUE) currentMinY = 0;
      if (currentMaxY === Number.MIN_VALUE) currentMaxY = 100;

      const padding = (currentMaxY - currentMinY) * 0.1 || 10;
      const targetMinY = currentMinY - padding;
      const targetMaxY = currentMaxY + padding;

      yBoundsRef.current.minY += (targetMinY - yBoundsRef.current.minY) * 0.1;
      yBoundsRef.current.maxY += (targetMaxY - yBoundsRef.current.maxY) * 0.1;

      const scaleY = height / (yBoundsRef.current.maxY - yBoundsRef.current.minY);

      metricsRef.current = {
        scaleX,
        scaleY,
        minX,
        minY: yBoundsRef.current.minY,
        width,
        height
      };

      ctx.fillStyle = '#10b981'; // emerald-500

      // Draw bars
      for (let i = 0; i < actualBuckets; i++) {
        const y = bucketMax[i];
        if (y !== -Infinity) {
          const barHeight = (y - yBoundsRef.current.minY) * scaleY;
          const py = height - barHeight;
          const px = i * barWidth;
          // Leave 1px gap between bars
          ctx.fillRect(px, py, barWidth - 1, barHeight);
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dataBufferRef, bufferIndexRef, dataLengthRef, maxPoints]);

  const { crosshair, handleMouseMove, handleMouseLeave, handleWheel } = useInteractiveCrosshair({
    dataBufferRef,
    bufferIndexRef,
    dataLengthRef,
    maxPoints,
    metricsRef,
    zoomWindowRef
  });

  return (
    <div className="glass-panel chart-container">
      <div className="chart-header">
        <h2 className="chart-title">Volatility Histogram (Bar)</h2>
      </div>
      <div 
        className="chart-wrapper" 
        style={{ position: 'relative', width: '100%', flex: 1, overflow: 'hidden', cursor: 'crosshair' }}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} />
        <CrosshairOverlay crosshair={crosshair} />
      </div>
    </div>
  );
}
