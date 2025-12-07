import React, { useContext, useEffect, useState } from 'react';
import { DetectionContext } from '../context/DetectionContext';
import { WebSocketContext } from '../context/WebSocketContext';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiClock } from 'react-icons/fi';
import '../styles/LeakPrediction.css';

const LeakPrediction = () => {
  const {
    recentDetections,
    loading,
    fetchRecentDetections,
  } = useContext(DetectionContext);

  const {
    latestSensorData,
    isConnected,
  } = useContext(WebSocketContext);

  const [predictionTrend, setPredictionTrend] = useState([]);
  const [riskMetrics, setRiskMetrics] = useState({
    currentRisk: 0,
    trendDirection: 'stable',
    hoursToFailure: null,
    riskLevel: 'NORMAL'
  });

  useEffect(() => {
    console.log('[LEAK PREDICTION] Component mounted');
    fetchRecentDetections(50);

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      fetchRecentDetections(50);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchRecentDetections]);

  useEffect(() => {
    if (recentDetections && recentDetections.length > 0) {
      // Build trend data
      const trend = recentDetections.slice(-30).map((d, idx) => ({
        time: new Date(d.timestamp).toLocaleTimeString(),
        probability: d.detection?.overallProbability || 0,
        lstm: d.detection?.detectionMethods?.find(m => m.method === 'lstm_anomaly')?.probability || 0,
        regression: d.detection?.detectionMethods?.find(m => m.method === 'regression_maintenance')?.probability || 0,
        ruleBased: d.detection?.detectionMethods?.find(m => m.method === 'rule_based')?.probability || 0,
        severity: d.detection?.severityLevel || 'NORMAL',
        index: idx,
      }));
      setPredictionTrend(trend);

      // Calculate risk metrics
      const latestDetection = recentDetections[recentDetections.length - 1];
      if (latestDetection && latestDetection.detection) {
        const currentProb = latestDetection.detection.overallProbability || 0;
        
        // Calculate trend
        let trend = 'stable';
        if (recentDetections.length >= 3) {
          const prev3 = recentDetections.slice(-3);
          const avg1 = (prev3[0].detection?.overallProbability || 0);
          const avg2 = (prev3[2].detection?.overallProbability || 0);
          if (avg2 > avg1 + 5) trend = 'increasing';
          else if (avg2 < avg1 - 5) trend = 'decreasing';
        }

        setRiskMetrics({
          currentRisk: currentProb,
          trendDirection: trend,
          hoursToFailure: latestDetection.detection.timeToFailure || null,
          riskLevel: latestDetection.detection.severityLevel || 'NORMAL'
        });
      }
    }
  }, [recentDetections]);

  if (loading) {
    return <div className="leak-prediction-loading">Loading prediction data...</div>;
  }

  const getRiskColor = (level) => {
    const colors = {
      CRITICAL: '#dc2626',
      HIGH: '#ea580c',
      MEDIUM: '#eab308',
      MINOR: '#10b981',
      NORMAL: '#3b82f6'
    };
    return colors[level] || '#3b82f6';
  };

  const getRiskIcon = (level) => {
    if (['CRITICAL', 'HIGH'].includes(level)) {
      return <FiAlertTriangle className="risk-icon-alert" />;
    }
    if (level === 'MEDIUM') {
      return <FiTrendingUp className="risk-icon-warning" />;
    }
    return <FiCheckCircle className="risk-icon-safe" />;
  };

  const getTrendArrow = (direction) => {
    if (direction === 'increasing') return '📈 Increasing';
    if (direction === 'decreasing') return '📉 Decreasing';
    return '➡️ Stable';
  };

  // Prepare method comparison data
  const methodComparison = predictionTrend.length > 0 ? [
    {
      name: 'LSTM Anomaly',
      avg: Math.round(predictionTrend.reduce((s, d) => s + d.lstm, 0) / predictionTrend.length),
      current: predictionTrend[predictionTrend.length - 1]?.lstm || 0,
      weight: '40%'
    },
    {
      name: 'Regression',
      avg: Math.round(predictionTrend.reduce((s, d) => s + d.regression, 0) / predictionTrend.length),
      current: predictionTrend[predictionTrend.length - 1]?.regression || 0,
      weight: '30%'
    },
    {
      name: 'Rule-Based',
      avg: Math.round(predictionTrend.reduce((s, d) => s + d.ruleBased, 0) / predictionTrend.length),
      current: predictionTrend[predictionTrend.length - 1]?.ruleBased || 0,
      weight: '30%'
    }
  ] : [];

  return (
    <div className="leak-prediction-container">
      {/* Header */}
      <div className="prediction-header">
        <div className="header-title">
          <FiTrendingUp className="header-icon" />
          <div>
            <h1>🔮 Leak Prediction Analysis</h1>
            <p>ML-based prediction of potential water leaks</p>
          </div>
        </div>
        <div className="connection-status">
          {isConnected ? (
            <span className="status-connected">🟢 Live Data</span>
          ) : (
            <span className="status-disconnected">⚪ Offline</span>
          )}
        </div>
      </div>

      {/* Current Risk Metrics */}
      <div className="risk-metrics-section">
        <div className="metric-card current-risk">
          <div className="metric-icon" style={{ color: getRiskColor(riskMetrics.riskLevel) }}>
            {getRiskIcon(riskMetrics.riskLevel)}
          </div>
          <div className="metric-content">
            <p className="metric-label">Current Leak Risk</p>
            <p className="metric-value" style={{ color: getRiskColor(riskMetrics.riskLevel) }}>
              {riskMetrics.currentRisk}%
            </p>
            <p className="metric-severity">{riskMetrics.riskLevel}</p>
          </div>
        </div>

        <div className="metric-card trend-card">
          <FiTrendingUp className="metric-icon" />
          <div className="metric-content">
            <p className="metric-label">Trend</p>
            <p className="metric-value">{getTrendArrow(riskMetrics.trendDirection)}</p>
            <p className="metric-description">
              {riskMetrics.trendDirection === 'increasing' 
                ? 'Risk is increasing - monitor closely'
                : riskMetrics.trendDirection === 'decreasing'
                ? 'Risk is decreasing'
                : 'Risk is stable'}
            </p>
          </div>
        </div>

        {riskMetrics.hoursToFailure && (
          <div className="metric-card time-to-failure">
            <FiClock className="metric-icon" />
            <div className="metric-content">
              <p className="metric-label">Est. Time to Failure</p>
              <p className="metric-value">{riskMetrics.hoursToFailure}h</p>
              <p className="metric-description">Based on regression model</p>
            </div>
          </div>
        )}
      </div>

      {/* Risk Trend Chart */}
      <div className="prediction-chart-section">
        <h2>📊 Risk Trend Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={predictionTrend}>
            <defs>
              <linearGradient id="colorProbability" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="probability" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorProbability)"
              name="Overall Probability"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Detection Methods Breakdown */}
      <div className="methods-section">
        <h2>🔍 Detection Methods Comparison</h2>
        <div className="methods-grid">
          {methodComparison.map((method, idx) => (
            <div key={idx} className="method-card">
              <div className="method-header">
                <h3>{method.name}</h3>
                <span className="method-weight">Weight: {method.weight}</span>
              </div>
              <div className="method-values">
                <div className="value-item">
                  <span className="label">Current:</span>
                  <span className="value">{method.current}%</span>
                </div>
                <div className="value-item">
                  <span className="label">Average:</span>
                  <span className="value">{method.avg}%</span>
                </div>
              </div>
              <div className="method-bar">
                <div className="bar-fill" style={{ width: `${method.current}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Severity Distribution */}
      <div className="distribution-section">
        <h2>📈 Risk Distribution</h2>
        <div className="severity-distribution">
          {['NORMAL', 'MINOR', 'MEDIUM', 'HIGH', 'CRITICAL'].map((severity) => {
            const count = predictionTrend.filter(d => d.severity === severity).length;
            const percentage = predictionTrend.length > 0 ? Math.round((count / predictionTrend.length) * 100) : 0;
            return (
              <div key={severity} className="severity-item">
                <div className="severity-label">{severity}</div>
                <div className="severity-bar">
                  <div 
                    className="severity-fill"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: getRiskColor(severity)
                    }}
                  ></div>
                </div>
                <div className="severity-percent">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations-section">
        <h2>💡 Recommendations</h2>
        <div className="recommendations-list">
          {riskMetrics.riskLevel === 'CRITICAL' && (
            <div className="recommendation critical">
              🔴 <strong>CRITICAL:</strong> Immediate action required. Inspect system immediately and consider isolating affected section.
            </div>
          )}
          {riskMetrics.riskLevel === 'HIGH' && (
            <div className="recommendation high">
              🟠 <strong>HIGH RISK:</strong> Urgent inspection needed within 1-2 hours. Prepare maintenance team.
            </div>
          )}
          {riskMetrics.riskLevel === 'MEDIUM' && (
            <div className="recommendation medium">
              🟡 <strong>MEDIUM RISK:</strong> Schedule inspection within 24 hours. Monitor system closely.
            </div>
          )}
          {riskMetrics.riskLevel === 'MINOR' && (
            <div className="recommendation minor">
              🟢 <strong>MINOR RISK:</strong> Continue monitoring. No immediate action required.
            </div>
          )}
          {riskMetrics.riskLevel === 'NORMAL' && (
            <div className="recommendation normal">
              ✅ <strong>NORMAL:</strong> System operating normally. Continue regular monitoring.
            </div>
          )}
          
          {riskMetrics.trendDirection === 'increasing' && (
            <div className="recommendation warning">
              📈 Risk is increasing. Increase monitoring frequency and prepare for potential escalation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeakPrediction;
