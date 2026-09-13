'use client';

import React, { useState } from 'react';
import { useDataContext } from '@/providers/DataProvider';
import { useControlContext, ChartType } from '@/providers/ControlProvider';
import LineChart from './charts/LineChart';
import BarChart from './charts/BarChart';
import ScatterPlot from './charts/ScatterPlot';
import Heatmap from './charts/Heatmap';
import PerformanceMonitor from './ui/PerformanceMonitor';
import DataTable from './ui/DataTable';
import TimeRangeSelector from './controls/TimeRangeSelector';
import FilterPanel from './controls/FilterPanel';

export default function Dashboard() {
  const { aggregates } = useDataContext();
  const { viewMode, visibleCharts, activeLoad } = useControlContext();
  
  const [focusedTab, setFocusedTab] = useState<ChartType>('line');

  const renderChart = (type: ChartType) => {
    switch(type) {
      case 'line': return <LineChart key="line" />;
      case 'bar': return <BarChart key="bar" />;
      case 'scatter': return <ScatterPlot key="scatter" />;
      case 'heatmap': return <Heatmap key="heatmap" />;
      default: return null;
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Quantum Analytics Dashboard</h1>
        <p className="dashboard-subtitle">
          Processing {activeLoad >= 1000 ? (activeLoad/1000).toFixed(0) + 'k' : activeLoad} points @ 100ms intervals
        </p>
      </header>
      
      {/* Control Ribbon */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <TimeRangeSelector />
        <FilterPanel />
      </div>
      
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <span className="metric-label">1-Min Aggregate</span>
          <span className="metric-value">{aggregates.oneMinAvg.toFixed(2)}</span>
        </div>
        <div className="glass-panel metric-card">
          <span className="metric-label">5-Min Aggregate</span>
          <span className="metric-value">{aggregates.fiveMinAvg.toFixed(2)}</span>
        </div>
        <div className="glass-panel metric-card">
          <span className="metric-label">1-Hour Aggregate</span>
          <span className="metric-value">{aggregates.oneHourAvg.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Main Chart Area */}
        <div style={{ flex: 3, minWidth: 0 }}>
          {viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: '350px', gap: '1rem' }}>
              {visibleCharts.line && <LineChart />}
              {visibleCharts.bar && <BarChart />}
              {visibleCharts.scatter && <ScatterPlot />}
              {visibleCharts.heatmap && <Heatmap />}
            </div>
          ) : (
            <div className="focused-view" style={{ display: 'flex', flexDirection: 'column', height: '716px' }}>
              <div className="tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {(['line', 'bar', 'scatter', 'heatmap'] as ChartType[]).filter(c => visibleCharts[c]).map(chart => (
                  <button 
                    key={chart}
                    onClick={() => setFocusedTab(chart)}
                    style={{
                      padding: '0.5rem 1.5rem',
                      background: focusedTab === chart ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                      border: `1px solid ${focusedTab === chart ? '#3b82f6' : 'rgba(51, 65, 85, 0.8)'}`,
                      color: focusedTab === chart ? '#60a5fa' : '#94a3b8',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {chart}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                {visibleCharts[focusedTab] ? renderChart(focusedTab) : (
                  <div className="glass-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    Select an active visualizer
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Data Table Area */}
        <div style={{ flex: 1, minWidth: '350px', height: '716px' }}>
          <DataTable />
        </div>
      </div>

      {/* Floating System Telemetry HUD */}
      <PerformanceMonitor />
    </div>
  );
}
