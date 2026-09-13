import { useEffect, useRef } from 'react';

interface RendererProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  dataBufferRef: React.RefObject<Float64Array | null>;
  bufferIndexRef: React.RefObject<number>;
  dataLengthRef: React.RefObject<number>;
  maxPoints: number;
  zoomWindowRef: React.RefObject<number>;
}

export interface ChartMetrics {
  scaleX: number;
  scaleY: number;
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export function useChartRenderer({ 
  canvasRef, 
  dataBufferRef, 
  bufferIndexRef, 
  dataLengthRef,
  maxPoints,
  zoomWindowRef
}: RendererProps) {
  const rafRef = useRef<number>(0);
  const yBoundsRef = useRef({ minY: 0, maxY: 100 });
  const metricsRef = useRef<ChartMetrics>({ scaleX: 0, scaleY: 0, minX: 0, minY: 0, width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false }); 
    if (!ctx) return;

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

      let started = false;
      const scaleX = width / WINDOW_TIME_MS;
      
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

      // Save metrics for SVG overlay mapping
      metricsRef.current = {
        scaleX,
        scaleY,
        minX,
        minY: yBoundsRef.current.minY,
        width,
        height
      };

      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';

      for (let i = 0; i < length; i++) {
        const offset = ((currentIndex - length + i + maxPoints) % maxPoints) * 2;
        const x = buffer[offset];

        if (x >= minX) {
          const y = buffer[offset + 1];
          const px = (x - minX) * scaleX;
          const py = height - (y - yBoundsRef.current.minY) * scaleY;
          
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
      }

      ctx.stroke();
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [canvasRef, dataBufferRef, bufferIndexRef, dataLengthRef, maxPoints, zoomWindowRef]);

  return metricsRef;
}
