import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

// Real socket.io-backed WebSocket context
export const WebSocketContext = createContext(null);

export const WebSocketContextProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [latency, setLatency] = useState(0);
  const [latestSensorData, setLatestSensorData] = useState(null);
  const [lastReceivedAt, setLastReceivedAt] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [connectionMetrics, setConnectionMetrics] = useState({ messagesReceived: 0, messagesSent: 0, reconnectAttempts: 0 });

  const socketRef = useRef(null);

  // Determine server URL (align with API client default). Use backend API URL if provided,
  // else fall back to the same default used by the frontend API client (`http://localhost:3000/api`).
  const rawApi = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  const serverUrl = rawApi.replace(/\/api\/?$/, '');

  useEffect(() => {
    setConnectionStatus('connecting');

    const socket = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      setClientId(socket.id);
      setConnectionMetrics((m) => ({ ...m, reconnectAttempts: 0 }));
      // send small initialization payload
      socket.emit('client:initialize', { clientName: 'frontend', clientType: 'web' });
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setError(`Disconnected: ${reason}`);
    });

    socket.on('connect_error', (err) => {
      // Don't immediately mark as a fatal error; allow socket.io to handle reconnection.
      setError(err.message || 'Connection error');
      setConnectionStatus('reconnecting');
      setConnectionMetrics((m) => ({ ...m, reconnectAttempts: (m.reconnectAttempts || 0) + 1 }));
      console.warn('[WebSocket] connect_error, will attempt to reconnect:', err.message || err);
    });

    socket.on('sensor:update', (payload) => {
      const data = payload?.data || payload;
      setLatestSensorData(data);
      setLastReceivedAt(Date.now());
      setConnectionMetrics((m) => ({ ...m, messagesReceived: m.messagesReceived + 1 }));
    });

    socket.on('alert:new', (payload) => {
      const incoming = payload?.alert || payload;
      setAlerts((prev) => [incoming, ...prev].slice(0, 100));
      setConnectionMetrics((m) => ({ ...m, messagesReceived: m.messagesReceived + 1 }));
    });

    socket.on('server:pong', (data) => {
      if (data?.latency) setLatency(data.latency);
    });

    return () => {
      try { socket.disconnect(); } catch (e) { /* ignore */ }
      socketRef.current = null;
    };
  }, [serverUrl]);

  const send = useCallback((event, data) => {
    if (!socketRef.current) return;
    try {
      socketRef.current.emit(event, data);
      setConnectionMetrics((m) => ({ ...m, messagesSent: m.messagesSent + 1 }));
    } catch (e) {
      console.error('WebSocket send failed', e);
    }
  }, []);

  const getFormattedFreshness = useCallback(() => {
    if (!lastReceivedAt) return 'N/A';
    const ms = Date.now() - lastReceivedAt;
    return `${ms}ms`;
  }, [lastReceivedAt]);

  const getStatusColor = useCallback(() => {
    switch (connectionStatus) {
      case 'connected': return '#10b981';
      case 'connecting':
      case 'reconnecting': return '#f59e0b';
      case 'disconnected':
      case 'error': return '#ef4444';
      default: return '#9ca3af';
    }
  }, [connectionStatus]);

  const value = {
    isConnected,
    connectionStatus,
    error,
    clientId,
    latency,
    latestSensorData,
    alerts,
    dataFreshness: lastReceivedAt ? Date.now() - lastReceivedAt : 0,
    connectionMetrics,
    getFormattedFreshness,
    getStatusColor,
    connect: () => socketRef.current && socketRef.current.connect(),
    disconnect: () => socketRef.current && socketRef.current.disconnect(),
    send,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);

export default WebSocketContext;
