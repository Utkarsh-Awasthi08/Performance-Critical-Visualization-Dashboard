import React from 'react';
import { CrosshairState } from '@/hooks/useInteractiveCrosshair';

interface CrosshairOverlayProps {
  crosshair: CrosshairState | null;
}

export default function CrosshairOverlay({ crosshair }: CrosshairOverlayProps) {
  return (
    <svg 
      className="chart-svg-overlay" 
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}
    >
      {crosshair && (
        <>
          {/* Vertical Crosshair Line */}
          <line 
            x1={crosshair.x} y1="0" 
            x2={crosshair.x} y2="100%" 
            stroke="rgba(255,255,255,0.2)" strokeDasharray="4,4" 
          />
          {/* Horizontal Crosshair Line */}
          <line 
            x1="0" y1={crosshair.y} 
            x2="100%" y2={crosshair.y} 
            stroke="rgba(255,255,255,0.2)" strokeDasharray="4,4" 
          />
          {/* Snap Dot */}
          <circle cx={crosshair.x} cy={crosshair.y} r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
          
          {/* Tooltip */}
          <g transform={`translate(${crosshair.x < 200 ? crosshair.x + 10 : crosshair.x - 130}, ${crosshair.y < 50 ? crosshair.y + 20 : crosshair.y - 45})`}>
            <rect width="120" height="40" rx="4" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(51, 65, 85, 0.8)" />
            <text x="10" y="16" fill="#f8fafc" fontSize="12" fontWeight="bold">
              Val: {crosshair.val.toFixed(2)}
            </text>
            <text x="10" y="32" fill="#94a3b8" fontSize="10">
              {new Date(crosshair.time).toISOString().split('T')[1].slice(0, -1)}
            </text>
          </g>
        </>
      )}
    </svg>
  );
}
