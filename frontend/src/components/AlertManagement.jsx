import React, { useState, useEffect } from 'react';
import '../styles/AlertManagement.css';

const AlertManagement = () => {
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    isFalsePositive: false,
    isCorrectPositive: true,
    comments: '',
    confidence: 0.5
  });

  // Fetch alerts
  useEffect(() => {
    fetchAlerts();
    fetchStatistics();
    const interval = setInterval(fetchAlerts, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      let endpoint = '/api/alerts/active';

      if (activeTab === 'unacknowledged') {
        endpoint = '/api/alerts/unacknowledged';
      } else if (activeTab === 'all') {
        endpoint = '/api/alerts/active';
      }

      const response = await fetch(endpoint);
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/alerts/statistics/overview');
      const data = await response.json();
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user',
          notes: 'Alert acknowledged via dashboard'
        })
      });

      if (response.ok) {
        fetchAlerts();
        setSelectedAlert(null);
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user',
          notes: 'Issue resolved',
          feedback: feedbackForm
        })
      });

      if (response.ok) {
        fetchAlerts();
        setSelectedAlert(null);
        setFeedbackForm({
          isFalsePositive: false,
          isCorrectPositive: true,
          comments: '',
          confidence: 0.5
        });
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      info: '#0099ff',
      warning: '#ffaa00',
      critical: '#ff3333',
      emergency: '#cc0000'
    };
    return colors[severity] || '#999999';
  };

  const getDisplayProbability = (alert) => {
    // Prefer explicit probability if > 0, otherwise fall back to embedded detection snapshot
    const top = typeof alert.probability === 'number' ? alert.probability : null;
    if (top && top > 0) return `${Math.round(top)}%`;

    const det = alert.detection?.overallProbability;
    if (typeof det === 'number' && det > 0) return `${Math.round(det)}%`;

    // Fallback: check detection methods for highest probability
    const methods = Array.isArray(alert.detection?.detectionMethods) ? alert.detection.detectionMethods : [];
    if (methods.length > 0) {
      const max = Math.max(...methods.map(m => (typeof m.probability === 'number' ? m.probability : 0)));
      if (max > 0) return `${Math.round(max)}%`;
    }

    // final fallback: show N/A to avoid misleading 0%
    return 'N/A';
  };

  const filteredAlerts = alerts.filter(alert => {
    if (severityFilter === 'all') return true;
    return alert.severity === severityFilter;
  });

  return (
    <div className="alert-management">
      <div className="alert-header">
        <h2>Alert Management System</h2>
        <div className="header-actions">
          <button onClick={fetchAlerts} className="btn-refresh">
            Refresh Alerts
          </button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="statistics-grid">
          <div className="stat-card">
            <div className="stat-label">Total Alerts</div>
            <div className="stat-value">{statistics.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Alerts</div>
            <div className="stat-value alert-active">{statistics.active}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Acknowledged</div>
            <div className="stat-value">{statistics.acknowledged}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Acknowledge Rate</div>
            <div className="stat-value">{statistics.acknowledgeRate}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Resolved</div>
            <div className="stat-value">{statistics.resolved}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">False Positives</div>
            <div className="stat-value">{statistics.falsePositives}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Response Time</div>
            <div className="stat-value">{statistics.averageResponseTime}s</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Valves Closed</div>
            <div className="stat-value valve-count">
              {statistics.valveClosuresTriggered?.length || 0}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="alert-tabs">
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Alerts
        </button>
        <button
          className={`tab ${activeTab === 'unacknowledged' ? 'active' : ''}`}
          onClick={() => setActiveTab('unacknowledged')}
        >
          Unacknowledged ({alerts.filter(a => !a.acknowledged).length})
        </button>
      </div>

      {/* Severity Filter */}
      <div className="filter-bar">
        <label>Filter by Severity:</label>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="all">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
          <option value="emergency">Emergency</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="alerts-container">
        {loading ? (
          <div className="loading">Loading alerts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="no-alerts">No alerts found</div>
        ) : (
          <div className="alerts-list">
            {filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className="alert-card"
                style={{ borderLeftColor: getSeverityColor(alert.severity) }}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="alert-header-row">
                  <div className="alert-info">
                    <span className="severity-badge" style={{ background: getSeverityColor(alert.severity) }}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="alert-time">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {alert.acknowledged && (
                    <span className="acknowledged-badge">✓ Acknowledged</span>
                  )}
                  {alert.valveClosureTriggered && (
                    <span className="valve-badge">🚫 Valve Closed</span>
                  )}
                </div>

                <div className="alert-content">
                  <h4>{alert.message || 'Leak Alert'}</h4>
                  <div className="alert-details">
                    <div className="detail-item">
                      <span className="label">Location:</span>
                      <span className="value">{alert.location || 'Unknown'}</span>
                    </div>

                    <div className="detail-item">
                      <span className="label">Probability:</span>
                      <span className="value">{getDisplayProbability(alert)}</span>
                    </div>

                    <div className="detail-item">
                      <span className="label">Severity:</span>
                      <span className="value">{alert.severity || 'Unknown'}</span>
                    </div>

                    {alert.readings && (
                      <>
                        <div className="detail-item">
                          <span className="label">Pressure:</span>
                          <span className="value">{alert.readings.pressure !== undefined ? `${alert.readings.pressure} PSI` : 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Flow:</span>
                          <span className="value">{alert.readings.flow !== undefined ? `${alert.readings.flow} L/min` : 'N/A'}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                    <div className="recommended-actions">
                      <span className="label">Recommended Actions:</span>
                      <ul>
                        {alert.recommendedActions.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {alert.notificationsSent && alert.notificationsSent.length > 0 && (
                    <div className="notifications-sent">
                      <span className="label">Notifications:</span>
                      {alert.notificationsSent.map((notif, idx) => (
                        <span key={idx} className="notif-channel">{notif.channel}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedAlert && (
        <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedAlert.message || 'Leak Detection Alert'}</h3>
              <button className="close-btn" onClick={() => setSelectedAlert(null)}>×</button>
            </div>

            <div className="modal-body">
              {/* Alert Details */}
              <div className="details-section">
                <h4>Alert Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Alert ID:</span>
                    <span className="value">{selectedAlert.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Time Detected:</span>
                    <span className="value">{new Date(selectedAlert.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Severity:</span>
                    <span className="value" style={{ color: getSeverityColor(selectedAlert.severity) }}>
                      {selectedAlert.severity?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Location:</span>
                    <span className="value">{selectedAlert.location || 'Unknown'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Leak Probability:</span>
                    <span className="value" style={{ fontWeight: 'bold', color: '#ff6b6b' }}>
                      {getDisplayProbability(selectedAlert)}
                    </span>
                  </div>
                  {selectedAlert.readings && (
                    <>
                      <div className="detail-item">
                        <span className="label">Pressure:</span>
                        <span className="value">{selectedAlert.readings.pressure !== undefined ? `${selectedAlert.readings.pressure} PSI` : 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Flow Rate:</span>
                        <span className="value">{selectedAlert.readings.flow !== undefined ? `${selectedAlert.readings.flow} L/min` : 'N/A'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Recommended Actions */}
              {selectedAlert.recommendedActions && selectedAlert.recommendedActions.length > 0 && (
                <div className="details-section">
                  <h4>Recommended Actions</h4>
                  <ul className="actions-list">
                    {selectedAlert.recommendedActions.map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notifications */}
              {selectedAlert.notificationsSent && selectedAlert.notificationsSent.length > 0 && (
                <div className="details-section">
                  <h4>Notifications Sent</h4>
                  <div className="notifications-list">
                    {selectedAlert.notificationsSent.map((notif, idx) => (
                      <div key={idx} className="notification-item">
                        <span className="channel-badge">{notif.channel}</span>
                        <span className="time">
                          {new Date(notif.timestamp).toLocaleTimeString()}
                        </span>
                        {notif.recipient && <span className="recipient">{notif.recipient}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acknowledgment Status */}
              <div className="details-section">
                <h4>Acknowledgment Status</h4>
                {selectedAlert.acknowledged ? (
                  <div className="status-info">
                    <p>✓ Acknowledged by {selectedAlert.acknowledgedBy}</p>
                    <p>{new Date(selectedAlert.acknowledgedAt).toLocaleString()}</p>
                    {selectedAlert.acknowledgeNotes && <p>Notes: {selectedAlert.acknowledgeNotes}</p>}
                  </div>
                ) : (
                  <p className="not-acknowledged">Not yet acknowledged</p>
                )}
              </div>

              {/* Feedback Section */}
              {!selectedAlert.resolved && (
                <div className="details-section feedback-section">
                  <h4>Provide Feedback (for Model Improvement)</h4>
                  <div className="feedback-form">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={feedbackForm.isFalsePositive}
                        onChange={(e) =>
                          setFeedbackForm({
                            ...feedbackForm,
                            isFalsePositive: e.target.checked,
                            isCorrectPositive: !e.target.checked
                          })
                        }
                      />
                      False Positive (this alert was incorrect)
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={feedbackForm.isCorrectPositive}
                        onChange={(e) =>
                          setFeedbackForm({
                            ...feedbackForm,
                            isCorrectPositive: e.target.checked,
                            isFalsePositive: !e.target.checked
                          })
                        }
                      />
                      Correct Positive (this alert was accurate)
                    </label>

                    <label>
                      Your Confidence Level:
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={feedbackForm.confidence}
                        onChange={(e) =>
                          setFeedbackForm({
                            ...feedbackForm,
                            confidence: parseFloat(e.target.value)
                          })
                        }
                      />
                      <span>{(feedbackForm.confidence * 100).toFixed(0)}%</span>
                    </label>

                    <label>
                      Additional Comments:
                      <textarea
                        value={feedbackForm.comments}
                        onChange={(e) =>
                          setFeedbackForm({
                            ...feedbackForm,
                            comments: e.target.value
                          })
                        }
                        placeholder="Any additional feedback for model improvement..."
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="modal-footer">
              {!selectedAlert.acknowledged && (
                <button
                  className="btn btn-acknowledge"
                  onClick={() => acknowledgeAlert(selectedAlert.id)}
                >
                  Acknowledge Alert
                </button>
              )}

              {!selectedAlert.resolved && (
                <button
                  className="btn btn-resolve"
                  onClick={() => resolveAlert(selectedAlert.id)}
                >
                  Resolve Alert
                </button>
              )}

              <button className="btn btn-cancel" onClick={() => setSelectedAlert(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertManagement;
