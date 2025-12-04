import React, { useContext, useEffect, useState } from 'react';
import { DetectionContext } from '../context/DetectionContext';
import { WebSocketContext } from '../context/WebSocketContext';
import { detectionAPI } from '../services/apiClient';
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
    recentDetections,
    fetchRecentDetections,
    loading,
    fetchDetectionStatus,
    fetchRecentAlerts,
    processSensorReading,
  } = useContext(DetectionContext);

  const {
    isConnected,
    latestSensorData,
    alerts,
  } = useContext(WebSocketContext);

  const [displayReading, setDisplayReading] = useState(null);
  const [liveReadings, setLiveReadings] = useState([]);

  // Ensure charts update at least once per minute with latest values
  useEffect(() => {
    let cancelled = false;

    const appendLatestPoint = async () => {
      try {
        let point = null;

        if (isConnected && latestSensorData) {
          point = {
            timestamp: latestSensorData.timestamp || Date.now(),
            pressure: Number(latestSensorData.pressure) || 0,
            flow: Number(latestSensorData.flow) || 0,
            leakRisk: latestSensorData.leakRisk != null ? Number(latestSensorData.leakRisk) : 0,
          };
        } else {
          // Fallback: fetch one recent detection from API
          try {
            const resp = await detectionAPI.getRecentDetections(1);
            const payload = resp.data?.data || resp.data || [];
            const entry = Array.isArray(payload) && payload.length > 0 ? payload[0] : null;
            if (entry) {
              point = {
                timestamp: entry.timestamp || Date.now(),
                pressure: Number(entry.pressure || entry.readings?.pressure) || 0,
                flow: Number(entry.flow || entry.readings?.flow) || 0,
                leakRisk: entry.leakProbability ? Number(String(entry.leakProbability).replace('%','')) : (entry.detection?.overallProbability ? Number(entry.detection.overallProbability) : 0),
              };
            }
          } catch (err) {
            // ignore fetch errors, will try again on next tick
            console.warn('[DASHBOARD] Minute poll: could not fetch recent detection', err.message || err);
          }
        }

        if (point && !cancelled) {
          setLiveReadings(prev => {
            const next = prev.concat([point]);
            return next.slice(-200); // keep last 200 points
          });
        }
      } catch (err) {
        console.error('[DASHBOARD] Error appending latest point', err.message || err);
      }
    };

    // Append immediately, then every minute
    appendLatestPoint();
    const id = setInterval(appendLatestPoint, 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isConnected, latestSensorData]);

  useEffect(() => {
    console.log('[DASHBOARD] Component mounted');
    fetchDetectionStatus();
    fetchRecentAlerts(5);
    // load recent detections for charts
    if (fetchRecentDetections) fetchRecentDetections(50);
  }, [fetchDetectionStatus, fetchRecentAlerts]);

  useEffect(() => {
    if (isConnected && latestSensorData) {
      console.log('[DASHBOARD] Using WebSocket data:', latestSensorData);
      setDisplayReading(latestSensorData);

      // Also process it through the detection system
      processSensorReading(latestSensorData).catch((err) => {
        console.error('[DASHBOARD] Error processing reading:', err.message);
      });

      // maintain a short live buffer for charts when detections are not yet available
      setLiveReadings((prev) => {
        const next = prev.concat([{
          timestamp: latestSensorData.timestamp || Date.now(),
          pressure: latestSensorData.pressure,
          flow: latestSensorData.flow,
          temperature: latestSensorData.temperature,
          leakRisk: latestSensorData.leakRisk || null
        }]);
        return next.slice(-100);
      });
    } else if (currentReading) {
      console.log('[DASHBOARD] Using API data');
      setDisplayReading(currentReading);
    }
  }, [latestSensorData, currentReading, isConnected, processSensorReading]);

  // Update recent detections when WebSocket alerts change or on mount
  useEffect(() => {
    if (fetchRecentDetections) {
      fetchRecentDetections(50).catch((err) => console.warn('[DASHBOARD] fetchRecentDetections failed', err.message));
    }
  }, [alerts?.length, fetchRecentDetections]);

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  const gaugeData = [
    { name: 'Pressure', value: displayReading?.pressure || 0, max: 100, unit: 'PSI', color: '#3b82f6' },
    { name: 'Flow Rate', value: displayReading?.flow || 0, max: 200, unit: 'GPM', color: '#10b981' },
    { name: 'Temperature', value: displayReading?.temperature || 0, max: 80, unit: '°C', color: '#f97316' },
  ];

  // Build chartData from recentDetections (preferred) or liveReadings fallback
  let chartData = [];
  if (Array.isArray(recentDetections) && recentDetections.length > 0) {
    // map the detection objects produced by integratedEngine
    chartData = recentDetections.slice(-50).map((d) => ({
      time: new Date(d.timestamp).toLocaleTimeString(),
      pressure: Number(d.readings?.pressure) || 0,
      flow: Number(d.readings?.flow) || 0,
      leakRisk: Number(d.detection?.overallProbability) || 0,
    }));
  } else if (liveReadings.length > 0) {
    chartData = liveReadings.slice(-50).map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString(),
      pressure: Number(r.pressure) || 0,
      flow: Number(r.flow) || 0,
      leakRisk: r.leakRisk != null ? Number(r.leakRisk) : 0,
    }));
  }

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
