import React, { createContext, useState, useCallback, useEffect } from 'react';
import { detectionAPI, leakDetectionAPI, sensorAPI } from '../services/apiClient';

export const DetectionContext = createContext();

export const DetectionContextProvider = ({ children }) => {
  // Dashboard state
  const [currentReading, setCurrentReading] = useState(null);
  const [detectionStatus, setDetectionStatus] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Alerts and detections
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);

  // Historical data
  const [historicalData, setHistoricalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  // Valve control
  const [valveStatus, setValveStatus] = useState(null);
  const [valveHistory, setValveHistory] = useState([]);

  // AI insights
  const [anomalyScores, setAnomalyScores] = useState([]);
  const [predictions, setPredictions] = useState(null);

  // Maintenance
  const [maintenanceReport, setMaintenanceReport] = useState(null);

  // Initialize detection system
  const initializeSystem = useCallback(async () => {
    try {
      console.log('[CONTEXT] Initializing detection system');
      setLoading(true);
      setError(null);
      const response = await detectionAPI.initialize();
      console.log('[CONTEXT] System initialized successfully', response.data);
      setSystemInfo(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error('[CONTEXT] Initialization failed:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch current detection status
  const fetchDetectionStatus = useCallback(async () => {
    try {
      console.log('[CONTEXT] Fetching detection status');
      const response = await detectionAPI.getStatus();
      console.log('[CONTEXT] Detection status (raw):', response.data);

      // Normalize the returned payload so components can rely on `leakProbability`
      const payload = response.data?.data || response.data || {};
      const systemStatus = payload.systemStatus || {};
      const patterns = payload.detectionPatterns || {};

      const leakProbability =
        typeof patterns.averageProbability === 'number'
          ? patterns.averageProbability
          : typeof systemStatus.averageProbability === 'number'
          ? systemStatus.averageProbability
          : 0;

      const normalized = {
        status: systemStatus.status || 'UNKNOWN',
        timestamp: systemStatus.timestamp || Date.now(),
        systems: systemStatus.systems || {},
        statistics: systemStatus.statistics || {},
        leakProbability: Math.round(leakProbability) || 0,
        recentAlertCount: payload.recentAlertCount || 0,
        systemHealth: payload.systemHealth || 'UNKNOWN'
      };

      setDetectionStatus(normalized);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error('[CONTEXT] Failed to fetch detection status:', errorMsg);
      setError(errorMsg);
    }
  }, []);

  

  // Fetch recent alerts
  const fetchRecentAlerts = useCallback(async (limit = 10) => {
    try {
      console.log('[CONTEXT] Fetching recent alerts', { limit });
      const response = await detectionAPI.getRecentAlerts(limit);
      console.log('[CONTEXT] Recent alerts fetched:', response.data);
      // Server returns { success: true, data: alerts, count }
      const raw = response.data.data || response.data || [];

      // Normalize probability for legacy consumers: set `leakProbability` numeric field
      const normalized = (raw || []).map(a => {
        const top = typeof a.probability === 'number' ? a.probability : (typeof a.leakProbability === 'number' ? a.leakProbability : null);
        if (top && top > 0) {
          return { ...a, leakProbability: Math.round(top) };
        }

        const det = a.detection?.overallProbability;
        if (typeof det === 'number' && det > 0) return { ...a, leakProbability: Math.round(det) };

        const methods = Array.isArray(a.detection?.detectionMethods) ? a.detection.detectionMethods : [];
        if (methods.length > 0) {
          const max = Math.max(...methods.map(m => (typeof m.probability === 'number' ? m.probability : 0)));
          return { ...a, leakProbability: Math.round(max || 0) };
        }

        return { ...a, leakProbability: 0 };
      });

      setRecentAlerts(normalized);
      setAlertHistory(normalized);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error('[CONTEXT] Failed to fetch recent alerts:', errorMsg);
    }
  }, []);

  // Fetch recent detections
  const fetchRecentDetections = useCallback(async (limit = 10) => {
    try {
      console.log('[CONTEXT] Fetching recent detections', { limit });
      const response = await detectionAPI.getRecentDetections(limit);
      console.log('[CONTEXT] Recent detections fetched:', response.data);
      // Server returns { success: true, data: detections, count }
      setRecentDetections(response.data.data || response.data || []);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error('[CONTEXT] Failed to fetch recent detections:', errorMsg);
    }
  }, []);

  // Fetch historical sensor data
  const fetchHistoricalData = useCallback(async (filters = {}) => {
    try {
      console.log('[CONTEXT] Fetching historical data', filters);
      const response = await sensorAPI.getReadings(filters);
      console.log('[CONTEXT] Historical data fetched:', response.data);
      setHistoricalData(response.data.data || []);
      setFilteredData(response.data.data || []);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error('[CONTEXT] Failed to fetch historical data:', errorMsg);
    }
  }, []);

  // Fetch valve status
  const fetchValveStatus = useCallback(async () => {
    try {
      console.log('[CONTEXT] Fetching valve status');
      const response = await leakDetectionAPI.getValveStatus();
      console.log('[CONTEXT] Valve status:', response.data);
      // Server returns { success: true, data: { currentState, lastUpdated, ... } }
      setValveStatus(response.data.data || response.data || null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error('[CONTEXT] Failed to fetch valve status:', errorMsg);
    }
  }, []);

  // Fetch valve history
  const fetchValveHistory = useCallback(async () => {
    try {
      console.log('[CONTEXT] Fetching valve history');
      const response = await leakDetectionAPI.getValveHistory();
      console.log('[CONTEXT] Valve history:', response.data);
      // Server returns { success: true, data: [ ... ] }
      setValveHistory(response.data.data || response.data || []);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error('[CONTEXT] Failed to fetch valve history:', errorMsg);
    }
  }, []);

  // Fetch leak predictions
  const fetchPredictions = useCallback(async () => {
    try {
      console.log('[CONTEXT] Fetching predictions');
      const response = await leakDetectionAPI.getPredictions();
      console.log('[CONTEXT] Predictions fetched:', response.data);
      // Server returns { success: true, data: predictions, modelVersion }
      setPredictions(response.data.data || response.data || null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error('[CONTEXT] Failed to fetch predictions:', errorMsg);
    }
  }, []);

  // Fetch maintenance report
  const fetchMaintenanceReport = useCallback(async () => {
    try {
      console.log('[CONTEXT] Fetching maintenance report');
      const response = await detectionAPI.getMaintenanceReport();
      console.log('[CONTEXT] Maintenance report:', response.data);
      setMaintenanceReport(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error('[CONTEXT] Failed to fetch maintenance report:', errorMsg);
    }
  }, []);

  // Process sensor reading
  const processSensorReading = useCallback(async (readingData) => {
    try {
      console.log('[CONTEXT] Processing sensor reading', readingData);
      const response = await detectionAPI.processReading(readingData);
      console.log('[CONTEXT] Reading processed successfully', response.data);
      setCurrentReading(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error('[CONTEXT] Failed to process reading:', errorMsg);
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Control valve
  const controlValve = useCallback(async (action) => {
    try {
      console.log('[CONTEXT] Controlling valve', { action });
      const response = await leakDetectionAPI.controlValve(action);
      console.log('[CONTEXT] Valve action successful', response.data);
      // Update valve status locally immediately for responsive UI
      try {
        const returned = response.data?.data || response.data || {};
        const newState = (returned.newState || returned.operation || '').toString().toUpperCase() || (action || '').toString().toUpperCase();
        const ts = returned.timestamp || Date.now();
        setValveStatus(prev => ({
          ...(prev || {}),
          currentState: newState,
          lastUpdated: ts,
          lastAction: returned.operation || newState
        }));
      } catch (err) {
        // ignore local update problems and fall back to fetching from server
        console.warn('[CONTEXT] Could not apply local valve status update, fetching from server', err.message || err);
        await fetchValveStatus();
      }
      // Also refresh authoritative state in background
      fetchValveStatus();
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.error('[CONTEXT] Failed to control valve:', errorMsg);
      setError(errorMsg);
      throw err;
    }
  }, [fetchValveStatus]);

  // Filter historical data by time range
  const filterDataByTimeRange = useCallback((startDate, endDate) => {
    console.log('[CONTEXT] Filtering data by time range', { startDate, endDate });
    const filtered = historicalData.filter((item) => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= startDate && itemDate <= endDate;
    });
    console.log('[CONTEXT] Filtered data count:', filtered.length);
    setFilteredData(filtered);
  }, [historicalData]);

  // Initialize on mount
  useEffect(() => {
    console.log('[CONTEXT] Provider mounted, initializing system');
    initializeSystem();
  }, [initializeSystem]);

  // Refresh key detection data when window/tab regains focus or becomes visible
  useEffect(() => {
    const onVisible = () => {
      console.log('[CONTEXT] Window visible/focused - refreshing detection data');
      try { fetchDetectionStatus(); } catch (e) { console.warn(e); }
      try { fetchRecentAlerts(); } catch (e) { console.warn(e); }
      try { fetchRecentDetections(50); } catch (e) { console.warn(e); }
      try { fetchPredictions(); } catch (e) { console.warn(e); }
      try { fetchValveStatus(); } catch (e) { console.warn(e); }
    };

    const handler = () => {
      if (!document.hidden) onVisible();
    };

    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', handler);

    return () => {
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', handler);
    };
  }, [fetchDetectionStatus, fetchRecentAlerts, fetchRecentDetections, fetchPredictions, fetchValveStatus]);

  const value = {
    // State
    currentReading,
    detectionStatus,
    systemInfo,
    loading,
    error,
    recentAlerts,
    recentDetections,
    alertHistory,
    historicalData,
    filteredData,
    valveStatus,
    valveHistory,
    anomalyScores,
    predictions,
    maintenanceReport,

    // Methods
    initializeSystem,
    fetchDetectionStatus,
    fetchRecentAlerts,
    fetchRecentDetections,
    fetchHistoricalData,
    fetchValveStatus,
    fetchValveHistory,
    fetchPredictions,
    fetchMaintenanceReport,
    processSensorReading,
    controlValve,
    filterDataByTimeRange,
  };

  return (
    <DetectionContext.Provider value={value}>
      {children}
    </DetectionContext.Provider>
  );
};

export default DetectionContext;
