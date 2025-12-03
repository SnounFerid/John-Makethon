const { asyncHandler } = require('../middleware/errorHandler');

/**
 * WebSocket Controller
 * Handles endpoints related to WebSocket connections and real-time data
 */

// Get WebSocket connection statistics
const getWebSocketStats = asyncHandler(async (req, res) => {
  console.log('[CONTROLLER] Getting WebSocket stats');
  
  const wsService = req.app.wsService;
  if (!wsService) {
    return res.status(503).json({
      error: 'WebSocket service not available',
    });
  }

  const stats = wsService.getStats();
  console.log('[CONTROLLER] WebSocket stats:', stats);

  res.json({
    status: 'success',
    data: stats,
    timestamp: new Date().toISOString(),
  });
});

// Broadcast alert through WebSocket
const broadcastAlert = asyncHandler(async (req, res) => {
  console.log('[CONTROLLER] Broadcasting alert via WebSocket', req.body);
  
  const wsService = req.app.wsService;
  if (!wsService) {
    return res.status(503).json({
      error: 'WebSocket service not available',
    });
  }

  const { alert } = req.body;
  if (!alert) {
    return res.status(400).json({
      error: 'Alert data required',
    });
  }

  wsService.broadcastAlert(alert);

  res.json({
    status: 'success',
    message: 'Alert broadcasted',
    timestamp: new Date().toISOString(),
  });
});

// Broadcast custom data to all clients
const broadcastData = asyncHandler(async (req, res) => {
  console.log('[CONTROLLER] Broadcasting data via WebSocket', req.body);
  
  const wsService = req.app.wsService;
  if (!wsService) {
    return res.status(503).json({
      error: 'WebSocket service not available',
    });
  }

  const { eventName, data } = req.body;
  if (!eventName || !data) {
    return res.status(400).json({
      error: 'Event name and data required',
    });
  }

  wsService.broadcastToAll(eventName, data);

  res.json({
    status: 'success',
    message: `Data broadcasted on event: ${eventName}`,
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  getWebSocketStats,
  broadcastAlert,
  broadcastData,
};
