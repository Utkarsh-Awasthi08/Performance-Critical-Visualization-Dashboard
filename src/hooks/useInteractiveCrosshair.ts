import { useState, useCallback, RefObject } from 'react';
import { ChartMetrics } from '@/hooks/useChartRenderer';

export interface CrosshairState {
  x: number;
  y: number;
  val: number;
  time: number;
}

interface UseInteractiveCrosshairProps {
  dataBufferRef: RefObject<Float64Array | null>;
  bufferIndexRef: RefObject<number>;
  dataLengthRef: RefObject<number>;
  maxPoints: number;
  metricsRef: RefObject<ChartMetrics>;
  zoomWindowRef?: RefObject<number>; // Optional: some charts might not support zooming
}

export function useInteractiveCrosshair({
  dataBufferRef,
  bufferIndexRef,
  dataLengthRef,
  maxPoints,
  metricsRef,
  zoomWindowRef
}: UseInteractiveCrosshairProps) {
  const [crosshair, setCrosshair] = useState<CrosshairState | null>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!zoomWindowRef) return;
    // Zoom in/out by modifying the window time (Bounded 1s to 20s)
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const newZoom = Math.max(1000, Math.min(20000, zoomWindowRef.current * zoomFactor));
    zoomWindowRef.current = newZoom;
    window.dispatchEvent(new CustomEvent('ZOOM_CHANGED', { detail: newZoom }));
  }, [zoomWindowRef]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const metrics = metricsRef.current;
    if (!metrics || metrics.scaleX === 0 || dataLengthRef.current === 0) return;
    
    // 1. Map mouse pixel X to target timestamp
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const targetTime = (mouseX / metrics.scaleX) + metrics.minX;
    
    // 2. Binary search for the closest point in the circular buffer
    const buffer = dataBufferRef.current!;
    const length = dataLengthRef.current;
    const currentIndex = bufferIndexRef.current;
    
    let low = 0;
    let high = length - 1;
    let closestIndex = 0;
    
    const getPointX = (logicalIndex: number) => {
      const offset = ((currentIndex - length + logicalIndex + maxPoints) % maxPoints) * 2;
      return buffer[offset];
    };
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midTime = getPointX(mid);
      
      if (midTime === targetTime) {
        closestIndex = mid;
        break;
      } else if (midTime < targetTime) {
        closestIndex = mid; // keep track of closest
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    // Check neighbors to find exact bounding points for interpolation
    let leftIndex = closestIndex;
    if (getPointX(closestIndex) > targetTime && closestIndex > 0) {
      leftIndex = closestIndex - 1;
    } else if (getPointX(closestIndex) < targetTime && closestIndex < length - 1) {
      if (getPointX(closestIndex + 1) <= targetTime) {
         leftIndex = closestIndex + 1;
      }
    }
    const rightIndex = Math.min(length - 1, leftIndex + 1);

    const getPointY = (logicalIndex: number) => {
      const offset = ((currentIndex - length + logicalIndex + maxPoints) % maxPoints) * 2;
      return buffer[offset + 1];
    };

    const t0 = getPointX(leftIndex);
    const v0 = getPointY(leftIndex);
    const t1 = getPointX(rightIndex);
    const v1 = getPointY(rightIndex);

    let exactVal = v0;
    if (t1 > t0 && targetTime >= t0 && targetTime <= t1) {
      const ratio = (targetTime - t0) / (t1 - t0);
      exactVal = v0 + (v1 - v0) * ratio;
    }

    // 3. Map back to exact pixel coordinates using targetTime (perfectly stable)
    if (targetTime >= metrics.minX) {
      const px = (targetTime - metrics.minX) * metrics.scaleX;
      const py = metrics.height - (exactVal - metrics.minY) * metrics.scaleY;
      
      setCrosshair({ x: px, y: py, val: exactVal, time: targetTime });
    } else {
      setCrosshair(null);
    }
  }, [dataBufferRef, bufferIndexRef, dataLengthRef, maxPoints, metricsRef]);

  const handleMouseLeave = () => setCrosshair(null);

  return {
    crosshair,
    handleMouseMove,
    handleMouseLeave,
    handleWheel
  };
}
