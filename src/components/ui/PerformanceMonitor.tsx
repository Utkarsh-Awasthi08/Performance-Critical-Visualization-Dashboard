'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDataContext } from '@/providers/DataProvider';

export default function PerformanceMonitor() {
  const { dataLengthRef } = useDataContext();
  
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState<number | null>(null);
  const [points, setPoints] = useState(0);
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    // Start timing
    lastTimeRef.current = performance.now();
    
    const measure = () => {
      frameCountRef.current++;
      const now = performance.now();
      
      // Update stats once per second
      if (now - lastTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
        
        // Read directly from the highly-optimized buffer ref
        setPoints(dataLengthRef.current);
        
        // Try reading memory using the non-standard performance.memory API available in Chromium
        // @ts-ignore - performance.memory is not in standard lib dom
        const mem = performance.memory;
        if (mem && mem.usedJSHeapSize) {
          setMemory(Math.round(mem.usedJSHeapSize / (1024 * 1024)));
        }
      }
      rafRef.current = requestAnimationFrame(measure);
    };
    
    rafRef.current = requestAnimationFrame(measure);
    
    return () => cancelAnimationFrame(rafRef.current);
  }, [dataLengthRef]);

  return (
    <div className="glass-panel telemetry-hud">
      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--surface-border)' }}>
        System Telemetry
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-secondary)' }}>FPS Target 60</span>
        <span style={{ 
          fontWeight: 600, 
          fontSize: '1.25rem',
          color: fps >= 55 ? 'var(--success-color)' : (fps >= 30 ? '#fbbf24' : '#ef4444') 
        }}>
          {fps}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Heap Memory</span>
        <span style={{ fontWeight: 600 }}>{memory ? `${memory} MB` : 'N/A'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Active Points</span>
        <span style={{ fontWeight: 600 }}>{points.toLocaleString()}</span>
      </div>
    </div>
  );
}
