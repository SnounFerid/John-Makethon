const express = require('express');
const router = express.Router();
const {
  getWebSocketStats,
  broadcastAlert,
  broadcastData,
} = require('../controllers/websocketController');

/**
 * WebSocket Routes
 * Endpoints for managing real-time connections
 */

// Get connection statistics
router.get('/stats', getWebSocketStats);

// Broadcast alert to all connected clients
router.post('/broadcast-alert', broadcastAlert);

// Broadcast custom data to all connected clients
router.post('/broadcast-data', broadcastData);

module.exports = router;
