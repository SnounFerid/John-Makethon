const express = require('express');
const router = express.Router();
const {
  getLeakDetectionStatus,
  getLeakPredictions,
  controlValveEndpoint,
  getValveStatus,
  getValveHistory
} = require('../controllers/leakDetectionController');

/**
 * Leak Detection & Valve Control Routes
 * @route GET /api/leak-detection - Get leak detection status
 * @route GET /api/leak-detection/predictions - Get leak predictions
 * @route POST /api/valve-control - Control valve (open/close)
 * @route GET /api/valve-control/status - Get valve status
 * @route GET /api/valve-control/history - Get valve control history
 */

// Leak Detection
router.get('/', getLeakDetectionStatus);
router.get('/predictions', getLeakPredictions);

// Valve Control (mounted at /api/leak-detection, so paths map to /api/valve-control)
router.post('/valve-control', controlValveEndpoint);
router.get('/valve-control/status', getValveStatus);
router.get('/valve-control/history', getValveHistory);

module.exports = router;
