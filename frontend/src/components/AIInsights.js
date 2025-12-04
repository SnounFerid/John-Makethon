import React, { useContext, useEffect } from 'react';
import { DetectionContext } from '../context/DetectionContext';
import { WebSocketContext } from '../context/WebSocketContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FiCpu, FiTrendingUp, FiZap } from 'react-icons/fi';
import '../styles/AIInsights.css';

const AIInsights = () => {
  const {
    predictions,
    recentDetections,
    loading,
    fetchPredictions,
    fetchRecentDetections,
  } = useContext(DetectionContext);

  const {
    latestSensorData,
    isConnected,
    dataFreshness,
    getFormattedFreshness,
  } = useContext(WebSocketContext);

  useEffect(() => {
    console.log('[AI INSIGHTS] Component mounted');
    fetchPredictions();
    fetchRecentDetections(30);

    // Refresh predictions every 10 seconds
    const interval = setInterval(() => {
      console.log('[AI INSIGHTS] Refreshing predictions');
      fetchPredictions();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchPredictions, fetchRecentDetections]);

  if (loading) {
    return <div className="ai-insights-loading">Loading AI insights...</div>;
  }

  // Prepare anomaly score history
  const anomalyHistory = recentDetections
    .slice(-20)
    .map((detection, idx) => ({
      time: new Date(detection.timestamp).toLocaleTimeString(),
      anomalyScore: detection.mlAnomalyScore || 0,
      ruleProbability: detection.ruleProbability || 0,
      leakProbability: detection.leakProbability || 0,
      index: idx,
    }));

  // Distribution of leak probabilities
  const probabilityDistribution = [
    {
      name: 'No Leak (0-20%)',
      value: recentDetections.filter((d) => (d.leakProbability || 0) < 20).length,
    },
    {
      name: 'Low (20-40%)',
      value: recentDetections.filter(
        (d) => (d.leakProbability || 0) >= 20 && (d.leakProbability || 0) < 40
      ).length,
    },
    {
      name: 'Medium (40-60%)',
      value: recentDetections.filter(
        (d) => (d.leakProbability || 0) >= 40 && (d.leakProbability || 0) < 60
      ).length,
    },
    {
      name: 'High (60-80%)',
      value: recentDetections.filter(
        (d) => (d.leakProbability || 0) >= 60 && (d.leakProbability || 0) < 80
      ).length,
    },
    {
      name: 'Critical (80-100%)',
      value: recentDetections.filter((d) => (d.leakProbability || 0) >= 80).length,
    },
  ];

  const colors = ['#10b981', '#3b82f6', '#eab308', '#f97316', '#dc2626'];

  const avgAnomalyScore =
    recentDetections.reduce((sum, d) => sum + (d.mlAnomalyScore || 0), 0) / recentDetections.length ||
    0;
  const avgLeakProbability =
    recentDetections.reduce((sum, d) => sum + (d.leakProbability || 0), 0) / recentDetections.length ||
    0;

  return (
    <div className="ai-insights-container">
      <div className="ai-header">
        <div className="header-title">
          <FiCpu className="header-icon" />
          <div>
            <h1>AI Insights & Predictions</h1>
            <p>Machine learning-based anomaly detection and leak probability analysis</p>
          </div>
        </div>
      </div>

      {/* Real-time Anomaly Detection from WebSocket */}
      {isConnected && latestSensorData && (
        <div className="realtime-anomaly-section">
          <div className="realtime-header">
            <FiZap className="realtime-icon" />
            <span>Real-time Anomaly Monitoring</span>
            <span className="freshness-badge">{getFormattedFreshness()}</span>
          </div>
          <div className="anomaly-grid">
            <div className="anomaly-metric">
              <span className="anomaly-label">Current Data Freshness</span>
              <span className="anomaly-value">{dataFreshness}ms</span>
              <div className="freshness-bar">
                <div
                  className="freshness-indicator"
                  style={{ width: `${Math.min(100, (dataFreshness / 5000) * 100)}%` }}
                />
              </div>
            </div>
            <div className={`anomaly-metric ${parseFloat(latestSensorData.pressure) > 65 || parseFloat(latestSensorData.flow) > 60 ? 'anomaly-detected' : ''}`}>
              <span className="anomaly-label">System Status</span>
              <span className="anomaly-value">
                {parseFloat(latestSensorData.pressure) > 65 || parseFloat(latestSensorData.flow) > 60 ? 'Anomaly' : 'Normal'}
              </span>
              <span className="anomaly-confidence">Confidence: High</span>
            </div>
            <div className="anomaly-metric">
              <span className="anomaly-label">Sensor Variance</span>
              <span className="anomaly-value">
                {(parseFloat(latestSensorData.pressure) * parseFloat(latestSensorData.flow) / 100).toFixed(1)}
              </span>
              <span className="anomaly-confidence">Score: {((parseFloat(latestSensorData.pressure) * parseFloat(latestSensorData.flow) / 6000) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
            <div className="metric-icon">
            <FiCpu />
          </div>
          <div className="metric-content">
            <p className="metric-label">Avg Anomaly Score</p>
            <p className="metric-value">{avgAnomalyScore.toFixed(2)}%</p>
            <p className="metric-description">AI-detected anomalies</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FiZap />
          </div>
          <div className="metric-content">
            <p className="metric-label">Avg Leak Probability</p>
            <p className="metric-value">{avgLeakProbability.toFixed(2)}%</p>
            <p className="metric-description">Combined detection probability</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FiTrendingUp />
          </div>
          <div className="metric-content">
            <p className="metric-label">Recent Detections</p>
            <p className="metric-value">{recentDetections.length}</p>
            <p className="metric-description">In last 30 readings</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FiZap />
          </div>
          <div className="metric-content">
            <p className="metric-label">Model Confidence</p>
            <p className="metric-value">{(predictions?.confidence || 0).toFixed(2)}%</p>
            <p className="metric-description">ML model accuracy</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Anomaly Score Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={anomalyHistory} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="anomalyScore"
                stroke="#8b5cf6"
                dot={false}
                name="ML Anomaly Score (%)"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Detection Methods Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={anomalyHistory} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="ruleProbability"
                stroke="#3b82f6"
                dot={false}
                name="Rule-Based (%)"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="anomalyScore"
                stroke="#8b5cf6"
                dot={false}
                name="ML Anomaly (%)"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Combined Leak Probability</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={anomalyHistory} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="leakProbability"
                stroke="#ef4444"
                dot={false}
                name="Combined Leak Probability (%)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Leak Probability Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <Pie
                data={probabilityDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {colors.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Information */}
      {predictions && (
        <div className="model-info-section">
          <h2>ML Model Performance</h2>
          <div className="model-info-grid">
            <div className="info-box">
              <p className="info-label">Algorithm</p>
              <p className="info-value">{predictions.algorithm || 'Isolation Forest'}</p>
            </div>
            <div className="info-box">
              <p className="info-label">Training Samples</p>
              <p className="info-value">{predictions.trainingSamples || 0}</p>
            </div>
            <div className="info-box">
              <p className="info-label">Model Accuracy</p>
              <p className="info-value">{(predictions.accuracy * 100 || 0).toFixed(2)}%</p>
            </div>
            <div className="info-box">
              <p className="info-label">Precision</p>
              <p className="info-value">{(predictions.precision * 100 || 0).toFixed(2)}%</p>
            </div>
            <div className="info-box">
              <p className="info-label">Recall</p>
              <p className="info-value">{(predictions.recall * 100 || 0).toFixed(2)}%</p>
            </div>
            <div className="info-box">
              <p className="info-label">F1 Score</p>
              <p className="info-value">{(predictions.f1Score || 0).toFixed(3)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Anomalies */}
      <div className="anomalies-section">
        <h2>Top Detected Anomalies</h2>
        <div className="anomalies-list">
          {recentDetections
            .filter((d) => (d.mlAnomalyScore || 0) > 50)
            .slice(0, 10)
            .map((detection, idx) => (
              <div key={idx} className="anomaly-item">
                <div className="anomaly-rank">{idx + 1}</div>
                <div className="anomaly-content">
                  <p className="anomaly-time">
                    {new Date(detection.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="anomaly-description">
                    {detection.anomalyDescription || 'Anomaly detected'}
                  </p>
                </div>
                <div className="anomaly-score">
                  <p className="score-label">ML Score</p>
                  <p className="score-value">{(detection.mlAnomalyScore || 0).toFixed(2)}%</p>
                </div>
              </div>
            ))}
          {recentDetections.filter((d) => (d.mlAnomalyScore || 0) > 50).length === 0 && (
            <div className="no-anomalies">No significant anomalies detected</div>
          )}
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="insights-section">
        <h2>System Insights</h2>
        <div className="insights-list">
          <div className="insight-item info">
            <h4>System Status</h4>
            <p>
              {avgLeakProbability < 30
                ? '✓ System operating normally with no significant leak indicators'
                : avgLeakProbability < 60
                ? '⚠ Moderate anomaly detected - monitoring recommended'
                : '🚨 High leak probability - immediate inspection recommended'}
            </p>
          </div>
          <div className="insight-item">
            <h4>ML Model Status</h4>
            <p>
              Isolation Forest algorithm trained on{' '}
              {predictions?.trainingSamples || 0} samples with
              {(predictions?.accuracy * 100 || 0).toFixed(2)}% accuracy
            </p>
          </div>
          <div className="insight-item">
            <h4>Recent Trends</h4>
            <p>
              {recentDetections.length > 0
                ? `${recentDetections.filter((d) => (d.leakProbability || 0) > 50).length} readings with elevated leak probability in last 30 samples`
                : 'Insufficient data for trend analysis'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
