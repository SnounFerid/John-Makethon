require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

// Import middleware (middleware lives at repository root)
const { requestLogger } = require('../middleware/logger');
const { errorHandler, asyncHandler } = require('../middleware/errorHandler');

// Import database initialization (db is at repository root)
require('../db/database');

// Import WebSocket service
const WebSocketService = require('./services/websocketService');

// Import routes (top-level `routes/` folder)
const sensorRoutes = require('../routes/sensorRoutes');
const mlRoutes = require('../routes/mlRoutes');
const leakDetectionRoutes = require('../routes/leakDetectionRoutes');
const integratedRoutes = require('../routes/integratedRoutes');
// `websocket` REST endpoints live under `src/routes/websocket.js`
const websocketRoutes = require('./routes/websocket');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * ===== MIDDLEWARE SETUP =====
 */

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 3600
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use(requestLogger);

/**
 * ===== ROUTES SETUP =====
 */

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Water Leak Detection System API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      sensorData: {
        post: 'POST /api/sensor-data - Add new sensor reading',
        get: 'GET /api/sensor-data - Retrieve historical data with filters',
        getById: 'GET /api/sensor-data/:id - Get specific sensor reading',
        getStats: 'GET /api/sensor-data/stats - Get sensor statistics'
      },
      modelTraining: {
        train: 'POST /api/train-model - Trigger AI model training',
        status: 'GET /api/train-model/status - Get training status',
        history: 'GET /api/train-model/history - Get training history'
      },
      leakDetection: {
        status: 'GET /api/leak-detection - Get current leak status and predictions',
        predictions: 'GET /api/leak-detection/predictions - Get leak predictions',
        valveControl: 'POST /api/valve-control - Control valve (open/close)',
        valveStatus: 'GET /api/valve-control/status - Get valve status',
        valveHistory: 'GET /api/valve-control/history - Get valve history'
      },
      integratedDetection: {
        initialize: 'POST /api/detection/initialize - Initialize detection engine',
        process: 'POST /api/detection/process - Process sensor reading',
        batchProcess: 'POST /api/detection/batch-process - Process multiple readings',
        status: 'GET /api/detection/status - Get detection system status',
        recent: 'GET /api/detection/recent - Get recent detections',
        alerts: 'GET /api/detection/alerts - Get recent alerts',
        patterns: 'GET /api/detection/patterns - Analyze detection patterns',
        report: 'GET /api/detection/report - Get comprehensive report',
        systemInfo: 'GET /api/detection/system-info - Get system information',
        maintenanceReport: 'GET /api/detection/maintenance-report - Get maintenance report',
        reset: 'POST /api/detection/reset - Reset detection engine'
      },
      webSocket: {
        stats: 'GET /api/websocket/stats - Get WebSocket connection statistics',
        broadcastAlert: 'POST /api/websocket/broadcast-alert - Broadcast alert to all clients',
        broadcastData: 'POST /api/websocket/broadcast-data - Broadcast custom data to all clients',
        connection: 'ws://localhost:PORT - WebSocket real-time connection endpoint'
      }
    }
  });
});

// Mount routes
app.use('/api/sensor-data', sensorRoutes);
app.use('/api/train-model', mlRoutes);
app.use('/api/leak-detection', leakDetectionRoutes);
app.use('/api/detection', integratedRoutes);
app.use('/api/websocket', websocketRoutes);

// Valve control endpoint (mounted separately) - controller at repo root `controllers/`
app.post('/api/valve-control', require('../controllers/leakDetectionController').controlValveEndpoint);

/**
 * ===== ERROR HANDLING =====
 */

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
      statusCode: 404,
      path: req.path,
      method: req.method,
      availableEndpoints: '/api/docs'
    }
  });
});

// Global error handler
app.use(errorHandler);

/**
 * ===== SERVER STARTUP =====
 */

// Create HTTP server for Socket.io compatibility
const server = http.createServer(app);

// Initialize WebSocket service
const wsService = new WebSocketService(server);

// Add WebSocket service to app for use in controllers
app.wsService = wsService;

// Handle listen errors (e.g. port already in use) with a friendly message
server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error('\nERROR: Port ' + PORT + ' is already in use.\n' +
      ' - Free the port or run the server with a different port, e.g. ' +
      '(PowerShell) $env:PORT=3001; npm run dev' + '\n' +
      '(Unix) PORT=3001 npm run dev'
    );
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   Water Leak Detection System API Server                   ║
║   Environment: ${process.env.NODE_ENV || 'development'.padEnd(48)}║
║   Port: ${PORT.toString().padEnd(55)}║
║   WebSocket: Enabled (Real-time data streaming)            ║
║   ═══════════════════════════════════════════════════════   ║
║   API Documentation: http://localhost:${PORT}/api/docs${' '.repeat(21 - PORT.toString().length)}║
║   Health Check: http://localhost:${PORT}/health${' '.repeat(29 - PORT.toString().length)}║
║   WebSocket Endpoint: ws://localhost:${PORT}${' '.repeat(37 - PORT.toString().length)}║
║════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown with WebSocket cleanup
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  wsService.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  wsService.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
