import React from 'react';
import { useControlContext, LoadSize, ChartType } from '@/providers/ControlProvider';

export default function FilterPanel() {
  const { 
    isPaused, setIsPaused, 
    activeLoad, setActiveLoad, 
    viewMode, setViewMode, 
    visibleCharts, toggleChart,
    isPending
  } = useControlContext();

  return (
    <div className="glass-panel filter-panel" style={{ display: 'flex', gap: '2rem', padding: '0.75rem 1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      
      {/* Stream Controls */}
      <div className="control-group">
        <span className="metric-label">Data Stream</span>
        <button 
          className={`toggle-btn ${isPaused ? 'paused' : 'active'}`}
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>

      <div className="divider" />

      {/* Stress Test Load */}
      <div className="control-group">
        <span className="metric-label">Stress Load (Points)</span>
        <select 
          value={activeLoad} 
          onChange={(e) => setActiveLoad(Number(e.target.value) as LoadSize)}
          className="select-dropdown"
        >
          <option value={10000}>10k (Standard)</option>
          <option value={50000}>50k (High Load)</option>
          <option value={100000}>100k (Extreme Stress)</option>
        </select>
      </div>

      <div className="divider" />

      {/* View Mode */}
      <div className="control-group">
        <span className="metric-label">View Mode</span>
        <div className="segmented-control">
          <button 
            className={viewMode === 'grid' ? 'active' : ''} 
            onClick={() => setViewMode('grid')}
            disabled={isPending}
          >
            2x2 Grid
          </button>
          <button 
            className={viewMode === 'focused' ? 'active' : ''} 
            onClick={() => setViewMode('focused')}
            disabled={isPending}
          >
            Focused
          </button>
        </div>
      </div>

      <div className="divider" />

      {/* Chart Toggles */}
      <div className="control-group">
        <span className="metric-label">Active Visualizers</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['line', 'bar', 'scatter', 'heatmap'] as ChartType[]).map(chart => (
            <label key={chart} className="chart-toggle">
              <input 
                type="checkbox" 
                checked={visibleCharts[chart]} 
                onChange={() => toggleChart(chart)}
              />
              <span className="capitalize">{chart}</span>
            </label>
          ))}
        </div>
      </div>

      <style jsx>{`
        .filter-panel {
          margin-bottom: 1rem;
        }
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .divider {
          width: 1px;
          height: 32px;
          background: rgba(255,255,255,0.1);
        }
        .toggle-btn {
          padding: 0.25rem 1rem;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .toggle-btn.active {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border-color: #10b981;
        }
        .toggle-btn.paused {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          border-color: #f59e0b;
        }
        .select-dropdown {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(51, 65, 85, 0.8);
          color: #f8fafc;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          outline: none;
        }
        .segmented-control {
          display: flex;
          background: rgba(15, 23, 42, 0.8);
          border-radius: 4px;
          border: 1px solid rgba(51, 65, 85, 0.8);
          overflow: hidden;
        }
        .segmented-control button {
          padding: 0.25rem 0.75rem;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 0.875rem;
        }
        .segmented-control button.active {
          background: rgba(59, 130, 246, 0.3);
          color: #fff;
        }
        .segmented-control button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .chart-toggle {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: #cbd5e1;
          cursor: pointer;
        }
        .capitalize {
          text-transform: capitalize;
        }
      `}</style>
    </div>
  );
}
