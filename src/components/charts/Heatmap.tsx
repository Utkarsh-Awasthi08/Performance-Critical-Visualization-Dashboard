'use client';

import React, { useRef, useEffect } from 'react';
import { useDataContext } from '@/providers/DataProvider';
import { useControlContext } from '@/providers/ControlProvider';
import { ChartMetrics } from '@/hooks/useChartRenderer';
import { useInteractiveCrosshair } from '@/hooks/useInteractiveCrosshair';
import CrosshairOverlay from './CrosshairOverlay';

export default function Heatmap() {
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

    // Allocate a reusable grid buffer for heatmap cells to avoid GC
    const MAX_COLS = 200;
    const MAX_ROWS = 200;
    const grid = new Int32Array(MAX_COLS * MAX_ROWS);

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
      
      const CELL_SIZE = 10; // 10x10 pixel cells
      const cols = Math.min(MAX_COLS, Math.ceil(width / CELL_SIZE));
      const rows = Math.min(MAX_ROWS, Math.ceil(height / CELL_SIZE));

      // Reset grid
      grid.fill(0);

      // Pass 1: Find bounds
      for (let i = 0; i < length; i++) {
        const offset = ((currentIndex - length + i + maxPoints) % maxPoints) * 2;
        const x = buffer[offset];
        if (x >= minX) {
          const y = buffer[offset + 1];
          if (y < currentMinY) currentMinY = y;
          if (y > currentMaxY) currentMaxY = y;
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

      // Pass 2: Calculate density
      let maxDensity = 0;
      for (let i = 0; i < length; i++) {
        const offset = ((currentIndex - length + i + maxPoints) % maxPoints) * 2;
        const x = buffer[offset];
        if (x >= minX) {
          const y = buffer[offset + 1];
          const px = (x - minX) * scaleX;
          const py = height - (y - yBoundsRef.current.minY) * scaleY;
          
          const cx = Math.floor(px / CELL_SIZE);
          const cy = Math.floor(py / CELL_SIZE);
          
          if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
            const idx = cy * cols + cx;
            grid[idx]++;
            if (grid[idx] > maxDensity) maxDensity = grid[idx];
          }
        }
      }

      // Pass 3: Draw heatmap cells
      if (maxDensity > 0) {
        for (let cy = 0; cy < rows; cy++) {
          for (let cx = 0; cx < cols; cx++) {
            const density = grid[cy * cols + cx];
            if (density > 0) {
              const ratio = density / maxDensity;
              // Hue: 240 (Blue) -> 0 (Red)
              const hue = Math.floor(240 - (240 * ratio));
              // Alpha curve for better glow
              const alpha = 0.2 + (0.8 * ratio);
              ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
              ctx.fillRect(cx * CELL_SIZE, cy * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
            }
          }
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
        <h2 className="chart-title">Density Matrix (Heatmap)</h2>
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
