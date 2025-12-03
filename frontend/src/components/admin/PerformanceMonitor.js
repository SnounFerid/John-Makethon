import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FiRefreshCw } from 'react-icons/fi';
import '../../styles/admin/PerformanceMonitor.css';

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    responseTime: [],
    inferenceTime: [],
    cpuUsage: [],
    memoryUsage: [],
    requestsPerSecond: [],
  });
  const [currentStats, setCurrentStats] = useState({
    avgResponseTime: 0,
    avgInferenceTime: 0,
    maxResponseTime: 0,
    minResponseTime: 0,
    totalRequests: 0,
    errorRate: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    console.log('[PERFORMANCE MONITOR] Component mounted');
    fetchPerformanceMetrics();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchPerformanceMetrics();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchPerformanceMetrics = async () => {
    try {
      console.log('[PERFORMANCE MONITOR] Fetching performance metrics');
      setIsRefreshing(true);

      const response = await fetch('/api/admin/performance-metrics');
      const data = await response.json();

      console.log('[PERFORMANCE MONITOR] Metrics received:', data);

      setMetrics(data.metrics);
      setCurrentStats(data.stats);
    } catch (err) {
      console.error('[PERFORMANCE MONITOR] Error fetching metrics:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const StatCard = ({ label, value, unit = '', color = 'default' }) => (
    <div className={`stat-card ${color}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">
        {typeof value === 'number' ? value.toFixed(2) : value}
        {unit && <span className="stat-unit">{unit}</span>}
      </p>
    </div>
  );

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h3>Performance Monitoring Dashboard</h3>
        <button
          className="refresh-btn"
          onClick={fetchPerformanceMetrics}
          disabled={isRefreshing}
        >
          <FiRefreshCw size={18} className={isRefreshing ? 'spinning' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <p className="section-description">
        Monitor API response times, model inference speed, and system resource usage.
      </p>

      {/* Current Statistics */}
      <div className="stats-section">
        <h4>Current Statistics</h4>
        <div className="stats-grid">
          <StatCard
            label="Avg Response Time"
            value={currentStats.avgResponseTime}
            unit="ms"
            color={currentStats.avgResponseTime < 100 ? 'good' : 'warning'}
          />
          <StatCard
            label="Avg Inference Time"
            value={currentStats.avgInferenceTime}
            unit="ms"
            color={currentStats.avgInferenceTime < 50 ? 'good' : 'warning'}
          />
          <StatCard
            label="Max Response Time"
            value={currentStats.maxResponseTime}
            unit="ms"
          />
          <StatCard
            label="Min Response Time"
            value={currentStats.minResponseTime}
            unit="ms"
          />
          <StatCard
            label="Total API Requests"
            value={currentStats.totalRequests}
            color="info"
          />
          <StatCard
            label="Error Rate"
            value={currentStats.errorRate}
            unit="%"
            color={currentStats.errorRate < 1 ? 'good' : 'danger'}
          />
        </div>
      </div>

      {/* Response Time Chart */}
      {metrics.responseTime && metrics.responseTime.length > 0 && (
        <div className="chart-section">
          <h4>API Response Time Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.responseTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#3b82f6"
                name="Average"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="max"
                stroke="#ef4444"
                name="Maximum"
                strokeWidth={1}
              />
              <Line
                type="monotone"
                dataKey="min"
                stroke="#10b981"
                name="Minimum"
                strokeWidth={1}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Inference Time Chart */}
      {metrics.inferenceTime && metrics.inferenceTime.length > 0 && (
        <div className="chart-section">
          <h4>Model Inference Speed</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.inferenceTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: 'Inference Time (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="time" fill="#8b5cf6" name="Inference Time" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Resource Usage */}
      {metrics.cpuUsage && metrics.cpuUsage.length > 0 && (
        <div className="resource-section">
          <h4>System Resource Usage</h4>
          <div className="resource-charts">
            <div className="resource-chart">
              <h5>CPU Usage</h5>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={metrics.cpuUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis
                    domain={[0, 100]}
                    label={{ value: 'CPU (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="usage"
                    stroke="#f97316"
                    name="CPU Usage"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="resource-chart">
              <h5>Memory Usage</h5>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={metrics.memoryUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis
                    domain={[0, 100]}
                    label={{ value: 'Memory (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="usage"
                    stroke="#3b82f6"
                    name="Memory Usage"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Requests Per Second */}
      {metrics.requestsPerSecond && metrics.requestsPerSecond.length > 0 && (
        <div className="chart-section">
          <h4>Requests Per Second</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.requestsPerSecond}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: 'Requests/s', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" name="Requests" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Performance Recommendations */}
      <div className="recommendations-section">
        <h4>Performance Recommendations</h4>
        <div className="recommendations">
          {currentStats.avgResponseTime > 100 && (
            <div className="recommendation warning">
              <p>⚠️ High API response time detected. Consider optimizing database queries.</p>
            </div>
          )}
          {currentStats.avgInferenceTime > 50 && (
            <div className="recommendation warning">
              <p>⚠️ Model inference is slow. Consider model optimization or hardware upgrade.</p>
            </div>
          )}
          {currentStats.errorRate > 1 && (
            <div className="recommendation danger">
              <p>🚨 High error rate detected. Review error logs immediately.</p>
            </div>
          )}
          {currentStats.avgResponseTime <= 50 &&
            currentStats.avgInferenceTime <= 30 &&
            currentStats.errorRate < 0.5 && (
              <div className="recommendation success">
                <p>✓ System performance is excellent. All metrics within optimal range.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
