import React, { useContext, useEffect, useState } from 'react';
import { DetectionContext } from '../context/DetectionContext';
import { WebSocketContext } from '../context/WebSocketContext';
import { FiPower, FiCheck, FiX, FiZap } from 'react-icons/fi';
import '../styles/ValveControl.css';

const ValveControl = () => {
  const {
    valveStatus,
    valveHistory,
    loading,
    controlValve,
    fetchValveStatus,
    fetchValveHistory,
  } = useContext(DetectionContext);

  const {
    latestSensorData,
    isConnected,
    getFormattedFreshness,
  } = useContext(WebSocketContext);

  const [actionLoading, setActionLoading] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  useEffect(() => {
    console.log('[VALVE CONTROL] Component mounted');
    fetchValveStatus();
    fetchValveHistory();

    // Refresh valve status every 5 seconds
    const interval = setInterval(() => {
      console.log('[VALVE CONTROL] Refreshing valve status');
      fetchValveStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchValveStatus, fetchValveHistory]);

  const handleValveAction = async (action) => {
    try {
      console.log('[VALVE CONTROL] Performing action:', action);
      setActionLoading(true);
      await controlValve(action);
      setLastAction({
        action,
        timestamp: new Date(),
        success: true,
      });
      console.log('[VALVE CONTROL] Action completed successfully');
      setTimeout(() => setLastAction(null), 3000);
    } catch (err) {
      console.error('[VALVE CONTROL] Action failed:', err.message);
      setLastAction({
        action,
        timestamp: new Date(),
        success: false,
        error: err.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="valve-loading">Loading valve control...</div>;
  }

  const isOpen = valveStatus?.status === 'open';
  const valveConnected = valveStatus?.connected !== false;

  return (
    <div className="valve-control-container">
      <div className="valve-header">
        <h1>Valve Control System</h1>
        <p className="valve-subtitle">Manual and automatic valve management</p>
      </div>

      {/* Real-time Sensor Data for Valve Decision */}
      {isConnected && latestSensorData && (
        <div className="realtime-sensor-section">
          <div className="realtime-header">
            <FiZap className="realtime-icon" />
            <span>Real-time Sensor Input</span>
            <span className="freshness-badge">{getFormattedFreshness()}</span>
          </div>
          <div className="sensor-metrics-grid">
            <div className={`sensor-metric ${parseFloat(latestSensorData.pressure) > 60 ? 'alert' : ''}`}>
              <span className="metric-label">Pressure (PSI)</span>
              <span className="metric-value">{parseFloat(latestSensorData.pressure).toFixed(2)}</span>
              <span className="metric-unit">Critical: &gt;60 PSI</span>
            </div>
            <div className={`sensor-metric ${parseFloat(latestSensorData.flow) > 50 ? 'alert' : ''}`}>
              <span className="metric-label">Flow (GPM)</span>
              <span className="metric-value">{parseFloat(latestSensorData.flow).toFixed(2)}</span>
              <span className="metric-unit">High: &gt;50 GPM</span>
            </div>
            <div className={`sensor-metric ${parseFloat(latestSensorData.temperature) > 40 ? 'alert' : ''}`}>
              <span className="metric-label">Temperature (°C)</span>
              <span className="metric-value">{parseFloat(latestSensorData.temperature).toFixed(1)}</span>
              <span className="metric-unit">Warning: &gt;40°C</span>
            </div>
            <div className="sensor-metric">
              <span className="metric-label">Conductivity</span>
              <span className="metric-value">{parseFloat(latestSensorData.conductivity).toFixed(3)}</span>
              <span className="metric-unit">µS/cm</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Valve Control */}
      <div className="valve-main-section">
        <div className="valve-status-card">
          <div className="valve-visual">
            <div className={`valve-icon ${isOpen ? 'open' : 'closed'}`}>
              {isOpen ? <FiCheck size={48} /> : <FiX size={48} />}
            </div>
            <div className="valve-status-info">
              <p className="valve-status-label">Current Status</p>
              <p className={`valve-status-value ${isOpen ? 'open' : 'closed'}`}>
                {isOpen ? 'OPEN' : 'CLOSED'}
              </p>
              <p className={`valve-connection ${valveConnected ? 'connected' : 'disconnected'}`}>
                {valveConnected ? '✓ Connected' : '✗ Disconnected'}
              </p>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="valve-controls">
          <button
            className={`btn-control btn-open ${isOpen ? 'disabled' : ''}`}
            onClick={() => handleValveAction('open')}
            disabled={actionLoading || isOpen}
            title="Open the main valve"
          >
            <FiPower className="btn-icon" />
            <span>Open Valve</span>
          </button>

          <button
            className={`btn-control btn-close ${!isOpen ? 'disabled' : ''}`}
            onClick={() => handleValveAction('close')}
            disabled={actionLoading || !isOpen}
            title="Close the main valve"
          >
            <FiPower className="btn-icon" />
            <span>Close Valve</span>
          </button>
        </div>

        {/* Action Status */}
        {lastAction && (
          <div className={`action-status ${lastAction.success ? 'success' : 'error'}`}>
            {lastAction.success ? (
              <>
                <FiCheck size={24} />
                <p>Valve {lastAction.action} command executed successfully</p>
              </>
            ) : (
              <>
                <FiX size={24} />
                <p>Failed to {lastAction.action} valve: {lastAction.error}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Valve Details */}
      <div className="valve-details-section">
        <h2>Valve Details</h2>
        <div className="details-grid">
          <div className="detail-box">
            <p className="detail-label">Location</p>
            <p className="detail-value">{valveStatus?.location || 'Main Line'}</p>
          </div>
          <div className="detail-box">
            <p className="detail-label">Type</p>
            <p className="detail-value">{valveStatus?.type || 'Ball Valve'}</p>
          </div>
          <div className="detail-box">
            <p className="detail-label">Max Flow</p>
            <p className="detail-value">{valveStatus?.maxFlow || 200} GPM</p>
          </div>
          <div className="detail-box">
            <p className="detail-label">Last Updated</p>
            <p className="detail-value">
              {new Date(valveStatus?.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
          <div className="detail-box">
            <p className="detail-label">Response Time</p>
            <p className="detail-value">{valveStatus?.responseTime || 'N/A'}</p>
          </div>
          <div className="detail-box">
            <p className="detail-label">Battery Level</p>
            <p className="detail-value">{valveStatus?.batteryLevel || 'N/A'}%</p>
          </div>
        </div>
      </div>

      {/* Valve Operation History */}
      <div className="valve-history-section">
        <h2>Operation History</h2>

        {valveHistory.length === 0 ? (
          <div className="no-history">
            <p>No valve operations recorded yet</p>
          </div>
        ) : (
          <div className="history-container">
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Status</th>
                    <th>Result</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {valveHistory.slice(0, 15).map((record, idx) => (
                    <tr key={idx} className={`history-row ${record.status?.toLowerCase()}`}>
                      <td className="timestamp">
                        {new Date(record.timestamp).toLocaleString()}
                      </td>
                      <td className="action">
                        <span className={`action-badge ${record.action?.toLowerCase()}`}>
                          {record.action?.toUpperCase()}
                        </span>
                      </td>
                      <td className="status">
                        <span className={`status-badge ${record.status?.toLowerCase()}`}>
                          {record.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="result">
                        {record.success ? (
                          <span className="result-success">✓ Success</span>
                        ) : (
                          <span className="result-failed">✗ Failed</span>
                        )}
                      </td>
                      <td className="details">{record.details || 'No details'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Safety Information */}
      <div className="safety-section">
        <h2>Safety Information</h2>
        <div className="safety-box">
          <p className="safety-title">⚠️ Before Closing Valve:</p>
          <ul className="safety-list">
            <li>Ensure no one is using water downstream</li>
            <li>Check for potential pressure buildup</li>
            <li>Verify backup water supply is available if needed</li>
            <li>Monitor system for leaks after reopening</li>
          </ul>
        </div>
        <div className="safety-box alert">
          <p className="safety-title">🚨 Emergency Closure:</p>
          <p>
            In case of major leak or pipe burst, the valve will automatically close to prevent water
            damage.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ValveControl;
