import React, { useContext, useEffect, useState } from 'react';
import { DetectionContext } from '../context/DetectionContext';
import { WebSocketContext } from '../context/WebSocketContext';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { FiTrendingUp, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const {
    currentReading,
    detectionStatus,
    recentAlerts,
    loading,
    fetchDetectionStatus,
    fetchRecentAlerts,
    processSensorReading,
  } = useContext(DetectionContext);

  const {
    isConnected,
    latestSensorData,
    latestAlert,
  } = useContext(WebSocketContext);

  const [displayReading, setDisplayReading] = useState(null);

  useEffect(() => {
    console.log('[DASHBOARD] Component mounted');
    fetchDetectionStatus();
    fetchRecentAlerts(5);
  }, [fetchDetectionStatus, fetchRecentAlerts]);

  // Use WebSocket data when available, otherwise fall back to API data
  useEffect(() => {
    if (isConnected && latestSensorData) {
      console.log('[DASHBOARD] Using WebSocket data:', latestSensorData);
      setDisplayReading(latestSensorData);
      
      // Also process it through the detection system
      processSensorReading(latestSensorData).catch((err) => {
        console.error('[DASHBOARD] Error processing reading:', err.message);
      });
    } else if (currentReading) {
      console.log('[DASHBOARD] Using API data');
      setDisplayReading(currentReading);
    }
  }, [latestSensorData, currentReading, isConnected, processSensorReading]);

  // Update alerts when new alert arrives via WebSocket
  useEffect(() => {
    if (latestAlert) {
      console.log('[DASHBOARD] New alert received via WebSocket:', latestAlert);
      fetchRecentAlerts(5);
    }
  }, [latestAlert, fetchRecentAlerts]);

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  const gaugeData = [
    { name: 'Pressure', value: displayReading?.pressure || 0, max: 100, unit: 'PSI', color: '#3b82f6' },
    { name: 'Flow Rate', value: displayReading?.flow || 0, max: 200, unit: 'GPM', color: '#10b981' },
    { name: 'Temperature', value: displayReading?.temperature || 0, max: 80, unit: '°C', color: '#f97316' },
  ];

  const chartData = [
    { time: '00:00', pressure: 45, flow: 85, leakRisk: 15 },
    { time: '02:00', pressure: 48, flow: 90, leakRisk: 18 },
    { time: '04:00', pressure: 42, flow: 75, leakRisk: 25 },
    { time: '06:00', pressure: 50, flow: 95, leakRisk: 12 },
    { time: '08:00', pressure: 46, flow: 88, leakRisk: 20 },
    { time: '10:00', pressure: 49, flow: 92, leakRisk: 14 },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Real-Time Monitoring Dashboard</h1>
        <p className="last-updated">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* System Status Overview */}
      <div className="status-grid">
        <div className="status-card status-card-info">
          <div className="status-icon">
            <FiCheckCircle size={32} />
          </div>
          <div className="status-content">
            <p className="status-label">System Status</p>
            <p className="status-value">{detectionStatus?.status || 'Monitoring'}</p>
          </div>
        </div>

        <div className={`status-card ${recentAlerts.length > 0 ? 'status-card-warning' : 'status-card-success'}`}>
          <div className="status-icon">
            {recentAlerts.length > 0 ? <FiAlertCircle size={32} /> : <FiCheckCircle size={32} />}
          </div>
          <div className="status-content">
            <p className="status-label">Active Alerts</p>
            <p className="status-value">{recentAlerts.length}</p>
          </div>
        </div>

        <div className="status-card status-card-info">
          <div className="status-icon">
            <FiTrendingUp size={32} />
          </div>
          <div className="status-content">
            <p className="status-label">Leak Probability</p>
            <p className="status-value">{detectionStatus?.leakProbability || 0}%</p>
          </div>
        </div>
      </div>

      {/* Real-Time Gauges */}
      <div className="gauges-section">
        <h2>Real-Time Gauges</h2>
        <div className="gauges-grid">
          {gaugeData.map((gauge, idx) => (
            <div key={idx} className="gauge-card">
              <h3>{gauge.name}</h3>
              <div className="gauge-container">
                <div className="gauge-value" style={{ color: gauge.color }}>
                  {gauge.value}
                </div>
                <p className="gauge-unit">{gauge.unit}</p>
              </div>
              <div className="gauge-bar" style={{ backgroundColor: gauge.color }}>
                <div
                  className="gauge-fill"
                  style={{
                    width: `${(gauge.value / gauge.max) * 100}%`,
                    backgroundColor: gauge.color,
                  }}
                />
              </div>
              <p className="gauge-max">Max: {gauge.max} {gauge.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pressure & Flow Trends */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Pressure & Flow Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="pressure"
                stroke="#3b82f6"
                dot={false}
                name="Pressure (PSI)"
              />
              <Line
                type="monotone"
                dataKey="flow"
                stroke="#10b981"
                dot={false}
                name="Flow (GPM)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Leak Risk Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="leakRisk"
                stroke="#f97316"
                fillOpacity={1}
                fill="url(#colorRisk)"
                name="Leak Risk (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Alerts Summary */}
      {recentAlerts.length > 0 && (
        <div className="recent-alerts-section">
          <h2>Recent Alerts (Last 5)</h2>
          <div className="alerts-list">
            {recentAlerts.slice(0, 5).map((alert, idx) => (
              <div key={idx} className={`alert-item alert-${alert.severity?.toLowerCase() || 'low'}`}>
                <div className="alert-icon">
                  <FiAlertCircle />
                </div>
                <div className="alert-details">
                  <p className="alert-message">{alert.message || 'Leak detected'}</p>
                  <p className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="alert-severity">
                  {alert.severity}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
