import React, { useContext, useEffect } from 'react';
import { DetectionContext } from '../context/DetectionContext';
import { WebSocketContext } from '../context/WebSocketContext';
import { FiAlertCircle, FiCheckCircle, FiClock, FiZap } from 'react-icons/fi';
import '../styles/LeakAlertPanel.css';

const LeakAlertPanel = () => {
  const {
    recentAlerts,
    alertHistory,
    detectionStatus,
    loading,
    fetchRecentAlerts,
  } = useContext(DetectionContext);

  const {
    latestAlert,
    isConnected,
  } = useContext(WebSocketContext);

  useEffect(() => {
    console.log('[LEAK ALERT PANEL] Component mounted');
    fetchRecentAlerts(20);

    // Refresh alerts every 10 seconds
    const interval = setInterval(() => {
      console.log('[LEAK ALERT PANEL] Refreshing alerts');
      fetchRecentAlerts(20);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchRecentAlerts]);

  const getSeverityColor = (severity) => {
    const level = severity?.toUpperCase() || 'LOW';
    const colorMap = {
      CRITICAL: '#dc2626',
      HIGH: '#ea580c',
      MEDIUM: '#eab308',
      LOW: '#3b82f6',
      MINOR: '#10b981',
    };
    return colorMap[level] || '#3b82f6';
  };

  const getSeverityIcon = (severity) => {
    const level = severity?.toUpperCase() || 'LOW';
    if (['CRITICAL', 'HIGH'].includes(level)) {
      return <FiAlertCircle className="alert-icon-critical" />;
    }
    return <FiCheckCircle className="alert-icon-success" />;
  };

  if (loading) {
    return <div className="alert-panel-loading">Loading alerts...</div>;
  }

  const activeAlerts = recentAlerts.filter((a) => a.status !== 'resolved');
  const resolvedAlerts = alertHistory.filter((a) => a.status === 'resolved');

  return (
    <div className="alert-panel-container">
      <div className="alert-panel-header">
        <h1>Leak Alert Monitoring</h1>
        <div className="alert-stats">
          <div className="stat active">
            <span className="stat-label">Active Alerts</span>
            <span className="stat-count">{activeAlerts.length}</span>
          </div>
          <div className="stat resolved">
            <span className="stat-label">Resolved Today</span>
            <span className="stat-count">{resolvedAlerts.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">System Status</span>
            <span className="stat-value">{detectionStatus?.status || 'Normal'}</span>
          </div>
        </div>
      </div>

      {/* Real-time Alert Indicator from WebSocket */}
      {isConnected && latestAlert && (
        <div className="realtime-alert-indicator">
          <div className="realtime-alert-header">
            <FiZap className="realtime-alert-icon" />
            <span>Latest Real-time Alert</span>
          </div>
          <div
            className={`alert-item alert-severity-${latestAlert.severity?.toLowerCase() || 'low'} realtime-highlight`}
            style={{ borderLeftColor: getSeverityColor(latestAlert.severity) }}
          >
            <div className="alert-icon-container">
              {getSeverityIcon(latestAlert.severity)}
            </div>
            <div className="alert-content">
              <div className="alert-header">
                <h3 className="alert-title">{latestAlert.message || 'Leak Detected'}</h3>
                <span className="alert-severity" style={{ color: getSeverityColor(latestAlert.severity) }}>
                  {latestAlert.severity}
                </span>
              </div>
              <div className="alert-details">
                <div className="detail-item">
                  <span className="detail-label">Leak Probability:</span>
                  <span className="detail-value">{latestAlert.leakProbability || 0}%</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{latestAlert.location || 'Main Line'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Detected:</span>
                  <span className="detail-value">
                    {new Date(latestAlert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Alerts Section */}
      <div className="alerts-section">
        <div className="section-header">
          <h2>Active Alerts</h2>
          <span className="alert-count">{activeAlerts.length} active</span>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="no-alerts">
            <FiCheckCircle size={48} />
            <p>No active alerts - System operating normally</p>
          </div>
        ) : (
          <div className="alerts-list">
            {activeAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`alert-item alert-severity-${alert.severity?.toLowerCase() || 'low'}`}
                style={{ borderLeftColor: getSeverityColor(alert.severity) }}
              >
                <div className="alert-icon-container">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="alert-content">
                  <div className="alert-header">
                    <h3 className="alert-title">{alert.message || 'Leak Detected'}</h3>
                    <span className="alert-severity" style={{ color: getSeverityColor(alert.severity) }}>
                      {alert.severity}
                    </span>
                  </div>
                  <div className="alert-details">
                    <div className="detail-item">
                      <span className="detail-label">Leak Probability:</span>
                      <span className="detail-value">{alert.leakProbability || 0}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{alert.location || 'Main Line'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Detected:</span>
                      <span className="detail-value">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  {alert.recommendedAction && (
                    <div className="alert-action">
                      <p className="action-label">Recommended Action:</p>
                      <p className="action-text">{alert.recommendedAction}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert History Section */}
      <div className="history-section">
        <div className="section-header">
          <h2>Alert History</h2>
          <span className="history-count">{alertHistory.length} total</span>
        </div>

        {alertHistory.length === 0 ? (
          <div className="no-history">
            <FiClock size={32} />
            <p>No alert history available</p>
          </div>
        ) : (
          <div className="history-list">
            {alertHistory.slice(0, 15).map((alert, idx) => (
              <div key={idx} className="history-item">
                <div className="history-icon">
                  {alert.status === 'resolved' ? (
                    <FiCheckCircle className="resolved" />
                  ) : (
                    <FiAlertCircle className="active" />
                  )}
                </div>
                <div className="history-content">
                  <p className="history-message">{alert.message || 'Leak Alert'}</p>
                  <div className="history-meta">
                    <span className="history-time">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`history-status status-${alert.status?.toLowerCase() || 'pending'}`}>
                      {alert.status || 'Pending'}
                    </span>
                    <span className="history-probability">
                      {alert.leakProbability || 0}% probability
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert Statistics */}
      <div className="stats-section">
        <h2>Alert Statistics</h2>
        <div className="stats-grid">
          <div className="stat-box">
            <p className="stat-box-label">Critical Alerts</p>
            <p className="stat-box-value critical">
              {alertHistory.filter((a) => a.severity?.toUpperCase() === 'CRITICAL').length}
            </p>
          </div>
          <div className="stat-box">
            <p className="stat-box-label">High Severity</p>
            <p className="stat-box-value high">
              {alertHistory.filter((a) => a.severity?.toUpperCase() === 'HIGH').length}
            </p>
          </div>
          <div className="stat-box">
            <p className="stat-box-label">Medium Severity</p>
            <p className="stat-box-value medium">
              {alertHistory.filter((a) => a.severity?.toUpperCase() === 'MEDIUM').length}
            </p>
          </div>
          <div className="stat-box">
            <p className="stat-box-label">Low Severity</p>
            <p className="stat-box-value low">
              {alertHistory.filter((a) => a.severity?.toUpperCase() === 'LOW').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeakAlertPanel;
