import axios from 'axios';

// Create axios instance with base URL pointing to backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor with logging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`[API REQUEST] ${config.method.toUpperCase()} ${config.url}`, {
      data: config.data,
      params: config.params,
      timestamp: new Date().toISOString(),
    });
    return config;
  },
  (error) => {
    console.error('[API REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// Response interceptor with logging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[API RESPONSE] ${response.status} ${response.config.url}`, {
      data: response.data,
      timestamp: new Date().toISOString(),
    });
    return response;
  },
  (error) => {
    console.error('[API ERROR RESPONSE]', {
      status: error.response?.status,
      url: error.response?.config?.url,
      message: error.message,
      data: error.response?.data,
      timestamp: new Date().toISOString(),
    });
    return Promise.reject(error);
  }
);

// ===== SENSOR DATA ENDPOINTS =====
export const sensorAPI = {
  // Add new sensor reading
  addReading: (data) => {
    console.log('[SENSOR API] Adding new reading', data);
    return axiosInstance.post('/sensor-data', data);
  },

  // Get sensor data with filters
  getReadings: (filters = {}) => {
    console.log('[SENSOR API] Fetching readings with filters', filters);
    return axiosInstance.get('/sensor-data', { params: filters });
  },

  // Get specific reading
  getReadingById: (id) => {
    console.log('[SENSOR API] Fetching reading by ID', id);
    return axiosInstance.get(`/sensor-data/${id}`);
  },

  // Get sensor statistics
  getStats: () => {
    console.log('[SENSOR API] Fetching sensor statistics');
    return axiosInstance.get('/sensor-data/stats');
  },
};

// ===== ML MODEL ENDPOINTS =====
export const mlAPI = {
  // Train model
  trainModel: (data = {}) => {
    console.log('[ML API] Triggering model training', data);
    return axiosInstance.post('/train-model', data);
  },

  // Get training status
  getTrainingStatus: () => {
    console.log('[ML API] Fetching training status');
    return axiosInstance.get('/train-model/status');
  },

  // Get training history
  getTrainingHistory: () => {
    console.log('[ML API] Fetching training history');
    return axiosInstance.get('/train-model/history');
  },
};

// ===== LEAK DETECTION ENDPOINTS =====
export const leakDetectionAPI = {
  // Get leak detection status
  getStatus: () => {
    console.log('[LEAK DETECTION API] Fetching detection status');
    return axiosInstance.get('/leak-detection');
  },

  // Get leak predictions
  getPredictions: () => {
    console.log('[LEAK DETECTION API] Fetching predictions');
    return axiosInstance.get('/leak-detection/predictions');
  },

  // Control valve
  controlValve: (action) => {
    console.log('[LEAK DETECTION API] Controlling valve', { action });
    return axiosInstance.post('/valve-control', { action });
  },

  // Get valve status
  getValveStatus: () => {
    console.log('[LEAK DETECTION API] Fetching valve status');
    return axiosInstance.get('/valve-control/status');
  },

  // Get valve history
  getValveHistory: () => {
    console.log('[LEAK DETECTION API] Fetching valve history');
    return axiosInstance.get('/valve-control/history');
  },
};

// ===== INTEGRATED DETECTION ENDPOINTS =====
export const detectionAPI = {
  // Initialize detection engine
  initialize: () => {
    console.log('[DETECTION API] Initializing detection engine');
    return axiosInstance.post('/detection/initialize');
  },

  // Process single reading
  processReading: (data) => {
    console.log('[DETECTION API] Processing reading', data);
    return axiosInstance.post('/detection/process', data);
  },

  // Process batch readings
  batchProcess: (readings) => {
    console.log('[DETECTION API] Processing batch', { count: readings.length });
    return axiosInstance.post('/detection/batch-process', { readings });
  },

  // Get detection status
  getStatus: () => {
    console.log('[DETECTION API] Fetching detection status');
    return axiosInstance.get('/detection/status');
  },

  // Get recent detections
  getRecentDetections: (limit = 10) => {
    console.log('[DETECTION API] Fetching recent detections', { limit });
    return axiosInstance.get('/detection/recent', { params: { limit } });
  },

  // Get recent alerts
  getRecentAlerts: (limit = 10) => {
    console.log('[DETECTION API] Fetching recent alerts', { limit });
    return axiosInstance.get('/detection/alerts', { params: { limit } });
  },

  // Get detection patterns
  getPatterns: () => {
    console.log('[DETECTION API] Fetching detection patterns');
    return axiosInstance.get('/detection/patterns');
  },

  // Get comprehensive report
  getReport: () => {
    console.log('[DETECTION API] Fetching comprehensive report');
    return axiosInstance.get('/detection/report');
  },

  // Get system info
  getSystemInfo: () => {
    console.log('[DETECTION API] Fetching system info');
    return axiosInstance.get('/detection/system-info');
  },

  // Get maintenance report
  getMaintenanceReport: () => {
    console.log('[DETECTION API] Fetching maintenance report');
    return axiosInstance.get('/detection/maintenance-report');
  },

  // Reset detection engine
  reset: () => {
    console.log('[DETECTION API] Resetting detection engine');
    return axiosInstance.post('/detection/reset');
  },
};

// ===== UTILITY ENDPOINTS =====
export const utilAPI = {
  // Get API documentation
  getDocs: () => {
    console.log('[UTIL API] Fetching API documentation');
    return axiosInstance.get('/docs');
  },

  // Health check
  healthCheck: () => {
    console.log('[UTIL API] Health check');
    return axiosInstance.get('/health');
  },
};

export default axiosInstance;
