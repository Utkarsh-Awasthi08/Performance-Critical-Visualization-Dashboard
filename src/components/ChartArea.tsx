'use client';

import React, { useRef } from 'react';
import { useChartRenderer } from '@/hooks/useChartRenderer';

interface ChartAreaProps {
  dataBufferRef: React.RefObject<Float64Array | null>;
  bufferIndexRef: React.RefObject<number>;
  dataLengthRef: React.RefObject<number>;
  maxPoints: number;
}

export default function ChartArea({
  dataBufferRef,
  bufferIndexRef,
  dataLengthRef,
  maxPoints
}: ChartAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomWindowRef = useRef<number>(15000);
  
  // Initialize the high-performance requestAnimationFrame loop
  useChartRenderer({
    canvasRef,
    dataBufferRef,
    bufferIndexRef,
    dataLengthRef,
    maxPoints,
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
      
      <div className="chart-wrapper">
        <canvas 
          ref={canvasRef} 
          className="chart-canvas"
          // Let the browser handle resize optimally, we update bounds in hook
        />
        
        {/* SVG Overlay for static/infrequent updates like axes, legends, or crosshairs */}
        <svg className="chart-svg-overlay" preserveAspectRatio="none">
          {/* Example static grid lines or safe zones could go here */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.1)" strokeDasharray="5,5" />
        </svg>
      </div>
    </div>
  );
}
