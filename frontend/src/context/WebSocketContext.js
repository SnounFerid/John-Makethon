import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Minimal WebSocket context implementation to satisfy frontend imports.
// This provides a placeholder provider; replace with socket.io-client logic when ready.
export const WebSocketContext = createContext({
  isConnected: false,
  connectionStatus: 'disconnected',
  error: null,
  clientId: null,
  latency: 0,
  latestSensorData: null,
  dataFreshness: 0,
  connectionMetrics: {
    messagesReceived: 0,
    messagesSent: 0,
    reconnectAttempts: 0,
  },
  getFormattedFreshness: () => 'N/A',
  getStatusColor: () => '#9ca3af',
  connect: () => {},
  send: () => {},
});

export const WebSocketContextProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [latency, setLatency] = useState(0);
  const [latestSensorData, setLatestSensorData] = useState(null);
  const [lastReceivedAt, setLastReceivedAt] = useState(null);
  const [connectionMetrics, setConnectionMetrics] = useState({
    messagesReceived: 0,
    messagesSent: 0,
    reconnectAttempts: 0,
  });

  // Placeholder: mark connected so UI components render during development
  useEffect(() => {
    // simulate quick connect
    setConnectionStatus('connecting');
    const t = setTimeout(() => {
      setIsConnected(true);
      setConnectionStatus('connected');
      setClientId(`dev-${Math.random().toString(36).slice(2, 9)}`);
    }, 200);
    return () => clearTimeout(t);
  }, []);

  const send = useCallback((msg) => {
    // no-op placeholder
    // console.log('[WebSocket] send', msg);
  }, []);

  const getFormattedFreshness = useCallback(() => {
    if (!lastReceivedAt) return 'N/A';
    const ms = Date.now() - lastReceivedAt;
    return `${ms}ms`;
  }, [lastReceivedAt]);

  const getStatusColor = useCallback(() => {
    switch (connectionStatus) {
      case 'connected':
        return '#10b981'; // green
      case 'connecting':
      case 'reconnecting':
        return '#f59e0b'; // amber
      case 'disconnected':
      case 'error':
        return '#ef4444'; // red
      default:
        return '#9ca3af'; // gray
    }
  }, [connectionStatus]);

  const connect = useCallback(() => {
    setConnectionStatus('connecting');
    // simulate reconnect behavior
    setTimeout(() => {
      setIsConnected(true);
      setConnectionStatus('connected');
      setConnectionMetrics((m) => ({ ...m, reconnectAttempts: 0 }));
    }, 300);
  }, []);

  // Expose context value
  const value = {
    isConnected,
    connectionStatus,
    error,
    clientId,
    latency,
    latestSensorData,
    dataFreshness: lastReceivedAt ? Date.now() - lastReceivedAt : 0,
    connectionMetrics,
    getFormattedFreshness,
    getStatusColor,
    connect,
    send,
    // helpers for tests/dev to simulate incoming data
    _simulateIncoming: (data) => {
      setLatestSensorData(data);
      setLastReceivedAt(Date.now());
      setConnectionMetrics((m) => ({ ...m, messagesReceived: m.messagesReceived + 1 }));
    },
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);

export default WebSocketContext;
