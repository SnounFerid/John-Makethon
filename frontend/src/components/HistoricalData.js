import React, { useContext, useState, useEffect } from 'react';
import { DetectionContext } from '../context/DetectionContext';
import { WebSocketContext } from '../context/WebSocketContext';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FiCalendar, FiDownload, FiZap } from 'react-icons/fi';
import '../styles/HistoricalData.css';

const HistoricalData = () => {
  const {
    filteredData,
    loading,
    fetchHistoricalData,
    filterDataByTimeRange,
  } = useContext(DetectionContext);

  const {
    latestSensorData,
    isConnected,
    dataFreshness,
    getFormattedFreshness,
  } = useContext(WebSocketContext);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    console.log('[HISTORICAL DATA] Component mounted, fetching initial data');
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  const handleDateFilter = () => {
    console.log('[HISTORICAL DATA] Applying date filter', { startDate, endDate });
    const start = new Date(startDate);
    const end = new Date(endDate);
    filterDataByTimeRange(start, end);
  };

  const handleExport = () => {
    console.log('[HISTORICAL DATA] Exporting data', { count: filteredData.length });
    const csv = [
      ['Timestamp', 'Pressure (PSI)', 'Flow (GPM)', 'Temperature (°C)', 'Conductivity'],
      ...filteredData.map((item) => [
        item.timestamp || new Date().toISOString(),
        item.pressure || 0,
        item.flow || 0,
        item.temperature || 0,
        item.conductivity || 0,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensor-data-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="historical-loading">Loading historical data...</div>;
  }

  // Prepare chart data
  const chartData = filteredData.slice(-100).map((item, idx) => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    pressure: parseFloat(item.pressure) || 0,
    flow: parseFloat(item.flow) || 0,
    temperature: parseFloat(item.temperature) || 0,
    index: idx,
  }));

  return (
    <div className="historical-container">
      <div className="historical-header">
        <h1>Historical Data Visualization</h1>
        <p>View and analyze historical sensor readings over time</p>
      </div>

      {/* Real-time Metrics from WebSocket */}
      {isConnected && latestSensorData && (
        <div className="realtime-metrics-section">
          <div className="realtime-header">
            <FiZap className="realtime-icon" />
            <span>Current Real-time Reading</span>
            <span className="freshness-badge">{getFormattedFreshness()}</span>
          </div>
          <div className="realtime-grid">
            <div className="metric-box">
              <span className="metric-label">Pressure (PSI)</span>
              <span className="metric-value">{parseFloat(latestSensorData.pressure).toFixed(2)}</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Flow (GPM)</span>
              <span className="metric-value">{parseFloat(latestSensorData.flow).toFixed(2)}</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Temperature (°C)</span>
              <span className="metric-value">{parseFloat(latestSensorData.temperature).toFixed(1)}</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Conductivity</span>
              <span className="metric-value">{parseFloat(latestSensorData.conductivity).toFixed(3)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Time Range Selector */}
      <div className="filter-section">
        <div className="filter-group">
          <label>
            <FiCalendar className="filter-icon" />
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              console.log('[HISTORICAL DATA] Start date changed to', e.target.value);
              setStartDate(e.target.value);
            }}
          />
        </div>

        <div className="filter-group">
          <label>
            <FiCalendar className="filter-icon" />
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              console.log('[HISTORICAL DATA] End date changed to', e.target.value);
              setEndDate(e.target.value);
            }}
          />
        </div>

        <button className="btn-primary" onClick={handleDateFilter}>
          Apply Filter
        </button>

        <button className="btn-secondary" onClick={handleExport}>
          <FiDownload /> Export CSV
        </button>
      </div>

      {/* Data Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Records</p>
          <p className="stat-value">{filteredData.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg Pressure (PSI)</p>
          <p className="stat-value">
            {(
              filteredData.reduce((sum, item) => sum + (parseFloat(item.pressure) || 0), 0) /
              filteredData.length || 0
            ).toFixed(2)}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg Flow (GPM)</p>
          <p className="stat-value">
            {(
              filteredData.reduce((sum, item) => sum + (parseFloat(item.flow) || 0), 0) /
              filteredData.length || 0
            ).toFixed(2)}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg Temperature (°C)</p>
          <p className="stat-value">
            {(
              filteredData.reduce((sum, item) => sum + (parseFloat(item.temperature) || 0), 0) /
              filteredData.length || 0
            ).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Pressure Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="pressure"
                stroke="#3b82f6"
                dot={false}
                name="Pressure (PSI)"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Flow Rate Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="flow"
                stroke="#10b981"
                dot={false}
                name="Flow (GPM)"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Temperature Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#f97316"
                dot={false}
                name="Temperature (°C)"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>All Metrics Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="pressure"
                stroke="#3b82f6"
                dot={false}
                name="Pressure (PSI)"
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="flow"
                stroke="#10b981"
                dot={false}
                name="Flow (GPM)"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      {filteredData.length > 0 && (
        <div className="data-table-section">
          <h3>Recent Readings</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Pressure (PSI)</th>
                  <th>Flow (GPM)</th>
                  <th>Temperature (°C)</th>
                  <th>Conductivity</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(-20).reverse().map((item, idx) => (
                  <tr key={idx}>
                    <td>{new Date(item.timestamp).toLocaleString()}</td>
                    <td>{parseFloat(item.pressure).toFixed(2)}</td>
                    <td>{parseFloat(item.flow).toFixed(2)}</td>
                    <td>{parseFloat(item.temperature).toFixed(2)}</td>
                    <td>{parseFloat(item.conductivity).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalData;
