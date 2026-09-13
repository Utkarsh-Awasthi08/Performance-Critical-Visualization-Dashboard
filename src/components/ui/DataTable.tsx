'use client';

import React, { useState, useEffect } from 'react';
import { useDataContext } from '@/providers/DataProvider';
import { useVirtualization } from '@/hooks/useVirtualization';

const ROW_HEIGHT = 40;
const CONTAINER_HEIGHT = 400;

const DataRow = React.memo(({ i, time, val, ROW_HEIGHT }: { i: number, time: number, val: number, ROW_HEIGHT: number }) => (
  <div 
    style={{
      position: 'absolute',
      top: i * ROW_HEIGHT,
      left: 0,
      width: '100%',
      height: ROW_HEIGHT,
      display: 'flex',
      alignItems: 'center',
      padding: '0 1rem',
      borderBottom: '1px solid var(--surface-border)',
      backgroundColor: i % 2 === 0 ? 'rgba(30, 41, 59, 0.4)' : 'transparent',
      fontSize: '0.875rem'
    }}
  >
    <div style={{ flex: 1, color: 'var(--text-secondary)' }}>
      {new Date(time).toISOString().split('T')[1].replace('Z', '')}
    </div>
    <div style={{ flex: 1, fontWeight: 600, color: val > 65 ? 'var(--success-color)' : (val < 55 ? '#ef4444' : 'var(--text-primary)'), textAlign: 'right' }}>
      {val.toFixed(4)}
    </div>
  </div>
));

export default function DataTable() {
  const { dataBufferRef, bufferIndexRef, dataLengthRef, maxPoints } = useDataContext();
  
  const [frozenState, setFrozenState] = useState<{ length: number; currentIndex: number } | null>(null);

  const length = dataLengthRef.current;
  // If frozen, use the frozen length so the scrollbar doesn't jump
  const effectiveLength = frozenState ? frozenState.length : length;

  const { containerRef, startIndex, endIndex, totalHeight, scrollTop, scrollToTop } = useVirtualization({
    totalItems: effectiveLength,
    itemHeight: ROW_HEIGHT,
    containerHeight: CONTAINER_HEIGHT,
    overscan: 5
  });

  const isLive = scrollTop === 0;

  // Handle Hybrid Scroll-to-Pause logic
  useEffect(() => {
    if (scrollTop > 0 && !frozenState) {
      // User scrolled away from the top, freeze the view snapshot
      setFrozenState({
        length: dataLengthRef.current,
        currentIndex: bufferIndexRef.current
      });
    } else if (scrollTop === 0 && frozenState) {
      // User went back to top, resume live mode
      setFrozenState(null);
    }
  }, [scrollTop, frozenState, dataLengthRef, bufferIndexRef]);

  const handleJumpToLatest = () => {
    scrollToTop();
    setFrozenState(null);
  };

  // Generate the visible rows
  const visibleRows = [];
  const buffer = dataBufferRef.current;
  const currIndex = frozenState ? frozenState.currentIndex : bufferIndexRef.current;
  const currLen = effectiveLength;

  if (buffer) {
    for (let i = startIndex; i <= endIndex; i++) {
      // Newest points are at logical index 0 (top of table)
      // Oldest points are at logical index currLen - 1 (bottom of table)
      const logicalOffset = currLen - 1 - i;
      
      if (logicalOffset >= 0 && logicalOffset < currLen) {
        const physicalOffset = ((currIndex - currLen + logicalOffset + maxPoints) % maxPoints) * 2;
        const time = buffer[physicalOffset];
        const val = buffer[physicalOffset + 1];
        
        visibleRows.push(
          <DataRow key={i} i={i} time={time} val={val} ROW_HEIGHT={ROW_HEIGHT} />
        );
      }
    }
  }

  return (
    <div className="glass-panel" style={{ position: 'relative', height: CONTAINER_HEIGHT, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Raw Data Stream</h3>
        {isLive ? (
          <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="live-dot" /> Auto-Scrolling
          </span>
        ) : (
          <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Paused</span>
        )}
      </div>

      <div 
        ref={containerRef}
        style={{ flex: 1, overflowY: 'auto', position: 'relative' }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleRows}
        </div>
      </div>

      {!isLive && (
        <button
          onClick={handleJumpToLatest}
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--accent-color)',
            color: '#fff',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            zIndex: 10
          }}
        >
          ↓ Jump to Latest (Live)
        </button>
      )}
    </div>
  );
}
