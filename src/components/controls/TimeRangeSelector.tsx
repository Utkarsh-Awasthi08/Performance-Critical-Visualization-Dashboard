import React from 'react';
import { useControlContext } from '@/providers/ControlProvider';

export default function TimeRangeSelector() {
  const { zoomWindowRef } = useControlContext();

  const setZoom = (ms: number) => {
    if (zoomWindowRef) {
      zoomWindowRef.current = ms;
      window.dispatchEvent(new CustomEvent('ZOOM_CHANGED', { detail: ms }));
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem', alignItems: 'center' }}>
      <span className="metric-label" style={{ marginRight: '1rem' }}>Time Range</span>
      <button 
        className="control-btn"
        onClick={() => setZoom(10000)}
        title="10 Seconds"
      >
        10s
      </button>
      <button 
        className="control-btn"
        onClick={() => setZoom(60000)}
        title="1 Minute"
      >
        1m
      </button>
      <button 
        className="control-btn"
        onClick={() => setZoom(300000)}
        title="5 Minutes"
      >
        5m
      </button>
      <button 
        className="control-btn"
        onClick={() => setZoom(1500000)}
        title="Max History (25m)"
      >
        Max
      </button>
      
      <style jsx>{`
        .control-btn {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(51, 65, 85, 0.8);
          color: #e2e8f0;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .control-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
}
