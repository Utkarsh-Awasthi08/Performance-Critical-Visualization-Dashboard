'use client';

import React, { useRef } from 'react';
import { useChartRenderer } from '@/hooks/useChartRenderer';
import { useDataContext } from '@/providers/DataProvider';
import { useControlContext } from '@/providers/ControlProvider';
import { useInteractiveCrosshair } from '@/hooks/useInteractiveCrosshair';
import CrosshairOverlay from './CrosshairOverlay';

export default function LineChart() {
  const { dataBufferRef, bufferIndexRef, dataLengthRef, maxPoints } = useDataContext();
  const { zoomWindowRef } = useControlContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  
  // Attach the high-performance requestAnimationFrame rendering loop
  const metricsRef = useChartRenderer({
    canvasRef,
    dataBufferRef,
    bufferIndexRef,
    dataLengthRef,
    maxPoints,
    zoomWindowRef
  });

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
        <h2 className="chart-title">Real-Time Volatility Index</h2>
        <div className="live-indicator">
          <div className="live-dot"></div>
          LIVE (60 FPS)
        </div>
      </div>
      
      <div 
        className="chart-wrapper" 
        style={{ position: 'relative', width: '100%', flex: 1, overflow: 'hidden', cursor: 'crosshair' }}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas 
          ref={canvasRef} 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
        />
        
        <CrosshairOverlay crosshair={crosshair} />
      </div>
    </div>
  );
}
