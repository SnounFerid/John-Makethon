import React, { useContext, useEffect } from 'react';
import { WebSocketContext } from '../context/WebSocketContext';
import { FiWifi, FiWifiOff, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import '../styles/ConnectionStatus.css';

const ConnectionStatus = () => {
  const {
    isConnected,
    connectionStatus,
    error,
    clientId,
    latency,
    latestSensorData,
    dataFreshness,
    connectionMetrics,
    getFormattedFreshness,
    getStatusColor,
    connect,
  } = useContext(WebSocketContext);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <FiWifi className="status-icon-connected" />;
      case 'connecting':
      case 'reconnecting':
        return <FiRefreshCw className="status-icon-connecting" />;
      case 'disconnected':
      case 'error':
        return <FiWifiOff className="status-icon-disconnected" />;
      default:
        return <FiAlertCircle />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return `Reconnecting... (Attempt ${connectionMetrics.reconnectAttempts})`;
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  const statusColor = getStatusColor();

  return (
    <div className="connection-status-bar">
      <div className="connection-status-container">
        {/* Left section: Status indicator */}
        <div className="status-left">
          <div className="status-indicator" style={{ borderColor: statusColor }}>
            <div className="status-icon-wrapper" style={{ color: statusColor }}>
              {getStatusIcon()}
            </div>
            <div className="status-pulse" style={{ backgroundColor: statusColor }}></div>
          </div>
          <div className="status-info">
            <p className="status-text" style={{ color: statusColor }}>
              {getStatusText()}
            </p>
            {clientId && (
              <p className="client-id">
                ID: {clientId.substring(0, 8)}...
              </p>
            )}
          </div>
        </div>

        {/* Center section: Data metrics */}
        {isConnected && latestSensorData && (
          <div className="status-center">
            <div className="metric-item">
              <span className="metric-label">Latency:</span>
              <span className="metric-value">{latency}ms</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Data:</span>
              <span className="metric-value">{getFormattedFreshness()}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">RX:</span>
              <span className="metric-value">{connectionMetrics.messagesReceived}</span>
            </div>
            {connectionMetrics.reconnectAttempts > 0 && (
              <div className="metric-item warning">
                <span className="metric-label">Reconnects:</span>
                <span className="metric-value">{connectionMetrics.reconnectAttempts}</span>
              </div>
            )}
          </div>
        )}

        {/* Right section: Actions */}
        <div className="status-right">
          {error && (
            <div className="error-message">
              <FiAlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {!isConnected && connectionStatus === 'disconnected' && (
            <button
              className="btn-reconnect"
              onClick={connect}
              title="Click to reconnect"
            >
              Reconnect
            </button>
          )}

          {connectionStatus === 'error' && (
            <button
              className="btn-reconnect btn-retry"
              onClick={connect}
              title="Click to retry connection"
            >
              Retry
            </button>
          )}

          {connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? (
            <div className="connecting-spinner"></div>
          ) : null}
        </div>
      </div>

      {/* Expandable details section */}
      <ConnectionDetails />
    </div>
  );
};

/**
 * Expandable details component
 */
const ConnectionDetails = () => {
  const {
    isConnected,
    clientId,
    latency,
    latestSensorData,
    lastDataUpdate,
    connectionMetrics,
    getFormattedFreshness,
  } = useContext(WebSocketContext);

  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!isConnected) return null;

  return (
    <div className={`connection-details ${isExpanded ? 'expanded' : ''}`}>
      <button
        className="details-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Hide details' : 'Show details'}
      >
        {isExpanded ? '▼ Details' : '▶ Details'}
      </button>

      {isExpanded && (
        <div className="details-content">
          <div className="detail-row">
            <span className="detail-label">Client ID:</span>
            <span className="detail-value">{clientId}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Latency:</span>
            <span className="detail-value">{latency}ms</span>
          </div>
          {lastDataUpdate && (
            <div className="detail-row">
              <span className="detail-label">Last Update:</span>
              <span className="detail-value">
                {lastDataUpdate.toLocaleTimeString()}
              </span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Data Freshness:</span>
            <span className="detail-value">{getFormattedFreshness()}</span>
          </div>
          {latestSensorData && (
            <>
              <div className="detail-row">
                <span className="detail-label">Pressure:</span>
                <span className="detail-value">{latestSensorData.pressure} PSI</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Flow:</span>
                <span className="detail-value">{latestSensorData.flow} GPM</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Temperature:</span>
                <span className="detail-value">{latestSensorData.temperature}°C</span>
              </div>
            </>
          )}
          <div className="detail-divider"></div>
          <div className="detail-row">
            <span className="detail-label">Messages Received:</span>
            <span className="detail-value">{connectionMetrics.messagesReceived}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Messages Sent:</span>
            <span className="detail-value">{connectionMetrics.messagesSent}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Reconnect Attempts:</span>
            <span className="detail-value">{connectionMetrics.reconnectAttempts}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
