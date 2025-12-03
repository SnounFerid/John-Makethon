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
      console.log('[CONTEXT] Detection status:', response.data);
      setDetectionStatus(response.data);
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
      setRecentAlerts(response.data.alerts || []);
      setAlertHistory(response.data.alerts || []);
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
      setRecentDetections(response.data.detections || []);
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
      setValveStatus(response.data);
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
      setValveHistory(response.data.history || []);
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
      setPredictions(response.data);
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
      await fetchValveStatus();
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
